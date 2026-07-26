// Pixel art platform icons, rendered as SVG pixel grids.
// Each row is a string: '.' = transparent, letter = palette key.

interface PixelArtProps {
  rows:     string[]
  palette:  Record<string, string>
  cellSize: number
}

function PixelArt({ rows, palette, cellSize }: PixelArtProps) {
  const h = rows.length
  const w = rows[0]?.length ?? 0
  return (
    <svg
      width={w * cellSize}
      height={h * cellSize}
      viewBox={`0 0 ${w} ${h}`}
      style={{ imageRendering: 'pixelated', display: 'block', flexShrink: 0 }}
    >
      {rows.map((row, y) =>
        row.split('').map((ch, x) =>
          ch !== '.' && palette[ch] ? (
            <rect
              key={`${x}-${y}`}
              x={x} y={y}
              width={1} height={1}
              fill={palette[ch]}
            />
          ) : null
        )
      )}
    </svg>
  )
}

// ---------------------------------------------------------------------------
// Codeforces — bar chart (yellow | blue | red)
// Based on the CF bar-chart icon: blue tallest, yellow medium, red shortest
// ---------------------------------------------------------------------------
const CF_ROWS = [
  '..........',
  '....BB....',
  '....BB....',
  '.YY.BB....',
  '.YY.BB.RR.',
  '.YY.BB.RR.',
  '.YY.BB.RR.',
  '..........',
]
const CF_P = { Y: '#fbbf24', B: '#60a5fa', R: '#f87171' }

// ---------------------------------------------------------------------------
// LeetCode — orange C-bracket with grey horizontal bar
// ---------------------------------------------------------------------------
const LC_ROWS = [
  '.OOOOOO.',
  'OO.......',
  'O........',
  'O..GGGGG.',
  'O........',
  'OO.......',
  '.OOOOOO.',
]
const LC_P = { O: '#fb923c', G: '#9ca3af' }

// ---------------------------------------------------------------------------
// GitHub — Octocat silhouette (cat ears + round head + tentacles)
// ---------------------------------------------------------------------------
const GH_ROWS = [
  '.GGG.GGG.',
  'GGGGGGGGG',
  'G.G...G.G',
  'G.......G',
  '.GG...GG.',
  '.GGGGGGG.',
  '..GG.GG..',
  '..GG.GG..',
]
const GH_P = { G: '#e2e8f0' }

// ---------------------------------------------------------------------------
// AtCoder — globe grid (horizontal + vertical lines on round shape)
// ---------------------------------------------------------------------------
const AC_ROWS = [
  '..AAAAA..',
  '.A.A.A.A.',
  '.AAAAAAA.',
  '.A.A.A.A.',
  '.AAAAAAA.',
  '.A.A.A.A.',
  '..AAAAA..',
]
const AC_P = { A: '#93c5fd' }

// ---------------------------------------------------------------------------
// Named exports
// ---------------------------------------------------------------------------
export function CodeforcesPixel({ size = 2 }: { size?: number }) {
  return <PixelArt rows={CF_ROWS} palette={CF_P} cellSize={size} />
}
export function LeetCodePixel({ size = 2 }: { size?: number }) {
  return <PixelArt rows={LC_ROWS} palette={LC_P} cellSize={size} />
}
export function GitHubPixel({ size = 2 }: { size?: number }) {
  return <PixelArt rows={GH_ROWS} palette={GH_P} cellSize={size} />
}
export function AtCoderPixel({ size = 2 }: { size?: number }) {
  return <PixelArt rows={AC_ROWS} palette={AC_P} cellSize={size} />
}

export function PlatformIcon({
  platform,
  size = 2,
}: {
  platform: string
  size?: number
}) {
  switch (platform) {
    case 'codeforces': return <CodeforcesPixel size={size} />
    case 'leetcode':   return <LeetCodePixel   size={size} />
    case 'github':     return <GitHubPixel     size={size} />
    case 'atcoder':    return <AtCoderPixel    size={size} />
    default:           return null
  }
}
