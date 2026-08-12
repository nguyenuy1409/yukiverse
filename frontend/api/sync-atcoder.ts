import type { VercelRequest, VercelResponse } from '@vercel/node'
import { supabase, PLATFORM, upsertDailyActivities, writeSyncLog } from './lib/supabase'

const PAGE_SIZE = 500
const MAX_PAGES = 40

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  const handle = process.env.AC_HANDLE
  if (!handle) return res.status(500).json({ error: 'AC_HANDLE not set' })

  const platformId = PLATFORM.atcoder

  try {
    // ── Fetch all submissions from kenkoooo ───────────────────────────────────
    const allSubmissions: any[] = []
    let fromSecond = 0

    for (let page = 1; page <= MAX_PAGES; page++) {
      const res = await fetch(
        `https://kenkoooo.com/atcoder/atcoder-api/v3/user/submissions?user=${encodeURIComponent(handle)}&from_second=${fromSecond}`,
      )
      if (!res.ok) throw new Error(`AtCoder Problems API error: ${res.status}`)
      const batch: any[] = await res.json()
      if (!batch.length) break

      allSubmissions.push(...batch)
      if (batch.length < PAGE_SIZE) break

      fromSecond = batch[batch.length - 1].epoch_second + 1
    }

    // ── Upsert new activity_logs ──────────────────────────────────────────────
    const { data: existingLogs } = await supabase
      .from('activity_logs')
      .select('external_id')
      .eq('platform_id', platformId)
      .not('external_id', 'is', null)

    const existingIds = new Set((existingLogs ?? []).map((l: any) => l.external_id))

    const newLogs = allSubmissions
      .filter((s: any) => !existingIds.has(String(s.id)))
      .map((s: any) => ({
        platform_id: platformId,
        type:        'submission',
        title:       s.problem_id,
        verdict:     s.result,
        external_id: String(s.id),
        occurred_at: new Date(s.epoch_second * 1000).toISOString(),
      }))

    if (newLogs.length > 0) {
      await supabase.from('activity_logs').insert(newLogs)
    }

    await upsertDailyActivities(platformId)

    // ── Problem stats ─────────────────────────────────────────────────────────
    const { data: acLogs } = await supabase
      .from('activity_logs')
      .select('title, verdict')
      .eq('platform_id', platformId)
      .eq('verdict', 'AC')

    const totalSolved = new Set((acLogs ?? []).map((l: any) => l.title)).size

    await supabase.from('problem_stats').upsert(
      { platform_id: platformId, total_solved: totalSolved, updated_at: new Date().toISOString() },
      { onConflict: 'platform_id' },
    )

    // ── Rating history ────────────────────────────────────────────────────────
    const ratingRes = await fetch(
      `https://atcoder.jp/users/${encodeURIComponent(handle)}/history/json`,
    )
    const ratingChanges: any[] = ratingRes.ok ? await ratingRes.json() : []

    const { data: existingRatings } = await supabase
      .from('rating_history')
      .select('contest_name')
      .eq('platform_id', platformId)

    const existingContests = new Set((existingRatings ?? []).map((r: any) => r.contest_name))

    const newRatings = ratingChanges
      .filter((r: any) => !existingContests.has(r.ContestScreenName))
      .map((r: any) => ({
        platform_id:  platformId,
        contest_name: r.ContestScreenName,
        rating:       r.NewRating,
        rank:         r.Place,
        date:         new Date(r.EndTime).toISOString(),
      }))

    if (newRatings.length > 0) {
      await supabase.from('rating_history').insert(newRatings)
    }

    await writeSyncLog(platformId, 'success')

    return res.status(200).json({
      newSubmissions: newLogs.length,
      newRatings:     newRatings.length,
    })
  } catch (err: any) {
    await writeSyncLog(platformId, 'failed', err.message)
    return res.status(500).json({ error: err.message })
  }
}
