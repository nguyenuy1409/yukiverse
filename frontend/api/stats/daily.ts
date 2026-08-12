import type { VercelRequest, VercelResponse } from '@vercel/node'
import { supabase, PLATFORM } from '../lib/supabase.js'

const PLATFORM_NAME: Record<number, string> = {
  [PLATFORM.codeforces]: 'codeforces',
  [PLATFORM.atcoder]:    'atcoder',
  [PLATFORM.leetcode]:   'leetcode',
  [PLATFORM.github]:     'github',
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Cache-Control', 's-maxage=60, stale-while-revalidate=300')
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' })

  const days = Number(req.query.days) || 90
  const since = new Date(Date.now() - days * 86400000).toISOString().slice(0, 10)

  const { data, error } = await supabase
    .from('daily_activities')
    .select('date, platform_id, count')
    .gte('date', since)
    .order('date', { ascending: true })

  if (error) return res.status(500).json({ error: error.message })

  // Group by date, spread by platform
  const byDate: Record<string, any> = {}
  for (const row of data ?? []) {
    if (!byDate[row.date]) {
      byDate[row.date] = { date: row.date, codeforces: 0, atcoder: 0, leetcode: 0, github: 0 }
    }
    const name = PLATFORM_NAME[row.platform_id]
    if (name) byDate[row.date][name] = row.count
  }

  return res.status(200).json({ days: Object.values(byDate) })
}
