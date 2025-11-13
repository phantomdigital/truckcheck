import Stripe from "stripe"

// Lazy-load Stripe client to avoid build-time errors when env vars aren't available
// Create it only when needed (at runtime, not module load time)
let stripeInstance: Stripe | null = null

export const getStripeClient = (): Stripe => {
  if (!stripeInstance) {
    const secretKey = process.env.STRIPE_SECRET_KEY
    if (!secretKey) {
      throw new Error("STRIPE_SECRET_KEY is not set in environment variables")
    }
    stripeInstance = new Stripe(secretKey, {
      apiVersion: "2025-10-29.clover",
      typescript: true,
    })
  }
  return stripeInstance
}

// Export for backward compatibility - but prefer using getStripeClient() directly
export const stripe = new Proxy({} as Stripe, {
  get(_target, prop) {
    return getStripeClient()[prop as keyof Stripe]
  }
})

// Stripe configuration
export const STRIPE_CONFIG = {
  CURRENCY: "aud",
} as const

export type SubscriptionStatus = "free" | "pro" | "cancelled" | "past_due"

