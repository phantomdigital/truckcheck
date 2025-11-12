import { createPortalSession } from "@/lib/stripe/utils"
import { createClient } from "@/lib/supabase/server"
import { safeCaptureException } from "@/lib/sentry/utils"
import { NextResponse } from "next/server"

export async function POST(req: Request) {
  let userId: string | undefined
  let customerId: string | undefined
  
  try {
    const body = await req.json()
    customerId = body.customerId

    if (!customerId) {
      return NextResponse.json(
        { error: "Customer ID is required" },
        { status: 400 }
      )
    }

    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      )
    }

    userId = user.id

    // Verify the customer ID belongs to the user
    const { data: userData } = await supabase
      .from("users")
      .select("stripe_customer_id")
      .eq("id", user.id)
      .single()

    if (userData?.stripe_customer_id !== customerId) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      )
    }

    const session = await createPortalSession(
      customerId,
      `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/account`
    )

    return NextResponse.json({ url: session.url })
  } catch (error) {
    const err = error instanceof Error ? error : new Error(String(error))
    console.error("Error creating portal session:", error)
    safeCaptureException(err, {
      context: "stripe_create_portal",
      userId,
      customerId,
    })
    return NextResponse.json(
      { error: "Failed to create portal session" },
      { status: 500 }
    )
  }
}

