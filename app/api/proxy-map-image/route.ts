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

    console.log('Proxy map image request:', { 
      hasUrl: !!supabaseUrl,
      urlPreview: supabaseUrl ? supabaseUrl.substring(0, 100) : null 
    })

    if (!supabaseUrl) {
      console.error('Missing url parameter')
      return NextResponse.json(
        { error: 'Missing url parameter' },
        { status: 400 }
      )
    }

    // Validate that the URL is from our Supabase instance
    const expectedSupabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    console.log('Validating Supabase URL:', { 
      expected: expectedSupabaseUrl,
      provided: supabaseUrl.substring(0, 100),
      matches: expectedSupabaseUrl ? supabaseUrl.startsWith(expectedSupabaseUrl) : false
    })

    if (!expectedSupabaseUrl || !supabaseUrl.startsWith(expectedSupabaseUrl)) {
      console.error('Invalid image URL - not from expected Supabase instance')
      return NextResponse.json(
        { error: 'Invalid image URL' },
        { status: 400 }
      )
    }

    // Fetch the image from Supabase Storage using the signed URL
    console.log('Fetching image from Supabase:', supabaseUrl.substring(0, 150))
    const response = await fetch(supabaseUrl, {
      cache: 'no-store', // Don't cache the fetch, but we'll cache the response
    })

    console.log('Supabase fetch response:', { 
      ok: response.ok, 
      status: response.status,
      contentType: response.headers.get('content-type'),
      contentLength: response.headers.get('content-length')
    })

    if (!response.ok) {
      const errorText = await response.text().catch(() => 'Unable to read error')
      console.error('Failed to fetch image from Supabase:', { 
        status: response.status,
        statusText: response.statusText,
        error: errorText.substring(0, 200)
      })
      return NextResponse.json(
        { error: 'Failed to fetch image', details: errorText.substring(0, 200) },
        { status: response.status }
      )
    }

    // Get the image data
    const imageBuffer = await response.arrayBuffer()
    const contentType = response.headers.get('content-type') || 'image/jpeg'

    console.log('Successfully proxied image:', { 
      size: imageBuffer.byteLength,
      contentType 
    })

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
      { error: 'Failed to proxy image', details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    )
  }
}

