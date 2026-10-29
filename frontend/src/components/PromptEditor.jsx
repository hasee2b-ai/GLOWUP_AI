import { useLayoutEffect, useRef } from 'react'
import { Eraser } from 'lucide-react'
import { MAX_PROMPT_LENGTH } from '../utils/constants.js'

// The composer may grow with the prompt, but never past ~4 lines: it must not
// push the results out of the workspace.
const MAX_TEXTAREA_HEIGHT = 160

/**
 * The prompt half of the composer: one comfortable, borderless text area that
 * grows with what is written, plus the clear action and character counter.
 */
export default function PromptEditor({ prompt, onChange }) {
  const textareaRef = useRef(null)
  const remaining = MAX_PROMPT_LENGTH - prompt.length
  const nearLimit = remaining <= 200

  useLayoutEffect(() => {
    const el = textareaRef.current
    if (!el) return
    el.style.height = 'auto'
    el.style.height = `${Math.min(el.scrollHeight, MAX_TEXTAREA_HEIGHT)}px`
  }, [prompt])

  return (
    <div>
      <label htmlFor="prompt" className="sr-only">
        Your prompt
      </label>
      <textarea
        id="prompt"
        ref={textareaRef}
        value={prompt}
        onChange={(e) => onChange(e.target.value.slice(0, MAX_PROMPT_LENGTH))}
        placeholder="Describe the image you want to create..."
        rows={3}
        className="block min-h-[80px] w-full resize-none bg-transparent px-4 pt-3 pb-1 text-[15px] leading-6 text-mist placeholder:text-mute/50 focus:outline-none"
      />

      {/* clear + counter sit under the field, inside the prompt zone */}
      <div className="flex items-center justify-end gap-1 px-3 pb-1.5">
        <button
          type="button"
          onClick={() => onChange('')}
          disabled={!prompt}
          className="inline-flex items-center gap-1.5 rounded-lg px-2 py-1 text-xs font-medium text-mute transition-colors hover:bg-mist/5 hover:text-mist disabled:cursor-not-allowed disabled:opacity-40"
        >
          <Eraser size={12} />
          Clear
        </button>
        <span
          className={`px-1.5 text-[11px] tabular-nums ${
            nearLimit ? 'font-semibold text-mist' : 'text-mute/60'
          }`}
        >
          {prompt.length}/{MAX_PROMPT_LENGTH}
        </span>
      </div>
    </div>
  )
}
