-- Supabase grants EXECUTE on newly created public functions to API roles through
-- project defaults. Keep the public checkout behind the Edge Function and expose
-- only the staff RPCs that the authenticated CRM calls directly.

revoke execute on function public.create_supplier_with_delivery(jsonb,jsonb,text) from anon;
revoke execute on function public.create_supplier_delivery(uuid,jsonb,text,date) from anon;
revoke execute on function public.create_product_from_delivery_item(uuid,jsonb) from anon;
revoke execute on function public.delete_product_safely(uuid) from anon;
revoke execute on function public.create_staff_order_with_payment(jsonb,jsonb,text,text,jsonb,text,uuid,text,integer) from anon;

revoke all on function public.calculate_installment_terms(bigint,integer) from public;
revoke execute on function public.calculate_installment_terms(bigint,integer) from anon, authenticated;

revoke all on function public.apply_installment_terms_to_order() from public;
revoke execute on function public.apply_installment_terms_to_order() from anon, authenticated;

revoke all on function public.create_public_order_v2(jsonb,text) from public;
revoke execute on function public.create_public_order_v2(jsonb,text) from anon, authenticated;
grant execute on function public.create_public_order_v2(jsonb,text) to service_role;

grant execute on function public.create_supplier_with_delivery(jsonb,jsonb,text) to authenticated;
grant execute on function public.create_supplier_delivery(uuid,jsonb,text,date) to authenticated;
grant execute on function public.create_product_from_delivery_item(uuid,jsonb) to authenticated;
grant execute on function public.delete_product_safely(uuid) to authenticated;
grant execute on function public.create_staff_order_with_payment(jsonb,jsonb,text,text,jsonb,text,uuid,text,integer) to authenticated;

create index if not exists supplier_deliveries_created_by_idx
  on public.supplier_deliveries(created_by);
