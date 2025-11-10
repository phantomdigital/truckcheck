export interface GeocodeResult {
  lat: number
  lng: number
  placeName: string
}

export interface Stop {
  id: string
  address: string
  location: GeocodeResult | null
}

export interface CalculationResult {
  distance: number // Straight-line distance to final destination (as the crow flies)
  drivingDistance: number | null // Actual driving route distance
  maxDistanceFromBase: number | null // Maximum distance from base along the route
  logbookRequired: boolean
  baseLocation: GeocodeResult
  stops: Stop[] // All stops along the route
  routeGeometry: any
}

export interface RouteData {
  distance: number
  maxDistanceFromBase: number
  routeGeometry: any
}

