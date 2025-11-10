"use server"

import { createClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"

/**
 * Server action to get recent searches (Pro users only)
 * SECURITY: Server-side validation + RLS enforcement
 */
export async function getRecentSearches() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { data: [], error: "Unauthorized" }
  }

  // SECURITY: Check Pro subscription status
  const { data: userData } = await supabase
    .from("users")
    .select("subscription_status")
    .eq("id", user.id)
    .single()

  if (userData?.subscription_status !== "pro") {
    return { data: [], error: "Pro subscription required" }
  }

  // RLS policies will further enforce this at database level
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

  revalidatePath("/logbook-calculator")
  revalidatePath("/account")
  return { success: true, error: null }
}

/**
 * Server action to delete a single recent search (Pro users only)
 * SECURITY: Server-side validation + RLS enforcement + ownership check
 */
export async function deleteRecentSearch(searchId: string) {
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

  revalidatePath("/logbook-calculator")
  revalidatePath("/account")
  return { success: true, error: null }
}

/**
 * Server action to delete all recent searches (Pro users only)
 * SECURITY: Server-side validation + RLS enforcement
 */
export async function clearRecentSearches() {
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

  // RLS policies will further enforce this at database level
  const { error } = await supabase
    .from("recent_searches")
    .delete()
    .eq("user_id", user.id)

  if (error) {
    console.error("Error clearing recent searches:", error)
    return { success: false, error: error.message }
  }

  revalidatePath("/logbook-calculator")
  revalidatePath("/account")
  return { success: true, error: null }
}

