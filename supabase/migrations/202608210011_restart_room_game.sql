create or replace function public.restart_room_game(target_room_code text, actor_player_id uuid)
returns integer
security definer
language plpgsql
set search_path = ''
as $$
declare
  target_room public.rooms;
  active_count integer;
begin
  select * into target_room from public.rooms where code = target_room_code for update;
  if target_room is null or target_room.host_player_id <> actor_player_id then raise exception 'HOST_ONLY'; end if;
  if target_room.status <> 'finished' then raise exception 'GAME_NOT_FINISHED'; end if;
  select count(*) into active_count from public.players where room_code = target_room_code and left_at is null;
  if active_count < 2 then raise exception 'NOT_ENOUGH_PLAYERS'; end if;

  -- 이전 결과의 FK가 플레이어 삭제를 막으므로 게임을 먼저 지운 뒤 이탈 멤버를 정리한다.
  delete from public.games where room_code = target_room_code;
  delete from public.chat_messages where room_code = target_room_code;
  delete from public.players where room_code = target_room_code and left_at is not null;
  update public.players set last_seen_at = now() where room_code = target_room_code;
  update public.rooms set status = 'waiting' where code = target_room_code;
  return active_count;
end;
$$;

revoke all on function public.restart_room_game(text, uuid) from public, anon, authenticated;
grant execute on function public.restart_room_game(text, uuid) to service_role;
