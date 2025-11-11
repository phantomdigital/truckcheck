"use client"

import { useState, useEffect } from "react"
import { Building2, ChevronDown, Trash2, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { saveDepot, deleteDepot, type Depot } from "@/lib/depot/actions"
import { useDepots } from "@/lib/depot/depot-context"
import { toast } from "sonner"
import type { GeocodeResult } from "@/lib/logbook/types"

interface DepotSelectorProps {
  onSelectDepot: (depot: Depot) => void
  location: GeocodeResult | null
  onSaveAsDepot?: (location: GeocodeResult) => void
  showSaveButton?: boolean
}

export function DepotSelector({ 
  onSelectDepot, 
  location,
  onSaveAsDepot,
  showSaveButton = false 
}: DepotSelectorProps) {
  const { depots, loading, refreshDepots } = useDepots()
  const [isOpen, setIsOpen] = useState(false)

  // Fetch depots when popover opens
  useEffect(() => {
    if (isOpen) {
      refreshDepots()
    }
  }, [isOpen, refreshDepots])

  const handleSaveDepot = async (location: GeocodeResult) => {
    const result = await saveDepot({
      address: location.placeName,
      lat: location.lat,
      lng: location.lng,
    })
    
    if (result.success) {
      toast.success('Depot saved successfully!')
      // Refresh depots list (will update all selectors via context)
      await refreshDepots()
      if (onSaveAsDepot) {
        onSaveAsDepot(location)
      }
    } else {
      if (result.error === 'Depot already exists') {
        toast.info('This depot already exists')
      } else {
        toast.error(result.error || 'Failed to save depot')
      }
    }
  }

  const handleDeleteDepot = async (depotId: string) => {
    const result = await deleteDepot(depotId)
    
    if (result.success) {
      toast.success('Depot deleted')
      // Refresh depots list (will update all selectors via context)
      await refreshDepots()
    } else {
      toast.error(result.error || 'Failed to delete depot')
    }
  }

  const handleSelectDepot = (depot: Depot) => {
    onSelectDepot(depot)
    setIsOpen(false)
  }

  return (
    <div className="flex items-center gap-3">
      {/* Depot Selector Dropdown */}
      <Popover open={isOpen} onOpenChange={setIsOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            size="sm"
            className="h-7 gap-1.5 text-xs"
          >
      
            Select Depot
            <ChevronDown className="h-3 w-3 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-80 p-2" align="end">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
            </div>
          ) : depots.length === 0 ? (
            <div className="px-3 py-8 text-center text-sm text-muted-foreground">
              No saved depots yet.
              <br />
              Enter an address and click "Save as Depot"
            </div>
          ) : (
            <div className="space-y-1">
              <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground">
                Your Saved Depots
              </div>
              {depots.map((depot) => (
                <div
                  key={depot.id}
                  className="group flex items-center justify-between gap-2 rounded-md px-2 py-2 hover:bg-accent transition-colors"
                >
                  <button
                    onClick={() => handleSelectDepot(depot)}
                    className="flex-1 text-left text-sm"
                  >
                    {depot.address}
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      handleDeleteDepot(depot.id)
                    }}
                    className="opacity-0 group-hover:opacity-100 p-1 rounded hover:bg-destructive/10 hover:text-destructive transition-all"
                    title="Delete depot"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </PopoverContent>
      </Popover>
      
      {/* Save as Depot Button - Shows when address is entered */}
      {showSaveButton && location && (
        <button
          onClick={() => handleSaveDepot(location)}
          className="group inline-flex items-center gap-1.5 text-xs font-medium text-primary hover:text-primary/80 transition-colors"
        >
   
          <span className="underline decoration-primary/30 decoration-2 underline-offset-4 group-hover:decoration-primary/60">
            Save as Depot
          </span>
        </button>
      )}
    </div>
  )
}

