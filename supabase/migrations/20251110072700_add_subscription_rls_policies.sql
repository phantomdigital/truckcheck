-- Add additional RLS policies for subscription-based access control
-- This provides database-level security enforcement

-- Drop existing policies that don't check subscription status
drop policy if exists "Users can view own calculation history" on public.calculation_history;
drop policy if exists "Users can insert own calculation history" on public.calculation_history;
drop policy if exists "Users can delete own calculation history" on public.calculation_history;

-- Drop the Pro policies if they exist (for idempotency)
drop policy if exists "Pro users can view own calculation history" on public.calculation_history;
drop policy if exists "Pro users can insert own calculation history" on public.calculation_history;
drop policy if exists "Pro users can delete own calculation history" on public.calculation_history;

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

-- Create index on subscription_status for faster policy checks
create index if not exists users_subscription_status_idx on public.users(subscription_status);

-- Add comment explaining the security model
comment on policy "Pro users can view own calculation history" on public.calculation_history is 
  'Database-level enforcement: Only Pro subscribers can access calculation history. This prevents bypassing application-layer checks.';

comment on policy "Pro users can insert own calculation history" on public.calculation_history is 
  'Database-level enforcement: Only Pro subscribers can save calculations to history. Even if Server Actions are bypassed, database will reject the insert.';

comment on policy "Pro users can delete own calculation history" on public.calculation_history is 
  'Database-level enforcement: Only Pro subscribers can delete their history records.';

