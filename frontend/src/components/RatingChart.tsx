import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts'
import { useRating } from '../hooks/useStats'
import { PLATFORM_COLORS } from '../types'
import { ChartSkeleton } from './Skeleton'
import dayjs from 'dayjs'

interface MergedPoint {
  date: string
  label: string
  codeforces?: number
  atcoder?: number
  cfContest?: string
  acContest?: string
}

export function RatingChart() {
  const { data, loading, error } = useRating()

  if (loading) return <ChartSkeleton height={260} />
  if (error)
    return (
      <p className="text-sm text-red-400">
        Failed to load rating history: {error}
      </p>
    )

  const cf = data?.codeforces ?? []
  const ac = data?.atcoder    ?? []

  if (cf.length === 0 && ac.length === 0) {
    return (
      <div className="flex h-[260px] items-center justify-center">
        <p className="text-sm text-zinc-600">No rating history yet</p>
      </div>
    )
  }

  // Merge CF and AC into a single timeline sorted by date
  const pointMap = new Map<string, MergedPoint>()

  for (const r of cf) {
    const key = r.date
    const existing = pointMap.get(key) ?? {
      date: key,
      label: dayjs(r.date).format('MMM D, YYYY'),
    }
    existing.codeforces = r.rating
    existing.cfContest  = r.contestName ?? undefined
    pointMap.set(key, existing)
  }

  for (const r of ac) {
    const key = r.date
    const existing = pointMap.get(key) ?? {
      date: key,
      label: dayjs(r.date).format('MMM D, YYYY'),
    }
    existing.atcoder   = r.rating
    existing.acContest = r.contestName ?? undefined
    pointMap.set(key, existing)
  }

  const chartData = Array.from(pointMap.values()).sort((a, b) =>
    a.date.localeCompare(b.date)
  )

  return (
    <ResponsiveContainer width="100%" height={260}>
      <LineChart
        data={chartData}
        margin={{ top: 4, right: 4, left: -20, bottom: 0 }}
      >
        <CartesianGrid stroke="#1e2040" vertical={false} />
        <XAxis
          dataKey="label"
          tick={{ fill: '#4a4d70', fontSize: 9, fontFamily: '"JetBrains Mono", monospace' }}
          tickLine={false}
          axisLine={false}
          interval={Math.max(1, Math.floor(chartData.length / 6))}
        />
        <YAxis
          tick={{ fill: '#4a4d70', fontSize: 9, fontFamily: '"JetBrains Mono", monospace' }}
          tickLine={false}
          axisLine={false}
        />
        <Tooltip
          contentStyle={{
            backgroundColor: '#0d0d1c',
            border: '2px solid #1e2040',
            borderRadius: 0,
            fontSize: 10,
            fontFamily: '"JetBrains Mono", monospace',
            boxShadow: '4px 4px 0 0 rgba(0,0,0,0.9)',
          }}
          labelStyle={{ color: '#b8bce8', marginBottom: 4 }}
          itemStyle={{ color: '#b8bce8' }}
          cursor={{ stroke: '#1e2040' }}
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          formatter={(value: unknown, name: unknown, props: any) => {
            const n       = String(name)
            const point   = props?.payload as MergedPoint | undefined
            const contest = n === 'codeforces' ? point?.cfContest : point?.acContest
            return [
              `${value}${contest ? ` (${contest})` : ''}`,
              n === 'codeforces' ? 'CF' : 'AC',
            ]
          }}
        />
        <Legend
          iconType="square"
          iconSize={8}
          formatter={(value: string) => (
            <span style={{ fontSize: 9, color: '#4a4d70', fontFamily: '"JetBrains Mono", monospace' }}>
              {value === 'codeforces' ? 'CF' : 'AC'}
            </span>
          )}
        />
        {cf.length > 0 && (
          <Line
            type="monotone"
            dataKey="codeforces"
            stroke={PLATFORM_COLORS['codeforces']}
            strokeWidth={2}
            dot={{ r: 3, fill: PLATFORM_COLORS['codeforces'] }}
            activeDot={{ r: 5 }}
            connectNulls
          />
        )}
        {ac.length > 0 && (
          <Line
            type="monotone"
            dataKey="atcoder"
            stroke={PLATFORM_COLORS['atcoder']}
            strokeWidth={2}
            dot={{ r: 3, fill: PLATFORM_COLORS['atcoder'] }}
            activeDot={{ r: 5 }}
            connectNulls
          />
        )}
      </LineChart>
    </ResponsiveContainer>
  )
}
