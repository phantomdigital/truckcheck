"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { History, Trash2, X } from "lucide-react"
import type { RecentSearch } from "@/lib/recent-searches-context"
import { useState, useEffect, useImperativeHandle, forwardRef } from "react"
import { getRecentSearches, clearRecentSearches, deleteRecentSearch } from "@/lib/recent-searches/actions"
import { Skeleton } from "@/components/ui/skeleton"
import { toast } from "sonner"

interface RecentSearchesProProps {
  onSelect: (search: RecentSearch) => void
}

export interface RecentSearchesProRef {
  refresh: () => void
}

export const RecentSearchesPro = forwardRef<RecentSearchesProRef, RecentSearchesProProps>(
  ({ onSelect }, ref) => {
    const [searches, setSearches] = useState<any[]>([])
    const [loading, setLoading] = useState(true)

    const loadSearches = async () => {
      try {
        const result = await getRecentSearches()
        if (result.data) {
          // Transform database format to component format
          const transformed = result.data.map((item: any) => ({
            id: item.id,
            baseLocation: item.base_location,
            stops: item.stops,
            distance: item.distance,
            logbookRequired: item.logbook_required,
            timestamp: new Date(item.created_at).getTime(),
          }))
          setSearches(transformed)
        }
      } catch (error) {
        console.error("Error loading recent searches:", error)
      } finally {
        setLoading(false)
      }
    }

    useEffect(() => {
      loadSearches()
    }, [])

    // Expose refresh function via ref
    useImperativeHandle(ref, () => ({
      refresh: loadSearches,
    }))

    const handleClearAll = async () => {
      try {
        const result = await clearRecentSearches()
        if (result.success) {
          setSearches([])
          toast.success("Recent searches cleared")
        } else {
          toast.error(result.error || "Failed to clear searches")
        }
      } catch (error) {
        toast.error("Failed to clear searches")
      }
    }

    const handleDelete = async (searchId: string, e: React.MouseEvent) => {
      e.stopPropagation() // Prevent triggering the parent onClick
      try {
        const result = await deleteRecentSearch(searchId)
        if (result.success) {
          setSearches(searches.filter(s => s.id !== searchId))
          toast.success("Search removed")
        } else {
          toast.error(result.error || "Failed to delete search")
        }
      } catch (error) {
        toast.error("Failed to delete search")
      }
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
      return date.toLocaleDateString("en-AU")
    }

    if (loading) {
      return (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <History className="h-4 w-4" />
              Recent Searches
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-16 w-full" />
              ))}
            </div>
          </CardContent>
        </Card>
      )
    }

    if (searches.length === 0) {
      return (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg font-semibold tracking-tight">Recent Searches</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground text-center py-4">
              No recent searches yet. Your searches will be saved here.
            </p>
          </CardContent>
        </Card>
      )
    }

    return (
      <Card>
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg font-semibold tracking-tight flex items-center gap-2">
              <History className="h-4 w-4" />
              Recent Searches
            </CardTitle>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleClearAll}
              className="gap-2 text-muted-foreground hover:text-destructive"
            >
              <Trash2 className="h-4 w-4" />
              Clear All
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {searches.map((search) => {
              const stops = search.stops || []
              const finalDestination = stops[stops.length - 1]

              return (
                <div key={search.id} className="relative group">
                  <button
                    onClick={() => onSelect(search)}
                    className="w-full text-left p-3 rounded-lg border border-border/50 hover:bg-muted/50 hover:border-primary/50 transition-colors cursor-pointer"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center justify-between">
                        <div className="text-sm font-medium truncate flex-1 pr-8">
                          {search.baseLocation.placeName} → {finalDestination?.placeName || stops[0]?.placeName}
                        </div>
                        <span
                          className={`text-xs px-2 py-0.5 rounded shrink-0 ml-2 ${
                            search.logbookRequired
                              ? "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
                              : "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                          }`}
                        >
                          {search.logbookRequired ? "Logbook" : "No Logbook"}
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-xs text-muted-foreground">
                        <span>{search.distance.toFixed(1)} km</span>
                        <span>{formatDate(search.timestamp)}</span>
                      </div>
                    </div>
                  </button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={(e) => handleDelete(search.id, e)}
                    className="absolute top-2 right-2 h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-destructive/10 hover:text-destructive"
                    title="Delete search"
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </div>
              )
            })}
          </div>
        </CardContent>
      </Card>
    )
  }
)

