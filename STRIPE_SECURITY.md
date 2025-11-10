# Stripe Subscription Security Architecture

This document explains how subscription-based features are protected with defense-in-depth security.

## Three-Layer Security Model

### Layer 1: Client-Side (UX Only)
**Purpose**: Provide good user experience, show upgrade prompts
**Can be bypassed**: YES - users can modify React state in dev tools
**Examples**:
- Disabled buttons with lock icons
- Conditional rendering based on `isPro` prop
- Ad display toggling

### Layer 2: Server-Side Validation  
**Purpose**: Verify subscription status before operations
**Can be bypassed**: NO - runs on server, user has no access
**Implementation**:
- Server Components (`page.tsx`) call `getSubscriptionStatus()` to fetch from database
- Server Actions validate subscription before mutations
- `isPro` prop is derived from server-side database query
- Initial page render includes/excludes ads based on server decision

### Layer 3: Database RLS Policies
**Purpose**: Ultimate enforcement at database level
**Can be bypassed**: NO - PostgreSQL enforces regardless of application code
**Implementation**:
- RLS policies check `users.subscription_status = 'pro'` before allowing operations
- Even if Server Actions are bypassed, database rejects unauthorized queries
- Applies to: `calculation_history`, `recent_searches` tables

## Critical Understanding: Where Validation Happens

```
┌─────────────────────────────────────────────────────────┐
│ page.tsx (Server Component)                             │
│                                                          │
│ const { isPro } = await getSubscriptionStatus()         │
│     └─> Queries Supabase database                       │
│     └─> Returns subscription_status from users table    │
│                                                          │
│ return <LogbookChecker isPro={isPro} />                 │
│     └─> Server renders initial HTML with isPro value    │
└─────────────────────────────────────────────────────────┘
                          │
                          │ SSR (Server-Side Rendered HTML)
                          ↓
┌─────────────────────────────────────────────────────────┐
│ Client Browser                                           │
│                                                          │
│ - Receives HTML with isPro={true/false} from server     │
│ - React hydrates with server-provided isPro value       │
│ - User COULD modify isPro in React state after hydration│
│   └─> But only affects UI (ads visibility)              │
│   └─> Cannot access protected data (RLS blocks it)      │
│   └─> Cannot perform protected actions (Server Actions  │
│       validate subscription independently)               │
└─────────────────────────────────────────────────────────┘
```

## Feature Protection

### 1. Multiple Stops (Pro Feature)
- **Client**: Button disabled for free users (`isPro` prop)
- **Server**: `validateMultipleStops()` called before `addStop()` executes
- **RLS**: N/A (calculation is client-side, but history requires Pro)
- **Risk Level**: LOW - Server validation prevents adding stops without Pro subscription
  - Cannot bypass without modifying server code
  - Cannot save to history (also server-validated)
  - Provides true enforcement at application layer

### 2. CSV Import (Pro Feature)
- **Client**: Button disabled, CSV processing happens in browser
- **Server**: `validateCSVImport()` called at start of `handleImport()` function
- **RLS**: N/A (client-side file processing)
- **Risk Level**: LOW - Server validation prevents CSV import without Pro subscription
  - Cannot bypass without modifying server code
  - Client-side processing maintains performance
  - True enforcement at application layer

### 3. PDF Export (Pro Feature)
- **Client**: Button disabled, shows lock icon, PDF generated via html2canvas
- **Server**: `validatePDFExport()` called at start of `handlePrintClick()` function
- **RLS**: N/A (client-side PDF generation from data already on screen)
- **Risk Level**: LOW - Server validation prevents PDF export without Pro subscription
  - Cannot bypass without modifying server code
  - Client-side generation maintains performance
  - True enforcement at application layer

### 4. Calculation History (Pro Feature)
- **Client**: Component only rendered if `isPro = true`
- **Server**: `saveCalculationToHistory()` checks subscription status
- **RLS**: `calculation_history` table policies require `subscription_status = 'pro'`
- **Risk Level**: PROTECTED - three-layer security

### 5. Recent Searches (Pro Feature)
- **Client**: Component only rendered if `isPro = true`
- **Server**: `saveRecentSearch()` and `getRecentSearches()` check subscription status
- **RLS**: `recent_searches` table policies require `subscription_status = 'pro'`
- **Risk Level**: PROTECTED - three-layer security

### 6. Ad-Free Experience (Pro Feature)
- **Client**: Ads conditionally rendered based on `isPro` prop
- **Server**: `page.tsx` (Server Component) calls `getSubscriptionStatus()` → passes `isPro` to client
- **RLS**: N/A (no database operation, ads are 3rd-party JavaScript)
- **Risk Level**: LOW - user could hide ads themselves (equivalent to ad blocker)
- **Security Note**: User could theoretically modify `isPro` prop after hydration to hide ads, but this:
  - Doesn't leak data (ads are 3rd party)
  - Doesn't cause financial loss  
  - Is equivalent to using an ad blocker
  - Cannot be used to gain Pro features (those are server/RLS protected)

## Security Flow Example

### Scenario: Free user tries to save calculation history

#### Normal Flow (Free User):
1. Page loads → `page.tsx` (Server Component) calls `getSubscriptionStatus()` → database query → returns `isPro: false`
2. Server renders HTML with `isPro = false` prop
3. Client hydrates with `isPro = false`
4. Ads are shown, Pro features are hidden
5. Calculation history not saved (silent)

#### Attack Scenario 1: User modifies React state
1. User opens dev tools, modifies state to `isPro = true`
2. UI changes to show Pro features, ads disappear
3. User clicks "Save History"
4. **Server Action `saveCalculationToHistory()` validates subscription** → REJECTED
5. Error: "Pro subscription required"

#### Attack Scenario 2: User intercepts Server Action call
1. User intercepts and modifies Server Action call
2. Tries to call `saveCalculationToHistory()` directly
3. **Server Action checks database** → User is not Pro → REJECTED
4. Error: "Pro subscription required"

#### Attack Scenario 3: Direct database access attempt
1. User somehow bypasses Server Actions entirely
2. Tries to INSERT directly into `calculation_history` table
3. **PostgreSQL RLS policy checks subscription_status** → REJECTED
4. Database returns authorization error

### Scenario: User tries to hide ads without paying

#### What Happens:
1. User modifies React props to set `isPro = true`
2. Ads disappear from their view
3. UI shows Pro features (buttons enabled)
4. **This is acceptable because**:
   - They can't access actual Pro data (RLS blocks it)
   - They can't save Pro data (Server Actions block it)
   - Hiding ads is equivalent to using an ad blocker
   - No financial or data security impact

## Understanding Client-Side vs Server-Side Feature Gating

### All Pro Features Now Have Server Validation

**Current Architecture (After Implementation):**
All Pro features now have **mandatory server-side validation** before they can be used:

1. **Multiple Stops**: `validateMultipleStops()` server action called before `addStop()`
2. **CSV Import**: `validateCSVImport()` server action called before processing CSV
3. **PDF Export**: `validatePDFExport()` server action called before generating PDF

**Security Benefits:**
- ✅ Cannot bypass without modifying server code
- ✅ Validation happens on every feature use
- ✅ Maintains client-side performance (validation is async, processing still client-side)
- ✅ True enforcement at application layer
- ✅ Consistent security model across all features

**Why This Approach:**
1. **Performance**: Client-side processing for speed, server validation for security
2. **User Experience**: Instant feedback, no server round-trip for calculations
3. **Cost**: Zero server compute for calculations (just validation checks)
4. **Security**: Cannot bypass without compromising the server itself
5. **Maintainability**: Clear, consistent pattern for all Pro features

### Hard Paywalls (Server + RLS)

Features with **server persistence** have the strongest enforcement:
- **Calculation history**: Server Action + RLS policies
- **Recent searches**: Server Action + RLS policies

**Three-Layer Security:**
1. Client Action calls Server Action
2. Server Action validates subscription
3. RLS policy validates at database level

**Why Three Layers:**
- Layer 1 (Client): UX and immediate feedback
- Layer 2 (Server Action): Application logic enforcement
- Layer 3 (RLS): Database-level security (defense in depth)

## Key Takeaways

1. **All Pro features have server validation** - cannot be bypassed without modifying server code
2. **Client-side checks are UX** - provide immediate feedback, but not security
3. **Server Actions are enforcement** - validate subscription before allowing feature use
4. **RLS is defense in depth** - protects persisted data even if Server Action is compromised
5. **`isPro` prop is server-derived** - comes from database query in Server Component (page.tsx)
6. **Security model**:
   - Client-side features: Server validation + client processing (multiple stops, CSV, PDF)
   - Server-persisted data: Server validation + RLS policies (history, recent searches)
7. **Performance maintained**:
   - Validation is a quick database check
   - Processing still happens client-side (fast)
   - No server compute for calculations
8. **Pattern to follow**:
   ```typescript
   // Client component
   const handleFeature = async () => {
     // 1. Server validation (mandatory)
     const validation = await validateFeature()
     if (!validation.success) {
       toast.error(validation.error)
       return
     }
     
     // 2. Client-side processing (fast)
     const result = processClientSide()
     
     // 3. Optional: Save to server (if needed)
     await saveToServer(result)
   }
   ```

## Environment Variables Required

```env
# Stripe
STRIPE_SECRET_KEY=sk_test_...
STRIPE_PRICE_ID=price_...
STRIPE_WEBHOOK_SECRET=whsec_...

# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
SUPABASE_SERVICE_ROLE_KEY=...

# App
NEXT_PUBLIC_APP_URL=https://truckcheck.com.au
```

## Stripe Webhook Configuration

Webhooks must be configured in Stripe dashboard to point to:
```
https://your-domain.com/api/stripe/webhook
```

Required events:
- `checkout.session.completed`
- `customer.subscription.updated`
- `customer.subscription.deleted`
- `invoice.payment_succeeded`
- `invoice.payment_failed`

## Testing Security

### Test 1: Verify RLS Policies
```sql
-- As a free user, try to insert into calculation_history
-- Should be REJECTED
SET request.jwt.claims.sub = 'free-user-uuid';
INSERT INTO calculation_history (...) VALUES (...);
-- Expected: permission denied
```

### Test 2: Verify Server Action Protection
1. Sign in as free user
2. Open Network tab
3. Try to call Server Action for Pro feature
4. Expected: "Pro subscription required" error

### Test 3: Verify Client-Side Changes Don't Grant Access
1. Sign in as free user
2. Open React DevTools
3. Modify `isPro` prop to `true`
4. Ads disappear (this is OK - equivalent to ad blocker)
5. Try to save calculation history
6. Expected: Server rejects the operation with "Pro subscription required"

### Test 4: Verify Database Protection
1. Get free user's auth token
2. Try to directly INSERT into `calculation_history` using Supabase client
3. Expected: RLS policy blocks the insert

## Migration Order

Migrations must be applied in this order:
1. `create_users_subscription_table.sql` - Creates users table with subscription fields
2. `create_calculation_history_table.sql` - Creates history table with RLS
3. `create_recent_searches_table.sql` - Creates searches table with RLS
4. `add_subscription_rls_policies.sql` - Updates/strengthens RLS policies

## Monitoring

Monitor these metrics:
- Failed authorization attempts (could indicate attack)
- Subscription status check failures
- RLS policy violations in PostgreSQL logs
- Webhook processing errors
- Unusual patterns of Server Action rejections
