/**
 * Animated sakura petals overlay — rendered above the cherry blossom
 * background but below all UI panels (z-0 vs panels z-10).
 * On a light background, petals are near-white with a soft pink tint
 * to mimic real cherry blossom petals caught in the breeze.
 */

interface PetalDef {
  id:      number
  left:    number   // % from left
  delay:   number   // s
  dur:     number   // s
  w:       number   // px
  h:       number   // px
  opacity: number
  sway:    number   // px (+ = right, - = left)
  hue:     number   // hsl offset for subtle variety
  blur:    number   // px depth-of-field blur
}

const PETALS: PetalDef[] = [
  // ── original 20 ─────────────────────────────────────────────────────────────
  { id:  0, left:  2,  delay:  0.0, dur: 11, w:  9, h: 13, opacity: 0.70, sway:  32, hue:   0, blur: 0   },
  { id:  1, left:  8,  delay:  3.2, dur: 14, w:  7, h: 10, opacity: 0.55, sway: -22, hue:  10, blur: 0.8 },
  { id:  2, left: 14,  delay:  1.5, dur: 10, w: 10, h: 14, opacity: 0.75, sway:  46, hue:  -5, blur: 0   },
  { id:  3, left: 20,  delay:  6.0, dur: 13, w:  8, h: 11, opacity: 0.60, sway: -38, hue:   5, blur: 1.2 },
  { id:  4, left: 27,  delay:  4.0, dur:  9, w: 11, h: 15, opacity: 0.65, sway:  28, hue:   0, blur: 0   },
  { id:  5, left: 33,  delay:  0.8, dur: 12, w:  7, h: 10, opacity: 0.55, sway: -44, hue:  12, blur: 0.6 },
  { id:  6, left: 39,  delay:  7.0, dur: 11, w:  9, h: 13, opacity: 0.50, sway:  56, hue:  -8, blur: 1.5 },
  { id:  7, left: 46,  delay:  2.0, dur: 15, w:  8, h: 11, opacity: 0.75, sway: -30, hue:   3, blur: 0   },
  { id:  8, left: 52,  delay:  5.5, dur: 10, w: 10, h: 14, opacity: 0.60, sway:  40, hue:   8, blur: 0   },
  { id:  9, left: 58,  delay:  1.0, dur: 13, w:  7, h: 10, opacity: 0.65, sway: -26, hue:  -3, blur: 0.8 },
  { id: 10, left: 64,  delay:  8.0, dur: 11, w:  9, h: 12, opacity: 0.70, sway:  36, hue:   6, blur: 0   },
  { id: 11, left: 71,  delay:  3.0, dur:  9, w: 11, h: 15, opacity: 0.45, sway: -46, hue:  -6, blur: 1.2 },
  { id: 12, left: 77,  delay:  6.5, dur: 14, w:  8, h: 11, opacity: 0.72, sway:  22, hue:   4, blur: 0   },
  { id: 13, left: 83,  delay:  0.5, dur: 12, w:  7, h: 10, opacity: 0.55, sway: -52, hue:  10, blur: 1.8 },
  { id: 14, left: 89,  delay:  4.5, dur: 10, w:  9, h: 13, opacity: 0.50, sway:  30, hue:  -4, blur: 0   },
  { id: 15, left: 95,  delay:  2.5, dur: 13, w: 10, h: 14, opacity: 0.68, sway: -20, hue:   8, blur: 0.6 },
  { id: 16, left: 11,  delay:  9.0, dur: 11, w:  8, h: 11, opacity: 0.55, sway:  48, hue:   2, blur: 0   },
  { id: 17, left: 44,  delay:  7.5, dur:  9, w:  9, h: 13, opacity: 0.68, sway: -36, hue:  -2, blur: 1.0 },
  { id: 18, left: 68,  delay:  1.8, dur: 14, w:  7, h: 10, opacity: 0.60, sway:  26, hue:   7, blur: 0   },
  { id: 19, left: 87,  delay:  5.0, dur: 12, w: 10, h: 14, opacity: 0.45, sway: -42, hue: -10, blur: 1.5 },
  // ── extra 6 ─────────────────────────────────────────────────────────────────
  { id: 20, left:  5,  delay: 10.5, dur: 13, w:  8, h: 11, opacity: 0.58, sway:  38, hue:   3, blur: 0   },
  { id: 21, left: 23,  delay:  8.5, dur: 10, w:  7, h: 10, opacity: 0.62, sway: -28, hue:  -4, blur: 0.5 },
  { id: 22, left: 50,  delay: 11.0, dur: 12, w: 10, h: 13, opacity: 0.50, sway:  44, hue:   9, blur: 1.0 },
  { id: 23, left: 74,  delay:  9.5, dur:  9, w:  8, h: 12, opacity: 0.65, sway: -32, hue:  -7, blur: 0   },
  { id: 24, left: 36,  delay: 12.0, dur: 11, w:  9, h: 13, opacity: 0.55, sway:  52, hue:   5, blur: 1.2 },
  { id: 25, left: 91,  delay:  6.8, dur: 14, w:  7, h: 10, opacity: 0.70, sway: -18, hue:  -2, blur: 0.3 },
]

export function SakuraPetals() {
  return (
    <div
      aria-hidden="true"
      style={{
        position: 'fixed',
        inset: 0,
        pointerEvents: 'none',
        overflow: 'hidden',
        zIndex: 1, // above bg, below all panels (panels are z-10)
      }}
    >
      {PETALS.map(p => (
        <div
          key={p.id}
          style={{
            position: 'absolute',
            top: '-20px',
            left: `${p.left}%`,
            width:  `${p.w}px`,
            height: `${p.h}px`,
            // Petal shape — teardrop silhouette
            borderRadius: '50% 0 50% 0',
            // Near-white with very soft pink tint (real sakura petals)
            background: `linear-gradient(135deg,
              hsl(${345 + p.hue}, 75%, 93%) 0%,
              hsl(${338 + p.hue}, 68%, 86%) 100%)`,
            opacity: p.opacity,
            filter: p.blur > 0 ? `blur(${p.blur}px)` : undefined,
            ['--sway' as string]: `${p.sway}px`,
            animation: `petal-fall ${p.dur}s ${p.delay}s infinite ease-in-out`,
            transform: `rotate(${p.id * 18}deg)`,
          }}
        />
      ))}
    </div>
  )
}
