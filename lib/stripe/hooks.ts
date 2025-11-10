"use client"

import { useRouter } from "next/navigation"
import { useState } from "react"
import { toast } from "sonner"
import { createClient } from "@/lib/supabase/client"

/**
 * Hook to create checkout session and redirect to Stripe
 */
export function useCheckout() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  const createCheckout = async (priceId?: string) => {
    try {
      setLoading(true)
      const supabase = createClient()
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) {
        toast.error("Please sign in to upgrade")
        router.push("/auth/login")
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
        window.location.href = url
      }
    } catch (error) {
      console.error("Error creating checkout:", error)
      toast.error("Failed to start checkout. Please try again.")
    } finally {
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
        window.location.href = url
      }
    } catch (error) {
      console.error("Error creating portal:", error)
      toast.error("Failed to open customer portal. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  return { createPortal, loading }
}

