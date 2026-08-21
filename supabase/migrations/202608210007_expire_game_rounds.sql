create or replace function public.expire_game_round(target_room_code text)
returns boolean
security definer
language plpgsql
set search_path = ''
as $$
declare
  target_game public.games;
  player_ids uuid[];
  player_position integer;
  starter_position integer;
  target_relay_id uuid;
  fallback_content text;
begin
  select games.* into target_game
  from public.games
  join public.rooms on rooms.code = games.room_code
  where games.room_code = target_room_code and rooms.status = 'playing'
  for update of games;

  if target_game is null or target_game.deadline is null or target_game.deadline > now() then
    return false;
  end if;

  select array_agg(id order by joined_at) into player_ids
  from public.players where room_code = target_room_code;

  for player_position in 1..coalesce(array_length(player_ids, 1), 0) loop
    if not exists (
      select 1 from public.submissions
      where game_id = target_game.id
        and author_player_id = player_ids[player_position]
        and round = target_game.current_round
    ) then
      -- PostgreSQL의 음수 나머지를 한 번 더 보정해 1부터 시작하는 배열 위치로 바꾼다.
      starter_position := mod(mod((player_position - 1) - (target_game.current_round - 1), array_length(player_ids, 1)) + array_length(player_ids, 1), array_length(player_ids, 1)) + 1;
      select id into target_relay_id from public.relays
      where game_id = target_game.id and starter_player_id = player_ids[starter_position];
      fallback_content := case
        when target_game.phase = 'drawing' then 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAusB9Y9Z4OQAAAAASUVORK5CYII='
        else '시간 안에 문장을 작성하지 못했어요.'
      end;
      insert into public.submissions (game_id, room_code, relay_id, author_player_id, round, kind, content)
      values (target_game.id, target_room_code, target_relay_id, player_ids[player_position], target_game.current_round, case when target_game.phase = 'drawing' then 'drawing' else 'text' end, fallback_content);
    end if;
  end loop;
  return true;
end;
$$;

revoke all on function public.expire_game_round(text) from public, anon, authenticated;
grant execute on function public.expire_game_round(text) to service_role;
