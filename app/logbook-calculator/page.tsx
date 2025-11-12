import type { Metadata } from "next"
import Script from "next/script"
import { Suspense } from "react"
import { ResultSkeleton } from "@/components/logbook/result-skeleton"
import { LogbookCheckerWrapper } from "@/components/logbook/logbook-checker-wrapper"
import { generatePageMetadata } from "@/lib/seo/config"
import {
  getNHVRCalculatorSchema,
  getNHVRFAQSchema,
  getBreadcrumbSchema,
  combineSchemas,
} from "@/lib/seo/structured-data"

// SEO-optimised metadata using Australian English
export const metadata: Metadata = generatePageMetadata({
  title: "NHVR Logbook Calculator | 100km Distance Check Australia",
  description:
    "Free NHVR logbook calculator for Australian truck drivers. Check if you need a work diary (logbook) for your trip. Calculate straight-line and driving distance. Support for multiple stops. 100km radius compliance tool.",
  path: "/nhvr-logbook-checker",
  keywords: [
    "NHVR 100km calculator",
    "logbook calculator Australia",
    "work diary calculator",
    "do I need a logbook",
    "truck driver logbook",
    "NHVR compliance tool",
    "100km radius calculator",
    "distance from base calculator",
    "Australian truck driver tools",
    "fleet management calculator",
    "NHVR regulations",
    "work diary requirements",
    "truck driver compliance",
    "logbook requirements Australia",
  ],
})

// Generate structured data for this specific tool (static, no async needed)
function PageHeader() {
  const structuredData = combineSchemas(
    getNHVRCalculatorSchema(),
    getNHVRFAQSchema(),
    getBreadcrumbSchema([
      {
        name: "Home",
        url: "https://truckcheck.com.au",
      },
      {
        name: "NHVR Logbook Calculator",
        url: "https://truckcheck.com.au/nhvr-logbook-checker",
      },
    ])
  )

  return (
    <>
      {/* Page-specific structured data */}
      <Script
        id="page-structured-data"
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
      />

      {/* Server-rendered page header for SEO - Static, loads immediately */}
      <header className="w-full border-b border-border/50 bg-muted/30">
        <div className="w-full max-w-[100rem] mx-auto px-4 lg:px-8 py-12 sm:py-20 lg:py-32">
          <div className="max-w-6xl mx-auto space-y-4">
            {/* Breadcrumbs */}
            <nav className="flex items-center gap-2 text-sm text-muted-foreground" aria-label="Breadcrumb">
              <a href="/" className="hover:text-foreground transition-colors">
                Home
              </a>
              <span>/</span>
              <span>Logbook Calculator</span>
            </nav>

            {/* Title and Description - Critical SEO content */}
            <div className="space-y-3">
              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold tracking-tight">
                Do I Need My Logbook Today?
              </h1>
              <p className="text-base sm:text-lg text-muted-foreground max-w-3xl leading-relaxed">
                Working within 100km of your base? You don't need a work diary. Travelling further? You do.
                Calculate the straight-line distance between your base and destination in seconds to stay NHVR compliant.
              </p>
              <p className="text-sm text-muted-foreground/80 max-w-2xl">
                Free tool for Australian truck drivers and fleet managers. No sign-up required.
              </p>
            </div>
          </div>
        </div>
      </header>
    </>
  )
}

export default async function NHVRLogbookCheckerPage() {
  // Public page - no auth required
  // Static content renders immediately, dynamic content loads via Suspense
  return (
    <>
      {/* Static header - renders immediately */}
      <PageHeader />

      {/* Dynamic Content - Shows skeleton while loading subscription status */}
      <Suspense fallback={
        <div className="w-full max-w-[100rem] mx-auto px-4 lg:px-8 py-6">
          <div className="max-w-6xl mx-auto space-y-4 sm:space-y-6">
            <ResultSkeleton />
          </div>
        </div>
      }>
        <LogbookCheckerWrapper />
      </Suspense>
    </>
  )
}

