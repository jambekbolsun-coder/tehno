-- QR manager onboarding, storefront backorders and safe offline-sale recovery.

create table if not exists public.manager_join_tokens (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  token_hash text not null unique,
  created_by uuid not null references auth.users(id),
  expires_at timestamptz not null default (now() + interval '24 hours'),
  used_at timestamptz,
  revoked_at timestamptz,
  created_at timestamptz not null default now(),
  full_name text,
  phone text,
  phone_normalized text
);

alter table public.manager_join_tokens enable row level security;
revoke all on table public.manager_join_tokens from anon, authenticated;
grant all on table public.manager_join_tokens to service_role;

create index if not exists manager_join_tokens_active_idx
  on public.manager_join_tokens(token_hash, expires_at)
  where used_at is null and revoked_at is null;
create unique index if not exists manager_join_tokens_one_pending_phone_idx
  on public.manager_join_tokens(phone_normalized)
  where used_at is null and revoked_at is null;

-- Public orders are requests/backorders. Actual warehouse availability is checked later,
-- when staff confirms/fulfils a sale, so the storefront never exposes or enforces stock.
create or replace function public.create_public_order(p_payload jsonb, p_fingerprint text)
returns jsonb
language plpgsql
security definer
set search_path to 'public', 'app_private'
as $function$
declare
  v_request_id uuid;
  v_existing public.orders%rowtype;
  v_phone text;
  v_customer_id uuid;
  v_manager_id uuid;
  v_lead_id uuid;
  v_lead_number bigint;
  v_order_id uuid;
  v_order_number bigint;
  v_full_name text;
  v_source text := 'website';
  v_method text;
  v_months integer;
  v_item jsonb;
  v_product public.products%rowtype;
  v_quantity integer;
  v_subtotal bigint := 0;
  v_interest text := '';
begin
  if jsonb_typeof(p_payload) <> 'object' then raise exception 'Некорректные данные заявки'; end if;
  begin v_request_id := (p_payload ->> 'request_id')::uuid;
  exception when others then raise exception 'Некорректный идентификатор заявки'; end;

  select * into v_existing from public.orders where public_request_id = v_request_id;
  if found then
    return jsonb_build_object('lead_id',v_existing.lead_id,'order_id',v_existing.id,'order_number',v_existing.order_number,'total_tyiyn',v_existing.total_tyiyn,'assigned_manager_id',v_existing.assigned_manager_id);
  end if;

  perform app_private.check_public_rate_limit(p_fingerprint, 'lead');
  v_full_name := trim(coalesce(p_payload ->> 'full_name',''));
  v_phone := public.normalize_phone(p_payload ->> 'phone');
  v_method := coalesce(p_payload ->> 'purchase_method','full');
  if length(v_full_name) < 2 or length(v_full_name) > 120 then raise exception 'Укажите имя клиента'; end if;
  if length(v_phone) < 9 or length(v_phone) > 15 then raise exception 'Укажите корректный телефон'; end if;
  if v_method not in ('full','installment') then raise exception 'Некорректный способ покупки'; end if;
  if v_method = 'installment' then
    begin v_months := (p_payload ->> 'installment_months')::integer;
    exception when others then raise exception 'Укажите срок рассрочки'; end;
    if v_months not between 1 and 12 then raise exception 'Некорректный срок рассрочки'; end if;
  end if;
  if jsonb_typeof(p_payload -> 'items') <> 'array' or jsonb_array_length(p_payload -> 'items') = 0 then raise exception 'Добавьте товары'; end if;
  if jsonb_array_length(p_payload -> 'items') > 20 then raise exception 'Слишком много позиций'; end if;

  v_manager_id := public.next_manager_id();
  insert into public.customers(full_name,phone,phone_normalized,whatsapp,region,city,address,manager_id,source,notes)
  values(v_full_name,p_payload ->> 'phone',v_phone,p_payload ->> 'phone',nullif(trim(p_payload ->> 'region'),''),nullif(trim(p_payload ->> 'city'),''),nullif(trim(p_payload ->> 'address'),''),v_manager_id,v_source,nullif(trim(p_payload ->> 'comment'),''))
  on conflict(phone_normalized) do update set
    full_name=excluded.full_name,
    whatsapp=coalesce(excluded.whatsapp,customers.whatsapp),
    region=coalesce(excluded.region,customers.region),
    city=coalesce(excluded.city,customers.city),
    address=coalesce(excluded.address,customers.address),
    manager_id=coalesce(customers.manager_id,excluded.manager_id),
    updated_at=now()
  returning id,manager_id into v_customer_id,v_manager_id;

  for v_item in select value from jsonb_array_elements(p_payload -> 'items') loop
    begin
      v_quantity := (v_item ->> 'quantity')::integer;
      select * into v_product from public.products
      where id=(v_item ->> 'product_id')::uuid and is_active=true and deleted_at is null and status <> 'archived';
    exception when invalid_text_representation then raise exception 'Некорректный товар'; end;
    if not found then raise exception 'Товар не найден'; end if;
    if v_quantity <= 0 or v_quantity > 100 then raise exception 'Некорректное количество товара'; end if;
    v_subtotal := v_subtotal + v_product.sale_price_tyiyn * v_quantity;
    v_interest := concat_ws(', ',nullif(v_interest,''),v_product.name_ru);
  end loop;

  insert into public.leads(customer_id,assigned_manager_id,source,product_interest,message,status)
  values(v_customer_id,v_manager_id,v_source,left(v_interest,500),nullif(trim(p_payload ->> 'comment'),''),'new')
  returning id,lead_number into v_lead_id,v_lead_number;

  insert into public.orders(lead_id,customer_id,assigned_manager_id,sale_channel,source,delivery_region,delivery_city,delivery_address,customer_comment,status,subtotal_tyiyn,total_tyiyn,public_request_id,requested_purchase_method,requested_installment_months,request_metadata)
  values(v_lead_id,v_customer_id,v_manager_id,'online',v_source,nullif(trim(p_payload ->> 'region'),''),nullif(trim(p_payload ->> 'city'),''),nullif(trim(p_payload ->> 'address'),''),nullif(trim(p_payload ->> 'comment'),''),'new',v_subtotal,v_subtotal,v_request_id,v_method,v_months,jsonb_build_object('locale',left(coalesce(p_payload ->> 'locale','ru'),5),'page_path',left(coalesce(p_payload ->> 'page_path','/'),500),'backorder_allowed',true))
  returning id,order_number into v_order_id,v_order_number;

  for v_item in select value from jsonb_array_elements(p_payload -> 'items') loop
    v_quantity := (v_item ->> 'quantity')::integer;
    select * into v_product from public.products where id=(v_item ->> 'product_id')::uuid;
    insert into public.order_items(order_id,product_id,product_name,sku,quantity,unit_price_tyiyn,line_total_tyiyn)
    values(v_order_id,v_product.id,v_product.name_ru,v_product.sku,v_quantity,v_product.sale_price_tyiyn,v_product.sale_price_tyiyn*v_quantity);
  end loop;

  insert into public.notifications(target_user_id,type,title,message,entity_type,entity_id)
  values(v_manager_id,'new_order','Новая заявка с сайта','Заказ №'||v_order_number::text,'order',v_order_id);
  insert into public.analytics_events(event_name,product_id,source,region,page_path,metadata,order_id)
  values('lead_submit',null,'website',nullif(trim(p_payload ->> 'region'),''),left(coalesce(p_payload ->> 'page_path','/'),500),jsonb_build_object('lead_number',v_lead_number,'order_number',v_order_number,'total_tyiyn',v_subtotal,'backorder_allowed',true),v_order_id);

  return jsonb_build_object('lead_id',v_lead_id,'lead_number',v_lead_number,'order_id',v_order_id,'order_number',v_order_number,'total_tyiyn',v_subtotal,'assigned_manager_id',v_manager_id);
end;
$function$;

create or replace function public.delete_offline_sale(p_order_id uuid, p_reason text default 'Удалено управляющим')
returns jsonb
language plpgsql
security definer
set search_path to 'public'
as $function$
declare
  v_order public.orders%rowtype;
  v_item public.order_items%rowtype;
  v_lead_id uuid;
  v_customer_id uuid;
begin
  if not public.is_admin() then raise exception 'Только управляющий может удалить офлайн-продажу'; end if;
  select * into v_order from public.orders where id=p_order_id for update;
  if not found then raise exception 'Продажа не найдена'; end if;
  if v_order.sale_channel <> 'offline' then raise exception 'Удалять можно только офлайн-продажи'; end if;
  if exists(select 1 from public.returns where order_id=p_order_id) then raise exception 'По этой продаже уже есть возврат. Используйте раздел возвратов'; end if;
  if exists(select 1 from public.manager_commissions where order_id=p_order_id and paid_tyiyn>0) then raise exception 'Комиссия по этой продаже уже выплачена менеджеру'; end if;
  if exists(select 1 from public.supplier_debts where order_id=p_order_id and paid_tyiyn>0) then raise exception 'По этой продаже уже была выплата поставщику'; end if;
  v_lead_id := v_order.lead_id;
  v_customer_id := v_order.customer_id;

  if v_order.inventory_processed and not v_order.inventory_returned then
    for v_item in select * from public.order_items where order_id=p_order_id order by created_at loop
      insert into public.inventory_movements(product_id,movement_type,quantity_delta,balance_after,reference_type,reference_id,note,created_by)
      values(v_item.product_id,'return_in',v_item.quantity,0,'offline_sale_void',p_order_id,'Отмена ошибочной офлайн-продажи №'||v_order.order_number::text,auth.uid());
    end loop;
  elsif v_order.inventory_reserved then
    for v_item in select * from public.order_items where order_id=p_order_id loop
      update public.products set reserved_quantity=greatest(0,reserved_quantity-v_item.quantity) where id=v_item.product_id;
    end loop;
  end if;

  if v_order.financial_processed and v_customer_id is not null then
    update public.customers set total_orders=greatest(0,total_orders-1), total_spent_tyiyn=greatest(0,total_spent_tyiyn-v_order.total_tyiyn), updated_at=now() where id=v_customer_id;
  end if;

  delete from public.payments where order_id=p_order_id;
  delete from public.installment_schedule where installment_plan_id in(select id from public.installment_plans where order_id=p_order_id);
  delete from public.installment_plans where order_id=p_order_id;
  delete from public.manager_commissions where order_id=p_order_id;
  delete from public.supplier_debts where order_id=p_order_id;
  delete from public.order_item_financials where order_item_id in(select id from public.order_items where order_id=p_order_id);
  insert into public.audit_logs(actor_id,table_name,record_id,action,metadata)
  values(auth.uid(),'orders',p_order_id::text,'RPC',jsonb_build_object('function','delete_offline_sale','order_number',v_order.order_number,'total_tyiyn',v_order.total_tyiyn,'reason',nullif(trim(coalesce(p_reason,'')),''),'inventory_restored',v_order.inventory_processed and not v_order.inventory_returned));
  delete from public.orders where id=p_order_id;
  if v_lead_id is not null and not exists(select 1 from public.orders where lead_id=v_lead_id) then delete from public.leads where id=v_lead_id; end if;
  return jsonb_build_object('ok',true,'order_id',p_order_id,'order_number',v_order.order_number);
end;
$function$;
revoke all on function public.delete_offline_sale(uuid,text) from public,anon;
grant execute on function public.delete_offline_sale(uuid,text) to authenticated;

create or replace function public.archive_manager(p_user_id uuid, p_reason text default null)
returns void
language plpgsql
security definer
set search_path to 'public'
as $function$
declare v_replacement uuid;
begin
  if not public.is_admin() then raise exception 'Нет доступа'; end if;
  if p_user_id=auth.uid() then raise exception 'Нельзя удалить собственную учётную запись'; end if;
  if not exists(select 1 from public.profiles where id=p_user_id and role='manager' and is_active) then raise exception 'Активный сотрудник не найден'; end if;
  update public.profiles set is_active=false,updated_at=now() where id=p_user_id;
  update public.manager_join_tokens set revoked_at=now() where user_id=p_user_id and revoked_at is null;
  update auth.refresh_tokens set revoked=true,updated_at=now() where user_id=p_user_id::text;
  delete from auth.sessions where user_id=p_user_id;
  v_replacement := public.next_manager_id();
  update public.customers set manager_id=v_replacement where manager_id=p_user_id;
  update public.leads set assigned_manager_id=v_replacement where assigned_manager_id=p_user_id and status not in('won','lost','cancelled');
  update public.orders set assigned_manager_id=v_replacement where assigned_manager_id=p_user_id and status not in('paid','completed','rejected','cancelled');
  insert into public.audit_logs(actor_id,table_name,record_id,action,metadata)
  values(auth.uid(),'profiles',p_user_id::text,'RPC',jsonb_build_object('function','archive_manager','reason',p_reason,'replacement',v_replacement,'sessions_revoked',true));
end;
$function$;
revoke all on function public.archive_manager(uuid,text) from public,anon;
grant execute on function public.archive_manager(uuid,text) to authenticated;
