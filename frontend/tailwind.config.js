/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        // Platform accent colors — always the same regardless of theme
        cf: '#38bdf8',
        ac: '#fb923c',
        lc: '#fbbf24',
        gh: '#4ade80',
        // Theme-aware palette — driven by CSS custom properties on :root
        px: {
          bg:      'rgb(var(--px-bg) / <alpha-value>)',
          panel:   'rgb(var(--px-panel) / <alpha-value>)',
          border:  'rgb(var(--px-border) / <alpha-value>)',
          border2: 'rgb(var(--px-border2) / <alpha-value>)',
          muted:   'rgb(var(--px-muted) / <alpha-value>)',
          text:    'rgb(var(--px-text) / <alpha-value>)',
          dim:     'rgb(var(--px-dim) / <alpha-value>)',
        },
      },
      fontFamily: {
        sans:        ['Inter', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        pixel:       ['"Press Start 2P"', 'monospace'],
        mono:        ['"JetBrains Mono"', 'monospace'],
        geist:       ['Geist', 'ui-sans-serif', 'sans-serif'],
        'geist-mono': ['"Geist Mono"', 'ui-monospace', 'monospace'],
      },
      boxShadow: {
        pixel:       '4px 4px 0 0 rgba(0,0,0,0.9)',
        'pixel-cf':  '4px 4px 0 0 #38bdf8',
        'pixel-ac':  '4px 4px 0 0 #fb923c',
        'pixel-lc':  '4px 4px 0 0 #fbbf24',
        'pixel-gh':  '4px 4px 0 0 #4ade80',
      },
    },
  },
  plugins: [],
}
