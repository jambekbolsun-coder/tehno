-- A zero purchase price makes supplier debt and gross profit silently wrong.
-- Every received supplier model must therefore have a positive unit cost.

alter table public.supplier_delivery_items
  drop constraint if exists supplier_delivery_items_purchase_price_tyiyn_check;

alter table public.supplier_delivery_items
  add constraint supplier_delivery_items_purchase_price_tyiyn_check
  check (purchase_price_tyiyn > 0);

create or replace function public.create_supplier_with_delivery(
  p_supplier jsonb,
  p_items jsonb,
  p_notes text default null
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_supplier_id uuid;
  v_delivery_id uuid;
  v_delivery_number bigint;
  v_item jsonb;
  v_quantity integer;
  v_purchase_price bigint;
  v_total_quantity integer := 0;
  v_name text;
begin
  if not public.is_admin() then raise exception 'Только управляющий может оформлять поставки'; end if;
  if jsonb_typeof(p_supplier) <> 'object' then raise exception 'Укажите поставщика'; end if;
  if jsonb_typeof(p_items) <> 'array' or jsonb_array_length(p_items) = 0 then
    raise exception 'Добавьте хотя бы одну модель поставки';
  end if;
  if jsonb_array_length(p_items) > 50 then raise exception 'В одной поставке допустимо не более 50 моделей'; end if;

  v_name := trim(coalesce(p_supplier ->> 'name',''));
  if length(v_name) < 2 then raise exception 'Укажите название поставщика'; end if;

  for v_item in select value from jsonb_array_elements(p_items)
  loop
    begin
      v_quantity := (v_item ->> 'quantity')::integer;
      v_purchase_price := (v_item ->> 'purchase_price_tyiyn')::bigint;
    exception when others then
      raise exception 'Проверьте количество и закупочную цену каждой модели';
    end;
    if length(trim(coalesce(v_item ->> 'product_name',''))) < 2
       or length(trim(coalesce(v_item ->> 'brand',''))) < 1
       or length(trim(coalesce(v_item ->> 'model',''))) < 1 then
      raise exception 'Укажите товар, бренд и модель в каждой строке';
    end if;
    if v_quantity <= 0 or v_quantity > 100000 then raise exception 'Количество каждой модели должно быть больше нуля'; end if;
    if v_purchase_price <= 0 then raise exception 'Закупочная цена должна быть больше нуля'; end if;
    v_total_quantity := v_total_quantity + v_quantity;
  end loop;

  insert into public.suppliers (
    name, contact_person, phone, whatsapp, email, address, notes, created_by
  ) values (
    v_name,
    nullif(trim(p_supplier ->> 'contact_person'),''),
    nullif(trim(p_supplier ->> 'phone'),''),
    nullif(trim(p_supplier ->> 'whatsapp'),''),
    nullif(trim(p_supplier ->> 'email'),''),
    nullif(trim(p_supplier ->> 'address'),''),
    nullif(trim(p_supplier ->> 'notes'),''),
    auth.uid()
  ) returning id into v_supplier_id;

  insert into public.supplier_deliveries (
    supplier_id, total_quantity, notes, created_by
  ) values (
    v_supplier_id, v_total_quantity, nullif(trim(p_notes),''), auth.uid()
  ) returning id, delivery_number into v_delivery_id, v_delivery_number;

  for v_item in select value from jsonb_array_elements(p_items)
  loop
    insert into public.supplier_delivery_items (
      delivery_id, product_name, brand, model, supplier_sku,
      quantity, purchase_price_tyiyn
    ) values (
      v_delivery_id,
      trim(v_item ->> 'product_name'),
      trim(v_item ->> 'brand'),
      trim(v_item ->> 'model'),
      nullif(trim(v_item ->> 'supplier_sku'),''),
      (v_item ->> 'quantity')::integer,
      (v_item ->> 'purchase_price_tyiyn')::bigint
    );
  end loop;

  return jsonb_build_object(
    'supplier_id', v_supplier_id,
    'delivery_id', v_delivery_id,
    'delivery_number', v_delivery_number,
    'total_quantity', v_total_quantity
  );
end;
$$;

create or replace function public.create_supplier_delivery(
  p_supplier_id uuid,
  p_items jsonb,
  p_notes text default null,
  p_delivered_at date default current_date
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_delivery_id uuid;
  v_delivery_number bigint;
  v_item jsonb;
  v_quantity integer;
  v_purchase_price bigint;
  v_total_quantity integer := 0;
begin
  if not public.is_admin() then raise exception 'Только управляющий может оформлять поставки'; end if;
  if not exists (select 1 from public.suppliers where id = p_supplier_id and is_active) then
    raise exception 'Поставщик не найден или архивирован';
  end if;
  if p_delivered_at > current_date then raise exception 'Дата поставки не может быть в будущем'; end if;
  if jsonb_typeof(p_items) <> 'array' or jsonb_array_length(p_items) = 0 then
    raise exception 'Добавьте хотя бы одну модель поставки';
  end if;
  if jsonb_array_length(p_items) > 50 then raise exception 'В одной поставке допустимо не более 50 моделей'; end if;

  for v_item in select value from jsonb_array_elements(p_items)
  loop
    begin
      v_quantity := (v_item ->> 'quantity')::integer;
      v_purchase_price := (v_item ->> 'purchase_price_tyiyn')::bigint;
    exception when others then
      raise exception 'Проверьте количество и закупочную цену каждой модели';
    end;
    if length(trim(coalesce(v_item ->> 'product_name',''))) < 2
       or length(trim(coalesce(v_item ->> 'brand',''))) < 1
       or length(trim(coalesce(v_item ->> 'model',''))) < 1 then
      raise exception 'Укажите товар, бренд и модель в каждой строке';
    end if;
    if v_quantity <= 0 or v_quantity > 100000 then raise exception 'Количество каждой модели должно быть больше нуля'; end if;
    if v_purchase_price <= 0 then raise exception 'Закупочная цена должна быть больше нуля'; end if;
    v_total_quantity := v_total_quantity + v_quantity;
  end loop;

  insert into public.supplier_deliveries (
    supplier_id, delivered_at, total_quantity, notes, created_by
  ) values (
    p_supplier_id, coalesce(p_delivered_at,current_date), v_total_quantity,
    nullif(trim(p_notes),''), auth.uid()
  ) returning id, delivery_number into v_delivery_id, v_delivery_number;

  for v_item in select value from jsonb_array_elements(p_items)
  loop
    insert into public.supplier_delivery_items (
      delivery_id, product_name, brand, model, supplier_sku,
      quantity, purchase_price_tyiyn
    ) values (
      v_delivery_id,
      trim(v_item ->> 'product_name'),
      trim(v_item ->> 'brand'),
      trim(v_item ->> 'model'),
      nullif(trim(v_item ->> 'supplier_sku'),''),
      (v_item ->> 'quantity')::integer,
      (v_item ->> 'purchase_price_tyiyn')::bigint
    );
  end loop;

  return jsonb_build_object(
    'supplier_id', p_supplier_id,
    'delivery_id', v_delivery_id,
    'delivery_number', v_delivery_number,
    'total_quantity', v_total_quantity
  );
end;
$$;

revoke execute on function public.create_supplier_with_delivery(jsonb,jsonb,text) from anon;
revoke execute on function public.create_supplier_delivery(uuid,jsonb,text,date) from anon;
grant execute on function public.create_supplier_with_delivery(jsonb,jsonb,text) to authenticated;
grant execute on function public.create_supplier_delivery(uuid,jsonb,text,date) to authenticated;
