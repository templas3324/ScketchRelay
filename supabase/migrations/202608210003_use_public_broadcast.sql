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
