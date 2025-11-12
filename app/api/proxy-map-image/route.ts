import { NextRequest, NextResponse } from 'next/server'

/**
 * Proxy route to serve Supabase Storage images through our domain
 * This ensures images are served from our domain for better email deliverability
 * 
 * The signed URL from Supabase is passed as a query parameter and we fetch it,
 * then serve it through our domain
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const supabaseUrl = searchParams.get('url')

    if (!supabaseUrl) {
      return NextResponse.json(
        { error: 'Missing url parameter' },
        { status: 400 }
      )
    }

    // Validate that the URL is from our Supabase instance
    const expectedSupabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    if (!expectedSupabaseUrl || !supabaseUrl.startsWith(expectedSupabaseUrl)) {
      return NextResponse.json(
        { error: 'Invalid image URL' },
        { status: 400 }
      )
    }

    // Fetch the image from Supabase Storage using the signed URL
    const response = await fetch(supabaseUrl, {
      cache: 'no-store', // Don't cache the fetch, but we'll cache the response
    })

    if (!response.ok) {
      return NextResponse.json(
        { error: 'Failed to fetch image' },
        { status: response.status }
      )
    }

    // Get the image data
    const imageBuffer = await response.arrayBuffer()
    const contentType = response.headers.get('content-type') || 'image/jpeg'

    // Return the image with appropriate headers
    return new NextResponse(imageBuffer, {
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'public, max-age=31536000, immutable', // Cache for 1 year
      },
    })
  } catch (error) {
    console.error('Error proxying map image:', error)
    return NextResponse.json(
      { error: 'Failed to proxy image' },
      { status: 500 }
    )
  }
}

