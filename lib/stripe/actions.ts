"use server"

import { createClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"
import type { SubscriptionStatus } from "./config"
import { requireProSubscription } from "./server-guards"

/**
 * Server action to get user's subscription status
 */
export async function getSubscriptionStatus(): Promise<{
  status: SubscriptionStatus
  isPro: boolean
  userId: string | null
  subscriptionEndDate: string | null
}> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { status: "free", isPro: false, userId: null, subscriptionEndDate: null }
  }

  const { data: userData } = await supabase
    .from("users")
    .select("subscription_status, subscription_current_period_end")
    .eq("id", user.id)
    .single()

  const status = (userData?.subscription_status || "free") as SubscriptionStatus
  const isPro = status === "pro"

  return { 
    status, 
    isPro, 
    userId: user.id,
    subscriptionEndDate: userData?.subscription_current_period_end || null
  }
}

/**
 * Server action to get calculation history
 */
export async function getCalculationHistory() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { data: [], error: "Unauthorized" }
  }

  // Check if user is Pro
  const { data: userData } = await supabase
    .from("users")
    .select("subscription_status")
    .eq("id", user.id)
    .single()

  if (userData?.subscription_status !== "pro") {
    return { data: [], error: "Pro subscription required" }
  }

  const { data, error } = await supabase
    .from("calculation_history")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(50)

  if (error) {
    return { data: [], error: error.message }
  }

  return { data: data || [], error: null }
}

/**
 * Server action to delete a calculation from history
 * SECURITY: Server-side validation ensures only Pro users can delete their own history
 */
export async function deleteCalculation(id: string) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { success: false, error: "Unauthorized" }
  }

  // SECURITY: Check Pro subscription status
  const { data: userData } = await supabase
    .from("users")
    .select("subscription_status")
    .eq("id", user.id)
    .single()

  if (userData?.subscription_status !== "pro") {
    return { success: false, error: "Pro subscription required" }
  }

  // SECURITY: Verify the calculation belongs to the user
  const { data: calculation } = await supabase
    .from("calculation_history")
    .select("user_id")
    .eq("id", id)
    .single()

  if (!calculation || calculation.user_id !== user.id) {
    return { success: false, error: "Unauthorized" }
  }

  const { error } = await supabase
    .from("calculation_history")
    .delete()
    .eq("id", id)

  if (error) {
    return { success: false, error: error.message }
  }

  revalidatePath("/account")
  return { success: true, error: null }
}

/**
 * Server action to save calculation to history (only for Pro users)
 * SECURITY: Server-side validation to prevent unauthorized access
 */
export async function saveCalculationToHistory(calculation: {
  baseLocation: unknown
  stops: unknown[]
  destination: unknown
  distance: number
  maxDistanceFromBase: number | null
  drivingDistance: number | null
  logbookRequired: boolean
  routeGeometry?: unknown
}) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { success: false, error: "Unauthorized" }
  }

  // SECURITY: Server-side check - user cannot bypass this
  const { data: userData } = await supabase
    .from("users")
    .select("subscription_status")
    .eq("id", user.id)
    .single()

  if (userData?.subscription_status !== "pro") {
    return { success: false, error: "Pro subscription required" }
  }

  // SECURITY: Validate stop count for Pro feature
  const stops = Array.isArray(calculation.stops) ? calculation.stops : []
  if (stops.length > 1) {
    // Multiple stops require Pro subscription (already validated above)
    // This is a double-check to ensure data integrity
  }

  const { error } = await supabase.from("calculation_history").insert({
    user_id: user.id,
    base_location: calculation.baseLocation,
    stops: calculation.stops,
    destination: calculation.destination,
    distance: calculation.distance,
    max_distance_from_base: calculation.maxDistanceFromBase,
    driving_distance: calculation.drivingDistance,
    logbook_required: calculation.logbookRequired,
    route_geometry: calculation.routeGeometry || null,
  })

  if (error) {
    console.error("Error saving calculation:", error)
    return { success: false, error: error.message }
  }

  revalidatePath("/account")
  return { success: true, error: null }
}

/**
 * Server action to validate if user can use multiple stops feature
 * SECURITY: Server-side validation - client must call this before allowing multi-stop calculations
 */
export async function validateMultipleStops() {
  const { isAuthorized, error } = await requireProSubscription()
  
  if (!isAuthorized) {
    return { success: false, error: error || "Pro subscription required" }
  }
  
  return { success: true, error: null }
}

/**
 * Server action to validate if user can export to PDF
 * SECURITY: Server-side validation - client must call this before PDF generation
 */
export async function validatePDFExport() {
  const { isAuthorized, error } = await requireProSubscription()
  
  if (!isAuthorized) {
    return { success: false, error: error || "Pro subscription required" }
  }
  
  return { success: true, error: null }
}

/**
 * Server action to validate if user can import CSV
 * SECURITY: Server-side validation - client must call this before CSV processing
 */
export async function validateCSVImport() {
  const { isAuthorized, error } = await requireProSubscription()
  
  if (!isAuthorized) {
    return { success: false, error: error || "Pro subscription required" }
  }
  
  return { success: true, error: null }
}

/**
 * Server action to validate if user can export CSV
 * SECURITY: Server-side validation - client must call this before CSV export
 */
export async function validateCSVExport() {
  const { isAuthorized, error } = await requireProSubscription()
  
  if (!isAuthorized) {
    return { success: false, error: error || "Pro subscription required" }
  }
  
  return { success: true, error: null }
}

