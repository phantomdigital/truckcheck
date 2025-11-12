"use client"

import { useEffect } from "react"
import { captureEvent, identifyUser, setUserProperties } from "@/lib/posthog/utils"
import { createClient } from "@/lib/supabase/client"
import { getSubscriptionStatus } from "@/lib/stripe/actions"

/**
 * Client component to track checkout success and update user properties
 * This runs on the client side after the checkout success page loads
 */
export function CheckoutSuccessTracker() {
  useEffect(() => {
    const trackSuccess = async () => {
      try {
        const supabase = createClient()
        const { data: { user } } = await supabase.auth.getUser()
        
        if (!user) return

        // Check subscription status from users table
        const { data: userData } = await supabase
          .from("users")
          .select("subscription_status")
          .eq("id", user.id)
          .single()

        const isPro = userData?.subscription_status === "pro"

        // Track subscription activated event
        captureEvent("subscription_activated", {
          user_id: user.id,
          subscription_status: isPro ? "pro" : "free",
        })

        // Identify user and set subscription properties
        identifyUser(user.id, {
          email: user.email,
          subscription_status: isPro ? "pro" : "free",
        })

        // Set user properties
        setUserProperties({
          subscription_status: isPro ? "pro" : "free",
          is_pro: isPro,
        })
      } catch (error) {
        console.error("Error tracking checkout success:", error)
      }
    }

    trackSuccess()
  }, [])

  return null
}

