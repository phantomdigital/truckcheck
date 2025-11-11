"use client"

import { AdUnit } from "./ad-unit"

interface ResponsiveAdProps {
  /**
   * Ezoic ad placement ID (numeric)
   * This is the numeric ID from your Ezoic dashboard (e.g., 101)
   */
  placementId: number
  className?: string
}

/**
 * Responsive ad that adjusts to container width
 * Good for sidebar or below content
 * Ezoic will automatically optimize ad sizes
 */
export function ResponsiveAd({ placementId, className }: ResponsiveAdProps) {
  return (
    <div className={`w-full ${className}`}>
      <AdUnit placementId={placementId} />
    </div>
  )
}

