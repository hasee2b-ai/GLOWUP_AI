import { History, Trash2, Copy, Image } from 'lucide-react'
import { formatTimestamp } from '../utils/helpers.js'

/**
 * Recent generations as a compact horizontal tray above the composer, so
 * re-using a past prompt never needs a page scroll. Selection, per-item copy
 * and clearing behave exactly as before; only the layout is condensed.
 */
export default function HistoryStrip({ history, selectedId, onSelect, onClear, onCopyPrompt }) {
  if (!history || history.length === 0) return null

  // Count images, not entries: an entry can hold one or two images.
  const imageCount = history.reduce(
    (total, entry) => total + (Array.isArray(entry?.images) ? entry.images.length : 0),
    0
  )

  return (
    <section
      aria-label="Recent generations"
      className="mx-auto flex w-full max-w-[60%] items-center gap-2 border-t border-border/60 pt-1.5 sm:gap-3 sm:pt-2"
    >
      <div className="flex shrink-0 items-center gap-1.5 sm:gap-2">
        <History size={14} className="text-mute" aria-hidden="true" />
        <span className="whitespace-nowrap text-xs font-semibold text-mist">Recent</span>
        <span className="hidden whitespace-nowrap text-[11px] tabular-nums text-mute sm:inline">
          {imageCount} {imageCount === 1 ? 'image' : 'images'}
        </span>
        <button
          type="button"
          onClick={onClear}
          aria-label="Clear history"
          className="inline-flex items-center gap-1 rounded-lg px-1.5 py-1 text-xs font-medium text-mute transition-colors hover:bg-mist/5 hover:text-secondary sm:px-2"
        >
          <Trash2 size={12} />
          <span className="hidden sm:inline">Clear</span>
        </button>
      </div>

      {/* one row, scrollable sideways — never pushes the page wider */}
      <div className="flex min-w-0 flex-1 gap-1.5 overflow-x-auto pb-0.5 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden sm:gap-2">
        {history.map((item) => {
          const first = item.images?.[0]
          const thumb = first?.url
          const active = item.id === selectedId
          return (
            // Wrapper carries the hover group and positions the copy button;
            // selection and copy stay two separate, non-nested controls.
            <div key={item.id} className="group relative shrink-0">
              <button
                type="button"
                onClick={() => onSelect(item)}
                aria-label={`Select generation from ${formatTimestamp(item.timestamp)}`}
                aria-pressed={active}
                className={`relative block h-12 w-12 overflow-hidden rounded-lg border transition-all sm:h-14 sm:w-14 ${
                  active
                    ? 'border-primary/70 ring-2 ring-primary/30'
                    : 'border-border hover:border-mist/40'
                }`}
              >
                {thumb ? (
                  <img
                    src={thumb}
                    alt={item.prompt}
                    className="h-full w-full object-cover"
                    loading="lazy"
                  />
                ) : (
                  <span className="flex h-full w-full items-center justify-center bg-mist/5">
                    <Image size={16} className="text-mute/40" aria-hidden="true" />
                  </span>
                )}
              </button>
              <button
                type="button"
                aria-label="Copy prompt"
                onClick={() => onCopyPrompt(item.prompt)}
                className="absolute right-0.5 top-0.5 rounded-md bg-ink/70 p-0.5 text-mist backdrop-blur transition-opacity hover:text-primary focus-visible:opacity-100 md:opacity-0 md:group-hover:opacity-100"
              >
                <Copy size={10} className="sm:w-[11px] sm:h-[11px]" />
              </button>
            </div>
          )
        })}
      </div>
    </section>
  )
}
