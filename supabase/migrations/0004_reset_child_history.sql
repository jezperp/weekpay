-- Deletes a child's entire history: all chore logs and all payouts.
-- Chores (they belong to the parent account) and the child profile are kept.
-- SECURITY INVOKER: runs with the caller's rights, so RLS still applies
-- (a parent can only reset their own children).

create or replace function public.reset_child_history(p_child_id uuid)
returns void
language plpgsql
security invoker
set search_path = public
as $$
begin
  -- Fails (and changes nothing) if the child doesn't exist or isn't the caller's.
  perform 1 from public.children where id = p_child_id for update;
  if not found then
    raise exception 'Child not found';
  end if;

  delete from public.chore_logs where child_id = p_child_id;
  delete from public.payouts    where child_id = p_child_id;
end;
$$;

revoke execute on function public.reset_child_history(uuid) from public, anon;
grant  execute on function public.reset_child_history(uuid) to authenticated;
