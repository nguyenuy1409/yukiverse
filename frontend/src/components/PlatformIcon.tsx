// Platform icons: PNG pixel art images for GH/LC/AC, SVG pixel grid for CF.

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
// PNG-based icons (pixel art images provided by user)
// ---------------------------------------------------------------------------
function PngIcon({ src, size }: { src: string; size: number }) {
  const px = size * 10
  return (
    <img
      src={src}
      width={px}
      height={px}
      style={{ imageRendering: 'pixelated', display: 'block', flexShrink: 0 }}
      alt=""
    />
  )
}

export function CodeforcesPixel({ size = 2 }: { size?: number }) {
  return <PixelArt rows={CF_ROWS} palette={CF_P} cellSize={size} />
}
export function LeetCodePixel({ size = 2 }: { size?: number }) {
  return <PngIcon src="/icons/leetcode.png" size={size} />
}
export function GitHubPixel({ size = 2 }: { size?: number }) {
  return <PngIcon src="/icons/github.png" size={size} />
}
export function AtCoderPixel({ size = 2 }: { size?: number }) {
  return <PngIcon src="/icons/atcoder.png" size={size} />
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
