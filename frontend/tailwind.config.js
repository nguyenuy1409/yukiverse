/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        // Platform accent colors (retro-saturated)
        cf: '#38bdf8',
        ac: '#fb923c',
        lc: '#fbbf24',
        gh: '#4ade80',
        // Pixel art dark palette
        px: {
          bg:      '#07070f',
          panel:   '#0d0d1c',
          border:  '#1e2040',
          border2: '#2a2d50',
          muted:   '#3a3d60',
          text:    '#b8bce8',
          dim:     '#4a4d70',
        },
      },
      fontFamily: {
        pixel: ['"Press Start 2P"', 'monospace'],
        mono:  ['"JetBrains Mono"', 'monospace'],
      },
      boxShadow: {
        pixel:    '4px 4px 0 0 rgba(0,0,0,0.9)',
        'pixel-cf': '4px 4px 0 0 #38bdf8',
        'pixel-ac': '4px 4px 0 0 #fb923c',
        'pixel-lc': '4px 4px 0 0 #fbbf24',
        'pixel-gh': '4px 4px 0 0 #4ade80',
      },
    },
  },
  plugins: [],
}
