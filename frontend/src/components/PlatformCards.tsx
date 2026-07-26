import { useProblems } from '../hooks/useStats'
import type { PlatformStats } from '../types'
import { PLATFORM_COLORS, PLATFORM_LABELS, PLATFORM_PROFILES } from '../types'
import { PlatformIcon } from './PlatformIcon'
import dayjs from 'dayjs'
import relativeTime from 'dayjs/plugin/relativeTime'

dayjs.extend(relativeTime)

const ORDER = ['codeforces', 'atcoder', 'leetcode', 'github']

// Tailwind shadow class by platform (pixel colored shadow)
const PIXEL_SHADOW: Record<string, string> = {
  codeforces: '4px 4px 0 0 #38bdf8',
  atcoder:    '4px 4px 0 0 #fb923c',
  leetcode:   '4px 4px 0 0 #fbbf24',
  github:     '4px 4px 0 0 #4ade80',
}

function StatCard({ stats }: { stats: PlatformStats }) {
  const color   = PLATFORM_COLORS[stats.platform] ?? '#6B7280'
  const label   = PLATFORM_LABELS[stats.platform] ?? stats.platform
  const profile = PLATFORM_PROFILES[stats.platform]
  const shadow  = PIXEL_SHADOW[stats.platform] ?? '4px 4px 0 0 #333'
  const hasBreakdown =
    stats.easySolved > 0 || stats.mediumSolved > 0 || stats.hardSolved > 0

  return (
    <a
      href={profile}
      target="_blank"
      rel="noopener noreferrer"
      className="block border-2 bg-px-panel transition-opacity hover:opacity-80"
      style={{ borderColor: color, boxShadow: shadow }}
    >
      {/* Title bar with pixel icon */}
      <div
        className="flex items-center gap-2 px-3 py-2"
        style={{ backgroundColor: `${color}22`, borderBottom: `2px solid ${color}44` }}
      >
        <PlatformIcon platform={stats.platform} size={2} />
        <span className="font-pixel text-[7px] tracking-widest" style={{ color }}>
          {label.toUpperCase()}
        </span>
      </div>

      {/* Body */}
      <div className="p-4">
        <p
          className="font-pixel text-3xl tabular-nums leading-none"
          style={{ color }}
        >
          {stats.totalSolved.toString().padStart(3, '0')}
        </p>

        <div className="mt-3">
          {hasBreakdown ? (
            <div className="flex gap-3 font-mono text-[10px]">
              <span className="text-green-400">E:{stats.easySolved}</span>
              <span className="text-yellow-400">M:{stats.mediumSolved}</span>
              <span className="text-red-400">H:{stats.hardSolved}</span>
            </div>
          ) : (
            <p className="font-mono text-[10px] text-px-dim">
              {stats.statLabel ?? 'PROBLEMS'}
            </p>
          )}
        </div>

        <p className="mt-3 font-pixel text-[6px] text-px-dim">
          {dayjs(stats.updatedAt).fromNow().toUpperCase()}
        </p>
      </div>
    </a>
  )
}

function CardSkeleton({ platform }: { platform: string }) {
  const color = PLATFORM_COLORS[platform] ?? '#333'
  return (
    <div
      className="border-2 bg-px-panel"
      style={{ borderColor: `${color}44`, boxShadow: '4px 4px 0 0 rgba(0,0,0,0.9)' }}
    >
      <div className="px-3 py-2 border-b-2" style={{ borderColor: `${color}22` }}>
        <div className="h-2 w-20 animate-pulse bg-px-border" />
      </div>
      <div className="p-4 space-y-3">
        <div className="h-8 w-16 animate-pulse bg-px-border" />
        <div className="h-2 w-24 animate-pulse bg-px-border" />
        <div className="h-2 w-12 animate-pulse bg-px-border" />
      </div>
    </div>
  )
}

export function PlatformCards() {
  const { data, loading, error } = useProblems()

  if (loading) {
    return (
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        {ORDER.map(p => <CardSkeleton key={p} platform={p} />)}
      </div>
    )
  }

  if (error) {
    return (
      <div className="border-2 border-red-900 bg-red-950/30 p-4 font-mono text-xs text-red-400">
        [ERR] {error}
      </div>
    )
  }

  const statsMap = new Map(
    (data?.platforms ?? []).map(s => [s.platform, s])
  )

  return (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
      {ORDER.map(platform => {
        const stats = statsMap.get(plat