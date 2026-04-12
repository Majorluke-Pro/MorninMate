create extension if not exists pgcrypto;

create table if not exists public.wake_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  alarm_id bigint null references public.alarms(id) on delete set null,
  started_at timestamptz not null default now(),
  completed_at timestamptz null,
  status text not null check (status in ('in_progress', 'success', 'failed')),
  intensity text not null,
  games jsonb not null default '[]'::jsonb,
  total_fails integer not null default 0,
  results jsonb null
);

create index if not exists wake_sessions_user_id_idx
  on public.wake_sessions(user_id);

create index if not exists wake_sessions_alarm_id_idx
  on public.wake_sessions(alarm_id);

create index if not exists wake_sessions_started_at_idx
  on public.wake_sessions(started_at desc);

alter table public.wake_sessions enable row level security;
alter table public.wake_sessions force row level security;

drop policy if exists "Users can view own wake_sessions" on public.wake_sessions;
create policy "Users can view own wake_sessions"
  on public.wake_sessions for select
  using (auth.uid() = user_id);

drop policy if exists "Users can insert own wake_sessions" on public.wake_sessions;
create policy "Users can insert own wake_sessions"
  on public.wake_sessions for insert
  with check (auth.uid() = user_id);

drop policy if exists "Users can update own wake_sessions" on public.wake_sessions;
create policy "Users can update own wake_sessions"
  on public.wake_sessions for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "Users can delete own wake_sessions" on public.wake_sessions;
create policy "Users can delete own wake_sessions"
  on public.wake_sessions for delete
  using (auth.uid() = user_id);
