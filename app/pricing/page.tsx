import { Suspense } from "react"
import type { Metadata } from "next"
import { PricingAutoCheckout } from "@/components/pricing-auto-checkout"
import { PricingContent } from "@/components/pricing/pricing-content"
import { PricingCta } from "@/components/pricing/pricing-cta"
import { PricingContentSkeleton } from "@/components/pricing/pricing-skeletons"
import { generatePageMetadata } from "@/lib/seo/config"
import { getSubscriptionStatus } from "@/lib/stripe/actions"

export const metadata: Metadata = generatePageMetadata({
  title: "Pricing - TruckCheck Pro",
  description:
    "Compare TruckCheck Free and Pro plans. Upgrade to Pro for CSV import, PDF export, calculation history, and ad-free experience.",
  path: "/pricing",
})

export default async function PricingPage() {
  // Check authentication for PricingAutoCheckout (doesn't block page render)
  const { userId } = await getSubscriptionStatus()
  const isAuthenticated = userId !== null

  return (
    <>
      <PricingAutoCheckout isAuthenticated={isAuthenticated} />
      <div className="w-full max-w-7xl mx-auto px-4 lg:px-8 py-12 sm:py-20 pb-24 sm:pb-24">
        <div className="max-w-4xl mx-auto space-y-12">
          {/* Dynamic Content - Shows skeleton while loading */}
          <Suspense fallback={<PricingContentSkeleton />}>
            <PricingContent />
          </Suspense>
        </div>
      </div>
      {/* Sticky CTA - Dynamic, shows skeleton while loading */}
      <Suspense fallback={null}>
        <PricingCta />
      </Suspense>
    </>
  )
}

