-- WeekPay initial schema
-- Run in the Supabase dashboard: SQL Editor -> paste -> Run.
-- Security relies entirely on RLS: a parent only ever sees their own rows.

-- ---------------------------------------------------------------------------
-- Tables
-- ---------------------------------------------------------------------------

create table public.children (
  id          uuid primary key default gen_random_uuid(),
  parent_id   uuid not null default auth.uid() references auth.users (id) on delete cascade,
  name        text not null check (char_length(name) between 1 and 50),
  color       text,
  avatar      text,
  created_at  timestamptz not null default now()
);

create table public.chores (
  id          uuid primary key default gen_random_uuid(),
  parent_id   uuid not null default auth.uid() references auth.users (id) on delete cascade,
  name        text not null check (char_length(name) between 1 and 80),
  price       numeric(10, 2) not null check (price >= 0),
  icon        text,                       -- Lucide icon name
  color       text,
  archived    boolean not null default false,  -- archive instead of delete to keep history
  created_at  timestamptz not null default now()
);

create table public.payouts (
  id            uuid primary key default gen_random_uuid(),
  child_id      uuid not null references public.children (id) on delete cascade,
  amount        numeric(10, 2) not null,  -- snapshot of the paid-out sum
  period_start  date,
  period_end    date,
  paid_at       timestamptz not null default now()
);

create table public.chore_logs (
  id          uuid primary key default gen_random_uuid(),
  child_id    uuid not null references public.children (id) on delete cascade,
  chore_id    uuid not null references public.chores (id) on delete restrict,
  amount      numeric(10, 2) not null,    -- snapshot of chore price when logged
  delta       smallint not null check (delta in (-1, 1)),
  created_at  timestamptz not null default now(),
  payout_id   uuid references public.payouts (id) on delete set null
);

-- Balance for a child = sum(amount * delta) over logs where payout_id is null.

create index chores_parent_id_idx     on public.chores (parent_id);
create index children_parent_id_idx   on public.children (parent_id);
create index chore_logs_child_id_idx  on public.chore_logs (child_id);
create index chore_logs_payout_id_idx on public.chore_logs (payout_id);
create index payouts_child_id_idx     on public.payouts (child_id);

-- ---------------------------------------------------------------------------
-- Row Level Security
-- ---------------------------------------------------------------------------

alter table public.children   enable row level security;
alter table public.chores     enable row level security;
alter table public.payouts    enable row level security;
alter table public.chore_logs enable row level security;

create policy "Parents manage own children"
  on public.children for all to authenticated
  using      (parent_id = (select auth.uid()))
  with check (parent_id = (select auth.uid()));

create policy "Parents manage own chores"
  on public.chores for all to authenticated
  using      (parent_id = (select auth.uid()))
  with check (parent_id = (select auth.uid()));

create policy "Parents manage payouts of own children"
  on public.payouts for all to authenticated
  using (exists (
    select 1 from public.children c
    where c.id = payouts.child_id and c.parent_id = (select auth.uid())
  ))
  with check (exists (
    select 1 from public.children c
    where c.id = payouts.child_id and c.parent_id = (select auth.uid())
  ));

-- Logs: both the child AND the chore must belong to the current parent.
-- Payout (if set) must belong to the same child.
create policy "Parents manage logs of own children"
  on public.chore_logs for all to authenticated
  using (exists (
    select 1 from public.children c
    where c.id = chore_logs.child_id and c.parent_id = (select auth.uid())
  ))
  with check (
    exists (
      select 1 from public.children c
      where c.id = chore_logs.child_id and c.parent_id = (select auth.uid())
    )
    and exists (
      select 1 from public.chores ch
      where ch.id = chore_logs.chore_id and ch.parent_id = (select auth.uid())
    )
    and (
      chore_logs.payout_id is null
      or exists (
        select 1 from public.payouts p
        where p.id = chore_logs.payout_id and p.child_id = chore_logs.child_id
      )
    )
  );
