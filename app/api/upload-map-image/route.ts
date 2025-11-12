import { NextRequest, NextResponse } from 'next/server'
import { writeFile } from 'fs/promises'
import { join } from 'path'
import { existsSync, mkdirSync } from 'fs'

export async function POST(request: NextRequest) {
  try {
    const { imageData } = await request.json()

    if (!imageData || typeof imageData !== 'string') {
      return NextResponse.json(
        { error: 'Invalid image data' },
        { status: 400 }
      )
    }

    // Validate it's a base64 data URL
    if (!imageData.startsWith('data:image/')) {
      return NextResponse.json(
        { error: 'Invalid image format. Expected base64 data URL' },
        { status: 400 }
      )
    }

    // Extract image format and data
    const matches = imageData.match(/^data:image\/(\w+);base64,(.+)$/)
    if (!matches) {
      return NextResponse.json(
        { error: 'Invalid base64 image format' },
        { status: 400 }
      )
    }

    const [, format, base64Data] = matches
    const allowedFormats = ['jpeg', 'jpg', 'png']
    if (!allowedFormats.includes(format.toLowerCase())) {
      return NextResponse.json(
        { error: `Invalid image format. Allowed: ${allowedFormats.join(', ')}` },
        { status: 400 }
      )
    }

    // Convert base64 to buffer
    const buffer = Buffer.from(base64Data, 'base64')

    // Generate unique filename
    const filename = `map-${Date.now()}-${Math.random().toString(36).substring(7)}.${format === 'jpg' ? 'jpeg' : format}`
    const publicDir = join(process.cwd(), 'public', 'map-images')

    // Ensure directory exists
    if (!existsSync(publicDir)) {
      mkdirSync(publicDir, { recursive: true })
    }

    // Write file
    const filePath = join(publicDir, filename)
    await writeFile(filePath, buffer)

    // Return URL - use main site URL for hosting images
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://truckcheck.com.au'
    const imageUrl = `${siteUrl}/map-images/${filename}`

    return NextResponse.json({ url: imageUrl })
  } catch (error) {
    console.error('Error uploading map image:', error)
    return NextResponse.json(
      { error: 'Failed to upload image' },
      { status: 500 }
    )
  }
}

