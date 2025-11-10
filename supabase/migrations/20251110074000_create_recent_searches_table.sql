-- Create recent_searches table for Pro users
-- This stores recent search history with proper access control

create table public.recent_searches (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.users(id) on delete cascade not null,
  base_location jsonb not null,
  stops jsonb not null default '[]'::jsonb,
  distance numeric(10, 2) not null,
  logbook_required boolean not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable Row Level Security
alter table public.recent_searches enable row level security;

-- SECURITY: Only Pro users can view their own recent searches
create policy "Pro users can view own recent searches"
  on public.recent_searches for select
  using (
    auth.uid() = user_id
    and exists (
      select 1 from public.users
      where users.id = auth.uid()
      and users.subscription_status = 'pro'
    )
  );

-- SECURITY: Only Pro users can insert their own recent searches
create policy "Pro users can insert own recent searches"
  on public.recent_searches for insert
  with check (
    auth.uid() = user_id
    and exists (
      select 1 from public.users
      where users.id = auth.uid()
      and users.subscription_status = 'pro'
    )
  );

-- SECURITY: Only Pro users can delete their own recent searches
create policy "Pro users can delete own recent searches"
  on public.recent_searches for delete
  using (
    auth.uid() = user_id
    and exists (
      select 1 from public.users
      where users.id = auth.uid()
      and users.subscription_status = 'pro'
    )
  );

-- Create indexes for faster queries
create index recent_searches_user_id_idx on public.recent_searches(user_id);
create index recent_searches_created_at_idx on public.recent_searches(created_at desc);

-- Create function to automatically clean up old searches (keep only last 20)
create or replace function public.cleanup_old_recent_searches()
returns trigger as $$
begin
  delete from public.recent_searches
  where user_id = new.user_id
  and id not in (
    select id from public.recent_searches
    where user_id = new.user_id
    order by created_at desc
    limit 20
  );
  return new;
end;
$$ language plpgsql security definer;

-- Trigger to automatically clean up when inserting new searches
create trigger cleanup_recent_searches_trigger
  after insert on public.recent_searches
  for each row execute procedure public.cleanup_old_recent_searches();

-- Add comments
comment on table public.recent_searches is 
  'Pro-only feature: Recent search history stored in database for cross-device sync';

comment on policy "Pro users can view own recent searches" on public.recent_searches is 
  'Database-level enforcement: Only Pro subscribers can access recent searches';

