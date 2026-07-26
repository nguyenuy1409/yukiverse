import type {
  HeatmapDay,
  DailyActivity,
  CumulativeActivity,
  RatingHistory,
  PlatformStats,
  FeedItem,
  SyncPlatformStatus,
} from '../types'

// In development, Vite proxies /api -> http://localhost:5080 (no env var needed).
// In production on Vercel, set VITE_API_BASE to the Railway backend URL:
//   VITE_API_BASE=https://yukiverse-api.up.railway.app
const BASE = (import.meta.env.VITE_API_BASE ?? '') + '/api/stats'

async function get<T>(path: string): Promise<T> {
  const res = await fetch(`${BASE}${path}`)
  if (!res.ok) throw new Error(`HTTP ${res.status}: ${res.statusText}`)
  return res.json() as Promise<T>
}

export const api = {
  heatmap:    (days = 365) => get<{ days: HeatmapDay[] }>(`/heatmap?days=${days}`),
  daily:      (days = 90)  => get<{ days: DailyActivity[] }>(`/daily?days=${days}`),
  cumulative: ()           => get<{ days: CumulativeActivity[] }>('/cumulative'),
  rating:     ()           => get<RatingHistory>('/rating'),
  problems:   ()           => get<{ platforms: PlatformStats[] }>('/problems'),
  feed:       (limit = 20) => get<{ items: FeedItem[] }>(`/feed?limit=${limit}`),
  syncStatus: ()           => get<{ platforms: SyncPlatformStatus[] }>('/sync-status'),
}
