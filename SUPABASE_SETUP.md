# Supabase и доступ в CRM

Проект уже подключён к Supabase `dqrjxcyulzauoqhmnrho`. Схема, RLS-политики, Storage, Realtime, RPC-функции и Edge Functions `public-shop` и `invite-manager` уже развёрнуты.

1. В Supabase откройте **Authentication → Users** и создайте пользователя с email и паролем.
2. Откройте **Table Editor → profiles**, найдите строку с тем же `id` и для первого управляющего задайте:
   - `role` = `admin`
   - `is_active` = `true`
   - `full_name` = имя управляющего
3. На сайте введите `/admin` в строке поиска и войдите с созданными данными.

Нового менеджера добавляют прямо в CRM: **Менеджеры → Добавить менеджера**.
Укажите email, имя и телефон. Supabase отправит защищённую ссылку; менеджер
откроет её, задаст свой пароль и войдёт. UUID вручную вводить не нужно. Позже
пароль можно сменить в разделе **Профиль** с подтверждением текущего пароля.

Для этой механики должны быть развёрнуты:

- миграция `20260813010000_courier_lifecycle.sql`;
- миграции поставок и финансов `20260813150000_supplier_deliveries_product_flow.sql`,
  `20260813160000_fix_product_delete_audit_action.sql` и
  `20260813170000_harden_supplier_flow_rpc_permissions.sql`,
  `20260813180000_require_supplier_delivery_purchase_price.sql`;
- Edge Function `invite-manager` с `verify_jwt = true`;
- Edge Function `public-shop` с `verify_jwt = false`: она публична намеренно,
  но вызывает закрытый для `anon` RPC через service-role, проверяет payload и
  применяет rate limit;
- разрешённый redirect URL `https://tehno-six.vercel.app` в настройках Supabase Auth.

## Проверка рабочей базы

Файл `supabase/tests/supplier_product_finance_flow.sql` можно выполнить в SQL
Editor. Он использует явные `BEGIN`/`ROLLBACK`, поэтому поставщики, товары,
клиенты и заказы проверки не остаются в рабочей базе.

## Локальный запуск

```bash
npm install
npm run dev
```

Требуется Node.js 22 или новее. Публичный ключ Supabase находится в `.env.local`; секретный service-role key в клиентском проекте не используется.
