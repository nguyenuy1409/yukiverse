import { useSearchParams } from 'react-router-dom'
import { useTheme } from '../contexts/ThemeContext'

// ── Mock Data ─────────────────────────────────────────────────────────────────

const ARTICLES = [
  {
    id: 1,
    title: 'Building a Matching Engine for Limit Order Books',
    excerpt:
      'A deep dive into the core data structures and algorithms that power modern exchange matching engines. We explore price-time priority queues, order lifecycle management, and the critical path optimisations that shave microseconds off fill latency.',
    category: 'HFT & Quant',
    tags: ['C++', 'Order Book', 'HFT'],
    date: '2026-07-20',
    author: 'Uy',
    gradient: 'from-sky-900/60 to-indigo-900/60',
    sakuraGradient: 'from-rose-200/40 to-pink-300/40',
    accentColor: '#7dd3fc',
    sakuraAccent: '#fda4af',
  },
  {
    id: 2,
    title: 'Low-Latency C++ Memory Allocators for HFT Systems',
    excerpt:
      'Why malloc() is the enemy of deterministic performance. This post walks through custom slab allocators, arena allocators, and lock-free free-lists — and benchmarks each against glibc in a simulated order-processing workload.',
    category: 'Core Systems & C++',
    tags: ['C++', 'Memory', 'Performance'],
    date: '2026-07-12',
    author: 'Uy',
    gradient: 'from-violet-900/60 to-purple-900/60',
    sakuraGradient: 'from-purple-200/40 to-violet-300/40',
    accentColor: '#c084fc',
    sakuraAccent: '#d8b4fe',
  },
  {
    id: 3,
    title: 'Understanding Options: Delta, Gamma, and the Greeks',
    excerpt:
      'A friend walked me through options pricing last week and I went down a rabbit hole. Here is what I learned about the Greeks, how market makers hedge their books delta-neutrally, and why Gamma risk spikes near expiry.',
    category: 'Finance',
    tags: ['Options', 'Derivatives', 'Finance'],
    date: '2026-07-05',
    author: 'Uy',
    gradient: 'from-emerald-900/60 to-teal-900/60',
    sakuraGradient: 'from-emerald-200/40 to-teal-300/40',
    accentColor: '#6ee7b7',
    sakuraAccent: '#6ee7b7',
  },
  {
    id: 4,
    title: 'High-Frequency Trading Architecture: Co-location to FPGA',
    excerpt:
      'From renting rack space next to an exchange\'s matching engine to hard-coding order logic into silicon — an overview of how latency arbitrage firms have evolved their infrastructure over two decades of the arms race.',
    category: 'HFT & Quant',
    tags: ['HFT', 'FPGA', 'Architecture'],
    date: '2026-06-28',
    author: 'Uy',
    gradient: 'from-amber-900/60 to-orange-900/60',
    sakuraGradient: 'from-yellow-200/40 to-amber-300/40',
    accentColor: '#fcd34d',
    sakuraAccent: '#fef08a',
  },
  {
    id: 5,
    title: 'Cache-Oblivious Algorithms and B-trees in Practice',
    excerpt:
      'Modern CPUs are memory-bound far more often than compute-bound. This post covers the mathematical intuition behind cache-oblivious data structures and shows how a well-tuned B-tree can outperform a naive red-black tree by 4× in a tick-data workload.',
    category: 'Mathematics',
    tags: ['Algorithms', 'Data Structures', 'Math'],
    date: '2026-06-15',
    author: 'Uy',
    gradient: 'from-rose-900/60 to-pink-900/60',
    sakuraGradient: 'from-pink-200/40 to-rose-300/40',
    accentColor: '#fb7185',
    sakuraAccent: '#fda4af',
  },
]

const CATEGORIES = ['All', 'Core Systems & C++', 'HFT & Quant', 'Finance', 'Mathematics', 'Curations']

// ── Helpers ───────────────────────────────────────────────────────────────────

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })
}

// ── Article Card ──────────────────────────────────────────────────────────────

function ArticleCard({ article }: { article: typeof ARTICLES[0] }) {
  const { theme } = useTheme()
  const isSakura = theme === 'sakura'

  const cardStyle: React.CSSProperties = isSakura
    ? {
        background: 'rgba(255,255,255,0.08)',
        backdropFilter: 'blur(12px)',
        WebkitBackdropFilter: 'blur(12px)',
        border: '1px solid rgba(255,182,193,0.25)',
        borderRadius: '16px',
        boxShadow: '0 4px 24px rgba(0,0,0,0.12)',
      }
    : {
        background: 'rgba(13,13,28,0.85)',
        border: '2px solid #1e2040',
        boxShadow: '4px 4px 0 0 rgba(0,0,0,0.9)',
      }

  const accent = isSakura ? article.sakuraAccent : article.accentColor

  return (
    <article
      className="group flex cursor-pointer overflow-hidden transition-all duration-300 hover:-translate-y-0.5"
      style={{
        ...cardStyle,
        ...(isSakura ? {} : { outline: 'none' }),
      }}
    >
      {/* Thumbnail — left 1/3 */}
      <div
        className={`relative flex w-1/3 flex-shrink-0 items-center justify-center bg-gradient-to-br ${
          isSakura ? article.sakuraGradient : article.gradient
        }`}
        style={{ minHeight: '180px' }}
      >
        {/* Pixel grid overlay — cyber only */}
        {!isSakura && (
          <div
            className="absolute inset-0 opacity-10"
            style={{
              backgroundImage: 'linear-gradient(rgba(255,255,255,.05) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.05) 1px, transparent 1px)',
              backgroundSize: '20px 20px',
            }}
          />
        )}
        {/* Category icon placeholder */}
        <div
          className="relative font-pixel text-[9px] tracking-widest opacity-70"
          style={{ color: accent }}
        >
          {article.category.toUpperCase().slice(0, 3)}
        </div>
        {/* Accent bar on right edge */}
        <div
          className="absolute right-0 top-0 h-full w-[3px] opacity-60"
          style={{ backgroundColor: accent }}
        />
      </div>

      {/* Text — right 2/3 */}
      <div className="flex flex-1 flex-col justify-between p-5">
        {/* Tags */}
        <div className="mb-2 flex flex-wrap gap-1.5">
          {article.tags.map(tag => (
            <span
              key={tag}
              className={`${isSakura ? 'font-mono text-[9px] tracking-wide' : 'font-pixel text-[6px] tracking-widest'} px-2 py-0.5`}
              style={{
                color: accent,
                border: `1px solid ${accent}40`,
                borderRadius: isSakura ? '6px' : '0',
                background: `${accent}12`,
              }}
            >
              {tag}
            </span>
          ))}
        </div>

        {/* Title */}
        <h2
          className={`mb-2 ${isSakura ? 'font-sans text-[15px] font-bold leading-snug' : 'font-pixel text-[11px] leading-relaxed tracking-wide'} transition-colors group-hover:opacity-80`}
          style={{
            color: isSakura ? '#f5e6e8' : '#e8eaf8',
            ...(isSakura ? { textShadow: '0 1px 3px rgba(0,0,0,0.3)' } : {}),
          }}
        >
          {article.title}
        </h2>

        {/* Excerpt */}
        <p
          className={`mb-4 ${isSakura ? 'font-sans text-[13px]' : 'font-mono text-[10px]'} leading-relaxed`}
          style={{ color: isSakura ? '#c8a8a8' : '#6a6d90' }}
        >
          {article.excerpt}
        </p>

        {/* Meta — date & author */}
        <div className="flex items-center justify-between border-t pt-3"
          style={{ borderColor: isSakura ? 'rgba(255,182,193,0.2)' : '#1e2040' }}
        >
          <span className="font-mono text-[9px]" style={{ color: isSakura ? '#b09090' : '#4a4d70' }}>
            {formatDate(article.date)}
          </span>
          <span className="font-mono text-[9px]" style={{ color: accent }}>
            {article.author}
          </span>
        </div>
      </div>
    </article>
  )
}

// ── Blog Page ─────────────────────────────────────────────────────────────────

export function BlogPage() {
  const { theme } = useTheme()
  const isSakura = theme === 'sakura'
  const [searchParams, setSearchParams] = useSearchParams()
  const activeCategory = searchParams.get('category') ?? 'All'

  const filtered = activeCategory === 'All'
    ? ARTICLES
    : ARTICLES.filter(a => a.category === activeCategory)

  const setCategory = (cat: string) => {
    if (cat === 'All') setSearchParams({})
    else setSearchParams({ category: cat })
  }

  return (
    <main className="mx-auto max-w-4xl px-4 py-8">

      {/* Page heading */}
      <div className="relative mb-8 w-fit">
        {/* Blur halo behind text for guaranteed contrast */}
        <div
          className="pointer-events-none absolute -inset-3 rounded-2xl"
          style={{
            background: isSakura ? 'rgba(0,0,0,0.22)' : 'rgba(0,0,0,0.35)',
            filter: 'blur(14px)',
          }}
        />
        <div className="relative">
          <h1
            className={`${isSakura ? 'font-sans text-[32px] font-black tracking-tight leading-none' : 'font-pixel text-[13px] tracking-widest'}`}
            style={{
              color: '#ffffff',
              textShadow: '0 2px 5px rgba(0,0,0,1), 0 0 20px rgba(0,0,0,0.9)',
            }}
          >
            {isSakura ? 'BLOG' : '> BLOG'}
          </h1>
          <p
            className={`mt-1 ${isSakura ? 'font-sans text-[13px] font-medium' : 'font-mono text-[10px] font-semibold'}`}
            style={{
              color: '#ffffff',
              textShadow: '0 1px 4px rgba(0,0,0,1)',
            }}
          >
            {ARTICLES.length} posts · systems, quant & more
          </p>
        </div>
      </div>

      {/* Category filter pills */}
      <div className="mb-8 flex flex-wrap gap-2">
        {CATEGORIES.map(cat => {
          const isActive = cat === activeCategory
          return (
            <button
              key={cat}
              onClick={() => setCategory(cat)}
              className={`${isSakura ? 'font-sans text-[13px] font-medium' : 'font-pixel text-[7px] tracking-widest'} px-3 py-1.5 transition-all duration-200 backdrop-blur-md`}
              style={isActive ? (isSakura ? {
                background: '#3a2622',
                color: '#ffffff',
                border: '2px solid #5c3c34',
                borderRadius: '999px',
                boxShadow: '0 2px 8px rgba(0,0,0,0.35)',
              } : {
                background: '#06b6d4',
                color: '#000000',
                border: '2px solid #06b6d4',
                borderRadius: '0',
                boxShadow: '2px 2px 0 0 rgba(0,0,0,0.9)',
              }) : (isSakura ? {
                background: 'rgba(255,255,255,0.30)',
                color: '#1c0a08',
                border: '1px solid rgba(255,255,255,0.45)',
                borderRadius: '999px',
              } : {
                background: 'rgba(255,255,255,0.06)',
                color: '#ffffff',
                border: '1px solid rgba(255,255,255,0.15)',
                borderRadius: '0',
              })}
            >
              {cat}
            </button>
          )
        })}
      </div>

      {/* Article feed — giant trunk container */}
      <div
        className="relative overflow-hidden rounded-3xl p-8"
        style={isSakura ? {
          background: '#3a2622',
          border: '2px solid rgba(92, 60, 52, 0.50)',
          boxShadow: [
            '0 24px 64px rgba(0,0,0,0.50)',           // outer depth
            'inset 0 0 40px rgba(0,0,0,0.55)',         // carved inner edge
            'inset 0 2px 0 rgba(255,210,180,0.06)',    // subtle top highlight
          ].join(', '),
        } : {
          background: 'rgba(5, 5, 18, 0.92)',
          border: '1px solid #1e2040',
          boxShadow: '0 20px 60px rgba(0,0,0,0.60), inset 0 1px 0 rgba(100,120,255,0.06)',
        }}
      >
        {/* Bark texture overlay — sakura only */}
        {isSakura && (
          <>
            {/* SVG fractal noise — rough bark grain */}
            <div
              aria-hidden="true"
              className="pointer-events-none absolute inset-0 rounded-3xl"
              style={{
                backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.68' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`,
                backgroundSize: '180px 180px',
                opacity: 0.13,
                mixBlendMode: 'overlay',
              }}
            />
            {/* Vertical grain streaks — wood rings */}
            <div
              aria-hidden="true"
              className="pointer-events-none absolute inset-0 rounded-3xl"
              style={{
                backgroundImage: `repeating-linear-gradient(
                  92deg,
                  transparent 0px,
                  transparent 18px,
                  rgba(0,0,0,0.06) 19px,
                  transparent 20px,
                  transparent 38px,
                  rgba(255,180,140,0.04) 39px,
                  transparent 40px
                )`,
                opacity: 0.9,
              }}
            />
          </>
        )}

        {/* Content — sits above texture overlays */}
        <div className="relative z-10">
          {filtered.length === 0 ? (
            <div
              className="flex flex-col items-center justify-center py-20 text-center"
              style={{ color: isSakura ? '#b09090' : '#4a4d70' }}
            >
              <p className="font-pixel text-[9px]">// NO POSTS YET</p>
              <p className="mt-2 font-mono text-[10px] opacity-60">check back soon</p>
            </div>
          ) : (
            <div className="flex flex-col gap-4">
              {filtered.map(article => (
                <ArticleCard key={article.id} article={article} />
              ))}
            </div>
          )}
        </div>
      </div>

    </main>
  )
}
