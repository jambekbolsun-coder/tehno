create or replace function public.delete_product_safely(p_product_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.is_admin() then raise exception 'Только управляющий может удалять товары'; end if;
  if not exists (select 1 from public.products where id = p_product_id and deleted_at is null) then
    raise exception 'Товар не найден или уже удалён';
  end if;

  update public.products
  set is_active = false, status = 'archived', deleted_at = now()
  where id = p_product_id;

  update public.supplier_products
  set is_active = false, updated_at = now()
  where product_id = p_product_id;

  insert into public.audit_logs(actor_id, table_name, record_id, action, metadata)
  values (
    auth.uid(), 'products', p_product_id::text, 'RPC',
    jsonb_build_object('function','delete_product_safely','operation','soft_delete')
  );
end;
$$;

revoke all on function public.delete_product_safely(uuid) from public;
grant execute on function public.delete_product_safely(uuid) to authenticated;
