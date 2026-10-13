import { Sparkles, Droplet } from 'lucide-react'
import { ASPECT_RATIOS, IMAGE_COUNTS } from '../utils/constants.js'

function Toggle({ label, hint, checked, onChange, icon: Icon }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className="group flex w-full items-center justify-between gap-3 rounded-xl border border-border bg-surface-2 px-4 py-3 text-left transition-all duration-200 hover:border-mist/20 hover:bg-surface-2/80 active:scale-[0.99]"
    >
      <span className="flex min-w-0 items-start gap-3">
        {Icon && (
          <span
            className={`mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg transition-colors duration-200 ${
              checked ? 'bg-primary/15 text-primary' : 'bg-mist/5 text-mute group-hover:text-mist'
            }`}
          >
            <Icon size={15} />
          </span>
        )}
        <span className="min-w-0">
          <span className="block text-sm font-medium text-mist">{label}</span>
          {hint && (
            <span className="mt-0.5 block text-xs leading-relaxed text-mute">{hint}</span>
          )}
        </span>
      </span>

      {/* Switch track + knob */}
      <span
        className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors duration-300 ${
          checked
            ? 'bg-gradient-to-r from-primary to-secondary shadow-md shadow-primary/20'
            : 'bg-mist/15'
        }`}
      >
        <span
          className={`absolute left-0 h-[18px] w-[18px] rounded-full bg-white shadow-md transition-transform duration-300 ease-out ${
            checked ? 'translate-x-[22px]' : 'translate-x-[4px]'
          }`}
        />
      </span>
    </button>
  )
}

export default function SettingsPanel({ settings, onChange }) {
  const set = (patch) => onChange({ ...settings, ...patch })

  return (
    <div className="space-y-5">
      {/* Aspect ratio */}
      <div>
        <span className="mb-2.5 block text-xs font-semibold uppercase tracking-wider text-mute">
          Aspect ratio
        </span>
        <div className="grid grid-cols-3 gap-2">
          {ASPECT_RATIOS.map((r) => {
            const active = settings.size === r.size
            return (
              <button
                key={r.id}
                type="button"
                onClick={() => set({ size: r.size })}
                aria-pressed={active}
                className={`flex flex-col items-center gap-1.5 rounded-xl border px-2 py-3 transition-all ${
                  active
                    ? 'border-primary/60 bg-primary/10 text-mist shadow-md shadow-primary/10'
                    : 'border-border bg-surface-2 text-mute hover:border-mist/25'
                }`}
              >
                <span
                  className={`rounded-[4px] border-2 ${
                    active ? 'border-primary' : 'border-mute/30'
                  }`}
                  style={{
                    width: r.id === 'landscape' ? 30 : r.id === 'portrait' ? 20 : 24,
                    height: r.id === 'landscape' ? 20 : r.id === 'portrait' ? 30 : 24,
                  }}
                />
                <span className="text-xs font-medium">{r.label}</span>
                <span className="text-[10px] text-mute/60">{r.hint}</span>
              </button>
            )
          })}
        </div>
      </div>

      {/* Image count */}
      <div>
        <span className="mb-2.5 block text-xs font-semibold uppercase tracking-wider text-mute">
          Images
        </span>
        <div className="grid grid-cols-3 gap-2">
          {IMAGE_COUNTS.map((c) => {
            const active = settings.n === c
            return (
              <button
                key={c}
                type="button"
                onClick={() => set({ n: c })}
                aria-pressed={active}
                className={`rounded-xl border py-2.5 text-sm font-semibold transition-all ${
                  active
                    ? 'border-primary/60 bg-primary/10 text-mist shadow-md shadow-primary/10'
                    : 'border-border bg-surface-2 text-mute hover:border-mist/25'
                }`}
              >
                {c}
              </button>
            )
          })}
        </div>
      </div>

      {/* Toggles */}
      <div className="space-y-2.5">
        <Toggle
          label="Prompt enhancement"
          hint="Let the model expand your prompt for richer detail"
          icon={Sparkles}
          checked={settings.promptExtend}
          onChange={(v) => set({ promptExtend: v })}
        />
        <Toggle
          label="Watermark"
          hint="Add a subtle provider watermark to images"
          icon={Droplet}
          checked={settings.watermark}
          onChange={(v) => set({ watermark: v })}
        />
      </div>
    </div>
  )
}
