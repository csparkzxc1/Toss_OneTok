-- 한줄톡 초기 스키마
create extension if not exists "pgcrypto";

create table if not exists users (
  id uuid primary key default gen_random_uuid(),
  toss_user_key text unique not null,
  created_at timestamptz default now()
);

create table if not exists subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references users(id) on delete cascade,
  product_id text not null check (product_id in ('monthly', 'yearly')),
  order_id text unique not null,
  status text not null check (status in ('active', 'expired', 'refunded')),
  expires_at timestamptz not null,
  created_at timestamptz default now()
);

create index if not exists subscriptions_user_idx
  on subscriptions (user_id, status, expires_at desc);

create table if not exists generations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references users(id) on delete set null,
  device_id text not null,
  situation text not null,
  tone text not null,
  context text not null, -- 평문 컨텍스트 저장 금지: 'len:N' 형태로만 저장
  candidates jsonb not null,
  created_at timestamptz default now()
);

create index if not exists generations_device_idx on generations (device_id, created_at desc);
create index if not exists generations_user_idx on generations (user_id, created_at desc);

-- attendance: 출석체크 (날짜 단위 unique)
create table if not exists attendance (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references users(id) on delete cascade,
  device_id text not null,
  attendance_date date not null,
  points_awarded integer not null default 0,
  created_at timestamptz default now(),
  unique (device_id, attendance_date)
);

create index if not exists attendance_device_idx on attendance (device_id, attendance_date desc);
