import { Suspense } from "react"
import { redirect } from "next/navigation"
import { Card, CardContent } from "@/components/ui/card"
import { SubscriptionCard } from "@/components/account/subscription-card"
import { ProContent } from "@/components/account/pro-content"
import { getCachedUser } from "@/lib/supabase/server"
import { 
  SubscriptionCardSkeleton, 
  DepotSettingsSkeleton, 
  CalculationHistorySkeleton 
} from "@/components/account/account-skeletons"
import type { Metadata } from "next"
import { generatePageMetadata } from "@/lib/seo/config"

export const metadata: Metadata = generatePageMetadata({
  title: "Account - TruckCheck",
  description: "Manage your TruckCheck account, subscription, and view calculation history.",
  path: "/account",
})

async function AccountMessages({
  searchParams,
}: {
  searchParams: Promise<{ success?: string; canceled?: string }>
}) {
  const params = await searchParams

  return (
    <>
      {params.success === "true" && (
        <Card className="border-green-500/50 bg-green-50/50 dark:bg-green-950/10">
          <CardContent className="pt-6">
            <p className="text-green-700 dark:text-green-400 font-medium">
              ✓ Subscription activated successfully!
            </p>
          </CardContent>
        </Card>
      )}

      {params.canceled === "true" && (
        <Card className="border-amber-500/50 bg-amber-50/50 dark:bg-amber-950/10">
          <CardContent className="pt-6">
            <p className="text-amber-700 dark:text-amber-400 font-medium">
              Checkout was cancelled. You can try again anytime.
            </p>
          </CardContent>
        </Card>
      )}
    </>
  )
}

async function AccountPageContent({
  searchParams,
}: {
  searchParams: Promise<{ success?: string; canceled?: string }>
}) {
  return (
    <div className="w-full max-w-[100rem] mx-auto px-4 lg:px-8 py-12 sm:py-20">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Success/Cancel Messages - Loads in parallel */}
        <Suspense fallback={null}>
          <AccountMessages searchParams={searchParams} />
        </Suspense>

        {/* Account Header - Static, loads immediately */}
        <div>
          <h1 className="text-3xl sm:text-4xl font-bold tracking-tight mb-2">
            Account
          </h1>
          <p className="text-muted-foreground">
            Manage your subscription and view your calculation history
          </p>
        </div>

        {/* Subscription Status - Dynamic, shows skeleton while loading */}
        <Suspense fallback={<SubscriptionCardSkeleton />}>
          <SubscriptionCard />
        </Suspense>

        {/* Pro Content - Dynamic, shows skeleton while loading */}
        <Suspense 
          fallback={
            <>
              <DepotSettingsSkeleton />
              <CalculationHistorySkeleton />
            </>
          }
        >
          <ProContent />
        </Suspense>
      </div>
    </div>
  )
}

export default async function AccountPage({
  searchParams,
}: {
  searchParams: Promise<{ success?: string; canceled?: string }>
}) {
  // Server-side auth check - follows Supabase/Next.js best practices
  // Uses getCachedUser() which is cached via React cache() to avoid duplicate calls
  // This check happens before rendering, ensuring security
  const user = await getCachedUser()
  
  if (!user) {
    redirect("/auth/login?redirect=/account")
  }

  // Render page content - user is authenticated
  return <AccountPageContent searchParams={searchParams} />
}

