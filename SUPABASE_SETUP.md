# Supabase и доступ в CRM

Проект уже подключён к Supabase `dqrjxcyulzauoqhmnrho`. Схема, RLS-политики, Storage, Realtime, RPC-функции и Edge Function `public-shop` уже развёрнуты.

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
- Edge Function `invite-manager` с `verify_jwt = true`;
- разрешённый redirect URL `https://tehno-six.vercel.app` в настройках Supabase Auth.

## Локальный запуск

```bash
npm install
npm run dev
```

Требуется Node.js 22 или новее. Публичный ключ Supabase находится в `.env.local`; секретный service-role key в клиентском проекте не используется.
