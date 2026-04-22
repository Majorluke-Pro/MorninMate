alter table public.profiles
  add column if not exists age integer,
  add column if not exists country text;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'profiles_age_range_check'
  ) then
    alter table public.profiles
      add constraint profiles_age_range_check
      check (age is null or age between 1 and 120);
  end if;
end $$;
