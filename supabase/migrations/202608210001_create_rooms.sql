create extension if not exists pgcrypto;

create table public.rooms (
  code text primary key check (code ~ '^[A-Z0-9]{5}$'),
  status text not null default 'waiting' check (status in ('waiting', 'playing', 'revealing', 'finished')),
  host_player_id uuid not null,
  max_players smallint not null default 8 check (max_players between 2 and 8),
  round_seconds smallint not null default 90 check (round_seconds between 30 and 300),
  created_at timestamptz not null default now()
);

create table public.players (
  id uuid primary key,
  room_code text not null references public.rooms(code) on delete cascade,
  nickname text not null check (char_length(trim(nickname)) between 1 and 12),
  session_token_hash text not null,
  joined_at timestamptz not null default now()
);

create unique index players_room_nickname_unique
  on public.players (room_code, lower(trim(nickname)));

create index players_room_joined_at_idx
  on public.players (room_code, joined_at);

create or replace function public.enforce_room_join_rules()
returns trigger
language plpgsql
set search_path = ''
as $$
declare
  target_room public.rooms;
  player_count integer;
begin
  select * into target_room
  from public.rooms
  where code = new.room_code
  for update;

  if target_room.status <> 'waiting' then
    raise exception 'ROOM_ALREADY_STARTED';
  end if;

  select count(*) into player_count
  from public.players
  where room_code = new.room_code;

  if player_count >= target_room.max_players then
    raise exception 'ROOM_FULL';
  end if;

  return new;
end;
$$;

create trigger players_enforce_room_join_rules
before insert on public.players
for each row execute function public.enforce_room_join_rules();

create or replace function public.broadcast_room_change()
returns trigger
security definer
language plpgsql
set search_path = ''
as $$
declare
  target_code text;
begin
  if tg_table_name = 'rooms' then
    target_code := coalesce(new.code, old.code);
  else
    target_code := coalesce(new.room_code, old.room_code);
  end if;
  perform realtime.send(
    jsonb_build_object('table', tg_table_name, 'operation', tg_op),
    tg_op,
    'room:' || target_code,
    false
  );
  return coalesce(new, old);
end;
$$;

create trigger rooms_broadcast_change
after insert or update or delete on public.rooms
for each row execute function public.broadcast_room_change();

create trigger players_broadcast_change
after insert or update or delete on public.players
for each row execute function public.broadcast_room_change();

alter table public.rooms enable row level security;
alter table public.players enable row level security;

revoke all on public.rooms from anon, authenticated;
revoke all on public.players from anon, authenticated;
