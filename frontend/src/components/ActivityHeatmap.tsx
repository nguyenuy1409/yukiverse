import { useMemo } from 'react'
import { useHeatmap } from '../hooks/useStats'
import { ChartSkeleton } from './Skeleton'
import dayjs from 'dayjs'

// Number of weeks to show (52 = 1 year)
const WEEKS = 53
const DAYS  = 7

// Pixel art green matrix color scale
function cellColor(count: number): string {
  if (count === 0)  return '#0a0a14'  // bg (invisible)
  if (count <= 2)   return '#003311'  // barely there
  if (count <= 5)   return '#005522'  // dim
  if (count <= 10)  return '#008833'  // medium
  if (count <= 20)  return '#00bb44'  // bright
  return '#00ff66'                     // max intensity
}

export function ActivityHeatmap() {
  const { data, loading, error } = useHeatmap(365)

  // Build a date -> count lookup
  const countMap = useMemo(() => {
    const map = new Map<string, number>()
    for (const d of data?.days ?? []) {
      map.set(d.date, d.count)
    }
    return map
  }, [data])

  // Build the grid: array of WEEKS columns, each column = 7 days (Sun..Sat)
  const grid = useMemo(() => {
    // Start from the Sunday of the week that is (WEEKS-1) weeks ago
    const today = dayjs()
    // Go to the end of the current week (Saturday)
    const endSaturday = today.day(6)
    const startSunday = endSaturday.subtract(WEEKS * 7 - 1, 'day')

    const weeks: Array<Array<{ date: string; count: number; isFuture: boolean }>> = []

    for (let w = 0; w < WEEKS; w++) {
      const week: Array<{ date: string; count: number; isFuture: boolean }> = []
      for (let d = 0; d < DAYS; d++) {
        const date = startSunday.add(w * 7 + d, 'day')
        const dateStr = date.format('YYYY-MM-DD')
        week.push({
          date:     dateStr,
          count:    countMap.get(dateStr) ?? 0,
          isFuture: date.isAfter(today, 'day'),
        })
      }
      weeks.push(week)
    }

    return weeks
  }, [countMap])

  // Month labels: find which column corresponds to the 1st of each month
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
  if (error)
    return (
      <p className="text-sm text-red-400">Failed to load heatmap: {error}</p>
    )

  return (
    <div>
      <div className="overflow-x-auto">
        {/* Month labels row */}
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

        {/* Grid: 7 rows, WEEKS columns */}
        <div className="flex gap-0.5 mt-1">
          {/* Day-of-week labels */}
          <div className="flex flex-col gap-0.5 pr-1">
            {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((d, i) => (
              <div key={i} className="h-[13px] w-4 font-pixel text-[6px] leading-[13px] text-px-dim">
                {i % 2 === 1 ? d : ''}
              </div>
            ))}
          </div>

          {/* Week columns */}
          {grid.map((week, wi) => (
            <div key={wi} className="flex flex-col gap-0.5">
              {week.map(({ date, count, isFuture }) => (
                <div
                  key={date}
                  className="h-[13px] w-[13px] cursor-default"
                  style={{
                    backgroundColor: isFuture ? 'transparent' : cellColor(count),
                    opacity: isFuture ? 0 : 1,
                    imageRendering: 'pixelated',
                  }}
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
        {[0, 2, 5, 10, 21].map(v => (
          <div
            key={v}
            className="h-[10px] w-[10px]"
            style={{ backgroundColor: cellColor(v), imageRendering: 'pixelated' }}
          />
        ))}
        <span className="font-pixel text-[6px] text-px-dim">MORE</span>
      </div>
    </div>
  )
}
