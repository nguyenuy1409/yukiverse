import type { VercelRequest, VercelResponse } from '@vercel/node'

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

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin',  '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS')
  res.setHeader('Cache-Control',                's-maxage=60, stale-while-revalidate=300')

  if (req.method === 'OPTIONS') return res.status(200).end()
  if (req.method !== 'GET')     return res.status(405).json({ error: 'Method not allowed' })

  const apiKey = process.env.NOTION_API_KEY
  const dbId   = process.env.NOTION_PROGRESS_DATABASE_ID

  if (!apiKey || !dbId) {
    return res.status(500).json({ error: 'Notion credentials not configured in Vercel env vars.' })
  }

  try {
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

    return res.status(200).json(items)
  } catch (err: any) {
    console.error('[Notion API Error]', err?.message ?? err)
    return res.status(500).json({ error: err?.message ?? 'Failed to fetch data from Notion.' })
  }
}
