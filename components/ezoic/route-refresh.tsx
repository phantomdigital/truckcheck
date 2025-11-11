"use client"

import { useEzoicRouteRefresh } from "@/lib/ezoic/hooks"

/**
 * Ezoic Route Refresh Component
 * 
 * This component should be included in your root layout to automatically
 * refresh Ezoic ads when navigating between pages in Next.js.
 * 
 * Usage: Add <EzoicRouteRefresh /> to your root layout
 */
export function EzoicRouteRefresh() {
  useEzoicRouteRefresh()
  return null // This component doesn't render anything
}

