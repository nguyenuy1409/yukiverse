import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

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

// ── Server-side cache (lives for the duration of the dev server process) ──────
let _serverCache: { data: string; ts: number } | null = null
const CACHE_TTL_MS = 60_000 // 60 seconds

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')

  return {
    plugins: [
      react(),
      {
        name: 'notion-dev-api',
        configureServer(server) {
          server.middlewares.use('/api/progress', async (req: any, res: any) => {
            if (req.method === 'OPTIONS') { res.statusCode = 200; res.end(); return }
            if (req.method !== 'GET') {
              res.statusCode = 405
              res.setHeader('Content-Type', 'application/json')
              res.end(JSON.stringify({ error: 'Method not allowed' }))
              return
            }

            const apiKey = env.NOTION_API_KEY
            const dbId   = env.NOTION_PROGRESS_DATABASE_ID

            if (!apiKey || !dbId) {
              res.statusCode = 500
              res.setHeader('Content-Type', 'application/json')
              res.end(JSON.stringify({ error: 'Missing NOTION_API_KEY or NOTION_PROGRESS_DATABASE_ID in .env.local' }))
              return
            }

            // Return cached response if still fresh
            if (_serverCache && Date.now() - _serverCache.ts < CACHE_TTL_MS) {
              res.setHeader('Content-Type', 'application/json')
              res.setHeader('Access-Control-Allow-Origin', '*')
              res.setHeader('X-Cache', 'HIT')
              res.statusCode = 200
              res.end(_serverCache.data)
              return
            }

            try {
              // Use fetch directly — avoids any SDK version issues
              const notionRes = await fetch(
                `${NOTION_API_BASE}/databases/${dbId}/query`,
                {
                  method: 'POST',
                  headers: {
                    'Authorization':  `Bearer ${apiKey}`,
                    'Notion-Version': NOTION_API_VERSION,
                    'Content-Type':   'application/json',
                  },
                  body: JSON.stringify({
                    sorts: [{ property: 'Status', direction: 'ascending' }],
                  }),
                }
              )

              if (!notionRes.ok) {
                const errBody: any = await notionRes.json().catch(() => ({}))
                throw new Error(errBody.message ?? `Notion API returned ${notionRes.status}`)
              }

              const data: any = await notionRes.json()

              const items = (data.results ?? []).map((page: any) => {
                const props        = page.properties
                const currentPages = props['Current (Pages)']?.number ?? 0
                const targetPages  = props['Target (Pages)']?.number  ?? 1
                const formulaValue = props['Progress %']?.formula?.number
                const progressPct  = formulaValue != null
                  ? Math.round(formulaValue)
                  : Math.min(100, Math.round((currentPages / targetPages) * 100))

                return {
                  id:               page.id,
                  title:            props.Title?.title?.[0]?.plain_text ?? 'Untitled',
                  current_pages:    currentPages,
                  target_pages:     targetPages,
                  scope:            richText(props['Scope']),
                  status:           props['Status']?.select?.name ?? 'Next Up',
                  progress_percent: progressPct,
                  last_updated:     formatDate(page.last_edited_time),
                }
              })

              const payload = JSON.stringify(items)
              _serverCache = { data: payload, ts: Date.now() }

              res.setHeader('Content-Type', 'application/json')
              res.setHeader('Access-Control-Allow-Origin', '*')
              res.setHeader('X-Cache', 'MISS')
              res.statusCode = 200
              res.end(payload)
            } catch (err: any) {
              console.error('\n[notion-dev-api] ❌', err?.message ?? err, '\n')
              res.statusCode = 500
              res.setHeader('Content-Type', 'application/json')
              res.end(JSON.stringify({ error: err?.message ?? 'Failed to fetch from Notion' }))
            }
          })
        },
      },
    ],
    server: {
      port: 5173,
      proxy: {
        '/api': {
          target: 'http://localhost:5080',
          changeOrigin: true,
        },
      },
    },
  }
})
