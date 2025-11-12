"use client"

import { useCheckout } from "@/lib/stripe/hooks"
import { captureEvent } from "@/lib/posthog/utils"
import { Button } from "@/components/ui/button"
import { Sparkles, Loader2 } from "lucide-react"

interface UpgradeButtonProps {
  className?: string
  variant?: "default" | "outline" | "secondary"
  size?: "default" | "sm" | "lg" | "icon"
  priceId?: string
}

export function UpgradeButton({
  className,
  size = "default",
  priceId,
}: UpgradeButtonProps) {
  const { createCheckout, loading, loadingMessage } = useCheckout()

  const handleClick = () => {
    // Track upgrade button click (non-blocking)
    captureEvent("upgrade_button_clicked", {
      price_id: priceId,
      location: "upgrade_button",
    })
    
    // Call createCheckout - it handles loading state and redirect
    // Loading state is set immediately inside createCheckout for instant feedback
    createCheckout(priceId)
  }

  return (
    <Button
      onClick={handleClick}
      disabled={loading}
      className={`${className} rounded-md!`}
      variant="cta"
      size={size}
    >
      {loading ? (
        <>
          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
          {loadingMessage}
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

