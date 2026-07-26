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
// In production on Vercel, set VITE_API_BASE to the Railway backend URL.
const BASE = (import.meta.env.VITE_API_BASE ?? '') + '/api/stats'
const SYNC_BASE = (import.meta.env.VITE_API_BASE ?? '') + '/api/sync'

async function get<T>(path: string): Promise<T> {
  const res = await fetch(`${BASE}${path}`)
  if (!res.ok) throw new Error(`HTTP ${res.status}: ${res.statusText}`)
  return res.json() as Promise<T>
}

async function post<T>(url: string): Promise<T> {
  const res = await fetch(url, { method: 'POST' })
  if (!res.ok) throw new Error(`HTTP ${res.status}: ${res.statusText}`)
  return res.json() as Promise<T>
}

export const api = {
  heatmap:    (days = 365) => get<{ days: HeatmapDay[] }>(`/heatmap?days=${days}`),
  daily:      (days = 90)  => get<{ days: DailyActivity[] }>(`/daily?days=${days}`),
  cumulative: ()           => get<{ days: CumulativeActivity[] }>('/cumulative'),
  rating:     ()           => get<RatingHistory>('/rating'),
  problems:   ()           => get<{ platforms: PlatformStats[] }>('/problems'),
  feed:       (limit = 30) => get<{ items: FeedItem[] }>(`/feed?limit=${limit}`),
  syncStatus: ()           => get<{ platforms: SyncPlatformStatus[] }>('/sync-status'),

  sync: {
    all: () => Promise.allSettled([
      post(`${SYNC_BASE}/github`),
      post(`${SYNC_BASE}/codeforces`),
      post(`${SYNC_BASE}/atcoder`),
      post(`${SYNC_BASE}/leetcode/stats`),
      post(`${SYNC_BASE}/leetcode/submissions`),
    ]),
    github:     () => post(`${SYNC_BASE}/github`),
    codeforces: () => post(`${SYNC_BASE}/codeforces`),
    atcoder:    () => post(`${SYNC_BASE}/atcoder`),
    leetcode:   () => post(`${SYNC_BASE}/leetcode/stats`),
    leetcodeSubmissions: () => post(`${SYNC_BASE}/leetcode/submissions`),
  },
}
