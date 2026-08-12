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

  const limit = Number(req.query.limit) || 30

  const { data, error } = await supabase
    .from('activity_logs')
    .select('platform_id, type, title, verdict, occurred_at')
    .order('occurred_at', { ascending: false })
    .limit(limit)

  if (error) return res.status(500).json({ error: error.message })

  const items = (data ?? []).map(row => ({
    platform:   PLATFORM_NAME[row.platform_id] ?? String(row.platform_id),
    type:       row.type,
    title:      row.title,
    verdict:    row.verdict,
    occurredAt: row.occurred_at,
  }))

  return res.status(200).json({ items })
}
