import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { UpgradeButton } from "@/components/upgrade-button"
import { CustomerPortalButton } from "@/components/customer-portal-button"
import { Calendar, CheckCircle, XCircle, AlertCircle } from "lucide-react"
import { getCachedUser } from "@/lib/supabase/server"
import { getSubscriptionStatus } from "@/lib/stripe/actions"
import { createClient } from "@/lib/supabase/server"

function getStatusBadge(status: string) {
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

export async function SubscriptionCard() {
  // Use cached user to avoid duplicate auth calls
  const user = await getCachedUser()
  
  if (!user) {
    return null
  }

  // getSubscriptionStatus already uses cached user, so no duplicate query
  const { status, isPro, subscriptionEndDate } = await getSubscriptionStatus()

  // Fetch user email separately (not cached in subscription status)
  const supabase = await createClient()
  const { data: userData } = await supabase
    .from("users")
    .select("email")
    .eq("id", user.id)
    .single()

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Subscription</CardTitle>
            <CardDescription>
              {userData?.email || user.email}
            </CardDescription>
          </div>
          {getStatusBadge(status)}
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
  )
}

