import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import { createClient } from '@supabase/supabase-js'
import { syncCodeforces, syncLeetcodeStats, syncLeetcodeSubmissions, syncGitHub, syncAtCoder } from './vite-dev-sync'

// ── Notion helpers ─────────────────────────────────────────────────────────────

const NOTION_API_BASE    = 'https://api.notion.com/v1'
const NOTION_API_VERSION = '2022-06-28'

function richText(field: any): string {
  return field?.rich_text?.[0]?.plain_text ?? ''
}

function formatDate(iso: string): string {
  const d       = new Date(iso)
  const diffMs  = Date.now() - d.getTime()
  const diffH   = Math.floor(diffMs / 3_600_000)
  const diffMin = Math.floor(diffMs / 60_000)
  if (diffMin < 2)  return 'just now'
  if (diffMin < 60) return `${diffMin} minutes ago`
  if (diffH === 1)  return '1 hour ago'
  if (diffH < 24)   return `${diffH} hours ago`
  if (diffH < 48)   return 'Yesterday'
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

// ── Constants ──────────────────────────────────────────────────────────────────

const PLATFORM_NAME: Record<number, string> = {
  1: 'codeforces', 2: 'atcoder', 3: 'leetcode', 4: 'github',
}

function jsonRes(res: any, status: number, body: unknown) {
  res.statusCode = status
  res.setHeader('Content-Type', 'application/json')
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.end(JSON.stringify(body))
}

let _notionCache: { data: string; ts: number } | null = null
const CACHE_TTL = 60_000

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')

  const supabaseUrl = env.SUPABASE_URL?.trim().replace(/\/$/, '')
  const serviceKey  = env.SUPABASE_SERVICE_KEY?.trim()
  const sb = supabaseUrl && serviceKey
    ? createClient(supabaseUrl, serviceKey, {
        auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
      })
    : null

  return {
    plugins: [
      react(),
      {
        name: 'dev-api',
        configureServer(server) {

          // ── /api/test ──────────────────────────────────────────────────────
          server.middlewares.use('/api/test', async (req: any, res: any) => {
            console.log('[test] supabaseUrl:', JSON.stringify(supabaseUrl))
            console.log('[test] serviceKey length:', serviceKey?.length)
            if (!sb) { jsonRes(res, 500, { error: 'sb is null — check SUPABASE_URL and SUPABASE_SERVICE_KEY in .env.local' }); return }
            const { data, error } = await sb.from('platforms').select('*')
            console.log('[test] data:', data, 'error:', error)
            jsonRes(res, 200, { data, error, supabaseUrl })
          })

          // ── /api/progress (Notion) ─────────────────────────────────────────
          server.middlewares.use('/api/progress', async (req: any, res: any) => {
            if (req.method === 'OPTIONS') { res.statusCode = 200; res.end(); return }
            if (req.method !== 'GET')     { jsonRes(res, 405, { error: 'Method not allowed' }); return }
            const apiKey = env.NOTION_API_KEY
            const dbId   = env.NOTION_PROGRESS_DATABASE_ID
            if (!apiKey || !dbId) { jsonRes(res, 500, { error: 'Missing Notion credentials in .env.local' }); return }
            if (_notionCache && Date.now() - _notionCache.ts < CACHE_TTL) {
              res.setHeader('Content-Type', 'application/json')
              res.setHeader('Access-Control-Allow-Origin', '*')
              res.statusCode = 200
              res.end(_notionCache.data)
              return
            }
            try {
              const notionRes = await fetch(`${NOTION_API_BASE}/databases/${dbId}/query`, {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${apiKey}`, 'Notion-Version': NOTION_API_VERSION, 'Content-Type': 'application/json' },
                body: JSON.stringify({ sorts: [{ property: 'Status', direction: 'ascending' }] }),
              })
              if (!notionRes.ok) {
                const errBody: any = await notionRes.json().catch(() => ({}))
                throw new Error(errBody.message ?? `Notion API returned ${notionRes.status}`)
              }
              const data: any = await notionRes.json()
              const items = (data.results ?? []).map((page: any) => {
                const props = page.properties
                const currentPages = props['Current (Pages)']?.number ?? 0
                const targetPages  = props['Target (Pages)']?.number  ?? 1
                const formulaValue = props['Progress %']?.formula?.number
                const progressPct  = formulaValue != null ? Math.round(formulaValue) : Math.min(100, Math.round((currentPages / targetPages) * 100))
                return { id: page.id, title: props.Title?.title?.[0]?.plain_text ?? 'Untitled', current_pages: currentPages, target_pages: targetPages, scope: richText(props['Scope']), status: props['Status']?.select?.name ?? 'Next Up', progress_percent: progressPct, last_updated: formatDate(page.last_edited_time) }
              })
              const payload = JSON.stringify(items)
              _notionCache = { data: payload, ts: Date.now() }
              jsonRes(res, 200, items)
            } catch (err: any) {
              jsonRes(res, 500, { error: err?.message ?? 'Failed to fetch from Notion' })
            }
          })

          // ── /api/stats/heatmap ─────────────────────────────────────────────
          server.middlewares.use('/api/stats/heatmap', async (req: any, res: any) => {
            if (!sb) { jsonRes(res, 500, { error: 'Missing SUPABASE_URL or SUPABASE_SERVICE_KEY in .env.local' }); return }
            try {
              const url  = new URL(req.url, 'http://localhost')
              const days = Number(url.searchParams.get('days')) || 365
              const since = new Date(Date.now() - days * 86400000).toISOString().slice(0, 10)
              const { data, error } = await sb.from('daily_activities').select('*').gte('date', since).order('date')
              if (error) throw new Error(error.message)
              const totals: Record<string, number> = {}
              for (const row of data ?? []) totals[row.date] = (totals[row.date] ?? 0) + row.count
              jsonRes(res, 200, { days: Object.entries(totals).map(([date, count]) => ({ date, count })) })
            } catch (err: any) { jsonRes(res, 500, { error: err.message }) }
          })

          // ── /api/stats/daily ───────────────────────────────────────────────
          server.middlewares.use('/api/stats/daily', async (req: any, res: any) => {
            if (!sb) { jsonRes(res, 500, { error: 'Missing Supabase credentials' }); return }
            try {
              const url  = new URL(req.url, 'http://localhost')
              const days = Number(url.searchParams.get('days')) || 90
              const since = new Date(Date.now() - days * 86400000).toISOString().slice(0, 10)
              const { data, error } = await sb.from('daily_activities').select('*').gte('date', since).order('date')
              if (error) throw new Error(error.message)
              const byDate: Record<string, any> = {}
              for (const row of data ?? []) {
                if (!byDate[row.date]) byDate[row.date] = { date: row.date, codeforces: 0, atcoder: 0, leetcode: 0, github: 0 }
                const name = PLATFORM_NAME[row.platform_id]
                if (name) byDate[row.date][name] = row.count
              }
              jsonRes(res, 200, { days: Object.values(byDate) })
            } catch (err: any) { jsonRes(res, 500, { error: err.message }) }
          })

          // ── /api/stats/cumulative ──────────────────────────────────────────
          server.middlewares.use('/api/stats/cumulative', async (req: any, res: any) => {
            if (!sb) { jsonRes(res, 500, { error: 'Missing Supabase credentials' }); return }
            try {
              const { data, error } = await sb.from('daily_activities').select('*').order('date')
              if (error) throw new Error(error.message)
              const byDate: Record<string, any> = {}
              for (const row of data ?? []) {
                if (!byDate[row.date]) byDate[row.date] = { date: row.date, codeforces: 0, atcoder: 0, leetcode: 0, github: 0 }
                const name = PLATFORM_NAME[row.platform_id]
                if (name) byDate[row.date][name] = row.count
              }
              const sorted = Object.values(byDate).sort((a: any, b: any) => a.date.localeCompare(b.date))
              let cf = 0, ac = 0, lc = 0, gh = 0
              const result = sorted.map((d: any) => {
                cf += d.codeforces; ac += d.atcoder; lc += d.leetcode; gh += d.github
                return { date: d.date, codeforces: cf, atcoder: ac, leetcode: lc, github: gh, total: cf + ac + lc + gh }
              })
              jsonRes(res, 200, { days: result })
            } catch (err: any) { jsonRes(res, 500, { error: err.message }) }
          })

          // ── /api/stats/rating ──────────────────────────────────────────────
          server.middlewares.use('/api/stats/rating', async (req: any, res: any) => {
            if (!sb) { jsonRes(res, 500, { error: 'Missing Supabase credentials' }); return }
            try {
              const { data, error } = await sb.from('rating_history').select('*').in('platform_id', [1, 2]).order('date')
              if (error) throw new Error(error.message)
              const codeforces = (data ?? []).filter(r => r.platform_id === 1).map(r => ({ date: r.date, rating: r.rating, rank: r.rank, contestName: r.contest_name }))
              const atcoder    = (data ?? []).filter(r => r.platform_id === 2).map(r => ({ date: r.date, rating: r.rating, rank: r.rank, contestName: r.contest_name }))
              jsonRes(res, 200, { codeforces, atcoder })
            } catch (err: any) { jsonRes(res, 500, { error: err.message }) }
          })

          // ── /api/stats/problems ────────────────────────────────────────────
          server.middlewares.use('/api/stats/problems', async (req: any, res: any) => {
            if (!sb) { jsonRes(res, 500, { error: 'Missing Supabase credentials' }); return }
            try {
              const { data, error } = await sb.from('problem_stats').select('*')
              if (error) throw new Error(error.message)
              const STAT_LABEL: Record<number, string | null> = { 1: null, 2: null, 3: null, 4: 'push events' }
              const platforms = (data ?? []).map(row => ({
                platform: PLATFORM_NAME[row.platform_id] ?? String(row.platform_id),
                totalSolved: row.total_solved, easySolved: row.easy_solved,
                mediumSolved: row.medium_solved, hardSolved: row.hard_solved,
                updatedAt: row.updated_at, statLabel: STAT_LABEL[row.platform_id] ?? null,
              }))
              jsonRes(res, 200, { platforms })
            } catch (err: any) { jsonRes(res, 500, { error: err.message }) }
          })

          // ── /api/stats/feed ────────────────────────────────────────────────
          server.middlewares.use('/api/stats/feed', async (req: any, res: any) => {
            if (!sb) { jsonRes(res, 500, { error: 'Missing Supabase credentials' }); return }
            try {
              const url   = new URL(req.url, 'http://localhost')
              const limit = Number(url.searchParams.get('limit')) || 30
              const { data, error } = await sb.from('activity_logs').select('*').order('occurred_at', { ascending: false }).limit(limit)
              if (error) throw new Error(error.message)
              const items = (data ?? []).map(row => ({
                platform: PLATFORM_NAME[row.platform_id] ?? String(row.platform_id),
                type: row.type, title: row.title, verdict: row.verdict, occurredAt: row.occurred_at,
              }))
              jsonRes(res, 200, { items })
            } catch (err: any) { jsonRes(res, 500, { error: err.message }) }
          })

          // ── Sync endpoints ─────────────────────────────────────────────────
          server.middlewares.use('/api/sync/codeforces', async (req: any, res: any) => {
            if (req.method !== 'POST') { jsonRes(res, 405, { error: 'Method not allowed' }); return }
            if (!sb) { jsonRes(res, 500, { error: 'Missing Supabase credentials' }); return }
            const result = await syncCodeforces(sb, env.CF_HANDLE ?? '')
            jsonRes(res, result.ok ? 200 : 500, result)
          })

          server.middlewares.use('/api/sync/leetcode/stats', async (req: any, res: any) => {
            if (req.method !== 'POST') { jsonRes(res, 405, { error: 'Method not allowed' }); return }
            if (!sb) { jsonRes(res, 500, { error: 'Missing Supabase credentials' }); return }
            const result = await syncLeetcodeStats(sb, env.LC_USERNAME ?? '')
            jsonRes(res, result.ok ? 200 : 500, result)
          })

          server.middlewares.use('/api/sync/leetcode/submissions', async (req: any, res: any) => {
            if (req.method !== 'POST') { jsonRes(res, 405, { error: 'Method not allowed' }); return }
            if (!sb) { jsonRes(res, 500, { error: 'Missing Supabase credentials' }); return }
            const result = await syncLeetcodeSubmissions(sb, env.LC_SESSION_COOKIE ?? '')
            jsonRes(res, result.ok ? 200 : 500, result)
          })

          server.middlewares.use('/api/sync/github', async (req: any, res: any) => {
            if (req.method !== 'POST') { jsonRes(res, 405, { error: 'Method not allowed' }); return }
            if (!sb) { jsonRes(res, 500, { error: 'Missing Supabase credentials' }); return }
            const result = await syncGitHub(sb, env.GITHUB_USERNAME ?? '', env.GITHUB_TOKEN)
            jsonRes(res, result.ok ? 200 : 500, result)
          })

          server.middlewares.use('/api/sync/atcoder', async (req: any, res: any) => {
            if (req.method !== 'POST') { jsonRes(res, 405, { error: 'Method not allowed' }); return }
            if (!sb) { jsonRes(res, 500, { error: 'Missing Supabase credentials' }); return }
            const result = await syncAtCoder(sb, env.AC_HANDLE ?? '')
            jsonRes(res, result.ok ? 200 : 500, result)
          })

          // ── /api/stats/sync-status ─────────────────────────────────────────
          server.middlewares.use('/api/stats/sync-status', async (req: any, res: any) => {
            if (!sb) { jsonRes(res, 500, { error: 'Missing Supabase credentials' }); return }
            try {
              const { data, error } = await sb.from('sync_logs').select('*').order('last_sync_at', { ascending: false })
              if (error) throw new Error(error.message)
              const latest: Record<number, any> = {}
              for (const row of data ?? []) if (!latest[row.platform_id]) latest[row.platform_id] = row
              const platforms = [1, 2, 3, 4].map(id => ({
                platform: PLATFORM_NAME[id], lastSyncAt: latest[id]?.last_sync_at ?? null,
                status: latest[id]?.status ?? 'never', errorMessage: latest[id]?.error_message ?? null,
              }))
              jsonRes(res, 200, { platforms })
            } catch (err: any) { jsonRes(res, 500, { error: err.message }) }
          })

        },
      },
    ],
    server: { port: 5173 },
  }
})
