import { stripe } from "./config"
import Stripe from "stripe"

export interface StripeProduct {
  id: string
  name: string
  description: string | null
  features: string[]
  prices: StripePrice[]
}

export interface StripePrice {
  id: string
  amount: number
  currency: string
  interval: string | null
  intervalCount: number
  type: 'recurring' | 'one_time'
}

/**
 * Fetch all active products and their prices from Stripe
 */
export async function getStripeProducts(): Promise<StripeProduct[]> {
  try {
    // Fetch all active products
    const products = await stripe.products.list({
      active: true,
      expand: ['data.default_price'],
    })

    // Fetch all active prices
    const prices = await stripe.prices.list({
      active: true,
    })

    // Group prices by product
    const pricesByProduct = prices.data.reduce((acc, price) => {
      const productId = price.product as string
      if (!acc[productId]) {
        acc[productId] = []
      }
      
      acc[productId].push({
        id: price.id,
        amount: price.unit_amount || 0,
        currency: price.currency,
        interval: price.recurring?.interval || null,
        intervalCount: price.recurring?.interval_count || 1,
        type: price.type === 'recurring' ? 'recurring' : 'one_time',
      })
      
      return acc
    }, {} as Record<string, StripePrice[]>)

    // Combine products with their prices and features
    const stripeProducts: StripeProduct[] = products.data.map(product => ({
      id: product.id,
      name: product.name,
      description: product.description,
      features: product.marketing_features?.map(feature => feature.name).filter((name): name is string => name !== null && name !== undefined) || [],
      prices: pricesByProduct[product.id] || [],
    }))

    // Sort by price (lowest first)
    return stripeProducts.sort((a, b) => {
      const aPrice = a.prices[0]?.amount || 0
      const bPrice = b.prices[0]?.amount || 0
      return aPrice - bPrice
    })

  } catch (error) {
    console.error('Error fetching Stripe products:', error)
    return []
  }
}

/**
 * Get a specific price by ID
 */
export async function getStripePrice(priceId: string): Promise<Stripe.Price | null> {
  try {
    return await stripe.prices.retrieve(priceId)
  } catch (error) {
    console.error('Error fetching Stripe price:', error)
    return null
  }
}

/**
 * Format price for display
 */
export function formatPrice(amount: number, currency: string): string {
  return new Intl.NumberFormat('en-AU', {
    style: 'currency',
    currency: currency.toUpperCase(),
  }).format(amount / 100)
}

/**
 * Format billing interval
 */
export function formatInterval(interval: string | null, intervalCount: number = 1): string {
  if (!interval) return 'one-time'
  
  const intervalText = intervalCount === 1 ? interval : `${intervalCount} ${interval}s`
  return `per ${intervalText}`
}
