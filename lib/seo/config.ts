import type { Metadata } from "next"

// Site-wide SEO configuration
export const siteConfig = {
  name: "TruckCheck",
  title: "TruckCheck | Free Tools for Australian Truck Drivers & Fleet Managers",
  description: "Free online tools for Australian truck drivers and fleet managers. NHVR logbook calculator, distance checker, and compliance tools. Australian English throughout.",
  url: process.env.NEXT_PUBLIC_SITE_URL || "https://truckcheck.com.au",
  ogImage: "/og-image.png",
  locale: "en-AU",
  twitter: {
    handle: "@truckcheck",
    site: "@truckcheck",
    cardType: "summary_large_image",
  },
}

// Default metadata for all pages
export const defaultMetadata: Metadata = {
  metadataBase: new URL(siteConfig.url),
  title: {
    default: siteConfig.title,
    template: `%s | ${siteConfig.name}`,
  },
  description: siteConfig.description,
  keywords: [
    "NHVR",
    "logbook calculator",
    "work diary calculator",
    "truck driver tools",
    "Australian truck drivers",
    "fleet management",
    "100km rule",
    "NHVR compliance",
    "distance calculator",
    "Australian transport",
  ],
  authors: [{ name: "TruckCheck" }],
  creator: "TruckCheck",
  publisher: "TruckCheck",
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  openGraph: {
    type: "website",
    locale: siteConfig.locale,
    url: siteConfig.url,
    title: siteConfig.title,
    description: siteConfig.description,
    siteName: siteConfig.name,
    images: [
      {
        url: siteConfig.ogImage,
        width: 1200,
        height: 630,
        alt: "TruckCheck - Free Tools for Australian Truck Drivers",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: siteConfig.title,
    description: siteConfig.description,
    images: [siteConfig.ogImage],
    creator: siteConfig.twitter.handle,
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  icons: {
    icon: "/favicon.ico",
    shortcut: "/favicon-16x16.png",
    apple: "/apple-touch-icon.png",
  },
  manifest: "/site.webmanifest",
}

// Helper function to generate page metadata
export function generatePageMetadata({
  title,
  description,
  path,
  image,
  keywords,
  noIndex = false,
}: {
  title: string
  description: string
  path: string
  image?: string
  keywords?: string[]
  noIndex?: boolean
}): Metadata {
  const url = `${siteConfig.url}${path}`
  const ogImage = image || siteConfig.ogImage

  return {
    title,
    description,
    keywords: keywords || defaultMetadata.keywords,
    alternates: {
      canonical: url,
    },
    openGraph: {
      title,
      description,
      url,
      siteName: siteConfig.name,
      images: [
        {
          url: ogImage,
          width: 1200,
          height: 630,
          alt: title,
        },
      ],
      locale: siteConfig.locale,
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [ogImage],
      creator: siteConfig.twitter.handle,
    },
    robots: noIndex
      ? {
          index: false,
          follow: false,
        }
      : undefined,
  }
}

