import {
  Camera,
  Wand2,
  Smile,
  Package,
  Clapperboard,
  Palette,
  Sparkles,
} from 'lucide-react'

const ITEMS = [
  { icon: Camera, label: 'Photorealism' },
  { icon: Wand2, label: 'Fantasy' },
  { icon: Smile, label: 'Anime' },
  { icon: Package, label: 'Product Shots' },
  { icon: Clapperboard, label: 'Cinematic' },
  { icon: Palette, label: 'Digital Art' },
  { icon: Sparkles, label: 'Text to Image' },
]

export default function Marquee() {
  // Duplicate the list so the -50% translate loops seamlessly.
  const loop = [...ITEMS, ...ITEMS]

  return (
    <div className="relative border-y border-border/60 bg-gradient-to-b from-surface/80 via-surface/40 to-surface/80 py-6 overflow-hidden">
      {/* edge fades */}
      <div className="pointer-events-none absolute inset-y-0 left-0 z-10 w-32 bg-gradient-to-r from-ink via-ink/80 to-transparent" />
      <div className="pointer-events-none absolute inset-y-0 right-0 z-10 w-32 bg-gradient-to-l from-ink via-ink/80 to-transparent" />

      <div className="flex w-max animate-[marquee_32s_linear_infinite] items-center gap-3 hover:[animation-play-state:paused]">
        {loop.map((item, i) => (
          <span
            key={`${item.label}-${i}`}
            className="inline-flex items-center gap-2 rounded-full border border-border bg-surface px-5 py-2.5 text-sm font-medium text-mute shadow-sm transition-colors duration-300 hover:border-primary/30 hover:text-mist"
          >
            <item.icon size={15} className="text-primary" />
            {item.label}
            <span className="ml-0.5 h-1 w-1 rounded-full bg-secondary/50" />
          </span>
        ))}
      </div>
    </div>
  )
}
