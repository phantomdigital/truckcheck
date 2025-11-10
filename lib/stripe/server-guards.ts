/**
 * Server-side guards for Pro features
 * These must be called in Server Actions or API routes to enforce subscription checks
 */

import { createClient } from "@/lib/supabase/server"
import type { SubscriptionStatus } from "./config"

/**
 * Check if the current user has an active Pro subscription
 * This should be called at the START of any Server Action that requires Pro
 */
export async function requireProSubscription(): Promise<{
  isAuthorized: boolean
  userId: string | null
  error: string | null
}> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return {
      isAuthorized: false,
      userId: null,
      error: "Authentication required",
    }
  }

  const { data: userData } = await supabase
    .from("users")
    .select("subscription_status")
    .eq("id", user.id)
    .single()

  const status = (userData?.subscription_status || "free") as SubscriptionStatus

  if (status !== "pro") {
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

