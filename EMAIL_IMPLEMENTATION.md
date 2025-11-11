# Email Feature Implementation Guide

This document outlines how to complete the email functionality for sending logbook check results.

## Current Status

✅ **Completed:**
- Export modal with tabs (PDF, Print, Email)
- UI components for email input
- Placeholder API route at `/api/send-logbook-email`
- Placeholder React Email template at `/emails/logbook-result.tsx`
- Security checks (Pro subscription validation)

⏳ **To Complete:**
1. Install and configure Resend
2. Set up React Email
3. Implement email template
4. Configure DNS for email sending

## Implementation Steps

### 1. Install Required Packages

```bash
npm install resend react-email @react-email/components
```

### 2. Set Up Resend

1. Sign up at [resend.com](https://resend.com)
2. Get your API key from the dashboard
3. Add to `.env.local`:

```env
RESEND_API_KEY=re_xxxxxxxxxxxxxxxxxxxxxxxxxx
```

### 3. Configure Email Domain

#### Option A: Use Resend's Testing Domain (Quick Start)
- Emails will be sent from `onboarding@resend.dev`
- Can only send to verified email addresses
- Good for development/testing

#### Option B: Use Custom Domain (Production)
1. Add your domain in Resend dashboard
2. Configure DNS records:
   - SPF record
   - DKIM records
   - DMARC record (optional but recommended)
3. Update `from` address in `/app/api/send-logbook-email/route.ts`:
   ```typescript
   from: 'TruckCheck <noreply@truckcheck.com.au>',
   ```

### 4. Uncomment Code

#### A. API Route (`app/api/send-logbook-email/route.ts`)

Uncomment the following sections:
- Import statements for Resend
- Resend initialization
- Email sending logic
- Success response

#### B. Email Template (`emails/logbook-result.tsx`)

Uncomment the entire template - this is a fully styled React Email component.

### 5. Test Email Sending

```bash
# Development mode with email preview
npm run dev

# Test the email in browser (React Email dev server)
npx email dev
```

### 6. Update Export Modal

The modal at `components/logbook/export-modal.tsx` is already configured to:
- Show "Email feature coming soon!" toast (line 367)
- Have email sending logic ready to uncomment

Once email is implemented, update line 367-370 to call the actual API:

```typescript
const response = await fetch('/api/send-logbook-email', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    to: emailTo,
    subject: emailSubject,
    result: result,
    mapImageUrl: mapUrl,
  }),
})

if (!response.ok) throw new Error('Failed to send email')

toast.success('Email sent successfully!')
setEmailTo('')
setIsOpen(false)
```

## Email Template Features

The template includes:
- ✅ Logbook requirement status (with visual indicators)
- ✅ Route information (base location, stops)
- ✅ Map image (embedded from capture)
- ✅ Distance summary (all three metrics)
- ✅ Professional styling
- ✅ Responsive design
- ✅ Disclaimer and footer

## Security Notes

- ✅ Pro subscription check implemented
- ✅ Authentication required
- ✅ Email validation
- ✅ Rate limiting (recommended to add)

### Recommended: Add Rate Limiting

Consider using Upstash Redis for rate limiting:

```typescript
import { Ratelimit } from "@upstash/ratelimit"
import { Redis } from "@upstash/redis"

const ratelimit = new Ratelimit({
  redis: Redis.fromEnv(),
  limiter: Ratelimit.slidingWindow(5, "1 h"), // 5 emails per hour
})

const { success } = await ratelimit.limit(user.id)
if (!success) {
  return NextResponse.json(
    { error: "Rate limit exceeded. Try again later." },
    { status: 429 }
  )
}
```

## Testing Checklist

- [ ] Email sends successfully
- [ ] Map image displays correctly in email
- [ ] All distance metrics show properly
- [ ] Email validates Pro subscription
- [ ] Error handling works (invalid email, etc.)
- [ ] Email appears correctly in major email clients:
  - [ ] Gmail
  - [ ] Outlook
  - [ ] Apple Mail
  - [ ] Mobile email apps

## Cost Considerations

**Resend Pricing:**
- Free tier: 100 emails/day, 3,000 emails/month
- Pro tier: $20/month for 50,000 emails/month
- Pay as you go: Available for higher volumes

For a Pro feature, monitor usage and consider:
- Setting per-user limits
- Caching email sends (prevent duplicate sends)
- Monitoring API costs

## Support Resources

- [Resend Documentation](https://resend.com/docs)
- [React Email Documentation](https://react.email/docs)
- [React Email Examples](https://react.email/examples)

