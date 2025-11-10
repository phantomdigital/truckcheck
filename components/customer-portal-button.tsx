"use client"

import { useCustomerPortal } from "@/lib/stripe/hooks"
import { Button, type ButtonProps } from "@/components/ui/button"
import { Settings } from "lucide-react"
import { ReactNode } from "react"

interface CustomerPortalButtonProps {
  children?: ReactNode
  className?: string
  variant?: ButtonProps["variant"]
}

export function CustomerPortalButton({ 
  children, 
  className,
  variant = "outline" 
}: CustomerPortalButtonProps) {
  const { createPortal, loading } = useCustomerPortal()

  return (
    <Button 
      onClick={createPortal} 
      disabled={loading} 
      variant={variant}
      className={className}
    >
      {children || (
        <>
          <Settings className="h-4 w-4 mr-2" />
          {loading ? "Loading..." : "Manage Subscription"}
        </>
      )}
    </Button>
  )
}

