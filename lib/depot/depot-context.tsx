"use client"

import { createContext, useContext, useState, useCallback, ReactNode } from "react"
import { getDepots, type Depot } from "@/lib/depot/actions"
import { toast } from "sonner"

interface DepotContextType {
  depots: Depot[]
  loading: boolean
  refreshDepots: () => Promise<void>
}

const DepotContext = createContext<DepotContextType | undefined>(undefined)

export function DepotProvider({ children }: { children: ReactNode }) {
  const [depots, setDepots] = useState<Depot[]>([])
  const [loading, setLoading] = useState(false)

  const refreshDepots = useCallback(async () => {
    setLoading(true)
    try {
      const result = await getDepots()
      if (result.data) {
        setDepots(result.data)
      } else if (result.error) {
        toast.error(result.error)
      }
    } catch (error) {
      toast.error('Failed to load depots')
    } finally {
      setLoading(false)
    }
  }, [])

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

