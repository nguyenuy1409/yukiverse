// ---------------------------------------------------------------------------
// API response shapes matching StatsController endpoints
// ---------------------------------------------------------------------------

export interface HeatmapDay {
  date: string   // "2025-06-15"
  count: number
}

export interface DailyActivity {
  date: string
  codeforces: number
  atcoder: number
  leetcode: number
  github: number
}

export interface CumulativeActivity extends DailyActivity {
  total: number
}

export interface RatingEntry {
  date: string
  rating: number
  rank: string | null
  contestName: string | null
}

export interface RatingHistory {
  codeforces: RatingEntry[]
  atcoder: RatingEntry[]
}

export interface PlatformStats {
  platform: string
  totalSolved: number
  easySolved: number
  mediumSolved: number
  hardSolved: number
  updatedAt: string
  statLabel: string | null   // e.g. "push events" for GitHub
}

export interface FeedItem {
  platform: string
  type: string
  title: string
  verdict: string | null
  occurredAt: string
}

export interface SyncPlatformStatus {
  platform: string
  lastSyncAt: string | null
  status: string         // "success" | "failed" | "needs_refresh" | "never"
  errorMessage: string | null
}

// ---------------------------------------------------------------------------
// UI constants
// ---------------------------------------------------------------------------

export const PLATFORM_COLORS: Record<string, string> = {
  codeforces: '#3B82F6',
  atcoder:    '#F97316',
  leetcode:   '#EAB308',
  github:     '#22C55E',
}

export const PLATFORM_LABELS: Record<string, string> = {
  codeforces: 'Codeforces',
  atcoder:    'AtCoder',
  leetcode:   'LeetCode',
  github:     'GitHub',
}

export const PLATFORM_PROFILES: Record<string, string> = {
  codeforces: 'https://codeforces.com/profile/uykhongvui1409',
  atcoder:    'https://atcoder.jp/users/uyhaihuoc1409',
  leetcode:   'https://leetcode.com/u/DsQxgIqW',
  github:     'https://github.com/nguyenuy1409',
}
