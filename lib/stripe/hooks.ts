"use client"

import { useRouter } from "next/navigation"
import { useState } from "react"
import { toast } from "sonner"
import { createClient } from "@/lib/supabase/client"
import { safeCaptureException } from "@/lib/sentry/utils"
import { captureEvent } from "@/lib/posthog/utils"

/**
 * Hook to create checkout session and redirect to Stripe
 * 
 * SECURITY NOTE: This hook performs a client-side auth check for UX purposes
 * (early redirect, better error messages). However, the actual security validation
 * happens server-side in /api/stripe/create-checkout/route.ts, which uses
 * createClient() from @/lib/supabase/server to validate the user's session.
 * 
 * The server-side validation is the source of truth - client-side checks are
 * purely for better user experience and can be bypassed, but the server will
 * reject unauthorised requests.
 */
export function useCheckout() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  const createCheckout = async (priceId?: string) => {
    // Set loading immediately for instant feedback (before any async operations)
    // This ensures users see feedback even on slow connections
    setLoading(true)
    
    try {
      // Client-side check for UX (early redirect, better error messages)
      // Actual security validation happens server-side in the API route
      const supabase = createClient()
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) {
        // Redirect to sign-up with checkout intent - better UX for new users
        // They can sign up or login from there
        // Keep loading state during redirect - don't reset it
        const params = new URLSearchParams()
        params.set("redirect", "/pricing")
        params.set("checkout", "true")
        params.set("plan", "Pro")
        if (priceId) {
          params.set("priceId", priceId)
        }
        router.push(`/auth/sign-up?${params.toString()}`)
        // Don't reset loading - let it persist during navigation
        // Component will unmount anyway, so this is fine
        return
      }

      const response = await fetch("/api/stripe/create-checkout", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ priceId }),
      })

      if (!response.ok) {
        throw new Error("Failed to create checkout session")
      }

      const { url } = await response.json()

      if (url) {
        // Track checkout started event
        captureEvent("checkout_started", {
          price_id: priceId,
          user_id: user?.id,
        })
        // Redirect to Stripe - don't reset loading, page will navigate away
        window.location.href = url
        return
      }
      
      // If no URL returned, treat as error
      throw new Error("No checkout URL returned")
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error))
      console.error("Error creating checkout:", error)
      safeCaptureException(err, {
        context: "client_checkout_creation",
        priceId,
      })
      toast.error("Failed to start checkout. Please try again.")
      // Only reset loading on error (not on redirects)
      setLoading(false)
    }
  }

  return { createCheckout, loading }
}

/**
 * Hook to create customer portal session
 */
export function useCustomerPortal() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  const createPortal = async () => {
    let customerId: string | undefined
    try {
      setLoading(true)
      const supabase = createClient()
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) {
        toast.error("Please sign in")
        router.push("/auth/login")
        return
      }

      const { data: userData } = await supabase
        .from("users")
        .select("stripe_customer_id")
        .eq("id", user.id)
        .single()

      if (!userData?.stripe_customer_id) {
        toast.error("No subscription found")
        return
      }

      customerId = userData.stripe_customer_id

      const response = await fetch("/api/stripe/create-portal", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          customerId: userData.stripe_customer_id,
        }),
      })

      if (!response.ok) {
        throw new Error("Failed to create portal session")
      }

      const { url } = await response.json()

      if (url) {
        // Track customer portal access
        captureEvent("customer_portal_accessed", {
          user_id: user.id,
          customer_id: customerId,
        })
        window.location.href = url
      }
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error))
      console.error("Error creating portal:", error)
      safeCaptureException(err, {
        context: "client_portal_creation",
        customerId,
      })
      toast.error("Failed to open customer portal. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  return { createPortal, loading }
}

