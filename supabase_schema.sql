-- Profiles (автоматически при регистрации)
create table profiles (
  id uuid references auth.users on delete cascade primary key,
  name text,
  created_at timestamptz default now()
);

-- Trigger: создаём профиль при регистрации
create or replace function handle_new_user()
returns trigger as $$
begin
  insert into profiles (id, name)
  values (new.id, new.raw_user_meta_data->>'name');
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure handle_new_user();

-- Пары
create table pairs (
  id uuid default gen_random_uuid() primary key,
  user1_id uuid references profiles(id) on delete cascade not null,
  user2_id uuid references profiles(id) on delete cascade not null,
  created_at timestamptz default now()
);

-- Инвайты
create table invites (
  id uuid default gen_random_uuid() primary key,
  code text unique not null,
  created_by uuid references profiles(id) on delete cascade not null,
  used boolean default false,
  created_at timestamptz default now()
);

-- Траты
create table expenses (
  id uuid default gen_random_uuid() primary key,
  pair_id uuid references pairs(id) on delete cascade not null,
  paid_by uuid references profiles(id) on delete cascade not null,
  amount numeric(10,2) not null,
  title text not null,
  category text default 'other',
  created_at timestamptz default now()
);

-- RLS (Row Level Security) — каждый видит только своё
alter table profiles enable row level security;
alter table pairs enable row level security;
alter table invites enable row level security;
alter table expenses enable row level security;

-- Profiles: видишь себя и партнёра
create policy "profiles_select" on profiles for select
  using (
    id = auth.uid() or
    id in (
      select case when user1_id = auth.uid() then user2_id else user1_id end
      from pairs where user1_id = auth.uid() or user2_id = auth.uid()
    )
  );

create policy "profiles_update" on profiles for update
  using (id = auth.uid());

-- Pairs: видишь только свои пары
create policy "pairs_select" on pairs for select
  using (user1_id = auth.uid() or user2_id = auth.uid());

create policy "pairs_insert" on pairs for insert
  with check (user1_id = auth.uid() or user2_id = auth.uid());

-- Invites: видишь свои + можешь читать по коду
create policy "invites_select" on invites for select
  using (created_by = auth.uid() or true); -- allow reading by code

create policy "invites_insert" on invites for insert
  with check (created_by = auth.uid());

create policy "invites_update" on invites for update
  using (true); -- need to mark as used

-- Expenses: видишь траты своей пары
create policy "expenses_select" on expenses for select
  using (
    pair_id in (
      select id from pairs
      where user1_id = auth.uid() or user2_id = auth.uid()
    )
  );

create policy "expenses_insert" on expenses for insert
  with check (
    paid_by = auth.uid() and
    pair_id in (
      select id from pairs
      where user1_id = auth.uid() or user2_id = auth.uid()
    )
  );

create policy "expenses_delete" on expenses for delete
  using (paid_by = auth.uid());
