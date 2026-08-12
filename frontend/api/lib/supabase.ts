import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.SUPABASE_URL!
const supabaseKey = process.env.SUPABASE_SERVICE_KEY!

export const supabase = createClient(supabaseUrl, supabaseKey)

// Platform IDs — matches seed data inserted in Bước 3
export const PLATFORM = {
  codeforces: 1,
  atcoder:    2,
  leetcode:   3,
  github:     4,
} as const

// Recalculate and upsert daily_activities for a platform
// by grouping activity_logs by date in JS
export async function upsertDailyActivities(platformId: number) {
  const { data: logs } = await supabase
    .from('activity_logs')
    .select('occurred_at')
    .eq('platform_id', platformId)

  if (!logs || logs.length === 0) return

  const counts: Record<string, number> = {}
  for (const log of logs) {
    const date = log.occurred_at.slice(0, 10) // 'YYYY-MM-DD'
    counts[date] = (counts[date] ?? 0) + 1
  }

  const rows = Object.entries(counts).map(([date, count]) => ({
    platform_id: platformId,
    date,
    count,
    updated_at: new Date().toISOString(),
  }))

  await supabase
    .from('daily_activities')
    .upsert(rows, { onConflict: 'platform_id,date' })
}

// Write a sync_log entry
export async function writeSyncLog(
  platformId: number,
  status: 'success' | 'failed',
  errorMessage?: string,
) {
  await supabase.from('sync_logs').insert({
    platform_id:   platformId,
    last_sync_at:  new Date().toISOString(),
    status,
    error_message: errorMessage ?? null,
  })
}
