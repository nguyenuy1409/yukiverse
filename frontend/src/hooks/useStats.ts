import { useState, useEffect, useCallback } from 'react'
import { api } from '../api/client'

// ---------------------------------------------------------------------------
// Generic fetch hook
// ---------------------------------------------------------------------------

interface FetchState<T> {
  data: T | null
  loading: boolean
  error: string | null
  refetch: () => void
}

function useFetch<T>(fetcher: () => Promise<T>): FetchState<T> {
  const [tick, setTick] = useState(0)
  const [state, setState] = useState<Omit<FetchState<T>, 'refetch'>>({
    data: null,
    loading: true,
    error: null,
  })

  useEffect(() => {
    let cancelled = false
    setState(s => ({ ...s, loading: true, error: null }))

    fetcher()
      .then(data => {
        if (!cancelled) setState({ data, loading: false, error: null })
      })
      .catch((err: unknown) => {
        if (!cancelled)
          setState({ data: null, loading: false, error: String(err) })
      })

    return () => {
      cancelled = true
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tick])

  const refetch = useCallback(() => setTick(t => t + 1), [])

  return { ...state, refetch }
}

// ---------------------------------------------------------------------------
// Typed hooks
// ---------------------------------------------------------------------------

export const useHeatmap    = (days = 365) => useFetch(() => api.heatmap(days))
export const useDaily      = (days = 90)  => useFetch(() => api.daily(days))
export const useCumulative = ()           => useFetch(api.cumulative)
export const useRating     = ()           => useFetch(api.rating)
export const useProblems   = ()           => useFetch(api.problems)
export const useFeed       = (limit = 30) => useFetch(() => api.feed(limit))
export const useSyncStatus = ()           => useFetch(api.syncStatus)
