-- Explicitly deny direct Data API access to manager QR invite tokens and index their auth FKs.

drop policy if exists manager_join_tokens_deny_clients on public.manager_join_tokens;
create policy manager_join_tokens_deny_clients
on public.manager_join_tokens
for all
to anon, authenticated
using (false)
with check (false);

create index if not exists manager_join_tokens_user_id_idx
  on public.manager_join_tokens(user_id);

create index if not exists manager_join_tokens_created_by_idx
  on public.manager_join_tokens(created_by);
