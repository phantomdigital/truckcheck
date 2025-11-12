# Deployment Pipeline Setup Checklist

Follow these steps to enable automated deployments where Vercel deploys **only after** migrations succeed.

## Step 1: Get Vercel Token

**CRITICAL:** Create the token scoped to your **Phantom Digital team**, not your personal account.

1. Go to https://vercel.com/account/tokens
2. **Make sure you're viewing tokens for your team** (switch to "Phantom Digital" team if needed)
3. Click **"Create Token"**
4. Name it: `GitHub Actions` (or similar)
5. **Ensure it's scoped to your team** (not your personal account)
6. Copy the token (you won't see it again!)
7. ✅ **Add to GitHub Secrets:** `VERCEL_TOKEN`

## Step 2: Get Vercel Team/Org ID

**CRITICAL:** You need the **Team ID** (Phantom Digital), NOT your personal account ID.

**Note:** Vercel uses "Team ID" and "Org ID" interchangeably - they're the same thing.

1. Go to your **Phantom Digital** team page: `https://vercel.com/phantom-digital` (or switch to your team in the Vercel dashboard)
2. Go to **Settings** → **General** (team settings, not your personal account settings)
3. Look for **"Team ID"** - this is what you need
4. **Alternative:** The Team ID is also in the URL when viewing team settings: `https://vercel.com/[TEAM_ID]/settings`
5. ✅ **Add to GitHub Secrets:** `VERCEL_ORG_ID` (use the **Team ID**, not your personal account ID)

**Important:** If you're using a personal account ID instead of the team ID, deployments will fail with scope errors.

## Step 3: Get Vercel Project IDs

**Important:** This depends on your Vercel setup:

### Option A: Same Vercel Project for Both Branches (Most Common)
If you use **one Vercel project** with different branches (`develop` and `main`):
1. Go to your Vercel project
2. **Settings** → **General**
3. Scroll to **"Project ID"**
4. Copy the ID
5. ✅ **Add to GitHub Secrets:**
   - `VERCEL_STAGING_PROJECT_ID` = (same Project ID)
   - `VERCEL_PRODUCTION_PROJECT_ID` = (same Project ID)

**Use the same Project ID for both secrets.**

### Option B: Separate Vercel Projects
If you use **separate Vercel projects** for staging and production:

**For Staging (develop branch):**
1. Go to your staging Vercel project
2. **Settings** → **General** → Copy **"Project ID"**
3. ✅ Add as `VERCEL_STAGING_PROJECT_ID`

**For Production (main branch):**
1. Go to your production Vercel project
2. **Settings** → **General** → Copy **"Project ID"**
3. ✅ Add as `VERCEL_PRODUCTION_PROJECT_ID`

**Use different Project IDs for each secret.**

## Step 4: Add Secrets to GitHub

1. Go to your GitHub repository
2. **Settings** → **Secrets and variables** → **Actions**
3. Click **"New repository secret"**
4. Add each secret:
   - `VERCEL_TOKEN`
   - `VERCEL_ORG_ID`
   - `VERCEL_STAGING_PROJECT_ID`
   - `VERCEL_PRODUCTION_PROJECT_ID`

## Step 5: Disable Vercel Auto-Deploy (CRITICAL)

**This is essential** - prevents race conditions where code deploys before migrations.

### Option A: Using Ignored Build Step (Recommended - Use This)

Since you don't see branch-specific settings, use the "Ignored Build Step" feature:

1. Go to your Vercel project
2. **Settings** → **Git** → Scroll to **"Ignored Build Step"** section
3. Change from **"Automatic"** to **"Custom"**
4. Enter this command:
   ```bash
   echo "Skipping auto-deploy - GitHub Actions will deploy after migrations"
   exit 1
   ```
5. Click **"Save"**

**How it works:**
- This prevents ALL automatic deployments from Git pushes
- GitHub Actions deploys via Vercel CLI/API, which **bypasses** this check
- So only GitHub Actions deployments will happen (after migrations succeed)

### Option B: Using Branch Protection (If Available)

If you see branch-specific settings:

1. Go to **Settings** → **Git** → **Production Branch** (or branch settings)
2. Look for **"Auto-deploy"** toggle for each branch
3. **Disable** auto-deploy for both `develop` and `main` branches

### Option C: Disconnect Git (Not Recommended)

As a last resort, you could disconnect the Git repository and deploy only via GitHub Actions, but this loses PR previews and other Git integration features.

## Step 6: Verify Setup

1. Push a test commit to `develop` branch
2. Go to GitHub **Actions** tab
3. Watch the workflow run:
   - ✅ Should link to Supabase
   - ✅ Should run migrations
   - ✅ Should deploy to Vercel (only if migrations succeed)
4. Check Vercel dashboard - deployment should appear after migrations complete

## Quick Reference: All Required Secrets

### Supabase (You should already have these):
- ✅ `STAGING_PROJECT_ID`
- ✅ `STAGING_DB_PASSWORD`
- ✅ `PRODUCTION_PROJECT_ID`
- ✅ `PRODUCTION_DB_PASSWORD`
- ✅ `SUPABASE_ACCESS_TOKEN`

### Vercel (New - Add these):
- ⬜ `VERCEL_TOKEN`
- ⬜ `VERCEL_ORG_ID`
- ⬜ `VERCEL_STAGING_PROJECT_ID`
- ⬜ `VERCEL_PRODUCTION_PROJECT_ID`

## How It Works

```
You push code to develop/main
    ↓
GitHub Actions starts
    ↓
Runs Supabase migrations
    ↓
✅ Migrations succeed?
    ├─ Yes → Deploys to Vercel automatically
    └─ No → Stops (no deployment, code stays on old version)
```

## Troubleshooting

### "Vercel deployment failed"
- Check that all 4 Vercel secrets are added correctly
- Verify Project IDs match your Vercel projects
- Ensure Vercel token has correct permissions

### "Code deployed before migrations"
- Verify auto-deploy is disabled in Vercel for both branches
- Check GitHub Actions logs to see workflow order

### "Migrations failed, but code still deployed"
- This shouldn't happen - check that `if: success()` is in workflow
- Verify migrations step completed before Vercel step

## Need Help?

- Check `DEPLOYMENT_SETUP.md` for detailed explanations
- Review GitHub Actions logs for specific errors
- Verify all secrets are set correctly in GitHub Settings

