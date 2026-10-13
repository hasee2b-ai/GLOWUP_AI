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
    <div className="relative border-y border-border/60 bg-surface/50 py-5 overflow-hidden">
      {/* edge fades */}
      <div className="pointer-events-none absolute inset-y-0 left-0 z-10 w-24 bg-gradient-to-r from-ink to-transparent" />
      <div className="pointer-events-none absolute inset-y-0 right-0 z-10 w-24 bg-gradient-to-l from-ink to-transparent" />

      <div className="flex w-max animate-marquee items-center gap-4 hover:[animation-play-state:paused]">
        {loop.map((item, i) => (
          <span
            key={`${item.label}-${i}`}
            className="inline-flex items-center gap-2.5 rounded-full border border-border bg-surface-2 px-5 py-2.5 text-sm font-medium text-mute"
          >
            <item.icon size={16} className="text-primary" />
            {item.label}
            <span className="ml-1 h-1 w-1 rounded-full bg-secondary/60" />
          </span>
        ))}
      </div>
    </div>
  )
}
