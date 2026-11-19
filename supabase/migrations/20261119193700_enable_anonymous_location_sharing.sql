alter table public.emergency_alerts
  add column if not exists update_token text;

create unique index if not exists emergency_alerts_update_token_key
  on public.emergency_alerts (update_token)
  where update_token is not null;

create or replace function public.create_emergency_share(
  p_alert_id text,
  p_share_token text,
  p_update_token text,
  p_latitude double precision,
  p_longitude double precision,
  p_expires_at timestamptz
)
returns void
language plpgsql
security definer
set search_path = pg_catalog
as $$
begin
  if p_alert_id is null
    or p_share_token is null
    or p_update_token is null
    or p_alert_id !~ '^SOS-[A-F0-9]{10}$'
    or p_share_token !~ '^[0-9a-f]{64}$'
    or p_update_token !~ '^[0-9a-f]{64}$'
    or p_share_token = p_update_token then
    raise exception 'Invalid emergency sharing credentials';
  end if;

  if (p_latitude is null) <> (p_longitude is null)
    or (p_latitude is not null and (p_latitude < -90 or p_latitude > 90))
    or (p_longitude is not null and (p_longitude < -180 or p_longitude > 180)) then
    raise exception 'Invalid location coordinates';
  end if;

  if p_expires_at is null or p_expires_at <= now() or p_expires_at > now() + interval '25 hours' then
    raise exception 'Invalid emergency sharing expiry';
  end if;

  insert into public.emergency_alerts (
    id,
    user_id,
    status,
    created_at,
    latitude,
    longitude,
    sharing_enabled,
    sharing_token,
    update_token,
    expires_at
  )
  values (
    p_alert_id,
    auth.uid(),
    'active',
    now(),
    p_latitude,
    p_longitude,
    true,
    p_share_token,
    p_update_token,
    p_expires_at
  );

  if p_latitude is not null then
    insert into public.emergency_locations (alert_id, latitude, longitude)
    values (p_alert_id, p_latitude, p_longitude);
  end if;
end;
$$;

create or replace function public.update_emergency_location(
  p_update_token text,
  p_latitude double precision,
  p_longitude double precision
)
returns void
language plpgsql
security definer
set search_path = pg_catalog
as $$
declare
  v_alert_id text;
begin
  if p_update_token is null
    or p_update_token !~ '^[0-9a-f]{64}$'
    or p_latitude is null
    or p_longitude is null
    or p_latitude < -90
    or p_latitude > 90
    or p_longitude < -180
    or p_longitude > 180 then
    raise exception 'Invalid emergency location update';
  end if;

  select id into v_alert_id
  from public.emergency_alerts
  where update_token = p_update_token
    and sharing_enabled = true
    and (expires_at is null or expires_at > now())
  for update;

  if v_alert_id is null then
    raise exception 'Emergency sharing is unavailable';
  end if;

  insert into public.emergency_locations (alert_id, latitude, longitude)
  values (v_alert_id, p_latitude, p_longitude);

  update public.emergency_alerts
  set latitude = p_latitude,
      longitude = p_longitude
  where id = v_alert_id;
end;
$$;

create or replace function public.stop_emergency_share(p_update_token text)
returns void
language plpgsql
security definer
set search_path = pg_catalog
as $$
declare
  v_alert_id text;
begin
  if p_update_token is null or p_update_token !~ '^[0-9a-f]{64}$' then
    raise exception 'Invalid emergency sharing credentials';
  end if;

  update public.emergency_alerts
  set sharing_enabled = false,
      status = 'sharing-ended'
  where update_token = p_update_token
    and sharing_enabled = true
  returning id into v_alert_id;

  if v_alert_id is null then
    raise exception 'Emergency sharing is unavailable';
  end if;
end;
$$;

revoke all on function public.create_emergency_share(text, text, text, double precision, double precision, timestamptz) from public;
revoke all on function public.update_emergency_location(text, double precision, double precision) from public;
revoke all on function public.stop_emergency_share(text) from public;
grant execute on function public.create_emergency_share(text, text, text, double precision, double precision, timestamptz) to anon, authenticated;
grant execute on function public.update_emergency_location(text, double precision, double precision) to anon, authenticated;
grant execute on function public.stop_emergency_share(text) to anon, authenticated;
