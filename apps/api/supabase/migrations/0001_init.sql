-- 초성런 초기 스키마
create extension if not exists "pgcrypto";

-- 사용자 (토스 로그인 시 매핑)
create table if not exists users (
  id uuid primary key default gen_random_uuid(),
  toss_user_key text unique not null,
  display_name text,
  created_at timestamptz default now()
);

-- 구독: monthly(만료일 있음) / lifetime(만료 없음)
create table if not exists subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references users(id) on delete cascade,
  product_id text not null check (product_id in ('choseong_run_monthly', 'choseong_run_lifetime')),
  order_id text unique not null,
  status text not null check (status in ('active', 'expired', 'refunded')),
  expires_at timestamptz, -- 평생권은 null
  created_at timestamptz default now()
);

create index if not exists subscriptions_user_idx
  on subscriptions (user_id, status, expires_at desc nulls first);

-- 매일 0시(KST) 갱신되는 단어 풀 (카테고리 × 날짜)
create table if not exists daily_word_pool (
  date date not null,
  category text not null,
  words jsonb not null, -- [{id, word, hint, difficulty, alternates}]
  created_at timestamptz default now(),
  primary key (date, category)
);

-- 일일 챌린지 (모두 동일한 30문제 + 카테고리 1개)
create table if not exists daily_challenge (
  date date primary key,
  category text not null,
  word_ids jsonb not null, -- string[] 30개
  created_at timestamptz default now()
);

-- 게임 세션
create table if not exists game_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references users(id) on delete set null,
  device_id text not null,
  mode text not null check (mode in ('normal', 'daily')),
  category text not null,
  started_at timestamptz not null default now(),
  finished_at timestamptz,
  score int,
  correct_count int,
  max_combo int,
  word_ids jsonb not null, -- 출제된 단어 ID 목록 (서버 채점용 진실의 원천)
  word_results jsonb -- [{wordId, correct, time_ms, points}] — 정답/입력값은 저장 안함 (privacy)
);

create index if not exists game_sessions_user_idx on game_sessions (user_id, finished_at desc);
create index if not exists game_sessions_device_idx on game_sessions (device_id, finished_at desc);

-- 일일 랭킹
create table if not exists daily_leaderboard (
  date date not null,
  user_id uuid references users(id) on delete cascade,
  device_id text not null,
  display_name text,
  score int not null,
  created_at timestamptz default now(),
  primary key (date, device_id)
);

create index if not exists daily_leaderboard_score_idx
  on daily_leaderboard (date, score desc);

-- 일일 챌린지 참가 기록 (사용자당 일 1회 + 광고 부활 1회)
create table if not exists daily_attempts (
  date date not null,
  device_id text not null,
  attempts int not null default 0,
  best_score int default 0,
  created_at timestamptz default now(),
  primary key (date, device_id)
);

-- 출석체크
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

-- 첫 100점 달성 (포인트 1회만 지급)
create table if not exists first_100_awards (
  device_id text primary key,
  user_id uuid references users(id) on delete set null,
  points_awarded integer not null,
  created_at timestamptz default now()
);
