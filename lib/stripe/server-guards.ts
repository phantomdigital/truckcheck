/**
 * Server-side guards for Pro features
 * These must be called in Server Actions or API routes to enforce subscription checks
 */

import { getCachedUser } from "@/lib/supabase/server"
import { getSubscriptionStatus } from "./actions"

/**
 * Check if the current user has an active Pro subscription
 * This should be called at the START of any Server Action that requires Pro
 * Uses cached functions to avoid duplicate queries
 */
export async function requireProSubscription(): Promise<{
  isAuthorized: boolean
  userId: string | null
  error: string | null
}> {
  // Use cached user to avoid duplicate auth calls
  const user = await getCachedUser()

  if (!user) {
    return {
      isAuthorized: false,
      userId: null,
      error: "Authentication required",
    }
  }

  // Use cached subscription status to avoid duplicate queries
  const { isPro } = await getSubscriptionStatus()

  if (!isPro) {
    return {
      isAuthorized: false,
      userId: user.id,
      error: "Pro subscription required for this feature",
    }
  }

  return {
    isAuthorized: true,
    userId: user.id,
    error: null,
  }
}

/**
 * Check if user can add multiple stops (Pro feature)
 */
export async function canAddMultipleStops(): Promise<boolean> {
  const { isAuthorized } = await requireProSubscription()
  return isAuthorized
}

/**
 * Check if user can export to PDF (Pro feature)
 */
export async function canExportPDF(): Promise<boolean> {
  const { isAuthorized } = await requireProSubscription()
  return isAuthorized
}

/**
 * Check if user can import CSV (Pro feature)
 */
export async function canImportCSV(): Promise<boolean> {
  const { isAuthorized } = await requireProSubscription()
  return isAuthorized
}

