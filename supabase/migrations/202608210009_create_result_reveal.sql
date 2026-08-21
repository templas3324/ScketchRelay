alter table public.games
  add column revealed_count smallint not null default 0 check (revealed_count between 0 and 8);

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
  configured_reveal_mode text;
begin
  select * into target_game from public.games where id = new.game_id for update;
  select count(*) into submitted_count from public.submissions where game_id = new.game_id and round = target_game.current_round;
  if submitted_count < target_game.total_rounds then return new; end if;

  if target_game.current_round >= target_game.total_rounds then
    select reveal_mode into configured_reveal_mode from public.rooms where code = target_game.room_code;
    update public.rooms set status = case when configured_reveal_mode = 'automatic' then 'finished' else 'revealing' end where code = target_game.room_code;
    update public.games set deadline = null, revealed_count = case when configured_reveal_mode = 'automatic' then total_rounds else 0 end where id = target_game.id;
  else
    select round_seconds into configured_seconds from public.rooms where code = target_game.room_code;
    update public.games set current_round = current_round + 1, phase = case when phase = 'writing' then 'drawing' else 'writing' end, deadline = now() + make_interval(secs => configured_seconds) where id = target_game.id;
  end if;
  return new;
end;
$$;

create or replace function public.reveal_next_relay(target_room_code text, actor_player_id uuid)
returns integer
security definer
language plpgsql
set search_path = ''
as $$
declare
  target_game public.games;
  target_room public.rooms;
  next_count integer;
begin
  select * into target_room from public.rooms where code = target_room_code for update;
  if target_room is null or target_room.host_player_id <> actor_player_id then raise exception 'HOST_ONLY'; end if;
  if target_room.status <> 'revealing' or target_room.reveal_mode <> 'host_controlled' then raise exception 'NOT_REVEALING'; end if;
  select * into target_game from public.games where room_code = target_room_code for update;
  next_count := least(target_game.revealed_count + 1, target_game.total_rounds);
  update public.games set revealed_count = next_count where id = target_game.id;
  if next_count >= target_game.total_rounds then update public.rooms set status = 'finished' where code = target_room_code; end if;
  return next_count;
end;
$$;

revoke all on function public.reveal_next_relay(text, uuid) from public, anon, authenticated;
grant execute on function public.reveal_next_relay(text, uuid) to service_role;
