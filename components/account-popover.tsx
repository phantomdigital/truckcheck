"use client"

import { useState } from "react"
import Link from "next/link"
import { Button } from "./ui/button"
import { Badge } from "./ui/badge"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { LogoutButton } from "./logout-button"
import { useCustomerPortal } from "@/lib/stripe/hooks"
import { User, Crown, Calendar, CreditCard, Settings, ChevronDown } from "lucide-react"

interface AccountPopoverProps {
  user: {
    email?: string
    firstName?: string | null
    lastName?: string | null
  }
  isPro: boolean
  subscriptionEndDate?: string | null
}

export function AccountPopover({ user, isPro, subscriptionEndDate }: AccountPopoverProps) {
  const [open, setOpen] = useState(false)
  const { createPortal, loading: portalLoading } = useCustomerPortal()
  
  // Display name or email
  const displayName = user.firstName && user.lastName 
    ? `${user.firstName} ${user.lastName}`
    : user.firstName || user.email

  const handleManageSubscription = async () => {
    setOpen(false) // Close popover immediately
    await createPortal()
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="sm" className="gap-2">
          <User className="h-4 w-4" />
          <span className="max-w-[100px] truncate">{displayName}</span>
          <ChevronDown className="h-3 w-3 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 border-border/40 shadow-lg" align="end">
        <div className="space-y-3">
          {/* User Info */}
          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium leading-none">
                {user.firstName && user.lastName 
                  ? `${user.firstName} ${user.lastName}`
                  : 'Account'}
              </p>
              {isPro && (
                <Badge variant="default" className="gap-1">
                  <Crown className="h-3 w-3" />
                  Pro
                </Badge>
              )}
            </div>
            <p className="text-sm text-muted-foreground truncate">
              {user.email}
            </p>
          </div>

          {/* Subscription Info */}
          {isPro && subscriptionEndDate && (
            <div className="rounded-md border border-border/30 bg-muted/30 p-3 space-y-1">
              <div className="flex items-center gap-2 text-sm font-medium">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <span>Pro Subscription</span>
              </div>
              <p className="text-xs text-muted-foreground">
                Active until {new Date(subscriptionEndDate).toLocaleDateString('en-AU', { 
                  year: 'numeric', 
                  month: 'long', 
                  day: 'numeric' 
                })}
              </p>
            </div>
          )}

          {/* Free User CTA */}
          {!isPro && (
            <div className="rounded-md border border-primary/20 bg-primary/5 p-3 space-y-2.5">
              <div className="flex items-center gap-2">
                <Crown className="h-4 w-4 text-primary" />
                <p className="text-sm font-medium">Upgrade to Pro</p>
              </div>
              <p className="text-xs text-muted-foreground">
                Unlock all features including CSV import, PDF export, and calculation history.
              </p>
              <Button asChild size="sm" className="w-full mt-1" onClick={() => setOpen(false)}>
                <Link href="/pricing" prefetch={true} className="inline-flex items-center justify-center">View Plans</Link>
              </Button>
            </div>
          )}

          <div className="border-t border-border/30 pt-2.5 space-y-1">
            {/* Quick Links */}
            <Button
              asChild
              variant="ghost"
              size="sm"
              className="w-full justify-start px-3 h-9"
              onClick={() => setOpen(false)}
            >
              <Link href="/account" prefetch={true} className="inline-flex items-center">
                <Settings className="mr-2 h-4 w-4" />
                Account Settings
              </Link>
            </Button>

            {isPro && (
              <Button
                variant="ghost"
                size="sm"
                className="w-full justify-start px-3 h-9"
                onClick={handleManageSubscription}
                disabled={portalLoading}
              >
                <CreditCard className="mr-2 h-4 w-4" />
                {portalLoading ? "Loading..." : "Manage Subscription"}
              </Button>
            )}

            {/* Logout */}
            <div className="pt-1.5 mt-1.5 border-t border-border/30">
              <LogoutButton className="w-full px-3 h-9" />
            </div>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  )
}

