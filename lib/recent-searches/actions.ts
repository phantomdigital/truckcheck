"use server"

import { createClient, getCachedUser } from "@/lib/supabase/server"
import { getSubscriptionStatus } from "@/lib/stripe/actions"
import { revalidatePath } from "next/cache"

/**
 * Server action to get recent searches (Pro users only)
 * SECURITY: Server-side validation + RLS enforcement
 * Uses cached functions to avoid duplicate queries
 */
export async function getRecentSearches() {
  // Use cached user to avoid duplicate auth calls
  const user = await getCachedUser()

  if (!user) {
    return { data: [], error: "Unauthorized" }
  }

  // Use cached subscription status to avoid duplicate queries
  const { isPro } = await getSubscriptionStatus()

  if (!isPro) {
    return { data: [], error: "Pro subscription required" }
  }

  // RLS policies will further enforce this at database level
  const supabase = await createClient()
  const { data, error } = await supabase
    .from("recent_searches")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(20)

  if (error) {
    return { data: [], error: error.message }
  }

  return { data: data || [], error: null }
}

/**
 * Server action to save a recent search (Pro users only)
 * SECURITY: Server-side validation + RLS enforcement
 */
export async function saveRecentSearch(search: {
  baseLocation: unknown
  stops: unknown[]
  distance: number
  logbookRequired: boolean
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

  const supabase = await createClient()

  // RLS policies will further enforce this at database level
  const { error } = await supabase.from("recent_searches").insert({
    user_id: user.id,
    base_location: search.baseLocation,
    stops: search.stops,
    distance: search.distance,
    logbook_required: search.logbookRequired,
  })

  if (error) {
    console.error("Error saving recent search:", error)
    return { success: false, error: error.message }
  }

  revalidatePath("/100km-distance-checker-as-the-crow-flies")
  revalidatePath("/account")
  return { success: true, error: null }
}

/**
 * Server action to delete a single recent search (Pro users only)
 * SECURITY: Server-side validation + RLS enforcement + ownership check
 */
export async function deleteRecentSearch(searchId: string) {
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

  const supabase = await createClient()

  // SECURITY: RLS policies will ensure user can only delete their own searches
  const { error } = await supabase
    .from("recent_searches")
    .delete()
    .eq("id", searchId)
    .eq("user_id", user.id) // Double-check ownership

  if (error) {
    console.error("Error deleting recent search:", error)
    return { success: false, error: error.message }
  }

  revalidatePath("/100km-distance-checker-as-the-crow-flies")
  revalidatePath("/account")
  return { success: true, error: null }
}

/**
 * Server action to delete all recent searches (Pro users only)
 * SECURITY: Server-side validation + RLS enforcement
 */
export async function clearRecentSearches() {
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

  const supabase = await createClient()

  // RLS policies will further enforce this at database level
  const { error } = await supabase
    .from("recent_searches")
    .delete()
    .eq("user_id", user.id)

  if (error) {
    console.error("Error clearing recent searches:", error)
    return { success: false, error: error.message }
  }

  revalidatePath("/100km-distance-checker-as-the-crow-flies")
  revalidatePath("/account")
  return { success: true, error: null }
}

