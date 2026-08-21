alter table public.players
  add column last_seen_at timestamptz not null default now(),
  add column left_at timestamptz;

create or replace function public.heartbeat_player(target_room_code text, actor_player_id uuid)
returns uuid
security definer
language plpgsql
set search_path = ''
as $$
declare
  target_room public.rooms;
  next_host_id uuid;
begin
  update public.players set last_seen_at = now()
  where id = actor_player_id and room_code = target_room_code and left_at is null;
  if not found then raise exception 'PLAYER_NOT_ACTIVE'; end if;

  select * into target_room from public.rooms where code = target_room_code for update;
  if target_room.status in ('playing', 'revealing') and not exists (
    select 1 from public.players where id = target_room.host_player_id and left_at is null and last_seen_at >= now() - interval '30 seconds'
  ) then
    select id into next_host_id from public.players
    where room_code = target_room_code and left_at is null and last_seen_at >= now() - interval '30 seconds'
    order by joined_at limit 1;
    if next_host_id is not null then update public.rooms set host_player_id = next_host_id where code = target_room_code; end if;
  else
    next_host_id := target_room.host_player_id;
  end if;
  return coalesce(next_host_id, target_room.host_player_id);
end;
$$;

create or replace function public.fill_departed_player_turns(target_room_code text)
returns integer
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
  inserted_count integer := 0;
  fallback_content text;
begin
  select games.* into target_game from public.games join public.rooms on rooms.code = games.room_code
  where games.room_code = target_room_code and rooms.status = 'playing' for update of games;
  if target_game is null then return 0; end if;
  select array_agg(id order by joined_at) into player_ids from public.players where room_code = target_room_code;

  for player_position in 1..coalesce(array_length(player_ids, 1), 0) loop
    if exists (select 1 from public.players where id = player_ids[player_position] and left_at is not null)
      and not exists (select 1 from public.submissions where game_id = target_game.id and author_player_id = player_ids[player_position] and round = target_game.current_round) then
      starter_position := mod(mod((player_position - 1) - (target_game.current_round - 1), array_length(player_ids, 1)) + array_length(player_ids, 1), array_length(player_ids, 1)) + 1;
      select id into target_relay_id from public.relays where game_id = target_game.id and starter_player_id = player_ids[starter_position];
      fallback_content := case when target_game.phase = 'drawing' then 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAusB9Y9Z4OQAAAAASUVORK5CYII=' else '중도 이탈로 문장을 작성하지 못했어요.' end;
      insert into public.submissions (game_id, room_code, relay_id, author_player_id, round, kind, content)
      values (target_game.id, target_room_code, target_relay_id, player_ids[player_position], target_game.current_round, case when target_game.phase = 'drawing' then 'drawing' else 'text' end, fallback_content);
      inserted_count := inserted_count + 1;
    end if;
  end loop;
  return inserted_count;
end;
$$;

create or replace function public.mark_player_left(target_room_code text, actor_player_id uuid)
returns uuid
security definer
language plpgsql
set search_path = ''
as $$
declare
  target_room public.rooms;
  next_host_id uuid;
begin
  select * into target_room from public.rooms where code = target_room_code for update;
  update public.players set left_at = now() where id = actor_player_id and room_code = target_room_code and left_at is null;
  if not found then raise exception 'PLAYER_NOT_ACTIVE'; end if;
  if target_room.host_player_id = actor_player_id then
    select id into next_host_id from public.players where room_code = target_room_code and left_at is null order by joined_at limit 1;
    if next_host_id is not null then update public.rooms set host_player_id = next_host_id where code = target_room_code; end if;
  else
    next_host_id := target_room.host_player_id;
  end if;
  perform public.fill_departed_player_turns(target_room_code);
  return next_host_id;
end;
$$;

revoke all on function public.heartbeat_player(text, uuid), public.fill_departed_player_turns(text), public.mark_player_left(text, uuid) from public, anon, authenticated;
grant execute on function public.heartbeat_player(text, uuid), public.fill_departed_player_turns(text), public.mark_player_left(text, uuid) to service_role;
