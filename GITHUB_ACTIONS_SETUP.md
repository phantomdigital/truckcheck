# GitHub Actions Setup Guide

This guide will help you set up automated deployments to your Supabase staging environment using GitHub Actions.

## Prerequisites

1. A Supabase staging project
2. A GitHub repository with your code
3. A `develop` branch for staging deployments

## Step 1: Create Required GitHub Secrets

You need to add the following secrets to your GitHub repository:

1. Go to your GitHub repository
2. Navigate to **Settings** → **Secrets and variables** → **Actions**
3. Click **New repository secret** and add the following:

### Required Secrets

| Secret Name | Description | How to Get It |
|------------|-------------|---------------|
| `STAGING_PROJECT_ID` | Your Supabase staging project reference ID | Go to your Supabase project → **Settings** → **General** → Copy the **Reference ID** |
| `STAGING_DB_PASSWORD` | Your staging database password | Go to your Supabase project → **Settings** → **Database** → Copy the database password (you set this when creating the project) |
| `SUPABASE_ACCESS_TOKEN` | Your personal Supabase access token | Go to https://supabase.com/dashboard/account/tokens → Click **Generate new token** → Give it a name and copy the token |

## Step 2: Create a Develop Branch

If you don't already have a `develop` branch, create one:

```bash
# Create and switch to develop branch
git checkout -b develop

# Push to GitHub
git push -u origin develop
```

## Step 3: Set Your Develop Branch as Default for Testing (Optional)

You can set the develop branch as the default branch for your repository during initial setup, or keep `main` as default and use `develop` for staging.

## Step 4: Test the Workflow

### Option 1: Push to Develop Branch
```bash
# Make sure you're on the develop branch
git checkout develop

# Make a change (or just push)
git push origin develop
```

### Option 2: Manual Trigger
1. Go to your GitHub repository
2. Navigate to **Actions** tab
3. Click on **Deploy Migrations to Staging** workflow
4. Click **Run workflow** button
5. Select the `develop` branch
6. Click **Run workflow**

## Step 5: Monitor the Deployment

1. Go to the **Actions** tab in your GitHub repository
2. Click on the running workflow
3. Watch the deployment progress
4. Check for any errors in the logs

## Workflow Details

The staging workflow (`staging.yaml`) does the following:

1. **Triggers**: Runs on every push to the `develop` branch or can be manually triggered
2. **Links to Project**: Connects to your Supabase staging project
3. **Pushes Migrations**: Applies all database migrations from `supabase/migrations/` to your staging database

## Troubleshooting

### Error: "Failed to link project"
- Check that `STAGING_PROJECT_ID` is correct
- Verify `SUPABASE_ACCESS_TOKEN` has the right permissions
- Ensure `STAGING_DB_PASSWORD` is correct

### Error: "Migration failed"
- Check your migration SQL files for syntax errors
- Verify the migrations haven't already been applied
- Check the Supabase dashboard for migration history

### Migrations Not Applying
- Ensure your migrations are in the `supabase/migrations/` directory
- Check that migration files follow the naming convention: `YYYYMMDDHHMMSS_description.sql`

## Current Migrations

Your project currently has these migrations:
- `20251110072640_create_users_subscription_table.sql`
- `20251110072643_create_calculation_history_table.sql`
- `20251110072700_add_subscription_rls_policies.sql`
- `20251110073732_add_subscription_rls_policies.sql`
- `20251110073910_create_recent_searches_table.sql`
- `20251110074000_create_recent_searches_table.sql`
- `20251110082624_add_user_names.sql`
- `20251110085845_add_depot_to_users.sql`
- `20251110202953_create_depots_table.sql`
- `20251111094019_update_handle_new_user_with_names.sql`

## Next Steps

Once staging is working, you can:
1. Create a production workflow (`production.yaml`) that deploys from the `main` branch
2. Add deployment notifications (Slack, Discord, etc.)
3. Add automated testing before deployment
4. Set up branch protection rules

## Best Practices

1. **Never commit secrets**: All sensitive data should be in GitHub Secrets
2. **Test in staging first**: Always deploy to staging before production
3. **Review migrations**: Check migration files before pushing
4. **Monitor deployments**: Watch the Actions tab after each push
5. **Use pull requests**: Merge to develop via PRs for better tracking

