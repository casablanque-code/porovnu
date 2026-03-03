# Поровну 🧡

![React](https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)
![Vite](https://img.shields.io/badge/Vite-646CFF?style=for-the-badge&logo=vite&logoColor=white)
![Supabase](https://img.shields.io/badge/Supabase-3ECF8E?style=for-the-badge&logo=supabase&logoColor=white)
![Vercel](https://img.shields.io/badge/Vercel-000000?style=for-the-badge&logo=vercel&logoColor=white)


Совместный бюджет для пар и соседей.

**→ [porovnuapp.vercel.app](https://porovnuapp.vercel.app)**

## Стек

| Слой | Технология |
|------|-----------|
| Frontend | React 18 + Vite |
| Стили | CSS Modules |
| База данных | Supabase (PostgreSQL) |
| Авторизация | Supabase Auth |
| Realtime | Supabase Channels |
| Хранилище | Supabase Storage (аватарки) |
| Cron | Supabase Edge Functions + pg_cron |
| Деплой | Vercel |

---

## 🔐 Безопасность
- **RLS** на всех таблицах — пользователь видит только данные своей пары
- **Email confirmation** — регистрация только через подтверждение почты
- Ключи Supabase через переменные окружения, в репо не попадают


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

## Структура проекта

```
src/
├── components/
│   ├── AddExpenseModal    — модалка создания и редактирования траты
│   ├── BalanceCard        — карточка баланса с СБП-ссылкой
│   ├── CategoryFilter     — фильтр по категориям + кастомные категории
│   ├── InsightCards       — умные карточки с аналитикой (мобилка)
│   ├── InviteBanner       — баннер для приглашения партнёра
│   ├── SideTips           — боковые панели (десктоп)
│   ├── Toast              — уведомления об успехе / ошибках
│   └── TransactionList    — список трат с редактированием
├── hooks/
│   ├── useAuth            — контекст авторизации
│   └── useRealtimeExpenses — подписка на изменения в реальном времени
├── lib/
│   └── supabase           — клиент Supabase
└── pages/
    ├── HomePage           — главный экран
    ├── HistoryPage        — история и аналитика
    ├── InvitePage         — обработка инвайт-ссылки
    ├── LoginPage          — вход
    ├── NotFoundPage       — 404
    ├── OnboardingPage     — онбординг для новых пользователей
    ├── PartnerPage        — настройки партнёра, выход из пары
    ├── ProfilePage        — профиль, аватар, пол
    ├── RegisterPage       — регистрация
    └── SettingsPage       — хаб настроек, режим, закрыть месяц

supabase/
└── functions/
    └── process-recurring  — Edge Function для повторяющихся трат (cron)
```

---

## Что работает в MVP
### Основное
- 💳 Добавление трат с категорией, суммой и комментарием
- ⚖️ Автоматический расчёт баланса — кто кому и сколько должен
- 🔄 Повторяющиеся траты — указываешь число месяца, появляются автоматически
- 📊 История и аналитика — графики по неделе / месяцу / году, топ категорий, сравнение с прошлым периодом
- 🔍 Инсайты — горячий день недели, дрейф трат, прогноз на конец месяца, кто чаще у кассы

### Режимы
- **Поровну** — строго пополам, видно кто кому должен, кнопка "Рассчитаться" с СБП-ссылкой
- **Общий бюджет** — просто учёт общих трат без подсчёта долгов

### Пара
- Инвайт-ссылка для подключения партнёра
- Realtime синхронизация — траты и изменения появляются мгновенно у обоих
- Аватарки, имя, пол — настраиваются в профиле

### Технические
- 📱 PWA — устанавливается на iPhone и Android как нативное приложение
- 🔐 Row Level Security — данные видит только твоя пара, никто больше
- ✉️ Подтверждение email при регистрации
- 🌐 Десктоп — трёхколоночный лейаут с инсайтами по бокам

---

