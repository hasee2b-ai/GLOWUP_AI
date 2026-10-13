import { Eraser, Lightbulb } from 'lucide-react'
import { EXAMPLE_PROMPTS, MAX_PROMPT_LENGTH } from '../utils/constants.js'

export default function PromptEditor({ prompt, onChange, onGenerate, loading }) {
  const remaining = MAX_PROMPT_LENGTH - prompt.length
  const nearLimit = remaining <= 200

  return (
    <div>
      <div className="flex items-center justify-between">
        <label htmlFor="prompt" className="text-xs font-semibold uppercase tracking-wider text-mute">
          Your prompt
        </label>
        <button
          type="button"
          onClick={() => onChange('')}
          disabled={!prompt}
          className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-medium text-mute transition-colors hover:bg-mist/5 hover:text-mist disabled:cursor-not-allowed disabled:opacity-40"
        >
          <Eraser size={13} />
          Clear
        </button>
      </div>

      <div className="relative mt-2.5">
        <textarea
          id="prompt"
          value={prompt}
          onChange={(e) => onChange(e.target.value.slice(0, MAX_PROMPT_LENGTH))}
          placeholder="Describe the image you imagine..."
          rows={5}
          className="w-full resize-none rounded-xl border border-border bg-surface-2 px-4 py-3 text-sm leading-relaxed text-mist placeholder:text-mute/40 transition-colors focus:border-primary/60 focus:outline-none focus:ring-2 focus:ring-primary/15"
        />
        <span
          className={`pointer-events-none absolute bottom-2.5 right-3 text-[11px] tabular-nums ${
            nearLimit ? 'text-secondary' : 'text-mute/50'
          }`}
        >
          {prompt.length}/{MAX_PROMPT_LENGTH}
        </span>
      </div>

      {/* Example prompts */}
      <div className="mt-4">
        <p className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-mute">
          <Lightbulb size={13} className="text-primary" />
          Try an example
        </p>
        <div className="mt-2.5 flex flex-wrap gap-2">
          {EXAMPLE_PROMPTS.map((ex) => (
            <button
              key={ex.id}
              type="button"
              onClick={() => onChange(ex.prompt)}
              className="rounded-full border border-border bg-surface-2 px-3.5 py-1.5 text-xs font-medium text-mute transition-all hover:border-primary/50 hover:text-mist"
            >
              {ex.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
