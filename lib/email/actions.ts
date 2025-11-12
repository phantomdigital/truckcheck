"use server"

import { Resend } from 'resend'
import { LogbookResultEmail } from '@/emails/logbook-result'
import { getCachedUser } from '@/lib/supabase/server'
import { getSubscriptionStatus } from '@/lib/stripe/actions'
import { uploadMapImage } from '@/lib/email/upload-image'
import type { CalculationResult } from '@/lib/logbook/types'

const resend = new Resend(process.env.RESEND_API_KEY)

// Limits
const MAX_TO_EMAILS = 10
const MAX_CC_EMAILS = 5
const MAX_DESCRIPTION_LENGTH = 500

/**
 * Server action to send logbook check result via email (Pro users only)
 * SECURITY: Server-side validation ensures only Pro users can send emails
 */
export async function sendLogbookEmail({
  to,
  cc,
  subject,
  description,
  result,
  mapImageUrl,
}: {
  to: string | string[]
  cc?: string[]
  subject?: string
  description?: string
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

  // Normalize "to" to array
  const toEmails = Array.isArray(to) ? to : [to]

  // Validate "To" emails
  if (toEmails.length === 0) {
    return { success: false, error: "At least one recipient email address is required" }
  }

  if (toEmails.length > MAX_TO_EMAILS) {
    return { success: false, error: `Maximum ${MAX_TO_EMAILS} recipients allowed` }
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  for (const email of toEmails) {
    if (!email || !emailRegex.test(email)) {
      return { success: false, error: `Invalid email address: ${email}` }
    }
  }

  // Validate CC emails (server-side)
  if (cc && cc.length > 0) {
    if (cc.length > MAX_CC_EMAILS) {
      return { success: false, error: `Maximum ${MAX_CC_EMAILS} CC recipients allowed` }
    }

    for (const email of cc) {
      if (!emailRegex.test(email)) {
        return { success: false, error: `Invalid CC email address: ${email}` }
      }
    }
  }

  // Validate description length (server-side)
  if (description && description.length > MAX_DESCRIPTION_LENGTH) {
    return { success: false, error: `Description must be ${MAX_DESCRIPTION_LENGTH} characters or less` }
  }

  try {
    // If mapImageUrl is a base64 data URL, upload it to Supabase Storage first
    let finalMapImageUrl = mapImageUrl
    if (mapImageUrl && mapImageUrl.startsWith('data:image/')) {
      const uploadedUrl = await uploadMapImage(mapImageUrl, user.id)
      if (uploadedUrl) {
        // Proxy the Supabase URL through our domain
        const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://staging.truckcheck.com.au'
        finalMapImageUrl = `${siteUrl}/api/proxy-map-image?url=${encodeURIComponent(uploadedUrl)}`
      } else {
        console.error('Failed to upload map image, using base64 fallback')
        // Continue with base64 if upload fails
      }
    }

    // Send email with Resend and React Email
    const { data, error } = await resend.emails.send({
      from: 'TruckCheck <support@m.truckcheck.com.au>',
      replyTo: 'admin@truckcheck.com.au',
      to: toEmails,
      cc: cc && cc.length > 0 ? cc : undefined,
      subject: subject || 'NHVR Logbook Check Result',
      react: LogbookResultEmail({
        result: result,
        mapImageUrl: finalMapImageUrl,
        description: description,
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

