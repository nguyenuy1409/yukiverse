import { useState } from 'react'
import { useSyncStatus } from '../hooks/useStats'
import { PLATFORM_COLORS } from '../types'
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

export function SyncStatus() {
  const { data, loading, refetch } = useSyncStatus()
  const [syncing, setSyncing] = useState(false)

  async function handleSync() {
    setSyncing(true)
    try {
      await api.sync.all()
      // reload page so all components get fresh data
      window.location.reload()
    } catch {
      setSyncing(false)
    }
  }

  if (loading || !data) return null

  return (
    <div
      className="flex flex-wrap items-center gap-6 border-2 border-px-border bg-px-panel px-4 py-2"
      style={{ boxShadow: '4px 4px 0 0 rgba(0,0,0,0.9)' }}
    >
      <span className="font-pixel text-[7px] text-px-dim">SYNC</span>

      {data.platforms.map(p => {
        const accent = PLATFORM_COLORS[p.platform] ?? '#6B7280'
        const dot    = STATUS_COLOR[p.status] ?? '#3a3d60'
        const name   = p.platform.slice(0, 2).toUpperCase()

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

      {/* Sync now button */}
      <button
        onClick={handleSync}
        disabled={syncing}
        className="ml-auto border-2 border-px-border bg-px-bg px-3 py-1 font-pixel text-[7px] text-px-dim transition-colors hover:border-gh hover:text-gh disabled:opacity-40"
        style={{ boxShadow: '2px 2px 0 0 rgba(0,0,0,0.9)' }}
      >
        {syncing ? '...' : '[ SYNC NOW ]'}
      </button>
    </div>
  )
}
