/**
 * Master sync endpoint — called by Vercel Cron every hour.
 * Also callable manually via POST /api/sync (with Authorization header).
 */
import type { VercelRequest, VercelResponse } from '@vercel/node'

const BASE_URL = process.env.VERCEL_URL
  ? `https://${process.env.VERCEL_URL}`
  : 'http://localhost:3000'

async function callSync(path: string) {
  const res = await fetch(`${BASE_URL}${path}`, { method: 'POST' })
  const json = await res.json().catch(() => ({}))
  return { ok: res.ok, status: res.status, data: json }
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Allow Vercel Cron (no auth header) or manual calls with secret
  const authHeader = req.headers['authorization']
  const cronSecret = process.env.CRON_SECRET

  const isCron   = req.headers['x-vercel-cron'] === '1'
  const isManual = cronSecret && authHeader === `Bearer ${cronSecret}`

  if (!isCron && !isManual) {
    return res.status(401).json({ error: 'Unauthorized' })
  }

  const results = await Promise.allSettled([
    callSync('/api/sync-codeforces'),
    callSync('/api/sync-leetcode'),
    callSync('/api/sync-github'),
    callSync('/api/sync-atcoder'),
  ])

  const [cf, lc, gh, ac] = results.map(r =>
    r.status === 'fulfilled' ? r.value : { ok: false, error: (r as any).reason?.message },
  )

  return res.status(200).json({
    codeforces: cf,
    leetcode:   lc,
    github:     gh,
    atcoder:    ac,
  })
}
