import { useState, useEffect } from 'react'

// ── Types ─────────────────────────────────────────────────────────────────────

interface ProgressItem {
  id: string
  title: string
  current_pages: number
  target_pages: number
  scope: string
  status: 'Reading' | 'Completed' | 'Next Up' | 'On Hold'
  progress_percent: number
  last_updated: string
}

// ── Design tokens (mirrors ResourcesPage sakura palette) ──────────────────────

const C = {
  title:      '#1a0a08',
  subtitle:   '#6b4040',
  accent:     '#9b2828',
  accentBg:   'rgba(155,40,40,0.10)',
  accentBdr:  'rgba(155,40,40,0.25)',
  divider:    'rgba(155,40,40,0.15)',
  dot:        'rgba(192,112,96,0.4)',
  cardBg:     'rgba(255,255,255,0.80)',
  cardBdr:    'rgba(155,40,40,0.18)',
  greenText:  '#166534',
  greenBg:    'rgba(22,101,52,0.08)',
  greenBdr:   'rgba(22,101,52,0.20)',
}

const pageBg: React.CSSProperties = {
  background:           'rgba(255,245,242,0.72)',
  backdropFilter:       'blur(16px)',
  WebkitBackdropFilter: 'blur(16px)',
  border:               '1px solid rgba(200,140,130,0.25)',
  borderRadius:         '20px',
  boxShadow:            '0 8px 40px rgba(0,0,0,0.12)',
}

// ── Progress Bar ──────────────────────────────────────────────────────────────

function ProgressBar({ percent }: { percent: number }) {
  const isDone = percent >= 100
  return (
    <div className="flex items-center gap-3">
      <div className="flex-1 h-1.5 rounded-full overflow-hidden" style={{ background: C.accentBg }}>
        <div
          className="h-full rounded-full transition-all duration-700"
          style={{ width: `${percent}%`, background: isDone ? C.greenText : C.accent }}
        />
      </div>
      <span
        className="font-mono text-[11px] font-bold w-9 text-right shrink-0"
        style={{ color: isDone ? C.greenText : C.accent }}
      >
        {percent}%
      </span>
    </div>
  )
}

// ── Section Header ────────────────────────────────────────────────────────────

function SectionHeader({ label, count }: { label: string; count: number }) {
  return (
    <div className="mb-5">
      <div className="flex items-baseline gap-3 mb-3">
        <span className="font-mono text-[11px] font-bold tracking-widest" style={{ color: C.accent }}>
          {label}
        </span>
        <span
          className="font-mono text-[9px] px-2 py-0.5 rounded-full"
          style={{ background: C.accentBg, color: C.accent, border: `1px solid ${C.accentBdr}` }}
        >
          {count}
        </span>
      </div>
      <div className="h-px" style={{ background: C.divider }} />
    </div>
  )
}

// ── Active Card ───────────────────────────────────────────────────────────────

function ActiveCard({ item }: { item: ProgressItem }) {
  return (
    <div
      className="rounded-xl p-5 transition-all duration-200 hover:-translate-y-px"
      style={{ background: C.cardBg, border: `1px solid ${C.cardBdr}`, boxShadow: '0 2px 12px rgba(0,0,0,0.06)' }}
    >
      {/* Top row */}
      <div className="mb-2 flex items-center justify-between gap-2">
        <span className="font-mono text-[10px] font-semibold tracking-wide truncate" style={{ color: C.subtitle }}>
          {item.scope}
        </span>
        <span
          className="font-mono text-[9px] font-semibold px-2.5 py-0.5 rounded-full shrink-0 animate-pulse"
          style={{ background: C.accentBg, color: C.accent, border: `1px solid ${C.accentBdr}` }}
        >
          ● reading
        </span>
      </div>

      {/* Title */}
      <h3 className="mb-4 font-sans text-[15px] font-bold leading-snug" style={{ color: C.title }}>
        {item.title}
      </h3>

      {/* Progress bar */}
      <div className="mb-4">
        <ProgressBar percent={item.progress_percent} />
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between pt-3" style={{ borderTop: `1px solid ${C.divider}` }}>
        <span className="font-mono text-[11px] font-semibold" style={{ color: C.subtitle }}>
          <span style={{ color: C.accent, fontWeight: 700 }}>{item.current_pages}</span>
          {' / '}{item.target_pages} pages
        </span>
        <span className="font-mono text-[10px]" style={{ color: C.subtitle }}>
          {item.last_updated}
        </span>
      </div>
    </div>
  )
}

// ── Completed Row ─────────────────────────────────────────────────────────────

function CompletedRow({ item }: { item: ProgressItem }) {
  return (
    <li className="flex items-baseline gap-3 py-[5px]">
      <span className="h-[5px] w-[5px] flex-shrink-0 rounded-full shrink-0" style={{ background: C.greenBdr, marginTop: '6px' }} />
      <span className="font-sans text-[13px] leading-snug flex-1 min-w-0">
        <span style={{ color: C.title, fontWeight: 600 }}>{item.title}</span>
        {item.scope && (
          <span className="ml-2 font-mono text-[10px]" style={{ color: C.subtitle }}>
            — {item.scope}
          </span>
        )}
      </span>
      <span className="font-mono text-[9px] font-bold shrink-0" style={{ color: C.greenText }}>
        done
      </span>
    </li>
  )
}

// ── Queue Row ─────────────────────────────────────────────────────────────────

function QueueRow({ item }: { item: ProgressItem }) {
  const isOnHold = item.status === 'On Hold'
  return (
    <li className="flex items-baseline gap-3 py-[5px]">
      <span className="h-[5px] w-[5px] flex-shrink-0 rounded-full shrink-0" style={{ background: C.dot, marginTop: '6px' }} />
      <span className="font-sans text-[13px] leading-snug flex-1 min-w-0">
        <span style={{ color: C.title, fontWeight: 600 }}>{item.title}</span>
        {item.scope && (
          <span className="ml-2 font-mono text-[10px]" style={{ color: C.subtitle }}>
            — {item.scope} · {item.target_pages} pages
          </span>
        )}
      </span>
      <span
        className="font-mono text-[9px] font-semibold px-2 py-0.5 rounded-full shrink-0"
        style={{
          background: isOnHold ? 'rgba(180,120,0,0.08)' : C.accentBg,
          color:      isOnHold ? '#92600a' : C.accent,
          border:     `1px solid ${isOnHold ? 'rgba(180,120,0,0.22)' : C.accentBdr}`,
        }}
      >
        {item.status}
      </span>
    </li>
  )
}

// ── Loader ────────────────────────────────────────────────────────────────────

function Loader() {
  return (
    <div className="py-16 flex flex-col items-center gap-3">
      <div className="flex gap-1.5">
        {[0, 1, 2].map(i => (
          <div
            key={i}
            className="w-2 h-2 rounded-full animate-bounce"
            style={{ background: C.accent, animationDelay: `${i * 0.15}s` }}
          />
        ))}
      </div>
      <p className="font-mono text-[11px] font-medium" style={{ color: C.subtitle }}>
        fetching from notion...
      </p>
    </div>
  )
}

// ── Module-level cache — survives navigation, cleared on page refresh ─────────
let _cache: ProgressItem[] | null = null

// ── Page ──────────────────────────────────────────────────────────────────────

export function ProgressPage() {
  const [progressData, setProgressData] = useState<ProgressItem[]>(_cache ?? [])
  const [loading, setLoading]           = useState(_cache === null)
  const [error, setError]               = useState<string | null>(null)

  useEffect(() => {
    if (_cache !== null) return

    fetch('/api/progress')
      .then(async r => {
        if (!r.ok) {
          try {
            const body = await r.json()
            throw new Error(body.error ?? `Server error: ${r.status}`)
          } catch {
            throw new Error(`Server error: ${r.status}`)
          }
        }
        return r.json()
      })
      .then((data: ProgressItem[]) => {
        _cache = data
        setProgressData(data)
        setLoading(false)
      })
      .catch((err: Error) => {
        setError(err.message)
        setLoading(false)
      })
  }, [])

  const active    = progressData.filter(d => d.status === 'Reading')
  const completed = progressData.filter(d => d.status === 'Completed')
  const queue     = progressData.filter(d => d.status === 'Next Up' || d.status === 'On Hold')

  return (
    <main className="mx-auto max-w-3xl px-4 py-10">
      <div style={pageBg} className="px-10 py-10">

        {/* Page title */}
        <div className="mb-10 border-b pb-8" style={{ borderColor: C.divider }}>
          <div className="flex items-end justify-between">
            <div>
              <p className="mb-2 font-mono text-[10px] tracking-[0.3em] uppercase" style={{ color: C.subtitle }}>
                yukiverse / progress
              </p>
              <h1
                className="font-sans text-[32px] font-black tracking-tight leading-none"
                style={{ color: C.title }}
              >
                PROGRESS
              </h1>
              <p className="mt-2 font-mono text-[11px]" style={{ color: C.subtitle }}>
                Reading & study tracker, synced from Notion.
              </p>
            </div>
            {!loading && !error && (
              <span
                className="font-mono text-[10px] px-3 py-1 rounded-full"
                style={{ background: C.accentBg, color: C.accent, border: `1px solid ${C.accentBdr}` }}
              >
                {progressData.length} items
              </span>
            )}
          </div>
        </div>

        {/* Loading */}
        {loading && <Loader />}

        {/* Error */}
        {error && (
          <div
            className="rounded-xl px-5 py-4 font-mono text-[12px] font-semibold mb-8"
            style={{ background: 'rgba(155,40,40,0.06)', border: `1px solid ${C.accentBdr}`, color: C.accent }}
          >
            {error}
          </div>
        )}

        {/* Sections */}
        {!loading && !error && (
          <>
            <section className="mb-10">
              <SectionHeader label="CURRENTLY READING" count={active.length} />
              <div className="flex flex-col gap-4">
                {active.length === 0
                  ? <p className="font-mono text-[11px]" style={{ color: C.subtitle }}>nothing active right now</p>
                  : active.map(item => <ActiveCard key={item.id} item={item} />)
                }
              </div>
            </section>

            <section className="mb-10">
              <SectionHeader label="COMPLETED" count={completed.length} />
              <ul className="space-y-0.5 pl-1">
                {completed.length === 0
                  ? <p className="font-mono text-[11px]" style={{ color: C.subtitle }}>none yet</p>
                  : completed.map(item => <CompletedRow key={item.id} item={item} />)
                }
              </ul>
            </section>

            <section>
              <SectionHeader label="UP NEXT" count={queue.length} />
              <ul className="space-y-0.5 pl-1">
                {queue.length === 0
                  ? <p className="font-mono text-[11px]" style={{ color: C.subtitle }}>queue empty</p>
                  : queue.map(item => <QueueRow key={item.id} item={item} />)
                }
              </ul>
            </section>
          </>
        )}

      </div>
    </main>
  )
}
