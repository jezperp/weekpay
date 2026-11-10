-- Newer Supabase projects do not auto-grant table privileges to API roles.
-- Without these grants, requests fail with 42501 "permission denied" before RLS is even evaluated.
-- Only `authenticated` gets access; `anon` gets nothing. RLS policies still restrict rows per parent.

grant select, insert, update, delete on public.children   to authenticated;
grant select, insert, update, delete on public.chores     to authenticated;
grant select, insert, update, delete on public.payouts    to authenticated;
grant select, insert, update, delete on public.chore_logs to authenticated;
