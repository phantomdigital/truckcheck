"use client"

import { createContext, useContext, useState, useCallback, useEffect, useRef, startTransition, ReactNode } from "react"
import { getDepots, type Depot } from "@/lib/depot/actions"
import { toast } from "sonner"

interface DepotContextType {
  depots: Depot[]
  loading: boolean
  refreshDepots: () => Promise<void>
}

const DepotContext = createContext<DepotContextType | undefined>(undefined)

interface DepotProviderProps {
  children: ReactNode
  isPro?: boolean
}

export function DepotProvider({ children, isPro = false }: DepotProviderProps) {
  const [depots, setDepots] = useState<Depot[]>([])
  const [loading, setLoading] = useState(false)
  const hasInitialized = useRef(false)

  const refreshDepots = useCallback(async () => {
    setLoading(true)
    try {
      const result = await getDepots()
      if (result.data) {
        setDepots(result.data)
      } else if (result.error && result.error !== "Unauthorized") {
        // Don't show error for unauthorized (user might not be logged in)
        toast.error(result.error)
      }
    } catch (error) {
      toast.error('Failed to load depots')
    } finally {
      setLoading(false)
    }
  }, [])

  // Prefetch depots when provider mounts (only for Pro users, only once)
  // Uses startTransition to mark as non-urgent - doesn't block initial render
  useEffect(() => {
    if (isPro && !hasInitialized.current) {
      hasInitialized.current = true
      // Use startTransition to mark depot fetching as non-critical
      // This ensures the initial render completes first, then fetches in background
      startTransition(() => {
        refreshDepots()
      })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isPro]) // refreshDepots is stable (memoized), ref prevents re-runs

  return (
    <DepotContext.Provider value={{ depots, loading, refreshDepots }}>
      {children}
    </DepotContext.Provider>
  )
}

export function useDepots() {
  const context = useContext(DepotContext)
  if (context === undefined) {
    throw new Error('useDepots must be used within a DepotProvider')
  }
  return context
}

