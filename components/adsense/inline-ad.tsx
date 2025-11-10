"use client"

import { AdUnit } from "./ad-unit"

interface InlineAdProps {
  adSlot: string
  className?: string
}

/**
 * Inline rectangular ad
 * Good for between content sections
 */
export function InlineAd({ adSlot, className }: InlineAdProps) {
  return (
    <div className={`flex items-center justify-center w-full my-6 ${className}`}>
      <AdUnit
        adSlot={adSlot}
        adFormat="rectangle"
        fullWidthResponsive={false}
        style={{ width: "336px", height: "280px" }}
      />
    </div>
  )
}

