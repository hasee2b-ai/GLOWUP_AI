import { useCallback, useEffect, useRef, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { Sparkles, AlertCircle, Wand2, Zap } from 'lucide-react'
import { generateImage, checkHealth } from '../services/api.js'
import { useLocalStorage } from '../hooks/useLocalStorage.js'
import { useToast } from '../components/Toast.jsx'
import { copyText, makeThumbnail } from '../utils/helpers.js'
import PromptEditor from '../components/PromptEditor.jsx'
import SettingsPanel from '../components/SettingsPanel.jsx'
import ResultPreview from '../components/ResultPreview.jsx'
import HistoryStrip from '../components/HistoryStrip.jsx'

const HISTORY_KEY = 'glowup.history'
const HISTORY_LIMIT = 12

export default function Create() {
  const toast = useToast()
  const [searchParams] = useSearchParams()

  // Always land at the top of the page when navigating here (e.g. from a
  // prompt card on the landing page) instead of the browser keeping scroll.
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' })
  }, [])

  // Prefill the prompt from ?prompt= (e.g. "Try this prompt" on the landing
  // page) without auto-generating — the user still presses Generate.
  const [prompt, setPrompt] = useState(() => searchParams.get('prompt') || '')
  const [settings, setSettings] = useState({
    size: '1024x1024',
    n: 1,
    promptExtend: true,
    watermark: true,
  })

  const [status, setStatus] = useState('idle') // idle | loading | success | error
  const [result, setResult] = useState(null)
  const [error, setError] = useState(null)
  const [copied, setCopied] = useState(false)
  const [history, setHistory] = useLocalStorage(HISTORY_KEY, [])

  const copyTimer = useRef(null)
  const reqId = useRef(0)

  // Warn if the backend/provider is not configured.
  useEffect(() => {
    let cancelled = false
    checkHealth()
      .then((h) => {
        if (cancelled) return
        if (h && h.provider_configured === false) {
          toast.info('The backend is running but no provider API key is configured yet.')
        }
      })
      .catch(() => {
        if (!cancelled) {
          toast.error('Cannot reach the backend. Is the FastAPI server running?')
        }
      })
    return () => {
      cancelled = true
    }
  }, [toast])

  const runGeneration = useCallback(
    async (promptText, cfg) => {
      const id = ++reqId.current
      setStatus('loading')
      setError(null)
      try {
        const data = await generateImage({
          prompt: promptText,
          size: cfg.size,
          n: cfg.n,
          prompt_extend: cfg.promptExtend,
          watermark: cfg.watermark,
        })
        if (id !== reqId.current) return
        setResult(data)
        setStatus('success')
        toast.success('Your image is ready')

        // Persist only small thumbnails, never the full-resolution base64
        // payloads: 12 entries x up to 4 multi-MB data URLs would exhaust the
        // browser's localStorage quota. A selected history item restores its
        // thumbnail (not the full-resolution image); press Regenerate for a
        // fresh high-resolution result.
        //
        // History recording is isolated from the generation result so that a
        // thumbnail/storage failure can never turn a successful generation into
        // an error. Metadata is recorded even when thumbnails cannot be built.
        const entry = {
          id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
          prompt: data.prompt,
          images: [],
          timestamp: Date.now(),
        }
        try {
          const thumbnails = await Promise.all(
            (data.images || []).map((image) => makeThumbnail(image.url))
          )
          entry.images = thumbnails.filter(Boolean)
        } catch (thumbErr) {
          // Keep the prompt/timestamp metadata; HistoryStrip shows a placeholder.
          console.warn('Could not build history thumbnails; recording metadata only.', thumbErr)
        }
        setHistory((prev) => [entry, ...prev].slice(0, HISTORY_LIMIT))
      } catch (err) {
        if (id !== reqId.current) return
        setError(err.message || 'Something went wrong. Please try again.')
        setStatus('error')
      }
    },
    [setHistory, toast]
  )

  const handleGenerate = () => {
    const trimmed = prompt.trim()
    if (!trimmed) {
      toast.error('Please enter a prompt first.')
      return
    }
    runGeneration(trimmed, settings)
  }

  const handleRegenerate = () => {
    const trimmed = (result?.prompt || prompt).trim()
    if (!trimmed) {
      toast.error('Nothing to regenerate yet.')
      return
    }
    runGeneration(trimmed, settings)
  }

  const handleSelectHistory = (item) => {
    // Clicking a history item loads its prompt into the editor for reuse. It
    // must not replace or downgrade the current result: history stores
    // low-resolution thumbnails, so the full-resolution preview is left as-is.
    // Copying to the clipboard stays with the dedicated copy control in
    // HistoryStrip.
    setPrompt(item.prompt || '')
  }

  const handleClearHistory = () => {
    setHistory([])
    toast.info('History cleared')
  }

  const handleCopyPrompt = async (text) => {
    try {
      await copyText(text)
      setCopied(true)
      if (copyTimer.current) clearTimeout(copyTimer.current)
      copyTimer.current = setTimeout(() => setCopied(false), 1600)
      toast.success('Prompt copied to clipboard')
    } catch {
      toast.error('Could not copy to clipboard')
    }
  }

  const loading = status === 'loading'

  return (
    <div className="mx-auto max-w-[1400px] px-5 py-8 sm:px-8 lg:py-12">
      {/* Page heading */}
      <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
        <div>
          <span className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-3.5 py-1 text-xs font-semibold uppercase tracking-wider text-primary">
            <Sparkles size={13} />
            Studio
          </span>
          <h1 className="mt-3 font-display text-3xl font-bold tracking-tight sm:text-4xl">
            Create your image
          </h1>
          <p className="mt-1.5 text-sm text-mute">
            Describe what you imagine, tune the settings, and generate.
          </p>
        </div>
        {history.length > 0 && (
          <div className="inline-flex items-center gap-2 rounded-full border border-border bg-surface px-4 py-2 text-xs text-mute">
            <Zap size={13} className="text-primary" />
            {history.length} image{history.length === 1 ? '' : 's'} this session
          </div>
        )}
      </div>

      <div className="grid gap-6 lg:grid-cols-[420px_1fr]">
        {/* ------------------------- Controls ------------------------- */}
        <div className="space-y-5">
          <section className="overflow-hidden rounded-2xl border border-border bg-surface">
            {/* panel header */}
            <div className="flex items-center gap-2.5 border-b border-border/60 px-6 py-4">
              <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-primary/15 to-secondary/15">
                <Wand2 size={15} className="text-primary" />
              </span>
              <h2 className="font-display text-sm font-semibold tracking-wide text-mist">
                Prompt &amp; Settings
              </h2>
            </div>
            <div className="space-y-6 p-6">
              <PromptEditor prompt={prompt} onChange={setPrompt} loading={loading} />
              <div className="h-px bg-mist/5" />
              <SettingsPanel settings={settings} onChange={setSettings} />
            </div>
            {/* generate button pinned to panel bottom */}
            <div className="border-t border-border/60 bg-surface-2/60 p-5">
              <button
                type="button"
                onClick={handleGenerate}
                disabled={loading}
                className="group relative flex w-full items-center justify-center gap-2.5 overflow-hidden rounded-xl bg-gradient-to-r from-primary to-secondary px-6 py-3.5 text-base font-semibold text-white shadow-lg shadow-primary/20 transition-all hover:shadow-primary/25 hover:brightness-110 active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-60 disabled:shadow-none"
              >
                <Sparkles size={18} className={loading ? 'animate-pulse' : ''} />
                {loading ? 'Generating...' : 'Generate Image'}
              </button>
              {status === 'error' && (
                <div className="mt-3 flex items-start gap-2.5 rounded-xl border border-secondary/20 bg-secondary/10 px-4 py-3 text-sm text-mist animate-fade-in">
                  <AlertCircle size={16} className="mt-0.5 shrink-0 text-secondary" />
                  <span>{error}</span>
                </div>
              )}
            </div>
          </section>
        </div>

        {/* ------------------------- Preview ------------------------- */}
        <div className="min-w-0 lg:sticky lg:top-24 lg:self-start">
          <ResultPreview
            status={status}
            result={result}
            error={error}
            onRegenerate={handleRegenerate}
            onCopyPrompt={() => handleCopyPrompt(result?.prompt || prompt)}
            copied={copied}
          />
        </div>
      </div>

      {/* ------------------------- History ------------------------- */}
      <HistoryStrip
        history={history}
        selectedId={result?.id}
        onSelect={handleSelectHistory}
        onClear={handleClearHistory}
        onCopyPrompt={handleCopyPrompt}
      />
    </div>
  )
}
