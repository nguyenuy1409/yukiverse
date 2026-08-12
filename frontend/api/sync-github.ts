import type { VercelRequest, VercelResponse } from '@vercel/node'
import { supabase, PLATFORM, upsertDailyActivities, writeSyncLog } from './lib/supabase'

const PAGE_SIZE = 100
const MAX_PAGES = 3

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  const username = process.env.GITHUB_USERNAME
  const token    = process.env.GITHUB_TOKEN // optional but recommended to avoid rate limit
  if (!username) return res.status(500).json({ error: 'GITHUB_USERNAME not set' })

  const platformId = PLATFORM.github

  try {
    // ── Fetch push events (up to 300) ────────────────────────────────────────
    const headers: Record<string, string> = {
      'User-Agent': 'YukiVerse',
      'Accept':     'application/vnd.github+json',
    }
    if (token) headers['Authorization'] = `Bearer ${token}`

    const events: any[] = []
    for (let page = 1; page <= MAX_PAGES; page++) {
      const res = await fetch(
        `https://api.github.com/users/${encodeURIComponent(username)}/events?per_page=${PAGE_SIZE}&page=${page}`,
        { headers },
      )
      if (!res.ok) throw new Error(`GitHub API error: ${res.status}`)
      const batch: any[] = await res.json()
      if (!batch.length) break

      events.push(...batch.filter((e: any) => e.type === 'PushEvent'))
      if (batch.length < PAGE_SIZE) break
    }

    // ── Upsert new activity_logs ──────────────────────────────────────────────
    const { data: existingLogs } = await supabase
      .from('activity_logs')
      .select('external_id')
      .eq('platform_id', platformId)
      .not('external_id', 'is', null)

    const existingIds = new Set((existingLogs ?? []).map((l: any) => l.external_id))

    const newLogs = events
      .filter((e: any) => !existingIds.has(e.id))
      .map((e: any) => ({
        platform_id: platformId,
        type:        'commit',
        title:       e.repo.name,
        verdict:     null,
        external_id: e.id,
        occurred_at: new Date(e.created_at).toISOString(),
      }))

    if (newLogs.length > 0) {
      await supabase.from('activity_logs').insert(newLogs)
    }

    await upsertDailyActivities(platformId)
    await writeSyncLog(platformId, 'success')

    return res.status(200).json({ newEvents: newLogs.length })
  } catch (err: any) {
    await writeSyncLog(platformId, 'failed', err.message)
    return res.status(500).json({ error: err.message })
  }
}
