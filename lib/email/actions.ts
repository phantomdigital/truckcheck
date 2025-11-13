"use server"

import { Resend } from 'resend'
import { LogbookResultEmail } from '@/emails/logbook-result'
import { getCachedUser } from '@/lib/supabase/server'
import { getSubscriptionStatus } from '@/lib/stripe/actions'
import { uploadMapImage } from '@/lib/email/upload-image'
import type { CalculationResult } from '@/lib/logbook/types'

// Lazy-load Resend client to avoid build-time errors when env vars aren't available
// Create it only when needed (at runtime, not module load time)
const getResendClient = () => {
  const apiKey = process.env.RESEND_API_KEY
  if (!apiKey) {
    throw new Error('RESEND_API_KEY environment variable is not set')
  }
  return new Resend(apiKey)
}

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
    // Get the site URL for email images - must be publicly accessible (not localhost)
    // Use staging URL when on develop branch, but ensure bypass parameters are added for Vercel auth protection
    const getEmailSiteUrl = (): string => {
      // Check branch/environment (Vercel sets VERCEL_ENV and VERCEL_GIT_COMMIT_REF)
      const vercelEnv = process.env.VERCEL_ENV // 'production', 'preview', or 'development'
      const gitBranch = process.env.VERCEL_GIT_COMMIT_REF || process.env.GITHUB_REF_NAME // Branch name
      const isDevelopBranch = gitBranch === 'develop' || gitBranch === 'staging'
      const isPreview = vercelEnv === 'preview' || vercelEnv === 'development'
      
      console.log('[Email] Site URL detection:', {
        vercelEnv,
        gitBranch,
        isDevelopBranch,
        isPreview,
        nextPublicSiteUrl: process.env.NEXT_PUBLIC_SITE_URL
      })
      
      // For develop/staging branch, use staging URL (where the code is deployed)
      if (isDevelopBranch || (isPreview && !process.env.NEXT_PUBLIC_SITE_URL?.includes('truckcheck.com.au'))) {
        console.log('[Email] Using staging URL for email images (develop branch)')
        return 'https://staging.truckcheck.com.au'
      }
      
      // Use environment variable if set and valid
      const envUrl = process.env.NEXT_PUBLIC_SITE_URL || process.env.SITE_URL
      if (envUrl && !envUrl.includes('localhost') && !envUrl.includes('127.0.0.1')) {
        return envUrl
      }
      
      // Fallback to production URL
      return 'https://truckcheck.com.au'
    }
    const siteUrl = getEmailSiteUrl()

    // If mapImageUrl is a base64 data URL, upload it to Supabase Storage first
    let finalMapImageUrl = mapImageUrl
    if (mapImageUrl && mapImageUrl.startsWith('data:image/')) {
      console.log('Uploading map image to Supabase Storage for user:', user.id)
      const filePath = await uploadMapImage(mapImageUrl, user.id)
      if (filePath) {
        // Use the file path directly in the proxy URL
        // Encode each segment separately to preserve the / separator
        // Format: userId/filename -> /api/proxy-map-image/userId/filename
        const encodedPath = filePath.split('/').map(segment => encodeURIComponent(segment)).join('/')
        let proxiedUrl = `${siteUrl}/api/proxy-map-image/${encodedPath}`
        
        // Add Vercel protection bypass for staging/preview deployments
        // VERCEL_AUTOMATION_BYPASS_SECRET is automatically set by Vercel when Protection Bypass for Automation is enabled
        const isStagingUrl = siteUrl.includes('staging.truckcheck.com.au')
        const vercelBypassSecret = process.env.VERCEL_AUTOMATION_BYPASS_SECRET
        
        // Log all environment variables related to Vercel bypass for debugging
        console.log('[Email] Vercel bypass check:', {
          isStagingUrl,
          hasBypassSecret: !!vercelBypassSecret,
          bypassSecretLength: vercelBypassSecret?.length || 0,
          vercelEnv: process.env.VERCEL_ENV,
          allVercelEnvVars: Object.keys(process.env).filter(key => key.includes('VERCEL')).map(key => ({
            key,
            hasValue: !!process.env[key],
            valueLength: process.env[key]?.length || 0
          }))
        })
        
        if (isStagingUrl && vercelBypassSecret) {
          // Add bypass parameters to allow email clients to access protected deployments
          // Note: Some email clients may strip query parameters, so this might not work for all clients
          const bypassParams = new URLSearchParams({
            'x-vercel-protection-bypass': vercelBypassSecret,
            'x-vercel-set-bypass-cookie': 'true',
          })
          proxiedUrl = `${proxiedUrl}?${bypassParams.toString()}`
          console.log('[Email] Added Vercel bypass parameters to URL:', {
            hasBypassSecret: true,
            bypassSecretLength: vercelBypassSecret.length,
            proxiedUrl: proxiedUrl.substring(0, 300),
            note: 'If images still fail, configure /api/proxy-map-image/* route in Vercel dashboard to bypass authentication'
          })
        } else if (isStagingUrl && !vercelBypassSecret) {
          console.error('[Email] CRITICAL: Staging URL detected but VERCEL_AUTOMATION_BYPASS_SECRET not available!')
          console.error('[Email] To fix: Go to Vercel Dashboard → Project Settings → Deployment Protection → Enable "Protection Bypass for Automation"')
          console.error('[Email] Alternative: Configure /api/proxy-map-image/* route to bypass authentication in Vercel dashboard')
        }
        
        finalMapImageUrl = proxiedUrl
        console.log('[Email] Map image URL generated:', { 
          filePath,
          proxiedUrl: finalMapImageUrl.substring(0, 200), // Truncate for logging
          fullProxiedUrl: finalMapImageUrl, // Full URL for debugging
          siteUrl,
          timestamp: new Date().toISOString()
        })
      } else {
        console.error('Failed to upload map image, using base64 fallback')
        // Continue with base64 if upload fails
      }
    } else if (mapImageUrl) {
      // If it's already a URL, ensure it's absolute and publicly accessible
      if (mapImageUrl.startsWith('http://') || mapImageUrl.startsWith('https://')) {
        // Already an absolute URL, use as-is
        finalMapImageUrl = mapImageUrl
        console.log('Map image URL is already absolute, using as-is:', mapImageUrl.substring(0, 100))
      } else if (mapImageUrl.startsWith('/')) {
        // Relative URL - make it absolute using site URL
        finalMapImageUrl = `${siteUrl}${mapImageUrl}`
        console.log('Map image URL was relative, made absolute:', finalMapImageUrl)
      } else {
        // Might be a file path - convert to proxy URL
        // Format: userId/filename -> /api/proxy-map-image/userId/filename
        if (mapImageUrl.includes('/') && !mapImageUrl.includes('://')) {
          // Encode each segment separately to preserve the / separator
          const encodedPath = mapImageUrl.split('/').map(segment => encodeURIComponent(segment)).join('/')
          finalMapImageUrl = `${siteUrl}/api/proxy-map-image/${encodedPath}`
          console.log('Converted file path to proxy URL:', finalMapImageUrl)
        } else {
          // Unknown format, use as-is but log warning
          console.warn('Map image URL format unknown, using as-is:', mapImageUrl.substring(0, 100))
          finalMapImageUrl = mapImageUrl
        }
      }
    }

    // Send email with Resend and React Email
    const resend = getResendClient()
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

