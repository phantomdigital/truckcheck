"use client"

import { useEffect } from "react"
import { usePathname } from "next/navigation"

/**
 * Ezoic Ad Management Utilities
 * 
 * Functions to manage Ezoic ads dynamically according to Ezoic's documentation
 */

/**
 * Check if ezstandalone is available
 */
function isEzoicAvailable(): boolean {
  return typeof window !== "undefined" && !!(window as any).ezstandalone
}

/**
 * Show ads for specific placement IDs
 * @param placementIds - Array of placement IDs to show
 */
export function showEzoicAds(...placementIds: number[]): void {
  if (!isEzoicAvailable()) return

  try {
    const ezstandalone = (window as any).ezstandalone
    ezstandalone.cmd = ezstandalone.cmd || []
    ezstandalone.cmd.push(function () {
      if (placementIds.length > 0) {
        ezstandalone.showAds(...placementIds)
      } else {
        // Show all placeholders on the page
        ezstandalone.showAds()
      }
    })
  } catch (error) {
    if (process.env.NODE_ENV !== "production") {
      console.error("Ezoic showAds error:", error)
    }
  }
}

/**
 * Destroy specific placeholders
 * @param placementIds - Array of placement IDs to destroy
 */
export function destroyEzoicPlaceholders(...placementIds: number[]): void {
  if (!isEzoicAvailable()) return

  try {
    const ezstandalone = (window as any).ezstandalone
    ezstandalone.cmd = ezstandalone.cmd || []
    ezstandalone.cmd.push(function () {
      if (placementIds.length > 0) {
        ezstandalone.destroyPlaceholders(...placementIds)
      } else {
        // Destroy all placeholders
        ezstandalone.destroyAll()
      }
    })
  } catch (error) {
    if (process.env.NODE_ENV !== "production") {
      console.error("Ezoic destroyPlaceholders error:", error)
    }
  }
}

/**
 * Destroy all placeholders on the page
 */
export function destroyAllEzoicPlaceholders(): void {
  if (!isEzoicAvailable()) return

  try {
    const ezstandalone = (window as any).ezstandalone
    ezstandalone.cmd = ezstandalone.cmd || []
    ezstandalone.cmd.push(function () {
      ezstandalone.destroyAll()
    })
  } catch (error) {
    if (process.env.NODE_ENV !== "production") {
      console.error("Ezoic destroyAll error:", error)
    }
  }
}

/**
 * Hook to refresh ads when route changes in Next.js
 * This handles dynamic page navigation
 */
export function useEzoicRouteRefresh() {
  const pathname = usePathname()

  useEffect(() => {
    // Don't run in development
    if (process.env.NODE_ENV !== "production") return

    // Wait a bit for the page to render, then refresh ads
    const timer = setTimeout(() => {
      showEzoicAds() // Show all placeholders on the new page
    }, 100)

    return () => clearTimeout(timer)
  }, [pathname])
}

