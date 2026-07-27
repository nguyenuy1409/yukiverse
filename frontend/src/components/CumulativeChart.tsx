import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts'
import { useCumulative } from '../hooks/useStats'
import { useTheme } from '../contexts/ThemeContext'
import { PLATFORM_COLORS, SAKURA_PLATFORM_COLORS } from '../types'
import { ChartSkeleton } from './Skeleton'
import dayjs from 'dayjs'

const PLATFORMS = ['codeforces', 'leetcode', 'github', 'atcoder'] as const

function getChartTheme(theme: string) {
  if (theme === 'sakura') return {
    grid:          'rgba(255, 190, 170, 0.14)',
    tick:          '#c8a898',
    tooltipBg:     'rgba(20, 12, 9, 0.88)',
    tooltipBorder: '1px solid rgba(255,255,255,0.18)',
    tooltipRadius: 10,
    tooltipShadow: '0 8px 24px rgba(0,0,0,0.30)',
    labelColor:    '#f0e4dc',
    itemColor:     '#e8d0c8',
    cursor:        'rgba(255,190,170,0.10)',
    legendColor:   '#c0907a',
  }
  // cyber
  return {
    grid:          '#1e2040',
    tick:          '#4a4d70',
    tooltipBg:     '#0d0d1c',
    tooltipBorder: '2px solid #1e2040',
    tooltipRadius: 0,
    tooltipShadow: '4px 4px 0 0 rgba(0,0,0,0.9)',
    labelColor:    '#b8bce8',
    itemColor:     '#b8bce8',
    cursor:        '#1e2040',
    legendColor:   '#4a4d70',
  }
}

export function CumulativeChart() {
  const { data, loading, error } = useCumulative()
  const { theme } = useTheme()
  const t = getChartTheme(theme)
  const areaColors = theme === 'sakura' ? SAKURA_PLATFORM_COLORS : PLATFORM_COLORS

  if (loading) return <ChartSkeleton height={260} />
  if (error)
    return (
      <p className="text-sm text-red-400">
        Failed to load cumulative data: {error}
      </p>
    )

  const chartData = (data?.days ?? []).map(d => ({
    ...d,
    label: dayjs(d.date).format('MMM D'),
  }))

  return (
    <ResponsiveContainer width="100%" height={260}>
      <AreaChart
        data={chartData}
        margin={{ top: 4, right: 4, left: -20, bottom: 0 }}
      >
        <defs>
          {PLATFORMS.map(p => (
            <linearGradient key={p} id={`grad-${p}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%"  stopColor={areaColors[p]} stopOpacity={0.25} />
              <stop offset="95%" stopColor={areaColors[p]} stopOpacity={0} />
            </linearGradient>
          ))}
        </defs>

        <CartesianGrid stroke={t.grid} vertical={false} />
        <XAxis
          dataKey="label"
          tick={{ fill: t.tick, fontSize: 9, fontFamily: '"JetBrains Mono", monospace' }}
          tickLine={false}
          axisLine={false}
          interval={Math.floor(chartData.length / 6)}
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
          cursor={{ stroke: t.cursor }}
        />
        <Legend
          iconType="square"
          iconSize={8}
          formatter={(value: string) =>
            <span style={{ fontSize: 9, color: t.legendColor, fontFamily: '"JetBrains Mono", monospace' }}>{value}</span>
          }
        />
        {PLATFORMS.map(p => (
          <Area
            key={p}
            type="stepAfter"
            dataKey={p}
            stackId="1"
            stroke={areaColors[p]}
            strokeWidth={1.5}
            fill={`url(#grad-${p})`}
            name={p}
            dot={false}
          />
        ))}
      </AreaChart>
    </ResponsiveContainer>
  )
}
