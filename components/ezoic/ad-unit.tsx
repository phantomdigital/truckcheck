"use client"

import { useEffect, useRef } from "react"
import { showEzoicAds, destroyEzoicPlaceholders } from "@/lib/ezoic/hooks"

interface AdUnitProps {
  /**
   * Ezoic ad placement ID (numeric)
   * This is the numeric ID from your Ezoic dashboard (e.g., 101, 102, 103)
   * The component will automatically format it as ezoic-pub-ad-placeholder-XXX
   */
  placementId: number
  /**
   * Optional wrapper className for styling the container
   * Note: The placeholder div itself should not have styling per Ezoic guidelines
   */
  className?: string
}

/**
 * Ezoic Ad Unit Component
 * 
 * Displays an Ezoic ad placement according to Ezoic's official integration guide.
 * Handles cleanup on unmount for dynamic content scenarios.
 * 
 * Usage:
 * <AdUnit placementId={101} />
 * 
 * The placementId should match the ID from your Ezoic dashboard.
 */
export function AdUnit({
  placementId,
  className = "",
}: AdUnitProps) {
  const hasShownAd = useRef(false)
  const placeholderId = `ezoic-pub-ad-placeholder-${placementId}`

  useEffect(() => {
    // Don't load ads in development
    if (process.env.NODE_ENV !== "production") return

    // Only call showAds once per component instance
    if (hasShownAd.current) return

    // Show the ad
    showEzoicAds(placementId)
    hasShownAd.current = true

    // Cleanup function: destroy placeholder when component unmounts
    // This is important for dynamic content scenarios
    return () => {
      if (hasShownAd.current) {
        destroyEzoicPlaceholders(placementId)
        hasShownAd.current = false
      }
    }
  }, [placementId])

  // Don't show ads in development - show placeholder instead
  if (process.env.NODE_ENV !== "production") {
    return (
      <div className={`border-2 border-dashed border-muted-foreground/20 rounded-lg p-4 ${className}`}>
        <p className="text-center text-xs text-muted-foreground">
          Ezoic Ad Unit
          <br />
          <code className="text-xs">Placement ID: {placementId}</code>
          <br />
          <code className="text-xs">Placeholder: {placeholderId}</code>
        </p>
      </div>
    )
  }

  // Ezoic ad placement format per official documentation
  // DO NOT add styling to the placeholder div per Ezoic guidelines
  return (
    <div className={className}>
      <div id={placeholderId}></div>
    </div>
  )
}

