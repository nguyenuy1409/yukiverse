import type { VercelRequest, VercelResponse } from '@vercel/node'
import { supabase, PLATFORM } from '../lib/supabase.js'

const PLATFORM_NAME: Record<number, string> = {
  [PLATFORM.codeforces]: 'codeforces',
  [PLATFORM.atcoder]:    'atcoder',
  [PLATFORM.leetcode]:   'leetcode',
  [PLATFORM.github]:     'github',
}

const STAT_LABEL: Record<number, string | null> = {
  [PLATFORM.codeforces]: null,
  [PLATFORM.atcoder]:    null,
  [PLATFORM.leetcode]:   null,
  [PLATFORM.github]:     'push events',
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Cache-Control', 's-maxage=60, stale-while-revalidate=300')
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' })

  const { data, error } = await supabase
    .from('problem_stats')
    .select('platform_id, total_solved, easy_solved, medium_solved, hard_solved, updated_at')

  if (error) return res.status(500).json({ error: error.message })

  const platforms = (data ?? []).map(row => ({
    platform:     PLATFORM_NAME[row.platform_id] ?? String(row.platform_id),
    totalSolved:  row.total_solved,
    easySolved:   row.easy_solved,
    mediumSolved: row.medium_solved,
    hardSolved:   row.hard_solved,
    updatedAt:    row.updated_at,
    statLabel:    STAT_LABEL[row.platform_id] ?? null,
  }))

  return res.status(200).json({ platforms })
}
