"use client"

import { useState, useEffect } from "react"
import { useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Loader2, Route } from "lucide-react"
import { LocationInput } from "@/components/logbook/location-input"
import { StopsInput } from "@/components/logbook/stops-input"
import { ResultDisplay } from "@/components/logbook/result-display"
import { ResultSkeleton } from "@/components/logbook/result-skeleton"
import { CSVImportModal } from "@/components/logbook/csv-import-modal"
import { RecentSearches } from "@/components/recent-searches"
import { ResponsiveAd } from "@/components/adsense"
import { useRecentSearches } from "@/lib/recent-searches-context"
import type { RecentSearch } from "@/lib/recent-searches-context"
import type { GeocodeResult, Stop, CalculationResult } from "@/lib/logbook/types"
import { calculateDistance, geocodeAddress, calculateDrivingDistance } from "@/lib/logbook/utils"
import { useURLUpdater, useShare } from "@/lib/logbook/hooks"
import { toast } from "sonner"

export default function LogbookChecker() {
  const searchParams = useSearchParams()
  const [baseAddress, setBaseAddress] = useState("")
  const [baseLocation, setBaseLocation] = useState<GeocodeResult | null>(null)
  const [stops, setStops] = useState<Stop[]>([
    { id: "stop-1", address: "", location: null }
  ])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [result, setResult] = useState<CalculationResult | null>(null)
  const [isInitialized, setIsInitialized] = useState(false)
  const { saveSearch } = useRecentSearches()
  const { updateURL } = useURLUpdater()
  const { handleShare: shareURL } = useShare()

  // Stop management functions
  const addStop = () => {
    const newStop: Stop = {
      id: `stop-${Date.now()}`,
      address: "",
      location: null
    }
    setStops((currentStops) => [...currentStops, newStop])
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

  const updateStopLocation = (id: string, location: GeocodeResult) => {
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
      const destName = searchParams.get("destName")
      const destLat = searchParams.get("destLat")
      const destLng = searchParams.get("destLng")
      const distance = searchParams.get("distance")
      const logbookRequired = searchParams.get("logbookRequired")

      if (baseName && baseLat && baseLng && destName && destLat && destLng && distance) {
        const baseLoc: GeocodeResult = {
          placeName: baseName,
          lat: parseFloat(baseLat),
          lng: parseFloat(baseLng),
        }
        const destLoc: GeocodeResult = {
          placeName: destName,
          lat: parseFloat(destLat),
          lng: parseFloat(destLng),
        }

        setBaseAddress(baseName)
        setBaseLocation(baseLoc)
        
        // Convert URL destination to stops format
        const convertedStops: Stop[] = [{
          id: "stop-1",
          address: destName,
          location: destLoc
        }]
        setStops(convertedStops)

        // Calculate driving distance for URL-loaded results
        const routeData = await calculateDrivingDistance(
          baseLoc.lat,
          baseLoc.lng,
          [{ lat: destLoc.lat, lng: destLoc.lng }]
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
      }
    }

    loadFromURL()
    setIsInitialized(true)
  }, [searchParams, isInitialized])

  const handleCalculate = async () => {
    setLoading(true)
    setError(null)
    setResult(null)

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
          setLoading(false)
          return
        }
      }

      // Validate and geocode all stops
      const finalStops: Stop[] = []
      for (let i = 0; i < stops.length; i++) {
        const stop = stops[i]
        
        if (stop.location && stop.location.placeName === stop.address) {
          finalStops.push(stop)
        } else if (!stop.address.trim()) {
          const errorMsg = `Please enter an address for stop ${i + 1}`
          setError(errorMsg)
          toast.error("Validation Error", {
            description: errorMsg,
          })
          setLoading(false)
          return
        } else {
          try {
            const location = await geocodeAddress(stop.address)
            finalStops.push({ ...stop, location })
            // Update the stop with the geocoded location
            updateStopLocation(stop.id, location)
          } catch (err) {
            const errorMsg = err instanceof Error ? err.message : `Could not geocode stop ${i + 1}`
            setError(errorMsg)
            toast.error("Geocoding Error", {
              description: errorMsg,
            })
            setLoading(false)
            return
          }
        }
      }

      // Get final destination (last stop)
      const finalDestination = finalStops[finalStops.length - 1].location!

      // Calculate straight-line distance to final destination
      const distance = calculateDistance(
        finalBaseLocation.lat,
        finalBaseLocation.lng,
        finalDestination.lat,
        finalDestination.lng
      )

      // Calculate actual driving route distance with all waypoints
      const waypoints = finalStops.map(stop => ({ lat: stop.location!.lat, lng: stop.location!.lng }))
      const routeData = await calculateDrivingDistance(
        finalBaseLocation.lat,
        finalBaseLocation.lng,
        waypoints
      )

      // Determine if logbook is required
      const maxDistanceFromBase = routeData?.maxDistanceFromBase || distance
      const logbookRequired = maxDistanceFromBase > 100

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

      // Update URL with search parameters (for now, just use first and last stop)
      updateURL(finalBaseLocation, finalDestination, distance, logbookRequired)

      // Save to recent searches (save all stops)
      saveSearch({
        baseLocation: finalBaseLocation,
        stops: finalStops.map(stop => ({
          placeName: stop.location!.placeName,
          lat: stop.location!.lat,
          lng: stop.location!.lng,
        })),
        distance,
        logbookRequired,
      })
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred while calculating the distance")
    } finally {
      setLoading(false)
    }
  }

  const handleRecentSearchSelect = async (search: RecentSearch) => {
    // Populate fields from recent search
    setBaseAddress(search.baseLocation.placeName)
    setBaseLocation(search.baseLocation)
    
    // Convert stops array (support legacy destination format)
    const stopsArray = search.stops || (search.destination ? [search.destination] : [])
    const convertedStops: Stop[] = stopsArray.map((stop, index) => ({
      id: `stop-${Date.now()}-${index}`,
      address: stop.placeName,
      location: stop
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
    
    // Update URL with search parameters (use final stop for URL)
    const finalStop = stopsArray[stopsArray.length - 1]
    if (finalStop) {
      updateURL(search.baseLocation, finalStop, search.distance, search.logbookRequired)
    }
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
                  <CSVImportModal onImport={handleCSVImport} disabled={loading} />
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
                />

                {/* Calculate Button */}
                <div className="pt-2">
                  <Button
                    onClick={handleCalculate}
                    disabled={loading || !baseAddress.trim() || stops.some(s => !s.address.trim())}
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
              <>
                <ResultDisplay
                  result={result}
                  onShare={handleShare}
                />
                
                {/* Ad placement after result */}
                <ResponsiveAd adSlot="YOUR_AD_SLOT_1" className="mt-6" />
              </>
            )}
          </div>

          <div className="lg:col-span-1 space-y-4 sm:space-y-6">
            <RecentSearches onSelect={handleRecentSearchSelect} />
            
            {/* Ad placement in sidebar */}
            <ResponsiveAd adSlot="YOUR_AD_SLOT_2" />
          </div>
        </div>
        </div>
      </div>
    </div>
  )
}
