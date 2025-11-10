import type { Metadata, Viewport } from "next"
import { Outfit } from "next/font/google"
import Script from "next/script"
import "./globals.css"
import { RecentSearchesProvider } from "@/lib/recent-searches-context"
import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { Toaster } from "@/components/ui/sonner"
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
        
        {/* Structured Data (JSON-LD) */}
        <Script
          id="structured-data"
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
        />

        {/* Google AdSense */}
        <Script
          async
          src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-1329430506815367"
          crossOrigin="anonymous"
          strategy="afterInteractive"
        />

        {/* Google Analytics - Uncomment and add your GA4 ID when ready */}
        {/* <Script
          src={`https://www.googletagmanager.com/gtag/js?id=G-XXXXXXXXXX`}
          strategy="afterInteractive"
        />
        <Script id="google-analytics" strategy="afterInteractive">
          {`
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', 'G-XXXXXXXXXX');
          `}
        </Script> */}
      </head>
      <body
        className={`${outfit.variable} antialiased flex flex-col min-h-screen font-sans`}
      >
        <RecentSearchesProvider>
          <Header />
          <main className="flex-1">
            {children}
          </main>
          <Footer />
        </RecentSearchesProvider>
        <Toaster />
      </body>
    </html>
  )
}
