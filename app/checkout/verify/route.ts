import { createClient } from "@/lib/supabase/server"
import { NextRequest, NextResponse } from "next/server"
import { createCheckoutSession } from "@/lib/stripe/utils"

/**
 * Dedicated route for verifying authentication and starting checkout.
 * This ensures the user is authenticated server-side before creating a checkout session.
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const priceId = searchParams.get("priceId") || process.env.STRIPE_PRICE_ID || ""

  try {
    // Verify authentication server-side
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user || !user.email) {
      console.error("[Checkout Verify] User not authenticated")
      // Redirect to sign-up with checkout intent
      const params = new URLSearchParams()
      params.set("redirect", "/pricing")
      params.set("checkout", "true")
      if (priceId) {
        params.set("priceId", priceId)
      }
      return NextResponse.redirect(new URL(`/auth/sign-up?${params.toString()}`, request.url))
    }

    console.log("[Checkout Verify] User authenticated, creating checkout session...")

    // Create checkout session server-side
    const session = await createCheckoutSession(
      user.id,
      user.email,
      `${process.env.NEXT_PUBLIC_APP_URL || request.nextUrl.origin}/checkout/success`,
      `${process.env.NEXT_PUBLIC_APP_URL || request.nextUrl.origin}/pricing?canceled=true`,
      priceId
    )

    console.log("[Checkout Verify] Checkout session created, redirecting to Stripe...")

    // Redirect directly to Stripe checkout
    return NextResponse.redirect(session.url || "/pricing")
  } catch (error) {
    console.error("[Checkout Verify] Error:", error)
    // Redirect to pricing page with error
    return NextResponse.redirect(
      new URL("/pricing?error=checkout_failed", request.url)
    )
  }
}

