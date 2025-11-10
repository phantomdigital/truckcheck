"use client"

import { useCheckout } from "@/lib/stripe/hooks"
import { Button } from "@/components/ui/button"
import { Sparkles } from "lucide-react"
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
    if (!isAuthenticated) {
      router.push("/auth/login?redirect=/pricing")
      return
    }
    createCheckout(priceId)
  }

  return (
    <Button
      onClick={handleClick}
      disabled={loading}
      className={className}
      variant={variant}
      size={size}
    >
      <Sparkles className="h-4 w-4 mr-2" />
      {loading ? "Loading..." : "Upgrade to Pro"}
    </Button>
  )
}

