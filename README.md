# Поровну 🧡

Совместный бюджет для пар и соседей.

## Быстрый старт

### 1. Установи зависимости
```bash
npm install
```

### 2. Supabase
1. Зайди на [supabase.com](https://supabase.com) → создай новый проект
2. Открой **SQL Editor** → вставь содержимое `supabase_schema.sql` → Run
3. Скопируй **Project URL** и **anon key** из Settings → API

### 3. Создай .env файл
```bash
cp .env.example .env
```
Вставь свои ключи:
```
VITE_SUPABASE_URL=https://xxxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJ...
```

### 4. Запусти
```bash
npm run dev
```
Открой [http://localhost:5173](http://localhost:5173)

## Деплой на Vercel
```bash
npm install -g vercel
vercel
```
Добавь env переменные в Vercel Dashboard → Settings → Environment Variables.

## Структура

```
src/
  components/
    AddExpenseModal   — модалка добавления траты
    BalanceCard       — карточка с балансом
    TransactionList   — список транзакций
    InviteBanner      — баннер с инвайт-ссылкой
  pages/
    LoginPage         — вход
    RegisterPage      — регистрация
    HomePage          — главный экран
    InvitePage        — обработка инвайт-ссылки
  hooks/
    useAuth           — контекст авторизации
  lib/
    supabase          — клиент Supabase
```

## Что работает в MVP
- ✅ Регистрация / вход
- ✅ Инвайт-ссылка для создания пары
- ✅ Добавление трат с категорией
- ✅ Автоматический расчёт баланса
- ✅ Фильтр по категориям
- ✅ Уютный тёплый дизайн
- ✅ Realtime синхронизация (Supabase subscriptions)
- ✅ Графики по месяцам

