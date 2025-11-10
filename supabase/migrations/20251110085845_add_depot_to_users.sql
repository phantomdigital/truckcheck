-- Add depot address fields to users table for Pro users
-- Depot = saved home base location that can be quickly toggled on/off

alter table public.users
  add column if not exists depot_name text,
  add column if not exists depot_address text,
  add column if not exists depot_lat double precision,
  add column if not exists depot_lng double precision;

-- Add indexes for depot queries
create index if not exists users_depot_address_idx on public.users(depot_address) where depot_address is not null;

-- Add comments explaining the fields
comment on column public.users.depot_name is 'Friendly name for the depot (e.g., "Main Depot", "Sydney Warehouse")';
comment on column public.users.depot_address is 'Full address of the depot';
comment on column public.users.depot_lat is 'Latitude of the depot location';
comment on column public.users.depot_lng is 'Longitude of the depot location';

