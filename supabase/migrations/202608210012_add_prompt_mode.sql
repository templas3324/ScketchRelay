alter table public.rooms
  add column prompt_mode text not null default 'free'
  check (prompt_mode in ('free', 'random'));

alter table public.relays
  add column initial_prompt text
  check (initial_prompt is null or char_length(initial_prompt) between 1 and 120);
