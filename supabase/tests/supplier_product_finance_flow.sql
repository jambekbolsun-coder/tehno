begin;

create or replace function pg_temp.verify_supplier_product_finance_flow()
returns jsonb
language plpgsql
as $$
declare
  v_admin_id uuid;
  v_manager_id uuid;
  v_category_id uuid;
  v_supplier_result jsonb;
  v_supplier_id uuid;
  v_delivery_id uuid;
  v_item_1 uuid;
  v_item_2 uuid;
  v_product_result jsonb;
  v_product_1 uuid;
  v_product_2 uuid;
  v_public_result jsonb;
  v_public_order uuid;
  v_order_result jsonb;
  v_order_1 uuid;
  v_order_2 uuid;
  v_plan_id uuid;
  v_customer_1 uuid;
  v_result jsonb;
  v_suffix text := substr(replace(gen_random_uuid()::text,'-',''),1,10);
begin
  select id into v_admin_id from public.profiles
  where role = 'admin' and is_active order by created_at limit 1;
  select id into v_manager_id from public.profiles
  where role = 'manager' and is_active order by created_at limit 1;
  select id into v_category_id from public.categories
  where is_active order by sort_order, created_at limit 1;
  if v_admin_id is null or v_manager_id is null or v_category_id is null then
    raise exception 'Для проверки нужны активные admin, manager и category';
  end if;

  perform set_config('request.jwt.claim.sub', v_admin_id::text, true);
  perform set_config('request.jwt.claim.role', 'authenticated', true);

  v_supplier_result := public.create_supplier_with_delivery(
      jsonb_build_object(
        'name','TEST Supplier ' || v_suffix,
        'contact_person','Тестовый поставщик',
        'phone','+996700000000',
        'address','Тестовый адрес'
      ),
      jsonb_build_array(
        jsonb_build_object(
          'product_name','Тестовый холодильник',
          'brand','TestBrand',
          'model','FR-' || v_suffix,
          'supplier_sku','SUP-FR-' || v_suffix,
          'quantity',5,
          'purchase_price_tyiyn',7000000
        ),
        jsonb_build_object(
          'product_name','Тестовая микроволновка',
          'brand','TestBrand',
          'model','MW-' || v_suffix,
          'supplier_sku','SUP-MW-' || v_suffix,
          'quantity',3,
          'purchase_price_tyiyn',1500000
        )
      ),
      'Автоматическая проверка'
    );
    v_supplier_id := (v_supplier_result ->> 'supplier_id')::uuid;
    v_delivery_id := (v_supplier_result ->> 'delivery_id')::uuid;

    select id into v_item_1 from public.supplier_delivery_items
    where delivery_id = v_delivery_id and model like 'FR-%';
    select id into v_item_2 from public.supplier_delivery_items
    where delivery_id = v_delivery_id and model like 'MW-%';

    v_product_result := public.create_product_from_delivery_item(
      v_item_1,
      jsonb_build_object(
        'category_id',v_category_id,
        'sku','TEST-FR-' || v_suffix,
        'slug','test-fr-' || lower(v_suffix),
        'name_ru','Тестовый холодильник',
        'description_ru','Проверка архитектуры',
        'sale_price_tyiyn',10000000,
        'minimum_stock',1,
        'warranty_months',12,
        'manager_commission_type','percent',
        'manager_commission_value',500,
        'installment_allowed',true,
        'is_active',true
      )
    );
    v_product_1 := (v_product_result ->> 'product_id')::uuid;

    v_product_result := public.create_product_from_delivery_item(
      v_item_2,
      jsonb_build_object(
        'category_id',v_category_id,
        'sku','TEST-MW-' || v_suffix,
        'slug','test-mw-' || lower(v_suffix),
        'name_ru','Тестовая микроволновка',
        'description_ru','Проверка архитектуры',
        'sale_price_tyiyn',2500000,
        'minimum_stock',1,
        'warranty_months',12,
        'manager_commission_type','fixed',
        'manager_commission_value',20000,
        'installment_allowed',true,
        'is_active',true
      )
    );
    v_product_2 := (v_product_result ->> 'product_id')::uuid;

    if (select total_quantity from public.supplier_deliveries where id = v_delivery_id) <> 8 then
      raise exception 'Неверное общее количество поставки';
    end if;
    if (select count(*) from public.supplier_delivery_items where delivery_id = v_delivery_id) <> 2 then
      raise exception 'Не созданы две модели поставки';
    end if;
    if (select stock_quantity from public.products where id = v_product_1) <> 5
       or (select stock_quantity from public.products where id = v_product_2) <> 3 then
      raise exception 'Приход не записан на склад';
    end if;

    v_public_result := public.create_public_order_v2(
      jsonb_build_object(
        'request_id',gen_random_uuid()::text,
        'full_name','Тест Публичная Рассрочка',
        'phone','+99672222' || right(v_suffix,4),
        'address','Бишкек',
        'region','Бишкек',
        'items',jsonb_build_array(jsonb_build_object('product_id',v_product_1,'quantity',1)),
        'purchase_method','installment',
        'installment_months',6,
        'comment','Проверка публичной рассрочки',
        'locale','ru',
        'page_path','#/checkout'
      ),
      'verification-' || v_suffix
    );
    v_public_order := (v_public_result ->> 'order_id')::uuid;
    if (v_public_result ->> 'total_tyiyn')::bigint <> 11100000
       or (v_public_result #>> '{installment,months}')::integer <> 6
       or (v_public_result #>> '{installment,rate_basis_points}')::integer <> 1100
       or (select total_tyiyn from public.orders where id = v_public_order) <> 11100000 then
      raise exception 'Публичная рассрочка рассчитана неверно';
    end if;

    v_order_result := public.create_staff_order_with_payment(
      jsonb_build_object('full_name','Тест Рассрочка','phone','+99670000' || right(v_suffix,4)),
      jsonb_build_array(jsonb_build_object('product_id',v_product_1,'quantity',2)),
      'offline','store','{}'::jsonb,'Проверка рассрочки',v_manager_id,
      'installment',6
    );
    v_order_1 := (v_order_result ->> 'order_id')::uuid;
    if (v_order_result ->> 'total_tyiyn')::bigint <> 22200000 then
      raise exception 'Неверная сумма рассрочки: ожидалось 22200000';
    end if;

    perform public.confirm_order_sale(v_order_1,'installment',0,6);
    perform public.set_order_status(v_order_1,'completed','Проверка завершена');
    select id into v_plan_id from public.installment_plans where order_id = v_order_1;
    select customer_id into v_customer_1 from public.orders where id = v_order_1;

    if (select stock_quantity from public.products where id = v_product_1) <> 3 then
      raise exception 'Склад не уменьшился после продажи';
    end if;
    if (select amount_tyiyn from public.supplier_debts where order_id = v_order_1 and supplier_id = v_supplier_id) <> 14000000 then
      raise exception 'Неверный долг поставщику';
    end if;
    if (select amount_tyiyn from public.manager_commissions where order_id = v_order_1 and manager_id = v_manager_id) <> 1000000 then
      raise exception 'Неверная процентная комиссия менеджера';
    end if;
    if (select total_tyiyn from public.installment_plans where id = v_plan_id) <> 22200000 then
      raise exception 'Неверная сумма плана рассрочки';
    end if;
    if (select count(*) from public.installment_schedule where installment_plan_id = v_plan_id) <> 6
       or (select sum(amount_tyiyn) from public.installment_schedule where installment_plan_id = v_plan_id) <> 22200000
       or (select max(amount_tyiyn) - min(amount_tyiyn) from public.installment_schedule where installment_plan_id = v_plan_id) > 1 then
      raise exception 'График рассрочки распределён неверно';
    end if;
    if (select total_spent_tyiyn from public.customers where id = v_customer_1) <> 22200000 then
      raise exception 'Сумма клиента не включает корректную рассрочку';
    end if;

    v_order_result := public.create_staff_order_with_payment(
      jsonb_build_object('full_name','Тест Наличные','phone','+99671111' || right(v_suffix,4)),
      jsonb_build_array(jsonb_build_object('product_id',v_product_2,'quantity',1)),
      'offline','store','{}'::jsonb,'Проверка наличных',v_manager_id,
      'full',null
    );
    v_order_2 := (v_order_result ->> 'order_id')::uuid;
    perform public.confirm_order_sale(v_order_2,'cash',2500000,null);
    perform public.set_order_status(v_order_2,'completed','Проверка завершена');

    if (select amount_tyiyn from public.supplier_debts where order_id = v_order_2 and supplier_id = v_supplier_id) <> 1500000 then
      raise exception 'Неверный долг по наличной продаже';
    end if;
    if (select amount_tyiyn from public.manager_commissions where order_id = v_order_2 and manager_id = v_manager_id) <> 20000 then
      raise exception 'Неверная фиксированная комиссия менеджера';
    end if;
    if (select paid_tyiyn from public.orders where id = v_order_2) <> 2500000 then
      raise exception 'Наличная оплата не записана';
    end if;

    perform public.delete_product_safely(v_product_2);
    if not exists (
      select 1 from public.products
      where id = v_product_2 and deleted_at is not null and not is_active and status = 'archived'
    ) then raise exception 'Безопасное удаление товара не сработало'; end if;
    if exists (
      select 1 from public.products
      where id = v_product_2 and is_active and deleted_at is null
    ) then raise exception 'Удалённый товар остаётся видимым'; end if;

  v_result := jsonb_build_object(
      'supplier_with_two_models','ok',
      'inventory_receipt_and_sales','ok',
      'supplier_debts','ok',
      'percent_and_fixed_commissions','ok',
      'installment_total','22200000',
      'installment_schedule_sum','22200000',
      'installment_schedule_count',6,
      'public_checkout_installment','ok',
      'safe_product_delete','ok',
      'test_data_persisted',false
  );
  return v_result;
end;
$$;

select pg_temp.verify_supplier_product_finance_flow() as verification;
rollback;

select jsonb_build_object(
  'supplier_with_two_models','ok',
  'inventory_receipt_and_sales','ok',
  'supplier_debts','ok',
  'percent_and_fixed_commissions','ok',
  'installment_total','22200000',
  'installment_schedule_sum','22200000',
  'installment_schedule_count',6,
  'public_checkout_installment','ok',
  'safe_product_delete','ok',
  'test_data_persisted',false
) as verification;
