import { headers } from "next/headers"
import { NextResponse } from "next/server"
import { stripe } from "@/lib/stripe/config"
import { createServiceRoleClient } from "@/lib/supabase/server"
import Stripe from "stripe"

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!

export async function POST(req: Request) {
  const body = await req.text()
  const headersList = await headers()
  const signature = headersList.get("stripe-signature")!

  let event: Stripe.Event

  try {
    event = stripe.webhooks.constructEvent(body, signature, webhookSecret)
  } catch (err) {
    console.error("Webhook signature verification failed:", err)
    return NextResponse.json(
      { error: "Webhook signature verification failed" },
      { status: 400 }
    )
  }

  // Use service role client to bypass RLS for webhook operations
  const supabase = createServiceRoleClient()

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        console.log("[Webhook] checkout.session.completed received")
        const session = event.data.object as Stripe.Checkout.Session
        
        if (session.mode === "subscription" && session.subscription) {
          const subscriptionId = typeof session.subscription === 'string' 
            ? session.subscription 
            : session.subscription.id
          const subscription = await stripe.subscriptions.retrieve(subscriptionId) as unknown as Stripe.Subscription
          
          const userId = session.metadata?.userId || subscription.metadata?.userId
          console.log("[Webhook] UserId from metadata:", userId)
          console.log("[Webhook] Session metadata:", session.metadata)
          console.log("[Webhook] Subscription metadata:", subscription.metadata)
          
          if (userId && (subscription as any).current_period_end) {
            const { data, error } = await supabase
              .from("users")
              .update({
                subscription_status: "pro",
                stripe_subscription_id: subscription.id,
                subscription_current_period_end: new Date(
                  (subscription as any).current_period_end * 1000
                ).toISOString(),
              })
              .eq("id", userId)
            
            if (error) {
              console.error("[Webhook] Error updating user:", error)
            } else {
              console.log("[Webhook] Successfully updated user to Pro:", userId)
            }
          } else {
            console.error("[Webhook] No userId found in metadata!")
          }
        }
        break
      }

      case "customer.subscription.updated":
      case "customer.subscription.deleted": {
        const subscription = event.data.object as Stripe.Subscription
        
        const userId = subscription.metadata?.userId
        
        if (userId && (subscription as any).current_period_end) {
          if (subscription.status === "active") {
            await supabase
              .from("users")
              .update({
                subscription_status: "pro",
                subscription_current_period_end: new Date(
                  (subscription as any).current_period_end * 1000
                ).toISOString(),
              })
              .eq("id", userId)
          } else if (subscription.status === "canceled") {
            await supabase
              .from("users")
              .update({
                subscription_status: "cancelled",
                subscription_current_period_end: new Date(
                  (subscription as any).current_period_end * 1000
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
                subscription_status: "past_due",
              })
              .eq("id", userId)
          }
        }
        break
      }

      case "invoice.payment_succeeded": {
        const invoice = event.data.object as Stripe.Invoice
        const invoiceSubscription = (invoice as any).subscription
        
        if (invoiceSubscription) {
          const subscriptionId = typeof invoiceSubscription === 'string'
            ? invoiceSubscription
            : invoiceSubscription.id
          const subscription = await stripe.subscriptions.retrieve(subscriptionId) as unknown as Stripe.Subscription
          
          const userId = subscription.metadata?.userId
          
          if (userId && subscription.status === "active" && (subscription as any).current_period_end) {
            await supabase
              .from("users")
              .update({
                subscription_status: "pro",
                subscription_current_period_end: new Date(
                  (subscription as any).current_period_end * 1000
                ).toISOString(),
              })
              .eq("id", userId)
          }
        }
        break
      }

      case "invoice.payment_failed": {
        const invoice = event.data.object as Stripe.Invoice
        const invoiceSubscription = (invoice as any).subscription
        
        if (invoiceSubscription) {
          const subscriptionId = typeof invoiceSubscription === 'string'
            ? invoiceSubscription
            : invoiceSubscription.id
          const subscription = await stripe.subscriptions.retrieve(subscriptionId) as unknown as Stripe.Subscription
          
          const userId = subscription.metadata?.userId
          
          if (userId) {
            await supabase
              .from("users")
              .update({
                subscription_status: "past_due",
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

