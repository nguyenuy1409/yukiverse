import { BrowserRouter, Routes, Route, NavLink, useNavigate } from 'react-router-dom'
import { ThemeProvider, useTheme } from './contexts/ThemeContext'
import { ThemeSwitcher }           from './components/ThemeSwitcher'
import { SakuraPetals }            from './components/SakuraPetals'
import { HomePage }                from './pages/HomePage'
import { DashboardPage }           from './pages/DashboardPage'
import { BlogPage }                from './pages/BlogPage'
import { ResourcesPage }           from './pages/ResourcesPage'
import { useState }                from 'react'

const BLOG_CATEGORIES = ['All', 'Core Systems & C++', 'HFT & Quant', 'Finance', 'Mathematics', 'Curations']

// ── Nav tab ───────────────────────────────────────────────────────────────────

function NavTab({ to, label }: { to: string; label: string }) {
  const { theme } = useTheme()
  const isSakura  = theme === 'sakura'

  return (
    <NavLink
      to={to}
      className={({ isActive }) =>
        [
          'inline-flex items-center font-pixel text-[7px] px-3 py-1.5 border-2 transition-all duration-200',
          isActive
            ? isSakura
              ? 'border-rose-300/60 text-rose-300 bg-rose-300/10'
              : 'border-cf text-cf bg-cf/10'
            : isSakura
              ? 'border-white/20 text-white/80 hover:text-white hover:bg-white/10 hover:border-white/40'
              : 'border-px-border text-white/70 hover:text-white hover:bg-white/10 hover:border-white/30',
        ].join(' ')
      }
      style={isSakura ? undefined : { boxShadow: '2px 2px 0 0 rgba(0,0,0,0.9)' }}
    >
      {label}
    </NavLink>
  )
}

// ── Blog nav with hover mega-menu ─────────────────────────────────────────────

function BlogNavItem() {
  const { theme } = useTheme()
  const isSakura  = theme === 'sakura'
  const navigate  = useNavigate()
  const [open, setOpen] = useState(false)

  const goTo = (cat: string) => {
    setOpen(false)
    if (cat === 'All') navigate('/blog')
    else navigate(`/blog?category=${encodeURIComponent(cat)}`)
  }

  return (
    <div
      className="relative"
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
    >
      {/* Button — identical size/padding to NavTab */}
      <NavLink
        to="/blog"
        className={({ isActive }) =>
          [
            'inline-flex items-center gap-1 font-pixel text-[7px] px-3 py-1.5 border-2 transition-all duration-200',
            isActive
              ? isSakura
                ? 'border-rose-300/60 text-rose-300 bg-rose-300/10'
                : 'border-cf text-cf bg-cf/10'
              : isSakura
                ? 'border-white/20 text-white/80 hover:text-white hover:bg-white/10 hover:border-white/40'
                : 'border-px-border text-white/70 hover:text-white hover:bg-white/10 hover:border-white/30',
          ].join(' ')
        }
        style={isSakura ? undefined : { boxShadow: '2px 2px 0 0 rgba(0,0,0,0.9)' }}
      >
        BLOG
        <span
          className="transition-transform duration-200 inline-block"
          style={{ transform: open ? 'rotate(180deg)' : 'rotate(0deg)', fontSize: '8px' }}
        >
          ▾
        </span>
      </NavLink>

      {/* Mega-menu — CSS transition, centered under button */}
      {/* invisible bridge: fills the gap between button and menu so hover doesn't break */}
      <div className="absolute top-full left-0 w-full h-3 z-[99]" />
      <div
        className="absolute top-full left-1/2 z-[99] pt-3 transition-all duration-250 ease-out"
        style={{
          transform: open
            ? 'translateX(-50%) translateY(0)'
            : 'translateX(-50%) translateY(6px)',
          opacity: open ? 1 : 0,
          pointerEvents: open ? 'auto' : 'none',
          visibility: open ? 'visible' : 'hidden',
        }}
      >
        {/* Arrow pointer */}
        <div
          className="mx-auto mb-0 h-0 w-0"
          style={{
            borderLeft: '6px solid transparent',
            borderRight: '6px solid transparent',
            borderBottom: isSakura
              ? '6px solid rgba(255,182,193,0.3)'
              : '6px solid #1e2040',
            width: 'fit-content',
          }}
        />
        <div
          className="flex items-center justify-center gap-1 px-3 py-2 w-max"
          style={isSakura ? {
            background: 'rgba(20,10,14,0.90)',
            backdropFilter: 'blur(20px)',
            WebkitBackdropFilter: 'blur(20px)',
            border: '1px solid rgba(255,182,193,0.30)',
            borderRadius: '12px',
            boxShadow: '0 12px 40px rgba(0,0,0,0.35)',
          } : {
            background: '#0b0b1a',
            border: '2px solid #1e2040',
            boxShadow: '4px 4px 0 0 rgba(0,0,0,0.9)',
          }}
        >
          {BLOG_CATEGORIES.map((cat, i) => (
            <button
              key={cat}
              onClick={() => goTo(cat)}
              className="font-pixel text-[6.5px] tracking-widest px-3 py-1.5 transition-all duration-150 whitespace-nowrap"
              style={isSakura ? {
                color: 'rgba(255,255,255,0.65)',
                borderRadius: '8px',
                border: '1px solid transparent',
              } : {
                color: 'rgba(255,255,255,0.50)',
                border: '1px solid transparent',
              }}
              onMouseEnter={e => {
                const el = e.currentTarget
                el.style.color = isSakura ? '#fda4af' : '#a5b4fc'
                el.style.borderColor = isSakura ? 'rgba(253,164,175,0.35)' : 'rgba(165,180,252,0.25)'
                el.style.background = isSakura ? 'rgba(253,164,175,0.10)' : 'rgba(165,180,252,0.08)'
              }}
              onMouseLeave={e => {
                const el = e.currentTarget
                el.style.color = isSakura ? 'rgba(255,255,255,0.65)' : 'rgba(255,255,255,0.50)'
                el.style.borderColor = 'transparent'
                el.style.background = 'transparent'
              }}
            >
              {cat}
              {i < BLOG_CATEGORIES.length - 1 && (
                <span
                  className="ml-2 inline-block opacity-20"
                  style={{ fontSize: '8px', verticalAlign: 'middle' }}
                >
                  /
                </span>
              )}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}

// ── App shell ─────────────────────────────────────────────────────────────────

function AppShell() {
  const { theme } = useTheme()
  const isSakura  = theme === 'sakura'

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
      {isSakura && <SakuraPetals />}

      <div className="relative" style={{ zIndex: 10 }}>

        {/* ── Header ───────────────────────────────────────────────────────── */}
        <header
          className="relative z-[100] border-b-2 border-px-border bg-px-panel"
          style={{ boxShadow: '0 4px 0 0 rgba(0,0,0,0.8)' }}
        >
          <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4">

            {/* Logo + Nav */}
            <div className="flex items-center gap-6">
            <div className="relative">

              {/* Sakura branch — sits behind text via z-0 */}
              {isSakura && (
                <img
                  src="/sakura-branch.png"
                  alt=""
                  aria-hidden="true"
                  style={{
                    position: 'absolute',
                    top: '-22px',
                    left: '-10px',
                    width: '160px',
                    pointerEvents: 'none',
                    opacity: 0.80,
                    imageRendering: 'pixelated',
                    zIndex: 0,
                  }}
                />
              )}

              {/* Text — above branch */}
              <div className="relative" style={{ zIndex: 1 }}>
                <h1
                  className="font-pixel text-base leading-none"
                  style={isSakura ? {
                    filter: 'drop-shadow(0 1px 3px rgba(0,0,0,0.7)) drop-shadow(0 0px 6px rgba(0,0,0,0.5))',
                  } : undefined}
                >
                  <span className="text-cf">YUKI</span>
                  <span className="text-px-text">VERSE</span>
                </h1>
                <p
                  className="mt-2 font-pixel text-[7px] text-px-dim"
                  style={isSakura ? { filter: 'drop-shadow(0 1px 2px rgba(0,0,0,0.8))' } : undefined}
                >
                  DASHBOARD
                </p>
              </div>
            </div>

            {/* Nav tabs */}
            <nav className="flex items-center gap-2">
              <NavTab to="/"           label="HOME" />
              <NavTab to="/dashboard"  label="DASHBOARD" />
              <BlogNavItem />
              <NavTab to="/resources"  label="RESOURCES" />
            </nav>
            </div>

            {/* Right controls */}
            <div className="flex items-center gap-3">
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

        {/* ── Routes ───────────────────────────────────────────────────────── */}
        <Routes>
          <Route path="/"           element={<HomePage />} />
          <Route path="/dashboard"  element={<DashboardPage />} />
          <Route path="/blog"       element={<BlogPage />} />
          <Route path="/resources"  element={<ResourcesPage />} />
        </Routes>

        {/* ── Footer ───────────────────────────────────────────────────────── */}
        <footer className="mt-12 border-t-2 border-px-border py-6">
          <div className="flex justify-center">
            <span
              className="inline-block rounded-full px-4 py-2 text-sm font-medium tracking-wide backdrop-blur-md"
              style={isSakura ? {
                background: 'rgba(255,255,255,0.50)',
                border: '1px solid rgba(255,255,255,0.60)',
                color: '#1c1008',
              } : {
                background: 'rgba(0,0,0,0.60)',
                border: '1px solid rgba(6,182,212,0.50)',
                color: '#22d3ee',
              }}
            >
              © 2026 Uy Nguyen. All rights reserved.
            </span>
          </div>
        </footer>

      </div>
    </div>
  )
}

// ── Root ──────────────────────────────────────────────────────────────────────

export default function App() {
  return (
    <BrowserRouter>
      <ThemeProvider>
        <AppShell />
      </ThemeProvider>
    </BrowserRouter>
  )
}
