"use client"

import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core"
import {
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"
import { Button } from "@/components/ui/button"
import { AddressAutocomplete } from "@/components/address-autocomplete"
import { DepotSelector } from "@/components/logbook/depot-selector"
import { Plus, X, Navigation, MapPin, GripVertical, Lock } from "lucide-react"
import type { Stop, GeocodeResult } from "@/lib/logbook/types"
import type { Depot } from "@/lib/depot/actions"

interface StopsInputProps {
  stops: Stop[]
  onAddStop: () => void
  onRemoveStop: (id: string) => void
  onUpdateStopAddress: (id: string, address: string) => void
  onUpdateStopLocation: (id: string, location: GeocodeResult) => void
  onReorder: (startIndex: number, endIndex: number) => void
  isPro?: boolean
  onSelectDepot?: (stopId: string, depot: Depot) => void
}

interface SortableStopItemProps {
  stop: Stop
  index: number
  totalStops: number
  onRemoveStop: (id: string) => void
  onUpdateStopAddress: (id: string, address: string) => void
  onUpdateStopLocation: (id: string, location: GeocodeResult) => void
  isPro?: boolean
  onSelectDepot?: (stopId: string, depot: Depot) => void
}

function SortableStopItem({
  stop,
  index,
  totalStops,
  onRemoveStop,
  onUpdateStopAddress,
  onUpdateStopLocation,
  isPro = false,
  onSelectDepot,
}: SortableStopItemProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: stop.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`relative p-4 border border-border/50 rounded-lg bg-card hover:border-primary/50 transition-colors ${
        isDragging ? "z-50 shadow-lg" : ""
      }`}
      data-sortable-item
    >
      <div className="flex gap-3 items-start">
        {/* Drag Handle */}
        <button
          {...attributes}
          {...listeners}
          className="flex flex-col items-center gap-1 shrink-0 pt-1 cursor-grab active:cursor-grabbing touch-none focus:outline-none focus:ring-0"
          aria-label="Drag to reorder"
        >
          <div className="flex items-center justify-center w-7 h-7 rounded-full bg-muted text-foreground text-xs font-semibold">
            {index + 1}
          </div>
          {index < totalStops - 1 && (
            <div className="w-0.5 h-5 bg-border"></div>
          )}
          <GripVertical className="h-4 w-4 text-muted-foreground mt-1" />
        </button>

        {/* Input Section */}
        <div className="flex-1 space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <MapPin className="h-3.5 w-3.5 text-muted-foreground" />
              <span className="text-xs font-medium text-muted-foreground">
                {index === totalStops - 1 ? 'Final Destination' : `Stop ${index + 1}`}
              </span>
              {index === totalStops - 1 && (
                <span className="text-xs bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-400 px-1.5 py-0.5 rounded">
                  Final
                </span>
              )}
            </div>
            <div className="flex items-center gap-2">
              {isPro && onSelectDepot && (
                <DepotSelector
                  onSelectDepot={(depot) => onSelectDepot(stop.id, depot)}
                  location={stop.location}
                  showSaveButton={!!stop.location}
                />
              )}
              {totalStops > 1 && (
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() => onRemoveStop(stop.id)}
                  className="h-7 w-7 text-muted-foreground hover:text-destructive"
                  title="Remove stop"
                >
                  <X className="h-3.5 w-3.5" />
                </Button>
              )}
            </div>
          </div>
          <AddressAutocomplete
            id={`stop-${stop.id}`}
            value={stop.address}
            onChange={(value) => onUpdateStopAddress(stop.id, value)}
            onSelect={(suggestion) => {
              onUpdateStopLocation(stop.id, {
                lat: suggestion.lat,
                lng: suggestion.lng,
                placeName: suggestion.placeName,
              })
            }}
            placeholder={`e.g., ${index === 0 ? "Melbourne, VIC" : "Brisbane, QLD"} or enter an address`}
            preSelectedLocation={stop.location ? {
              placeName: stop.location.placeName,
              lat: stop.location.lat,
              lng: stop.location.lng,
            } : null}
          />
          {stop.location && (
            <div className="text-xs text-muted-foreground pl-1">
              ✓ {stop.location.placeName}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export function StopsInput({
  stops,
  onAddStop,
  onRemoveStop,
  onUpdateStopAddress,
  onUpdateStopLocation,
  onReorder,
  isPro = false,
  onSelectDepot,
}: StopsInputProps) {
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  )

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event

    if (over && active.id !== over.id) {
      const oldIndex = stops.findIndex((stop) => stop.id === active.id)
      const newIndex = stops.findIndex((stop) => stop.id === over.id)
      onReorder(oldIndex, newIndex)
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between lg:sticky lg:top-20 lg:z-10 lg:bg-card lg:py-2 lg:-mx-6 lg:px-6 lg:border-b lg:border-border/50 lg:mb-4">
        <div className="flex items-center gap-2">
          <Navigation className="h-4 w-4 text-muted-foreground" />
          <label className="text-sm font-semibold">
            Stops / Destinations
          </label>
          <span className="text-xs text-muted-foreground">
            ({stops.length} {stops.length === 1 ? 'stop' : 'stops'})
          </span>
        </div>
        {isPro ? (
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={onAddStop}
            className="gap-1.5"
          >
            <Plus className="h-4 w-4" />
            Add Stop
          </Button>
        ) : (
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled
            className="gap-1.5"
            title="Pro feature - Upgrade to add multiple stops"
          >
            <Lock className="h-4 w-4" />
            Add Stop (Pro)
          </Button>
        )}
      </div>

      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
      >
        <SortableContext
          items={stops.map((stop) => stop.id)}
          strategy={verticalListSortingStrategy}
        >
          <div className="space-y-3">
            {stops.map((stop, index) => (
              <SortableStopItem
                key={stop.id}
                stop={stop}
                index={index}
                totalStops={stops.length}
                onRemoveStop={onRemoveStop}
                onUpdateStopAddress={onUpdateStopAddress}
                onUpdateStopLocation={onUpdateStopLocation}
                isPro={isPro}
                onSelectDepot={onSelectDepot}
              />
            ))}
          </div>
        </SortableContext>
      </DndContext>
    </div>
  )
}

