-- Add first_name and last_name columns to users table
-- Stripe collects this information, so we should store it

alter table public.users
  add column if not exists first_name text,
  add column if not exists last_name text;

-- Add indexes for name searches (useful for admin interfaces)
create index if not exists users_first_name_idx on public.users(first_name);
create index if not exists users_last_name_idx on public.users(last_name);

-- Add comment explaining the fields
comment on column public.users.first_name is 'User first name, collected from Stripe or sign-up form';
comment on column public.users.last_name is 'User last name, collected from Stripe or sign-up form';

