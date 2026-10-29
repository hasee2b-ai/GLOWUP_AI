import { Sparkles, Loader2 } from 'lucide-react'
import PromptEditor from './PromptEditor.jsx'
import SettingsPanel from './SettingsPanel.jsx'

/** 
 * The composer: one cohesive, anchored control at the foot of the workspace.
 *
 *   prompt text (main area)
 *   ──────────────────────────────────────────────
 *   [aspect] [count] [enhance] [watermark]   [Generate]
 *
 * It is a presentational shell only — prompt, settings, loading state and the
 * generate handler all stay in the Create page, exactly as before.
 */
export default function PromptComposer({
  prompt,
  onPromptChange,
  settings,
  onSettingsChange,
  loading,
  onGenerate,
}) {
  return (
    <section
      aria-label="Prompt and generation settings"
      className="rounded-2xl border border-border bg-surface shadow-lg shadow-mist/[0.06] transition-colors duration-200 focus-within:border-primary/40 focus-within:ring-1 focus-within:ring-primary/15"
    >
      <PromptEditor prompt={prompt} onChange={onPromptChange} />

      <div className="flex flex-col gap-3 border-t border-border/70 bg-surface-2/60 px-3 py-3 sm:flex-row sm:items-center sm:justify-between sm:gap-4 sm:px-4">
        <SettingsPanel settings={settings} onChange={onSettingsChange} />

        <button
          type="button"
          onClick={onGenerate}
          disabled={loading}
          className="inline-flex h-10 w-full shrink-0 items-center justify-center gap-2 rounded-xl bg-primary px-5 text-sm font-semibold text-white shadow-sm shadow-primary/20 transition-colors duration-150 hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60 disabled:shadow-none sm:w-auto"
        >
          {loading ? (
            <Loader2 size={16} className="animate-spin" />
          ) : (
            <Sparkles size={16} />
          )}
          {loading ? 'Generating...' : 'Generate'}
        </button>
      </div>
    </section>
  )
}
