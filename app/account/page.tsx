import { redirect } from "next/navigation"
import { createClient, getCachedUser } from "@/lib/supabase/server"
import { getSubscriptionStatus, getCalculationHistory } from "@/lib/stripe/actions"
import { getDepot } from "@/lib/depot/actions"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { UpgradeButton } from "@/components/upgrade-button"
import { CustomerPortalButton } from "@/components/customer-portal-button"
import { CalculationHistoryClient } from "@/components/calculation-history-client"
import { DepotSettings } from "@/components/depot-settings"
import { Calendar, CheckCircle, XCircle, AlertCircle } from "lucide-react"
import { Skeleton } from "@/components/ui/skeleton"
import type { Metadata } from "next"
import { generatePageMetadata } from "@/lib/seo/config"

export const metadata: Metadata = generatePageMetadata({
  title: "Account - TruckCheck",
  description: "Manage your TruckCheck account, subscription, and view calculation history.",
  path: "/account",
})

export default async function AccountPage({
  searchParams,
}: {
  searchParams: Promise<{ success?: string; canceled?: string }>
}) {
  // Use cached user to avoid duplicate auth calls
  const user = await getCachedUser()

  if (!user) {
    redirect("/auth/login?redirect=/account")
  }

  const params = await searchParams
  // getSubscriptionStatus already uses cached user, so no duplicate query
  const { status, isPro, subscriptionEndDate } = await getSubscriptionStatus()

  // Fetch user email separately (not cached in subscription status)
  const supabase = await createClient()
  const { data: userData } = await supabase
    .from("users")
    .select("email")
    .eq("id", user.id)
    .single()

  // Fetch calculation history if Pro user
  const historyResult = isPro ? await getCalculationHistory() : { data: [], error: null }
  
  // Fetch depot if Pro user
  const depotResult = isPro ? await getDepot() : { data: null, error: null }

  const getStatusBadge = () => {
    switch (status) {
      case "pro":
        return (
          <Badge className="bg-green-600 dark:bg-green-500">
            <CheckCircle className="h-3 w-3 mr-1" />
            Active
          </Badge>
        )
      case "cancelled":
        return (
          <Badge variant="secondary">
            <XCircle className="h-3 w-3 mr-1" />
            Cancelled
          </Badge>
        )
      case "past_due":
        return (
          <Badge className="bg-amber-600 dark:bg-amber-500">
            <AlertCircle className="h-3 w-3 mr-1" />
            Past Due
          </Badge>
        )
      default:
        return (
          <Badge variant="outline">
            Free
          </Badge>
        )
    }
  }

  return (
    <div className="w-full max-w-[100rem] mx-auto px-4 lg:px-8 py-12 sm:py-20">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Success/Cancel Messages */}
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

        {/* Account Header */}
        <div>
          <h1 className="text-3xl sm:text-4xl font-bold tracking-tight mb-2">
            Account
          </h1>
          <p className="text-muted-foreground">
            Manage your subscription and view your calculation history
          </p>
        </div>

        {/* Subscription Status */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Subscription</CardTitle>
                <CardDescription>
                  {userData?.email || user.email}
                </CardDescription>
              </div>
              {getStatusBadge()}
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Current Plan</span>
                <span className="text-sm">
                  {isPro ? "Pro - $18/month AUD" : "Free"}
                </span>
              </div>
              {isPro && subscriptionEndDate && (
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    Renews on
                  </span>
                  <span className="text-sm">
                    {new Date(subscriptionEndDate).toLocaleDateString("en-AU", {
                      day: "numeric",
                      month: "long",
                      year: "numeric",
                    })}
                  </span>
                </div>
              )}
            </div>

            <div className="pt-4 border-t border-border/50">
              {isPro ? (
                <CustomerPortalButton />
              ) : (
                <UpgradeButton className="w-full sm:w-auto" />
              )}
            </div>
          </CardContent>
        </Card>

        {/* Depot Settings - Only for Pro */}
        {isPro && (
          <DepotSettings initialDepot={depotResult.data} />
        )}

        {/* Calculation History - Only for Pro */}
        {isPro && (
          <CalculationHistoryClient initialHistory={historyResult.data} />
        )}
      </div>
    </div>
  )
}

