import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts'
import { useDaily } from '../hooks/useStats'
import { PLATFORM_COLORS } from '../types'
import { ChartSkeleton } from './Skeleton'
import dayjs from 'dayjs'

const PLATFORMS = ['codeforces', 'leetcode', 'github', 'atcoder'] as const

export function DailyChart() {
  const { data, loading, error } = useDaily(90)

  if (loading) return <ChartSkeleton height={260} />
  if (error)
    return (
      <p className="text-sm text-red-400">
        Failed to load daily activity: {error}
      </p>
    )

  const chartData = (data?.days ?? []).map(d => ({
    ...d,
    label: dayjs(d.date).format('MMM D'),
  }))

  return (
    <ResponsiveContainer width="100%" height={260}>
      <BarChart
        data={chartData}
        margin={{ top: 4, right: 4, left: -20, bottom: 0 }}
        barSize={4}
        barCategoryGap="20%"
      >
        <CartesianGrid stroke="#1e2040" vertical={false} />
        <XAxis
          dataKey="label"
          tick={{ fill: '#4a4d70', fontSize: 9, fontFamily: '"JetBrains Mono", monospace' }}
          tickLine={false}
          axisLine={false}
          interval={13}
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
          cursor={{ fill: '#1e2040' }}
        />
        <Legend
          iconType="square"
          iconSize={8}
          formatter={(value: string) =>
            <span style={{ fontSize: 9, color: '#4a4d70', fontFamily: '"JetBrains Mono", monospace' }}>{value}</span>
          }
        />
        {PLATFORMS.map(p => (
          <Bar
            key={p}
            dataKey={p}
            stackId="a"
            fill={PLATFORM_COLORS[p]}
            name={p}
          />
        ))}
      </BarChart>
    </ResponsiveContainer>
  )
}
