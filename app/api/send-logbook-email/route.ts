import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { Resend } from 'resend'
import { LogbookResultEmail } from '@/emails/logbook-result'

// Lazy-load Resend client to avoid build-time errors when env vars aren't available
// Create it only when needed (at runtime, not module load time)
const getResendClient = () => {
  const apiKey = process.env.RESEND_API_KEY
  if (!apiKey) {
    throw new Error('RESEND_API_KEY environment variable is not set')
  }
  return new Resend(apiKey)
}

export async function POST(request: NextRequest) {
  try {
    // SECURITY: Verify user is authenticated and has Pro subscription
    const supabase = await createClient()
    const { data: { user }, error: userError } = await supabase.auth.getUser()

    if (userError || !user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      )
    }

    // Check Pro subscription
    const { data: subscription } = await supabase
      .from("user_subscriptions")
      .select("status")
      .eq("user_id", user.id)
      .single()

    if (!subscription || subscription.status !== "active") {
      return NextResponse.json(
        { error: "Pro subscription required" },
        { status: 403 }
      )
    }

    // Parse request body
    const body = await request.json()
    const { to, subject, result, mapImageUrl } = body

    // Validate email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!to || !emailRegex.test(to)) {
      return NextResponse.json(
        { error: "Invalid email address" },
        { status: 400 }
      )
    }

    // Send email with Resend and React Email
    const resend = getResendClient()
    const { data, error } = await resend.emails.send({
      from: 'TruckCheck <noreply@m.truckcheck.com.au>',
      to: [to],
      subject: subject || 'NHVR Logbook Check Result',
      react: LogbookResultEmail({
        result: result,
        mapImageUrl: mapImageUrl,
        generatedDate: new Date().toLocaleDateString("en-AU", {
          weekday: "long",
          year: "numeric",
          month: "long",
          day: "numeric",
        }),
      }),
    })

    if (error) {
      console.error('Failed to send email:', error)
      return NextResponse.json(
        { error: "Failed to send email" },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true, messageId: data.id })
  } catch (error) {
    console.error("Error sending email:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

