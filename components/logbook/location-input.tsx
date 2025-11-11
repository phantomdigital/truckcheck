"use client"

import { AddressAutocomplete } from "@/components/address-autocomplete"
import { MapPin } from "lucide-react"
import { DepotSelector } from "@/components/logbook/depot-selector"
import type { GeocodeResult } from "@/lib/logbook/types"
import type { Depot } from "@/lib/depot/actions"

interface LocationInputProps {
  id: string
  label: string
  value: string
  onChange: (value: string) => void
  onSelect: (location: GeocodeResult) => void
  placeholder?: string
  location: GeocodeResult | null
  isPro?: boolean
  showDepotSelector?: boolean
  onSelectDepot?: (depot: Depot) => void
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
  showDepotSelector = false,
  onSelectDepot,
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
        {isPro && showDepotSelector && onSelectDepot && (
          <DepotSelector 
            onSelectDepot={onSelectDepot}
            location={location}
            showSaveButton={!!location}
          />
        )}
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

