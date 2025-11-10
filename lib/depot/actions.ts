"use server"

import { createClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"

export interface DepotData {
  depot_name: string | null
  depot_address: string | null
  depot_lat: number | null
  depot_lng: number | null
}

/**
 * Get user's saved depot
 */
export async function getDepot(): Promise<{
  data: DepotData | null
  error: string | null
}> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { data: null, error: "Unauthorized" }
  }

  const { data, error } = await supabase
    .from("users")
    .select("depot_name, depot_address, depot_lat, depot_lng")
    .eq("id", user.id)
    .single()

  if (error) {
    return { data: null, error: error.message }
  }

  return { data: data as DepotData, error: null }
}

/**
 * Save or update user's depot (Pro feature)
 */
export async function saveDepot(depot: {
  name: string
  address: string
  lat: number
  lng: number
}): Promise<{
  success: boolean
  error?: string
}> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { success: false, error: "Unauthorized" }
  }

  // Check if user is Pro
  const { data: userData } = await supabase
    .from("users")
    .select("subscription_status")
    .eq("id", user.id)
    .single()

  if (userData?.subscription_status !== "pro") {
    return { success: false, error: "Pro subscription required" }
  }

  // Update depot
  const { error } = await supabase
    .from("users")
    .update({
      depot_name: depot.name,
      depot_address: depot.address,
      depot_lat: depot.lat,
      depot_lng: depot.lng,
    })
    .eq("id", user.id)

  if (error) {
    return { success: false, error: error.message }
  }

  revalidatePath("/account")
  revalidatePath("/logbook-calculator")

  return { success: true }
}

/**
 * Clear user's depot
 */
export async function clearDepot(): Promise<{
  success: boolean
  error?: string
}> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { success: false, error: "Unauthorized" }
  }

  const { error } = await supabase
    .from("users")
    .update({
      depot_name: null,
      depot_address: null,
      depot_lat: null,
      depot_lng: null,
    })
    .eq("id", user.id)

  if (error) {
    return { success: false, error: error.message }
  }

  revalidatePath("/account")
  revalidatePath("/logbook-calculator")

  return { success: true }
}

