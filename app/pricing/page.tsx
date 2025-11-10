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
import { generatePageMetadata } from "@/lib/seo/config"
import { getSubscriptionStatus } from "@/lib/stripe/actions"
import { getStripeProducts, formatPrice, formatInterval } from "@/lib/stripe/products"

export const metadata: Metadata = generatePageMetadata({
  title: "Pricing - TruckCheck Pro",
  description:
    "Compare TruckCheck Free and Pro plans. Upgrade to Pro for CSV import, PDF export, calculation history, and ad-free experience.",
  path: "/pricing",
})

const features = [
  {
    name: "Base to Destination Distance",
    free: true,
    pro: true,
  },
  {
    name: "Basic Result Display",
    free: true,
    pro: true,
  },
  {
    name: "100km Radius Map Overlay",
    free: false,
    pro: true,
  },
  {
    name: "Multiple Stops",
    free: false,
    pro: true,
  },
  {
    name: "Recent Searches",
    free: false,
    pro: true,
  },
  {
    name: "CSV Batch Import",
    free: false,
    pro: true,
  },
  {
    name: "PDF Export",
    free: false,
    pro: true,
  },
  {
    name: "CSV Export",
    free: false,
    pro: true,
  },
  {
    name: "Calculation History (90 days)",
    free: false,
    pro: true,
  },
  {
    name: "Ad-free Experience",
    free: false,
    pro: true,
  },
]

export default async function PricingPage() {
  // Fetch subscription status and products
  const { isPro, subscriptionEndDate } = await getSubscriptionStatus()
  const stripeProducts = await getStripeProducts()

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
      // Use Stripe's marketing features if available, otherwise fallback to defaults
      features: product.features.length > 0 ? product.features : [
        'Everything in Free',
        '100km Radius Map Overlay',
        'Multiple Stops',
        'Recent Searches',
        'CSV Batch Import',
        'PDF Export',
        'CSV Export',
        'Calculation History (90 days)',
        'Ad-free Experience',
      ],
      isCurrent: isPro,
    }))
  ]

  return (
    <div className="w-full max-w-[100rem] mx-auto px-4 lg:px-8 py-12 sm:py-20">
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
              <Card 
                key={plan.id} 
                className={`relative ${
                  plan.isCurrent ? 'border-primary border-2' : 
                  isRecommended ? 'border-primary border-2' : ''
                }`}
              >
                {(plan.isCurrent || isRecommended) && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <span className="bg-primary text-primary-foreground px-3 py-1 rounded-full text-xs font-semibold">
                      {plan.isCurrent ? 'CURRENT PLAN' : 'RECOMMENDED'}
                    </span>
                  </div>
                )}
                
                <CardHeader>
                  <CardTitle className="text-2xl">{plan.name}</CardTitle>
                  <CardDescription>{plan.description}</CardDescription>
                  <div className="mt-4">
                    <span className="text-4xl font-bold">
                      {formatPrice(price.amount, price.currency)}
                    </span>
                    <span className="text-muted-foreground">
                      /{formatInterval(price.interval, price.intervalCount)}
                    </span>
                  </div>
                </CardHeader>
                
                <CardContent className="space-y-6">
                  <ul className="space-y-3">
                    {plan.features?.map((feature) => (
                      <li key={feature} className="flex items-center gap-3">
                        <Check className="h-5 w-5 text-green-600 dark:text-green-400 shrink-0" />
                        <span className="text-foreground">{feature}</span>
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
            ) : (
              <>
                Need help?{" "}
                <Link href="/account" className="underline hover:text-foreground">
                  View your account
                </Link>
              </>
            )}
          </p>
        </div>
      </div>
    </div>
  )
}

