-- Custom Access Token Hook
-- This hook adds user metadata to JWT claims for client-side access
-- Includes: subscription_status, first_name, last_name
-- Docs: https://supabase.com/docs/guides/auth/auth-hooks/custom-access-token-hook

create or replace function public.custom_access_token(event jsonb)
returns jsonb
language plpgsql
stable
as $$
declare
  user_metadata jsonb;
  claims jsonb;
begin
  -- Fetch user metadata from public.users table
  select jsonb_build_object(
    'subscription_status', subscription_status,
    'first_name', first_name,
    'last_name', last_name,
    'stripe_customer_id', stripe_customer_id
  )
  into user_metadata
  from public.users
  where id = (event->>'user_id')::uuid;

  -- If user not found in public.users, return event unchanged
  if user_metadata is null then
    return event;
  end if;

  -- Get existing claims
  claims := event->'claims';

  -- Add user metadata to claims
  claims := claims || user_metadata;

  -- Update event with new claims
  event := jsonb_set(event, '{claims}', claims);

  return event;
end;
$$;

-- Grant execute permission to supabase_auth_admin role
grant execute on function public.custom_access_token to supabase_auth_admin;

-- Revoke execute from public and authenticated roles for security
revoke execute on function public.custom_access_token from authenticated, anon, public;

-- Add comment explaining the function
comment on function public.custom_access_token is 'Custom access token hook that adds user subscription status and profile data to JWT claims';

