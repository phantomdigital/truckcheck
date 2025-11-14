import { Suspense } from "react"
import Script from "next/script"
import type { Metadata } from "next"
import { TruckSetupWizard } from "@/components/load-calculator/truck-setup-wizard"
import { Skeleton } from "@/components/ui/skeleton"
import { generatePageMetadata } from "@/lib/seo/config"
import { getBreadcrumbSchema } from "@/lib/seo/structured-data"

export const metadata: Metadata = generatePageMetadata({
  title: "Create Truck Profile | Load Calculator Setup",
  description:
    "Set up your truck profile with our step-by-step wizard. Select your truck model and we'll pre-fill specifications from manufacturer data.",
  path: "/load-calculator/setup",
  keywords: [
    "truck profile setup",
    "truck specifications",
    "create truck profile",
    "truck setup wizard",
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
    {
      name: "Setup Truck",
      url: "https://truckcheck.com.au/load-calculator/setup",
    },
  ])

  return (
    <>
      <Script
        id="page-structured-data"
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
      />

      <header className="w-full border-b border-border/50 bg-muted/30">
        <div className="w-full max-w-7xl mx-auto px-4 lg:px-8 py-8 sm:py-12">
          <div className="max-w-4xl mx-auto space-y-3">
            <nav className="flex items-center gap-2 text-sm text-muted-foreground" aria-label="Breadcrumb">
              <a href="/" className="hover:text-foreground transition-colors">
                Home
              </a>
              <span>/</span>
              <a href="/load-calculator" className="hover:text-foreground transition-colors">
                Load Calculator
              </a>
              <span>/</span>
              <span>Setup Truck</span>
            </nav>

            <div className="space-y-2">
              <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">
                Create Truck Profile (Admin)
              </h1>
              <p className="text-sm sm:text-base text-muted-foreground">
                Set up a truck profile from manufacturer data. Body width is external measurement (2.5m) - accounts for wall thickness on refrigerated/pantech trucks.
              </p>
            </div>
          </div>
        </div>
      </header>
    </>
  )
}

function SetupSkeleton() {
  return (
    <div className="container mx-auto py-8 px-4 max-w-4xl">
      <Skeleton className="h-12 w-full mb-6" />
      <Skeleton className="h-[500px] w-full" />
    </div>
  )
}

export default function TruckSetupPage() {
  return (
    <>
      <PageHeader />
      <Suspense fallback={<SetupSkeleton />}>
        <div className="container mx-auto py-8 px-4 max-w-4xl">
          <TruckSetupWizard />
        </div>
      </Suspense>
    </>
  )
}

