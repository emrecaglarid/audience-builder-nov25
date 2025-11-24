/**
 * App Context - Global application state
 */

import { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { IndustrySchema, Customer, Audience } from '@/types'
import { IndustryId, IndustryData, loadIndustryData } from '@/utils/dataLoader'

interface AppContextType {
  currentIndustry: IndustryId
  setCurrentIndustry: (industryId: IndustryId) => void
  schema: IndustrySchema | null
  customers: Customer[]
  audiences: Audience[]
  setAudiences: (audiences: Audience[]) => void
  isLoading: boolean
  error: Error | null
}

const AppContext = createContext<AppContextType | undefined>(undefined)

export function AppProvider({ children }: { children: ReactNode }) {
  const [currentIndustry, setCurrentIndustry] = useState<IndustryId>('ecommerce')
  const [data, setData] = useState<IndustryData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  // Load industry data when currentIndustry changes
  useEffect(() => {
    let cancelled = false

    async function loadData() {
      setIsLoading(true)
      setError(null)

      try {
        const industryData = await loadIndustryData(currentIndustry)
        if (!cancelled) {
          setData(industryData)
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err : new Error('Failed to load data'))
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false)
        }
      }
    }

    loadData()

    return () => {
      cancelled = true
    }
  }, [currentIndustry])

  const setAudiences = (audiences: Audience[]) => {
    if (data) {
      setData({ ...data, audiences })
    }
  }

  const value: AppContextType = {
    currentIndustry,
    setCurrentIndustry,
    schema: data?.schema || null,
    customers: data?.customers || [],
    audiences: data?.audiences || [],
    setAudiences,
    isLoading,
    error,
  }

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>
}

export function useApp() {
  const context = useContext(AppContext)
  if (context === undefined) {
    throw new Error('useApp must be used within an AppProvider')
  }
  return context
}
