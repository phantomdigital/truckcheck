"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { History, Trash2, Download } from "lucide-react"
import { deleteCalculation } from "@/lib/stripe/actions"
import { toast } from "sonner"

interface CalculationHistoryItem {
  id: string
  base_location: { placeName: string }
  destination: { placeName: string }
  stops: Array<{ address: string; location?: { placeName: string } }>
  distance: number
  max_distance_from_base: number | null
  driving_distance: number | null
  logbook_required: boolean
  created_at: string
}

interface CalculationHistoryClientProps {
  initialHistory: CalculationHistoryItem[]
}

export function CalculationHistoryClient({ initialHistory }: CalculationHistoryClientProps) {
  const [history, setHistory] = useState(initialHistory)

  const handleDelete = async (id: string) => {
    try {
      const result = await deleteCalculation(id)
      
      if (!result.success) {
        throw new Error(result.error || "Failed to delete calculation")
      }
      
      setHistory(history.filter((item) => item.id !== id))
      toast.success("Calculation deleted")
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to delete calculation")
    }
  }

  const exportToCSV = () => {
    const headers = [
      "Date",
      "Base Location",
      "Destination",
      "Distance (km)",
      "Max Distance from Base (km)",
      "Driving Distance (km)",
      "Logbook Required",
    ]

    const rows = history.map((item) => [
      new Date(item.created_at).toLocaleDateString("en-AU"),
      item.base_location.placeName,
      item.destination.placeName,
      item.distance.toFixed(1),
      item.max_distance_from_base?.toFixed(1) || "N/A",
      item.driving_distance?.toFixed(1) || "N/A",
      item.logbook_required ? "Yes" : "No",
    ])

    const csvContent = [headers, ...rows]
      .map((row) => row.map((cell) => `"${cell}"`).join(","))
      .join("\n")

    const blob = new Blob([csvContent], { type: "text/csv" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `truckcheck-history-${new Date().toISOString().split("T")[0]}.csv`
    a.click()
    URL.revokeObjectURL(url)

    toast.success("History exported to CSV")
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <History className="h-5 w-5" />
              Calculation History
            </CardTitle>
            <CardDescription>
              Your past 90 days of calculations ({history.length} total)
            </CardDescription>
          </div>
          {history.length > 0 && (
            <Button onClick={exportToCSV} variant="outline" size="sm">
              <Download className="h-4 w-4 mr-2" />
              Export CSV
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {history.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <History className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>No calculation history yet.</p>
            <p className="text-sm mt-2">
              Your calculations will be saved here automatically.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {history.map((item) => (
              <div
                key={item.id}
                className="flex items-start justify-between p-4 border border-border/50 rounded-lg hover:bg-muted/30 transition-colors"
              >
                <div className="flex-1 space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium">
                      {item.base_location.placeName} → {item.destination.placeName}
                    </span>
                    <span
                      className={`text-xs px-2 py-0.5 rounded ${
                        item.logbook_required
                          ? "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
                          : "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                      }`}
                    >
                      {item.logbook_required ? "Logbook Required" : "No Logbook"}
                    </span>
                  </div>
                  <div className="text-xs text-muted-foreground space-x-4">
                    <span>Distance: {item.distance.toFixed(1)} km</span>
                    {item.max_distance_from_base && (
                      <span>Max from Base: {item.max_distance_from_base.toFixed(1)} km</span>
                    )}
                    <span>
                      {new Date(item.created_at).toLocaleDateString("en-AU", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </span>
                  </div>
                </div>
                <Button
                  onClick={() => handleDelete(item.id)}
                  variant="ghost"
                  size="icon"
                  className="shrink-0"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}

