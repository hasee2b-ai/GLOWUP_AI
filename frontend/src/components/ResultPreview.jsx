import { useState } from 'react'
import { Download, RefreshCw, Copy, Check, AlertTriangle, Image as ImageIcon } from 'lucide-react'
import Skeleton from './Skeleton.jsx'
import { downloadImage, imageFilename, copyText } from '../utils/helpers.js'
import { useToast } from './Toast.jsx'

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
    <div className="group relative">
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
          className="block h-auto w-full"
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

/* ---------- Main preview panel ---------- */

export default function ResultPreview({ status, result, error, n, onRegenerate, copied }) {
  const toast = useToast()

  const panel =
    'overflow-hidden rounded-2xl border border-border bg-surface'

  const header = (title, sub) => (
    <div className="flex items-center justify-between gap-3 border-b border-border/60 px-5 py-3.5">
      <div className="flex items-center gap-2.5">
        <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary/10">
          <ImageIcon size={14} className="text-primary" />
        </span>
        <div>
          <h3 className="font-display text-sm font-semibold text-mist">{title}</h3>
          {sub && <p className="text-[11px] text-mute">{sub}</p>}
        </div>
      </div>
    </div>
  )

  /* Idle */
  if (status === 'idle') {
    return (
      <div className={panel}>
        {header('Result preview', 'Your generated image will appear here')}
        <div className="flex flex-col items-center justify-center gap-3 px-6 py-16 text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-primary/15 to-secondary/15 ring-1 ring-border">
            <ImageIcon size={28} className="text-primary" />
          </div>
          <h3 className="font-display text-lg font-semibold text-mist">Your canvas is ready</h3>
          <p className="max-w-xs text-sm leading-relaxed text-mute">
            Describe your idea on the left and hit Generate to create your first visual.
          </p>
        </div>
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
    return (
      <div className={panel}>
        {header('Generating', 'Bringing your idea to life...')}
        <div className="p-5">
          <div className="mb-4 flex items-center gap-3 rounded-xl border border-primary/20 bg-primary/5 px-4 py-3">
            <RefreshCw size={16} className="animate-spin text-primary" />
            <p className="text-sm text-mist">Creating your image...</p>
          </div>
          <div className={`grid gap-4 ${count > 1 ? 'grid-cols-2' : 'grid-cols-1'}`}>
            {Array.from({ length: count }).map((_, i) => (
              <Skeleton key={i} className="h-64 w-full" />
            ))}
          </div>
        </div>
      </div>
    )
  }

  /* Error */
  if (status === 'error') {
    return (
      <div className={panel}>
        {header('Generation failed', 'Something went wrong')}
        <div className="flex flex-col items-center justify-center gap-3 px-6 py-16 text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-secondary/10 ring-1 ring-secondary/15">
            <AlertTriangle size={28} className="text-secondary" />
          </div>
          <h3 className="font-display text-lg font-semibold text-mist">Generation failed</h3>
          <p className="max-w-sm text-sm leading-relaxed text-mute">{error}</p>
          <button
            type="button"
            onClick={onRegenerate}
            className="mt-2 inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-primary to-secondary px-5 py-2.5 text-sm font-semibold text-white transition-all hover:brightness-110"
          >
            <RefreshCw size={15} />
            Try again
          </button>
        </div>
      </div>
    )
  }

  /* Success */
  const images = result?.images || []
  const multi = images.length > 1
  const first = images[0]

  return (
    <div className={`${panel} animate-fade-in`}>
      {header(
        'Result',
        `${images.length} ${images.length === 1 ? 'image' : 'images'} generated`
      )}

      {/* metadata bar */}
      <div className="flex flex-wrap items-center gap-x-5 gap-y-2 border-b border-border/60 bg-surface-2/60 px-5 py-3">
        {first?.width && first?.height && <Meta icon={ImageIcon}>{first.width}×{first.height}</Meta>}
        {first?.mime_type && <Meta icon={ImageIcon}>{first.mime_type.replace('image/', '').toUpperCase()}</Meta>}
        <div className="ml-auto flex items-center gap-2">
          <button
            type="button"
            onClick={onRegenerate}
            className="inline-flex items-center gap-1.5 rounded-lg bg-gradient-to-r from-primary to-secondary px-3 py-1.5 text-xs font-semibold text-white transition-all hover:brightness-110"
          >
            <RefreshCw size={13} />
            Regenerate
          </button>
        </div>
      </div>

      {/* the prompt used */}
      <div className="border-b border-border/60 px-5 py-3">
        <p className="line-clamp-2 text-xs leading-relaxed text-mute">
          <span className="font-semibold text-mist/70">Prompt: </span>
          {result.prompt}
        </p>
      </div>

      {/* images */}
      <div className="p-5">
        <div className={`grid gap-4 ${multi ? 'sm:grid-cols-2' : 'mx-auto max-w-2xl grid-cols-1'}`}>
          {images.map((img, i) => (
            <ImageCard
              key={`${img.url.slice(0, 48)}-${i}`}
              image={img}
              index={i}
              copied={copied}
              onCopyPrompt={async () => {
                try {
                  await copyText(result.prompt)
                  toast.success('Prompt copied to clipboard')
                } catch {
                  toast.error('Could not copy to clipboard')
                }
              }}
            />
          ))}
        </div>
      </div>
    </div>
  )
}
