import type { GeocodeResult, RouteData } from "./types"

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
  
  // Use Mapbox Geocoding API (Australia-focused)
  const response = await fetch(
    `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodedAddress}.json?country=AU&access_token=${mapboxToken}&limit=1`
  )

  if (!response.ok) {
    throw new Error(`Geocoding failed: ${response.statusText}`)
  }

  const data = await response.json()

  if (!data.features || data.features.length === 0) {
    throw new Error(`Could not find location: ${address}`)
  }

  const feature = data.features[0]
  const [lng, lat] = feature.center
  const placeName = feature.place_name

  return { lat, lng, placeName }
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
    const response = await fetch(
      `https://api.mapbox.com/directions/v5/mapbox/driving/${coordinates}?geometries=geojson&overview=full&access_token=${mapboxToken}`
    )

    if (!response.ok) {
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
    console.error("Error calculating driving distance:", error)
    return null
  }
}

