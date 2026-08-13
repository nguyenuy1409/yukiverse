/**
 * Consolidated stats handler — routes /api/stats/* internally.
 * Vercel rewrite: { "source": "/api/stats/:path*", "destination": "/api/stats" }
 */
import type { VercelRequest, VercelResponse } from '@vercel/node'
import { supabase, PLATFORM } from './lib/supabase.js'

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
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' })

  // Vercel rewrites preserve req.url — extract sub-path after /api/stats/
  const match = (req.url ?? '').match(/\/api\/stats\/?([^?]*)/)
  const sub = (match ? match[1] : '').replace(/\/$/, '')

  switch (sub) {
    case 'heatmap':     return handleHeatmap(req, res)
    case 'daily':       return handleDaily(req, res)
    case 'cumulative':  return handleCumulative(req, res)
    case 'rating':      return handleRating(req, res)
    case 'problems':    return handleProblems(req, res)
    case 'feed':        return handleFeed(req, res)
    case 'sync-status': return handleSyncStatus(req, res)
    default:            return res.status(404).json({ error: `Unknown stats route: ${sub}` })
  }
}

// ── /api/stats/heatmap ────────────────────────────────────────────────────────

async function handleHeatmap(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Cache-Control', 's-maxage=60, stale-while-revalidate=300')

  const days  = Number(req.query.days) || 365
  const since = new Date(Date.now() - days * 86400000).toISOString().slice(0, 10)

  const { data, error } = await supabase
    .from('daily_activities')
    .select('*')
    .gte('date', since)
    .order('date', { ascending: true })

  if (error) return res.status(500).json({ error: error.message })

  const totals: Record<string, number> = {}
  for (const row of data ?? []) {
    totals[row.date] = (totals[row.date] ?? 0) + (row.count ?? 0)
  }

  return res.status(200).json({ days: Object.entries(totals).map(([date, count]) => ({ date, count })) })
}

// ── /api/stats/daily ──────────────────────────────────────────────────────────

async function handleDaily(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Cache-Control', 's-maxage=60, stale-while-revalidate=300')

  const days  = Number(req.query.days) || 90
  const since = new Date(Date.now() - days * 86400000).toISOString().slice(0, 10)

  const { data, error } = await supabase
    .from('daily_activities')
    .select('*')
    .gte('date', since)
    .order('date', { ascending: true })

  if (error) return res.status(500).json({ error: error.message })

  const byDate: Record<string, any> = {}
  for (const row of data ?? []) {
    if (!byDate[row.date]) {
      byDate[row.date] = { date: row.date, codeforces: 0, atcoder: 0, leetcode: 0, github: 0 }
    }
    const name = PLATFORM_NAME[row.platform_id]
    if (name) byDate[row.date][name] = row.count ?? 0
  }

  return res.status(200).json({ days: Object.values(byDate) })
}

// ── /api/stats/cumulative ─────────────────────────────────────────────────────

async function handleCumulative(_req: VercelRequest, res: VercelResponse) {
  res.setHeader('Cache-Control', 's-maxage=60, stale-while-revalidate=300')

  const { data, error } = await supabase
    .from('daily_activities')
    .select('*')
    .order('date', { ascending: true })

  if (error) return res.status(500).json({ error: error.message })

  const byDate: Record<string, any> = {}
  for (const row of data ?? []) {
    if (!byDate[row.date]) {
      byDate[row.date] = { date: row.date, codeforces: 0, atcoder: 0, leetcode: 0, github: 0 }
    }
    const name = PLATFORM_NAME[row.platform_id]
    if (name) byDate[row.date][name] = row.count ?? 0
  }

  const sorted = Object.values(byDate).sort((a: any, b: any) => a.date.localeCompare(b.date))
  let cf = 0, ac = 0, lc = 0, gh = 0

  const result = sorted.map((d: any) => {
    cf += d.codeforces; ac += d.atcoder; lc += d.leetcode; gh += d.github
    return { date: d.date, codeforces: cf, atcoder: ac, leetcode: lc, github: gh, total: cf + ac + lc + gh }
  })

  return res.status(200).json({ days: result })
}

// ── /api/stats/rating ─────────────────────────────────────────────────────────

async function handleRating(_req: VercelRequest, res: VercelResponse) {
  res.setHeader('Cache-Control', 's-maxage=60, stale-while-revalidate=300')

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

// ── /api/stats/problems ───────────────────────────────────────────────────────

async function handleProblems(_req: VercelRequest, res: VercelResponse) {
  res.setHeader('Cache-Control', 's-maxage=60, stale-while-revalidate=300')

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

// ── /api/stats/feed ───────────────────────────────────────────────────────────

async function handleFeed(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Cache-Control', 's-maxage=60, stale-while-revalidate=300')

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

// ── /api/stats/sync-status ────────────────────────────────────────────────────

async function handleSyncStatus(_req: VercelRequest, res: VercelResponse) {
  res.setHeader('Cache-Control', 's-maxage=30, stale-while-revalidate=60')

  const { data, error } = await supabase
    .from('sync_logs')
    .select('platform_id, last_sync_at, status, error_message')
    .order('last_sync_at', { ascending: false })

  if (error) return res.status(500).json({ error: error.message })

  const latest: Record<number, any> = {}
  for (const row of data ?? []) {
    if (!latest[row.platform_id]) latest[row.platform_id] = row
  }

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
