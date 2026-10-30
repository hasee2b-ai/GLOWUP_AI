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
  const handleSubmit = () => {
    if (loading) return
    onGenerate()
  }

  return (
    <section
      aria-label="Prompt and generation settings"
      className="relative mx-auto w-full max-w-[90%] sm:max-w-[85%] md:max-w-[75%] lg:max-w-[65%] xl:max-w-[60%] overflow-visible rounded-2xl border border-primary/10 bg-gradient-to-b from-surface to-surface-2/60 transition-all duration-200 focus-visible:outline-none"
    >
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-primary/50 to-transparent" />
      <PromptEditor prompt={prompt} onChange={onPromptChange} onSubmit={handleSubmit} />

      <div className="flex flex-col gap-1.5 border-t border-border/60 bg-surface-2/40 px-2 py-1.5 sm:flex-row sm:items-center sm:justify-between sm:gap-2 sm:px-3">
        <SettingsPanel settings={settings} onChange={onSettingsChange} />

        <button
          type="button"
          onClick={onGenerate}
          disabled={loading || !prompt.trim()}
          className="inline-flex h-9 w-full shrink-0 items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-primary to-violet-500 px-5 text-sm font-semibold text-white shadow-md shadow-primary/25 transition-all duration-150 hover:shadow-primary/40 hover:brightness-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60 disabled:shadow-none sm:w-auto sm:h-9"
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

