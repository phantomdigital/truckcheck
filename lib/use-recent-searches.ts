import { useState, useEffect } from "react"

export interface RecentSearch {
  id: string
  baseLocation: {
    placeName: string
    lat: number
    lng: number
  }
  destination: {
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

export function useRecentSearches() {
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
      // Remove duplicates (same base and destination)
      const filtered = prev.filter(
        (s) =>
          !(
            s.baseLocation.placeName === newSearch.baseLocation.placeName &&
            s.destination.placeName === newSearch.destination.placeName
          )
      )

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

  return {
    recentSearches,
    saveSearch,
    clearRecentSearches,
    deleteSearch,
  }
}

