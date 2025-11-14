"use server"

import { cache } from "react"
import { createClient, getCachedUser } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"
import { safeCaptureException } from "@/lib/sentry/utils"
import type { TruckProfile, LoadCalculation, TruckProfileFormData } from "./types"
import { validateTruckProfile } from "./physics"

/**
 * Get all truck profiles for the current user
 */
export const getTruckProfiles = cache(async (): Promise<{
  success: boolean
  profiles?: TruckProfile[]
  error?: string
}> => {
  try {
    const user = await getCachedUser()
    // Allow unauthenticated access for testing
    // if (!user) {
    //   return { success: false, error: "Not authenticated" }
    // }

    const supabase = await createClient()
    const query = supabase
      .from("truck_profiles")
      .select("*")
    
    if (user) {
      query.eq("user_id", user.id)
    }
    
    const { data, error } = await query
      .order("created_at", { ascending: false })

    if (error) {
      safeCaptureException(error, { context: "getTruckProfiles" })
      return { success: false, error: error.message }
    }

    return { success: true, profiles: data as TruckProfile[] }
  } catch (error) {
    safeCaptureException(error as Error, { context: "getTruckProfiles" })
    return { success: false, error: "Failed to fetch truck profiles" }
  }
})

/**
 * Get a single truck profile by ID
 */
export const getTruckProfile = cache(
  async (
    id: string
  ): Promise<{
    success: boolean
    profile?: TruckProfile
    error?: string
  }> => {
    try {
      const user = await getCachedUser()
      // Allow unauthenticated access for testing
      // if (!user) {
      //   return { success: false, error: "Not authenticated" }
      // }

      const supabase = await createClient()
      const query = supabase
        .from("truck_profiles")
        .select("*")
        .eq("id", id)
      
      if (user) {
        query.eq("user_id", user.id)
      }
      
      const { data, error } = await query.single()

      if (error) {
        safeCaptureException(error, { context: "getTruckProfile" })
        return { success: false, error: error.message }
      }

      return { success: true, profile: data as TruckProfile }
    } catch (error) {
      safeCaptureException(error as Error, { context: "getTruckProfile" })
      return { success: false, error: "Failed to fetch truck profile" }
    }
  }
)

/**
 * Create a new truck profile
 */
export async function createTruckProfile(
  formData: TruckProfileFormData
): Promise<{
  success: boolean
  profile?: TruckProfile
  error?: string
}> {
  try {
    const user = await getCachedUser()
    // Allow unauthenticated access for testing
    // if (!user) {
    //   return { success: false, error: "Not authenticated" }
    // }

    // Validate the profile data
    const validation = validateTruckProfile(formData)
    if (!validation.valid) {
      return { success: false, error: validation.errors.join(", ") }
    }

    const supabase = await createClient()
    const { data, error } = await supabase
      .from("truck_profiles")
      .insert({
        ...formData,
        user_id: user?.id || null, // Allow null for testing
      })
      .select()
      .single()

    if (error) {
      safeCaptureException(error, { context: "createTruckProfile" })
      return { success: false, error: error.message }
    }

    revalidatePath("/load-calculator")
    return { success: true, profile: data as TruckProfile }
  } catch (error) {
    safeCaptureException(error as Error, { context: "createTruckProfile" })
    return { success: false, error: "Failed to create truck profile" }
  }
}

/**
 * Update an existing truck profile
 */
export async function updateTruckProfile(
  id: string,
  formData: TruckProfileFormData
): Promise<{
  success: boolean
  profile?: TruckProfile
  error?: string
}> {
  try {
    const user = await getCachedUser()
    // Allow unauthenticated access for testing
    // if (!user) {
    //   return { success: false, error: "Not authenticated" }
    // }

    // Validate the profile data
    const validation = validateTruckProfile(formData)
    if (!validation.valid) {
      return { success: false, error: validation.errors.join(", ") }
    }

    const supabase = await createClient()
    const query = supabase
      .from("truck_profiles")
      .update(formData)
      .eq("id", id)
    
    if (user) {
      query.eq("user_id", user.id)
    }
    
    const { data, error } = await query
      .select()
      .single()

    if (error) {
      safeCaptureException(error, { context: "updateTruckProfile" })
      return { success: false, error: error.message }
    }

    revalidatePath("/load-calculator")
    return { success: true, profile: data as TruckProfile }
  } catch (error) {
    safeCaptureException(error as Error, { context: "updateTruckProfile" })
    return { success: false, error: "Failed to update truck profile" }
  }
}

/**
 * Delete a truck profile
 */
export async function deleteTruckProfile(id: string): Promise<{
  success: boolean
  error?: string
}> {
  try {
    const user = await getCachedUser()
    // Allow unauthenticated access for testing
    // if (!user) {
    //   return { success: false, error: "Not authenticated" }
    // }

    const supabase = await createClient()
    const query = supabase
      .from("truck_profiles")
      .delete()
      .eq("id", id)
    
    if (user) {
      query.eq("user_id", user.id)
    }
    
    const { error } = await query

    if (error) {
      safeCaptureException(error, { context: "deleteTruckProfile" })
      return { success: false, error: error.message }
    }

    revalidatePath("/load-calculator")
    return { success: true }
  } catch (error) {
    safeCaptureException(error as Error, { context: "deleteTruckProfile" })
    return { success: false, error: "Failed to delete truck profile" }
  }
}

/**
 * Get all load calculations for the current user
 */
export const getLoadCalculations = cache(async (): Promise<{
  success: boolean
  calculations?: LoadCalculation[]
  error?: string
}> => {
  try {
    const user = await getCachedUser()
    // Allow unauthenticated access for testing
    // if (!user) {
    //   return { success: false, error: "Not authenticated" }
    // }

    const supabase = await createClient()
    const query = supabase
      .from("load_calculations")
      .select(`
        *,
        truck_profile:truck_profiles(*)
      `)
    
    if (user) {
      query.eq("user_id", user.id)
    }
    
    const { data, error } = await query
      .order("created_at", { ascending: false })
      .limit(50)

    if (error) {
      safeCaptureException(error, { context: "getLoadCalculations" })
      return { success: false, error: error.message }
    }

    // Transform the data to match our type
    const calculations = data.map((calc: any) => ({
      ...calc,
      truck_profile: calc.truck_profile,
    })) as LoadCalculation[]

    return { success: true, calculations }
  } catch (error) {
    safeCaptureException(error as Error, { context: "getLoadCalculations" })
    return { success: false, error: "Failed to fetch load calculations" }
  }
})

/**
 * Save a load calculation
 */
export async function saveLoadCalculation(
  calculation: Omit<LoadCalculation, "id" | "user_id" | "created_at" | "updated_at">
): Promise<{
  success: boolean
  calculation?: LoadCalculation
  error?: string
}> {
  try {
    const user = await getCachedUser()
    // Allow unauthenticated access for testing
    // if (!user) {
    //   return { success: false, error: "Not authenticated" }
    // }

    const supabase = await createClient()
    const { data, error } = await supabase
      .from("load_calculations")
      .insert({
        ...calculation,
        user_id: user?.id || null, // Allow null for testing
      })
      .select(`
        *,
        truck_profile:truck_profiles(*)
      `)
      .single()

    if (error) {
      safeCaptureException(error, { context: "saveLoadCalculation" })
      return { success: false, error: error.message }
    }

    revalidatePath("/load-calculator")
    return { success: true, calculation: data as any }
  } catch (error) {
    safeCaptureException(error as Error, { context: "saveLoadCalculation" })
    return { success: false, error: "Failed to save load calculation" }
  }
}

/**
 * Delete a load calculation
 */
export async function deleteLoadCalculation(id: string): Promise<{
  success: boolean
  error?: string
}> {
  try {
    const user = await getCachedUser()
    // Allow unauthenticated access for testing
    // if (!user) {
    //   return { success: false, error: "Not authenticated" }
    // }

    const supabase = await createClient()
    const query = supabase
      .from("load_calculations")
      .delete()
      .eq("id", id)
    
    if (user) {
      query.eq("user_id", user.id)
    }
    
    const { error } = await query

    if (error) {
      safeCaptureException(error, { context: "deleteLoadCalculation" })
      return { success: false, error: error.message }
    }

    revalidatePath("/load-calculator")
    return { success: true }
  } catch (error) {
    safeCaptureException(error as Error, { context: "deleteLoadCalculation" })
    return { success: false, error: "Failed to delete load calculation" }
  }
}

