create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  email text,
  phone text,
  location_sharing_preferences jsonb default '{}'::jsonb,
  notification_preferences jsonb default '{}'::jsonb,
  updated_at timestamptz default now()
);

create table if not exists public.first_aid_kits (
  id text primary key,
  kit_name text not null,
  location_name text,
  building text,
  floor text,
  description text,
  latitude double precision,
  longitude double precision,
  qr_identifier text unique
);

create table if not exists public.trusted_contacts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  relationship text,
  phone text,
  email text,
  notification_preference text default 'SMS',
  is_primary boolean default false,
  created_at timestamptz default now()
);

create table if not exists public.emergency_alerts (
  id text primary key,
  user_id uuid references auth.users(id) on delete set null,
  status text not null default 'active',
  created_at timestamptz default now(),
  latitude double precision,
  longitude double precision,
  sharing_enabled boolean default true,
  sharing_token text unique,
  expires_at timestamptz
);

create table if not exists public.emergency_locations (
  id uuid primary key default gen_random_uuid(),
  alert_id text not null references public.emergency_alerts(id) on delete cascade,
  latitude double precision not null,
  longitude double precision not null,
  updated_at timestamptz default now()
);

create table if not exists public.notification_logs (
  id uuid primary key default gen_random_uuid(),
  alert_id text not null references public.emergency_alerts(id) on delete cascade,
  contact_id uuid references public.trusted_contacts(id) on delete set null,
  delivery_method text,
  delivery_status text,
  created_at timestamptz default now()
);

alter table public.profiles enable row level security;
alter table public.trusted_contacts enable row level security;
alter table public.emergency_alerts enable row level security;
alter table public.emergency_locations enable row level security;
alter table public.notification_logs enable row level security;

create policy "Users can manage own profile" on public.profiles
  for all using (auth.uid() = id) with check (auth.uid() = id);

create policy "Users can manage own trusted contacts" on public.trusted_contacts
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "Users can manage own emergency alerts" on public.emergency_alerts
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "Users can update locations for own alerts" on public.emergency_locations
  for all using (
    exists (
      select 1 from public.emergency_alerts a
      where a.id = alert_id and a.user_id = auth.uid()
    )
  ) with check (
    exists (
      select 1 from public.emergency_alerts a
      where a.id = alert_id and a.user_id = auth.uid()
    )
  );

create policy "Users can view own notification logs" on public.notification_logs
  for select using (
    exists (
      select 1 from public.emergency_alerts a
      where a.id = alert_id and a.user_id = auth.uid()
    )
  );

create or replace function public.get_emergency_location(p_token text)
returns table (
  alert_id text,
  person_name text,
  latitude double precision,
  longitude double precision,
  updated_at timestamptz
)
language sql
security definer
set search_path = public
as $$
  select a.id,
         p.full_name,
         coalesce(l.latitude, a.latitude),
         coalesce(l.longitude, a.longitude),
         coalesce(l.updated_at, a.created_at)
  from public.emergency_alerts a
  left join public.profiles p on p.id = a.user_id
  left join lateral (
    select el.latitude, el.longitude, el.updated_at
    from public.emergency_locations el
    where el.alert_id = a.id
    order by el.updated_at desc
    limit 1
  ) l on true
  where a.sharing_token = p_token
    and a.sharing_enabled = true
    and (a.expires_at is null or a.expires_at > now())
  limit 1;
$$;

revoke all on function public.get_emergency_location(text) from public;
grant execute on function public.get_emergency_location(text) to anon, authenticated;

alter table public.first_aid_kits enable row level security;
create policy "Anyone can read registered first aid kits" on public.first_aid_kits
  for select using (true);

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, full_name, email, phone)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', ''),
    new.email,
    coalesce(new.raw_user_meta_data->>'phone', '')
  )
  on conflict (id) do update set
    full_name = excluded.full_name,
    email = excluded.email,
    phone = excluded.phone;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();
