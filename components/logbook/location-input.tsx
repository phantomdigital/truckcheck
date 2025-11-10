"use client"

import { AddressAutocomplete } from "@/components/address-autocomplete"
import { MapPin, Building2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import type { GeocodeResult } from "@/lib/logbook/types"

interface LocationInputProps {
  id: string
  label: string
  value: string
  onChange: (value: string) => void
  onSelect: (location: GeocodeResult) => void
  placeholder?: string
  location: GeocodeResult | null
  isPro?: boolean
  onSaveAsDepot?: (location: GeocodeResult) => void
  showSaveAsDepot?: boolean
  hasDepot?: boolean
  depotName?: string
  useDepot?: boolean
  onToggleDepot?: (checked: boolean) => void
}

export function LocationInput({
  id,
  label,
  value,
  onChange,
  onSelect,
  placeholder,
  location,
  isPro = false,
  onSaveAsDepot,
  showSaveAsDepot = false,
  hasDepot = false,
  depotName = 'Depot',
  useDepot = false,
  onToggleDepot,
}: LocationInputProps) {
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <MapPin className="h-4 w-4 text-muted-foreground" />
          <label htmlFor={id} className="text-sm font-semibold">
            {label}
          </label>
        </div>
        <div className="flex items-center gap-3">
          {isPro && hasDepot && onToggleDepot && (
            <div className="flex items-center gap-2">
              <Building2 className="h-3.5 w-3.5 text-muted-foreground" />
              <label htmlFor="use-depot-toggle" className="text-xs text-muted-foreground">
                Use {depotName}
              </label>
              <Switch
                id="use-depot-toggle"
                checked={useDepot}
                onCheckedChange={onToggleDepot}
                className="scale-75"
              />
            </div>
          )}
          {isPro && showSaveAsDepot && location && onSaveAsDepot && !hasDepot && (
            <button
              onClick={() => onSaveAsDepot(location)}
              className="group inline-flex items-center gap-1.5 text-xs font-medium text-primary hover:text-primary/80 transition-colors"
            >
              <Building2 className="h-3.5 w-3.5" />
              <span className="underline decoration-primary/30 decoration-2 underline-offset-4 group-hover:decoration-primary/60">
                Set as Depot
              </span>
            </button>
          )}
        </div>
      </div>
      <AddressAutocomplete
        id={id}
        value={value}
        onChange={onChange}
        onSelect={(suggestion) => {
          onSelect({
            lat: suggestion.lat,
            lng: suggestion.lng,
            placeName: suggestion.placeName,
          })
        }}
        placeholder={placeholder}
        preSelectedLocation={location ? {
          placeName: location.placeName,
          lat: location.lat,
          lng: location.lng,
        } : null}
      />
      {location && (
        <div className="text-xs text-muted-foreground pl-6">
          ✓ {location.placeName}
        </div>
      )}
    </div>
  )
}

