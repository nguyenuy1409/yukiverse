import { useTheme } from '../contexts/ThemeContext'

// ── Data ─────────────────────────────────────────────────────────────────────

interface ResourceItem {
  title: string
  subtitle?: string   // author / description
  url?: string
}

interface ResourceSection {
  index: string       // '01', '02', …
  heading: string
  items: ResourceItem[]
}

const RESOURCES: ResourceSection[] = [
  {
    index: '01',
    heading: 'C++',
    items: [
      { title: 'A Tour of C++', subtitle: 'Bjarne Stroustrup' },
      { title: 'Beautiful C++: 30 Core Guidelines for Writing Clean, Safe, and Fast Code', subtitle: 'Kate Gregory & Guy Davidson' },
      { title: 'Effective Modern C++', subtitle: 'Scott Meyers' },
      { title: 'C++ Software Design', subtitle: 'Klaus Iglberger' },
      { title: 'C++ Concurrency in Action', subtitle: 'Anthony Williams' },
      { title: 'learncpp.com', url: 'https://www.learncpp.com/' },
      { title: 'cppreference.com', url: 'https://en.cppreference.com/' },
      { title: 'quiz.cpp-perf.com', url: 'https://quiz.cpp-perf.com/' },
    ],
  },
  {
    index: '02',
    heading: 'Data Structures & Algorithms / Competitive Programming',
    items: [
      { title: 'The Algorithm Design Manual', subtitle: 'Steven Skiena' },
      { title: 'usaco.guide', url: 'https://usaco.guide/' },
      { title: 'leetcode.com', url: 'https://leetcode.com/' },
      { title: 'codeforces.com', url: 'https://codeforces.com/' },
      { title: 'cses.fi', url: 'https://cses.fi/' },
      { title: 'atcoder.jp', url: 'https://atcoder.jp/' },
    ],
  },
  {
    index: '03',
    heading: 'Computer Science Fundamentals',
    items: [
      { title: 'Inside the Machine: An Introduction to Microprocessors and Computer Architecture', subtitle: 'Jon Stokes' },
      { title: 'Operating Systems: Three Easy Pieces (OSTEP)', subtitle: 'Andrea Arpaci-Dusseau & Remzi Arpaci-Dusseau' },
      { title: 'TCP/IP Illustrated, Volume 1: The Protocols', subtitle: 'Kevin R. Fall & W. Richard Stevens' },
    ],
  },
  {
    index: '04',
    heading: 'System Design',
    items: [
      { title: 'Designing Data-Intensive Applications (DDIA)', subtitle: 'Martin Kleppmann' },
    ],
  },
  {
    index: '05',
    heading: 'Mathematics',
    items: [
      { title: 'Introduction to Probability', subtitle: 'Joseph K. Blitzstein' },
      { title: 'First Course in Probability', subtitle: 'Sheldon M. Ross' },
      { title: 'An Introduction to Statistical Learning (ISLP)', subtitle: 'Gareth James et al.' },
    ],
  },
  {
    index: '06',
    heading: 'Quant',
    items: [
      { title: 'A Practical Guide to Quantitative Finance Interviews', subtitle: 'Green Book' },
      { title: 'Yale — Game Theory with Ben Polak', subtitle: 'YouTube' },
      { title: 'quantquestions.io', url: 'https://quantquestions.io/' },
      { title: 'arithmetic.zetamac.com', subtitle: 'Mental Math', url: 'https://arithmetic.zetamac.com/' },
      { title: 'tradermath.org', subtitle: 'Market Making Game', url: 'https://tradermath.org/' },
      { title: 'quantguide.io', url: 'https://www.quantguide.io/' },
      { title: 'tradinginterview.com', url: 'https://tradinginterview.com/' },
    ],
  },
  {
    index: '07',
    heading: 'Others',
    items: [
      { title: 'Tech Interview Handbook', url: 'https://www.techinterviewhandbook.org/' },
      { title: 'Resources for Computer Science Mastery', url: 'https://rare-palm-3fb.notion.site/Resources-for-Computer-Science-Mastery-2ad808b6ac6480b4a57ed7bd5923e795' },
      { title: 'whitebox.ac', url: 'https://whitebox.ac/' },
      { title: 'quantdev.blog', url: 'https://quantdev.blog/' },
    ],
  },
]

// ── Resource item ─────────────────────────────────────────────────────────────

function Item({ item, isSakura }: { item: ResourceItem; isSakura: boolean }) {
  const textColor  = isSakura ? '#1a0a08'  : '#d8daf0'
  const metaColor  = isSakura ? '#6b4040'  : '#5a5d80'
  const linkColor  = isSakura ? '#9b2828'  : '#818cf8'
  const linkHover  = isSakura ? '#c0392b'  : '#a5b4fc'
  const dotColor   = isSakura ? '#c0706060' : '#30304860'

  const inner = (
    <>
      <span style={{ color: item.url ? linkColor : textColor, fontWeight: 600 }}>
        {item.title}
      </span>
      {item.url && (
        <span style={{ fontSize: '10px', marginLeft: '4px', opacity: 0.7 }}>↗</span>
      )}
      {item.subtitle && (
        <span
          className="ml-2 font-mono text-[10px]"
          style={{ color: metaColor }}
        >
          — {item.subtitle}
        </span>
      )}
    </>
  )

  return (
    <li className="flex items-baseline gap-3 py-[5px]">
      {/* bullet */}
      <span
        className="mt-[3px] h-[5px] w-[5px] flex-shrink-0 rounded-full"
        style={{ background: dotColor, marginTop: '6px' }}
      />
      <span className="font-sans text-[13px] leading-snug">
        {item.url ? (
          <a
            href={item.url}
            target="_blank"
            rel="noopener noreferrer"
            className="transition-colors duration-150"
            style={{ color: linkColor }}
            onMouseEnter={e => (e.currentTarget.style.color = linkHover)}
            onMouseLeave={e => (e.currentTarget.style.color = linkColor)}
          >
            {inner}
          </a>
        ) : (
          inner
        )}
      </span>
    </li>
  )
}

// ── Section ───────────────────────────────────────────────────────────────────

function Section({ section, isSakura }: { section: ResourceSection; isSakura: boolean }) {
  const indexColor   = isSakura ? '#9b2828'  : '#6366f1'
  const headingColor = isSakura ? '#1a0a08'  : '#e8eaf8'
  const dividerColor = isSakura ? 'rgba(155,40,40,0.20)' : 'rgba(99,102,241,0.20)'

  return (
    <section className="mb-10">
      {/* Section header */}
      <div className="mb-4 flex items-baseline gap-3">
        <span
          className="font-mono text-[11px] font-bold tracking-widest"
          style={{ color: indexColor }}
        >
          {section.index}.
        </span>
        <h2
          className="text-[15px] font-bold tracking-wide"
          style={{ color: headingColor }}
        >
          {section.heading}
        </h2>
      </div>
      {/* Divider */}
      <div className="mb-4 h-px" style={{ background: dividerColor }} />
      {/* Items */}
      <ul className="space-y-0.5 pl-1">
        {section.items.map((item, i) => (
          <Item key={i} item={item} isSakura={isSakura} />
        ))}
      </ul>
    </section>
  )
}

// ── Page ──────────────────────────────────────────────────────────────────────

export function ResourcesPage() {
  const { theme } = useTheme()
  const isSakura = theme === 'sakura'

  const pageBg: React.CSSProperties = isSakura ? {
    background: 'rgba(255,245,242,0.72)',
    backdropFilter: 'blur(16px)',
    WebkitBackdropFilter: 'blur(16px)',
    border: '1px solid rgba(200,140,130,0.25)',
    borderRadius: '20px',
    boxShadow: '0 8px 40px rgba(0,0,0,0.12)',
  } : {
    background: 'rgba(8,8,20,0.88)',
    backdropFilter: 'blur(16px)',
    WebkitBackdropFilter: 'blur(16px)',
    border: '1px solid #1e2040',
    borderRadius: '4px',
    boxShadow: '4px 4px 0 0 rgba(0,0,0,0.9)',
  }

  const titleColor  = isSakura ? '#1a0a08'  : '#e8eaf8'
  const subtitleColor = isSakura ? '#6b4040' : '#5a5d80'
  const countBg = isSakura
    ? 'rgba(155,40,40,0.12)'
    : 'rgba(99,102,241,0.12)'
  const countColor = isSakura ? '#9b2828' : '#818cf8'
  const countBorder = isSakura ? 'rgba(155,40,40,0.25)' : 'rgba(99,102,241,0.25)'

  const totalItems = RESOURCES.reduce((s, sec) => s + sec.items.length, 0)

  return (
    <main className="mx-auto max-w-3xl px-4 py-10">
      <div style={pageBg} className="px-10 py-10">

        {/* Page title */}
        <div className="mb-10 border-b pb-8" style={{
          borderColor: isSakura ? 'rgba(155,40,40,0.15)' : '#1e2040'
        }}>
          <div className="flex items-end justify-between">
            <div>
              <p
                className="mb-2 font-mono text-[10px] tracking-[0.3em] uppercase"
                style={{ color: subtitleColor }}
              >
                yukiverse / resources
              </p>
              <h1
                className="font-sans text-[32px] font-black tracking-tight leading-none"
                style={{ color: titleColor }}
              >
                RESOURCES
              </h1>
              <p
                className="mt-2 font-mono text-[11px]"
                style={{ color: subtitleColor }}
              >
                A curated list of books, tools, and references I find valuable.
              </p>
            </div>
            {/* Item count badge */}
            <span
              className="font-mono text-[10px] px-3 py-1 rounded-full"
              style={{
                background: countBg,
                color: countColor,
                border: `1px solid ${countBorder}`,
              }}
            >
              {totalItems} items
            </span>
          </div>
        </div>

        {/* Sections */}
        {RESOURCES.map(section => (
          <Section key={section.index} section={section} isSakura={isSakura} />
        ))}

      </div>
    </main>
  )
}
