import type { VercelRequest, VercelResponse } from '@vercel/node'
import { supabase, PLATFORM, upsertDailyActivities, writeSyncLog } from './lib/supabase'

const CF_API = 'https://codeforces.com/api'

async function fetchSubmissions(handle: string) {
  const res = await fetch(`${CF_API}/user.status?handle=${encodeURIComponent(handle)}&from=1&count=10000`)
  const json = await res.json()
  if (json.status !== 'OK') throw new Error(`Codeforces API error: ${json.comment}`)
  return json.result as any[]
}

async function fetchRatingHistory(handle: string) {
  const res = await fetch(`${CF_API}/user.rating?handle=${encodeURIComponent(handle)}`)
  const json = await res.json()
  if (json.status !== 'OK') throw new Error(`Codeforces API error: ${json.comment}`)
  return json.result as any[]
}

function buildProblemTitle(problem: any): string {
  return problem.contestId
    ? `${problem.contestId}${problem.index} - ${problem.name}`
    : problem.name
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  const handle = process.env.CF_HANDLE
  if (!handle) return res.status(500).json({ error: 'CF_HANDLE not set' })

  const platformId = PLATFORM.codeforces

  try {
    // ── Submissions ──────────────────────────────────────────────────────────
    const submissions = await fetchSubmissions(handle)

    const { data: existingLogs } = await supabase
      .from('activity_logs')
      .select('external_id')
      .eq('platform_id', platformId)
      .not('external_id', 'is', null)

    const existingIds = new Set((existingLogs ?? []).map((l: any) => l.external_id))

    const newLogs = submissions
      .filter((s: any) => !existingIds.has(String(s.id)))
      .map((s: any) => ({
        platform_id: platformId,
        type:        'submission',
        title:       buildProblemTitle(s.problem),
        verdict:     s.verdict,
        external_id: String(s.id),
        occurred_at: new Date(s.creationTimeSeconds * 1000).toISOString(),
      }))

    if (newLogs.length > 0) {
      await supabase.from('activity_logs').insert(newLogs)
    }

    await upsertDailyActivities(platformId)

    // ── Problem stats ─────────────────────────────────────────────────────────
    const { data: allLogs } = await supabase
      .from('activity_logs')
      .select('title, verdict')
      .eq('platform_id', platformId)
      .eq('verdict', 'OK')

    const uniqueSolved = new Set((allLogs ?? []).map((l: any) => l.title))
    const totalSolved = uniqueSolved.size

    await supabase.from('problem_stats').upsert(
      { platform_id: platformId, total_solved: totalSolved, updated_at: new Date().toISOString() },
      { onConflict: 'platform_id' },
    )

    // ── Rating history ────────────────────────────────────────────────────────
    const ratingChanges = await fetchRatingHistory(handle)

    const { data: existingRatings } = await supabase
      .from('rating_history')
      .select('contest_name')
      .eq('platform_id', platformId)
      .not('contest_name', 'is', null)

    const existingContests = new Set((existingRatings ?? []).map((r: any) => r.contest_name))

    const newRatings = ratingChanges
      .filter((r: any) => !existingContests.has(r.contestName))
      .map((r: any) => ({
        platform_id:  platformId,
        contest_name: r.contestName,
        rating:       r.newRating,
        rank:         r.rank,
        date:         new Date(r.ratingUpdateTimeSeconds * 1000).toISOString(),
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
