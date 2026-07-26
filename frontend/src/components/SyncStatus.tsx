import { useState, useEffect, useRef } from 'react'
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

export function SyncStatus() {
  const { data, loading } = useSyncStatus()
  const [syncing, setSyncing] = useState(false)
  const [countdown, setCountdown] = useState(AUTO_SYNC_INTERVAL)
  const lastSyncRef = useRef(Date.now())

  // Auto-sync every 30 minutes + countdown tick every second
  useEffect(() => {
    const timer = setInterval(() => {
      const elapsed = Date.now() - lastSyncRef.current
      const remaining = AUTO_SYNC_INTERVAL - elapsed

      if (remaining <= 0) {
        lastSyncRef.current = Date.now()
        setCountdown(AUTO_SYNC_INTERVAL)
        api.sync.all().then(() => window.location.reload()).catch(() => {})
      } else {
        setCountdown(remaining)
      }
    }, 1_000) // tick every second for smooth countdown

    return () => clearInterval(timer)
  }, [])

  async function handleSync() {
    setSyncing(true)
    lastSyncRef.current = Date.now()
    setCountdown(AUTO_SYNC_INTERVAL)
    try {
      await api.sync.all()
      window.location.reload()
    } catch {
      setSyncing(false)
    }
  }

  const totalSec = Math.max(0, Math.ceil(countdown / 1000))
  const minutesLeft = Math.floor(totalSec / 60)
  const secondsLeft = totalSec % 60
  const countdownStr = `${String(minutesLeft).padStart(2,'0')}:${String(secondsLeft).padStart(2,'0')}`

  if (loading || !data) return null

  return (
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
            <span className="font-pixel text-[7px]" style={{ color: accent }}>
              {name}
            </span>
            <span className="font-mono text-[9px] text-px-dim">
              {p.lastSyncAt ? dayjs(p.lastSyncAt).fromNow() : 'NEVER'}
            </span>
          </div>
        )
      })}

      <div className="ml-auto flex items-center gap-3">
        <span className="font-pixel text-[6px] text-px-dim">
          NEXT: {countdownStr}
        </span>
        <button
          onClick={handleSync}
          disabled={syncing}
          className="border-2 border-px-border bg-px-bg px-3 py-1 font-pixel text-[7px] text-px-dim transition-colors hover:border-gh hover:text-gh disabled:opacity-40"
          style={{ boxShadow: '2px 2px 0 0 rgba(0,0,0,0.9)' }}
        >
          {syncing ? '...' : '[ SYNC NOW ]'}
        </button>
      </div>
    </div>
  )
}
