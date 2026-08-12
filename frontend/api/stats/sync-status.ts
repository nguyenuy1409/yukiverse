import type { VercelRequest, VercelResponse } from '@vercel/node'
import { supabase, PLATFORM } from '../lib/supabase'

const PLATFORM_NAME: Record<number, string> = {
  [PLATFORM.codeforces]: 'codeforces',
  [PLATFORM.atcoder]:    'atcoder',
  [PLATFORM.leetcode]:   'leetcode',
  [PLATFORM.github]:     'github',
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Cache-Control', 's-maxage=30, stale-while-revalidate=60')
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' })

  const { data, error } = await supabase
    .from('sync_logs')
    .select('platform_id, last_sync_at, status, error_message')
    .order('last_sync_at', { ascending: false })

  if (error) return res.status(500).json({ error: error.message })

  // Keep only the latest log per platform
  const latest: Record<number, any> = {}
  for (const row of data ?? []) {
    if (!latest[row.platform_id]) latest[row.platform_id] = row
  }

  // Return all 4 platforms, even if never synced
  const platforms = [PLATFORM.codeforces, PLATFORM.atcoder, PLATFORM.leetcode, PLATFORM.github]
    .map(id => {
      const log = latest[id]
      return {
        platform:     PLATFORM_NAME[id],
        lastSyncAt:   log?.last_sync_at ?? null,
        status:       log?.status ?? 'never',
        errorMessage: log?.error_message ?? null,
      }
    })

  return res.status(200).json({ platforms })
}
