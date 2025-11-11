-- Create depots table for Pro users to save multiple depot locations
-- Replaces single depot columns on users table

create table if not exists public.depots (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  address text not null,
  lat double precision not null,
  lng double precision not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  
  constraint depots_lat_check check (lat >= -90 and lat <= 90),
  constraint depots_lng_check check (lng >= -180 and lng <= 180)
);

-- Add indexes
create index if not exists depots_user_id_idx on public.depots(user_id);
create index if not exists depots_created_at_idx on public.depots(created_at desc);

-- Enable RLS
alter table public.depots enable row level security;

-- RLS policies
create policy "Users can view their own depots"
  on public.depots for select
  using (auth.uid() = user_id);

create policy "Pro users can insert depots"
  on public.depots for insert
  with check (
    auth.uid() = user_id and
    exists (
      select 1 from public.users
      where id = auth.uid()
      and subscription_status = 'pro'
    )
  );

create policy "Users can update their own depots"
  on public.depots for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "Users can delete their own depots"
  on public.depots for delete
  using (auth.uid() = user_id);

-- Add comments
comment on table public.depots is 'Saved depot locations for Pro users (multiple depots allowed)';
comment on column public.depots.address is 'Full address of the depot (used as display name)';
comment on column public.depots.lat is 'Latitude of the depot location';
comment on column public.depots.lng is 'Longitude of the depot location';

-- Migrate existing depot data from users table (if any)
insert into public.depots (user_id, address, lat, lng, created_at)
select 
  id as user_id,
  depot_address as address,
  depot_lat as lat,
  depot_lng as lng,
  now() as created_at
from public.users
where depot_address is not null 
  and depot_lat is not null 
  and depot_lng is not null
  and subscription_status = 'pro';

-- Remove old depot columns from users table
alter table public.users
  drop column if exists depot_name,
  drop column if exists depot_address,
  drop column if exists depot_lat,
  drop column if exists depot_lng;

