import type { VercelRequest, VercelResponse } from '@vercel/node'
import { supabase, PLATFORM, upsertDailyActivities, writeSyncLog } from './lib/supabase.js'

const GRAPHQL_ENDPOINT = 'https://leetcode.com/graphql'

const USER_STATS_QUERY = `
  query getUserStats($username: String!) {
    matchedUser(username: $username) {
      submitStats {
        acSubmissionNum {
          difficulty
          count
        }
      }
    }
  }
`

const SUBMISSION_LIST_QUERY = `
  query submissionList($offset: Int!, $limit: Int!) {
    submissionList(offset: $offset, limit: $limit) {
      hasNext
      submissions {
        id
        title
        statusDisplay
        timestamp
      }
    }
  }
`

const PAGE_SIZE = 20
const MAX_PAGES = 50

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  const username      = process.env.LC_USERNAME
  const sessionCookie = process.env.LC_SESSION_COOKIE

  if (!username) return res.status(500).json({ error: 'LC_USERNAME not set' })

  const platformId = PLATFORM.leetcode

  try {
    // ── Problem stats (public, no cookie needed) ──────────────────────────────
    const statsRes = await fetch(GRAPHQL_ENDPOINT, {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ query: USER_STATS_QUERY, variables: { username } }),
    })
    const statsJson = await statsRes.json()
    const counts    = statsJson?.data?.matchedUser?.submitStats?.acSubmissionNum

    if (!counts) throw new Error(`LeetCode user '${username}' not found or has no stats`)

    const get = (difficulty: string) =>
      counts.find((c: any) => c.difficulty === difficulty)?.count ?? 0

    await supabase.from('problem_stats').upsert(
      {
        platform_id:   platformId,
        total_solved:  get('All'),
        easy_solved:   get('Easy'),
        medium_solved: get('Medium'),
        hard_solved:   get('Hard'),
        updated_at:    new Date().toISOString(),
      },
      { onConflict: 'platform_id' },
    )

    // ── Submission history (requires session cookie) ───────────────────────────
    let newSubmissions = 0

    if (sessionCookie) {
      const { data: existingLogs } = await supabase
        .from('activity_logs')
        .select('external_id')
        .eq('platform_id', platformId)
        .not('external_id', 'is', null)

      const existingIds = new Set((existingLogs ?? []).map((l: any) => l.external_id))

      const allSubmissions: any[] = []

      for (let page = 0; page < MAX_PAGES; page++) {
        const offset = page * PAGE_SIZE

        const r = await fetch(GRAPHQL_ENDPOINT, {
          method:  'POST',
          headers: {
            'Content-Type': 'application/json',
            'Cookie':       `LEETCODE_SESSION=${sessionCookie}`,
          },
          body: JSON.stringify({
            query:     SUBMISSION_LIST_QUERY,
            variables: { offset, limit: PAGE_SIZE },
          }),
        })

        const json     = await r.json()
        const listData = json?.data?.submissionList

        // null submissionList = session expired
        if (!listData) {
          console.warn('LC_SESSION_COOKIE may be expired — submission sync skipped')
          break
        }

        allSubmissions.push(...listData.submissions)
        if (!listData.hasNext) break
      }

      const newLogs = allSubmissions
        .filter((s: any) => !existingIds.has(String(s.id)))
        .map((s: any) => ({
          platform_id: platformId,
          type:        'submission',
          title:       s.title,
          verdict:     s.statusDisplay,
          external_id: String(s.id),
          occurred_at: new Date(Number(s.timestamp) * 1000).toISOString(),
        }))

      if (newLogs.length > 0) {
        await supabase.from('activity_logs').insert(newLogs)
        await upsertDailyActivities(platformId)
      }

      newSubmissions = newLogs.length
    }

    await writeSyncLog(platformId, 'success')

    return res.status(200).json({
      total:          get('All'),
      easy:           get('Easy'),
      medium:         get('Medium'),
      hard:           get('Hard'),
      newSubmissions,
    })
  } catch (err: any) {
    await writeSyncLog(platformId, 'failed', err.message)
    return res.status(500).json({ error: err.message })
  }
}
