"use client"

import { AdUnit } from "./ad-unit"

interface InlineAdProps {
  /**
   * Ezoic ad placement ID (numeric)
   * This is the numeric ID from your Ezoic dashboard (e.g., 101)
   */
  placementId: number
  className?: string
}

/**
 * Inline rectangular ad
 * Good for between content sections
 */
export function InlineAd({ placementId, className }: InlineAdProps) {
  return (
    <div className={`flex items-center justify-center w-full my-6 ${className}`}>
      <AdUnit placementId={placementId} />
    </div>
  )
}

