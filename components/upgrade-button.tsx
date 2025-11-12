"use client"

import { useCheckout } from "@/lib/stripe/hooks"
import { captureEvent } from "@/lib/posthog/utils"
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

  const handleClick = () => {
    // Track upgrade button click
    captureEvent("upgrade_button_clicked", {
      price_id: priceId,
      location: "upgrade_button",
    })
    
    // Let useCheckout handle auth check and redirect
    // It will redirect to sign-up with checkout intent for better UX
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

