import { NextRequest, NextResponse } from 'next/server'
import { uploadMapImage } from '@/lib/email/upload-image'
import { getCachedUser } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
  try {
    const { imageData } = await request.json()

    if (!imageData || typeof imageData !== 'string') {
      return NextResponse.json(
        { error: 'Invalid image data' },
        { status: 400 }
      )
    }

    // Get authenticated user
    const user = await getCachedUser()
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const signedUrl = await uploadMapImage(imageData, user.id)

    if (!signedUrl) {
      return NextResponse.json(
        { error: 'Failed to upload image' },
        { status: 500 }
      )
    }

    // Return proxied URL through our domain
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://truckcheck.com.au'
    const proxiedUrl = `${siteUrl}/api/proxy-map-image?url=${encodeURIComponent(signedUrl)}`

    return NextResponse.json({ url: proxiedUrl })
  } catch (error) {
    console.error('Error uploading map image:', error)
    return NextResponse.json(
      { error: 'Failed to upload image' },
      { status: 500 }
    )
  }
}

