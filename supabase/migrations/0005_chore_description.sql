-- Optional short description shown under the chore name.
-- Existing chores keep null (no description). Table grants and RLS already cover new columns.

alter table public.chores
  add column description text check (description is null or char_length(description) <= 200);
