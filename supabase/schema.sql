-- Wedding Shred — Supabase Schema
-- Run this in the Supabase SQL Editor (project → SQL Editor → New query)

-- ============================================================
-- WEIGHT LOGS
-- ============================================================
create table if not exists weight_logs (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid references auth.users(id) on delete cascade not null,
  date        date not null,
  weight_kg   numeric(5,2) not null,
  body_fat_pct numeric(4,1),
  smm_kg      numeric(5,2),
  fat_mass_kg numeric(5,2),
  whr         numeric(4,2),
  bmi         numeric(4,1),
  source      text check (source in ('scale','inbody')) default 'scale',
  notes       text,
  created_at  timestamptz default now()
);

alter table weight_logs enable row level security;

create policy "Users can manage own weight logs"
  on weight_logs for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create index weight_logs_user_date on weight_logs(user_id, date desc);

-- ============================================================
-- WORKOUT SESSIONS
-- ============================================================
create table if not exists workout_sessions (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid references auth.users(id) on delete cascade not null,
  date         date not null,
  workout_type text check (workout_type in ('A','B','C','badminton','rest')) not null,
  started_at   timestamptz not null,
  completed_at timestamptz,
  notes        text,
  created_at   timestamptz default now()
);

alter table workout_sessions enable row level security;

create policy "Users can manage own workout sessions"
  on workout_sessions for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create index workout_sessions_user_date on workout_sessions(user_id, date desc);

-- ============================================================
-- EXERCISE LOGS
-- ============================================================
create table if not exists exercise_logs (
  id            uuid primary key default gen_random_uuid(),
  session_id    uuid references workout_sessions(id) on delete cascade not null,
  exercise_name text not null,
  set_number    integer not null,
  reps          integer,
  weight_kg     numeric(5,2),
  duration_sec  integer,
  completed     boolean default false,
  created_at    timestamptz default now()
);

alter table exercise_logs enable row level security;

-- Users access exercise_logs through their sessions
create policy "Users can manage own exercise logs"
  on exercise_logs for all
  using (
    exists (
      select 1 from workout_sessions ws
      where ws.id = exercise_logs.session_id
        and ws.user_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from workout_sessions ws
      where ws.id = exercise_logs.session_id
        and ws.user_id = auth.uid()
    )
  );

create index exercise_logs_session on exercise_logs(session_id);

-- ============================================================
-- NUTRITION LOGS
-- ============================================================
create table if not exists nutrition_logs (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid references auth.users(id) on delete cascade not null,
  date        date not null,
  meal_type   text check (meal_type in ('breakfast','lunch','dinner','snack')) not null,
  description text not null default '',
  calories    integer not null default 0,
  protein_g   numeric(5,1) not null default 0,
  created_at  timestamptz default now()
);

alter table nutrition_logs enable row level security;

create policy "Users can manage own nutrition logs"
  on nutrition_logs for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create index nutrition_logs_user_date on nutrition_logs(user_id, date desc);

-- ============================================================
-- WATER LOGS
-- ============================================================
create table if not exists water_logs (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid references auth.users(id) on delete cascade not null,
  date       date not null,
  amount_ml  integer not null,
  created_at timestamptz default now()
);

alter table water_logs enable row level security;

create policy "Users can manage own water logs"
  on water_logs for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create index water_logs_user_date on water_logs(user_id, date desc);

-- ============================================================
-- GARMIN METRICS — daily readiness signals (manual entry from watch).
-- training_readiness 0-100, hrv_status enum, body_battery morning 0-100,
-- sleep_score 0-100. Drives session-adjustment recommendations per protocol.
-- ============================================================
create table if not exists garmin_metrics (
  id                 uuid primary key default gen_random_uuid(),
  user_id            uuid references auth.users(id) on delete cascade not null,
  date               date not null,
  training_readiness integer check (training_readiness between 0 and 100),
  hrv_status         text check (hrv_status in ('balanced','unbalanced','low','poor')),
  body_battery_am    integer check (body_battery_am between 0 and 100),
  sleep_score        integer check (sleep_score between 0 and 100),
  notes              text,
  created_at         timestamptz default now(),
  updated_at         timestamptz default now(),
  unique (user_id, date)
);

alter table garmin_metrics enable row level security;

create policy "Users can manage own garmin metrics"
  on garmin_metrics for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create index garmin_metrics_user_date on garmin_metrics(user_id, date desc);

-- ============================================================
-- DAILY HABITS — protein anchors + late-eating toggle
-- 4 protein slots × ~40g (matches MPS-saturation-per-dose);
-- ate_after_21 captures the user's specific failure mode (late-evening eating).
-- ============================================================
create table if not exists daily_habits (
  id                 uuid primary key default gen_random_uuid(),
  user_id            uuid references auth.users(id) on delete cascade not null,
  date               date not null,
  protein_breakfast  boolean not null default false,
  protein_lunch      boolean not null default false,
  protein_snack      boolean not null default false,
  protein_dinner     boolean not null default false,
  ate_after_21       boolean,
  created_at         timestamptz default now(),
  updated_at         timestamptz default now(),
  unique (user_id, date)
);

alter table daily_habits enable row level security;

create policy "Users can manage own daily habits"
  on daily_habits for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create index daily_habits_user_date on daily_habits(user_id, date desc);

-- ============================================================
-- PROGRESS PHOTOS
-- ============================================================
create table if not exists progress_photos (
  id        uuid primary key default gen_random_uuid(),
  user_id   uuid references auth.users(id) on delete cascade not null,
  date      date not null,
  photo_url text not null,
  view_type text check (view_type in ('front','side','back')) not null,
  created_at timestamptz default now()
);

alter table progress_photos enable row level security;

create policy "Users can manage own progress photos"
  on progress_photos for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create index progress_photos_user_date on progress_photos(user_id, date desc);

-- ============================================================
-- STORAGE BUCKET FOR PROGRESS PHOTOS
-- Run this separately in the Storage section or as SQL:
-- ============================================================
-- insert into storage.buckets (id, name, public) values ('progress-photos', 'progress-photos', true);
--
-- create policy "Users can upload own progress photos"
--   on storage.objects for insert
--   with check (bucket_id = 'progress-photos' and auth.uid()::text = (storage.foldername(name))[1]);
--
-- create policy "Progress photos are publicly readable"
--   on storage.objects for select
--   using (bucket_id = 'progress-photos');
--
-- create policy "Users can delete own progress photos"
--   on storage.objects for delete
--   using (bucket_id = 'progress-photos' and auth.uid()::text = (storage.foldername(name))[1]);
