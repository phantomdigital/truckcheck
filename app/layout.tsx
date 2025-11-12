import type { Metadata, Viewport } from "next"
import { Outfit } from "next/font/google"
import Script from "next/script"
import { Suspense } from "react"
import "./globals.css"
import { RecentSearchesProvider } from "@/lib/recent-searches-context"
import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { Toaster } from "@/components/ui/sonner"
import { EzoicRouteRefresh } from "@/components/ezoic"
import { defaultMetadata } from "@/lib/seo/config"
import { getOrganisationSchema, getWebSiteSchema, combineSchemas } from "@/lib/seo/structured-data"

// Font optimisation with next/font - Outfit for clean, modern geometric look
const outfit = Outfit({
  subsets: ["latin"],
  variable: "--font-outfit",
  display: "swap", // Better font loading strategy
  preload: true,
  weight: ["300", "400", "500", "600", "700"], // Light to Bold range
})

// Viewport configuration
export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
    { media: "(prefers-color-scheme: dark)", color: "#0a0a0a" },
  ],
}

// Site-wide metadata
export const metadata: Metadata = defaultMetadata

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  // Generate structured data
  const structuredData = combineSchemas(
    getOrganisationSchema(),
    getWebSiteSchema()
  )

  return (
    <html lang="en-AU" suppressHydrationWarning>
      <head>
        {/* Web App Manifest */}
        <link rel="manifest" href="/site.webmanifest" />
        
        {/* Ezoic Privacy Scripts - Must be loaded FIRST before header script */}
        <Script
          src="https://cmp.gatekeeperconsent.com/min.js"
          data-cfasync="false"
          strategy="beforeInteractive"
        />
        <Script
          src="https://the.gatekeeperconsent.com/cmp.min.js"
          data-cfasync="false"
          strategy="beforeInteractive"
        />

        {/* Ezoic Header Script - Initializes the ad system */}
        <Script
          async
          src="https://www.ezojs.com/ezoic/sa.min.js"
          strategy="beforeInteractive"
        />
        <Script
          id="ezoic-init"
          strategy="beforeInteractive"
          dangerouslySetInnerHTML={{
            __html: `
              window.ezstandalone = window.ezstandalone || {};
              ezstandalone.cmd = ezstandalone.cmd || [];
            `
          }}
        />
        
        {/* Structured Data (JSON-LD) */}
        <Script
          id="structured-data"
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
        />


      </head>
      <body
        className={`${outfit.variable} antialiased flex flex-col min-h-screen font-sans`}
      >
        <RecentSearchesProvider>
          <EzoicRouteRefresh />
          <Suspense fallback={<header className="sticky top-0 z-50 w-full border-b border-border/50 bg-background/95 backdrop-blur supports-backdrop-filter:bg-background/60 h-16" />}>
          <Header />
          </Suspense>
          <main className="flex-1">
            {children}
          </main>
          <Suspense fallback={<footer className="w-full border-t border-border/50 mt-auto bg-muted/20 h-32" />}>
          <Footer />
          </Suspense>
        </RecentSearchesProvider>
        <Toaster />
      </body>
    </html>
  )
}
