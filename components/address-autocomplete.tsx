"use client"

import { useState, useEffect, useRef } from "react"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"

interface Suggestion {
  placeName: string
  lat: number
  lng: number
}

interface AddressAutocompleteProps {
  value: string
  onChange: (value: string) => void
  onSelect: (suggestion: Suggestion) => void
  placeholder?: string
  id?: string
  preSelectedLocation?: Suggestion | null
}

export function AddressAutocomplete({
  value,
  onChange,
  onSelect,
  placeholder,
  id,
  preSelectedLocation,
}: AddressAutocompleteProps) {
  const [suggestions, setSuggestions] = useState<Suggestion[]>([])
  const [isOpen, setIsOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [selectedSuggestion, setSelectedSuggestion] = useState<Suggestion | null>(preSelectedLocation || null)
  const inputRef = useRef<HTMLInputElement>(null)
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)

  // Update selected suggestion when preSelectedLocation changes
  useEffect(() => {
    if (preSelectedLocation && value === preSelectedLocation.placeName) {
      setSelectedSuggestion(preSelectedLocation)
    } else if (preSelectedLocation === null) {
      setSelectedSuggestion(null)
    }
  }, [preSelectedLocation, value])

  useEffect(() => {
    // Clear previous timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
    }

    // Don't search if input is empty or too short
    if (!value.trim() || value.trim().length < 2) {
      setSuggestions([])
      setIsOpen(false)
      setSelectedSuggestion(null)
      return
    }

    // Don't search if the value matches a selected suggestion exactly
    if (selectedSuggestion && value === selectedSuggestion.placeName) {
      setSuggestions([])
      setIsOpen(false)
      return
    }

    // Don't search if the value matches a pre-selected location
    if (preSelectedLocation && value === preSelectedLocation.placeName) {
      setSuggestions([])
      setIsOpen(false)
      setSelectedSuggestion(preSelectedLocation)
      return
    }

    // Reset selected suggestion if user is typing something different
    if (selectedSuggestion && value !== selectedSuggestion.placeName) {
      setSelectedSuggestion(null)
    }

    // Debounce API calls
    timeoutRef.current = setTimeout(async () => {
      await searchAddresses(value.trim())
    }, 300)

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }
    }
  }, [value, selectedSuggestion])

  const searchAddresses = async (query: string) => {
    const mapboxToken = process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN

    if (!mapboxToken) {
      return
    }

    setIsLoading(true)
    try {
      const encodedQuery = encodeURIComponent(query)
      const response = await fetch(
        `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodedQuery}.json?country=AU&access_token=${mapboxToken}&limit=5&autocomplete=true`
      )

      if (!response.ok) {
        return
      }

      const data = await response.json()

      if (data.features && data.features.length > 0) {
        const newSuggestions: Suggestion[] = data.features.map((feature: any) => {
          const [lng, lat] = feature.center
          return {
            placeName: feature.place_name,
            lat,
            lng,
          }
        })
        setSuggestions(newSuggestions)
        setIsOpen(true)
      } else {
        setSuggestions([])
        setIsOpen(false)
      }
    } catch (error) {
      console.error("Error fetching suggestions:", error)
      setSuggestions([])
    } finally {
      setIsLoading(false)
    }
  }

  const handleSelect = (suggestion: Suggestion) => {
    setSelectedSuggestion(suggestion)
    onChange(suggestion.placeName)
    onSelect(suggestion)
    setIsOpen(false)
    setSuggestions([])
    // Clear any pending timeouts
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
    }
    inputRef.current?.blur()
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onChange(e.target.value)
  }

  const handleInputFocus = () => {
    // Only show suggestions if we have them and haven't selected this exact value
    if (suggestions.length > 0 && (!selectedSuggestion || value !== selectedSuggestion.placeName)) {
      setIsOpen(true)
    }
  }

  const handleInputBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    // Check if focus is moving to the dropdown
    const relatedTarget = e.relatedTarget as HTMLElement
    if (relatedTarget && relatedTarget.closest('.autocomplete-dropdown')) {
      return // Don't close if clicking on dropdown
    }
    
    // Delay closing to allow click on suggestion
    setTimeout(() => {
      setIsOpen(false)
    }, 200)
  }

  return (
    <div className="relative">
      <Input
        ref={inputRef}
        id={id}
        type="text"
        placeholder={placeholder}
        value={value}
        onChange={handleInputChange}
        onFocus={handleInputFocus}
        onBlur={handleInputBlur}
        autoComplete="off"
      />
      {isOpen && suggestions.length > 0 && (
        <div 
          className="autocomplete-dropdown absolute z-50 w-full mt-1 bg-popover border rounded-md shadow-lg max-h-60 overflow-auto"
          onMouseDown={(e) => {
            // Prevent drag from starting when clicking on dropdown
            e.stopPropagation()
          }}
          onClick={(e) => {
            // Prevent drag from starting when clicking on dropdown
            e.stopPropagation()
          }}
        >
          {isLoading && (
            <div className="p-2 text-sm text-muted-foreground">Searching...</div>
          )}
          {!isLoading && suggestions.map((suggestion, index) => (
            <button
              key={index}
              type="button"
              className={cn(
                "w-full text-left px-4 py-2 text-sm hover:bg-accent hover:text-accent-foreground transition-colors",
                index === 0 && "rounded-t-md",
                index === suggestions.length - 1 && "rounded-b-md"
              )}
              onClick={(e) => {
                e.stopPropagation()
                handleSelect(suggestion)
              }}
              onMouseDown={(e) => {
                // Prevent input blur and drag from starting when clicking
                e.preventDefault()
                e.stopPropagation()
              }}
            >
              {suggestion.placeName}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

