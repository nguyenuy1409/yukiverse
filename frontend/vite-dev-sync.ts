/**
 * Sync logic dùng cho Vite dev middleware (local) — mirror của các Vercel functions.
 */
import { SupabaseClient } from '@supabase/supabase-js'

const PLATFORM = { codeforces: 1, atcoder: 2, leetcode: 3, github: 4 } as const
const PLATFORM_NAME: Record<number, string> = { 1: 'codeforces', 2: 'atcoder', 3: 'leetcode', 4: 'github' }

async function upsertDailyActivities(sb: SupabaseClient, platformId: number) {
  const { data: logs } = await sb.from('activity_logs').select('occurred_at').eq('platform_id', platformId)
  if (!logs?.length) return
  const counts: Record<string, number> = {}
  for (const log of logs) counts[log.occurred_at.slice(0, 10)] = (counts[log.occurred_at.slice(0, 10)] ?? 0) + 1
  const rows = Object.entries(counts).map(([date, count]) => ({ platform_id: platformId, date, count, updated_at: new Date().toISOString() }))
  await sb.from('daily_activities').upsert(rows, { onConflict: 'platform_id,date' })
}

async function writeSyncLog(sb: SupabaseClient, platformId: number, status: 'success' | 'failed', errorMessage?: string) {
  await sb.from('sync_logs').insert({ platform_id: platformId, last_sync_at: new Date().toISOString(), status, error_message: errorMessage ?? null })
}

// ── Codeforces ────────────────────────────────────────────────────────────────

export async function syncCodeforces(sb: SupabaseClient, handle: string) {
  const platformId = PLATFORM.codeforces
  try {
    // Submissions
    const cfSub = await fetch(`https://codeforces.com/api/user.status?handle=${encodeURIComponent(handle)}&from=1&count=10000`)
    const cfSubJson = await cfSub.json()
    if (cfSubJson.status !== 'OK') throw new Error(`CF API: ${cfSubJson.comment}`)
    const submissions: any[] = cfSubJson.result

    const { data: existing } = await sb.from('activity_logs').select('external_id').eq('platform_id', platformId).not('external_id', 'is', null)
    const existingIds = new Set((existing ?? []).map((l: any) => l.external_id))

    const newLogs = submissions.filter(s => !existingIds.has(String(s.id))).map(s => ({
      platform_id: platformId,
      type: 'submission',
      title: s.problem.contestId ? `${s.problem.contestId}${s.problem.index} - ${s.problem.name}` : s.problem.name,
      verdict: s.verdict,
      external_id: String(s.id),
      occurred_at: new Date(s.creationTimeSeconds * 1000).toISOString(),
    }))
    if (newLogs.length > 0) await sb.from('activity_logs').insert(newLogs)

    await upsertDailyActivities(sb, platformId)

    // Problem stats
    const { data: acLogs } = await sb.from('activity_logs').select('title').eq('platform_id', platformId).eq('verdict', 'OK')
    const totalSolved = new Set((acLogs ?? []).map((l: any) => l.title)).size
    await sb.from('problem_stats').upsert({ platform_id: platformId, total_solved: totalSolved, updated_at: new Date().toISOString() }, { onConflict: 'platform_id' })

    // Rating history
    const cfRating = await fetch(`https://codeforces.com/api/user.rating?handle=${encodeURIComponent(handle)}`)
    const cfRatingJson = await cfRating.json()
    if (cfRatingJson.status !== 'OK') throw new Error(`CF API: ${cfRatingJson.comment}`)
    const { data: existingRatings } = await sb.from('rating_history').select('contest_name').eq('platform_id', platformId).not('contest_name', 'is', null)
    const existingContests = new Set((existingRatings ?? []).map((r: any) => r.contest_name))
    const newRatings = cfRatingJson.result.filter((r: any) => !existingContests.has(r.contestName)).map((r: any) => ({
      platform_id: platformId, contest_name: r.contestName, rating: r.newRating, rank: r.rank,
      date: new Date(r.ratingUpdateTimeSeconds * 1000).toISOString(),
    }))
    if (newRatings.length > 0) await sb.from('rating_history').insert(newRatings)

    await writeSyncLog(sb, platformId, 'success')
    return { ok: true, newSubmissions: newLogs.length, newRatings: newRatings.length }
  } catch (err: any) {
    await writeSyncLog(sb, platformId, 'failed', err.message)
    return { ok: false, error: err.message }
  }
}

// ── LeetCode stats ─────────────────────────────────────────────────────────────

export async function syncLeetcodeStats(sb: SupabaseClient, username: string) {
  const platformId = PLATFORM.leetcode
  try {
    const r = await fetch('https://leetcode.com/graphql', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query: `query getUserStats($username: String!) { matchedUser(username: $username) { submitStats { acSubmissionNum { difficulty count } } } }`, variables: { username } }),
    })
    const json = await r.json()
    const counts = json?.data?.matchedUser?.submitStats?.acSubmissionNum
    if (!counts) throw new Error(`LeetCode user '${username}' not found`)
    const get = (d: string) => counts.find((c: any) => c.difficulty === d)?.count ?? 0
    await sb.from('problem_stats').upsert({
      platform_id: platformId, total_solved: get('All'), easy_solved: get('Easy'),
      medium_solved: get('Medium'), hard_solved: get('Hard'), updated_at: new Date().toISOString(),
    }, { onConflict: 'platform_id' })
    await writeSyncLog(sb, platformId, 'success')
    return { ok: true, total: get('All') }
  } catch (err: any) {
    await writeSyncLog(sb, platformId, 'failed', err.message)
    return { ok: false, error: err.message }
  }
}

// ── LeetCode submissions ───────────────────────────────────────────────────────

export async function syncLeetcodeSubmissions(sb: SupabaseClient, sessionCookie: string) {
  const platformId = PLATFORM.leetcode
  try {
    const { data: existing } = await sb.from('activity_logs').select('external_id').eq('platform_id', platformId).not('external_id', 'is', null)
    const existingIds = new Set((existing ?? []).map((l: any) => l.external_id))
    const allSubs: any[] = []
    for (let page = 0; page < 50; page++) {
      const r = await fetch('https://leetcode.com/graphql', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Cookie': `LEETCODE_SESSION=${sessionCookie}` },
        body: JSON.stringify({ query: `query submissionList($offset: Int!, $limit: Int!) { submissionList(offset: $offset, limit: $limit) { hasNext submissions { id title statusDisplay timestamp } } }`, variables: { offset: page * 20, limit: 20 } }),
      })
      const json = await r.json()
      const list = json?.data?.submissionList
      if (!list) break
      allSubs.push(...list.submissions)
      if (!list.hasNext) break
    }
    const newLogs = allSubs.filter(s => !existingIds.has(String(s.id))).map(s => ({
      platform_id: platformId, type: 'submission', title: s.title, verdict: s.statusDisplay,
      external_id: String(s.id), occurred_at: new Date(Number(s.timestamp) * 1000).toISOString(),
    }))
    if (newLogs.length > 0) {
      await sb.from('activity_logs').insert(newLogs)
      await upsertDailyActivities(sb, platformId)
    }
    return { ok: true, newSubmissions: newLogs.length }
  } catch (err: any) {
    return { ok: false, error: err.message }
  }
}

// ── GitHub ────────────────────────────────────────────────────────────────────

export async function syncGitHub(sb: SupabaseClient, username: string, token?: string) {
  const platformId = PLATFORM.github
  try {
    const headers: Record<string, string> = { 'User-Agent': 'YukiVerse', 'Accept': 'application/vnd.github+json' }
    if (token) headers['Authorization'] = `Bearer ${token}`
    const events: any[] = []
    for (let page = 1; page <= 3; page++) {
      const r = await fetch(`https://api.github.com/users/${encodeURIComponent(username)}/events?per_page=100&page=${page}`, { headers })
      if (!r.ok) break
      const batch: any[] = await r.json()
      if (!batch.length) break
      events.push(...batch.filter(e => e.type === 'PushEvent'))
      if (batch.length < 100) break
    }
    const { data: existing } = await sb.from('activity_logs').select('external_id').eq('platform_id', platformId).not('external_id', 'is', null)
    const existingIds = new Set((existing ?? []).map((l: any) => l.external_id))
    const newLogs = events.filter(e => !existingIds.has(e.id)).map(e => ({
      platform_id: platformId, type: 'commit', title: e.repo.name, verdict: null,
      external_id: e.id, occurred_at: new Date(e.created_at).toISOString(),
    }))
    if (newLogs.length > 0) await sb.from('activity_logs').insert(newLogs)
    await upsertDailyActivities(sb, platformId)
    await writeSyncLog(sb, platformId, 'success')
    return { ok: true, newEvents: newLogs.length }
  } catch (err: any) {
    await writeSyncLog(sb, platformId, 'failed', err.message)
    return { ok: false, error: err.message }
  }
}

// ── AtCoder ───────────────────────────────────────────────────────────────────

export async function syncAtCoder(sb: SupabaseClient, handle: string) {
  const platformId = PLATFORM.atcoder
  try {
    const allSubs: any[] = []
    let fromSecond = 0
    for (let page = 0; page < 40; page++) {
      const r = await fetch(`https://kenkoooo.com/atcoder/atcoder-api/v3/user/submissions?user=${encodeURIComponent(handle)}&from_second=${fromSecond}`)
      if (!r.ok) break
      const batch: any[] = await r.json()
      if (!batch.length) break
      allSubs.push(...batch)
      if (batch.length < 500) break
      fromSecond = batch[batch.length - 1].epoch_second + 1
    }
    const { data: existing } = await sb.from('activity_logs').select('external_id').eq('platform_id', platformId).not('external_id', 'is', null)
    const existingIds = new Set((existing ?? []).map((l: any) => l.external_id))
    const newLogs = allSubs.filter(s => !existingIds.has(String(s.id))).map(s => ({
      platform_id: platformId, type: 'submission', title: s.problem_id, verdict: s.result,
      external_id: String(s.id), occurred_at: new Date(s.epoch_second * 1000).toISOString(),
    }))
    if (newLogs.length > 0) await sb.from('activity_logs').insert(newLogs)
    await upsertDailyActivities(sb, platformId)
    const { data: acLogs } = await sb.from('activity_logs').select('title').eq('platform_id', platformId).eq('verdict', 'AC')
    const totalSolved = new Set((acLogs ?? []).map((l: any) => l.title)).size
    await sb.from('problem_stats').upsert({ platform_id: platformId, total_solved: totalSolved, updated_at: new Date().toISOString() }, { onConflict: 'platform_id' })
    const ratingRes = await fetch(`https://atcoder.jp/users/${encodeURIComponent(handle)}/history/json`)
    const ratingChanges: any[] = ratingRes.ok ? await ratingRes.json() : []
    const { data: existingRatings } = await sb.from('rating_history').select('contest_name').eq('platform_id', platformId)
    const existingContests = new Set((existingRatings ?? []).map((r: any) => r.contest_name))
    const newRatings = ratingChanges.filter(r => !existingContests.has(r.ContestScreenName)).map(r => ({
      platform_id: platformId, contest_name: r.ContestScreenName, rating: r.NewRating,
      rank: r.Place, date: new Date(r.EndTime).toISOString(),
    }))
    if (newRatings.length > 0) await sb.from('rating_history').insert(newRatings)
    await writeSyncLog(sb, platformId, 'success')
    return { ok: true, newSubmissions: newLogs.length, newRatings: newRatings.length }
  } catch (err: any) {
    await writeSyncLog(sb, platformId, 'failed', err.message)
    return { ok: false, error: err.message }
  }
}
