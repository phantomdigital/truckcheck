"use server"

import { createClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"

export interface Depot {
  id: string
  user_id: string
  address: string
  lat: number
  lng: number
  created_at: string
  updated_at: string
}

/**
 * Legacy type for single depot (used by DepotSettings component)
 * Maps to the first depot in the depots table
 */
export interface DepotData {
  depot_name: string
  depot_address: string
  depot_lat: number
  depot_lng: number
}

/**
 * Get all user's saved depots
 */
export async function getDepots(): Promise<{
  data: Depot[]
  error: string | null
}> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { data: [], error: "Unauthorized" }
  }

  const { data, error } = await supabase
    .from("depots")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })

  if (error) {
    return { data: [], error: error.message }
  }

  return { data: data as Depot[], error: null }
}

/**
 * Save a new depot (Pro feature)
 */
export async function saveDepot(depot: {
  name?: string
  address: string
  lat: number
  lng: number
}): Promise<{
  success: boolean
  error?: string
  data?: Depot
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

  // For legacy single-depot UI: update or replace the first depot
  // Check if user already has a depot
  const { data: existingDepots } = await supabase
    .from("depots")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(1)

  // Format address: include name if provided
  const formattedAddress = depot.name 
    ? `${depot.name} - ${depot.address}`
    : depot.address

  if (existingDepots && existingDepots.length > 0) {
    // Update existing depot
    const { data: updatedDepot, error } = await supabase
      .from("depots")
      .update({
        address: formattedAddress,
        lat: depot.lat,
        lng: depot.lng,
        updated_at: new Date().toISOString(),
      })
      .eq("id", existingDepots[0].id)
      .select()
      .single()

    if (error) {
      return { success: false, error: error.message }
    }

    revalidatePath("/account")
    revalidatePath("/logbook-calculator")

    return { success: true, data: updatedDepot as Depot }
  }

  // Insert new depot
  const { data: newDepot, error } = await supabase
    .from("depots")
    .insert({
      user_id: user.id,
      address: formattedAddress,
      lat: depot.lat,
      lng: depot.lng,
    })
    .select()
    .single()

  if (error) {
    return { success: false, error: error.message }
  }

  revalidatePath("/account")
  revalidatePath("/logbook-calculator")

  return { success: true, data: newDepot as Depot }
}

/**
 * Delete a specific depot
 */
export async function deleteDepot(depotId: string): Promise<{
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
    .from("depots")
    .delete()
    .eq("id", depotId)
    .eq("user_id", user.id)

  if (error) {
    return { success: false, error: error.message }
  }

  revalidatePath("/account")
  revalidatePath("/logbook-calculator")

  return { success: true }
}

/**
 * Get the first depot (for legacy single-depot UI)
 * Returns the most recently created depot
 */
export async function getDepot(): Promise<{
  data: DepotData | null
  error: string | null
}> {
  const result = await getDepots()
  
  if (result.error) {
    return { data: null, error: result.error }
  }
  
  if (result.data.length === 0) {
    return { data: null, error: null }
  }
  
  // Return the first (most recent) depot
  const depot = result.data[0]
  
  // Parse name from address if it's in format "Name - Address"
  const addressParts = depot.address.split(" - ")
  const depotName = addressParts.length > 1 ? addressParts[0] : depot.address
  const depotAddress = addressParts.length > 1 ? addressParts.slice(1).join(" - ") : depot.address
  
  return {
    data: {
      depot_name: depotName,
      depot_address: depotAddress,
      depot_lat: depot.lat,
      depot_lng: depot.lng,
    },
    error: null,
  }
}

/**
 * Clear/delete the first depot (for legacy single-depot UI)
 * Deletes the most recently created depot
 */
export async function clearDepot(): Promise<{
  success: boolean
  error?: string
}> {
  const result = await getDepots()
  
  if (result.error) {
    return { success: false, error: result.error }
  }
  
  if (result.data.length === 0) {
    return { success: true } // Already cleared
  }
  
  // Delete the first (most recent) depot
  return await deleteDepot(result.data[0].id)
}

