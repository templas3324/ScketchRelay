alter table public.submissions
  add constraint submissions_content_size_check check (octet_length(content) <= 1100000),
  add constraint submissions_content_kind_check check (
    (kind = 'text' and char_length(trim(content)) between 1 and 120)
    or
    (kind = 'drawing' and content like 'data:image/png;base64,iVBORw0KGgo%')
  );
