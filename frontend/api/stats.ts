import type { VercelRequest, VercelResponse } from '@vercel/node'
import { supabase } from './lib/supabase'

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Cache-Control', 's-maxage=60, stale-while-revalidate=300')

  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' })

  const [statsResult, syncResult] = await Promise.all([
    supabase
      .from('problem_stats')
      .select('platform_id, total_solved, easy_solved, medium_solved, hard_solved, updated_at'),
    supabase
      .from('sync_logs')
      .select('platform_id, last_sync_at, status')
      .order('last_sync_at', { ascending: false }),
  ])

  if (statsResult.error) return res.status(500).json({ error: statsResult.error.message })

  // Keep only the most recent sync log per platform
  const latestSync: Record<number, any> = {}
  for (const log of syncResult.data ?? []) {
    if (!latestSync[log.platform_id]) latestSync[log.platform_id] = log
  }

  return res.status(200).json({
    stats:    statsResult.data,
    syncLogs: Object.values(latestSync),
  })
}
