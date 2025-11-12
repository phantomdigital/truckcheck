import { headers } from "next/headers"
import { NextResponse } from "next/server"
import { stripe } from "@/lib/stripe/config"
import { createServiceRoleClient } from "@/lib/supabase/server"
import Stripe from "stripe"

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!

// Type extensions for Stripe objects that have properties not in TypeScript definitions
// These properties exist at runtime but may not be in the type definitions
type SubscriptionWithPeriodEnd = Stripe.Subscription & {
  current_period_end: number
}

type InvoiceWithSubscription = Stripe.Invoice & {
  subscription: string | Stripe.Subscription | null
}

// Helper to safely get subscription period end
// Note: For flexible billing subscriptions, current_period_end is on the subscription item, not the subscription
function getSubscriptionPeriodEnd(subscription: Stripe.Subscription): number | null {
  // First check if it's on the subscription itself (standard subscriptions)
  const sub = subscription as SubscriptionWithPeriodEnd
  if (sub.current_period_end) {
    return sub.current_period_end
  }
  
  // For flexible billing, check the subscription item
  if (subscription.items?.data && subscription.items.data.length > 0) {
    const firstItem = subscription.items.data[0]
    const itemWithPeriod = firstItem as typeof firstItem & { current_period_end?: number }
    if (itemWithPeriod.current_period_end) {
      return itemWithPeriod.current_period_end
    }
  }
  
  return null
}

// Helper to safely get invoice subscription ID
function getInvoiceSubscriptionId(invoice: Stripe.Invoice): string | null {
  const inv = invoice as InvoiceWithSubscription
  if (typeof inv.subscription === 'string') {
    return inv.subscription
  }
  if (inv.subscription && typeof inv.subscription === 'object' && 'id' in inv.subscription) {
    return inv.subscription.id
  }
  return null
}

export async function POST(req: Request) {
  console.log("[Webhook] Received webhook request")
  
  const body = await req.text()
  const headersList = await headers()
  const signature = headersList.get("stripe-signature")!

  // Check if required env vars are present
  if (!webhookSecret) {
    console.error("[Webhook] STRIPE_WEBHOOK_SECRET is not set!")
    return NextResponse.json(
      { error: "Webhook secret not configured" },
      { status: 500 }
    )
  }
  
  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
    console.error("[Webhook] SUPABASE_SERVICE_ROLE_KEY is not set!")
    return NextResponse.json(
      { error: "Supabase service role key not configured" },
      { status: 500 }
    )
  }

  let event: Stripe.Event

  try {
    event = stripe.webhooks.constructEvent(body, signature, webhookSecret)
    console.log("[Webhook] Event type:", event.type)
  } catch (err) {
    console.error("[Webhook] Signature verification failed:", err)
    return NextResponse.json(
      { error: "Webhook signature verification failed" },
      { status: 400 }
    )
  }

  // Use service role client to bypass RLS for webhook operations
  const supabase = createServiceRoleClient()
  console.log("[Webhook] Service role client created")

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        console.log("[Webhook] checkout.session.completed received")
        const session = event.data.object as Stripe.Checkout.Session
        console.log("[Webhook] Session mode:", session.mode)
        console.log("[Webhook] Session subscription:", session.subscription)
        
        if (session.mode === "subscription" && session.subscription) {
          const subscriptionId = typeof session.subscription === 'string' 
            ? session.subscription 
            : session.subscription.id
          console.log("[Webhook] Retrieving subscription:", subscriptionId)
          const subscription = await stripe.subscriptions.retrieve(subscriptionId, {
            expand: ['items.data.price.product']
          })
          
          const userId = session.metadata?.userId || subscription.metadata?.userId
          const periodEnd = getSubscriptionPeriodEnd(subscription)
          console.log("[Webhook] UserId from metadata:", userId)
          console.log("[Webhook] Subscription status:", subscription.status)
          console.log("[Webhook] Current period end:", periodEnd)
          
          if (userId && periodEnd) {
            console.log("[Webhook] Attempting to update user:", userId)
            const updateData = {
              subscription_status: "pro" as const,
              stripe_subscription_id: subscription.id,
              subscription_current_period_end: new Date(
                periodEnd * 1000
              ).toISOString(),
            }
            console.log("[Webhook] Update data:", JSON.stringify(updateData))
            
            const { data, error } = await supabase
              .from("users")
              .update(updateData)
              .eq("id", userId)
            
            if (error) {
              console.error("[Webhook] Error updating user:", JSON.stringify(error))
            } else {
              console.log("[Webhook] Successfully updated user to Pro:", userId)
              console.log("[Webhook] Update result data:", JSON.stringify(data))
            }
          } else {
            console.error("[Webhook] Missing required data - userId:", userId, "current_period_end:", (subscription as any).current_period_end)
          }
        } else {
          console.log("[Webhook] Not a subscription checkout or subscription is null")
        }
        break
      }

      case "customer.subscription.updated":
      case "customer.subscription.deleted": {
        const subscription = event.data.object as Stripe.Subscription
        
        const userId = subscription.metadata?.userId
        const periodEnd = getSubscriptionPeriodEnd(subscription)
        
        if (userId && periodEnd) {
          if (subscription.status === "active") {
            await supabase
              .from("users")
              .update({
                subscription_status: "pro" as const,
                subscription_current_period_end: new Date(
                  periodEnd * 1000
                ).toISOString(),
              })
              .eq("id", userId)
          } else if (subscription.status === "canceled") {
            await supabase
              .from("users")
              .update({
                subscription_status: "cancelled" as const,
                subscription_current_period_end: new Date(
                  periodEnd * 1000
                ).toISOString(),
              })
              .eq("id", userId)
          } else if (
            subscription.status === "past_due" ||
            subscription.status === "unpaid"
          ) {
            await supabase
              .from("users")
              .update({
                subscription_status: "past_due" as const,
              })
              .eq("id", userId)
          }
        }
        break
      }

      case "invoice.payment_succeeded": {
        const invoice = event.data.object as Stripe.Invoice
        const invoiceSubscriptionId = getInvoiceSubscriptionId(invoice)
        
        if (invoiceSubscriptionId) {
          const subscription = await stripe.subscriptions.retrieve(invoiceSubscriptionId)
          
          const userId = subscription.metadata?.userId
          const periodEnd = getSubscriptionPeriodEnd(subscription)
          
          if (userId && subscription.status === "active" && periodEnd) {
            await supabase
              .from("users")
              .update({
                subscription_status: "pro" as const,
                subscription_current_period_end: new Date(
                  periodEnd * 1000
                ).toISOString(),
              })
              .eq("id", userId)
          }
        }
        break
      }

      case "invoice.payment_failed": {
        const invoice = event.data.object as Stripe.Invoice
        const invoiceSubscriptionId = getInvoiceSubscriptionId(invoice)
        
        if (invoiceSubscriptionId) {
          const subscription = await stripe.subscriptions.retrieve(invoiceSubscriptionId)
          
          const userId = subscription.metadata?.userId
          
          if (userId) {
            await supabase
              .from("users")
              .update({
                subscription_status: "past_due" as const,
              })
              .eq("id", userId)
          }
        }
        break
      }

      default:
        console.log(`Unhandled event type: ${event.type}`)
    }

    return NextResponse.json({ received: true })
  } catch (error) {
    console.error("Error processing webhook:", error)
    return NextResponse.json(
      { error: "Webhook processing failed" },
      { status: 500 }
    )
  }
}

