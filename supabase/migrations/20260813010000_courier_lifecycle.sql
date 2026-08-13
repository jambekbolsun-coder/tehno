-- Courier-delivery lifecycle for TEHNO CENTER 2.
-- Money, profit, supplier debt and manager commission are recognized only
-- after the customer accepts the delivery and the order becomes completed.

alter table public.orders
  add column if not exists inventory_reserved boolean not null default false,
  add column if not exists inventory_processed boolean not null default false,
  add column if not exists inventory_returned boolean not null default false,
  add column if not exists courier_advance_tyiyn bigint not null default 0,
  add column if not exists courier_advance_status text not null default 'not_received';

alter table public.orders
  drop constraint if exists orders_courier_advance_tyiyn_check,
  add constraint orders_courier_advance_tyiyn_check
    check (courier_advance_tyiyn >= 0),
  drop constraint if exists orders_courier_advance_status_check,
  add constraint orders_courier_advance_status_check
    check (courier_advance_status in ('not_received','pending','settled','refunded'));

alter table public.orders drop constraint if exists orders_status_check;
alter table public.orders add constraint orders_status_check check (status in (
  'new','in_progress','consulted','confirmed','courier_requested','assembled',
  'courier_picked_up','courier_in_transit','handed_to_courier','received',
  'paid','installment','completed','rejected','cancelled'
));

create index if not exists idx_orders_courier_pending
  on public.orders(status, updated_at desc)
  where status in ('courier_picked_up','courier_in_transit');

create or replace function public.confirm_order_sale(
  p_order_id uuid,
  p_payment_method text default 'cash',
  p_received_tyiyn bigint default 0,
  p_installment_months integer default null
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $function$
declare
  v_order public.orders%rowtype;
  v_item public.order_items%rowtype;
  v_product public.products%rowtype;
  v_supplier_product record;
  v_cost bigint;
  v_commission bigint;
  v_commission_total bigint := 0;
  v_paid bigint;
  v_remaining bigint;
  v_plan_id uuid;
  v_base_payment bigint;
  v_remainder bigint;
  v_i integer;
begin
  if not public.is_active_staff() then raise exception 'Нет доступа'; end if;
  if p_payment_method not in ('cash','card','transfer','installment','other') then
    raise exception 'Некорректный способ оплаты';
  end if;
  if p_received_tyiyn < 0 then raise exception 'Оплата не может быть отрицательной'; end if;
  if p_installment_months is not null and (p_installment_months < 1 or p_installment_months > 12) then
    raise exception 'Некорректный срок рассрочки';
  end if;

  select * into v_order from public.orders where id = p_order_id for update;
  if not found then raise exception 'Заказ не найден'; end if;
  if not (public.is_admin() or v_order.assigned_manager_id = auth.uid()) then
    raise exception 'Нет доступа к заказу';
  end if;
  if v_order.financial_processed then raise exception 'Продажа уже проведена'; end if;
  if v_order.status in ('rejected','cancelled') then raise exception 'Нельзя провести отменённый заказ'; end if;
  if p_received_tyiyn > v_order.total_tyiyn - v_order.paid_tyiyn then
    raise exception 'Оплата превышает остаток заказа';
  end if;

  -- Write stock off exactly once. A reserved order consumes its own reserve;
  -- an immediate shop sale uses only stock that is not reserved by deliveries.
  if not v_order.inventory_processed then
    for v_item in
      select * from public.order_items where order_id = p_order_id order by created_at
    loop
      select * into v_product from public.products where id = v_item.product_id for update;
      if not found then raise exception 'Товар из заказа не найден'; end if;

      if v_order.inventory_reserved then
        if v_product.stock_quantity < v_item.quantity
           or v_product.reserved_quantity < v_item.quantity then
          raise exception 'Недостаточно зарезервированного товара: %', v_product.name_ru;
        end if;
      elsif v_product.stock_quantity - v_product.reserved_quantity < v_item.quantity then
        raise exception 'Недостаточно товара: %', v_product.name_ru;
      end if;

      -- Release this order's reserve before the stock trigger decreases the
      -- physical balance. This preserves reserved_quantity <= stock_quantity
      -- even when the last reserved unit is sold.
      if v_order.inventory_reserved then
        update public.products
        set reserved_quantity = reserved_quantity - v_item.quantity
        where id = v_product.id;
      end if;

      insert into public.inventory_movements (
        product_id, movement_type, quantity_delta, balance_after,
        reference_type, reference_id, note, created_by
      ) values (
        v_product.id, 'sale', -v_item.quantity, 0,
        'order', p_order_id, 'Выдача по заказу №' || v_order.order_number::text, auth.uid()
      );
    end loop;

    update public.orders
    set inventory_processed = true,
        inventory_reserved = false,
        inventory_returned = false
    where id = p_order_id;
  end if;

  for v_item in
    select * from public.order_items where order_id = p_order_id order by created_at
  loop
    select sp.id, sp.supplier_id, sp.purchase_price_tyiyn
    into v_supplier_product
    from public.supplier_products sp
    where sp.product_id = v_item.product_id and sp.is_active = true
    order by sp.is_primary desc, sp.updated_at desc
    limit 1;

    if not found then
      raise exception 'Для товара "%" не назначен поставщик и закупочная цена', v_item.product_name;
    end if;

    select * into v_product from public.products where id = v_item.product_id;
    v_cost := v_supplier_product.purchase_price_tyiyn * v_item.quantity;
    v_commission := case
      when v_product.manager_commission_type = 'percent'
        then round(v_item.line_total_tyiyn * v_product.manager_commission_value / 10000.0)::bigint
      else v_product.manager_commission_value * v_item.quantity
    end;

    insert into public.order_item_financials (
      order_item_id, supplier_id, unit_cost_tyiyn,
      total_cost_tyiyn, manager_commission_tyiyn
    ) values (
      v_item.id, v_supplier_product.supplier_id,
      v_supplier_product.purchase_price_tyiyn, v_cost, v_commission
    );

    insert into public.supplier_debts (supplier_id, order_id, amount_tyiyn)
    values (v_supplier_product.supplier_id, p_order_id, v_cost)
    on conflict (supplier_id, order_id) do update
      set amount_tyiyn = excluded.amount_tyiyn,
          updated_at = now();

    v_commission_total := v_commission_total + v_commission;
  end loop;

  if v_order.assigned_manager_id is not null and v_commission_total > 0 then
    insert into public.manager_commissions (manager_id, order_id, amount_tyiyn)
    values (v_order.assigned_manager_id, p_order_id, v_commission_total);
  end if;

  update public.orders
  set financial_processed = true,
      payment_method = p_payment_method
  where id = p_order_id;

  if p_received_tyiyn > 0 then
    insert into public.payments (
      order_id, amount_tyiyn, payment_method, status, note, created_by
    ) values (
      p_order_id, p_received_tyiyn, p_payment_method, 'completed',
      'Оплата подтверждена после завершения заказа', auth.uid()
    );
  end if;

  select paid_tyiyn into v_paid from public.orders where id = p_order_id;
  v_remaining := v_order.total_tyiyn - v_paid;

  if p_installment_months is not null and v_remaining > 0 then
    insert into public.installment_plans (
      order_id, total_tyiyn, down_payment_tyiyn, months, created_by
    ) values (
      p_order_id, v_order.total_tyiyn, v_paid, p_installment_months, auth.uid()
    ) returning id into v_plan_id;

    v_base_payment := v_remaining / p_installment_months;
    v_remainder := v_remaining % p_installment_months;
    for v_i in 1..p_installment_months loop
      insert into public.installment_schedule (
        installment_plan_id, installment_number, due_date, amount_tyiyn
      ) values (
        v_plan_id, v_i, (current_date + make_interval(months => v_i))::date,
        v_base_payment + case when v_i = p_installment_months then v_remainder else 0 end
      );
    end loop;
  end if;

  update public.orders
  set status = case
        when v_remaining = 0 then 'paid'
        when p_installment_months is not null then 'installment'
        else 'confirmed'
      end,
      payment_status = case
        when v_remaining = 0 then 'paid'
        when v_paid > 0 then 'partial'
        else 'unpaid'
      end
  where id = p_order_id;

  update public.customers
  set total_orders = total_orders + 1,
      total_spent_tyiyn = total_spent_tyiyn + v_order.total_tyiyn,
      last_purchase_at = now()
  where id = v_order.customer_id;

  if v_order.lead_id is not null then
    update public.leads set status = 'won' where id = v_order.lead_id;
  end if;

  insert into public.audit_logs (actor_id, table_name, record_id, action, metadata)
  values (
    auth.uid(), 'orders', p_order_id::text, 'RPC',
    jsonb_build_object(
      'function','confirm_order_sale',
      'commission_tyiyn',v_commission_total,
      'received_tyiyn',p_received_tyiyn
    )
  );

  return jsonb_build_object(
    'order_id', p_order_id,
    'total_tyiyn', v_order.total_tyiyn,
    'paid_tyiyn', v_paid,
    'remaining_tyiyn', v_remaining,
    'manager_commission_tyiyn', v_commission_total,
    'installment_plan_id', v_plan_id
  );
end;
$function$;

create or replace function public.set_order_status(
  p_order_id uuid,
  p_new_status text,
  p_comment text default null
)
returns public.orders
language plpgsql
security definer
set search_path = public
as $function$
declare
  v_order public.orders%rowtype;
  v_old_status text;
  v_item public.order_items%rowtype;
  v_product public.products%rowtype;
begin
  if not public.is_active_staff() then raise exception 'Нет доступа'; end if;
  if p_new_status not in (
    'new','in_progress','confirmed','courier_picked_up','courier_in_transit',
    'completed','rejected','cancelled'
  ) then raise exception 'Некорректный статус'; end if;

  select * into v_order from public.orders where id = p_order_id for update;
  if not found then raise exception 'Заказ не найден'; end if;
  if not (public.is_admin() or v_order.assigned_manager_id = auth.uid()) then
    raise exception 'Нет доступа к заказу';
  end if;
  if v_order.status in ('completed','rejected','cancelled') and p_new_status <> v_order.status then
    raise exception 'Завершённый заказ нельзя вернуть в работу';
  end if;

  v_old_status := v_order.status;
  if p_new_status <> v_old_status and not (
    (v_old_status = 'new' and p_new_status in ('in_progress','confirmed','rejected','cancelled'))
    or (v_old_status = 'in_progress' and p_new_status in ('confirmed','rejected','cancelled'))
    or (v_old_status in ('confirmed','courier_requested','assembled') and p_new_status in ('courier_picked_up','completed','rejected','cancelled'))
    or (v_old_status in ('courier_picked_up','handed_to_courier') and p_new_status in ('courier_in_transit','completed','rejected','cancelled'))
    or (v_old_status in ('courier_in_transit','received') and p_new_status in ('completed','rejected','cancelled'))
    or (v_old_status in ('paid','installment') and p_new_status = 'completed')
  ) then
    raise exception 'Недопустимый переход статуса: % → %', v_old_status, p_new_status;
  end if;

  -- Repeating a status is normally idempotent. The three lifecycle states are
  -- allowed to repair a missing reserve/write-off/financial marker if an older
  -- order was created before this migration.
  if p_new_status = v_old_status and not (
    (p_new_status = 'confirmed' and not v_order.inventory_reserved and not v_order.inventory_processed)
    or (p_new_status in ('courier_picked_up','courier_in_transit') and not v_order.inventory_processed)
    or (p_new_status = 'completed' and not v_order.financial_processed)
  ) then return v_order; end if;

  -- Reserve delivery stock once the order is confirmed.
  if p_new_status in ('confirmed','courier_picked_up','courier_in_transit','completed')
     and not v_order.inventory_reserved
     and not v_order.inventory_processed then
    for v_item in select * from public.order_items where order_id = p_order_id order by created_at
    loop
      select * into v_product from public.products where id = v_item.product_id for update;
      if not found then raise exception 'Товар из заказа не найден'; end if;
      if v_product.stock_quantity - v_product.reserved_quantity < v_item.quantity then
        raise exception 'Недостаточно товара: %', v_product.name_ru;
      end if;
      update public.products
      set reserved_quantity = reserved_quantity + v_item.quantity
      where id = v_product.id;
    end loop;
    update public.orders set inventory_reserved = true where id = p_order_id;
    v_order.inventory_reserved := true;
  end if;

  -- Courier takes the goods. Stock leaves the warehouse, but the courier's
  -- advance remains pending and is deliberately excluded from revenue.
  if p_new_status in ('courier_picked_up','courier_in_transit','completed')
     and not v_order.inventory_processed then
    for v_item in select * from public.order_items where order_id = p_order_id order by created_at
    loop
      select * into v_product from public.products where id = v_item.product_id for update;
      if v_product.stock_quantity < v_item.quantity
         or v_product.reserved_quantity < v_item.quantity then
        raise exception 'Недостаточно зарезервированного товара: %', v_product.name_ru;
      end if;
      -- Keep the product invariant valid while the inventory trigger writes
      -- the new physical stock balance.
      update public.products
      set reserved_quantity = reserved_quantity - v_item.quantity
      where id = v_product.id;
      insert into public.inventory_movements (
        product_id, movement_type, quantity_delta, balance_after,
        reference_type, reference_id, note, created_by
      ) values (
        v_product.id, 'sale', -v_item.quantity, 0,
        'courier_dispatch', p_order_id,
        'Товар забрал курьер по заказу №' || v_order.order_number::text, auth.uid()
      );
    end loop;
    update public.orders
    set inventory_processed = true,
        inventory_reserved = false,
        inventory_returned = false,
        courier_advance_tyiyn = total_tyiyn,
        courier_advance_status = 'pending'
    where id = p_order_id;
    v_order.inventory_processed := true;
    v_order.inventory_reserved := false;
    v_order.courier_advance_tyiyn := v_order.total_tyiyn;
  end if;

  -- Refusal before completion: release a reserve or put dispatched goods back
  -- exactly once. No revenue, commission, supplier debt or customer spend.
  if p_new_status in ('rejected','cancelled') then
    if v_order.financial_processed then
      raise exception 'Проведённую продажу отменяйте через раздел возвратов';
    end if;

    if v_order.inventory_processed and not v_order.inventory_returned then
      for v_item in select * from public.order_items where order_id = p_order_id order by created_at
      loop
        insert into public.inventory_movements (
          product_id, movement_type, quantity_delta, balance_after,
          reference_type, reference_id, note, created_by
        ) values (
          v_item.product_id, 'return_in', v_item.quantity, 0,
          'courier_refusal', p_order_id,
          'Клиент не принял заказ №' || v_order.order_number::text, auth.uid()
        );
      end loop;
      update public.orders
      set inventory_returned = true,
          courier_advance_status = case
            when courier_advance_tyiyn > 0 then 'refunded' else 'not_received' end
      where id = p_order_id;
    elsif v_order.inventory_reserved then
      for v_item in select * from public.order_items where order_id = p_order_id order by created_at
      loop
        update public.products
        set reserved_quantity = greatest(0, reserved_quantity - v_item.quantity)
        where id = v_item.product_id;
      end loop;
      update public.orders
      set inventory_reserved = false,
          courier_advance_status = 'not_received'
      where id = p_order_id;
    end if;
  end if;

  -- Revenue is recognized only after successful delivery.
  if p_new_status = 'completed' and not v_order.financial_processed then
    perform public.confirm_order_sale(
      p_order_id,
      'other',
      v_order.total_tyiyn,
      null
    );
  end if;

  update public.orders
  set status = p_new_status,
      completed_at = case when p_new_status = 'completed' then now() else completed_at end,
      courier_advance_status = case
        when p_new_status = 'completed' then 'settled'
        else courier_advance_status
      end
  where id = p_order_id
  returning * into v_order;

  if v_order.lead_id is not null then
    update public.leads
    set status = case
      when p_new_status = 'completed' then 'won'
      when p_new_status = 'rejected' then 'lost'
      when p_new_status = 'cancelled' then 'cancelled'
      when p_new_status = 'new' then 'new'
      when p_new_status = 'in_progress' then 'in_progress'
      else 'confirmed'
    end,
    message = coalesce(p_comment, message)
    where id = v_order.lead_id;
  end if;

  if p_comment is not null then
    update public.order_status_history
    set comment = p_comment
    where id = (
      select id from public.order_status_history
      where order_id = p_order_id
        and old_status = v_old_status
        and new_status = p_new_status
      order by created_at desc limit 1
    );
  end if;

  return v_order;
end;
$function$;

revoke all on function public.confirm_order_sale(uuid,text,bigint,integer) from public;
revoke all on function public.set_order_status(uuid,text,text) from public;
grant execute on function public.confirm_order_sale(uuid,text,bigint,integer) to authenticated;
grant execute on function public.set_order_status(uuid,text,text) to authenticated;
