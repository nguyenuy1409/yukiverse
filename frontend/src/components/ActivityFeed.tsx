import { useFeed } from '../hooks/useStats'
import { PLATFORM_COLORS } from '../types'
import { PlatformIcon } from './PlatformIcon'
import dayjs from 'dayjs'
import relativeTime from 'dayjs/plugin/relativeTime'

dayjs.extend(relativeTime)

const VERDICT_COLOR: Record<string, string> = {
  // Accepted / OK
  OK:                    '#00ff88',
  Accepted:              '#00ff88',
  // Wrong Answer
  WRONG_ANSWER:          '#f87171',
  'Wrong Answer':        '#f87171',
  // TLE
  TIME_LIMIT_EXCEEDED:   '#fbbf24',
  'Time Limit Exceeded': '#fbbf24',
  // Runtime Error
  RUNTIME_ERROR:         '#fb923c',
  'Runtime Error':       '#fb923c',
  // Compile Error
  COMPILATION_ERROR:     '#f87171',
  'Compile Error':       '#f87171',
  // Memory Limit
  MEMORY_LIMIT_EXCEEDED: '#fbbf24',
  'Memory Limit Exceeded': '#fbbf24',
  // GitHub
  commit:                '#e2e8f0',
  push:                  '#e2e8f0',
  PushEvent:             '#e2e8f0',
}

const VERDICT_LABEL: Record<string, string> = {
  OK:                      'AC',
  Accepted:                'AC',
  WRONG_ANSWER:            'WA',
  'Wrong Answer':          'WA',
  TIME_LIMIT_EXCEEDED:     'TLE',
  'Time Limit Exceeded':   'TLE',
  RUNTIME_ERROR:           'RE',
  'Runtime Error':         'RE',
  COMPILATION_ERROR:       'CE',
  'Compile Error':         'CE',
  MEMORY_LIMIT_EXCEEDED:   'MLE',
  'Memory Limit Exceeded': 'MLE',
  // GitHub types
  commit:                  'COMMIT',
  push:                    'COMMIT',
  PushEvent:               'COMMIT',
}

function getLabel(verdict: string | null | undefined, type: string): string {
  // For GitHub commits, always show COMMIT
  if (type === 'commit' || type === 'push') return 'COMMIT'
  if (!verdict) return type.toUpperCase()
  return VERDICT_LABEL[verdict] ?? verdict.slice(0, 3).toUpperCase()
}

function getColor(verdict: string | null | undefined, type: string): string {
  // GitHub commits → white
  if (type === 'commit' || type === 'push') return '#e2e8f0'
  if (!verdict) return '#4a4d70'
  return VERDICT_COLOR[verdict] ?? '#f87171'
}

export function ActivityFeed() {
  const { data, loading, error } = useFeed(30)

  if (loading) {
    return (
      <div className="space-y-2">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="flex items-center gap-2">
            <div className="h-5 w-8 animate-pulse bg-px-border" />
            <div className="h-3 flex-1 animate-pulse bg-px-border" />
            <div className="h-3 w-8 animate-pulse bg-px-border" />
          </div>
        ))}
      </div>
    )
  }

  if (error) {
    return (
      <p className="font-mono text-xs text-red-400">[ERR] {error}</p>
    )
  }

  const items = data?.items ?? []

  if (items.length === 0) {
    return (
      <div className="flex h-40 items-center justify-center">
        <p className="font-pixel text-[8px] text-px-dim">NO ACTIVITY</p>
      </div>
    )
  }

  return (
    <div className="space-y-[2px] overflow-y-auto" style={{ maxHeight: 340 }}>
      {items.map((item, i) => {
        const accent = PLATFORM_COLORS[item.platform] ?? '#6B7280'
        const label  = getLabel(item.verdict, item.type)
        const vColor = getColor(item.verdict, item.type)

        return (
          <div
            key={i}
            className="flex items-center gap-2 border border-transparent px-1.5 py-1 transition-colors hover:border-px-border hover:bg-px-border"
          >
            {/* Platform icon */}
            <div
              className="flex h-7 w-7 flex-shrink-0 items-center justify-center"
              style={{
                backgroundColor: `${accent}18`,
                border: `1px solid ${accent}44`,
              }}
            >
              <PlatformIcon platform={item.platform} size={2} />
            </div>

            {/* Title */}
            <span className="flex-1 truncate font-mono text-[10px] text-px-text">
              {item.title}
            </span>

            {/* Verdict/type label */}
            <span
              className="flex-shrink-0 font-pixel text-[7px]"
              style={{ color: vColor }}
            >
              {label}
            </span>

            {/* Time */}
            <span className="flex-shrink-0 font-mono text-[9px] text-px-dim tabular-nums">
              {dayjs(item.occurredAt).fromNow()}
            </span>
          </div>
        )
      })}
    </div>
  )
}
