import { useState, useEffect } from 'react'
import { api } from '../api/client'

// ---------------------------------------------------------------------------
// Generic fetch hook
// ---------------------------------------------------------------------------

interface FetchState<T> {
  data: T | null
  loading: boolean
  error: string | null
}

function useFetch<T>(fetcher: () => Promise<T>): FetchState<T> {
  const [state, setState] = useState<FetchState<T>>({
    data: null,
    loading: true,
    error: null,
  })

  useEffect(() => {
    let cancelled = false
    setState({ data: null, loading: true, error: null })

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
    // Each specific hook below passes a stable arrow function scoped to its params,
    // so the empty dep array is intentional here.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return state
}

// ---------------------------------------------------------------------------
// Typed hooks
// ---------------------------------------------------------------------------

export const useHeatmap    = (days = 365) => useFetch(() => api.heatmap(days))
export const useDaily      = (days = 90)  => useFetch(() => api.daily(days))
export const useCumulative = ()           => useFetch(api.cumulative)
export const useRating     = ()           => useFetch(api.rating)
export const useProblems   = ()           => useFetch(api.problems)
export const useFeed       = (limit = 20) => useFetch(() => api.feed(limit))
export const useSyncStatus = ()           => useFetch(api.syncStatus)
