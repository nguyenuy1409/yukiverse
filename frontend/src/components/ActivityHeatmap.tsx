import { useMemo } from 'react'
import { useHeatmap } from '../hooks/useStats'
import { useTheme } from '../contexts/ThemeContext'
import { ChartSkeleton } from './Skeleton'
import dayjs from 'dayjs'

const WEEKS = 53
const DAYS  = 7

function cellColor(count: number, theme: string): string {
  if (theme === 'sakura') {
    // Empty → transparent; then soft peach pink → deep coral
    // Matching the muted, sophisticated tones of the reference image
    if (count === 0)  return 'rgba(255, 255, 255, 0.10)'  // barely visible
    if (count <= 2)   return '#f2cad4'   // soft peach-pink (blossom light)
    if (count <= 5)   return '#e8a0b0'   // muted sakura mid
    if (count <= 10)  return '#d4607a'   // warm coral
    if (count <= 20)  return '#bc3858'   // deep coral-rose
    return '#943040'                      // rich deep coral
  }
  // Cyber: green matrix
  if (count === 0)  return '#0a0a14'
  if (count <= 2)   return '#003311'
  if (count <= 5)   return '#005522'
  if (count <= 10)  return '#008833'
  if (count <= 20)  return '#00bb44'
  return '#00ff66'
}

export function ActivityHeatmap() {
  const { data, loading, error } = useHeatmap(365)
  const { theme } = useTheme()
  const isSakura = theme === 'sakura'

  const countMap = useMemo(() => {
    const map = new Map<string, number>()
    for (const d of data?.days ?? []) map.set(d.date, d.count)
    return map
  }, [data])

  const grid = useMemo(() => {
    const today       = dayjs()
    const endSaturday = today.day(6)
    const startSunday = endSaturday.subtract(WEEKS * 7 - 1, 'day')
    const weeks: Array<Array<{ date: string; count: number; isFuture: boolean }>> = []
    for (let w = 0; w < WEEKS; w++) {
      const week: Array<{ date: string; count: number; isFuture: boolean }> = []
      for (let d = 0; d < DAYS; d++) {
        const date = startSunday.add(w * 7 + d, 'day')
        const dateStr = date.format('YYYY-MM-DD')
        week.push({ date: dateStr, count: countMap.get(dateStr) ?? 0, isFuture: date.isAfter(today, 'day') })
      }
      weeks.push(week)
    }
    return weeks
  }, [countMap])

  const monthLabels = useMemo(() => {
    const labels: Array<{ week: number; label: string }> = []
    let lastMonth = -1
    grid.forEach((week, wi) => {
      const firstDay = dayjs(week[0]!.date)
      if (firstDay.month() !== lastMonth) {
        labels.push({ week: wi, label: firstDay.format('MMM') })
        lastMonth = firstDay.month()
      }
    })
    return labels
  }, [grid])

  if (loading) return <ChartSkeleton height={130} />
  if (error) return <p className="text-sm text-red-400">Failed to load heatmap: {error}</p>

  const legendValues = [0, 2, 5, 10, 21]
  const cellStyle = (count: number, isFuture: boolean) => ({
    backgroundColor: isFuture ? 'transparent' : cellColor(count, theme),
    opacity: isFuture ? 0 : 1,
    imageRendering: 'pixelated' as const,
    borderRadius: isSakura ? '3px' : '0',
    transition: 'background-color 0.4s ease',
  })

  return (
    <div>
      <div className="overflow-x-auto">
        {/* Month labels */}
        <div className="flex" style={{ paddingLeft: 28 }}>
          {grid.map((_, wi) => {
            const label = monthLabels.find(m => m.week === wi)
            return (
              <div key={wi} className="w-[14px] flex-shrink-0 font-pixel text-[6px] text-px-dim">
                {label?.label ?? ''}
              </div>
            )
          })}
        </div>

        {/* Grid */}
        <div className="flex gap-0.5 mt-1">
          <div className="flex flex-col gap-0.5 pr-1">
            {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((d, i) => (
              <div key={i} className="h-[13px] w-4 font-pixel text-[6px] leading-[13px] text-px-dim">
                {i % 2 === 1 ? d : ''}
              </div>
            ))}
          </div>
          {grid.map((week, wi) => (
            <div key={wi} className="flex flex-col gap-0.5">
              {week.map(({ date, count, isFuture }) => (
                <div
                  key={date}
                  className="h-[13px] w-[13px] cursor-default"
                  style={cellStyle(count, isFuture)}
                  title={isFuture ? '' : `${date}: ${count} activities`}
                />
              ))}
            </div>
          ))}
        </div>
      </div>

      {/* Legend */}
      <div className="mt-2 flex items-center gap-1.5 justify-end">
        <span className="font-pixel text-[6px] text-px-dim">LESS</span>
        {legendValues.map(v => (
          <div
            key={v}
            className="h-[10px] w-[10px]"
            style={{
              backgroundColor: cellColor(v, theme),
              imageRendering: 'pixelated',
              borderRadius: isSakura ? '2px' : '0',
              transition: 'background-color 0.4s ease',
            }}
          />
        ))}
        <span className="font-pixel text-[6px] text-px-dim">MORE</span>
      </div>
    </div>
  )
}
