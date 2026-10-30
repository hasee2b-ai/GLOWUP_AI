import { useCallback, useEffect, useRef, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { generateImage, checkHealth } from '../services/api.js'
import { useLocalStorage } from '../hooks/useLocalStorage.js'
import { useToast } from '../components/Toast.jsx'
import { copyText, makeThumbnail } from '../utils/helpers.js'
import PromptComposer from '../components/PromptComposer.jsx'
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
    window.scrollTo({ top: 0, behavior: 'auto' })
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
  const [history, setHistory] = useLocalStorage(HISTORY_KEY, [], { normalize: true })

  const currentEntryRef = useRef(null)
  const clearVersionRef = useRef(0)
  const generationCommitVersionRef = useRef(0)
  const userSelectedIdRef = useRef(null)
  const copyTimer = useRef(null)

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
      .catch((err) => {
        if (cancelled) return
        console.error('Health check failed:', err)
        toast.error('Cannot reach the backend. Is the FastAPI server running?')
      })
    return () => {
      cancelled = true
    }
  }, [toast])

  const runGeneration = useCallback(
    async (promptText, cfg) => {
      setStatus('loading')
      setError(null)
      const clearVersionAtStart = clearVersionRef.current
      const generationVersion = ++generationCommitVersionRef.current
      try {
        const data = await generateImage({
          prompt: promptText,
          size: cfg.size,
          n: cfg.n,
          prompt_extend: cfg.promptExtend,
          watermark: cfg.watermark,
        })

        // Persist only small thumbnails, never the full-resolution base64
        // payloads: 12 entries x up to 4 multi-MB data URLs would exhaust the
        // browser's localStorage quota. (Selecting a history item only loads
        // its prompt — see handleSelectHistory — it does not restore images.)
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

        if (clearVersionRef.current !== clearVersionAtStart) {
          return
        }

        setHistory((prev) => {
          const safePrev = Array.isArray(prev) ? prev : []
          const next = [entry, ...safePrev]
          if (next.length > HISTORY_LIMIT) {
            next.length = HISTORY_LIMIT
          }
          return next
        })

        if (generationCommitVersionRef.current === generationVersion) {
          currentEntryRef.current = entry
          setResult(data)
          setStatus('success')
          toast.success('Your image is ready')
        }
      } catch (err) {
        if (generationCommitVersionRef.current !== generationVersion) return
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
    userSelectedIdRef.current = item.id ?? null
  }

  const handleClearHistory = () => {
    currentEntryRef.current = null
    userSelectedIdRef.current = null
    clearVersionRef.current = clearVersionRef.current + 1
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

  const historyList = Array.isArray(history) ? history : []
  const userSelectedId = userSelectedIdRef.current
  const userEntryExists =
    userSelectedId != null && historyList.some((entry) => entry?.id === userSelectedId)
  const effectiveUserSelection = userEntryExists ? userSelectedId : null

  let activeId = null
  if (effectiveUserSelection != null) {
    activeId = effectiveUserSelection
  } else {
    const latest = currentEntryRef.current
    if (
      latest != null &&
      historyList.some((entry) => entry?.id === latest.id)
    ) {
      activeId = latest.id
    }
  }

  return (
    <section className="mx-auto flex min-h-[calc(100dvh_-_var(--nav-h,64px))] h-[calc(100svh_-_var(--nav-h,64px))] w-full max-w-7xl flex-col gap-1.5 px-3 pt-2 pb-3 sm:gap-2 sm:px-4 md:px-6 sm:pt-3 sm:pb-4">
      <h1 className="sr-only">Create your image</h1>

      {/* Results workspace — scrolls on its own, above the composer */}
      <div className="flex min-h-0 flex-1 flex-col overflow-y-auto overscroll-contain">
        <ResultPreview
          status={status}
          result={result}
          error={error}
          n={settings.n}
          size={settings.size}
          onRegenerate={handleRegenerate}
          onCopyPrompt={() => handleCopyPrompt(result?.prompt || prompt)}
          copied={copied}
        />
      </div>

      {/* Recent generations — compact tray pinned above the composer */}
      <HistoryStrip
        history={history}
        selectedId={activeId}
        onSelect={handleSelectHistory}
        onClear={handleClearHistory}
        onCopyPrompt={handleCopyPrompt}
      />

      {/* Composer — prompt, settings and Generate, anchored at the bottom */}
      <PromptComposer
        prompt={prompt}
        onPromptChange={setPrompt}
        settings={settings}
        onSettingsChange={setSettings}
        loading={loading}
        onGenerate={handleGenerate}
      />
    </section>
  )
}
