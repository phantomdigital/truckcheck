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
  title: "100km Distance Checker - As The Crow Flies | NHVR Logbook Requirement Tool",
  description:
    "Check if you need a work diary (logbook) for your trip. Under NHVR rules, if you're travelling within 100km of your base as the crow flies, you don't need a logbook. Free distance checker for Australian truck drivers. Calculate distance as the crow flies and actual driving distance. Support for multiple stops.",
  path: "/100km-distance-checker-as-the-crow-flies",
  keywords: [
    "100km distance checker",
    "as the crow flies distance checker",
    "NHVR 100km rule",
    "do I need a logbook",
    "work diary requirement checker",
    "logbook requirement Australia",
    "distance from base as the crow flies",
    "truck driver logbook requirement",
    "NHVR compliance tool",
    "100km radius checker",
    "Australian truck driver tools",
    "fleet management tool",
    "NHVR regulations",
    "work diary requirements",
    "truck driver compliance",
    "as the crow flies distance",
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
        name: "100km Distance Checker - As The Crow Flies",
        url: "https://truckcheck.com.au/100km-distance-checker-as-the-crow-flies",
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
              <span>100km Distance Checker</span>
            </nav>

            {/* Title and Description - Critical SEO content */}
            <div className="space-y-3">
              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold tracking-tight">
                Do I Need My Logbook Today?
              </h1>
              <p className="text-base sm:text-lg text-muted-foreground max-w-3xl leading-relaxed">
                Under NHVR rules, if you're travelling within 100km of your base <strong>as the crow flies</strong>, you don't need a work diary. Travelling further? You do.
                Check the distance as the crow flies between your base and destination to determine if a logbook is required.
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

