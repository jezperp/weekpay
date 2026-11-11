-- Families: let several parents share the same children, chores, logs and payouts.
--
-- * A user belongs to exactly one family (unique user_id for now).
-- * children and chores belong to a family (family_id) instead of a single parent.
-- * chore_logs and payouts follow their child, so they are shared automatically.
-- * Clients can only READ families/family_members. Nobody can add or remove members from the app
--   (parents can't remove each other). Members are added by the owner in the dashboard (see
--   supabase/manual/add_partner.sql) or, later, by an invite function.
-- * parent_id is kept as "created by" (nullable, set null if that account is deleted) and is no longer
--   used by RLS. Deleting a parent's account therefore no longer deletes the family's data.
--
-- ROLLBACK (if something goes wrong), run in this order:
--   drop policy "Family members manage children" on public.children;
--   drop policy "Family members manage chores" on public.chores;
--   drop policy "Family members manage payouts" on public.payouts;
--   drop policy "Family members manage logs" on public.chore_logs;
--   create policy "Parents manage own children" on public.children for all to authenticated
--     using (parent_id = (select auth.uid())) with check (parent_id = (select auth.uid()));
--   create policy "Parents manage own chores" on public.chores for all to authenticated
--     using (parent_id = (select auth.uid())) with check (parent_id = (select auth.uid()));
--   (then re-create the payouts/chore_logs policies from 0001_init.sql)

-- ---------------------------------------------------------------------------
-- Tables
-- ---------------------------------------------------------------------------

create table public.families (
  id          uuid primary key default gen_random_uuid(),
  name        text,
  created_at  timestamptz not null default now()
);

create table public.family_members (
  family_id   uuid not null references public.families (id) on delete cascade,
  user_id     uuid not null references auth.users (id) on delete cascade,
  created_at  timestamptz not null default now(),
  primary key (family_id, user_id),
  unique (user_id) -- one family per user for now
);

alter table public.families        enable row level security;
alter table public.family_members  enable row level security;

-- ---------------------------------------------------------------------------
-- Helper: the current user's family. SECURITY DEFINER so it can read family_members
-- without going through RLS (which would otherwise make the policies recursive).
-- ---------------------------------------------------------------------------

create or replace function public.my_family_id()
returns uuid
language sql
stable
security definer
set search_path = public
as $$
  select family_id from public.family_members where user_id = auth.uid() limit 1
$$;

revoke execute on function public.my_family_id() from public, anon;
grant  execute on function public.my_family_id() to authenticated;

-- Read-only for clients.
create policy "Members read their family"
  on public.families for select to authenticated
  using (id = (select public.my_family_id()));

create policy "Members read their family's members"
  on public.family_members for select to authenticated
  using (family_id = (select public.my_family_id()));

grant select on public.families       to authenticated;
grant select on public.family_members to authenticated;

-- ---------------------------------------------------------------------------
-- Move existing data into families (one family per existing account)
-- ---------------------------------------------------------------------------

alter table public.children add column family_id uuid references public.families (id) on delete cascade;
alter table public.chores   add column family_id uuid references public.families (id) on delete cascade;

do $$
declare
  r   record;
  fam uuid;
begin
  for r in select id as uid from auth.users loop
    insert into public.families default values returning id into fam;
    insert into public.family_members (family_id, user_id) values (fam, r.uid);
    update public.children set family_id = fam where parent_id = r.uid;
    update public.chores   set family_id = fam where parent_id = r.uid;
  end loop;
end $$;

-- Fails (and rolls the whole migration back) if any row was left without a family.
alter table public.children alter column family_id set not null;
alter table public.chores   alter column family_id set not null;
alter table public.children alter column family_id set default public.my_family_id();
alter table public.chores   alter column family_id set default public.my_family_id();

create index children_family_id_idx on public.children (family_id);
create index chores_family_id_idx   on public.chores (family_id);

-- parent_id becomes "created by" and must not cascade-delete shared data.
alter table public.children alter column parent_id drop not null;
alter table public.chores   alter column parent_id drop not null;
alter table public.children drop constraint children_parent_id_fkey,
  add constraint children_parent_id_fkey foreign key (parent_id) references auth.users (id) on delete set null;
alter table public.chores   drop constraint chores_parent_id_fkey,
  add constraint chores_parent_id_fkey foreign key (parent_id) references auth.users (id) on delete set null;

-- ---------------------------------------------------------------------------
-- RLS: family instead of single parent
-- ---------------------------------------------------------------------------

drop policy "Parents manage own children"             on public.children;
drop policy "Parents manage own chores"               on public.chores;
drop policy "Parents manage payouts of own children"  on public.payouts;
drop policy "Parents manage logs of own children"     on public.chore_logs;

create policy "Family members manage children"
  on public.children for all to authenticated
  using      (family_id = (select public.my_family_id()))
  with check (family_id = (select public.my_family_id()));

create policy "Family members manage chores"
  on public.chores for all to authenticated
  using      (family_id = (select public.my_family_id()))
  with check (family_id = (select public.my_family_id()));

create policy "Family members manage payouts"
  on public.payouts for all to authenticated
  using (exists (
    select 1 from public.children c
    where c.id = payouts.child_id and c.family_id = (select public.my_family_id())
  ))
  with check (exists (
    select 1 from public.children c
    where c.id = payouts.child_id and c.family_id = (select public.my_family_id())
  ));

-- Logs: the child AND the chore must belong to the user's family;
-- a payout (if set) must belong to the same child.
create policy "Family members manage logs"
  on public.chore_logs for all to authenticated
  using (exists (
    select 1 from public.children c
    where c.id = chore_logs.child_id and c.family_id = (select public.my_family_id())
  ))
  with check (
    exists (
      select 1 from public.children c
      where c.id = chore_logs.child_id and c.family_id = (select public.my_family_id())
    )
    and exists (
      select 1 from public.chores ch
      where ch.id = chore_logs.chore_id and ch.family_id = (select public.my_family_id())
    )
    and (
      chore_logs.payout_id is null
      or exists (
        select 1 from public.payouts p
        where p.id = chore_logs.payout_id and p.child_id = chore_logs.child_id
      )
    )
  );
