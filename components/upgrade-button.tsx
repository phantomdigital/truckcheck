"use client"

import { useCheckout } from "@/lib/stripe/hooks"
import { Button } from "@/components/ui/button"
import { Sparkles, Loader2 } from "lucide-react"
import { useRouter } from "next/navigation"
import { useState, useEffect } from "react"

interface UpgradeButtonProps {
  className?: string
  variant?: "default" | "outline" | "secondary"
  size?: "default" | "sm" | "lg" | "icon"
  priceId?: string
}

export function UpgradeButton({
  className,
  variant = "default",
  size = "default",
  priceId,
}: UpgradeButtonProps) {
  const { createCheckout, loading } = useCheckout()
  const router = useRouter()
  const [isAuthenticated, setIsAuthenticated] = useState(false)

  useEffect(() => {
    // Check if user is authenticated
    const checkAuth = async () => {
      const { createClient } = await import("@/lib/supabase/client")
      const supabase = createClient()
      const {
        data: { user },
      } = await supabase.auth.getUser()
      setIsAuthenticated(!!user)
    }
    checkAuth()
  }, [])

  const handleClick = () => {
    // Track upgrade button click
    captureEvent("upgrade_button_clicked", {
      price_id: priceId,
      is_authenticated: isAuthenticated,
      location: "upgrade_button",
    })
    
    if (!isAuthenticated) {
      // Redirect to sign-up with checkout intent - better UX for new users
      const params = new URLSearchParams()
      params.set("redirect", "/pricing")
      params.set("checkout", "true")
      params.set("plan", "Pro") // Pass plan name in URL for dynamic messaging
      if (priceId) {
        params.set("priceId", priceId)
      }
      router.push(`/auth/sign-up?${params.toString()}`)
      return
    }
    createCheckout(priceId)
  }

  return (
    <Button
      onClick={handleClick}
      disabled={loading}
      className={`${className} !rounded-md`}
      variant="cta"
      size={size}
    >
      {loading ? (
        <>
          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
          Preparing checkout...
        </>
      ) : (
        <>
          <Sparkles className="h-4 w-4 mr-2" />
          Upgrade to Pro
        </>
      )}
    </Button>
  )
}

