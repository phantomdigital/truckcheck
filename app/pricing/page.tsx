import type { Metadata } from "next"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Check, X, Crown, CreditCard } from "lucide-react"
import Link from "next/link"
import { UpgradeButton } from "@/components/upgrade-button"
import { CustomerPortalButton } from "@/components/customer-portal-button"
import { PricingStickyCta } from "@/components/pricing-sticky-cta"
import { PricingAutoCheckout } from "@/components/pricing-auto-checkout"
import { generatePageMetadata } from "@/lib/seo/config"
import { getSubscriptionStatus } from "@/lib/stripe/actions"
import { getStripeProducts, formatPrice, formatInterval } from "@/lib/stripe/products"
import { PRO_FEATURE_LABELS } from "@/lib/stripe/features"

export const metadata: Metadata = generatePageMetadata({
  title: "Pricing - TruckCheck Pro",
  description:
    "Compare TruckCheck Free and Pro plans. Upgrade to Pro for CSV import, PDF export, calculation history, and ad-free experience.",
  path: "/pricing",
})


export default async function PricingPage() {
  // Fetch subscription status and products
  // getSubscriptionStatus() already performs supabase.auth.getUser() check
  const { isPro, userId } = await getSubscriptionStatus()
  const stripeProducts = await getStripeProducts()

  // Get price ID for sticky CTA
  const proPriceId = stripeProducts[0]?.prices[0]?.id
  
  // Check if user is authenticated (userId is null if not authenticated)
  // This is derived from the auth check in getSubscriptionStatus()
  const isAuthenticated = userId !== null

  // Add a "Free" plan to the products
  const allPlans = [
    {
      id: 'free',
      name: 'Free',
      description: 'Perfect for occasional use',
      prices: [{ id: 'free', amount: 0, currency: 'aud', interval: 'month', intervalCount: 1, type: 'recurring' as const }],
      features: [
        'Base to Destination Distance',
        'Basic Result Display',
      ],
      isCurrent: !isPro,
    },
    ...stripeProducts.map(product => ({
      ...product,
      // Use Stripe's marketing features if available, otherwise fallback to shared config
      features: product.features.length > 0 ? product.features : PRO_FEATURE_LABELS,
      isCurrent: isPro,
    }))
  ]

  return (
    <>
      <PricingAutoCheckout isAuthenticated={isAuthenticated} />
      <div className="w-full max-w-7xl mx-auto px-4 lg:px-8 py-12 sm:py-20 pb-24 sm:pb-24">
      <div className="max-w-4xl mx-auto space-y-12">
        {/* Header */}
        <div className="text-center space-y-4">
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight">
            {isPro ? 'Your Plan & Features' : 'Choose Your Plan'}
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            {isPro 
              ? 'Review your Pro features and manage your subscription below.'
              : 'Start free, upgrade when you need more. All plans include unlimited distance calculations.'}
          </p>
        </div>

        {/* Pricing Cards */}
        <div className={`grid gap-6 ${
          allPlans.length === 1 ? 'max-w-md mx-auto' :
          allPlans.length === 2 ? 'md:grid-cols-2 max-w-4xl mx-auto' :
          allPlans.length === 3 ? 'md:grid-cols-2 lg:grid-cols-3 max-w-6xl mx-auto' :
          'md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4'
        }`}>
          {allPlans.map((plan, index) => {
            const price = plan.prices[0]
            const isRecommended = plan.id !== 'free' && !isPro
            
            return (
              <div key={plan.id} className="relative pt-4">
                {/* Badges - positioned relative to wrapper */}
                {isRecommended && (
                  <div className="absolute top-0 left-1/2 -translate-x-1/2 z-10">
                    <span className="bg-linear-to-br from-blue-600 via-blue-600 to-blue-700 dark:from-blue-500 dark:via-blue-500 dark:to-blue-600 text-white px-4 py-1.5 rounded-full text-xs font-bold shadow-lg shadow-blue-600/30 dark:shadow-blue-500/25">
                      RECOMMENDED
                    </span>
                  </div>
                )}
                {plan.isCurrent && plan.id === 'free' && (
                  <div className="absolute top-0 left-1/2 -translate-x-1/2 z-10">
                    <span className="bg-muted text-muted-foreground px-3 py-1 rounded-full text-xs font-medium border border-border">
                      Current Plan
                    </span>
                  </div>
                )}
                {plan.isCurrent && plan.id !== 'free' && (
                  <div className="absolute top-0 left-1/2 -translate-x-1/2 z-10">
                    <span className="bg-primary text-primary-foreground px-3 py-1 rounded-full text-xs font-semibold">
                      CURRENT PLAN
                    </span>
                  </div>
                )}
                
                <Card 
                  className={`relative overflow-hidden ${
                    plan.id === 'free' 
                      ? 'border-border/50 bg-muted/30 opacity-90' 
                      : isRecommended 
                        ? 'border-blue-600 dark:border-blue-500 border-2' 
                        : plan.isCurrent 
                          ? 'border-primary border-2' 
                          : ''
                  }`}
                >
                  {isRecommended && (
                    <div className="absolute inset-0 pointer-events-none z-0">
                      <div 
                        className="absolute inset-0 bg-linear-to-r from-transparent via-blue-500/5 to-transparent"
                        style={{
                          backgroundSize: '200% 100%',
                          animation: 'shimmer 9s ease-in-out infinite'
                        }} 
                      />
                  </div>
                )}
                
                <CardHeader>
                  <CardTitle className={
                    plan.id === 'free' 
                      ? 'text-xl text-muted-foreground' 
                      : isRecommended
                        ? 'text-2xl gradient-text'
                        : 'text-2xl'
                  }>
                    {plan.name}
                  </CardTitle>
                  <CardDescription className={plan.id === 'free' ? 'text-muted-foreground/80' : ''}>
                    {plan.description}
                  </CardDescription>
                  <div className="mt-4">
                    <span className={
                      plan.id === 'free' 
                        ? 'text-3xl font-semibold text-muted-foreground' 
                        : isRecommended
                          ? 'text-4xl font-bold gradient-text'
                          : 'text-4xl font-bold'
                    }>
                      {formatPrice(price.amount, price.currency)}
                    </span>
                    <span className={plan.id === 'free' ? 'text-muted-foreground/70' : 'text-muted-foreground'}>
                      /{formatInterval(price.interval, price.intervalCount)}
                    </span>
                  </div>
                </CardHeader>
                
                <CardContent className="space-y-6">
                  <ul className={`${
                    plan.id === 'free' 
                      ? 'space-y-2.5' 
                      : 'space-y-3'
                  }`}>
                    {plan.features?.map((feature) => (
                      <li key={feature} className="flex items-start gap-3">
                        <Check className={`shrink-0 mt-0.5 ${
                          plan.id === 'free' 
                            ? 'h-4 w-4 text-muted-foreground/60' 
                            : isRecommended
                              ? 'h-5 w-5 text-green-600 dark:text-green-400'
                              : 'h-4 w-4 text-green-600 dark:text-green-400'
                        }`} />
                        <span className={`leading-relaxed ${
                          plan.id === 'free' 
                            ? 'text-sm text-muted-foreground' 
                            : isRecommended
                              ? 'text-base text-foreground'
                              : 'text-sm text-foreground'
                        }`}>
                          {feature}
                        </span>
                      </li>
                    ))}
                  </ul>
                  
                  {plan.id === 'free' ? (
                    !isPro && (
                      <Button variant="outline" className="w-full" disabled>
                        Current Plan
                      </Button>
                    )
                  ) : plan.isCurrent ? (
                    <div className="space-y-2">
                      <Button variant="outline" className="w-full inline-flex items-center justify-center" disabled>
                        <Crown className="mr-2 h-4 w-4" />
                        Current Plan
                      </Button>
                      <CustomerPortalButton className="w-full inline-flex items-center justify-center" variant="secondary">
                        <>
                          <CreditCard className="mr-2 h-4 w-4" />
                          Manage Subscription
                        </>
                      </CustomerPortalButton>
                    </div>
                  ) : (
                    <UpgradeButton 
                      className="w-full" 
                      priceId={price.id}
                    />
                  )}
                </CardContent>
              </Card>
              </div>
            )
          })}
        </div>

        {/* FAQ or Additional Info */}
        <div className="text-center space-y-2 text-sm text-muted-foreground">
          <p>
            All plans include unlimited distance calculations. {isPro ? 'Need to make changes?' : 'Cancel anytime.'}
          </p>
          <p>
            {isPro ? (
              <>
                Manage your subscription or{" "}
                <Link href="/account" className="underline hover:text-foreground">
                  view your account
                </Link>
              </>
            ) : isAuthenticated ? (
              <>
                Need help?{" "}
                <Link href="/account" className="underline hover:text-foreground">
                  View your account
                </Link>
              </>
            ) : (
              <>
                Need help?{" "}
                <Link href="/contact" className="underline hover:text-foreground">
                  Contact us
                </Link>
              </>
            )}
          </p>
        </div>
      </div>
    </div>
      <PricingStickyCta isPro={isPro} priceId={proPriceId} />
    </>
  )
}

