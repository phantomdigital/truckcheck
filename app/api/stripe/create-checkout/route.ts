import { createCheckoutSession } from "@/lib/stripe/utils"
import { createClient } from "@/lib/supabase/server"
import { safeCaptureException } from "@/lib/sentry/utils"
import { NextResponse } from "next/server"

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const { priceId } = body
    
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user || !user.email) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      )
    }

    const session = await createCheckoutSession(
      user.id,
      user.email,
      `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/checkout/success`,
      `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/pricing?canceled=true`,
      priceId
    )

    return NextResponse.json({ url: session.url })
  } catch (error) {
    const err = error instanceof Error ? error : new Error(String(error))
    console.error("Error creating checkout session:", error)
    safeCaptureException(err, {
      context: "stripe_create_checkout",
      userId: user?.id,
      priceId,
    })
    return NextResponse.json(
      { error: "Failed to create checkout session" },
      { status: 500 }
    )
  }
}

