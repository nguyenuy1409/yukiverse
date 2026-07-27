import { createContext, useContext, useState, useEffect } from 'react'
import type { ReactNode } from 'react'

export type Theme = 'cyber' | 'sakura'

interface ThemeCtx {
  theme:     Theme
  setTheme:  (t: Theme) => void
}

const ThemeContext = createContext<ThemeCtx>({
  theme:    'cyber',
  setTheme: () => {},
})

const STORAGE_KEY = 'yukiverse-theme'

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<Theme>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY) as Theme
      // guard: drop any old 'trading' value
      if (saved === 'cyber' || saved === 'sakura') return saved
      return 'cyber'
    } catch { return 'cyber' }
  })

  // Apply data-theme on <html> so CSS [data-theme="..."] selectors work
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme)
    try { localStorage.setItem(STORAGE_KEY, theme) } catch { /* */ }
  }, [theme])

  function setTheme(t: Theme) { setThemeState(t) }

  return (
    <ThemeContext.Provider value={{ theme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  )
}

export const useTheme = () => useContext(ThemeContext)
