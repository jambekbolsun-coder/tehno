-- Hard manager deletion, bulk notification reads, and isolated 5% online-sale traffic fees.

-- Preserve financial history when a manager account is removed from Auth.
alter table public.manager_commissions
  add column if not exists manager_name_snapshot text;

update public.manager_commissions mc
set manager_name_snapshot = coalesce(nullif(trim(p.full_name), ''), 'Менеджер')
from public.profiles p
where p.id = mc.manager_id
  and mc.manager_name_snapshot is null;

update public.manager_commissions
set manager_name_snapshot = 'Менеджер'
where manager_name_snapshot is null;

alter table public.manager_commissions
  alter column manager_name_snapshot set not null,
  alter column manager_id drop not null;

alter table public.manager_commissions
  drop constraint if exists manager_commissions_manager_id_fkey;
alter table public.manager_commissions
  add constraint manager_commissions_manager_id_fkey
  foreign key (manager_id) references public.profiles(id) on delete set null;

alter table public.manager_payouts
  add column if not exists manager_name_snapshot text;

update public.manager_payouts mp
set manager_name_snapshot = coalesce(nullif(trim(p.full_name), ''), 'Менеджер')
from public.profiles p
where p.id = mp.manager_id
  and mp.manager_name_snapshot is null;

update public.manager_payouts
set manager_name_snapshot = 'Менеджер'
where manager_name_snapshot is null;

alter table public.manager_payouts
  alter column manager_name_snapshot set not null,
  alter column manager_id drop not null;

alter table public.manager_payouts
  drop constraint if exists manager_payouts_manager_id_fkey;
alter table public.manager_payouts
  add constraint manager_payouts_manager_id_fkey
  foreign key (manager_id) references public.profiles(id) on delete set null;

alter table public.ai_import_logs
  alter column created_by drop not null;
alter table public.ai_import_logs
  drop constraint if exists ai_import_logs_created_by_fkey;
alter table public.ai_import_logs
  add constraint ai_import_logs_created_by_fkey
  foreign key (created_by) references public.profiles(id) on delete set null;

create or replace function public.snapshot_manager_name()
returns trigger
language plpgsql
security definer
set search_path to 'public'
as $function$
begin
  if new.manager_id is not null then
    select coalesce(nullif(trim(full_name), ''), 'Менеджер')
    into new.manager_name_snapshot
    from public.profiles
    where id = new.manager_id;
  end if;
  new.manager_name_snapshot := coalesce(nullif(trim(new.manager_name_snapshot), ''), 'Менеджер');
  return new;
end;
$function$;

revoke all on function public.snapshot_manager_name() from public, anon, authenticated;

drop trigger if exists manager_commissions_snapshot_name on public.manager_commissions;
create trigger manager_commissions_snapshot_name
before insert or update of manager_id on public.manager_commissions
for each row execute function public.snapshot_manager_name();

drop trigger if exists manager_payouts_snapshot_name on public.manager_payouts;
create trigger manager_payouts_snapshot_name
before insert or update of manager_id on public.manager_payouts
for each row execute function public.snapshot_manager_name();

create or replace function public.reassign_manager_work_before_delete()
returns trigger
language plpgsql
security definer
set search_path to 'public'
as $function$
declare
  v_replacement uuid;
begin
  if old.role <> 'manager' then return old; end if;

  select p.id
  into v_replacement
  from public.profiles p
  join public.manager_profiles mp on mp.user_id = p.id
  where p.role = 'manager'
    and p.is_active = true
    and mp.accepts_leads = true
    and p.id <> old.id
  order by mp.last_assigned_at nulls first, mp.leads_assigned, p.created_at
  limit 1;

  update public.customers
  set manager_id = v_replacement, updated_at = now()
  where manager_id = old.id;

  update public.leads
  set assigned_manager_id = v_replacement, updated_at = now()
  where assigned_manager_id = old.id
    and status not in ('won', 'lost', 'cancelled');

  update public.orders
  set assigned_manager_id = v_replacement, updated_at = now()
  where assigned_manager_id = old.id
    and status not in ('paid', 'completed', 'rejected', 'cancelled');

  update public.manager_join_tokens
  set revoked_at = now()
  where user_id = old.id and revoked_at is null;

  return old;
end;
$function$;

revoke all on function public.reassign_manager_work_before_delete() from public, anon, authenticated;

drop trigger if exists profiles_reassign_manager_work_before_delete on public.profiles;
create trigger profiles_reassign_manager_work_before_delete
before delete on public.profiles
for each row execute function public.reassign_manager_work_before_delete();

-- One action marks everything visible to the current staff member as read.
create or replace function public.mark_all_notifications_read()
returns integer
language plpgsql
security definer
set search_path to 'public'
as $function$
declare
  v_count integer := 0;
begin
  if auth.uid() is null or not public.is_active_staff() then
    raise exception 'Нет доступа';
  end if;

  if public.is_admin() then
    update public.notifications
    set is_read = true, read_at = now()
    where is_read = false;
  else
    update public.notifications
    set is_read = true, read_at = now()
    where is_read = false and target_user_id = auth.uid();
  end if;

  get diagnostics v_count = row_count;
  return v_count;
end;
$function$;

revoke all on function public.mark_all_notifications_read() from public, anon;
grant execute on function public.mark_all_notifications_read() to authenticated;

-- Traffic System is a separate accrual ledger: exactly 5% of recognized online sales.
alter table public.expenses
  drop constraint if exists expenses_category_check;
alter table public.expenses
  add constraint expenses_category_check check (category in (
    'rent', 'target', 'advertising', 'delivery', 'salary', 'household',
    'small', 'equipment', 'repair', 'tax', 'traffic_fee', 'other'
  ));

create table if not exists public.traffic_fees (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null unique references public.orders(id) on delete restrict,
  rate_basis_points integer not null default 500 check (rate_basis_points = 500),
  sale_total_tyiyn bigint not null check (sale_total_tyiyn > 0),
  fee_amount_tyiyn bigint not null check (fee_amount_tyiyn > 0),
  accrued_at timestamptz not null default now(),
  settled_at timestamptz,
  settled_by uuid references public.profiles(id) on delete set null,
  settlement_batch_id uuid,
  settlement_expense_id uuid references public.expenses(id) on delete restrict,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint traffic_fees_settlement_consistency check (
    (settled_at is null and settled_by is null and settlement_batch_id is null and settlement_expense_id is null)
    or
    (settled_at is not null and settlement_batch_id is not null and settlement_expense_id is not null)
  )
);

alter table public.traffic_fees enable row level security;
revoke all on table public.traffic_fees from public, anon, authenticated;
grant select on table public.traffic_fees to authenticated;
grant all on table public.traffic_fees to service_role;

drop policy if exists traffic_fees_admin_read on public.traffic_fees;
create policy traffic_fees_admin_read
on public.traffic_fees
for select
to authenticated
using (public.is_admin());

create index if not exists traffic_fees_unsettled_idx
on public.traffic_fees(accrued_at)
where settled_at is null;

drop trigger if exists traffic_fees_updated_at on public.traffic_fees;
create trigger traffic_fees_updated_at
before update on public.traffic_fees
for each row execute function public.set_updated_at();

create or replace function public.accrue_online_traffic_fee()
returns trigger
language plpgsql
security definer
set search_path to 'public'
as $function$
begin
  if new.sale_channel = 'online'
     and new.financial_processed = true
     and new.total_tyiyn > 0 then
    insert into public.traffic_fees(
      order_id, rate_basis_points, sale_total_tyiyn, fee_amount_tyiyn, accrued_at
    ) values (
      new.id,
      500,
      new.total_tyiyn,
      round(new.total_tyiyn * 500 / 10000.0)::bigint,
      coalesce(new.completed_at, now())
    )
    on conflict (order_id) do nothing;
  end if;
  return new;
end;
$function$;

revoke all on function public.accrue_online_traffic_fee() from public, anon, authenticated;

drop trigger if exists orders_accrue_online_traffic_fee on public.orders;
create trigger orders_accrue_online_traffic_fee
after insert or update of financial_processed, sale_channel, total_tyiyn on public.orders
for each row execute function public.accrue_online_traffic_fee();

insert into public.traffic_fees(
  order_id, rate_basis_points, sale_total_tyiyn, fee_amount_tyiyn, accrued_at
)
select
  id,
  500,
  total_tyiyn,
  round(total_tyiyn * 500 / 10000.0)::bigint,
  coalesce(completed_at, updated_at, created_at)
from public.orders
where sale_channel = 'online'
  and financial_processed = true
  and total_tyiyn > 0
on conflict (order_id) do nothing;

create or replace function public.settle_traffic_fees(p_note text default null)
returns jsonb
language plpgsql
security definer
set search_path to 'public'
as $function$
declare
  v_actor uuid := auth.uid();
  v_batch_id uuid := gen_random_uuid();
  v_amount bigint := 0;
  v_count integer := 0;
  v_expense_id uuid;
  v_expense_number bigint;
begin
  if v_actor is null or not public.is_admin() then
    raise exception 'Только управляющий может выполнить расчёт';
  end if;

  perform id
  from public.traffic_fees
  where settled_at is null
  order by accrued_at, id
  for update;

  select coalesce(sum(fee_amount_tyiyn), 0), count(*)::integer
  into v_amount, v_count
  from public.traffic_fees
  where settled_at is null;

  if v_count = 0 or v_amount <= 0 then
    return jsonb_build_object('ok', true, 'amount_tyiyn', 0, 'sales_count', 0);
  end if;

  insert into public.expenses(
    category,
    amount_tyiyn,
    expense_date,
    description,
    recipient,
    payment_method,
    created_by
  ) values (
    'traffic_fee',
    v_amount,
    current_date,
    'Расчёт Трафик системы: 5% с ' || v_count::text || ' онлайн-продаж' ||
      case when nullif(trim(coalesce(p_note, '')), '') is null then '' else '. ' || trim(p_note) end,
    'Трафик система',
    'transfer',
    v_actor
  )
  returning id, expense_number into v_expense_id, v_expense_number;

  update public.traffic_fees
  set settled_at = now(),
      settled_by = v_actor,
      settlement_batch_id = v_batch_id,
      settlement_expense_id = v_expense_id
  where settled_at is null;

  insert into public.audit_logs(actor_id, table_name, record_id, action, metadata)
  values (
    v_actor,
    'traffic_fees',
    v_batch_id::text,
    'RPC',
    jsonb_build_object(
      'function', 'settle_traffic_fees',
      'sales_count', v_count,
      'amount_tyiyn', v_amount,
      'expense_id', v_expense_id,
      'expense_number', v_expense_number
    )
  );

  return jsonb_build_object(
    'ok', true,
    'amount_tyiyn', v_amount,
    'sales_count', v_count,
    'expense_id', v_expense_id,
    'expense_number', v_expense_number,
    'batch_id', v_batch_id
  );
end;
$function$;

revoke all on function public.settle_traffic_fees(text) from public, anon;
grant execute on function public.settle_traffic_fees(text) to authenticated;
