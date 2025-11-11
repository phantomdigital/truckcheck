"use client"

import { useEffect, useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { UpgradeButton } from "@/components/upgrade-button"
import { usePathname } from "next/navigation"

interface PricingStickyCtaProps {
  isPro: boolean
  priceId?: string
}

export function PricingStickyCta({ isPro, priceId }: PricingStickyCtaProps) {
  const [isVisible, setIsVisible] = useState(true)
  const [lastScrollY, setLastScrollY] = useState(0)
  const pathname = usePathname()

  useEffect(() => {
    // Only show on pricing page
    if (pathname !== "/pricing") {
      setIsVisible(false)
      return
    }

    const handleScroll = () => {
      const currentScrollY = window.scrollY || document.documentElement.scrollTop
      
      // Show when at top or scrolling up, hide when scrolling down past 100px
      if (currentScrollY < 100) {
        setIsVisible(true)
      } else if (currentScrollY > lastScrollY) {
        // Scrolling down - hide
        setIsVisible(false)
      } else if (currentScrollY < lastScrollY) {
        // Scrolling up - show
        setIsVisible(true)
      }
      
      setLastScrollY(currentScrollY)
    }

    window.addEventListener("scroll", handleScroll, { passive: true })
    return () => window.removeEventListener("scroll", handleScroll)
  }, [pathname, lastScrollY])

  // Don't show if user is already Pro
  if (isPro) {
    return null
  }

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 100, opacity: 0 }}
          transition={{ type: "spring", damping: 25, stiffness: 200 }}
          className="fixed bottom-0 left-0 right-0 z-50 border-t border-border/50 bg-background/95 backdrop-blur supports-backdrop-filter:bg-background/80 shadow-lg"
        >
          <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
            <div className="flex items-center justify-between gap-4">
              <div className="hidden sm:block">
                <p className="text-sm font-medium">Ready to upgrade?</p>
                <p className="text-xs text-muted-foreground">Unlock all Pro features</p>
              </div>
              <div className="flex-1 sm:flex-initial sm:min-w-[200px]">
                <UpgradeButton className="w-full" priceId={priceId} />
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

