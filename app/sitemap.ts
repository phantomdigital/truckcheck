import { MetadataRoute } from "next"

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://truckcheck.com.au"

  // Define your routes with their metadata
  const routes = [
    {
      url: `${baseUrl}/nhvr-logbook-checker`,
      lastModified: new Date(),
      changeFrequency: "weekly" as const,
      priority: 1.0,
    },
    // Add more routes as you add more tools
    // {
    //   url: `${baseUrl}/another-tool`,
    //   lastModified: new Date(),
    //   changeFrequency: 'monthly' as const,
    //   priority: 0.8,
    // },
  ]

  return routes
}

