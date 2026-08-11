# Первый вход в CRM

Проект уже подключён к Supabase `dqrjxcyulzauoqhmnrho`. Схема, RLS-политики, Storage, Realtime, RPC-функции и Edge Function `public-shop` уже развёрнуты.

1. В Supabase откройте **Authentication → Users** и создайте пользователя с email и паролем.
2. Откройте **Table Editor → profiles**, найдите строку с тем же `id` и для первого управляющего задайте:
   - `role` = `admin`
   - `is_active` = `true`
   - `full_name` = имя управляющего
3. На сайте введите `/admin` в строке поиска и войдите с созданными данными.

Для нового менеджера сначала создайте пользователя в **Authentication → Users**, затем в CRM откройте **Менеджеры → Добавить менеджера** и вставьте UUID пользователя. CRM активирует профиль менеджера, но не создаёт и не хранит его пароль.

## Локальный запуск

```bash
npm install
npm run dev
```

Требуется Node.js 22 или новее. Публичный ключ Supabase находится в `.env.local`; секретный service-role key в клиентском проекте не используется.
