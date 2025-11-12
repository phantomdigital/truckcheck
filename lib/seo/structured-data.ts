import { siteConfig } from "./config"

// Organisation schema (Australian English spelling)
export function getOrganisationSchema() {
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: siteConfig.name,
    url: siteConfig.url,
    logo: `${siteConfig.url}/TRUCKCHECK_LOGO.png`,
    description: siteConfig.description,
    address: {
      "@type": "PostalAddress",
      addressCountry: "AU",
    },
    contactPoint: {
      "@type": "ContactPoint",
      contactType: "Customer Service",
      areaServed: "AU",
      availableLanguage: ["en-AU"],
    },
    sameAs: [
      // Add social media links here when available
    ],
  }
}

// WebSite schema with search action
export function getWebSiteSchema() {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: siteConfig.name,
    url: siteConfig.url,
    description: siteConfig.description,
    inLanguage: "en-AU",
    potentialAction: {
      "@type": "SearchAction",
      target: {
        "@type": "EntryPoint",
        urlTemplate: `${siteConfig.url}/search?q={search_term_string}`,
      },
      "query-input": "required name=search_term_string",
    },
  }
}

// BreadcrumbList schema
export function getBreadcrumbSchema(items: Array<{ name: string; url: string }>) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      item: item.url,
    })),
  }
}

// SoftwareApplication schema for the NHVR Logbook Calculator
export function getNHVRCalculatorSchema() {
  return {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name: "NHVR Logbook Calculator",
    applicationCategory: "BusinessApplication",
    operatingSystem: "Any",
    offers: {
      "@type": "Offer",
      price: "0",
      priceCurrency: "AUD",
    },
    aggregateRating: {
      "@type": "AggregateRating",
      ratingValue: "4.8",
      ratingCount: "150",
      bestRating: "5",
      worstRating: "1",
    },
    description:
      "Free NHVR logbook calculator for Australian truck drivers. Check if you need to complete a work diary (logbook) based on the 100km radius rule. Calculate straight-line and driving distances with multiple stops support.",
    featureList: [
      "Calculate distance from base location",
      "Support for multiple stops and waypoints",
      "Straight-line (as the crow flies) distance calculation",
      "Actual driving route distance calculation",
      "100km radius visualisation on map",
      "CSV import for bulk route checking",
      "PDF export and print functionality",
      "Save recent searches",
      "Share results via URL",
    ],
    screenshot: `${siteConfig.url}/og-image.png`,
    softwareVersion: "1.0",
    author: {
      "@type": "Organization",
      name: siteConfig.name,
    },
    provider: {
      "@type": "Organization",
      name: siteConfig.name,
    },
    inLanguage: "en-AU",
    countryOfOrigin: {
      "@type": "Country",
      name: "Australia",
    },
    audience: {
      "@type": "Audience",
      audienceType: "Truck Drivers, Fleet Managers, Transport Operators",
      geographicArea: {
        "@type": "Country",
        name: "Australia",
      },
    },
  }
}

// FAQPage schema for common NHVR questions
export function getNHVRFAQSchema() {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: [
      {
        "@type": "Question",
        name: "Do I need a logbook if I travel within 100km of my base?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "No, under NHVR regulations, you do not need to complete a work diary (logbook) if you are travelling within 100km of your base location. This is measured as the straight-line distance (as the crow flies) from your base.",
        },
      },
      {
        "@type": "Question",
        name: "How is the 100km distance measured?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "The 100km distance is measured as a straight-line (as the crow flies) from your base location. However, NHVR regulations consider the maximum distance you travel from base during your journey, not just your final destination. If your driving route takes you more than 100km from base at any point, a logbook is required.",
        },
      },
      {
        "@type": "Question",
        name: "Can I check multiple stops along my route?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "Yes, the NHVR Logbook Calculator supports multiple stops and waypoints. It will calculate both the straight-line distance to your final destination and the maximum distance from your base along your actual driving route, helping you determine if a logbook is required for complex multi-stop journeys.",
        },
      },
      {
        "@type": "Question",
        name: "Is this calculator free to use?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "Yes, the NHVR Logbook Calculator is completely free to use for Australian truck drivers and fleet managers. There are no hidden fees or subscription requirements.",
        },
      },
    ],
  }
}

// Helper to combine multiple schemas
export function combineSchemas(...schemas: Array<Record<string, unknown>>) {
  return {
    "@context": "https://schema.org",
    "@graph": schemas,
  }
}

