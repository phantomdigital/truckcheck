import { createServiceRoleClient } from '@/lib/supabase/server'

/**
 * Upload base64 image to Supabase Storage and return signed URL
 * Images are stored in private bucket, organized by user ID
 */
export async function uploadMapImage(
  imageData: string,
  userId: string
): Promise<string | null> {
  try {
    if (!imageData || typeof imageData !== 'string') {
      return null
    }

    // Validate it's a base64 data URL
    if (!imageData.startsWith('data:image/')) {
      return null
    }

    // Extract image format and data
    const matches = imageData.match(/^data:image\/(\w+);base64,(.+)$/)
    if (!matches) {
      return null
    }

    const [, format, base64Data] = matches
    const allowedFormats = ['jpeg', 'jpg', 'png']
    if (!allowedFormats.includes(format.toLowerCase())) {
      return null
    }

    // Convert base64 to buffer
    const buffer = Buffer.from(base64Data, 'base64')

    // Generate unique filename
    const filename = `map-${Date.now()}-${Math.random().toString(36).substring(7)}.${format === 'jpg' ? 'jpeg' : format}`
    
    // Store in user-specific folder: {userId}/{filename}
    const filePath = `${userId}/${filename}`

    // Use service role client to bypass RLS for server-side uploads
    const supabase = createServiceRoleClient()

    // Upload to Supabase Storage
    const { data, error } = await supabase.storage
      .from('map-images')
      .upload(filePath, buffer, {
        contentType: `image/${format === 'jpg' ? 'jpeg' : format}`,
        upsert: false, // Don't overwrite existing files
      })

    if (error) {
      console.error('Error uploading to Supabase Storage:', error)
      return null
    }

    // Generate signed URL (valid for 1 year - emails need long-lived URLs)
    const { data: signedUrlData, error: signedUrlError } = await supabase.storage
      .from('map-images')
      .createSignedUrl(filePath, 31536000) // 1 year in seconds

    if (signedUrlError || !signedUrlData) {
      console.error('Error creating signed URL:', signedUrlError)
      return null
    }

    // Return the signed URL - this will be proxied through our domain
    return signedUrlData.signedUrl
  } catch (error) {
    console.error('Error uploading map image:', error)
    return null
  }
}
