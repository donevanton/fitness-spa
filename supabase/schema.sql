-- Run once in Supabase SQL Editor.
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text,
  created_at timestamptz not null default now()
);

create table if not exists public.workout_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  workout_day text not null,
  started_at timestamptz not null,
  finished_at timestamptz,
  duration_seconds integer,
  payload jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists workout_sessions_user_started_idx
  on public.workout_sessions(user_id, started_at desc);

create table if not exists public.workout_progress (
  user_id uuid not null references auth.users(id) on delete cascade,
  week_start date not null,
  workout_day text not null,
  completed jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now(),
  primary key (user_id, week_start, workout_day)
);

create index if not exists workout_progress_user_week_idx
  on public.workout_progress(user_id, week_start);

alter table public.profiles enable row level security;
alter table public.workout_sessions enable row level security;
alter table public.workout_progress enable row level security;

drop policy if exists "profiles_select_own" on public.profiles;
create policy "profiles_select_own" on public.profiles for select using (auth.uid() = id);

drop policy if exists "profiles_insert_own" on public.profiles;
create policy "profiles_insert_own" on public.profiles for insert with check (auth.uid() = id);

drop policy if exists "profiles_update_own" on public.profiles;
create policy "profiles_update_own" on public.profiles for update using (auth.uid() = id) with check (auth.uid() = id);

drop policy if exists "sessions_select_own" on public.workout_sessions;
create policy "sessions_select_own" on public.workout_sessions for select using (auth.uid() = user_id);

drop policy if exists "sessions_insert_own" on public.workout_sessions;
create policy "sessions_insert_own" on public.workout_sessions for insert with check (auth.uid() = user_id);

drop policy if exists "sessions_update_own" on public.workout_sessions;
create policy "sessions_update_own" on public.workout_sessions for update using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "sessions_delete_own" on public.workout_sessions;
create policy "sessions_delete_own" on public.workout_sessions for delete using (auth.uid() = user_id);

drop policy if exists "progress_select_own" on public.workout_progress;
create policy "progress_select_own" on public.workout_progress for select using (auth.uid() = user_id);

drop policy if exists "progress_insert_own" on public.workout_progress;
create policy "progress_insert_own" on public.workout_progress for insert with check (auth.uid() = user_id);

drop policy if exists "progress_update_own" on public.workout_progress;
create policy "progress_update_own" on public.workout_progress for update using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "progress_delete_own" on public.workout_progress;
create policy "progress_delete_own" on public.workout_progress for delete using (auth.uid() = user_id);

create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, display_name)
  values (new.id, coalesce(new.raw_user_meta_data->>'display_name', ''));
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created after insert on auth.users
for each row execute procedure public.handle_new_user();
