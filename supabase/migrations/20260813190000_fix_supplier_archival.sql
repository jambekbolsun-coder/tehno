-- Hiding a supplier from CRM is a soft delete. Existing supplier-product links
-- must remain active so sales made after archival retain purchase cost and debt.
create or replace function public.archive_supplier(
  p_supplier_id uuid,
  p_reason text default null
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.is_admin() then
    raise exception 'Нет доступа';
  end if;

  update public.suppliers
  set
    is_active = false,
    archived_at = now(),
    notes = concat_ws(E'\n', notes, nullif(trim(p_reason), ''))
  where id = p_supplier_id
    and is_active = true;

  if not found then
    raise exception 'Активный поставщик не найден';
  end if;

  insert into public.audit_logs(actor_id, table_name, record_id, action, metadata)
  values (
    auth.uid(),
    'suppliers',
    p_supplier_id::text,
    'RPC',
    jsonb_build_object(
      'function', 'archive_supplier',
      'operation', 'soft_delete',
      'reason', p_reason
    )
  );
end;
$$;

revoke all on function public.archive_supplier(uuid,text) from public;
revoke execute on function public.archive_supplier(uuid,text) from anon;
grant execute on function public.archive_supplier(uuid,text) to authenticated, service_role;

-- Direct RPC calls must not turn an old, archived delivery into a new product.
-- The trigger runs in the same transaction as product creation, so a rejection
-- also rolls back the partially inserted product and its supplier link.
create or replace function public.ensure_delivery_supplier_active()
returns trigger
language plpgsql
security invoker
set search_path = public
as $$
begin
  if new.product_id is not null
    and new.product_id is distinct from old.product_id
    and not exists (
      select 1
      from public.supplier_deliveries d
      join public.suppliers s on s.id = d.supplier_id
      where d.id = new.delivery_id
        and s.is_active = true
    )
  then
    raise exception 'Поставщик удалён. Создание новых товаров из его поставок недоступно';
  end if;

  return new;
end;
$$;

drop trigger if exists supplier_delivery_items_require_active_supplier
  on public.supplier_delivery_items;
create trigger supplier_delivery_items_require_active_supplier
before update of product_id on public.supplier_delivery_items
for each row
execute function public.ensure_delivery_supplier_active();

revoke all on function public.ensure_delivery_supplier_active() from public;
revoke execute on function public.ensure_delivery_supplier_active() from anon, authenticated;
