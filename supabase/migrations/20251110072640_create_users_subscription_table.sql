-- Create users table to extend Supabase auth.users with subscription info
-- This table links to auth.users via user_id (UUID)

create table public.users (
  id uuid references auth.users on delete cascade primary key,
  email text unique not null,
  subscription_status text default 'free' check (subscription_status in ('free', 'pro', 'cancelled', 'past_due')),
  stripe_customer_id text unique,
  stripe_subscription_id text unique,
  subscription_current_period_end timestamp with time zone,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable Row Level Security
alter table public.users enable row level security;

-- Users can read their own data
create policy "Users can view own data"
  on public.users for select
  using (auth.uid() = id);

-- Users can update their own data
create policy "Users can update own data"
  on public.users for update
  using (auth.uid() = id);

-- Create function to automatically create user profile on signup
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.users (id, email)
  values (new.id, new.email);
  return new;
end;
$$ language plpgsql security definer;

-- Trigger to create user profile when auth user is created
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- Create index for faster lookups
create index users_stripe_customer_id_idx on public.users(stripe_customer_id);
create index users_subscription_status_idx on public.users(subscription_status);

-- Create function to update updated_at timestamp
create or replace function public.handle_updated_at()
returns trigger as $$
begin
  new.updated_at = timezone('utc'::text, now());
  return new;
end;
$$ language plpgsql;

-- Trigger to update updated_at on user updates
create trigger update_users_updated_at
  before update on public.users
  for each row execute procedure public.handle_updated_at();

