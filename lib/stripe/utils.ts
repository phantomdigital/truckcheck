import { stripe, STRIPE_CONFIG } from "./config"
import { createClient } from "@/lib/supabase/server"

/**
 * Create or retrieve a Stripe customer for a user
 */
export async function getOrCreateStripeCustomer(userId: string, email: string) {
  const supabase = await createClient()
  
  // Check if user already has a Stripe customer ID
  const { data: user } = await supabase
    .from("users")
    .select("stripe_customer_id, first_name, last_name")
    .eq("id", userId)
    .single()

  if (user?.stripe_customer_id) {
    // Retrieve existing customer
    const customer = await stripe.customers.retrieve(user.stripe_customer_id)
    if (!customer.deleted) {
      return customer
    }
  }

  // Create new Stripe customer with name from database
  const customerData: any = {
    email,
    metadata: {
      userId,
    },
  }

  // Add name if available
  if (user?.first_name || user?.last_name) {
    customerData.name = `${user.first_name || ''} ${user.last_name || ''}`.trim()
  }

  const customer = await stripe.customers.create(customerData)

  // Update user with Stripe customer ID
  await supabase
    .from("users")
    .update({ stripe_customer_id: customer.id })
    .eq("id", userId)

  return customer
}

/**
 * Create a Stripe Checkout session for subscription
 */
export async function createCheckoutSession(
  userId: string,
  email: string,
  successUrl: string,
  cancelUrl: string,
  priceId?: string
) {
  const customer = await getOrCreateStripeCustomer(userId, email)

  const session = await stripe.checkout.sessions.create({
    customer: customer.id,
    mode: "subscription",
    payment_method_types: ["card"],
    line_items: [
      {
        price: priceId || process.env.STRIPE_PRICE_ID || "",
        quantity: 1,
      },
    ],
    success_url: successUrl,
    cancel_url: cancelUrl,
    subscription_data: {
      metadata: {
        userId,
      },
    },
    metadata: {
      userId,
    },
  })

  return session
}

/**
 * Create a Stripe Customer Portal session
 */
export async function createPortalSession(
  customerId: string,
  returnUrl: string
) {
  const session = await stripe.billingPortal.sessions.create({
    customer: customerId,
    return_url: returnUrl,
  })

  return session
}

/**
 * Get user's subscription status from Stripe
 */
export async function getSubscriptionStatus(stripeSubscriptionId: string) {
  const subscription = await stripe.subscriptions.retrieve(stripeSubscriptionId)

  if (subscription.status === "active") {
    return "pro"
  } else if (subscription.status === "canceled") {
    return "cancelled"
  } else if (subscription.status === "past_due" || subscription.status === "unpaid") {
    return "past_due"
  }

  return "free"
}

