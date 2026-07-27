import { ThemeProvider, useTheme } from './contexts/ThemeContext'
import { ThemeSwitcher }    from './components/ThemeSwitcher'
import { PlatformCards }    from './components/PlatformCards'
import { SyncStatus }       from './components/SyncStatus'
import { ActivityHeatmap }  from './components/ActivityHeatmap'
import { DailyChart }       from './components/DailyChart'
import { CumulativeChart }  from './components/CumulativeChart'
import { RatingChart }      from './components/RatingChart'
import { ActivityFeed }     from './components/ActivityFeed'
import { SakuraPetals }     from './components/SakuraPetals'

// ── Section wrapper — layout unchanged ───────────────────────────────────────

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

// ── Main app content ──────────────────────────────────────────────────────────

function AppContent() {
  const { theme } = useTheme()
  const isSakura  = theme === 'sakura'

  // GitHub button adapts style to current theme
  const ghLinkStyle: React.CSSProperties = isSakura
    ? {
        background: 'rgba(28, 16, 12, 0.55)',
        backdropFilter: 'blur(10px)',
        WebkitBackdropFilter: 'blur(10px)',
        border: '1px solid rgba(192, 144, 96, 0.45)',
        borderRadius: '10px',
        color: '#c8c0b0',
        boxShadow: 'none',
      }
    : {
        boxShadow: '2px 2px 0 0 rgba(0,0,0,0.9)',
      }

  return (
    <div className="relative min-h-screen">
      {/* Falling petals — sakura mode only, above bg, below all panels */}
      {isSakura && <SakuraPetals />}

      {/* All UI content */}
      <div className="relative" style={{ zIndex: 10 }}>

        {/* ── Header ─────────────────────────────────────────────────────── */}
        <header
          className="border-b-2 border-px-border bg-px-panel"
          style={{ boxShadow: '0 4px 0 0 rgba(0,0,0,0.8)' }}
        >
          <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4">

            <div className="relative">
              {/* Cherry blossom branch decoration — sakura mode only */}
              {isSakura && (
                <svg
                  aria-hidden="true"
                  width="130" height="52"
                  viewBox="0 0 130 52"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                  style={{
                    position: 'absolute',
                    top: '-18px',
                    left: '-18px',
                    pointerEvents: 'none',
                    opacity: 0.82,
                  }}
                >
                  {/* Main branch */}
                  <path d="M8 44 Q32 28 58 18 Q80 10 108 6" stroke="#b07048" strokeWidth="1.8" strokeLinecap="round" fill="none" />
                  {/* Sub-branch left */}
                  <path d="M30 34 Q24 22 18 14" stroke="#b07048" strokeWidth="1.2" strokeLinecap="round" fill="none" />
                  {/* Sub-branch right */}
                  <path d="M72 16 Q80 8 90 4" stroke="#b07048" strokeWidth="1.2" strokeLinecap="round" fill="none" />

                  {/* Blossoms — 5-petal flowers at branch tips and nodes */}
                  {/* Flower helper: cx, cy, r, hue */}
                  {[
                    { cx: 18, cy: 14, r: 5,   h: 345 },
                    { cx: 30, cy: 34, r: 4,   h: 350 },
                    { cx: 90, cy:  4, r: 4.5, h: 340 },
                    { cx: 108,cy:  6, r: 5,   h: 348 },
                    { cx: 58, cy: 18, r: 3.5, h: 343 },
                    { cx: 44, cy: 26, r: 3,   h: 352 },
                    { cx: 80, cy: 10, r: 3.5, h: 338 },
                  ].map(({ cx, cy, r, h }, i) => (
                    <g key={i}>
                      {/* 5 petals */}
                      {[0, 72, 144, 216, 288].map((angle, j) => {
                        const rad = (angle * Math.PI) / 180
                        const px = cx + Math.cos(rad) * r * 1.1
                        const py = cy + Math.sin(rad) * r * 1.1
                        return (
                          <ellipse
                            key={j}
                            cx={px} cy={py}
                            rx={r * 0.8} ry={r * 0.55}
                            transform={`rotate(${angle + 90}, ${px}, ${py})`}
                            fill={`hsl(${h}, 72%, 88%)`}
                            fillOpacity={0.90}
                          />
                        )
                      })}
                      {/* Center */}
                      <circle cx={cx} cy={cy} r={r * 0.28} fill="#f5c0d0" fillOpacity={0.95} />
                    </g>
                  ))}

                  {/* Scattered petals floating near the title */}
                  <ellipse cx="50" cy="8"  rx="3" ry="2" transform="rotate(-20, 50, 8)"  fill="#f2cad4" fillOpacity="0.75" />
                  <ellipse cx="96" cy="16" rx="2.5" ry="1.6" transform="rotate(15, 96, 16)" fill="#eabac8" fillOpacity="0.65" />
                  <ellipse cx="22" cy="42" rx="2.5" ry="1.5" transform="rotate(-35, 22, 42)" fill="#f2cad4" fillOpacity="0.60" />
                </svg>
              )}

              <h1 className="font-pixel text-base leading-none">
                <span className="text-cf">YUKI</span>
                <span className="text-px-text">VERSE</span>
              </h1>
              <p className="mt-2 font-pixel text-[7px] text-px-dim">
                CP DASHBOARD v1.0
              </p>
            </div>

            <div className="flex items-center gap-3">
              {/* Responsive 3-theme segmented control */}
              <ThemeSwitcher />

              <a
                href="https://github.com/nguyenuy1409"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 border-2 border-px-border bg-px-bg px-3 py-2 font-pixel text-[7px] text-px-dim transition-colors hover:border-gh hover:text-gh"
                style={ghLinkStyle}
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 0C5.37 0 0 5.37 0 12c0 5.3 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 21.795 24 17.295 24 12c0-6.63-5.37-12-12-12" />
                </svg>
                NGUYENUY1409
              </a>
            </div>
          </div>
        </header>

        {/* ── Main — layout & grid unchanged ─────────────────────────────── */}
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

        {/* ── Footer ─────────────────────────────────────────────────────── */}
        <footer className="mt-12 border-t-2 border-px-border py-6">
          <p className="text-center font-pixel text-[7px] text-px-dim">
            AUTO-SYNC: CF/AC/LC EVERY 6H &nbsp;|&nbsp; GH EVERY 1H
          </p>
        </footer>

      </div>
    </div>
  )
}

// ── Root ──────────────────────────────────────────────────────────────────────

export default function App() {
  return (
    <ThemeProvider>
      <AppContent />
    </ThemeProvider>
  )
}
