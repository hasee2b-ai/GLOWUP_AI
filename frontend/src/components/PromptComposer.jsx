import PromptEditor from './PromptEditor.jsx'
import SettingsPanel from './SettingsPanel.jsx'
import SlingButton from './SlingButton.jsx'

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
  const handleSend = () => {
    if (loading) return
    onGenerate()
  }

  return (
    <section
      aria-label="Prompt and generation settings"
      className="relative mx-auto w-full max-w-[60%] overflow-visible rounded-2xl border border-primary/10 bg-gradient-to-b from-surface to-surface-2/60 transition-all duration-200 focus-visible:outline-none"
    >
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-primary/50 to-transparent" />
      <PromptEditor prompt={prompt} onChange={onPromptChange} />

      <div className="flex flex-col gap-1.5 border-t border-border/60 bg-surface-2/40 px-2 py-1.5 sm:flex-row sm:items-center sm:justify-between sm:gap-2 sm:px-3">
        <SettingsPanel settings={settings} onChange={onSettingsChange} />

        <div className="flex w-full shrink-0 items-center justify-end sm:w-auto pr-1 sm:pr-2">
          <SlingButton
            onSend={handleSend}
            size={33}
            strokeWidth={1.4}
            armAt={24}
            maxPull={64}
            launchSpeed={1600}
            recoil={0.2}
            flight={50}
            particles={6}
            spread={38}
            axis="any"
            tapSends
            disabled={loading}
            ariaLabel={loading ? 'Generating' : 'Generate'}
            padColor="#ffffff"
            iconColor="#000000"
            accentColor="#c4b5fd"
            wellColor="#ece7ff"
            bandColor="#a78bfa"
            className={loading ? 'pointer-events-none opacity-70' : ''}
          />
        </div>
      </div>
    </section>
  )
}

