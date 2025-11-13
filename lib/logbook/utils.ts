import type { GeocodeResult, RouteData } from "./types"
import { safeCaptureException } from "@/lib/sentry/utils"

/**
 * Fetch with timeout wrapper to prevent indefinite hangs
 */
async function fetchWithTimeout(url: string, options: RequestInit = {}, timeoutMs: number): Promise<Response> {
  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs)

  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
    })
    clearTimeout(timeoutId)
    return response
  } catch (error) {
    clearTimeout(timeoutId)
    if (error instanceof Error && error.name === 'AbortError') {
      const timeoutSeconds = Math.round(timeoutMs / 1000)
      throw new Error(`Request timed out after ${timeoutSeconds} seconds. Please try again.`)
    }
    throw error
  }
}

/**
 * Haversine formula to calculate distance between two points (as the crow flies)
 * Returns distance in kilometers
 */
export function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371 // Earth's radius in kilometers
  const dLat = (lat2 - lat1) * (Math.PI / 180)
  const dLon = (lon2 - lon1) * (Math.PI / 180)
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * (Math.PI / 180)) *
      Math.cos(lat2 * (Math.PI / 180)) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2)
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  return R * c
}

/**
 * Geocode an address using Mapbox Geocoding API
 * Returns lat/lng coordinates and place name
 */
export async function geocodeAddress(address: string): Promise<GeocodeResult> {
  const mapboxToken = process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN
  
  if (!mapboxToken) {
    throw new Error("Mapbox access token is not configured. Please set NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN in your environment variables.")
  }

  // Encode address for URL
  const encodedAddress = encodeURIComponent(address)
  
  try {
    // Use Mapbox Geocoding API (Australia-focused)
    // 30 second timeout to prevent indefinite hangs
    const response = await fetchWithTimeout(
      `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodedAddress}.json?country=AU&access_token=${mapboxToken}&limit=1`,
      {},
      30000 // 30 seconds
    )

    if (!response.ok) {
      const error = new Error(`Geocoding failed: ${response.statusText}`)
      safeCaptureException(error, {
        context: "geocode_address_api_error",
        address,
        status: response.status,
        statusText: response.statusText,
      })
      throw error
    }

    const data = await response.json()

    if (!data.features || data.features.length === 0) {
      // Not found is a user error, not a system error - don't track in Sentry
      throw new Error(`Could not find location: ${address}`)
    }

    const feature = data.features[0]
    const [lng, lat] = feature.center
    const placeName = feature.place_name

    return { lat, lng, placeName }
  } catch (error) {
    // Re-throw user-facing errors (not found, timeout) without tracking
    if (error instanceof Error && (
      error.message.includes("Could not find location") ||
      error.message.includes("timed out")
    )) {
      throw error
    }
    // Track unexpected errors
    const err = error instanceof Error ? error : new Error(String(error))
    safeCaptureException(err, {
      context: "geocode_address_unexpected_error",
      address,
    })
    throw err
  }
}

/**
 * Calculate driving route distance and maximum distance from base along the route
 * Uses Mapbox Directions API with multiple waypoints
 */
export async function calculateDrivingDistance(
  baseLat: number,
  baseLng: number,
  waypoints: Array<{ lat: number; lng: number }>
): Promise<RouteData | null> {
  const mapboxToken = process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN
  
  if (!mapboxToken) {
    return null
  }

  try {
    // Build coordinates string: base;waypoint1;waypoint2;...
    const coordinates = [
      `${baseLng},${baseLat}`,
      ...waypoints.map(wp => `${wp.lng},${wp.lat}`)
    ].join(';')

    // Use Mapbox Directions API to get driving route with multiple waypoints
    // overview=full gives detailed geometry that follows roads closely
    // 60 second timeout to prevent indefinite hangs (routes can take longer)
    const response = await fetchWithTimeout(
      `https://api.mapbox.com/directions/v5/mapbox/driving/${coordinates}?geometries=geojson&overview=full&access_token=${mapboxToken}`,
      {},
      60000 // 60 seconds
    )

    if (!response.ok) {
      const error = new Error(`Mapbox Directions API failed: ${response.statusText}`)
      safeCaptureException(error, {
        context: "calculate_driving_distance_api_error",
        status: response.status,
        statusText: response.statusText,
        waypointCount: waypoints.length,
      })
      return null
    }

    const data = await response.json()

    if (data.routes && data.routes.length > 0) {
      const route = data.routes[0]
      // Distance is in meters, convert to kilometers
      const distanceInMeters = route.distance
      const geometry = route.geometry

      // Check distance from base at multiple points along the route
      let maxDistanceFromBase = 0
      if (geometry && geometry.coordinates) {
        // Sample points along the route (every 10th point to avoid too many calculations)
        const coordinates = geometry.coordinates
        const sampleRate = Math.max(1, Math.floor(coordinates.length / 20)) // Sample ~20 points
        
        for (let i = 0; i < coordinates.length; i += sampleRate) {
          const [lng, lat] = coordinates[i]
          const distanceFromBase = calculateDistance(baseLat, baseLng, lat, lng)
          if (distanceFromBase > maxDistanceFromBase) {
            maxDistanceFromBase = distanceFromBase
          }
        }
        
        // Also check the final destination
        const [finalLng, finalLat] = coordinates[coordinates.length - 1]
        const finalDistance = calculateDistance(baseLat, baseLng, finalLat, finalLng)
        if (finalDistance > maxDistanceFromBase) {
          maxDistanceFromBase = finalDistance
        }
      }

      return {
        distance: distanceInMeters / 1000,
        maxDistanceFromBase,
        routeGeometry: geometry
      }
    }

    return null
  } catch (error) {
    const err = error instanceof Error ? error : new Error(String(error))
    // Track timeout errors separately for monitoring
    if (err.message.includes("timed out")) {
      safeCaptureException(err, {
        context: "calculate_driving_distance_timeout",
        waypointCount: waypoints.length,
      })
    } else {
      safeCaptureException(err, {
        context: "calculate_driving_distance_unexpected_error",
        waypointCount: waypoints.length,
      })
    }
    console.error("Error calculating driving distance:", error)
    return null
  }
}

