create or replace function public.guard_profile_progression_updates()
returns trigger
language plpgsql
as $$
begin
  if current_setting('app.bypass_progression_guard', true) = 'on' then
    return new;
  end if;

  if new.xp is distinct from old.xp
    or new.level is distinct from old.level
    or new.demerits is distinct from old.demerits
    or new.streak is distinct from old.streak then
    if new.onboarding_complete = false
      and coalesce(new.xp, 0) = 0
      and coalesce(new.level, 1) = 1
      and coalesce(new.demerits, 0) = 0
      and coalesce(new.streak, 0) = 0 then
      return new;
    end if;

    raise exception 'Direct progression updates are not allowed';
  end if;

  return new;
end;
$$;

drop trigger if exists trg_guard_profile_progression_updates on public.profiles;
create trigger trg_guard_profile_progression_updates
before update on public.profiles
for each row
execute function public.guard_profile_progression_updates();

create or replace function public.guard_wake_session_completion_updates()
returns trigger
language plpgsql
as $$
begin
  if current_setting('app.bypass_progression_guard', true) = 'on' then
    return new;
  end if;

  if new.status is distinct from old.status
    or new.completed_at is distinct from old.completed_at
    or new.results is distinct from old.results
    or new.total_fails is distinct from old.total_fails then
    raise exception 'Direct wake session progression updates are not allowed';
  end if;

  return new;
end;
$$;

drop trigger if exists trg_guard_wake_session_completion_updates on public.wake_sessions;
create trigger trg_guard_wake_session_completion_updates
before update on public.wake_sessions
for each row
execute function public.guard_wake_session_completion_updates();

create or replace function public.record_wake_game_fail(p_session_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid := auth.uid();
  v_session public.wake_sessions%rowtype;
  v_profile public.profiles%rowtype;
  v_next_xp integer;
  v_next_level integer;
  v_next_demerits integer;
begin
  if v_user_id is null then
    raise exception 'Authentication required';
  end if;

  select *
  into v_session
  from public.wake_sessions
  where id = p_session_id
    and user_id = v_user_id
  for update;

  if not found then
    raise exception 'Wake session not found';
  end if;

  if v_session.status <> 'in_progress' then
    raise exception 'Wake session is not active';
  end if;

  select *
  into v_profile
  from public.profiles
  where id = v_user_id
  for update;

  if not found then
    raise exception 'Profile not found';
  end if;

  v_next_xp := greatest(coalesce(v_profile.xp, 0) - 20, 0);
  v_next_level := greatest(floor(v_next_xp / 100.0)::int + 1, 1);
  v_next_demerits := coalesce(v_profile.demerits, 0) + 1;

  perform set_config('app.bypass_progression_guard', 'on', true);

  update public.profiles
  set xp = v_next_xp,
      level = v_next_level,
      demerits = v_next_demerits,
      streak = 0,
      updated_at = now()
  where id = v_user_id;

  update public.wake_sessions
  set total_fails = coalesce(total_fails, 0) + 1
  where id = p_session_id;

  return jsonb_build_object(
    'xp', v_next_xp,
    'level', v_next_level,
    'demerits', v_next_demerits,
    'streak', 0,
    'totalFails', coalesce(v_session.total_fails, 0) + 1
  );
end;
$$;

create or replace function public.complete_wake_session(
  p_session_id uuid,
  p_status text,
  p_results jsonb default null
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid := auth.uid();
  v_session public.wake_sessions%rowtype;
  v_profile public.profiles%rowtype;
  v_reward integer := 0;
  v_next_xp integer;
  v_next_level integer;
  v_next_streak integer;
begin
  if v_user_id is null then
    raise exception 'Authentication required';
  end if;

  if p_status not in ('success', 'failed') then
    raise exception 'Invalid wake session status';
  end if;

  select *
  into v_session
  from public.wake_sessions
  where id = p_session_id
    and user_id = v_user_id
  for update;

  if not found then
    raise exception 'Wake session not found';
  end if;

  if v_session.status <> 'in_progress' then
    raise exception 'Wake session is already complete';
  end if;

  select *
  into v_profile
  from public.profiles
  where id = v_user_id
  for update;

  if not found then
    raise exception 'Profile not found';
  end if;

  if p_status = 'success' then
    v_reward := case coalesce(v_session.intensity, 'moderate')
      when 'gentle' then 20
      when 'moderate' then 35
      when 'intense' then 60
      when 'hardcore' then 100
      else 0
    end;
    v_next_xp := coalesce(v_profile.xp, 0) + v_reward;
    v_next_level := floor(v_next_xp / 100.0)::int + 1;
    v_next_streak := coalesce(v_profile.streak, 0) + 1;
  else
    v_next_xp := coalesce(v_profile.xp, 0);
    v_next_level := greatest(coalesce(v_profile.level, 1), 1);
    v_next_streak := coalesce(v_profile.streak, 0);
  end if;

  perform set_config('app.bypass_progression_guard', 'on', true);

  update public.wake_sessions
  set status = p_status,
      completed_at = now(),
      results = p_results
  where id = p_session_id;

  if p_status = 'success' then
    update public.profiles
    set xp = v_next_xp,
        level = v_next_level,
        streak = v_next_streak,
        updated_at = now()
    where id = v_user_id;
  end if;

  return jsonb_build_object(
    'xp', v_next_xp,
    'level', v_next_level,
    'demerits', coalesce(v_profile.demerits, 0),
    'streak', v_next_streak,
    'status', p_status,
    'xpReward', v_reward
  );
end;
$$;

grant execute on function public.record_wake_game_fail(uuid) to authenticated;
grant execute on function public.complete_wake_session(uuid, text, jsonb) to authenticated;
