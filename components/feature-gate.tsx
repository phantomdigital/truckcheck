"use client"

import { useCheckout } from "@/lib/stripe/hooks"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Lock, Sparkles } from "lucide-react"
import Link from "next/link"

interface FeatureGateProps {
  children: React.ReactNode
  feature: string
  isPro: boolean
  showUpgrade?: boolean
}

export function FeatureGate({ children, feature, isPro, showUpgrade = true }: FeatureGateProps) {
  if (isPro) {
    return <>{children}</>
  }

  if (!showUpgrade) {
    return null
  }

  return (
    <Card className="border-amber-500/50 bg-amber-50/50 dark:bg-amber-950/10">
      <CardHeader>
        <div className="flex items-center gap-2">
          <Lock className="h-5 w-5 text-amber-600 dark:text-amber-400" />
          <CardTitle className="text-lg">Pro Feature</CardTitle>
        </div>
        <CardDescription>
          {feature} is available for Pro subscribers
        </CardDescription>
      </CardHeader>
      <CardContent>
        <UpgradePrompt />
      </CardContent>
    </Card>
  )
}

export function UpgradePrompt({ className }: { className?: string }) {
  const { createCheckout, loading } = useCheckout()

  return (
    <div className={className}>
      <div className="space-y-4">
        <div className="space-y-2">
          <h3 className="font-semibold text-lg">Upgrade to Pro</h3>
          <p className="text-sm text-muted-foreground">
            Unlock premium features including CSV import, PDF/CSV export, calculation history, and an ad-free experience.
          </p>
        </div>
        <div className="flex flex-col sm:flex-row gap-2">
          <Button onClick={() => createCheckout()} disabled={loading} className="flex-1">
            <Sparkles className="h-4 w-4 mr-2" />
            {loading ? "Loading..." : "Upgrade to Pro - $18/month"}
          </Button>
          <Button variant="outline" asChild>
            <Link href="/pricing">View Pricing</Link>
          </Button>
        </div>
      </div>
    </div>
  )
}

