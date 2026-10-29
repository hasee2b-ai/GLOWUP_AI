import { useState } from 'react'
import { Download, RefreshCw, Copy, Check, AlertTriangle, Image as ImageIcon } from 'lucide-react'
import Skeleton from './Skeleton.jsx'
import { downloadImage, imageFilename } from '../utils/helpers.js'

/* ---------- Small building blocks ---------- */

function Meta({ icon: Icon, children }) {
  return (
    <span className="inline-flex items-center gap-1.5 text-xs text-mute">
      <Icon size={13} className="text-mute/60" />
      {children}
    </span>
  )
}

function ImageCard({ image, index, onCopyPrompt, copied }) {
  const [failed, setFailed] = useState(false)

  return (
    <div className="group relative overflow-hidden rounded-2xl border border-border bg-surface">
      {failed ? (
        <div className="flex h-64 flex-col items-center justify-center gap-2 p-6 text-center">
          <AlertTriangle size={26} className="text-secondary" />
          <p className="text-sm text-mute">This image could not be loaded.</p>
          <p className="text-xs text-mute/60">The source may have expired.</p>
        </div>
      ) : (
        <img
          src={image.url}
          alt={`Generated variation ${index + 1}`}
          className="block h-auto w-full max-h-[420px] object-contain"
          loading="lazy"
          onError={() => setFailed(true)}
        />
      )}

      {/* hover overlay with actions — always visible on mobile, hover-gated on desktop */}
      <div className="absolute inset-x-0 bottom-0 flex items-center justify-between gap-2 bg-gradient-to-t from-ink/95 via-ink/60 to-transparent p-3 transition-opacity duration-300 md:opacity-0 md:group-hover:opacity-100">
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => downloadImage(image.url, imageFilename(image.mime_type, index + 1))}
            className="inline-flex items-center gap-1.5 rounded-lg border border-white/10 bg-ink/60 px-3 py-2 text-xs font-medium text-mist backdrop-blur transition-colors hover:border-primary/50 hover:bg-ink"
          >
            <Download size={14} />
            Save
          </button>
          <button
            type="button"
            onClick={() => onCopyPrompt()}
            className="inline-flex items-center gap-1.5 rounded-lg border border-white/10 bg-ink/60 px-3 py-2 text-xs font-medium text-mist backdrop-blur transition-colors hover:border-primary/50 hover:bg-ink"
          >
            {copied ? <Check size={14} className="text-emerald-400" /> : <Copy size={14} />}
            {copied ? 'Copied' : 'Prompt'}
          </button>
        </div>
      </div>
    </div>
  )
}

// Skeleton boxes match the requested output ratio so the loading state
// promises the shape of what is coming.
const SKELETON_ASPECT = {
  '1024x1024': 'aspect-square',
  '1024x1536': 'aspect-[2/3]',
  '1536x1024': 'aspect-[3/2]',
}

/**
 * The results area of the workspace: empty, loading, error and success states
 * rendered straight on the canvas — no card around a card — so the generated
 * images stay the most prominent thing on the page.
 */
export default function ResultPreview({
  status,
  result,
  error,
  n,
  size,
  onRegenerate,
  onCopyPrompt,
  copied,
}) {
  /* Idle — the quiet empty state */
  if (status === 'idle') {
    return (
      <div className="flex flex-1 flex-col items-center justify-center px-6 py-14 text-center">
        <h2 className="font-display text-xl font-semibold tracking-tight text-mist sm:text-2xl">
          What will you create?
        </h2>
        <p className="mt-3 max-w-xs text-sm leading-relaxed text-mute">
          Describe an image below, then press Generate.
        </p>
      </div>
    )
  }

  /* Loading */
  if (status === 'loading') {
    // Placeholder count must reflect the count being requested now, not the
    // previous result — falling back to that result, then 1, when the prop is
    // missing or invalid.
    const count =
      Number.isInteger(n) && n > 0
        ? n
        : Array.isArray(result?.images) && result.images.length > 0
          ? result.images.length
          : 1
    const aspect = SKELETON_ASPECT[size] || SKELETON_ASPECT['1024x1024']

    return (
      <div className="flex flex-1 flex-col justify-center py-6">
        <div className="mb-4 flex items-center gap-2.5 text-sm text-mute">
          <RefreshCw size={15} className="animate-spin text-primary" />
          Creating your image...
        </div>
        <div className={`grid w-full max-w-[660px] mx-auto gap-4 ${count > 1 ? 'sm:grid-cols-2' : 'grid-cols-1'}`}>
          {Array.from({ length: count }).map((_, i) => (
            <Skeleton key={i} className={`w-full ${aspect}`} />
          ))}
        </div>
      </div>
    )
  }

  /* Error */
  if (status === 'error') {
    return (
      <div className="flex flex-1 flex-col items-center justify-center px-6 py-14 text-center">
        <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-secondary/10 text-secondary">
          <AlertTriangle size={20} />
        </span>
        <h2 className="mt-4 font-display text-lg font-semibold text-mist">Generation failed</h2>
        <p className="mt-2 max-w-md text-sm leading-relaxed text-mute">{error}</p>
        <button
          type="button"
          onClick={onRegenerate}
          className="mt-5 inline-flex items-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-white shadow-md shadow-primary/20 transition-all hover:bg-primary/90 active:scale-[0.98]"
        >
          <RefreshCw size={15} />
          Try again
        </button>
      </div>
    )
  }

  /* Success */
  const images = result?.images || []
  const multi = images.length > 1
  const first = images[0]

  return (
    <div className="animate-fade-in pt-1">
      {/* prompt + actions above the images — stacked on mobile so the prompt
          never gets squeezed into a narrow column by the actions */}
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between sm:gap-x-6">
        <p className="min-w-0 text-sm leading-relaxed text-mute sm:max-w-3xl sm:flex-1">
          <span className="font-semibold text-mist/80">Prompt: </span>
          {result.prompt}
        </p>
        <div className="flex shrink-0 flex-wrap items-center gap-x-4 gap-y-2">
          {first?.width && first?.height && <Meta icon={ImageIcon}>{first.width}×{first.height}</Meta>}
          {first?.mime_type && (
            <Meta icon={ImageIcon}>{first.mime_type.replace('image/', '').toUpperCase()}</Meta>
          )}
          <button
            type="button"
            onClick={onRegenerate}
            className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-surface px-3 py-1.5 text-xs font-semibold text-mist transition-colors hover:border-primary/45 hover:text-primary"
          >
            <RefreshCw size={13} />
            Regenerate
          </button>
        </div>
      </div>

      {/* images — compact, portrait-bounded previews so the whole workspace
          (image + history + composer) fits without page scrolling */}
      <div className={`grid w-full gap-4 ${multi ? 'sm:grid-cols-2' : 'grid-cols-1'} justify-items-center`}>
        {images.map((img, i) => (
          <div key={`${img.url.slice(0, 48)}-${i}`} className="w-full max-w-[320px]">
            <ImageCard
              image={img}
              index={i}
              copied={copied}
              onCopyPrompt={onCopyPrompt}
            />
          </div>
        ))}
      </div>
    </div>
  )
}
