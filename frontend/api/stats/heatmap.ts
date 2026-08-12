import type { VercelRequest, VercelResponse } from '@vercel/node'
import { supabase } from '../lib/supabase.js'

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Cache-Control', 's-maxage=60, stale-while-revalidate=300')
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' })

  const days = Number(req.query.days) || 365
  const since = new Date(Date.now() - days * 86400000).toISOString().slice(0, 10)

  const { data, error } = await supabase
    .from('daily_activities')
    .select('date, count')
    .gte('date', since)
    .order('date', { ascending: true })

  if (error) return res.status(500).json({ error: error.message })

  // Sum all platforms per date
  const totals: Record<string, number> = {}
  for (const row of data ?? []) {
    totals[row.date] = (totals[row.date] ?? 0) + row.count
  }

  const result = Object.entries(totals).map(([date, count]) => ({ date, count }))

  return res.status(200).json({ days: result })
}
