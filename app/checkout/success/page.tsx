import { Suspense } from "react"
import { Button } from "@/components/ui/button"
import { Check, Sparkles, History, Archive } from "lucide-react"
import Link from "next/link"
import type { Metadata } from "next"
import { generatePageMetadata } from "@/lib/seo/config"
import { SubscriptionDetails } from "@/components/checkout/subscription-details"
import { SubscriptionDetailsSkeleton, FeaturesListSkeleton } from "@/components/checkout/success-skeletons"
import { CheckoutSuccessTracker } from "@/components/checkout-success-tracker"

export const metadata: Metadata = generatePageMetadata({
  title: "Welcome to Pro - TruckCheck",
  description: "Your TruckCheck Pro subscription is now active.",
  path: "/checkout/success",
})

export default function CheckoutSuccessPage() {
  return (
    <>
      <CheckoutSuccessTracker />
      <div className="w-full max-w-7xl mx-auto px-4 lg:px-8 py-12 sm:py-20">
      <div className="max-w-2xl mx-auto">
        {/* Success Header - Static, loads immediately */}
        <div className="text-center space-y-4 mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-green-100 dark:bg-green-900/20 mb-4">
            <Check className="h-8 w-8 text-green-600 dark:text-green-500" />
          </div>
          <h1 className="text-4xl sm:text-5xl font-bold tracking-tight gradient-text">
            Welcome to Pro!
          </h1>
          <p className="text-lg text-muted-foreground">
            Your TruckCheck Pro subscription is now active.
          </p>
        </div>

        {/* Subscription Details - Dynamic, shows skeleton while loading */}
        <Suspense 
          fallback={
            <>
              <SubscriptionDetailsSkeleton />
              <FeaturesListSkeleton />
            </>
          }
        >
          <SubscriptionDetails />
        </Suspense>

        {/* CTAs - Static */}
        <div className="space-y-4">
          <Link href="/" className="block">
            <Button variant="cta" size="lg" className="w-full rounded-md!">
              <Sparkles className="h-5 w-5 mr-2" />
              Start Using Pro Features
            </Button>
          </Link>
          <div className="flex items-center justify-center gap-6 text-sm">
            <Link 
              href="/account" 
              className="text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1"
            >
              <History className="h-4 w-4" />
              View Account
            </Link>
            <Link 
              href="/pricing" 
              className="text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1"
            >
              <Archive className="h-4 w-4" />
              Manage Subscription
            </Link>
          </div>
        </div>

        {/* Help Text - Static */}
        <div className="mt-8 p-4 rounded-lg bg-muted/50 text-center">
          <p className="text-sm text-muted-foreground">
            Need help?{" "}
            <Link href="/contact" className="text-foreground hover:underline font-medium">
              Contact support
            </Link>
          </p>
        </div>
      </div>
    </div>
    </>
  )
}

