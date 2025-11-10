import { useRouter } from "next/navigation"
import type { GeocodeResult } from "./types"

/**
 * Hook to update URL with search parameters for shareable links
 */
export function useURLUpdater() {
  const router = useRouter()

  const updateURL = (
    base: GeocodeResult,
    dest: GeocodeResult,
    distance: number,
    logbookRequired: boolean
  ) => {
    const params = new URLSearchParams()
    params.set("baseName", base.placeName)
    params.set("baseLat", base.lat.toString())
    params.set("baseLng", base.lng.toString())
    params.set("destName", dest.placeName)
    params.set("destLat", dest.lat.toString())
    params.set("destLng", dest.lng.toString())
    params.set("distance", distance.toString())
    params.set("logbookRequired", logbookRequired.toString())
    
    router.push(`?${params.toString()}`, { scroll: false })
  }

  return { updateURL }
}

/**
 * Hook to handle sharing URLs to clipboard
 */
export function useShare() {
  const handleShare = async (): Promise<boolean> => {
    if (typeof window === "undefined") return false
    
    const url = window.location.href
    try {
      await navigator.clipboard.writeText(url)
      return true
    } catch (err) {
      console.error("Failed to copy URL:", err)
      return false
    }
  }

  return { handleShare }
}

