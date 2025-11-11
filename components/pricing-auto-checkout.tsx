"use client"

import { useEffect, useState } from "react"
import { useSearchParams } from "next/navigation"
import { useCheckout } from "@/lib/stripe/hooks"
import { createClient } from "@/lib/supabase/client"
import { Loader2 } from "lucide-react"

interface PricingAutoCheckoutProps {
  isAuthenticated: boolean
}

/**
 * Auto-starts checkout when user arrives at pricing page with checkout intent.
 * Verifies authentication client-side to handle cases where user just signed up.
 */
export function PricingAutoCheckout({ isAuthenticated }: PricingAutoCheckoutProps) {
  const searchParams = useSearchParams()
  const shouldCheckout = searchParams.get("checkout") === "true"
  const priceId = searchParams.get("priceId") || undefined
  const { createCheckout, loading } = useCheckout()
  const [hasChecked, setHasChecked] = useState(false)
  const [clientAuthChecked, setClientAuthChecked] = useState(false)
  const [isClientAuthenticated, setIsClientAuthenticated] = useState(false)

  // Check authentication client-side (important for users who just signed up)
  // Retry mechanism to handle cases where session isn't immediately available after sign-up
  useEffect(() => {
    if (!shouldCheckout || clientAuthChecked) return

    let retryCount = 0
    const maxRetries = 5
    const retryDelay = 500 // 500ms between retries

    const checkAuth = async () => {
      console.log(`[PricingAutoCheckout] Checking client-side authentication (attempt ${retryCount + 1})...`)
      const supabase = createClient()
      
      // Check both getUser() and getSession() for better reliability
      const [userResult, sessionResult] = await Promise.all([
        supabase.auth.getUser(),
        supabase.auth.getSession()
      ])
      
      const user = userResult.data.user || sessionResult.data.session?.user
      const hasSession = !!user || !!sessionResult.data.session
      const error = userResult.error || sessionResult.error
      
      if (error) {
        console.error('[PricingAutoCheckout] Auth check error:', error)
      }
      
      console.log('[PricingAutoCheckout] User authenticated:', !!user, 'Has session:', hasSession)
      
      if (hasSession) {
        setIsClientAuthenticated(true)
        setClientAuthChecked(true)
      } else if (retryCount < maxRetries) {
        // Retry if no session found (might be propagating after sign-up)
        retryCount++
        setTimeout(checkAuth, retryDelay)
      } else {
        // Give up after max retries
        console.log('[PricingAutoCheckout] No session found after retries')
        setIsClientAuthenticated(false)
        setClientAuthChecked(true)
      }
    }

    checkAuth()
  }, [shouldCheckout, clientAuthChecked])

  useEffect(() => {
    // Only proceed if checkout intent is present, user is authenticated (server or client), and we haven't checked yet
    if (!shouldCheckout || hasChecked || loading) return
    
    // Wait for client auth check to complete
    if (!clientAuthChecked) return
    
    // Use client-side auth status if available (more reliable for just-signed-up users)
    // Otherwise fall back to server-side status
    const authenticated = isClientAuthenticated || isAuthenticated
    
    if (!authenticated) {
      console.log('[PricingAutoCheckout] User not authenticated, cannot proceed with checkout')
      return
    }

    console.log('[PricingAutoCheckout] Starting checkout with priceId:', priceId)
    setHasChecked(true)
    // Small delay to ensure page is fully loaded and hydrated
    const timer = setTimeout(() => {
      console.log('[PricingAutoCheckout] Calling createCheckout')
      createCheckout(priceId)
    }, 500)

    return () => clearTimeout(timer)
  }, [shouldCheckout, isAuthenticated, isClientAuthenticated, clientAuthChecked, hasChecked, loading, priceId])

  // Show loading overlay while checking auth and preparing checkout
  if (shouldCheckout && (!clientAuthChecked || !hasChecked)) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground">
            {!clientAuthChecked 
              ? "Preparing checkout..." 
              : "Starting checkout..."}
          </p>
        </div>
      </div>
    )
  }

  return null
}

