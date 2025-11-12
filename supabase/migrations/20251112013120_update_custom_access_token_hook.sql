-- Update Custom Access Token Hook with better error handling and defaults
-- This fixes the race condition where the hook runs before the user record is created

create or replace function public.custom_access_token(event jsonb)
returns jsonb
language plpgsql
security definer
stable
set search_path = public
as $$
declare
  user_metadata jsonb;
  claims jsonb;
  user_record record;
begin
  -- Try to fetch user metadata from public.users table
  -- Use exception handling in case table access fails
  begin
    select 
      subscription_status,
      first_name,
      last_name,
      stripe_customer_id
    into user_record
    from public.users
    where id = (event->>'user_id')::uuid;
    
    -- If user found in public.users, add their data to claims
    if found then
      user_metadata := jsonb_build_object(
        'subscription_status', coalesce(user_record.subscription_status, 'free'),
        'first_name', coalesce(user_record.first_name, ''),
        'last_name', coalesce(user_record.last_name, ''),
        'stripe_customer_id', user_record.stripe_customer_id
      );
      
      -- Get existing claims
      claims := event->'claims';
      
      -- Add user metadata to claims
      claims := claims || user_metadata;
      
      -- Update event with new claims
      event := jsonb_set(event, '{claims}', claims);
    end if;
    
  exception
    when others then
      -- If any error occurs, log it but don't fail the authentication
      -- Just return the event unchanged
      raise warning 'custom_access_token hook error: %', sqlerrm;
  end;
  
  return event;
end;
$$;

-- Ensure proper grants
grant execute on function public.custom_access_token to supabase_auth_admin;
revoke execute on function public.custom_access_token from authenticated, anon, public;

-- Update comment
comment on function public.custom_access_token is 'Custom access token hook that safely adds user subscription status and profile data to JWT claims, with error handling for race conditions';

