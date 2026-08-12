import type { VercelRequest, VercelResponse } from '@vercel/node'
import { supabase } from './lib/supabase'

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Cache-Control', 's-maxage=60, stale-while-revalidate=300')

  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' })

  const limit = Number(req.query.limit) || 50

  const { data, error } = await supabase
    .from('activity_logs')
    .select('id, platform_id, type, title, verdict, occurred_at')
    .order('occurred_at', { ascending: false })
    .limit(limit)

  if (error) return res.status(500).json({ error: error.message })

  return res.status(200).json(data)
}
