import { useTheme } from '../contexts/ThemeContext'
import type { Theme } from '../contexts/ThemeContext'

// ── Theme config ─────────────────────────────────────────────────────────────

const THEMES: { id: Theme; icon: string; label: string }[] = [
  { id: 'cyber',  icon: '⚡', label: 'CYBER'  },
  { id: 'sakura', icon: '🌸', label: 'SAKURA' },
]

// ── Per-theme segment styles ──────────────────────────────────────────────────

function getContainerStyle(theme: Theme): React.CSSProperties {
  if (theme === 'sakura') return {
    background: 'rgba(20, 13, 10, 0.62)',
    backdropFilter: 'blur(20px) saturate(1.5)',
    WebkitBackdropFilter: 'blur(20px) saturate(1.5)',
    border: '1px solid rgba(255, 255, 255, 0.20)',
    borderRadius: '999px',
    boxShadow: '0 4px 16px rgba(0,0,0,0.28), inset 0 1px 0 rgba(255,255,255,0.10)',
  }
  // cyber
  return {
    background: 'rgb(7, 7, 15)',
    border: '2px solid rgb(30, 32, 64)',
    borderRadius: '0',
    boxShadow: '2px 2px 0 0 rgba(0,0,0,0.9)',
  }
}

function getActiveSegmentStyle(theme: Theme): React.CSSProperties {
  if (theme === 'sakura') return {
    background: 'rgba(240, 176, 192, 0.18)',
    borderRadius: '999px',
    boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.18), 0 0 8px rgba(192,144,96,0.15)',
  }
  // cyber
  return {
    background: 'rgb(30, 32, 64)',
    borderRadius: '0',
  }
}

function getTextStyle(theme: Theme, isActive: boolean): React.CSSProperties {
  const base: React.CSSProperties = {
    fontFamily: '"Press Start 2P", monospace',
    fontSize: '6px',
    letterSpacing: '0.08em',
    transition: 'color 0.3s ease',
  }
  if (theme === 'sakura') {
    return { ...base, color: isActive ? '#f0b0c0' : 'rgba(200, 192, 176, 0.70)' }
  }
  // cyber
  return { ...base, color: isActive ? '#b8bce8' : 'rgba(74,77,112,0.70)' }
}

// ── Component ─────────────────────────────────────────────────────────────────

export function ThemeSwitcher() {
  const { theme, setTheme } = useTheme()
  const currentIndex = THEMES.findIndex(t => t.id === theme)

  function cycleTheme() {
    const next = THEMES[(currentIndex + 1) % THEMES.length]!
    setTheme(next.id)
  }

  const containerStyle = getContainerStyle(theme)
  const activeStyle    = getActiveSegmentStyle(theme)

  return (
    <>
      {/* ── Desktop: segmented control ── */}
      <div
        className="hidden md:flex items-center p-0.5"
        style={containerStyle}
      >
        {THEMES.map(t => {
          const isActive = t.id === theme
          return (
            <button
              key={t.id}
              onClick={() => setTheme(t.id)}
              className="relative flex items-center gap-1.5 px-3 py-1.5 transition-all duration-300"
              style={isActive ? activeStyle : { borderRadius: 'inherit' }}
              title={`Switch to ${t.label} mode`}
            >
              <span style={{ fontSize: '10px', lineHeight: 1 }}>{t.icon}</span>
              <span style={getTextStyle(theme, isActive)}>{t.label}</span>
            </button>
          )
        })}
      </div>

      {/* ── Mobile: cycling icon button ── */}
      <button
        className="md:hidden flex items-center justify-center w-9 h-9"
        onClick={cycleTheme}
        style={{
          ...containerStyle,
          borderRadius: theme === 'cyber' ? '4px' : '999px',
          width: '36px',
          height: '36px',
          padding: 0,
        }}
        title={`Current: ${THEMES[currentIndex]?.label ?? ''} — tap to switch`}
      >
        <span style={{ fontSize: '14px', lineHeight: 1 }}>
          {THEMES[currentIndex]?.icon}
        </span>
      </button>
    </>
  )
}
