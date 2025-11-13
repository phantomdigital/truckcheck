"use client"

import { useState, useEffect, useRef } from "react"
import { useSearchParams } from "next/navigation"
import { captureEvent } from "@/lib/posthog/utils"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Loader2, Route } from "lucide-react"
import { LocationInput } from "@/components/logbook/location-input"
import { StopsInput } from "@/components/logbook/stops-input"
import { ResultDisplay } from "@/components/logbook/result-display"
import { ResultSkeleton } from "@/components/logbook/result-skeleton"
import { CSVImportModal } from "@/components/logbook/csv-import-modal"
import { RecentSearchesPro, type RecentSearchesProRef } from "@/components/recent-searches-pro"
import { ResponsiveAd } from "@/components/ezoic"
import { ProUpgradeBanner } from "@/components/pro-upgrade-banner"
import { useRecentSearches } from "@/lib/recent-searches-context"
import type { RecentSearch } from "@/lib/recent-searches-context"
import type { GeocodeResult, Stop, CalculationResult } from "@/lib/logbook/types"
import { calculateDistance, geocodeAddress, calculateDrivingDistance } from "@/lib/logbook/utils"
import { useURLUpdater, useShare } from "@/lib/logbook/hooks"
import { toast } from "sonner"
import { saveCalculationToHistory, validateMultipleStops } from "@/lib/stripe/actions"
import { saveRecentSearch } from "@/lib/recent-searches/actions"
import type { Depot } from "@/lib/depot/actions"

interface LogbookCheckerProps {
  isPro?: boolean
}

export default function LogbookChecker({ isPro = false }: LogbookCheckerProps) {
  const searchParams = useSearchParams()
  const recentSearchesRef = useRef<RecentSearchesProRef>(null)
  const [baseAddress, setBaseAddress] = useState("")
  const [baseLocation, setBaseLocation] = useState<GeocodeResult | null>(null)
  const [stops, setStops] = useState<Stop[]>([
    { id: "stop-1", address: "", location: null }
  ])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [result, setResult] = useState<CalculationResult | null>(null)
  const [isInitialized, setIsInitialized] = useState(false)
  const { updateURL} = useURLUpdater()
  const { handleShare: shareURL } = useShare()

  // Stop management functions
  const addStop = async () => {
    // SECURITY: Server-side validation before allowing multiple stops
    const validation = await validateMultipleStops()
    if (!validation.success) {
      toast.error(validation.error || 'Pro subscription required to add multiple stops')
      return
    }
    
    const newStop: Stop = {
      id: `stop-${Date.now()}`,
      address: "",
      location: null
    }
    setStops([...stops, newStop])
  }

  const removeStop = (id: string) => {
    setStops((currentStops) => {
      if (currentStops.length > 1) {
        return currentStops.filter(stop => stop.id !== id)
      }
      return currentStops
    })
  }

  const updateStopAddress = (id: string, address: string) => {
    setStops((currentStops) => 
      currentStops.map(stop => 
        stop.id === id ? { ...stop, address } : stop
      )
    )
  }

  const updateStopLocation = (id: string, location: GeocodeResult | null) => {
    setStops((currentStops) => 
      currentStops.map(stop => 
        stop.id === id ? { ...stop, location } : stop
      )
    )
  }

  const reorderStops = (startIndex: number, endIndex: number) => {
    setStops((currentStops) => {
      const newStops = Array.from(currentStops)
      const [removed] = newStops.splice(startIndex, 1)
      newStops.splice(endIndex, 0, removed)
      return newStops
    })
  }

  // Share handler with toast feedback
  const handleShare = async () => {
    const success = await shareURL()
    if (success) {
      toast.success("Link copied to clipboard!", {
        description: "Share this link to save your search results.",
      })
    } else {
      toast.error("Failed to copy link", {
        description: "Please try again or copy the URL manually.",
      })
    }
  }

  // Load search from URL parameters
  useEffect(() => {
    if (isInitialized) return

    const loadFromURL = async () => {
      const baseName = searchParams.get("baseName")
      const baseLat = searchParams.get("baseLat")
      const baseLng = searchParams.get("baseLng")
      const distance = searchParams.get("distance")
      const logbookRequired = searchParams.get("logbookRequired")

      if (baseName && baseLat && baseLng && distance) {
        const baseLoc: GeocodeResult = {
          placeName: baseName,
          lat: parseFloat(baseLat),
          lng: parseFloat(baseLng),
        }

        setBaseAddress(baseName)
        setBaseLocation(baseLoc)
        
        // Parse all stops from URL (stop0, stop1, stop2, etc.)
        const convertedStops: Stop[] = []
        let stopIndex = 0
        
        while (true) {
          const stopName = searchParams.get(`stop${stopIndex}Name`)
          const stopLat = searchParams.get(`stop${stopIndex}Lat`)
          const stopLng = searchParams.get(`stop${stopIndex}Lng`)
          
          if (!stopName || !stopLat || !stopLng) break
          
          convertedStops.push({
            id: `stop-${Date.now()}-${stopIndex}`,
            address: stopName,
            location: {
              placeName: stopName,
              lat: parseFloat(stopLat),
              lng: parseFloat(stopLng),
            }
          })
          
          stopIndex++
        }
        
        // SECURITY: If URL has multiple stops but user is not Pro, show toast notification
        if (convertedStops.length > 1 && !isPro) {
          toast.info("Pro Feature Preview", {
            description: "This shared link contains multiple stops (Pro feature). You can view the route but need Pro to recalculate or edit it.",
            duration: 8000, // Show longer since it's important info
          })
        }
        
        // Ensure at least one stop
        if (convertedStops.length === 0) {
          convertedStops.push({
            id: "stop-1",
            address: "",
            location: null
          })
        }
        
        setStops(convertedStops)

        // Calculate driving distance for URL-loaded results
        // Wrap in try-catch to prevent hanging if API call fails
        try {
          const stopCoordinates = convertedStops
            .filter(s => s.location)
            .map(s => ({ lat: s.location!.lat, lng: s.location!.lng }))
            
          const routeData = await calculateDrivingDistance(
            baseLoc.lat,
            baseLoc.lng,
            stopCoordinates
          )

          const result: CalculationResult = {
            distance: parseFloat(distance),
            drivingDistance: routeData?.distance || null,
            maxDistanceFromBase: routeData?.maxDistanceFromBase || null,
            logbookRequired: logbookRequired === "true",
            baseLocation: baseLoc,
            stops: convertedStops,
            routeGeometry: routeData?.routeGeometry || null,
          }
          setResult(result)
        } catch (error) {
          // If route calculation fails, still show the result with straight-line distance
          console.error("Failed to calculate route for URL-loaded result:", error)
          const result: CalculationResult = {
            distance: parseFloat(distance),
            drivingDistance: null,
            maxDistanceFromBase: null,
            logbookRequired: logbookRequired === "true",
            baseLocation: baseLoc,
            stops: convertedStops,
            routeGeometry: null,
          }
          setResult(result)
        }
      }
    }

    loadFromURL()
    setIsInitialized(true)
  }, [searchParams, isInitialized, isPro])

  const handleCalculate = async () => {
    // Prevent concurrent executions - extra safety guard
    if (loading) {
      console.warn("Calculate already in progress, ignoring duplicate call")
      return
    }

    // SECURITY: Validate stops count for Pro feature
    if (stops.length > 1 && !isPro) {
      toast.error("Pro Subscription Required", {
        description: "Multiple stops require a Pro subscription. Please upgrade or use a single destination.",
        action: {
          label: "Upgrade",
          onClick: () => window.open("/pricing", "_blank"),
        },
      })
      return
    }

    console.log("Starting calculation with stops:", stops.map(s => ({ address: s.address, hasLocation: !!s.location })))
    setLoading(true)
    setError(null)
    setResult(null)

    // Extra safety: Timeout fallback to ensure loading state is reset (90 seconds max)
    // This is a failsafe in case something unexpected happens
    const timeoutFallback = setTimeout(() => {
      console.warn("Calculation timeout fallback triggered - resetting loading state")
      setLoading(false)
      setError("Calculation took too long. Please try again.")
    }, 90000) // 90 seconds - longer than route calculation timeout

    try {
      // Validate and geocode base location
      let finalBaseLocation: GeocodeResult
      if (baseLocation && baseLocation.placeName === baseAddress) {
        finalBaseLocation = baseLocation
      } else if (!baseAddress.trim()) {
        const errorMsg = "Please enter a base location"
        setError(errorMsg)
        toast.error("Validation Error", {
          description: errorMsg,
        })
        clearTimeout(timeoutFallback)
        setLoading(false)
        return
      } else {
        try {
          finalBaseLocation = await geocodeAddress(baseAddress)
          setBaseLocation(finalBaseLocation)
        } catch (err) {
          const errorMsg = err instanceof Error ? err.message : "Could not geocode base location"
          setError(errorMsg)
          toast.error("Geocoding Error", {
            description: errorMsg,
          })
          clearTimeout(timeoutFallback)
          setLoading(false)
          return
        }
      }

      // Validate and geocode all stops
      const finalStops: Stop[] = []
      for (let i = 0; i < stops.length; i++) {
        const stop = stops[i]
        
        // Check if stop has valid location with non-zero coordinates
        const hasValidLocation = stop.location && 
          stop.location.lat !== 0 && 
          stop.location.lng !== 0 &&
          !isNaN(stop.location.lat) &&
          !isNaN(stop.location.lng) &&
          stop.location.placeName.trim() === stop.address.trim()
        
        console.log(`Stop ${i + 1} validation:`, { 
          address: stop.address, 
          hasValidLocation, 
          placeName: stop.location?.placeName,
          addressMatch: stop.location?.placeName?.trim() === stop.address.trim()
        })
        
        if (hasValidLocation) {
          console.log(`Using existing location for stop ${i + 1}`)
          finalStops.push(stop)
        } else if (!stop.address.trim()) {
          console.error(`Stop ${i + 1} has empty address`)
          const errorMsg = `Please enter an address for stop ${i + 1}`
          setError(errorMsg)
          toast.error("Validation Error", {
            description: errorMsg,
          })
          clearTimeout(timeoutFallback)
          setLoading(false)
          return
        } else {
          console.log(`Geocoding stop ${i + 1}: ${stop.address}`)
          try {
            const location = await geocodeAddress(stop.address)
            console.log(`Successfully geocoded stop ${i + 1}:`, location)
            finalStops.push({ ...stop, location })
            // Update the stop with the geocoded location
            updateStopLocation(stop.id, location)
          } catch (err) {
            console.error(`Failed to geocode stop ${i + 1}:`, err)
            const errorMsg = err instanceof Error ? err.message : `Could not geocode stop ${i + 1}`
            setError(errorMsg)
            toast.error("Geocoding Error", {
              description: errorMsg,
            })
            clearTimeout(timeoutFallback)
            setLoading(false)
            return
          }
        }
      }

      // Get final destination (last stop)
      const finalDestination = finalStops[finalStops.length - 1].location!

      // Calculate straight-line distance to final destination
      let distance = calculateDistance(
        finalBaseLocation.lat,
        finalBaseLocation.lng,
        finalDestination.lat,
        finalDestination.lng
      )

      // Calculate actual driving route distance with all waypoints
      const waypoints = finalStops.map(stop => ({ lat: stop.location!.lat, lng: stop.location!.lng }))
      console.log("Calculating driving distance with waypoints:", waypoints)
      const routeData = await calculateDrivingDistance(
        finalBaseLocation.lat,
        finalBaseLocation.lng,
        waypoints
      )
      console.log("Driving distance calculated:", routeData)

      // Determine if logbook is required
      const maxDistanceFromBase = routeData?.maxDistanceFromBase || distance
      const logbookRequired = maxDistanceFromBase > 100
      
      // For round trips (base = destination), show the furthest point distance instead of 0
      const isRoundTrip = distance < 1 // Less than 1km means essentially same location
      if (isRoundTrip && maxDistanceFromBase > 0) {
        distance = maxDistanceFromBase
      }

      const calculationResult: CalculationResult = {
        distance,
        drivingDistance: routeData?.distance || null,
        maxDistanceFromBase: routeData?.maxDistanceFromBase || null,
        logbookRequired,
        baseLocation: finalBaseLocation,
        stops: finalStops,
        routeGeometry: routeData?.routeGeometry || null,
      }

      setResult(calculationResult)

      // Track calculation event
      captureEvent("calculation_performed", {
        is_pro: isPro,
        stop_count: finalStops.length,
        logbook_required: logbookRequired,
        distance_km: Math.round(distance),
        driving_distance_km: routeData?.distance ? Math.round(routeData.distance) : null,
        has_multiple_stops: finalStops.length > 1,
      })

      // Save to history if Pro user (via Server Action)
      if (isPro) {
        try {
          const result = await saveCalculationToHistory({
            baseLocation: finalBaseLocation,
            stops: finalStops.map(s => ({
              address: s.address,
              location: s.location,
            })),
            destination: finalDestination,
            distance,
            maxDistanceFromBase: calculationResult.maxDistanceFromBase,
            drivingDistance: calculationResult.drivingDistance,
            logbookRequired,
            routeGeometry: calculationResult.routeGeometry,
          })
          
          if (!result.success) {
            throw new Error(result.error || "Failed to save calculation history")
          }
        } catch (error) {
          // Silently fail - history saving shouldn't block the UI
          console.error("Failed to save calculation history:", error)
        }
      }

      // Update URL with search parameters (includes all stops)
      updateURL(finalBaseLocation, finalStops, distance, logbookRequired)

      // Save to recent searches (Pro users only)
      if (isPro) {
        try {
          await saveRecentSearch({
            baseLocation: finalBaseLocation,
            stops: finalStops.map(stop => stop.location).filter((loc): loc is NonNullable<typeof loc> => loc !== null),
            distance,
            logbookRequired,
          })
          // Refresh recent searches list after saving
          recentSearchesRef.current?.refresh()
        } catch (error) {
          // Silently fail - recent search saving shouldn't block the UI
          console.error("Failed to save recent search:", error)
        }
      }
    } catch (err) {
      console.error("Error in handleCalculate:", err)
      setError(err instanceof Error ? err.message : "An error occurred while calculating the distance")
    } finally {
      console.log("Calculation complete, clearing loading state")
      clearTimeout(timeoutFallback)
      setLoading(false)
    }
  }

  // Depot handlers - one for base, one for stops
  const handleSelectDepotForBase = (depot: Depot) => {
    setBaseAddress(depot.address)
    setBaseLocation({
      lat: depot.lat,
      lng: depot.lng,
      placeName: depot.address,
    })
    toast.success('Depot applied to base location')
  }

  const handleSelectDepotForStop = (stopId: string, depot: Depot) => {
    // Atomic update to prevent race conditions
    setStops((currentStops) => 
      currentStops.map(stop => 
        stop.id === stopId 
          ? {
              ...stop,
              address: depot.address,
              location: {
                lat: depot.lat,
                lng: depot.lng,
                placeName: depot.address,
              }
            }
          : stop
      )
    )
    toast.success('Depot applied to stop')
  }

  const handleRecentSearchSelect = async (search: RecentSearch) => {
    // Populate fields from recent search
    setBaseAddress(search.baseLocation.placeName)
    setBaseLocation(search.baseLocation)
    
    // Convert stops array (support legacy destination format)
    const stopsArray = search.stops || (search.destination ? [search.destination] : [])
    
    // Validate that all stops have valid coordinates
    const hasValidCoordinates = stopsArray.every((stop: any) => 
      typeof stop.lat === 'number' && 
      typeof stop.lng === 'number' && 
      !isNaN(stop.lat) && 
      !isNaN(stop.lng)
    )
    
    if (!hasValidCoordinates) {
      console.error('Recent search has invalid coordinates:', search)
      toast.error('This recent search has invalid location data')
      return
    }
    
    const convertedStops: Stop[] = stopsArray.map((stop: any, index) => ({
      id: `stop-${Date.now()}-${index}`,
      address: stop.placeName || stop.address || '',
      location: {
        placeName: stop.placeName || stop.address || '',
        lat: stop.lat,
        lng: stop.lng,
      }
    }))
    setStops(convertedStops)
    
    // Calculate driving distance for recent search
    const waypoints = stopsArray.map(stop => ({ lat: stop.lat, lng: stop.lng }))
    const routeData = await calculateDrivingDistance(
      search.baseLocation.lat,
      search.baseLocation.lng,
      waypoints
    )
    
    // Recalculate logbook requirement based on max distance from base along route
    const maxDistanceFromBase = routeData?.maxDistanceFromBase || search.distance
    const logbookRequired = maxDistanceFromBase > 100
    
    // Set result immediately
    const result: CalculationResult = {
      distance: search.distance,
      drivingDistance: routeData?.distance || null,
      maxDistanceFromBase: routeData?.maxDistanceFromBase || null,
      logbookRequired,
      baseLocation: search.baseLocation,
      stops: convertedStops,
      routeGeometry: routeData?.routeGeometry || null,
    }
    setResult(result)
    
    // Update URL with search parameters (includes all stops from recent search)
    updateURL(search.baseLocation, convertedStops, search.distance, search.logbookRequired)
  }

  const handleCSVImport = (baseLocation: GeocodeResult, importedStops: Stop[]) => {
    setBaseAddress(baseLocation.placeName)
    setBaseLocation(baseLocation)
    setStops(importedStops)
  }

  return (
    <div className="w-full">
      {/* Main Content */}
      <div className="w-full max-w-[100rem] mx-auto px-4 lg:px-8 py-6">
        <div className="max-w-6xl mx-auto space-y-4 sm:space-y-6">

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
          <div className="lg:col-span-2 space-y-4 sm:space-y-6">
            <Card>
              <CardHeader className="pb-4">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-xl font-semibold tracking-tight">Enter Locations</CardTitle>
                  <CSVImportModal onImport={handleCSVImport} disabled={loading} isPro={isPro} />
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Base Location Section */}
                <LocationInput
                  id="base"
                  label="Base Location"
                  value={baseAddress}
                  onChange={setBaseAddress}
                  onSelect={setBaseLocation}
                  placeholder="e.g., Sydney, NSW or enter an address"
                  location={baseLocation}
                  isPro={isPro}
                  showDepotSelector={true}
                  onSelectDepot={handleSelectDepotForBase}
                />

                {/* Divider */}
                <div className="border-t border-border/50"></div>

                {/* Stops Section */}
                <StopsInput
                  stops={stops}
                  onAddStop={addStop}
                  onRemoveStop={removeStop}
                  onUpdateStopAddress={updateStopAddress}
                  onUpdateStopLocation={updateStopLocation}
                  onReorder={reorderStops}
                  isPro={isPro}
                  onSelectDepot={handleSelectDepotForStop}
                />

                {/* Calculate Button */}
                <div className="pt-2">
                  <Button
                    onClick={handleCalculate}
                    disabled={loading || !baseAddress?.trim() || stops.some(s => !s.address?.trim())}
                    className="w-full"
                    size="lg"
                  >
                    {loading ? (
                      <>
                        <Loader2 className="h-5 w-5 animate-spin" />
                        Calculating...
                      </>
                    ) : (
                      <>
                        <Route className="h-5 w-5" />
                        Calculate Distance
                      </>
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>

            {error && (
              <Alert variant="destructive">
                <AlertTitle>Error</AlertTitle>
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {loading && !result && (
              <ResultSkeleton />
            )}

                  {result && (
                      <ResultDisplay
                        result={result}
                        onShare={handleShare}
                        isPro={isPro}
                      />
            )}
          </div>

                <div className="lg:col-span-1 space-y-4 sm:space-y-6">
                  {/* Recent Searches - Pro feature only */}
                  {isPro && <RecentSearchesPro ref={recentSearchesRef} onSelect={handleRecentSearchSelect} />}
                  
                  {/* Pro Upgrade Banner and Ad - show for free users in sidebar, sticky on desktop */}
                  {!isPro && (
                    <div className="lg:sticky lg:top-20 lg:z-10 space-y-4 sm:space-y-6">
                      <ProUpgradeBanner variant="compact" />
                  {/* Ad placement in sidebar - only show for free users
                      SECURITY: isPro is validated server-side in page.tsx via getSubscriptionStatus()
                      User cannot bypass this check - it comes from database query in Server Component */}
                      <ResponsiveAd placementId={103} />
                    </div>
                  )}
                </div>
        </div>
        </div>
      </div>
    </div>
  )
}
