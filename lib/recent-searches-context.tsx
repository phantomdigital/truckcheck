"use client"

import { createContext, useContext, useState, useEffect, ReactNode } from "react"

export interface RecentSearch {
  id: string
  baseLocation: {
    placeName: string
    lat: number
    lng: number
  }
  stops: Array<{
    placeName: string
    lat: number
    lng: number
  }>
  // Legacy field for backward compatibility
  destination?: {
    placeName: string
    lat: number
    lng: number
  }
  distance: number
  logbookRequired: boolean
  timestamp: number
}

const STORAGE_KEY = "nhvr-recent-searches"
const MAX_RECENT_SEARCHES = 10

interface RecentSearchesContextType {
  recentSearches: RecentSearch[]
  saveSearch: (search: Omit<RecentSearch, "id" | "timestamp">) => void
  clearRecentSearches: () => void
  deleteSearch: (id: string) => void
}

const RecentSearchesContext = createContext<RecentSearchesContextType | undefined>(undefined)

export function RecentSearchesProvider({ children }: { children: ReactNode }) {
  const [recentSearches, setRecentSearches] = useState<RecentSearch[]>([])

  useEffect(() => {
    // Load from localStorage on mount
    const stored = localStorage.getItem(STORAGE_KEY)
    if (stored) {
      try {
        const parsed = JSON.parse(stored)
        setRecentSearches(parsed)
      } catch (error) {
        console.error("Error loading recent searches:", error)
      }
    }
  }, [])

  const saveSearch = (search: Omit<RecentSearch, "id" | "timestamp">) => {
    const newSearch: RecentSearch = {
      ...search,
      id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      timestamp: Date.now(),
    }

    setRecentSearches((prev) => {
      // Remove duplicates (same base and stops)
      const filtered = prev.filter((s) => {
        const newStopsStr = JSON.stringify(newSearch.stops.map(stop => stop.placeName))
        const oldStopsStr = JSON.stringify((s.stops || (s.destination ? [s.destination] : [])).map((stop: any) => stop.placeName))
        return !(
          s.baseLocation.placeName === newSearch.baseLocation.placeName &&
          newStopsStr === oldStopsStr
        )
      })

      // Add new search at the beginning
      const updated = [newSearch, ...filtered].slice(0, MAX_RECENT_SEARCHES)

      // Save to localStorage
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated))

      return updated
    })
  }

  const clearRecentSearches = () => {
    setRecentSearches([])
    localStorage.removeItem(STORAGE_KEY)
  }

  const deleteSearch = (id: string) => {
    setRecentSearches((prev) => {
      const updated = prev.filter((s) => s.id !== id)
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated))
      return updated
    })
  }

  return (
    <RecentSearchesContext.Provider
      value={{
        recentSearches,
        saveSearch,
        clearRecentSearches,
        deleteSearch,
      }}
    >
      {children}
    </RecentSearchesContext.Provider>
  )
}

export function useRecentSearches() {
  const context = useContext(RecentSearchesContext)
  if (context === undefined) {
    throw new Error("useRecentSearches must be used within a RecentSearchesProvider")
  }
  return context
}

