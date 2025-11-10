"use client"

import { AdUnit } from "./ad-unit"

interface ResponsiveAdProps {
  adSlot: string
  className?: string
}

/**
 * Responsive ad that adjusts to container width
 * Good for sidebar or below content
 */
export function ResponsiveAd({ adSlot, className }: ResponsiveAdProps) {
  return (
    <div className={`w-full ${className}`}>
      <AdUnit
        adSlot={adSlot}
        adFormat="auto"
        fullWidthResponsive={true}
      />
    </div>
  )
}

