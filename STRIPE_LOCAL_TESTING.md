# Testing Stripe Checkout Locally

When testing Stripe checkout in localhost, webhooks won't work automatically because Stripe can't reach your local server. You need to use the **Stripe CLI** to forward webhooks to localhost.

## Quick Setup (5 minutes)

### 1. Install Stripe CLI

**Windows (using Scoop):**
```powershell
scoop bucket add stripe https://github.com/stripe/scoop-stripe-cli.git
scoop install stripe
```

**Or download directly:**
- Download from: https://github.com/stripe/stripe-cli/releases/latest
- Extract and add to PATH

**Mac:**
```bash
brew install stripe/stripe-cli/stripe
```

**Linux:**
```bash
# Download and install
wget https://github.com/stripe/stripe-cli/releases/latest/download/stripe_linux_amd64.tar.gz
tar -xvf stripe_linux_amd64.tar.gz
sudo mv stripe /usr/local/bin/
```

### 2. Login to Stripe CLI

```bash
stripe login
```

This will open your browser to authenticate. Press Enter after authorizing.

### 3. Forward Webhooks to Localhost

In a **separate terminal window**, run:

```bash
stripe listen --forward-to localhost:3000/api/stripe/webhook
```

You'll see output like:
```
> Ready! Your webhook signing secret is whsec_xxxxxxxxxxxxx
```

### 4. Update Your `.env.local`

Copy the webhook signing secret from the terminal output and add/update in your `.env.local`:

```env
STRIPE_WEBHOOK_SECRET=whsec_xxxxxxxxxxxxx
```

**Important:** Restart your Next.js dev server after updating the `.env.local` file!

### 5. Test the Checkout Flow

Now when you complete a test checkout:
1. ✅ Stripe sends webhook to Stripe CLI
2. ✅ Stripe CLI forwards to your localhost:3000
3. ✅ Your webhook handler processes the event
4. ✅ Your database is updated with Pro status

You'll see webhook events in the Stripe CLI terminal in real-time!

## Testing the Full Flow

1. **Start your Next.js dev server:**
   ```bash
   npm run dev
   ```

2. **In a separate terminal, start Stripe webhook forwarding:**
   ```bash
   stripe listen --forward-to localhost:3000/api/stripe/webhook
   ```

3. **Navigate to your pricing page and click "Upgrade to Pro"**

4. **Use Stripe test card:**
   - Card: `4242 4242 4242 4242`
   - Expiry: Any future date (e.g., `12/34`)
   - CVC: Any 3 digits (e.g., `123`)
   - ZIP: Any 5 digits (e.g., `12345`)

5. **Complete checkout**

6. **Watch the Stripe CLI terminal** - you should see:
   ```
   2024-11-11 10:30:15   --> checkout.session.completed [evt_xxx]
   2024-11-11 10:30:15   <-- [200] POST http://localhost:3000/api/stripe/webhook [evt_xxx]
   ```

7. **Check your database** - your user should now have:
   - `subscription_status: 'pro'`
   - `stripe_customer_id: 'cus_xxx'`
   - `stripe_subscription_id: 'sub_xxx'`

## Troubleshooting

### Webhook not being received?
- Make sure you restarted your Next.js dev server after updating `.env.local`
- Check that `STRIPE_WEBHOOK_SECRET` starts with `whsec_`
- Make sure the Stripe CLI terminal is still running

### Still showing as free user?
- Check the Stripe CLI terminal for errors
- Check your Next.js terminal for webhook processing errors
- Verify the webhook is hitting `/api/stripe/webhook` in the CLI output

### Subscription created in Stripe but not in database?
- Check if the webhook event was received (look at Stripe CLI output)
- Check for errors in your Next.js server logs
- Verify your `users` table has the correct columns

## Production Deployment

When you deploy to production, you'll configure webhooks directly in the Stripe Dashboard:

1. Go to: https://dashboard.stripe.com/webhooks
2. Click "Add endpoint"
3. Enter: `https://your-domain.com/api/stripe/webhook`
4. Select events:
   - `checkout.session.completed`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
   - `invoice.payment_succeeded`
   - `invoice.payment_failed`
5. Copy the webhook signing secret to your production environment variables

## Webhook Events Handled

Your app handles these Stripe events:

- **`checkout.session.completed`** - Initial subscription created
- **`customer.subscription.updated`** - Subscription modified (plan change, etc.)
- **`customer.subscription.deleted`** - Subscription cancelled
- **`invoice.payment_succeeded`** - Recurring payment successful
- **`invoice.payment_failed`** - Payment failed (card declined, etc.)

## Useful Stripe CLI Commands

```bash
# View recent events
stripe events list --limit 10

# Trigger a specific webhook event manually
stripe trigger checkout.session.completed

# View webhook endpoint status
stripe webhook-endpoints list

# View logs
stripe logs tail
```

## Quick Reference

| Task | Command |
|------|---------|
| Login to Stripe | `stripe login` |
| Start webhook forwarding | `stripe listen --forward-to localhost:3000/api/stripe/webhook` |
| View events | `stripe events list` |
| Test checkout completion | `stripe trigger checkout.session.completed` |
| View logs | `stripe logs tail` |

---

**Pro Tip:** Keep the Stripe CLI terminal visible while testing so you can see webhooks in real-time!

