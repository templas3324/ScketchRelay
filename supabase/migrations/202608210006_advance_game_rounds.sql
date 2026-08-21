create or replace function public.advance_game_after_submission()
returns trigger
security definer
language plpgsql
set search_path = ''
as $$
declare
  target_game public.games;
  submitted_count integer;
  configured_seconds integer;
begin
  select * into target_game from public.games where id = new.game_id for update;
  select count(*) into submitted_count from public.submissions
    where game_id = new.game_id and round = target_game.current_round;

  if submitted_count < target_game.total_rounds then
    return new;
  end if;

  if target_game.current_round >= target_game.total_rounds then
    update public.rooms set status = 'revealing' where code = target_game.room_code;
    update public.games set deadline = null where id = target_game.id;
  else
    select round_seconds into configured_seconds from public.rooms where code = target_game.room_code;
    update public.games
      set current_round = current_round + 1,
          phase = case when phase = 'writing' then 'drawing' else 'writing' end,
          deadline = now() + make_interval(secs => configured_seconds)
      where id = target_game.id;
  end if;
  return new;
end;
$$;

create trigger submissions_advance_game
after insert on public.submissions
for each row execute function public.advance_game_after_submission();
