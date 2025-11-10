import Stripe from "stripe"

if (!process.env.STRIPE_SECRET_KEY) {
  throw new Error("STRIPE_SECRET_KEY is not set in environment variables")
}

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: "2024-12-18.acacia",
  typescript: true,
})

// Stripe configuration
export const STRIPE_CONFIG = {
  CURRENCY: "aud",
} as const

export type SubscriptionStatus = "free" | "pro" | "cancelled" | "past_due"

