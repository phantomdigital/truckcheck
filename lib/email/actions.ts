"use server"

import { Resend } from 'resend'
import { LogbookResultEmail } from '@/emails/logbook-result'
import { getCachedUser } from '@/lib/supabase/server'
import { getSubscriptionStatus } from '@/lib/stripe/actions'
import type { CalculationResult } from '@/lib/logbook/types'

const resend = new Resend(process.env.RESEND_API_KEY)

/**
 * Server action to send logbook check result via email (Pro users only)
 * SECURITY: Server-side validation ensures only Pro users can send emails
 */
export async function sendLogbookEmail({
  to,
  subject,
  result,
  mapImageUrl,
}: {
  to: string
  subject?: string
  result: CalculationResult
  mapImageUrl?: string
}) {
  // Use cached user to avoid duplicate auth calls
  const user = await getCachedUser()

  if (!user) {
    return { success: false, error: "Unauthorized" }
  }

  // Use cached subscription status to avoid duplicate queries
  const { isPro } = await getSubscriptionStatus()

  if (!isPro) {
    return { success: false, error: "Pro subscription required" }
  }

  // Validate email
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  if (!to || !emailRegex.test(to)) {
    return { success: false, error: "Invalid email address" }
  }

  try {
    // Send email with Resend and React Email
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
      return { success: false, error: "Failed to send email" }
    }

    return { success: true, messageId: data.id, error: null }
  } catch (error) {
    console.error("Error sending email:", error)
    return { success: false, error: "Internal server error" }
  }
}

