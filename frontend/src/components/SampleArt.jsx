// Self-contained SVG "artwork" for the hero collage.
// These are locally-rendered gradient compositions (not remote images), so the
// hero never depends on broken external URLs. They are decorative samples and
// are not represented as AI output from the user's account.

function ArtA() {
  return (
    <svg viewBox="0 0 200 200" className="h-full w-full" preserveAspectRatio="xMidYMid slice">
      <defs>
        <radialGradient id="a1" cx="30%" cy="30%" r="80%">
          <stop offset="0" stopColor="#8B5CF6" />
          <stop offset="1" stopColor="#1B1B28" />
        </radialGradient>
        <linearGradient id="a2" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#EC4899" />
          <stop offset="1" stopColor="#8B5CF6" />
        </linearGradient>
      </defs>
      <rect width="200" height="200" fill="url(#a1)" />
      <circle cx="150" cy="60" r="46" fill="url(#a2)" opacity="0.85" />
      <path d="M0 150 Q60 110 110 150 T200 150 V200 H0 Z" fill="#0B0B10" opacity="0.55" />
      <path d="M0 170 Q70 130 130 170 T200 170 V200 H0 Z" fill="#0B0B10" opacity="0.7" />
    </svg>
  )
}

function ArtB() {
  return (
    <svg viewBox="0 0 200 200" className="h-full w-full" preserveAspectRatio="xMidYMid slice">
      <defs>
        <linearGradient id="b1" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#67E8F9" />
          <stop offset="1" stopColor="#0B0B10" />
        </linearGradient>
        <radialGradient id="b2" cx="70%" cy="20%" r="60%">
          <stop offset="0" stopColor="#EC4899" stopOpacity="0.9" />
          <stop offset="1" stopColor="#EC4899" stopOpacity="0" />
        </radialGradient>
      </defs>
      <rect width="200" height="200" fill="url(#b1)" />
      <rect width="200" height="200" fill="url(#b2)" />
      <g stroke="#F8FAFC" strokeOpacity="0.5" strokeWidth="1.5" fill="none">
        <path d="M20 160 L70 90 L110 130 L150 60 L185 120" />
        <circle cx="70" cy="90" r="4" fill="#F8FAFC" />
        <circle cx="150" cy="60" r="4" fill="#F8FAFC" />
      </g>
    </svg>
  )
}

function ArtC() {
  return (
    <svg viewBox="0 0 200 200" className="h-full w-full" preserveAspectRatio="xMidYMid slice">
      <defs>
        <linearGradient id="c1" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#EC4899" />
          <stop offset="1" stopColor="#8B5CF6" />
        </linearGradient>
      </defs>
      <rect width="200" height="200" fill="#13131C" />
      <g>
        {Array.from({ length: 6 }).map((_, i) => (
          <rect
            key={i}
            x={30 + i * 22}
            y={40 + (i % 3) * 12}
            width="12"
            height={120 - (i % 3) * 20}
            rx="6"
            fill="url(#c1)"
            opacity={0.35 + i * 0.11}
            transform={`rotate(${(i - 2.5) * 8} 100 100)`}
          />
        ))}
      </g>
      <circle cx="100" cy="100" r="26" fill="#F8FAFC" opacity="0.9" />
    </svg>
  )
}

function ArtD() {
  return (
    <svg viewBox="0 0 200 200" className="h-full w-full" preserveAspectRatio="xMidYMid slice">
      <defs>
        <radialGradient id="d1" cx="50%" cy="40%" r="70%">
          <stop offset="0" stopColor="#8B5CF6" />
          <stop offset="0.6" stopColor="#2a1a4a" />
          <stop offset="1" stopColor="#0B0B10" />
        </radialGradient>
      </defs>
      <rect width="200" height="200" fill="url(#d1)" />
      <g fill="none" stroke="#67E8F9" strokeOpacity="0.6" strokeWidth="1.5">
        <path d="M40 120 Q100 40 160 120" />
        <path d="M20 140 Q100 60 180 140" strokeOpacity="0.35" />
      </g>
      <circle cx="100" cy="70" r="20" fill="#EC4899" opacity="0.9" />
      <circle cx="100" cy="70" r="30" fill="#EC4899" opacity="0.25" />
    </svg>
  )
}

function ArtE() {
  return (
    <svg viewBox="0 0 200 200" className="h-full w-full" preserveAspectRatio="xMidYMid slice">
      <defs>
        <linearGradient id="e1" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="#67E8F9" />
          <stop offset="1" stopColor="#8B5CF6" />
        </linearGradient>
      </defs>
      <rect width="200" height="200" fill="#0B0B10" />
      <g>
        {Array.from({ length: 9 }).map((_, i) => (
          <line
            key={i}
            x1={20 + i * 20}
            y1="0"
            x2={20 + i * 20}
            y2="200"
            stroke="url(#e1)"
            strokeOpacity={0.15 + (i % 3) * 0.2}
            strokeWidth={i % 2 === 0 ? 2 : 1}
          />
        ))}
      </g>
      <circle cx="100" cy="100" r="42" fill="none" stroke="#EC4899" strokeWidth="2" opacity="0.8" />
      <circle cx="100" cy="100" r="30" fill="#EC4899" opacity="0.35" />
    </svg>
  )
}

function ArtF() {
  return (
    <svg viewBox="0 0 200 200" className="h-full w-full" preserveAspectRatio="xMidYMid slice">
      <defs>
        <radialGradient id="f1" cx="60%" cy="60%" r="70%">
          <stop offset="0" stopColor="#EC4899" />
          <stop offset="1" stopColor="#13131C" />
        </radialGradient>
      </defs>
      <rect width="200" height="200" fill="url(#f1)" />
      <g fill="#F8FAFC">
        {Array.from({ length: 24 }).map((_, i) => {
          const x = (i * 37) % 200
          const y = (i * 53) % 200
          const r = (i % 3) + 1
          return <circle key={i} cx={x} cy={y} r={r} opacity={0.25 + (i % 4) * 0.18} />
        })}
      </g>
    </svg>
  )
}

const PIECES = [ArtA, ArtB, ArtC, ArtD, ArtE, ArtF]

export default function SampleArt() {
  return (
    <div className="grid grid-cols-2 gap-3 sm:gap-4" aria-hidden="true">
      {PIECES.map((Piece, i) => (
        <div
          key={i}
          className="group relative aspect-square overflow-hidden rounded-2xl border border-border shadow-lg shadow-primary/10 transition-transform duration-500 hover:scale-[1.03]"
          style={{ animationDelay: `${i * 120}ms` }}
        >
          <Piece />
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-ink/20 via-transparent to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
        </div>
      ))}
    </div>
  )
}
