alter table public.rooms
  add column reveal_mode text not null default 'host_controlled'
  check (reveal_mode in ('host_controlled', 'automatic'));

create table public.games (
  id uuid primary key default gen_random_uuid(),
  room_code text not null unique references public.rooms(code) on delete cascade,
  phase text not null default 'writing' check (phase in ('writing', 'drawing')),
  current_round smallint not null default 1 check (current_round > 0),
  total_rounds smallint not null check (total_rounds between 2 and 8),
  deadline timestamptz,
  created_at timestamptz not null default now()
);

create table public.relays (
  id uuid primary key default gen_random_uuid(),
  game_id uuid not null references public.games(id) on delete cascade,
  room_code text not null references public.rooms(code) on delete cascade,
  starter_player_id uuid not null references public.players(id),
  unique (game_id, starter_player_id)
);

create table public.submissions (
  id uuid primary key default gen_random_uuid(),
  game_id uuid not null references public.games(id) on delete cascade,
  room_code text not null references public.rooms(code) on delete cascade,
  relay_id uuid not null references public.relays(id) on delete cascade,
  author_player_id uuid not null references public.players(id),
  round smallint not null check (round > 0),
  kind text not null check (kind in ('text', 'drawing')),
  content text not null,
  created_at timestamptz not null default now(),
  unique (game_id, author_player_id, round)
);

create index submissions_game_round_idx on public.submissions (game_id, round);

create trigger games_broadcast_change after insert or update or delete on public.games
for each row execute function public.broadcast_room_change();
create trigger submissions_broadcast_change after insert or update or delete on public.submissions
for each row execute function public.broadcast_room_change();

alter table public.games enable row level security;
alter table public.relays enable row level security;
alter table public.submissions enable row level security;
revoke all on public.games, public.relays, public.submissions from anon, authenticated;
