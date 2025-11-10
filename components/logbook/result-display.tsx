"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { DistanceMap } from "@/components/distance-map"
import { Share2, Route, Navigation, BookCheck, BookX, CircleCheck, CircleX, AlertTriangle } from "lucide-react"
import { ExportResult } from "@/components/logbook/export-result"
import { ResponsiveAd } from "@/components/adsense"
import type { CalculationResult } from "@/lib/logbook/types"

interface ResultDisplayProps {
  result: CalculationResult
  onShare: () => void
  isPro?: boolean
}

export function ResultDisplay({ result, onShare, isPro = false }: ResultDisplayProps) {
  return (
    <Card>
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <CardTitle className="text-xl font-semibold tracking-tight">Result</CardTitle>
          <div className="flex gap-2">
            <ExportResult result={result} isPro={isPro} />
            <Button
              variant="outline"
              size="sm"
              onClick={onShare}
              className="gap-2"
            >
              <Share2 className="h-4 w-4" />
              Share
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4 sm:space-y-6">
        {/* Primary Information - Most Important */}
        <div className="space-y-4">
          {/* As the Crow Flies Distance */}
          <div className="text-center space-y-2 p-4 sm:p-6 border border-border/50 rounded-lg bg-muted/30">
            <div className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
              Destination Distance (as the crow flies)
            </div>
            <div className="text-3xl sm:text-4xl font-bold gradient-text">{result.distance.toFixed(1)} km</div>
            <div className="text-xs text-muted-foreground">
              Straight-line to final destination
            </div>
          </div>

          {/* Logbook Required - YES/NO */}
          <div className={`relative overflow-hidden rounded-lg border-2 p-4 sm:p-6 ${
            result.logbookRequired
              ? "border-red-500/50 bg-linear-to-br from-red-50 to-red-100/50 dark:from-red-950/30 dark:to-red-950/10"
              : "border-green-500/50 bg-linear-to-br from-green-50 to-green-100/50 dark:from-green-950/30 dark:to-green-950/10"
          }`}>
            <div className="flex items-start gap-4">
              {/* Icon */}
              <div className={`flex items-center justify-center w-16 h-16 rounded-full shrink-0 ${
                result.logbookRequired
                  ? "bg-red-100 dark:bg-red-900/30"
                  : "bg-green-100 dark:bg-green-900/30"
              }`}>
                {result.logbookRequired ? (
                  <BookX className="h-8 w-8 text-red-600 dark:text-red-400" />
                ) : (
                  <BookCheck className="h-8 w-8 text-green-600 dark:text-green-400" />
                )}
              </div>

              {/* Content */}
              <div className="flex-1 space-y-2">
                <div className="flex items-center gap-2">
                  <h3 className={`text-xl font-bold ${
                    result.logbookRequired
                      ? "text-red-700 dark:text-red-400"
                      : "text-green-700 dark:text-green-400"
                  }`}>
                    Logbook {result.logbookRequired ? "Required" : "Not Required"}
                  </h3>
                  {result.logbookRequired ? (
                    <CircleX className="h-5 w-5 text-red-600 dark:text-red-400" />
                  ) : (
                    <CircleCheck className="h-5 w-5 text-green-600 dark:text-green-400" />
                  )}
                </div>
                <p className={`text-sm leading-relaxed ${
                  result.logbookRequired
                    ? "text-red-700 dark:text-red-300"
                    : "text-green-700 dark:text-green-300"
                }`}>
                  {result.logbookRequired
                    ? "You are travelling more than 100km from your base. A work diary (logbook) is required under NHVR regulations."
                    : "You are travelling within 100km of your base. No work diary (logbook) is required under NHVR regulations."}
                </p>
              </div>
            </div>
          </div>

          {/* Close to Threshold Warning */}
          {(() => {
            // Use the more accurate maxDistanceFromBase if available, otherwise use straight-line distance
            const relevantDistance = result.maxDistanceFromBase !== null 
              ? result.maxDistanceFromBase 
              : result.distance
            
            // Show warning if within 5km of the 100km threshold (95-105km)
            if (relevantDistance >= 95 && relevantDistance <= 105) {
              const isJustUnder = relevantDistance < 100
              const isJustOver = relevantDistance >= 100 && relevantDistance <= 105
              
              if (isJustUnder) {
                const usingMaxDistance = result.maxDistanceFromBase !== null && result.maxDistanceFromBase !== result.distance
                return (
                  <div className="rounded-lg border border-amber-200 dark:border-amber-900/40 bg-amber-50/50 dark:bg-amber-950/10 p-5">
                    <div className="flex items-start gap-3">
                      <div className="flex items-center justify-center w-10 h-10 rounded-full bg-amber-100 dark:bg-amber-900/30 shrink-0 mt-0.5">
                        <AlertTriangle className="h-5 w-5 text-amber-600 dark:text-amber-400" />
                      </div>
                      <div className="flex-1 space-y-2 min-w-0">
                        <div className="space-y-1">
                          <h4 className="text-base font-semibold text-amber-900 dark:text-amber-200">
                            {relevantDistance.toFixed(1)} km {usingMaxDistance ? '(max from base) ' : ''}— Close to Threshold
                          </h4>
                          <p className="text-sm text-amber-800/90 dark:text-amber-300/90 leading-relaxed">
                            {usingMaxDistance 
                              ? `Your route takes you ${relevantDistance.toFixed(1)} km from base at the furthest point. Consider keeping a logbook anyway — GPS variations, detours, or route changes could push you over the 100km limit.`
                              : `You're just under the 100km requirement. Consider keeping a logbook anyway — GPS variations, detours, or route changes could push you over the limit.`
                            }
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                )
              }
              
              if (isJustOver) {
                const usingMaxDistance = result.maxDistanceFromBase !== null && result.maxDistanceFromBase !== result.distance
                return (
                  <div className="rounded-lg border border-amber-200 dark:border-amber-900/40 bg-amber-50/50 dark:bg-amber-950/10 p-5">
                    <div className="flex items-start gap-3">
                      <div className="flex items-center justify-center w-10 h-10 rounded-full bg-amber-100 dark:bg-amber-900/30 shrink-0 mt-0.5">
                        <AlertTriangle className="h-5 w-5 text-amber-600 dark:text-amber-400" />
                      </div>
                      <div className="flex-1 space-y-2 min-w-0">
                        <div className="space-y-1">
                          <h4 className="text-base font-semibold text-amber-900 dark:text-amber-200">
                            {relevantDistance.toFixed(1)} km {usingMaxDistance ? '(max from base) ' : ''}— Just Over Threshold
                          </h4>
                          <p className="text-sm text-amber-800/90 dark:text-amber-300/90 leading-relaxed">
                            {usingMaxDistance
                              ? `Your route takes you ${relevantDistance.toFixed(1)} km from base at the furthest point. A work diary is required for this journey under NHVR regulations.`
                              : `You're just over the 100km requirement. A work diary is required for this journey under NHVR regulations.`
                            }
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                )
              }
            }
            return null
          })()}

          {/* Ad placement before map - only show for free users */}
          {!isPro && <ResponsiveAd adSlot="YOUR_AD_SLOT_MAP" />}

          {/* Route Visualisation - Map */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Route className="h-4 w-4 text-muted-foreground" />
                <h3 className="text-sm font-semibold">
                  Route Visualisation
                </h3>
              </div>
              {result.routeGeometry && (
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <Navigation className="h-3 w-3" />
                  <span>Actual driving route</span>
                </div>
              )}
              {!result.routeGeometry && (
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <span>Straight-line distance</span>
                </div>
              )}
            </div>
            <div className="rounded-lg overflow-hidden border border-border/50 bg-card shadow-sm">
              <DistanceMap
                baseLocation={result.baseLocation}
                stops={result.stops}
                routeGeometry={result.routeGeometry}
                maxDistanceFromBase={result.maxDistanceFromBase}
                isPro={isPro}
              />
            </div>
          </div>
        </div>

        {/* Secondary Information - Below Map */}
        <div className="pt-4 border-t border-border/50 space-y-4">
          {/* Additional Distance Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {result.maxDistanceFromBase !== null && (
              <div className={`text-center space-y-2 p-4 border border-border/50 rounded-lg ${
                result.maxDistanceFromBase > 100 ? 'border-amber-500/50 bg-amber-50 dark:bg-amber-950/20' : ''
              }`}>
                <div className="text-sm text-muted-foreground">Max Distance from Base</div>
                <div className="text-xl sm:text-2xl font-bold gradient-text">{result.maxDistanceFromBase.toFixed(1)} km</div>
                <div className="text-xs text-muted-foreground">
                  (along driving route)
                </div>
              </div>
            )}

            {result.drivingDistance !== null && (
              <div className="text-center space-y-2 p-4 border border-border/50 rounded-lg">
                <div className="text-sm text-muted-foreground">Total Driving Distance</div>
                <div className="text-xl sm:text-2xl font-bold gradient-text">{result.drivingDistance.toFixed(1)} km</div>
                <div className="text-xs text-muted-foreground">
                  (actual route distance)
                </div>
              </div>
            )}
          </div>

          {/* Route Distance Notice - Only show if there's a meaningful difference (>5km) */}
          {result.maxDistanceFromBase !== null && 
           result.maxDistanceFromBase > result.distance + 5 && (
            <Alert>
              <AlertTitle className="text-sm">
                Route Distance Notice
              </AlertTitle>
              <AlertDescription className="text-xs">
                While your destination is {result.distance.toFixed(1)} km from base, 
                your driving route takes you up to {result.maxDistanceFromBase.toFixed(1)} km away from base 
                (a difference of {(result.maxDistanceFromBase - result.distance).toFixed(1)} km). 
                NHVR regulations are based on the maximum distance from your base during the journey.
                {result.maxDistanceFromBase > 100 && result.distance <= 100 && (
                  <span className="block mt-2 font-medium text-amber-600 dark:text-amber-400">
                    ⚠️ Important: Even though your destination is within 100km, 
                    you exceed the 100km radius along your route, so a logbook IS required.
                  </span>
                )}
              </AlertDescription>
            </Alert>
          )}

        </div>
      </CardContent>
    </Card>
  )
}

