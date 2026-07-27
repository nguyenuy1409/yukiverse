import { useTheme }        from '../contexts/ThemeContext'
import { PlatformCards }   from '../components/PlatformCards'
import { SyncStatus }      from '../components/SyncStatus'
import { ActivityHeatmap } from '../components/ActivityHeatmap'
import { DailyChart }      from '../components/DailyChart'
import { CumulativeChart } from '../components/CumulativeChart'
import { RatingChart }     from '../components/RatingChart'
import { ActivityFeed }    from '../components/ActivityFeed'

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="pixel-panel">
      <div className="pixel-title-bar">
        <span>&gt; {title}</span>
      </div>
      <div className="p-4">{children}</div>
    </div>
  )
}

export function DashboardPage() {
  const { theme } = useTheme()
  const isSakura  = theme === 'sakura'
  void isSakura

  return (
    <main className="mx-auto max-w-6xl space-y-4 px-4 py-6">
      <SyncStatus />
      <PlatformCards />

      <Section title="ACTIVITY HEATMAP // last 365 days">
        <ActivityHeatmap />
      </Section>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-5">
        <div className="lg:col-span-3">
          <Section title="DAILY ACTIVITY // last 90 days">
            <DailyChart />
          </Section>
        </div>
        <div className="lg:col-span-2">
          <Section title="ACTIVITY FEED">
            <ActivityFeed />
          </Section>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Section title="CUMULATIVE PROGRESS">
          <CumulativeChart />
        </Section>
        <Section title="RATING HISTORY">
          <RatingChart />
        </Section>
      </div>
    </main>
  )
}
