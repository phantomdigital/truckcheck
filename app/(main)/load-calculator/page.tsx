import { redirect } from "next/navigation"
import Script from "next/script"
import type { Metadata } from "next"
import { generatePageMetadata } from "@/lib/seo/config"
import { getBreadcrumbSchema } from "@/lib/seo/structured-data"

export const metadata: Metadata = generatePageMetadata({
  title: "Load Calculator | Truck Weight Distribution Calculator | NHVR Mass Management",
  description:
    "Plan your truck load and calculate weight distribution across axles. Visual load planning with real-time physics calculations. Ensure compliance with NHVR mass management guidelines. Free tool for Australian truck drivers.",
  path: "/load-calculator",
  keywords: [
    "truck load calculator",
    "weight distribution calculator",
    "axle weight calculator",
    "GVM calculator",
    "truck loading planner",
    "mass management",
    "NHVR compliance",
    "load planning tool",
    "Australia truck tools",
    "axle weight limits",
    "pallet loading calculator",
  ],
})

function PageHeader() {
  const structuredData = getBreadcrumbSchema([
    {
      name: "Home",
      url: "https://truckcheck.com.au",
    },
    {
      name: "Load Calculator",
      url: "https://truckcheck.com.au/load-calculator",
    },
  ])

  return (
    <>
      {/* Page-specific structured data */}
      <Script
        id="page-structured-data"
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
      />

      {/* Server-rendered page header for SEO */}
      <header className="w-full border-b border-border/50 bg-muted/30">
        <div className="w-full max-w-[100rem] mx-auto px-4 lg:px-8 py-12 sm:py-20 lg:py-32">
          <div className="max-w-6xl mx-auto space-y-4">
            {/* Breadcrumbs */}
            <nav className="flex items-center gap-2 text-sm text-muted-foreground" aria-label="Breadcrumb">
              <a href="/" className="hover:text-foreground transition-colors">
                Home
              </a>
              <span>/</span>
              <span>Load Calculator</span>
            </nav>

            {/* Title and Description - Critical SEO content */}
            <div className="space-y-3">
              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold tracking-tight">
                Truck Load Calculator
              </h1>
              <p className="text-base sm:text-lg text-muted-foreground max-w-3xl leading-relaxed">
                Plan your truck load and calculate weight distribution across axles in real-time. 
                Visual load planning with physics-based calculations to ensure compliance with <strong>NHVR mass management</strong> guidelines.
              </p>
              <p className="text-sm text-muted-foreground/80 max-w-2xl">
                Free tool for Australian truck drivers and fleet managers. Save truck profiles and load calculations.
              </p>
            </div>
          </div>
        </div>
      </header>
    </>
  )
}

export default function LoadCalculatorPage() {
  // Redirect to the dashboard app
  redirect("/load-calculator/app")
}

