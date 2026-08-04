import { useProblems } from '../hooks/useStats'
import { useTheme } from '../contexts/ThemeContext'
import type { PlatformStats } from '../types'
import { PLATFORM_COLORS, PLATFORM_LABELS, PLATFORM_PROFILES } from '../types'
import { PlatformIcon } from './PlatformIcon'
import dayjs from 'dayjs'
import relativeTime from 'dayjs/plugin/relativeTime'

dayjs.extend(relativeTime)

// Full class-name strings so Tailwind's scanner includes them in the build.
const SAKURA_TEXT_CLASSES: Record<string, string> = {
  codeforces: 'text-sky-300',
  atcoder:    'text-rose-300',
  leetcode:   'text-yellow-200',
  github:     'text-emerald-300',
}

const ORDER = ['codeforces', 'atcoder', 'leetcode', 'github']

const PIXEL_SHADOW: Record<string, string> = {
  codeforces: '4px 4px 0 0 #38bdf8',
  atcoder:    '4px 4px 0 0 #fb923c',
  leetcode:   '4px 4px 0 0 #fbbf24',
  github:     '4px 4px 0 0 #4ade80',
}


function StatCard({ stats, theme }: { stats: PlatformStats; theme: string }) {
  const color   = PLATFORM_COLORS[stats.platform] ?? '#6B7280'
  const label   = PLATFORM_LABELS[stats.platform] ?? stats.platform
  const profile = PLATFORM_PROFILES[stats.platform]
  const hasBreakdown =
    stats.easySolved > 0 || stats.mediumSolved > 0 || stats.hardSolved > 0

  const isSakura = theme === 'sakura'

  const cardStyle = isSakura
    ? {
        background: 'rgba(20, 13, 10, 0.62)',
        backdropFilter: 'blur(20px) saturate(1.5)',
        WebkitBackdropFilter: 'blur(20px) saturate(1.5)',
        border: '1px solid rgba(255, 255, 255, 0.20)',
        borderRadius: '16px',
        boxShadow: `0 8px 28px rgba(0,0,0,0.32), inset 0 1px 0 rgba(255,255,255,0.12)`,
      }
    : {
        borderColor: color,
        boxShadow: PIXEL_SHADOW[stats.platform] ?? '4px 4px 0 0 #333',
      }

  const titleBarStyle = isSakura
    ? {
        backgroundColor: 'rgba(255,255,255,0.06)',
        borderBottom: '1px solid rgba(255,255,255,0.14)',
        borderRadius: '16px 16px 0 0',
      }
    : {
        backgroundColor: `${color}22`,
        borderBottom: `2px solid ${color}44`,
      }

  return (
    <a
      href={profile}
      target="_blank"
      rel="noopener noreferrer"
      className={`block transition-opacity hover:opacity-80 ${isSakura ? '' : 'border-2 bg-px-panel'}`}
      style={cardStyle}
    >
      {/* Title bar */}
      <div className="flex items-center gap-2 px-3 py-2" style={titleBarStyle}>
        <PlatformIcon platform={stats.platform} size={2} />
        <span
          className={`${isSakura ? 'font-geist-mono text-[11px] font-semibold tracking-wide' : 'font-pixel text-[7px] tracking-widest'} ${isSakura ? (SAKURA_TEXT_CLASSES[stats.platform] ?? '') : ''}`}
          style={isSakura ? undefined : { color }}
        >
          {label.toUpperCase()}
        </span>
      </div>

      {/* Body */}
      <div className="p-4">
        <p
          className={`${isSakura ? 'font-geist font-black text-4xl' : 'font-pixel text-3xl'} tabular-nums leading-none ${isSakura ? 'text-white' : ''}`}
          style={isSakura ? undefined : { color }}
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
            <p className={`${isSakura ? 'font-geist text-[11px]' : 'font-mono text-[10px]'} ${isSakura ? 'text-white/60' : 'text-px-dim'}`}>
              {stats.statLabel ?? 'PROBLEMS'}
            </p>
          )}
        </div>

        <p className={`mt-3 ${isSakura ? 'font-geist-mono text-[10px]' : 'font-pixel text-[6px]'} ${isSakura ? 'text-white/40' : 'text-px-dim'}`}>
          {isSakura
            ? dayjs(stats.updatedAt).fromNow()
            : dayjs(stats.updatedAt).fromNow().toUpperCase()}
        </p>
      </div>
    </a>
  )
}

function CardSkeleton({ platform, theme }: { platform: string; theme: string }) {
  const color    = PLATFORM_COLORS[platform] ?? '#333'
  const isSakura = theme === 'sakura'

  const skeletonStyle = isSakura
    ? {
        background: 'rgba(20, 13, 10, 0.58)',
        backdropFilter: 'blur(18px) saturate(1.4)',
        WebkitBackdropFilter: 'blur(18px) saturate(1.4)',
        border: '1px solid rgba(255, 255, 255, 0.18)',
        borderRadius: '16px',
      }
    : {
        borderColor: `${color}44`,
        boxShadow: '4px 4px 0 0 rgba(0,0,0,0.9)',
      }

  const radius    = isSakura ? '4px' : '0'
  const topRadius = isSakura ? '16px 16px 0 0' : undefined

  return (
    <div className={isSakura ? '' : 'border-2 bg-px-panel'} style={skeletonStyle}>
      <div
        className="px-3 py-2"
        style={{
          borderBottom: isSakura
            ? '1px solid rgba(240,180,196,0.20)'
            : `2px solid ${color}22`,
          borderRadius: topRadius,
        }}
      >
        <div className="h-2 w-20 animate-pulse bg-px-border" style={{ borderRadius: radius }} />
      </div>
      <div className="p-4 space-y-3">
        <div className="h-8 w-16 animate-pulse bg-px-border" style={{ borderRadius: radius }} />
        <div className="h-2 w-24 animate-pulse bg-px-border" style={{ borderRadius: radius }} />
        <div className="h-2 w-12 animate-pulse bg-px-border" style={{ borderRadius: radius }} />
      </div>
    </div>
  )
}

export function PlatformCards() {
  const { data, loading, error } = useProblems()
  const { theme } = useTheme()

  if (loading) {
    return (
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        {ORDER.map(p => <CardSkeleton key={p} platform={p} theme={theme} />)}
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

  const statsMap = new Map((data?.platforms ?? []).map(s => [s.platform, s]))

  return (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
      {ORDER.map(platform => {
        const stats = statsMap.get(platform)
        return stats
          ? <StatCard key={platform} stats={stats} theme={theme} />
          : <CardSkeleton key={platform} platform={platform} theme={theme} />
      })}
    </div>
  )
}
