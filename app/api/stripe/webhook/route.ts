import { headers } from "next/headers"
import { NextResponse } from "next/server"
import { stripe } from "@/lib/stripe/config"
import { createClient } from "@/lib/supabase/server"
import Stripe from "stripe"

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!

export async function POST(req: Request) {
  const body = await req.text()
  const signature = headers().get("stripe-signature")!

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

  const supabase = await createClient()

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session
        
        if (session.mode === "subscription" && session.subscription) {
          const subscription = await stripe.subscriptions.retrieve(
            session.subscription as string
          )
          
          const userId = session.metadata?.userId || subscription.metadata?.userId
          
          if (userId) {
            await supabase
              .from("users")
              .update({
                subscription_status: "pro",
                stripe_subscription_id: subscription.id,
                subscription_current_period_end: new Date(
                  subscription.current_period_end * 1000
                ).toISOString(),
              })
              .eq("id", userId)
          }
        }
        break
      }

      case "customer.subscription.updated":
      case "customer.subscription.deleted": {
        const subscription = event.data.object as Stripe.Subscription
        
        const userId = subscription.metadata?.userId
        
        if (userId) {
          if (subscription.status === "active") {
            await supabase
              .from("users")
              .update({
                subscription_status: "pro",
                subscription_current_period_end: new Date(
                  subscription.current_period_end * 1000
                ).toISOString(),
              })
              .eq("id", userId)
          } else if (subscription.status === "canceled") {
            await supabase
              .from("users")
              .update({
                subscription_status: "cancelled",
                subscription_current_period_end: new Date(
                  subscription.current_period_end * 1000
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
        
        if (invoice.subscription) {
          const subscription = await stripe.subscriptions.retrieve(
            invoice.subscription as string
          )
          
          const userId = subscription.metadata?.userId
          
          if (userId && subscription.status === "active") {
            await supabase
              .from("users")
              .update({
                subscription_status: "pro",
                subscription_current_period_end: new Date(
                  subscription.current_period_end * 1000
                ).toISOString(),
              })
              .eq("id", userId)
          }
        }
        break
      }

      case "invoice.payment_failed": {
        const invoice = event.data.object as Stripe.Invoice
        
        if (invoice.subscription) {
          const subscription = await stripe.subscriptions.retrieve(
            invoice.subscription as string
          )
          
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

