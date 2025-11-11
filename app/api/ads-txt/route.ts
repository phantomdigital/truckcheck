import { NextResponse } from "next/server"

/**
 * Ezoic ads.txt API Route (Alternative approach)
 * 
 * This route fetches and serves the ads.txt content from Ezoic's manager.
 * Access it via: /api/ads-txt
 * 
 * To use this instead of the redirect, update next.config.ts rewrites to:
 * rewrite: { source: '/ads.txt', destination: '/api/ads-txt' }
 * 
 * Or configure your hosting provider to route /ads.txt to this endpoint.
 */
export async function GET() {
  // Get domain from environment variable
  const domain = process.env.EZOIC_ADS_TXT_DOMAIN || "truckcheck.com.au"
  
  // Fetch ads.txt from Ezoic's manager
  try {
    const response = await fetch(
      `https://srv.adstxtmanager.com/19390/${domain}`,
      {
        headers: {
          "User-Agent": "Mozilla/5.0",
        },
        next: { revalidate: 3600 }, // Revalidate every hour
      }
    )

    if (!response.ok) {
      throw new Error(`Failed to fetch ads.txt: ${response.statusText}`)
    }

    const adsTxtContent = await response.text()

    return new NextResponse(adsTxtContent, {
      status: 200,
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
        "Cache-Control": "public, max-age=3600, s-maxage=3600", // Cache for 1 hour
      },
    })
  } catch (error) {
    console.error("Error fetching ads.txt:", error)
    
    // Fallback: Return a basic ads.txt with Ezoic entry
    return new NextResponse(
      `# Ezoic ads.txt\n# Error fetching from manager. Please check configuration.\n# Domain: ${domain}\n`,
      {
        status: 200,
        headers: {
          "Content-Type": "text/plain; charset=utf-8",
        },
      }
    )
  }
}

