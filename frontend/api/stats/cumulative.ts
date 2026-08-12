import type { VercelRequest, VercelResponse } from '@vercel/node'
import { supabase, PLATFORM } from '../lib/supabase'

const PLATFORM_NAME: Record<number, string> = {
  [PLATFORM.codeforces]: 'codeforces',
  [PLATFORM.atcoder]:    'atcoder',
  [PLATFORM.leetcode]:   'leetcode',
  [PLATFORM.github]:     'github',
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Cache-Control', 's-maxage=60, stale-while-revalidate=300')
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' })

  const { data, error } = await supabase
    .from('daily_activities')
    .select('date, platform_id, count')
    .order('date', { ascending: true })

  if (error) return res.status(500).json({ error: error.message })

  // Group by date
  const byDate: Record<string, any> = {}
  for (const row of data ?? []) {
    if (!byDate[row.date]) {
      byDate[row.date] = { date: row.date, codeforces: 0, atcoder: 0, leetcode: 0, github: 0 }
    }
    const name = PLATFORM_NAME[row.platform_id]
    if (name) byDate[row.date][name] = row.count
  }

  // Build cumulative running totals
  const sorted = Object.values(byDate).sort((a: any, b: any) => a.date.localeCompare(b.date))
  let cf = 0, ac = 0, lc = 0, gh = 0

  const result = sorted.map((d: any) => {
    cf += d.codeforces
    ac += d.atcoder
    lc += d.leetcode
    gh += d.github
    return {
      date:       d.date,
      codeforces: cf,
      atcoder:    ac,
      leetcode:   lc,
      github:     gh,
      total:      cf + ac + lc + gh,
    }
  })

  return res.status(200).json({ days: result })
}
