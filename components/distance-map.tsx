"use client"

import { useEffect, useRef, useState } from "react"
import mapboxgl from "mapbox-gl"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"

interface Location {
  lat: number
  lng: number
  placeName: string
}

interface Stop {
  id: string
  address: string
  location: Location | null
}

interface DistanceMapProps {
  baseLocation: Location
  stops: Stop[]
  routeGeometry?: any
  maxDistanceFromBase?: number | null
}

// Extended map type with our custom method
interface ExtendedMap extends mapboxgl.Map {
  resetToOriginalBounds?: () => Promise<void>
}

// Extended HTMLDivElement with map instance reference
interface MapContainerElement extends HTMLDivElement {
  __mapInstance?: ExtendedMap
}

export function DistanceMap({ baseLocation, stops, routeGeometry, maxDistanceFromBase }: DistanceMapProps) {
  // Get final destination from last stop
  const destination = stops[stops.length - 1]?.location || baseLocation
  const mapContainer = useRef<MapContainerElement>(null)
  const map = useRef<ExtendedMap | null>(null)
  const markersRef = useRef<mapboxgl.Marker[]>([])
  const originalBoundsRef = useRef<mapboxgl.LngLatBounds | null>(null)
  const originalCenterRef = useRef<[number, number] | null>(null)
  const originalZoomRef = useRef<number | null>(null)
  const [show100kmRadius, setShow100kmRadius] = useState(true)

  useEffect(() => {
    const mapboxToken = process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN

    if (!mapboxToken || !mapContainer.current) {
      return
    }

    // Initialize map if it doesn't exist
    if (!map.current) {
      map.current = new mapboxgl.Map({
        container: mapContainer.current,
        accessToken: mapboxToken,
        style: "mapbox://styles/mapbox/streets-v12",
        center: [
          (baseLocation.lng + destination.lng) / 2,
          (baseLocation.lat + destination.lat) / 2,
        ],
        zoom: 6,
        preserveDrawingBuffer: true, // Required for canvas capture
      })

      // Store map instance on container for PDF capture access
      if (mapContainer.current) {
        mapContainer.current.__mapInstance = map.current
      }

      // Add navigation controls
      map.current.addControl(new mapboxgl.NavigationControl(), "top-right")
    }

    // Wait for map to load
    const handleMapLoad = () => {
      if (!map.current) return

      // Remove existing markers
      markersRef.current.forEach((marker) => marker.remove())
      markersRef.current = []

      // Remove existing layers and sources if they exist
      const layersToRemove = ["route", "straight-line", "max-distance-line", "radius-100km-fill", "radius-100km-outline"]
      const sourcesToRemove = ["route", "straight-line", "max-distance-line", "radius-100km"]
      
      layersToRemove.forEach(layer => {
        if (map.current?.getLayer(layer)) {
          map.current.removeLayer(layer)
        }
      })
      
      sourcesToRemove.forEach(source => {
        if (map.current?.getSource(source)) {
          map.current.removeSource(source)
        }
      })

      // Add base marker
      const baseMarker = new mapboxgl.Marker({ color: "#3b82f6" })
        .setLngLat([baseLocation.lng, baseLocation.lat])
        .setPopup(new mapboxgl.Popup().setText(`Base: ${baseLocation.placeName}`))
        .addTo(map.current)

      const markers = [baseMarker]

      // Add markers for each stop
      stops.forEach((stop, index) => {
        if (stop.location && map.current) {
          const isLastStop = index === stops.length - 1
          const marker = new mapboxgl.Marker({ color: isLastStop ? "#ef4444" : "#f59e0b" })
            .setLngLat([stop.location.lng, stop.location.lat])
            .setPopup(new mapboxgl.Popup().setText(
              `${isLastStop ? "Final Destination" : `Stop ${index + 1}`}: ${stop.location.placeName}`
            ))
            .addTo(map.current)
          markers.push(marker)
        }
      })

      markersRef.current = markers

          // Add 100km radius circle around base if enabled
          if (show100kmRadius) {
            // Create circle using Turf.js-style circle calculation
            const createGeoJSONCircle = (center: [number, number], radiusInKm: number, points = 64) => {
              const coords = {
                latitude: center[1],
                longitude: center[0],
              }

              const km = radiusInKm

              const ret = []
              const distanceX = km / (111.32 * Math.cos((coords.latitude * Math.PI) / 180))
              const distanceY = km / 110.574

              for (let i = 0; i < points; i++) {
                const theta = (i / points) * (2 * Math.PI)
                const x = distanceX * Math.cos(theta)
                const y = distanceY * Math.sin(theta)

                ret.push([coords.longitude + x, coords.latitude + y])
              }
              ret.push(ret[0])

              return {
                type: "Feature" as const,
                geometry: {
                  type: "Polygon" as const,
                  coordinates: [ret],
                },
                properties: {},
              }
            }

            const circle = createGeoJSONCircle([baseLocation.lng, baseLocation.lat], 100)

            map.current.addSource("radius-100km", {
              type: "geojson",
              data: circle,
            })

            // Add fill layer
            map.current.addLayer({
              id: "radius-100km-fill",
              type: "fill",
              source: "radius-100km",
              paint: {
                "fill-color": "#3b82f6",
                "fill-opacity": 0.1,
              },
            })

            // Add outline layer
            map.current.addLayer({
              id: "radius-100km-outline",
              type: "line",
              source: "radius-100km",
              paint: {
                "line-color": "#3b82f6",
                "line-width": 2,
                "line-dasharray": [3, 3],
                "line-opacity": 0.5,
              },
            })
          }

          // Always show straight line (as the crow flies) for reference
          map.current.addSource("straight-line", {
            type: "geojson",
            data: {
              type: "Feature",
              properties: {},
              geometry: {
                type: "LineString",
                coordinates: [
                  [baseLocation.lng, baseLocation.lat],
                  [destination.lng, destination.lat],
                ],
              },
            },
          })

          map.current.addLayer({
            id: "straight-line",
            type: "line",
            source: "straight-line",
            layout: {
              "line-join": "round",
              "line-cap": "round",
            },
            paint: {
              "line-color": "#a855f7",
              "line-width": 3,
              "line-dasharray": [4, 4],
              "line-opacity": 0.8,
            },
          })

          // Show actual driving route if available
          if (routeGeometry && routeGeometry.coordinates) {
            map.current.addSource("route", {
              type: "geojson",
              data: {
                type: "Feature",
                properties: {},
                geometry: routeGeometry,
              },
            })

            map.current.addLayer({
              id: "route",
              type: "line",
              source: "route",
              layout: {
                "line-join": "round",
                "line-cap": "round",
              },
              paint: {
                "line-color": "#3b82f6",
                "line-width": 4,
              },
            })

            // Find and mark the point of maximum distance from base
            if (maxDistanceFromBase && maxDistanceFromBase > 0) {
              const coordinates = routeGeometry.coordinates
              const sampleRate = Math.max(1, Math.floor(coordinates.length / 20))
              
              let maxDist = 0
              let maxDistPoint: [number, number] = [baseLocation.lng, baseLocation.lat]
              
              // Calculate distance from base using Haversine formula
              const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
                const R = 6371
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
              
              for (let i = 0; i < coordinates.length; i += sampleRate) {
                const [lng, lat] = coordinates[i]
                const dist = calculateDistance(baseLocation.lat, baseLocation.lng, lat, lng)
                if (dist > maxDist) {
                  maxDist = dist
                  maxDistPoint = [lng, lat]
                }
              }
              
              // Check final point
              const [finalLng, finalLat] = coordinates[coordinates.length - 1]
              const finalDist = calculateDistance(baseLocation.lat, baseLocation.lng, finalLat, finalLng)
              if (finalDist > maxDist) {
                maxDist = finalDist
                maxDistPoint = [finalLng, finalLat]
              }
              
              // Add marker at max distance point
              const maxDistMarker = new mapboxgl.Marker({ 
                color: maxDistanceFromBase > 100 ? "#ef4444" : "#f59e0b"
              })
                .setLngLat(maxDistPoint)
                .setPopup(
                  new mapboxgl.Popup().setHTML(
                    `<div style="padding: 4px;">
                      <strong>Max Distance from Base</strong><br/>
                      ${maxDistanceFromBase.toFixed(1)} km
                    </div>`
                  )
                )
                .addTo(map.current)
              
              markersRef.current.push(maxDistMarker)
              
              // Draw line from base to max distance point
              map.current.addSource("max-distance-line", {
                type: "geojson",
                data: {
                  type: "Feature",
                  properties: {},
                  geometry: {
                    type: "LineString",
                    coordinates: [
                      [baseLocation.lng, baseLocation.lat],
                      maxDistPoint,
                    ],
                  },
                },
              })

              map.current.addLayer({
                id: "max-distance-line",
                type: "line",
                source: "max-distance-line",
                layout: {
                  "line-join": "round",
                  "line-cap": "round",
                },
                paint: {
                  "line-color": maxDistanceFromBase > 100 ? "#ef4444" : "#f59e0b",
                  "line-width": 2,
                  "line-dasharray": [2, 2],
                  "line-opacity": 0.7,
                },
              })
            }
          }

      // Fit map to show all markers
      const bounds = new mapboxgl.LngLatBounds()
      bounds.extend([baseLocation.lng, baseLocation.lat])
      stops.forEach(stop => {
        if (stop.location) {
          bounds.extend([stop.location.lng, stop.location.lat])
        }
      })
      
      // Store original bounds for PDF capture
      originalBoundsRef.current = bounds
      
      // Fit bounds and then save the actual center and zoom after it completes
      map.current.fitBounds(bounds, {
        padding: { top: 50, bottom: 50, left: 50, right: 50 },
        maxZoom: 10,
      })
      
      // Save the actual center and zoom after fitBounds completes
      const onInitialMoveEnd = () => {
        if (map.current) {
          const center = map.current.getCenter()
          const zoom = map.current.getZoom()
          originalCenterRef.current = [center.lng, center.lat]
          originalZoomRef.current = zoom
          
          if (process.env.NODE_ENV === 'development') {
            console.log('Original map position saved:', {
              center: originalCenterRef.current,
              zoom: originalZoomRef.current,
            })
          }
          
          map.current.off('moveend', onInitialMoveEnd)
        }
      }
      
      map.current.once('moveend', onInitialMoveEnd)
    }

    if (map.current.loaded()) {
      handleMapLoad()
    } else {
      map.current.once("load", handleMapLoad)
    }

    // Cleanup
    return () => {
      markersRef.current.forEach((marker) => marker.remove())
      markersRef.current = []
    }
  }, [baseLocation, stops, routeGeometry, maxDistanceFromBase, show100kmRadius])

  // Final cleanup on unmount
  useEffect(() => {
    return () => {
      if (map.current) {
        map.current.remove()
        map.current = null
      }
    }
  }, [])

  // Expose method to reset map to original position (for PDF capture)
  useEffect(() => {
    if (map.current) {
      // Store method on map instance for external access
      map.current.resetToOriginalBounds = () => {
        return new Promise<void>((resolve) => {
          if (map.current) {
            // Prefer using saved center/zoom if available (more accurate)
            if (originalCenterRef.current && originalZoomRef.current !== null) {
              if (process.env.NODE_ENV === 'development') {
                console.log('Resetting map to original center/zoom:', {
                  center: originalCenterRef.current,
                  zoom: originalZoomRef.current,
                })
              }
              
              let resolved = false
              
              // Set up listeners for both moveend and render events to ensure map has updated
              const onMoveEnd = () => {
                if (resolved) return
                if (map.current) {
                  map.current.off('moveend', onMoveEnd)
                  map.current.off('render', onRender)
                }
                resolved = true
                // Additional delay to ensure tiles are loaded and map is fully rendered
                setTimeout(() => {
                  if (process.env.NODE_ENV === 'development') {
                    console.log('Map reset complete (moveend), ready for capture')
                  }
                  resolve()
                }, 500)
              }
              
              const onRender = () => {
                if (resolved) return
                if (map.current) {
                  map.current.off('moveend', onMoveEnd)
                  map.current.off('render', onRender)
                }
                resolved = true
                // Wait a bit longer after render to ensure everything is stable
                setTimeout(() => {
                  if (process.env.NODE_ENV === 'development') {
                    console.log('Map reset complete (render), ready for capture')
                  }
                  resolve()
                }, 600)
              }
              
              // Listen for both events
              map.current.once('moveend', onMoveEnd)
              map.current.once('render', onRender)
              
              // Use jumpTo for instant, reliable reset
              map.current.jumpTo({
                center: originalCenterRef.current,
                zoom: originalZoomRef.current,
              })
              
              // Fallback timeout in case events don't fire
              setTimeout(() => {
                if (!resolved) {
                  if (map.current) {
                    map.current.off('moveend', onMoveEnd)
                    map.current.off('render', onRender)
                  }
                  resolved = true
                  if (process.env.NODE_ENV === 'development') {
                    console.log('Map reset complete (timeout fallback), ready for capture')
                  }
                  resolve()
                }
              }, 2000)
            } else if (originalBoundsRef.current) {
              // Fallback to bounds if center/zoom not saved yet
              if (process.env.NODE_ENV === 'development') {
                console.log('Resetting map to original bounds (fallback):', originalBoundsRef.current)
              }
              
              let resolved = false
              
              const onMoveEnd = () => {
                if (resolved) return
                if (map.current) {
                  map.current.off('moveend', onMoveEnd)
                  map.current.off('render', onRender)
                }
                resolved = true
                setTimeout(() => {
                  if (process.env.NODE_ENV === 'development') {
                    console.log('Map reset complete (bounds fallback), ready for capture')
                  }
                  resolve()
                }, 500)
              }
              
              const onRender = () => {
                if (resolved) return
                if (map.current) {
                  map.current.off('moveend', onMoveEnd)
                  map.current.off('render', onRender)
                }
                resolved = true
                setTimeout(() => {
                  if (process.env.NODE_ENV === 'development') {
                    console.log('Map reset complete (bounds render), ready for capture')
                  }
                  resolve()
                }, 600)
              }
              
              map.current.once('moveend', onMoveEnd)
              map.current.once('render', onRender)
              
              map.current.fitBounds(originalBoundsRef.current, {
                padding: { top: 50, bottom: 50, left: 50, right: 50 },
                maxZoom: 10,
                duration: 0,
                animate: false,
              })
              
              setTimeout(() => {
                if (!resolved) {
                  if (map.current) {
                    map.current.off('moveend', onMoveEnd)
                    map.current.off('render', onRender)
                  }
                  resolved = true
                  if (process.env.NODE_ENV === 'development') {
                    console.log('Map reset complete (bounds timeout fallback), ready for capture')
                  }
                  resolve()
                }
              }, 2000)
            } else {
              if (process.env.NODE_ENV === 'development') {
                console.warn('No original position saved, cannot reset map')
              }
              resolve()
            }
          } else {
            resolve()
          }
        })
      }
      
      // Also update the container reference whenever the map instance changes
      // This ensures the map instance is always available for external access
      if (mapContainer.current && map.current) {
        mapContainer.current.__mapInstance = map.current
        if (process.env.NODE_ENV === 'development') {
          console.log('Map instance stored on container, reset method available:', !!map.current.resetToOriginalBounds)
        }
      }
    }
  }, [baseLocation, stops, routeGeometry, maxDistanceFromBase])

  return (
    <div className="w-full">
      <div ref={mapContainer} className="w-full h-[300px] sm:h-[400px] lg:h-[450px] rounded-t-lg" data-map-container />
      <div className="bg-muted/30 border-t border-border/50 p-4 rounded-b-lg">
        <div className="flex flex-col gap-4">
          {/* Legend Items */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="flex items-center gap-2.5">
              <div className="w-10 h-1 bg-blue-500 rounded-sm shrink-0"></div>
              <span className="text-xs font-medium">Driving route</span>
            </div>
            <div className="flex items-center gap-2.5">
              <div className="w-10 h-1 bg-purple-500 rounded-sm shrink-0" style={{ backgroundImage: 'repeating-linear-gradient(to right, #a855f7 0, #a855f7 3px, transparent 3px, transparent 6px)' }}></div>
              <span className="text-xs font-medium">Straight line (to destination)</span>
            </div>
            {maxDistanceFromBase && maxDistanceFromBase > 0 && (
              <>
                <div className="flex items-center gap-2.5">
                  <div className={`w-10 h-1 rounded-sm shrink-0 ${maxDistanceFromBase > 100 ? 'bg-red-500' : 'bg-amber-500'}`} style={{ backgroundImage: `repeating-linear-gradient(to right, ${maxDistanceFromBase > 100 ? '#ef4444' : '#f59e0b'} 0, ${maxDistanceFromBase > 100 ? '#ef4444' : '#f59e0b'} 2px, transparent 2px, transparent 4px)` }}></div>
                  <span className="text-xs font-medium">Max distance from base</span>
                </div>
                <div className="flex items-center gap-2.5">
                  <div className={`w-3 h-3 rounded-full shrink-0 ${maxDistanceFromBase > 100 ? 'bg-red-500' : 'bg-amber-500'}`}></div>
                  <span className="text-xs text-muted-foreground">Furthest point ({maxDistanceFromBase.toFixed(1)} km)</span>
                </div>
              </>
            )}
            <div className={`flex items-center gap-2.5 ${show100kmRadius ? '' : 'invisible'}`}>
              <div className="w-10 h-3 bg-blue-500/10 border border-blue-500 border-dashed rounded-sm shrink-0"></div>
              <span className="text-xs font-medium">100 km radius</span>
            </div>
          </div>
          
          {/* Toggle Switch */}
          <div className="flex items-center gap-3 pt-2 border-t border-border/30">
            <Switch
              id="show-100km-radius"
              checked={show100kmRadius}
              onCheckedChange={setShow100kmRadius}
            />
            <Label
              htmlFor="show-100km-radius"
              className="text-sm font-medium cursor-pointer"
            >
              Show 100 km radius
            </Label>
          </div>
        </div>
      </div>
    </div>
  )
}

