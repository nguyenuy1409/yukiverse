import { PlatformCards }   from './components/PlatformCards'
import { SyncStatus }       from './components/SyncStatus'
import { ActivityHeatmap }  from './components/ActivityHeatmap'
import { DailyChart }       from './components/DailyChart'
import { CumulativeChart }  from './components/CumulativeChart'
import { RatingChart }      from './components/RatingChart'
import { ActivityFeed }     from './components/ActivityFeed'

// ---------------------------------------------------------------------------
// Pixel panel section wrapper
// ---------------------------------------------------------------------------
function Section({
  title,
  children,
}: {
  title: string
  children: React.ReactNode
}) {
  return (
    <div className="pixel-panel">
      <div className="pixel-title-bar">
        <span>&gt; {title}</span>
      </div>
      <div className="p-4">{children}</div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// App
// ---------------------------------------------------------------------------
export default function App() {
  return (
    <div className="min-h-screen bg-px-bg">

      {/* ── Header ─────────────────────────────────────────────────────── */}
      <header className="border-b-2 border-px-border bg-px-panel"
        style={{ boxShadow: '0 4px 0 0 rgba(0,0,0,0.8)' }}>
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4">

          {/* Logo */}
          <div>
            <h1 className="font-pixel text-base leading-none">
              <span className="text-cf">YUKI</span>
              <span className="text-px-text">VERSE</span>
            </h1>
            <p className="mt-2 font-pixel text-[7px] text-px-dim">
              CP DASHBOARD v1.0
            </p>
          </div>

          {/* GitHub link */}
          <a
            href="https://github.com/nguyenuy1409"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 border-2 border-px-border bg-px-bg px-3 py-2 font-pixel text-[7px] text-px-dim transition-colors hover:border-cf hover:text-cf"
            style={{ boxShadow: '2px 2px 0 0 rgba(0,0,0,0.9)' }}
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 0C5.37 0 0 5.37 0 12c0 5.3 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 21.795 24 17.295 24 12c0-6.63-5.37-12-12-12" />
            </svg>
            NGUYENUY1409
          </a>
        </div>
      </header>

      {/* ── Main ───────────────────────────────────────────────────────── */}
      <main className="mx-auto max-w-6xl space-y-4 px-4 py-6">

        {/* Sync status */}
        <SyncStatus />

        {/* Platform stat cards */}
        <PlatformCards />

        {/* Heatmap */}
        <Section title="ACTIVITY HEATMAP // last 365 days">
          <ActivityHeatmap />
        </Section>

        {/* Daily + Feed */}
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

        {/* Cumulative + Rating */}
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          <Section title="CUMULATIVE PROGRESS">
            <CumulativeChart />
          </Section>
          <Section title="RATING HISTORY">
            <RatingChart />
          </Section>
        </div>

      </main>

      {/* ── Footer ─────────────────────────────────────────────────────── */}
      <footer className="mt-12 border-t-2 border-px-border py-6">
        <p className="text-center font-pixel text-[7px] text-px-dim">
          AUTO-SYNC: CF/AC/LC EVERY 6H &nbsp;|&nbsp; GH EVERY 1H
        </p>
      </footer>

    </div>
  )
}
