-- Adds a second parent to your family (run manually in the Supabase SQL Editor).
--
-- 1. Create the account first: Dashboard -> Authentication -> Users -> Add user
--    (tick "Auto Confirm User" and set a password).
-- 2. Replace BOTH placeholders below with the real e-mail addresses. Do NOT commit real addresses
--    (this repo is public) - edit it in the editor only.
-- 3. Run it. The result should say "INSERT 0 1". "INSERT 0 0" means one of the addresses wasn't found.

insert into public.family_members (family_id, user_id)
select fm.family_id, partner.id
from public.family_members fm
join auth.users me on me.id = fm.user_id and me.email = '<your-email>'
cross join (select id from auth.users where email = '<partner-email>') partner;
