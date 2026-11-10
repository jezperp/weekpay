-- Atomic payout: creates a payouts row (amount = snapshot of the unpaid balance)
-- and attaches every unpaid log of the child to it, so the balance goes back to zero.
-- SECURITY INVOKER: runs with the caller's rights, so RLS still applies
-- (a parent can only pay out their own children).

create or replace function public.pay_out(p_child_id uuid)
returns uuid
language plpgsql
security invoker
set search_path = public
as $$
declare
  v_amount  numeric(10, 2);
  v_start   timestamptz;
  v_payout  uuid;
begin
  -- Serialize concurrent payouts for the same child (e.g. double tap on two devices).
  perform 1 from public.children where id = p_child_id for update;

  select coalesce(sum(amount * delta), 0), min(created_at)
    into v_amount, v_start
    from public.chore_logs
   where child_id = p_child_id and payout_id is null;

  if v_start is null or v_amount <= 0 then
    raise exception 'Nothing to pay out';
  end if;

  insert into public.payouts (child_id, amount, period_start, period_end)
  values (p_child_id, v_amount, v_start::date, now()::date)
  returning id into v_payout;

  update public.chore_logs
     set payout_id = v_payout
   where child_id = p_child_id and payout_id is null;

  return v_payout;
end;
$$;

-- Functions are executable by PUBLIC by default; only signed-in users should call this.
revoke execute on function public.pay_out(uuid) from public, anon;
grant  execute on function public.pay_out(uuid) to authenticated;
