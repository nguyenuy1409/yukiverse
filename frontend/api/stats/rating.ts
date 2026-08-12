import type { VercelRequest, VercelResponse } from '@vercel/node'
import { supabase, PLATFORM } from '../lib/supabase'

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Cache-Control', 's-maxage=60, stale-while-revalidate=300')
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' })

  const { data, error } = await supabase
    .from('rating_history')
    .select('platform_id, contest_name, rating, rank, date')
    .in('platform_id', [PLATFORM.codeforces, PLATFORM.atcoder])
    .order('date', { ascending: true })

  if (error) return res.status(500).json({ error: error.message })

  const codeforces = (data ?? [])
    .filter(r => r.platform_id === PLATFORM.codeforces)
    .map(r => ({ date: r.date, rating: r.rating, rank: r.rank, contestName: r.contest_name }))

  const atcoder = (data ?? [])
    .filter(r => r.platform_id === PLATFORM.atcoder)
    .map(r => ({ date: r.date, rating: r.rating, rank: r.rank, contestName: r.contest_name }))

  return res.status(200).json({ codeforces, atcoder })
}
