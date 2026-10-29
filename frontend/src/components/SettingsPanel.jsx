import { Sparkles, Droplet, ChevronDown } from 'lucide-react'
import { ASPECT_RATIOS, IMAGE_COUNTS } from '../utils/constants.js'

// Simple ratio indicators: a rounded rectangle whose proportions mirror the
// ratio, instead of the previous checkbox-shaped glyph.
const RATIO_BOX = {
  square: { width: 14, height: 14 },
  portrait: { width: 10, height: 16 },
  landscape: { width: 16, height: 10 },
}

/**
 * Compact secondary row of the composer: aspect ratio, image count and the two
 * optional generation switches. All controls share one height, radius, border
 * and typography so the row reads as a single toolbar.
 */
export default function SettingsPanel({ settings, onChange }) {
  const set = (patch) => onChange({ ...settings, ...patch })

  return (
    <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center">
      {/* Aspect ratio — full width on mobile, segmented selector */}
      <div
        role="group"
        aria-label="Aspect ratio"
        className="flex h-10 w-full items-center gap-0.5 rounded-xl border border-border bg-surface-2 p-1 sm:w-auto sm:flex-1"
      >
        {ASPECT_RATIOS.map((r) => {
          const active = settings.size === r.size
          const box = RATIO_BOX[r.id]
          return (
            <button
              key={r.id}
              type="button"
              onClick={() => set({ size: r.size })}
              aria-pressed={active}
              aria-label={`${r.label} ${r.hint}`}
              className={`inline-flex h-8 items-center gap-1.5 rounded-lg px-2 text-xs font-medium whitespace-nowrap transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 disabled:cursor-not-allowed disabled:opacity-50 ${
                active
                  ? 'bg-primary/12 text-primary shadow-sm'
                  : 'text-mute hover:bg-surface hover:text-mist'
              }`}
            >
              <span
                className={`shrink-0 rounded-[3px] border-2 transition-colors ${
                  active ? 'border-primary' : 'border-mute/40'
                }`}
                style={{ width: box.width, height: box.height }}
              />
              <span>{r.label}</span>
              <span
                className={`tabular-nums ${
                  active ? 'text-primary/70' : 'text-mute/60'
                }`}
              >
                {r.hint}
              </span>
            </button>
          )
        })}
      </div>

      {/* Image count + toggles — second row on mobile */}
      <div className="flex flex-wrap items-center gap-2">
        {/* Image count */}
        <div className="relative">
        <select
          id="image-count"
          aria-label="Number of images"
          value={settings.n}
          onChange={(e) => set({ n: Number(e.target.value) })}
          className="h-10 appearance-none rounded-xl border border-border bg-surface pl-3.5 pr-9 text-xs font-medium text-mist transition-colors duration-150 hover:border-mist/30 focus:border-primary/60 focus:outline-none focus:ring-2 focus:ring-primary/20 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {IMAGE_COUNTS.map((c) => (
            <option key={c} value={c}>
              {c} {c === 1 ? 'image' : 'images'}
            </option>
          ))}
        </select>
        <ChevronDown
          size={14}
          className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-mute"
        />
      </div>

      {/* Enhance / Watermark */}
      {[
        { key: 'promptExtend', label: 'Prompt enhancement', visibleLabel: 'Enhance', icon: Sparkles },
        { key: 'watermark', label: 'Watermark', visibleLabel: 'Watermark', icon: Droplet },
      ].map(({ key, label, visibleLabel, icon: Icon }) => {
        const checked = settings[key]
        return (
          <button
            key={key}
            type="button"
            role="switch"
            aria-checked={checked}
            aria-label={label}
            title={label}
            onClick={() => set({ [key]: !checked })}
            className={`inline-flex h-10 items-center gap-2.5 rounded-xl border px-3.5 text-xs font-medium transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 disabled:cursor-not-allowed disabled:opacity-50 ${
              checked
                ? 'border-primary/40 bg-primary/8 text-mist'
                : 'border-border bg-surface text-mute hover:border-mist/30 hover:text-mist'
            }`}
          >
            <Icon size={14} className={checked ? 'text-primary' : 'text-mute/70'} />
            <span>{visibleLabel}</span>
            <span
              className={`relative h-4 w-7 shrink-0 rounded-full transition-colors duration-200 ${
                checked ? 'bg-primary' : 'bg-mist/20'
              }`}
            >
              <span
                className="absolute top-0.5 h-3 w-3 rounded-full bg-white shadow-sm transition-[left] duration-200"
                style={{ left: checked ? '14px' : '2px' }}
              />
            </span>
          </button>
        )
      })}
      </div>
    </div>
  )
}
