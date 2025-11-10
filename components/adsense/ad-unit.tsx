"use client"

import { useEffect, useRef } from "react"

interface AdUnitProps {
  adSlot: string
  adFormat?: "auto" | "fluid" | "rectangle" | "vertical" | "horizontal"
  fullWidthResponsive?: boolean
  style?: React.CSSProperties
  className?: string
}

export function AdUnit({
  adSlot,
  adFormat = "auto",
  fullWidthResponsive = true,
  style,
  className = "",
}: AdUnitProps) {
  const adRef = useRef<HTMLModElement>(null)
  const isAdLoaded = useRef(false)

  useEffect(() => {
    // Only load ad once
    if (isAdLoaded.current) return
    
    try {
      // Check if adsbygoogle is available
      if (typeof window !== "undefined" && (window as any).adsbygoogle) {
        ;((window as any).adsbygoogle = (window as any).adsbygoogle || []).push({})
        isAdLoaded.current = true
      }
    } catch (error) {
      if (process.env.NODE_ENV === "development") {
        console.error("AdSense error:", error)
      }
    }
  }, [])

  // Don't show ads in development
  if (process.env.NODE_ENV === "development") {
    return (
      <div className={`border-2 border-dashed border-muted-foreground/20 rounded-lg p-4 ${className}`}>
        <p className="text-center text-xs text-muted-foreground">
          AdSense Ad Unit
          <br />
          <code className="text-xs">Slot: {adSlot}</code>
        </p>
      </div>
    )
  }

  return (
    <ins
      ref={adRef}
      className={`adsbygoogle ${className}`}
      style={{ display: "block", ...style }}
      data-ad-client="ca-pub-1329430506815367"
      data-ad-slot={adSlot}
      data-ad-format={adFormat}
      data-full-width-responsive={fullWidthResponsive.toString()}
    />
  )
}

