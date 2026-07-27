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
import { useTheme } from '../contexts/ThemeContext'
import { PLATFORM_COLORS } from '../types'
import { ChartSkeleton } from './Skeleton'
import dayjs from 'dayjs'

const PLATFORMS = ['codeforces', 'leetcode', 'github', 'atcoder'] as const

function getChartTheme(theme: string) {
  if (theme === 'sakura') return {
    grid:        'rgba(255, 190, 170, 0.14)',
    tick:        '#c8a898',
    tooltipBg:   'rgba(20, 12, 9, 0.88)',
    tooltipBorder: '1px solid rgba(255,255,255,0.18)',
    tooltipRadius: 10,
    tooltipShadow: '0 8px 24px rgba(0,0,0,0.30)',
    labelColor:  '#f0e4dc',
    itemColor:   '#e8d0c8',
    cursor:      'rgba(255,190,170,0.10)',
    legendColor: '#c0907a',
  }
  // cyber
  return {
    grid:        '#1e2040',
    tick:        '#4a4d70',
    tooltipBg:   '#0d0d1c',
    tooltipBorder: '2px solid #1e2040',
    tooltipRadius: 0,
    tooltipShadow: '4px 4px 0 0 rgba(0,0,0,0.9)',
    labelColor:  '#b8bce8',
    itemColor:   '#b8bce8',
    cursor:      '#1e2040',
    legendColor: '#4a4d70',
  }
}

export function DailyChart() {
  const { data, loading, error } = useDaily(90)
  const { theme } = useTheme()
  const t = getChartTheme(theme)

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
        <CartesianGrid stroke={t.grid} vertical={false} />
        <XAxis
          dataKey="label"
          tick={{ fill: t.tick, fontSize: 9, fontFamily: '"JetBrains Mono", monospace' }}
          tickLine={false}
          axisLine={false}
          interval={13}
        />
        <YAxis
          tick={{ fill: t.tick, fontSize: 9, fontFamily: '"JetBrains Mono", monospace' }}
          tickLine={false}
          axisLine={false}
        />
        <Tooltip
          contentStyle={{
            backgroundColor: t.tooltipBg,
            border: t.tooltipBorder,
            borderRadius: t.tooltipRadius,
            fontSize: 10,
            fontFamily: '"JetBrains Mono", monospace',
            boxShadow: t.tooltipShadow,
          }}
          labelStyle={{ color: t.labelColor, marginBottom: 4 }}
          itemStyle={{ color: t.itemColor }}
          cursor={{ fill: t.cursor }}
        />
        <Legend
          iconType="square"
          iconSize={8}
          formatter={(value: string) =>
            <span style={{ fontSize: 9, color: t.legendColor, fontFamily: '"JetBrains Mono", monospace' }}>{value}</span>
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
