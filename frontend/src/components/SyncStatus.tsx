import { useState, useEffect, useRef, useCallback } from 'react'
import { useSyncStatus } from '../hooks/useStats'
import { PLATFORM_COLORS, PLATFORM_LABELS } from '../types'
import { api } from '../api/client'
import dayjs from 'dayjs'
import relativeTime from 'dayjs/plugin/relativeTime'

dayjs.extend(relativeTime)

const STATUS_COLOR: Record<string, string> = {
  success:       '#4ade80',
  failed:        '#f87171',
  needs_refresh: '#fbbf24',
  never:         '#3a3d60',
}

const AUTO_SYNC_INTERVAL = 30 * 60 * 1000 // 30 minutes

// ── per-platform sync tracking ──────────────────────────────────────────────

type PlatSyncStatus = 'pending' | 'running' | 'ok' | 'err'

interface PlatSyncResult {
  status: PlatSyncStatus
  msg?: string
}

const SYNC_JOBS = [
  {
    key: 'github',
    label: 'GITHUB',
    fn: () => api.sync.github() as Promise<Record<string, unknown>>,
    summary: (r: Record<string, unknown>) => `+${r.newPushEvents ?? 0} commits`,
  },
  {
    key: 'codeforces',
    label: 'CODEFORCES',
    fn: () => api.sync.codeforces() as Promise<Record<string, unknown>>,
    summary: (r: Record<string, unknown>) => `+${r.newSubmissions ?? 0} subs`,
  },
  {
    key: 'atcoder',
    label: 'ATCODER',
    fn: () => api.sync.atcoder() as Promise<Record<string, unknown>>,
    summary: (r: Record<string, unknown>) => `+${r.newSubmissions ?? 0} subs`,
  },
  {
    key: 'leetcode',
    label: 'LEETCODE',
    fn: () => api.sync.leetcode() as Promise<Record<string, unknown>>,
    summary: (r: Record<string, unknown>) => `${r.totalSolved ?? '?'} solved`,
  },
  {
    key: 'leetcode_subs',
    label: 'LC SUBS',
    fn: () => api.sync.leetcodeSubmissions() as Promise<Record<string, unknown>>,
    summary: (r: Record<string, unknown>) => `+${r.newSubmissions ?? 0} subs`,
  },
]

// ── dot colors ──────────────────────────────────────────────────────────────

const PLAT_DOT: Record<PlatSyncStatus, string> = {
  pending: '#3a3d60',
  running: '#fbbf24',
  ok:      '#4ade80',
  err:     '#f87171',
}

// ── blink animation css ──────────────────────────────────────────────────────

const blinkStyle = `
@keyframes px-blink {
  0%, 100% { opacity: 1; }
  50%       { opacity: 0.2; }
}
.px-blink { animation: px-blink 0.8s ease-in-out infinite; }
`

// ── component ────────────────────────────────────────────────────────────────

export function SyncStatus() {
  const { data, loading, refetch: refetchStatus } = useSyncStatus()

  const [isSyncing, setIsSyncing]   = useState(false)
  const [syncDone, setSyncDone]     = useState(false)
  const [showPanel, setShowPanel]   = useState(false)
  const [platResults, setPlatResults] = useState<Record<string, PlatSyncResult>>({})

  const [countdown, setCountdown]   = useState(AUTO_SYNC_INTERVAL)
  const lastSyncRef                 = useRef(Date.now())
  const syncingRef                  = useRef(false) // prevent double-trigger

  // ── core sync logic ────────────────────────────────────────────────────────

  const doSync = useCallback(async () => {
    if (syncingRef.current) return
    syncingRef.current = true
    setIsSyncing(true)
    setSyncDone(false)
    setShowPanel(true)
    lastSyncRef.current = Date.now()
    setCountdown(AUTO_SYNC_INTERVAL)

    // initialise all platforms as "running"
    const init: Record<string, PlatSyncResult> = {}
    SYNC_JOBS.forEach(j => { init[j.key] = { status: 'running' } })
    setPlatResults(init)

    // fire all in parallel; update state as each settles
    await Promise.allSettled(
      SYNC_JOBS.map(async ({ key, fn, summary }) => {
        try {
          const result = await fn()
          const msg = result.status === 'needs_refresh'
            ? 'cookie expired'
            : summary(result)
          setPlatResults(prev => ({ ...prev, [key]: { status: 'ok', msg } }))
        } catch {
          setPlatResults(prev => ({ ...prev, [key]: { status: 'err', msg: 'failed' } }))
        }
      })
    )

    syncingRef.current = false
    setIsSyncing(false)
    setSyncDone(true)
    refetchStatus()

    // collapse panel after 4 s then reload
    setTimeout(() => {
      setShowPanel(false)
      setSyncDone(false)
      window.location.reload()
    }, 4_000)
  }, [refetchStatus])

  // ── auto-sync countdown ────────────────────────────────────────────────────

  useEffect(() => {
    const timer = setInterval(() => {
      const elapsed    = Date.now() - lastSyncRef.current
      const remaining  = AUTO_SYNC_INTERVAL - elapsed
      if (remaining <= 0) {
        setCountdown(AUTO_SYNC_INTERVAL)
        doSync()
      } else {
        setCountdown(remaining)
      }
    }, 1_000)
    return () => clearInterval(timer)
  }, [doSync])

  // ── countdown display ──────────────────────────────────────────────────────

  const totalSec     = Math.max(0, Math.ceil(countdown / 1_000))
  const minutesLeft  = Math.floor(totalSec / 60)
  const secondsLeft  = totalSec % 60
  const countdownStr = `${String(minutesLeft).padStart(2, '0')}:${String(secondsLeft).padStart(2, '0')}`

  if (loading || !data) return null

  // ── render ─────────────────────────────────────────────────────────────────

  return (
    <>
      <style>{blinkStyle}</style>

      {/* main bar */}
      <div
        className="flex flex-wrap items-center gap-6 border-2 border-px-border bg-px-panel px-4 py-2"
        style={{ boxShadow: '4px 4px 0 0 rgba(0,0,0,0.9)' }}
      >
        <span className="font-pixel text-[7px] text-px-dim">AUTO-SYNC</span>

        {data.platforms.map(p => {
          const accent = PLATFORM_COLORS[p.platform] ?? '#6B7280'
          const dot    = STATUS_COLOR[p.status] ?? '#3a3d60'
          const name   = (PLATFORM_LABELS[p.platform] ?? p.platform).toUpperCase()
          return (
            <div key={p.platform} className="flex items-center gap-2">
              <div className="h-2 w-2" style={{ backgroundColor: dot }} />
              <span className="font-pixel text-[7px]" style={{ color: accent }}>{name}</span>
              <span className="font-mono text-[9px] text-px-dim">
                {p.lastSyncAt ? dayjs(p.lastSyncAt).fromNow() : 'NEVER'}
              </span>
            </div>
          )
        })}

        <div className="ml-auto flex items-center gap-3">
          {!isSyncing && !syncDone && (
            <span className="font-pixel text-[6px] text-px-dim">NEXT: {countdownStr}</span>
          )}
          {isSyncing && (
            <span className="px-blink font-pixel text-[6px]" style={{ color: '#fbbf24' }}>
              SYNCING...
            </span>
          )}
          {syncDone && (
            <span className="font-pixel text-[6px]" style={{ color: '#4ade80' }}>
              DONE! RELOADING...
            </span>
          )}

          <button
            onClick={doSync}
            disabled={isSyncing}
            className="border-2 border-px-border bg-px-bg px-3 py-1 font-pixel text-[7px] text-px-dim transition-colors hover:border-gh hover:text-gh disabled:opacity-40"
            style={{ boxShadow: '2px 2px 0 0 rgba(0,0,0,0.9)' }}
          >
            {isSyncing ? '[ SYNCING ]' : '[ SYNC NOW ]'}
          </button>
        </div>
      </div>

      {/* expandable progress panel */}
      {showPanel && (
        <div
          className="flex flex-wrap gap-4 border-2 border-t-0 border-px-border bg-px-bg px-4 py-2"
          style={{ boxShadow: '4px 4px 0 0 rgba(0,0,0,0.9)' }}
        >
          {SYNC_JOBS.map(({ key, label }) => {
            const r = platResults[key] ?? { status: 'pending' as PlatSyncStatus }
            return (
              <div key={key} className="flex items-center gap-2">
                <div
                  className={r.status === 'running' ? 'px-blink h-2 w-2' : 'h-2 w-2'}
                  style={{ backgroundColor: PLAT_DOT[r.status] }}
                />
                <span className="font-pixel text-[6px] text-px-dim">{label}</span>
                {r.msg && (
                  <span
                    className="font-mono text-[8px]"
                    style={{
                      color: r.status === 'ok'  ? '#4ade80'
                           : r.status === 'err' ? '#f87171'
                           : '#fbbf24',
                    }}
                  >
                    {r.msg}
                  </span>
                )}
              </div>
            )
          })}
        </div>
      )}
    </>
  )
}
