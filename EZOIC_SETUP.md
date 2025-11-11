# Ezoic Integration Setup Guide

This project has been configured to use Ezoic instead of Google AdSense. The header scripts have been added according to Ezoic's official integration guide.

## Prerequisites

1. **Sign up for Ezoic**: Visit [ezoic.com](https://www.ezoic.com) and create an account
2. **Add your website**: Add your domain to your Ezoic account
3. **Complete verification**: Follow Ezoic's verification process for your domain

## ✅ Step 1: Header Scripts (Already Configured)

The following scripts have been added to `app/layout.tsx` at the top of the `<head>` tag:

1. **Privacy Scripts** (loaded first):
   - `https://cmp.gatekeeperconsent.com/min.js`
   - `https://the.gatekeeperconsent.com/cmp.min.js`

2. **Header Script**:
   - `//www.ezojs.com/ezoic/sa.min.js`
   - Initialization script with `window.ezstandalone`

These scripts are configured with the correct loading order and attributes (`data-cfasync="false"` for privacy scripts).

## ✅ Step 2: Ads.txt Setup (Already Configured)

The ads.txt file has been configured to automatically redirect to Ezoic's ads.txt manager, which keeps your ads.txt file updated automatically.

### Configuration Required

**Option 1: Using Environment Variable (Recommended)**

1. Add your domain to your `.env.local` file (or your hosting environment variables):
   ```bash
   EZOIC_ADS_TXT_DOMAIN=truckcheck.com.au
   ```
   Replace `truckcheck.com.au` with your actual domain name.

2. The redirect is already configured in `next.config.ts` and will automatically redirect `/ads.txt` to Ezoic's manager.

**Option 2: Manual Configuration**

If you prefer not to use environment variables, edit `next.config.ts` and replace `YOUR_DOMAIN.com` with your actual domain:

```typescript
const domain = process.env.EZOIC_ADS_TXT_DOMAIN || "yourdomain.com";
```

### How It Works

- When someone visits `yourdomain.com/ads.txt`, they'll be redirected (301) to Ezoic's ads.txt manager
- Ezoic automatically manages and updates the ads.txt content
- No manual updates required - Ezoic handles everything

### Testing

1. Visit `yourdomain.com/ads.txt` in your browser
2. You should be redirected to Ezoic's ads.txt manager
3. Verify you see a list of authorized ad sellers
4. Clear your website cache if the redirect doesn't work immediately

### Alternative: Static File (Not Recommended)

If you prefer a static file instead of a redirect, you can:

1. Get your ads.txt content from Ezoic's manager: `https://srv.adstxtmanager.com/19390/yourdomain.com`
2. Create `public/ads.txt` with that content
3. Remove the redirect from `next.config.ts`
4. **Note**: You'll need to manually update this file when Ezoic updates their ads.txt content

## ✅ Step 3: Ad Placements (Already Configured)

Ad placement components have been configured according to Ezoic's official integration guide. The components automatically:
- Create the correct placeholder div format: `<div id="ezoic-pub-ad-placeholder-XXX"></div>`
- Call `ezstandalone.showAds(XXX)` to display ads
- Follow Ezoic's guidelines (no styling on placeholder divs)

### Current Ad Placements

The following placement IDs are currently configured (you'll need to create these in your Ezoic dashboard):

- **Placement ID 101**: Footer section (`components/footer.tsx`)
- **Placement ID 102**: Before map in results (`components/logbook/result-display.tsx`)
- **Placement ID 103**: Sidebar (`app/logbook-checker.tsx`)

### Create Placements in Ezoic Dashboard

1. Log into your Ezoic dashboard
2. Navigate to **Ad Placements** or **Ad Tester**
3. Create new placements with IDs: **101**, **102**, and **103**
4. Configure each placement's settings (size, position, etc.)

### Using Ezoic Ad Tester Chrome Extension (Recommended)

1. Install the [Ezoic Ad Tester Chrome Extension](https://chrome.google.com/webstore)
2. Visit your website
3. Use the extension to add ad placeholders where you want ads
4. The extension will generate placement IDs
5. Update the `placementId` prop in your components to match the IDs from the extension

### Update Placement IDs

If you create different placement IDs in your Ezoic dashboard, update them in these files:

- `components/footer.tsx`: Change `placementId={101}` to your footer placement ID
- `components/logbook/result-display.tsx`: Change `placementId={102}` to your map ad placement ID
- `app/logbook-checker.tsx`: Change `placementId={103}` to your sidebar placement ID

## Step 4: Enable Monetization

1. Log into your Ezoic dashboard
2. Navigate to the **Monetization** tab
3. Enable monetization for your site
4. Ads should start appearing within 24-48 hours

## Step 5: Testing

1. **Development Mode**: Ads show as placeholder boxes in development (this is expected)
2. **Production**: Deploy to production and verify ads are loading
3. **Ezoic Dashboard**: Check your Ezoic dashboard for ad serving statistics
4. **Browser Console**: Check for any JavaScript errors related to Ezoic scripts

## Alternative Integration Methods

While the current setup uses JavaScript integration, Ezoic offers other methods:

### Name Server Integration (Recommended for Best Performance)
- Provides full access to Ezoic features
- Best performance and optimization
- Requires changing your domain's nameservers to Ezoic's
- May take 24-48 hours for DNS propagation

### Cloudflare Integration
- If you use Cloudflare, you can integrate directly
- Maintains your existing DNS setup
- Good performance without changing nameservers

## Component Usage

The Ezoic components use numeric placement IDs that match your Ezoic dashboard:

```tsx
import { ResponsiveAd, InlineAd, AdUnit } from "@/components/ezoic"

// Responsive ad (auto-sizing)
<ResponsiveAd placementId={101} />

// Inline rectangular ad
<InlineAd placementId={102} />

// Custom ad unit
<AdUnit placementId={103} />
```

**Important**: 
- The `placementId` prop is a **number** (not a string)
- It should match the numeric ID from your Ezoic dashboard (e.g., 101, 102, 103)
- The component automatically formats it as `ezoic-pub-ad-placeholder-XXX`
- The component automatically calls `ezstandalone.showAds(placementId)` to display the ad

### How It Works

Each component:
1. Creates a `<div id="ezoic-pub-ad-placeholder-XXX"></div>` element
2. Calls `ezstandalone.showAds(XXX)` when the component mounts
3. Automatically destroys the placeholder when unmounted (for dynamic content)
4. Follows Ezoic's guidelines (no styling on the placeholder div itself)
5. Shows a placeholder in development mode for testing

### Route Refresh Component

The `<EzoicRouteRefresh />` component (already added to your layout):
- Automatically detects Next.js route changes
- Calls `ezstandalone.showAds()` to refresh all ads on new pages
- No configuration needed - it works automatically

## ✅ Dynamic Content Support (Already Configured)

The implementation includes support for dynamic content and Next.js client-side navigation:

### Route Changes (Automatic)

The `<EzoicRouteRefresh />` component has been added to your root layout. It automatically:
- Detects when users navigate between pages in Next.js
- Calls `ezstandalone.showAds()` to refresh ads on the new page
- Works seamlessly with Next.js App Router

### Component Cleanup (Automatic)

Each `AdUnit` component automatically:
- Destroys its placeholder when unmounted
- Prevents duplicate placeholders on the same page
- Handles dynamic content loading/unloading

### Manual Dynamic Content Management

For advanced scenarios (infinite scroll, dynamic content loading), you can use the utility functions:

```tsx
import { showEzoicAds, destroyEzoicPlaceholders } from "@/lib/ezoic/hooks"

// Show new ads when content loads
function handleNewContent() {
  showEzoicAds(104, 105) // Show new placement IDs
}

// Clean up ads when content is removed
function handleContentRemoved() {
  destroyEzoicPlaceholders(102, 103) // Destroy old placement IDs
}

// Reuse placeholders (destroy then show again)
function handleInfiniteScroll() {
  destroyEzoicPlaceholders(102, 103, 104)
  showEzoicAds(102, 103, 104) // Reuse the same IDs
}
```

### Infinite Scroll Example

If you implement infinite scroll, you can manage ads like this:

```tsx
"use client"

import { useEffect, useState } from "react"
import { showEzoicAds, destroyEzoicPlaceholders } from "@/lib/ezoic/hooks"

export function InfiniteScrollContent() {
  const [articles, setArticles] = useState([1, 2, 3])

  useEffect(() => {
    // Show initial ads for first article
    showEzoicAds(102, 103, 104)
  }, [])

  const loadMoreArticles = () => {
    // Destroy old ads before loading new content
    destroyEzoicPlaceholders(102, 103, 104)
    
    // Load new articles
    setArticles([...articles, articles.length + 1])
    
    // Show ads for new content (reusing same IDs)
    setTimeout(() => {
      showEzoicAds(102, 103, 104)
    }, 100)
  }

  return (
    <div>
      {articles.map((article) => (
        <div key={article}>Article {article}</div>
      ))}
      <button onClick={loadMoreArticles}>Load More</button>
    </div>
  )
}
```

## Troubleshooting

1. **Ads not showing**: 
   - Verify your site is fully verified in Ezoic
   - Ensure monetization is enabled in your Ezoic dashboard
   - Check that placement IDs in your components match the IDs in your Ezoic dashboard
   - Verify the scripts are loading (check browser console Network tab)
   - Check browser console for JavaScript errors
   - Wait 24-48 hours after initial setup for ads to start serving
   - For route changes, ensure `<EzoicRouteRefresh />` is in your layout

2. **Wrong ad sizes**:
   - Ezoic automatically optimizes ad sizes
   - You can configure preferences in the Ezoic dashboard
   - The `adFormat` prop is a hint, Ezoic will optimize

3. **Performance issues**:
   - Consider switching to Name Server integration for better performance
   - Use Ezoic's LEAP tool for site speed optimization

## Additional Resources

- [Ezoic Documentation](https://support.ezoic.com/)
- [Ezoic Integration Guide](https://www.ezoic.com/integration/)
- [Ezoic Ad Tester](https://www.ezoic.com/ad-tester/)

## Notes

- Ezoic typically provides higher revenue than AdSense due to access to premium ad networks
- Ezoic uses AI to optimize ad placements automatically
- You may need to wait 24-48 hours after integration for ads to start serving optimally
- Ezoic requires a minimum traffic threshold (usually 10,000+ monthly visitors)

