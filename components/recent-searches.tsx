"use client"

import React from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useRecentSearches, type RecentSearch } from "@/lib/recent-searches-context"
import { X, Trash2 } from "lucide-react"
import { cn } from "@/lib/utils"

interface RecentSearchesProps {
  onSelect: (search: RecentSearch) => void
}

export function RecentSearches({ onSelect }: RecentSearchesProps) {
  const { recentSearches, clearRecentSearches, deleteSearch } = useRecentSearches()

  if (recentSearches.length === 0) {
    return (
      <Card>
        <CardHeader className="pb-4">
          <CardTitle className="text-lg font-semibold tracking-tight">Recent Searches</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground text-center py-4">
            No recent searches yet. Your searches will appear here.
          </p>
        </CardContent>
      </Card>
    )
  }

  const formatDate = (timestamp: number) => {
    const date = new Date(timestamp)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffMins = Math.floor(diffMs / 60000)
    const diffHours = Math.floor(diffMs / 3600000)
    const diffDays = Math.floor(diffMs / 86400000)

    if (diffMins < 1) return "Just now"
    if (diffMins < 60) return `${diffMins}m ago`
    if (diffHours < 24) return `${diffHours}h ago`
    if (diffDays < 7) return `${diffDays}d ago`
    return date.toLocaleDateString()
  }

  return (
    <Card>
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-semibold tracking-tight">
            Recent Searches
            {recentSearches.length > 0 && (
              <span className="ml-2 text-sm font-normal text-muted-foreground">
                ({recentSearches.length})
              </span>
            )}
          </CardTitle>
          {recentSearches.length > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={clearRecentSearches}
              className="gap-2 text-muted-foreground hover:text-destructive"
            >
              <Trash2 className="h-4 w-4" />
              Clear All
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          {recentSearches.map((search) => (
            <button
              key={search.id}
              type="button"
              onClick={() => onSelect(search)}
              className="w-full text-left p-3 rounded-lg border border-border/50 hover:bg-accent hover:border-border/70 transition-colors group cursor-pointer"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0 space-y-1">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    {/* Get stops array (support legacy format) */}
                    {(() => {
                      const stops = search.stops || (search.destination ? [search.destination] : [])
                      const baseName = search.baseLocation.placeName.split(",")[0]
                      
                      if (stops.length === 0) {
                        return <div className="text-sm font-medium truncate">{baseName}</div>
                      }
                      
                      if (stops.length === 1) {
                        // Simple: Base → Final
                        return (
                          <>
                            <div className="text-sm font-medium truncate">{baseName}</div>
                            <span className="text-muted-foreground text-xs">→</span>
                            <div className="text-sm font-medium truncate">
                              {stops[0].placeName.split(",")[0]}
                            </div>
                          </>
                        )
                      }
                      
                      if (stops.length <= 3) {
                        // Show all stops: Base → Stop1 → Stop2 → Final
                        return (
                          <>
                            <div className="text-sm font-medium truncate">{baseName}</div>
                            {stops.map((stop, idx) => (
                              <React.Fragment key={idx}>
                                <span className="text-muted-foreground text-xs">→</span>
                                <div className="text-sm font-medium truncate">
                                  {stop.placeName.split(",")[0]}
                                </div>
                              </React.Fragment>
                            ))}
                          </>
                        )
                      }
                      
                      // More than 3 stops: Base → ... (N stops) → Final
                      return (
                        <>
                          <div className="text-sm font-medium truncate">{baseName}</div>
                          <span className="text-muted-foreground text-xs">→</span>
                          <span className="text-xs text-muted-foreground">
                            ... ({stops.length} stops)
                          </span>
                          <span className="text-muted-foreground text-xs">→</span>
                          <div className="text-sm font-medium truncate">
                            {stops[stops.length - 1].placeName.split(",")[0]}
                          </div>
                        </>
                      )
                    })()}
                  </div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-xs font-medium text-muted-foreground">
                      {search.distance.toFixed(1)} km
                    </span>
                    <span
                      className={cn(
                        "text-xs px-2 py-0.5 rounded font-medium",
                        search.logbookRequired
                          ? "bg-red-100 text-red-700 dark:bg-red-950/20 dark:text-red-400"
                          : "bg-green-100 text-green-700 dark:bg-green-950/20 dark:text-green-400"
                      )}
                    >
                      {search.logbookRequired ? "Logbook Required" : "No Logbook"}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {formatDate(search.timestamp)}
                    </span>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation()
                    deleteSearch(search.id)
                  }}
                  className="h-8 w-8 p-0 opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-destructive shrink-0"
                  title="Delete"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </button>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
