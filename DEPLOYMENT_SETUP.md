# Deployment Setup Guide

This guide explains how to set up consistent staging and production deployments with migrations running before code deployment.

## Overview

Both staging and production workflows follow the same pattern:
1. **Run database migrations first** (Supabase)
2. **Deploy code only if migrations succeed** (Vercel)

This ensures database schema is always ready before code goes live, preventing runtime errors.

## Required GitHub Secrets

Add these secrets to your GitHub repository:
**Settings** → **Secrets and variables** → **Actions** → **New repository secret**

### Supabase Secrets (Already Set Up)
- `STAGING_PROJECT_ID` - Your staging Supabase project reference ID
- `STAGING_DB_PASSWORD` - Your staging database password
- `PRODUCTION_PROJECT_ID` - Your production Supabase project reference ID
- `PRODUCTION_DB_PASSWORD` - Your production database password
- `SUPABASE_ACCESS_TOKEN` - Your Supabase access token (shared)

### Vercel Secrets (New - Required)

1. **Get Vercel Token:**
   - Go to https://vercel.com/account/tokens
   - Click **Create Token**
   - Give it a name (e.g., "GitHub Actions")
   - Copy the token
   - Add as secret: `VERCEL_TOKEN`

2. **Get Vercel Team/Org ID:**
   - **Note:** Vercel uses "Team ID" and "Org ID" interchangeably - they're the same thing
   - Go to https://vercel.com/account
   - Your Team/Org ID is visible in:
     - The URL: `https://vercel.com/[TEAM_ID]/...`
     - Or go to **Settings** → **General** → Look for "Team ID"
     - Or check your team settings page
   - Add as secret: `VERCEL_ORG_ID` (use your Team ID value - the GitHub Action accepts either)

3. **Get Vercel Project IDs:**
   
   **Option A: Same Vercel Project (Most Common)**
   - If you use one Vercel project with different branches:
   - Go to **Settings** → **General** → Copy **"Project ID"**
   - Use the **same Project ID** for both secrets:
     - `VERCEL_STAGING_PROJECT_ID` = (same ID)
     - `VERCEL_PRODUCTION_PROJECT_ID` = (same ID)
   
   **Option B: Separate Vercel Projects**
   - If you use separate projects for staging and production:
   - Get Project ID from each project's **Settings** → **General**
   - Use **different Project IDs** for each secret:
     - `VERCEL_STAGING_PROJECT_ID` = (staging project ID)
     - `VERCEL_PRODUCTION_PROJECT_ID` = (production project ID)

## Vercel Configuration

### Disable Auto-Deploy

**Important:** Disable Vercel auto-deploy for both `develop` and `main` branches to prevent race conditions.

1. Go to your Vercel project
2. **Settings** → **Git**
3. For each branch (`develop` and `main`):
   - Find the branch in the list
   - Click **Edit**
   - **Disable** "Auto-deploy"
   - Save

This ensures deployments only happen via GitHub Actions, after migrations complete.

## Workflow Behavior

### Staging (`develop` branch)
- Triggered on push to `develop` or manual trigger
- Runs migrations to staging Supabase project
- Deploys to Vercel staging/preview environment
- Only deploys if migrations succeed

### Production (`main` branch)
- Triggered on push to `main` or manual trigger
- Runs migrations to production Supabase project
- Deploys to Vercel production environment
- Only deploys if migrations succeed

## Deployment Flow

```
Push to branch
    ↓
GitHub Actions triggered
    ↓
Link to Supabase project
    ↓
Run database migrations
    ↓
✅ Migrations succeed?
    ├─ Yes → Deploy to Vercel
    └─ No → Stop (no deployment)
```

## Benefits

1. **No Race Conditions:** Migrations always complete before code deploys
2. **Consistent Setup:** Staging and production use identical workflows
3. **Safe Deployments:** Code only deploys if migrations succeed
4. **Automated:** No manual steps required after initial setup

## Troubleshooting

### Migrations Fail
- Check migration SQL for errors
- Verify Supabase project credentials
- Check Supabase project status (not paused)
- Review GitHub Actions logs

### Vercel Deployment Fails
- Verify Vercel secrets are correct
- Check Vercel project IDs match your projects
- Ensure Vercel token has correct permissions
- Review GitHub Actions logs for Vercel errors

### Code Deploys Before Migrations
- Verify auto-deploy is disabled in Vercel
- Check that workflows are running in correct order
- Ensure `if: success()` condition is working

## Manual Deployment

If you need to deploy manually:

1. **Via GitHub Actions:**
   - Go to **Actions** tab
   - Select workflow (Staging or Production)
   - Click **Run workflow**
   - Select branch and run

2. **Via Vercel Dashboard:**
   - Go to your project
   - Click **Deployments**
   - Click **Redeploy** (only if migrations already ran)

## Best Practices

1. **Always test migrations in staging first**
2. **Review migration SQL before pushing**
3. **Monitor GitHub Actions logs after each push**
4. **Keep staging and production workflows identical**
5. **Use feature flags for risky migrations**

