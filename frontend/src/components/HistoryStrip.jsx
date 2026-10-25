import { History, Trash2, Copy, Image } from 'lucide-react'
import { formatTimestamp } from '../utils/helpers.js'
import { useToast } from './Toast.jsx'

export default function HistoryStrip({ history, selectedId, onSelect, onClear, onCopyPrompt }) {
  const toast = useToast()

  if (!history || history.length === 0) return null

  return (
    <div className="mt-12 border-t border-border/60 pt-8">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="inline-flex items-center gap-2 font-display text-lg font-semibold">
          <History size={18} className="text-primary" />
          Recent generations
        </h2>
        <button
          type="button"
          onClick={onClear}
          className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-medium text-mute transition-colors hover:bg-mist/5 hover:text-secondary"
        >
          <Trash2 size={13} />
          Clear history
        </button>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
        {history.map((item) => {
          const first = item.images?.[0]
          const thumb = first?.url
          const active = item.id === selectedId
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => onSelect(item)}
              className={`group relative overflow-hidden rounded-xl border text-left transition-all ${
                active
                  ? 'border-primary/70 ring-2 ring-primary/30'
                  : 'border-border hover:border-mist/30'
              }`}
              aria-label={`Select generation from ${formatTimestamp(item.timestamp)}`}
            >
              {thumb ? (
                <img
                  src={thumb}
                  alt={item.prompt}
                  className="aspect-square w-full object-cover"
                  loading="lazy"
                />
              ) : (
                <div className="flex aspect-square w-full items-center justify-center bg-mist/5">
                  <Image size={20} className="text-mute/40" />
                </div>
              )}
              <span className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-ink/95 to-transparent px-2.5 pb-2 pt-6">
                <span className="block truncate text-[11px] text-mist">{item.prompt}</span>
                <span className="text-[10px] text-mute/60">{formatTimestamp(item.timestamp)}</span>
              </span>
              <span
                role="button"
                tabIndex={0}
                aria-label="Copy prompt"
                onClick={(e) => {
                  e.stopPropagation()
                  onCopyPrompt(item.prompt)
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.stopPropagation()
                    onCopyPrompt(item.prompt)
                  }
                }}
                className="absolute right-1.5 top-1.5 rounded-md bg-ink/70 p-1.5 text-mute backdrop-blur transition-opacity hover:text-mist md:opacity-0 md:group-hover:opacity-100"
              >
                <Copy size={12} />
              </span>
            </button>
          )
        })}
      </div>
    </div>
  )
}
