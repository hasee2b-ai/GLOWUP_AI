import { useState } from 'react'
import { X, ChevronLeft, ChevronRight, Expand } from 'lucide-react'

const IMAGES = [
  { src: '/gallery-1.webp', alt: 'Generated artwork 1' },
  { src: '/gallery-2.webp', alt: 'Generated artwork 2' },
  { src: '/gallery-3.webp', alt: 'Generated artwork 3' },
  { src: '/gallery-4.webp', alt: 'Generated artwork 4' },
  { src: '/gallery-5.webp', alt: 'Generated artwork 5' },
  { src: '/gallery-6.webp', alt: 'Generated artwork 6' },
]

/**
 * Large masonry gallery of real generated artwork with a lightbox.
 * Uses CSS columns so the varying portrait heights flow naturally.
 */
export default function Gallery() {
  const [lightbox, setLightbox] = useState(null)

  const open = (i) => setLightbox(i)
  const close = () => setLightbox(null)
  const prev = (e) => { e.stopPropagation(); setLightbox((i) => (i - 1 + IMAGES.length) % IMAGES.length) }
  const next = (e) => { e.stopPropagation(); setLightbox((i) => (i + 1) % IMAGES.length) }

  return (
    <>
      <div className="columns-2 gap-5 sm:columns-3 lg:columns-3">
        {IMAGES.map((img, i) => (
          <button
            key={img.src}
            type="button"
            onClick={() => open(i)}
            className="group relative mb-5 block w-full overflow-hidden rounded-2xl border border-border bg-surface shadow-md shadow-primary/5 transition-all duration-300 hover:border-primary/40 hover:shadow-xl hover:shadow-primary/10 focus:outline-none focus:ring-2 focus:ring-primary/50"
            aria-label={`View ${img.alt}`}
          >
            <img
              src={img.src}
              alt={img.alt}
              loading="lazy"
              className="w-full object-cover transition-transform duration-500 group-hover:scale-105"
            />
            <span className="absolute inset-0 flex items-center justify-center bg-mist/0 opacity-0 transition-all duration-300 group-hover:bg-mist/10 group-hover:opacity-100">
              <span className="flex h-12 w-12 items-center justify-center rounded-full bg-white/80 shadow-lg backdrop-blur-sm">
                <Expand size={20} className="text-mist" />
              </span>
            </span>
          </button>
        ))}
      </div>

      {/* Lightbox */}
      {lightbox !== null && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-ink/60 p-4 backdrop-blur-sm animate-fade-in"
          onClick={close}
          role="dialog"
          aria-modal="true"
          aria-label="Image viewer"
        >
          <button
            type="button"
            onClick={close}
            aria-label="Close viewer"
            className="absolute right-5 top-5 rounded-full border border-border bg-surface p-2.5 text-mist shadow-md transition-colors hover:border-primary/50 hover:text-mist"
          >
            <X size={20} />
          </button>
          <button
            type="button"
            onClick={prev}
            aria-label="Previous image"
            className="absolute left-4 top-1/2 -translate-y-1/2 rounded-full border border-border bg-surface p-3 text-mist shadow-md transition-colors hover:border-primary/50 hover:text-mist"
          >
            <ChevronLeft size={22} />
          </button>
          <figure className="max-h-[85vh] max-w-3xl" onClick={(e) => e.stopPropagation()}>
            <img
              src={IMAGES[lightbox].src}
              alt={IMAGES[lightbox].alt}
              className="max-h-[80vh] w-auto rounded-xl border border-border object-contain shadow-2xl shadow-primary/10"
            />
            <figcaption className="mt-3 text-center text-sm text-mute">
              {IMAGES[lightbox].alt} · {lightbox + 1} / {IMAGES.length}
            </figcaption>
          </figure>
          <button
            type="button"
            onClick={next}
            aria-label="Next image"
            className="absolute right-4 top-1/2 -translate-y-1/2 rounded-full border border-border bg-surface p-3 text-mist shadow-md transition-colors hover:border-primary/50 hover:text-mist"
          >
            <ChevronRight size={22} />
          </button>
        </div>
      )}
    </>
  )
}
