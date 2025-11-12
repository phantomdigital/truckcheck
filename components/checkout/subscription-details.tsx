import { redirect } from "next/navigation"
import { getCachedUser } from "@/lib/supabase/server"
import { getSubscriptionStatus } from "@/lib/stripe/actions"
import { createClient } from "@/lib/supabase/server"
import { Card, CardContent } from "@/components/ui/card"
import { Mail, Check } from "lucide-react"
import { stripe } from "@/lib/stripe/config"
import { formatPrice } from "@/lib/stripe/products"
import type Stripe from "stripe"

export async function SubscriptionDetails() {
  // Use cached user to avoid duplicate auth calls
  const user = await getCachedUser()

  if (!user) {
    redirect("/auth/login")
  }

  // Use cached subscription status
  const { isPro } = await getSubscriptionStatus()

  // If not Pro, something went wrong - redirect to pricing
  if (!isPro) {
    redirect("/pricing?error=subscription_not_active")
  }

  // Fetch user's subscription and product details from Stripe
  const supabase = await createClient()
  const { data: userData } = await supabase
    .from("users")
    .select("stripe_subscription_id")
    .eq("id", user.id)
    .single()

  let productName = "TruckCheck Pro"
  let productFeatures: string[] = []
  let subscriptionAmount = "$"

  if (userData?.stripe_subscription_id) {
    try {
      const subscription = await stripe.subscriptions.retrieve(userData.stripe_subscription_id, {
        expand: ['items.data.price.product']
      })
      
      const subscriptionItem = subscription.items.data[0]
      const price = subscriptionItem.price
      
      // Check if product is expanded (not just an ID string)
      if (price.product && typeof price.product !== 'string') {
        const product = price.product as Stripe.Product
        
        // Get product name and features
        productName = product.name || productName
        
        // Extract marketing features if available
        if (product.marketing_features && Array.isArray(product.marketing_features)) {
          productFeatures = product.marketing_features
            .map(feature => feature.name)
            .filter((name): name is string => Boolean(name))
        }
      }

      // Format price
      if (price.unit_amount !== null && price.unit_amount !== undefined) {
        const formattedAmount = formatPrice(price.unit_amount, price.currency)
        const interval = price.recurring?.interval || 'month'
        const intervalCount = price.recurring?.interval_count || 1
        subscriptionAmount = `${formattedAmount} / ${intervalCount > 1 ? intervalCount + ' ' : ''}${interval}${intervalCount > 1 ? 's' : ''}`
      }
    } catch (error) {
      console.error("Error fetching subscription details:", error)
      // Fall back to defaults if error
    }
  }

  return (
    <>
      {/* Subscription Details */}
      <Card className="mb-8">
        <CardContent className="pt-6">
          <div className="space-y-4">
            <div className="flex items-center justify-between pb-4 border-b border-border/50">
              <span className="text-sm text-muted-foreground">Subscription</span>
              <span className="font-semibold">{productName}</span>
            </div>
            <div className="flex items-center justify-between pb-4 border-b border-border/50">
              <span className="text-sm text-muted-foreground">Amount</span>
              <span className="font-semibold">{subscriptionAmount}</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Mail className="h-4 w-4" />
              <span>A receipt has been sent to {user.email}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Pro Features Unlocked */}
      {productFeatures.length > 0 && (
        <Card className="mb-8">
          <CardContent className="pt-6">
            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
              Features Included:
            </h2>
            <ul className="space-y-2">
              {productFeatures.map((feature) => (
                <li key={feature} className="flex items-start gap-3">
                  <Check className="h-5 w-5 text-green-600 dark:text-green-400 shrink-0 mt-0.5" />
                  <span className="text-sm">{feature}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}
    </>
  )
}

