import { NextRequest, NextResponse } from 'next/server'
import { createServiceRoleClient } from '@/lib/supabase/server'

/**
 * Proxy route to serve Supabase Storage images through our domain
 * This ensures images are served from our domain for better email deliverability
 * 
 * Format: /api/proxy-map-image/{filePath}
 * Example: /api/proxy-map-image/user-id/map-1234567890-abc123.jpeg
 * 
 * The file path is URL-encoded, so we decode it and use it to generate a signed URL on-demand
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  try {
    // Await params (Next.js 15+ requires params to be awaited)
    const resolvedParams = await params
    
    // Check if this is the old query-parameter format
    const url = new URL(request.url)
    
    // Log bypass parameters for debugging Vercel Authentication Protection
    // Note: If you're seeing 401 errors with no logs, Vercel is blocking the request before it reaches Next.js
    // This means the bypass parameters aren't working or aren't being recognized
    const bypassToken = url.searchParams.get('x-vercel-protection-bypass')
    const setBypassCookie = url.searchParams.get('x-vercel-set-bypass-cookie')
    const userAgent = request.headers.get('user-agent') || 'unknown'
    const referer = request.headers.get('referer') || 'none'
    
    // Check if request has bypass token in headers (alternative method)
    const bypassHeader = request.headers.get('x-vercel-protection-bypass')
    
    console.log('[Proxy Map Image] Request received:', {
      hasBypassToken: !!bypassToken,
      hasBypassHeader: !!bypassHeader,
      hasSetBypassCookie: !!setBypassCookie,
      bypassTokenLength: bypassToken?.length || 0,
      userAgent: userAgent.substring(0, 100),
      referer: referer.substring(0, 100),
      url: url.toString().substring(0, 200),
      timestamp: new Date().toISOString(),
      note: 'If you see this log, the request reached Next.js. If you see 401 with no logs, Vercel blocked it before Next.js.'
    })
    
    const queryUrl = url.searchParams.get('url')
    
    let supabaseUrl: string
    
    if (queryUrl) {
      // Old format: /api/proxy-map-image?url=https://...
      // Decode the Supabase signed URL from query parameter
      supabaseUrl = decodeURIComponent(queryUrl)
      console.log('Using old query-parameter format, decoded Supabase URL:', supabaseUrl.substring(0, 100))
    } else {
      // New format: /api/proxy-map-image/{filePath}
      // Reconstruct the file path from path segments (URL decode it)
      const filePath = resolvedParams.path.map(segment => decodeURIComponent(segment)).join('/')
      
      console.log('Proxy map image request (path-based):', { 
        pathSegments: resolvedParams.path.length,
        filePath
      })

      if (!filePath) {
        console.error('Missing file path')
        return NextResponse.json(
          { error: 'Missing image path' },
          { status: 400 }
        )
      }

      // Validate file path format (should be userId/filename)
      if (!filePath.includes('/') || filePath.split('/').length !== 2) {
        console.error('Invalid file path format:', filePath)
        return NextResponse.json(
          { error: 'Invalid image path format' },
          { status: 400 }
        )
      }

      // Generate signed URL on-demand using the file path
      const supabase = createServiceRoleClient()
      
      // Create signed URL (valid for 1 year - emails need long-lived URLs)
      const { data: signedUrlData, error: signedUrlError } = await supabase.storage
        .from('map-images')
        .createSignedUrl(filePath, 31536000) // 1 year in seconds

      if (signedUrlError || !signedUrlData) {
        console.error('Error creating signed URL:', signedUrlError)
        return NextResponse.json(
          { error: 'Failed to generate image URL', details: signedUrlError?.message },
          { status: 500 }
        )
      }

      supabaseUrl = signedUrlData.signedUrl
      console.log('Generated signed URL for file path:', { filePath, urlPreview: supabaseUrl.substring(0, 100) })
    }

    // Fetch the image from Supabase Storage using the signed URL
    console.log('Fetching image from Supabase Storage')
    const response = await fetch(supabaseUrl, {
      cache: 'no-store', // Don't cache the fetch, but we'll cache the response
      headers: {
        // Ensure we're making a proper HTTP request
        'User-Agent': 'TruckCheck-Proxy/1.0',
      },
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

    // Return the image with appropriate headers for email clients
    return new NextResponse(imageBuffer, {
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'public, max-age=31536000, immutable', // Cache for 1 year
        'Access-Control-Allow-Origin': '*', // Allow email clients to fetch
        'Access-Control-Allow-Methods': 'GET',
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

