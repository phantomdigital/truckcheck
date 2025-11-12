import { getSubscriptionStatus } from "@/lib/stripe/actions"
import { getStripeProducts } from "@/lib/stripe/products"
import { PricingStickyCta } from "@/components/pricing-sticky-cta"

export async function PricingCta() {
  const { isPro } = await getSubscriptionStatus()
  const stripeProducts = await getStripeProducts()
  const proPriceId = stripeProducts[0]?.prices[0]?.id

  return <PricingStickyCta isPro={isPro} priceId={proPriceId} />
}

