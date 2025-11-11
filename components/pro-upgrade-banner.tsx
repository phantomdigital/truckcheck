"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Sparkles, Check } from "lucide-react"
import Link from "next/link"

interface ProUpgradeBannerProps {
  variant?: "compact" | "detailed"
  className?: string
}

export function ProUpgradeBanner({ variant = "detailed", className = "" }: ProUpgradeBannerProps) {
  if (variant === "compact") {
    return (
      <Card className={`border-2 border-primary/20 bg-gradient-to-br from-primary/5 to-primary/10 ${className}`}>
        <CardContent className="pt-6">
          <div className="flex items-start gap-4">
            <div className="rounded-full bg-primary/10 p-3">
              <Sparkles className="h-6 w-6 text-primary" />
            </div>
            <div className="flex-1 space-y-3">
              <div>
                <h3 className="font-semibold text-lg">Upgrade to Pro</h3>
                <p className="text-sm text-muted-foreground mt-1">
                  Unlock powerful features to streamline your compliance workflow
                </p>
              </div>
              <Button asChild className="w-full !rounded-md" size="lg" variant="cta">
                <Link href="/pricing" className="flex items-center">
                  <Sparkles className="mr-2 h-4 w-4" />
                  View Features
                </Link>
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className={`border-2 border-primary/20 bg-gradient-to-br from-primary/5 to-primary/10 ${className}`}>
      <CardHeader>
        <div className="flex items-center gap-2">
          <Badge variant="default" className="gap-1">
            <Sparkles className="h-3 w-3" />
            Pro
          </Badge>
          <CardTitle>Upgrade to Pro</CardTitle>
        </div>
        <CardDescription>
          Save time and stay organized with powerful Pro features
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <ul className="space-y-3">
          <li className="flex items-center gap-3">
            <Check className="h-5 w-5 text-green-600 dark:text-green-400 shrink-0" />
            <span className="text-sm">100km Radius Map Overlay</span>
          </li>
          <li className="flex items-center gap-3">
            <Check className="h-5 w-5 text-green-600 dark:text-green-400 shrink-0" />
            <span className="text-sm">Multiple Stops</span>
          </li>
          <li className="flex items-center gap-3">
            <Check className="h-5 w-5 text-green-600 dark:text-green-400 shrink-0" />
            <span className="text-sm">Recent Searches</span>
          </li>
          <li className="flex items-center gap-3">
            <Check className="h-5 w-5 text-green-600 dark:text-green-400 shrink-0" />
            <span className="text-sm">CSV Batch Import</span>
          </li>
          <li className="flex items-center gap-3">
            <Check className="h-5 w-5 text-green-600 dark:text-green-400 shrink-0" />
            <span className="text-sm">PDF Export</span>
          </li>
          <li className="flex items-center gap-3">
            <Check className="h-5 w-5 text-green-600 dark:text-green-400 shrink-0" />
            <span className="text-sm">CSV Export</span>
          </li>
          <li className="flex items-center gap-3">
            <Check className="h-5 w-5 text-green-600 dark:text-green-400 shrink-0" />
            <span className="text-sm">Calculation History (90 days)</span>
          </li>
          <li className="flex items-center gap-3">
            <Check className="h-5 w-5 text-green-600 dark:text-green-400 shrink-0" />
            <span className="text-sm">Ad-free Experience</span>
          </li>
        </ul>

        <div className="pt-2 space-y-2">
          <Button asChild className="w-full !rounded-md" size="lg" variant="cta">
            <Link href="/pricing" className="flex items-center justify-center">
              <Sparkles className="mr-2 h-4 w-4" />
              View Pricing
            </Link>
          </Button>
          <p className="text-xs text-center text-muted-foreground">
            From $15 AUD/month • Cancel anytime
          </p>
        </div>
      </CardContent>
    </Card>
  )
}

