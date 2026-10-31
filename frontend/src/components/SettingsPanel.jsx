import { Sparkles, Droplet, ChevronDown } from 'lucide-react'
import { ASPECT_RATIOS, IMAGE_COUNTS } from '../utils/constants.js'

/**
 * Compact secondary row of the composer: aspect ratio, image count and the two
 * optional generation switches. All controls share one height, radius, border
 * and typography so the row reads as a single toolbar.
 */
export default function SettingsPanel({ settings, onChange }) {
  const set = (patch) => onChange({ ...settings, ...patch })

  return (
    <div className="flex w-full flex-col gap-1.5 sm:w-auto sm:flex-row sm:flex-wrap sm:items-center">
      {/* Aspect ratio as dropdown (like image count) */}
      <div className="relative w-full sm:w-auto">
        <select
          id="aspect-ratio"
          aria-label="Aspect ratio"
          value={settings.size}
          onChange={(e) => set({ size: e.target.value })}
          className="h-9 w-full appearance-none rounded-xl border border-border bg-surface pl-2.5 pr-8 text-xs font-medium text-mist transition-colors duration-150 hover:border-mist/30 focus:border-primary/60 focus:outline-none focus:ring-2 focus:ring-primary/20 disabled:cursor-not-allowed disabled:opacity-50 sm:h-10 sm:w-auto sm:pl-3.5 sm:pr-9"
        >
          {ASPECT_RATIOS.map((r) => (
            <option key={r.id} value={r.size}>
              {r.label} ({r.hint})
            </option>
          ))}
        </select>
        <ChevronDown
          size={14}
          className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-mute sm:right-3"
        />
      </div>

      {/* Image count + toggles — second row on mobile */}
      <div className="flex w-full flex-wrap items-center gap-1.5 sm:w-auto sm:gap-2">
        {/* Image count */}
        <div className="relative flex-1 min-w-[110px] sm:flex-none">
          <select
            id="image-count"
            aria-label="Number of images"
            value={settings.n}
            onChange={(e) => set({ n: Number(e.target.value) })}
            className="h-9 w-full appearance-none rounded-xl border border-border bg-surface pl-2.5 pr-8 text-xs font-medium text-mist transition-colors duration-150 hover:border-mist/30 focus:border-primary/60 focus:outline-none focus:ring-2 focus:ring-primary/20 disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto sm:pl-3 sm:pr-9"
          >
            {IMAGE_COUNTS.map((c) => (
              <option key={c} value={c}>
                {c} {c === 1 ? 'image' : 'images'}
              </option>
            ))}
          </select>
          <ChevronDown
            size={14}
            className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-mute sm:right-3"
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
              className={`inline-flex h-9 flex-1 items-center justify-center gap-1.5 rounded-xl border px-2 text-xs font-medium transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 disabled:cursor-not-allowed disabled:opacity-50 sm:flex-none sm:gap-2 sm:px-2.5 ${
                checked
                  ? 'border-primary/50 bg-primary/10 text-mist shadow-[0_0_0_1px_rgba(139,92,246,0.15)]'
                  : 'border-border bg-surface text-mute hover:border-mist/30 hover:text-mist'
              }`}
            >
              <Icon size={14} className={checked ? 'text-primary' : 'text-mute/70'} />
              <span className="hidden xs:inline">{visibleLabel}</span>
              <span className="xs:hidden">{visibleLabel === 'Enhance' ? 'Enh' : 'WM'}</span>
            </button>
          )
        })}
      </div>
    </div>
  )
}
