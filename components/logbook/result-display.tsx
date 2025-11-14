"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import { Separator } from "@/components/ui/separator"
import { DistanceMap } from "@/components/distance-map"
import { Share2, Route, Navigation, BookCheck, BookX, AlertTriangle, AlertCircle, ChevronRight, ExternalLink } from "lucide-react"
import { ExportModal } from "@/components/logbook/export-modal"
import { ResponsiveAd } from "@/components/ezoic"
import type { CalculationResult } from "@/lib/logbook/types"

interface ResultDisplayProps {
  result: CalculationResult
  onShare: () => void
  isPro?: boolean
}

export function ResultDisplay({ result, onShare, isPro = false }: ResultDisplayProps) {
  const [isCollapsibleOpen, setIsCollapsibleOpen] = useState(false)
  
  return (
    <Card>
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <CardTitle className="text-xl font-semibold tracking-tight">Result</CardTitle>
          <div className="flex gap-2">
            <ExportModal result={result} isPro={isPro} />
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
                  <BookCheck className="h-8 w-8 text-red-600 dark:text-red-400" />
                ) : (
                  <BookX className="h-8 w-8 text-green-600 dark:text-green-400" />
                )}
              </div>

              {/* Content */}
              <div className="flex-1 space-y-3">
                <h3 className={`text-xl font-bold ${
                  result.logbookRequired
                    ? "text-red-700 dark:text-red-400"
                    : "text-green-700 dark:text-green-400"
                }`}>
                  Logbook {result.logbookRequired ? "Required" : "Not Required"}
                </h3>

                {/* Badge with Work Diary Entry Status */}
                {result.logbookRequired ? (
                  <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200 dark:bg-red-950/40 dark:text-red-300 dark:border-red-900">
                    Work Diary Entry: REQUIRED
                  </Badge>
                ) : (
                  <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200 dark:bg-green-950/40 dark:text-green-300 dark:border-green-900">
                    Work Diary Entry: NOT REQUIRED
                  </Badge>
                )}

                <p className={`text-sm ${
                  result.logbookRequired
                    ? "text-red-700 dark:text-red-300"
                    : "text-green-700 dark:text-green-300"
                }`}>
                  {result.logbookRequired
                    ? "Complete work diary for this day"
                    : "Use local area records (run sheets)"}
                </p>

                <p className={`text-sm leading-relaxed ${
                  result.logbookRequired
                    ? "text-red-700 dark:text-red-300"
                    : "text-green-700 dark:text-green-300"
                }`}>
                  {result.logbookRequired
                    ? "You are travelling more than 100km from your base. A work diary (logbook) is required under NHVR regulations."
                    : "You are travelling within 100km of your base. No work diary (logbook) is required under NHVR regulations."}
                </p>

                {/* 28-Day Carrying Requirement - Always visible */}
                {!result.logbookRequired && (
                  <p className="text-sm text-green-800 dark:text-green-200 bg-green-100/50 dark:bg-green-950/30 border border-green-300/50 dark:border-green-900/50 rounded-md p-3">
                    <strong>Remember:</strong> Even if a work diary entry is not required today, you may still need to CARRY your work diary if you made entries in the last 28 days.
                  </p>
                )}
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
          {!isPro && <ResponsiveAd placementId={102} />}

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
                <div className="text-sm text-muted-foreground">Furthest Point from Base</div>
                <div className="text-xl sm:text-2xl font-bold gradient-text">{result.maxDistanceFromBase.toFixed(1)} km</div>
                <div className="text-xs text-muted-foreground">
                  How far you travel from base
                </div>
              </div>
            )}

            {result.drivingDistance !== null && (
              <div className="text-center space-y-2 p-4 border border-border/50 rounded-lg">
                <div className="text-sm text-muted-foreground">Total Driving Distance</div>
                <div className="text-xl sm:text-2xl font-bold gradient-text">{result.drivingDistance.toFixed(1)} km</div>
                <div className="text-xs text-muted-foreground">
                  Total km you'll drive on this trip
                </div>
              </div>
            )}
          </div>

          {/* Route Distance Notice - Only show if there's a meaningful difference (>5km) */}
          {result.maxDistanceFromBase !== null && 
           result.maxDistanceFromBase > result.distance + 5 && (
            <Alert>
              <AlertTitle className="text-sm">
                Important: Destination vs Route Distance
              </AlertTitle>
              <AlertDescription className="text-xs">
                <strong>Your destination is {result.distance.toFixed(1)} km away</strong> (straight line), 
                but to get there <strong>you&apos;ll travel {result.maxDistanceFromBase.toFixed(1)} km from base</strong> along the actual driving route 
                (a difference of {(result.maxDistanceFromBase - result.distance).toFixed(1)} km). 
                NHVR regulations are based on how far you travel from base, not just where your destination is.
                {result.maxDistanceFromBase > 100 && result.distance <= 100 && (
                  <span className="block mt-2 font-medium text-amber-600 dark:text-amber-400">
                    Important: Even though your destination is within 100km, 
                    the route takes you beyond the 100km radius, so a logbook IS required.
                  </span>
                )}
              </AlertDescription>
            </Alert>
          )}

          {/* Combined Compliance Information and NHVR Requirements */}
          <Card className="border-amber-200 dark:border-amber-900/40 bg-amber-50/30 dark:bg-amber-950/10">
            <CardContent className="pt-6">
              <div className="flex items-start gap-3 mb-4">
                <AlertCircle className="h-5 w-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
                <div className="flex-1">
                  <h3 className="font-semibold text-base text-amber-900 dark:text-amber-200 mb-2">Important Compliance Information</h3>
                  <p className="text-sm text-amber-800 dark:text-amber-300 mb-3">
                    This tool calculates straight-line distance only. You are responsible for:
                  </p>
                  <ul className="list-disc list-inside space-y-1 text-sm text-amber-800 dark:text-amber-300">
                    <li>Verifying this result independently</li>
                    <li>Understanding NHVR work diary requirements</li>
                    <li>Keeping appropriate records (work diary OR local area records)</li>
                    <li>Carrying your work diary for 28 days after any entry &gt;100km</li>
                    <li>Consulting NHVR regulations for your specific situation</li>
                  </ul>
                </div>
              </div>

              <Separator className="my-4" />

              {/* Collapsible Understanding NHVR Requirements Section */}
              <Collapsible open={isCollapsibleOpen} onOpenChange={setIsCollapsibleOpen}>
                <CollapsibleTrigger asChild>
                  <Button 
                    variant="ghost" 
                    className="w-full justify-start gap-2 text-left font-medium h-auto py-2 hover:bg-amber-100/50 dark:hover:bg-amber-950/20"
                  >
                    <ChevronRight className={`h-4 w-4 transition-transform ${isCollapsibleOpen ? 'rotate-90' : ''}`} />
                    <span className="text-amber-900 dark:text-amber-200">Learn More: Understanding NHVR Work Diary Requirements</span>
                  </Button>
                </CollapsibleTrigger>
                <CollapsibleContent>
                  <div className="mt-4 pt-4 border-t border-amber-200/50 dark:border-amber-900/20">
                    <div className="space-y-4">
                    <div>
                      <h4 className="font-semibold mb-2 text-base">Local Work (Under 100km)</h4>
                      <p className="text-sm text-muted-foreground leading-relaxed">
                        Drivers doing local work don&apos;t need to complete work diary entries, but must still keep local area records like run sheets. Work and rest limits still apply.
                      </p>
                      <a 
                        href="https://www.nhvr.gov.au/safety-accreditation-compliance/fatigue-management/local-area-work-diary-requirements" 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-sm text-primary hover:underline mt-2"
                      >
                        Read NHVR local area work requirements
                        <ExternalLink className="h-3 w-3" />
                      </a>
                    </div>
                    
                    <Separator />
                    
                    <div>
                      <h4 className="font-semibold mb-2 text-base">Work Over 100km</h4>
                      <p className="text-sm text-muted-foreground leading-relaxed">
                        When you travel more than 100km from your base, you must complete work diary entries for that entire day (from midnight).
                      </p>
                      <a 
                        href="https://www.nhvr.gov.au/safety-accreditation-compliance/fatigue-management/record-keeping-requirements" 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-sm text-primary hover:underline mt-2"
                      >
                        Read NHVR record keeping requirements
                        <ExternalLink className="h-3 w-3" />
                      </a>
                    </div>
                    
                    <Separator />
                    
                    <div>
                      <h4 className="font-semibold mb-2 text-base">28-Day Carrying Requirement</h4>
                      <p className="text-sm text-muted-foreground leading-relaxed">
                        If you make ANY work diary entry (for &gt;100km work), you must carry that work diary with you for 28 days after the entry — even if you return to only local work.
                      </p>
                      <a 
                        href="https://www.nhvr.gov.au/safety-accreditation-compliance/fatigue-management/work-diary" 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-sm text-primary hover:underline mt-2"
                      >
                        Read NHVR work diary information
                        <ExternalLink className="h-3 w-3" />
                      </a>
                    </div>
                    
                    <Separator />
                    
                    <div>
                      <h4 className="font-semibold mb-2 text-base">Still Have Questions?</h4>
                      <p className="text-sm text-muted-foreground leading-relaxed">
                        For specific compliance questions, always consult the official NHVR guidance or contact them directly.
                      </p>
                      <a 
                        href="https://www.nhvr.gov.au/safety-accreditation-compliance/fatigue-management/faqs" 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-sm text-primary hover:underline mt-2"
                      >
                        View NHVR FAQs
                        <ExternalLink className="h-3 w-3" />
                      </a>
                    </div>
                    </div>
                  </div>
                </CollapsibleContent>
              </Collapsible>
            </CardContent>
          </Card>

        </div>
      </CardContent>
    </Card>
  )
}

