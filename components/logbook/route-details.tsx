"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import type { CalculationResult } from "@/lib/logbook/types"

interface RouteDetailsProps {
  result: CalculationResult
}

export function RouteDetails({ result }: RouteDetailsProps) {
  return (
    <Card>
      <CardHeader className="pb-4">
        <CardTitle className="text-lg font-semibold tracking-tight">Route Details</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 gap-3">
          <div className="space-y-1">
            <div className="text-xs text-muted-foreground">Base Location</div>
            <div className="text-sm font-medium">{result.baseLocation.placeName}</div>
          </div>
          <div className="space-y-1">
            <div className="text-xs text-muted-foreground">Total Stops</div>
            <div className="text-sm font-medium">{result.stops.length} {result.stops.length === 1 ? 'stop' : 'stops'}</div>
          </div>
        </div>
        {result.stops.length > 0 && (
            <div className="space-y-2 pt-2 border-t border-border/50">
            <div className="text-xs font-medium text-muted-foreground mb-2">Stop Sequence</div>
            <div className="space-y-2">
              {result.stops.map((stop, index) => (
                <div key={stop.id} className="flex items-start gap-2 text-sm">
                  <div className="flex items-center justify-center w-6 h-6 rounded-full bg-muted text-foreground text-xs font-semibold mt-0.5 flex-shrink-0">
                    {index + 1}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-medium truncate">
                      {stop.location?.placeName || stop.address}
                    </div>
                    {index === result.stops.length - 1 && (
                      <div className="text-xs text-blue-600 dark:text-blue-400 mt-0.5">
                        Final destination
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

