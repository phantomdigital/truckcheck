-- Create calculation_history table to store calculation results for Pro users
-- Only Pro users will have their calculations stored (90 days retention)

create table public.calculation_history (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.users(id) on delete cascade not null,
  base_location jsonb not null,
  stops jsonb not null default '[]'::jsonb,
  destination jsonb not null,
  distance numeric(10, 2) not null,
  max_distance_from_base numeric(10, 2),
  driving_distance numeric(10, 2),
  logbook_required boolean not null,
  route_geometry jsonb,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable Row Level Security
alter table public.calculation_history enable row level security;

-- SECURITY: Only Pro users can view their own calculation history
create policy "Pro users can view own calculation history"
  on public.calculation_history for select
  using (
    auth.uid() = user_id
    and exists (
      select 1 from public.users
      where users.id = auth.uid()
      and users.subscription_status = 'pro'
    )
  );

-- SECURITY: Only Pro users can insert their own calculation history
create policy "Pro users can insert own calculation history"
  on public.calculation_history for insert
  with check (
    auth.uid() = user_id
    and exists (
      select 1 from public.users
      where users.id = auth.uid()
      and users.subscription_status = 'pro'
    )
  );

-- SECURITY: Only Pro users can delete their own calculation history
create policy "Pro users can delete own calculation history"
  on public.calculation_history for delete
  using (
    auth.uid() = user_id
    and exists (
      select 1 from public.users
      where users.id = auth.uid()
      and users.subscription_status = 'pro'
    )
  );

-- Create indexes for faster queries
create index calculation_history_user_id_idx on public.calculation_history(user_id);
create index calculation_history_created_at_idx on public.calculation_history(created_at desc);

-- Create function to automatically clean up old calculations (older than 90 days)
create or replace function public.cleanup_old_calculations()
returns void as $$
begin
  delete from public.calculation_history
  where created_at < now() - interval '90 days';
end;
$$ language plpgsql security definer;

-- Note: You can set up a cron job in Supabase to run this function periodically
-- Or call it manually when needed

