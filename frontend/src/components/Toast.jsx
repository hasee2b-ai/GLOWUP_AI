import { createContext, useCallback, useContext, useMemo, useRef, useState } from 'react'
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react'

const ToastContext = createContext(null)

let idCounter = 0

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([])
  const timers = useRef({})

  const dismiss = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id))
    if (timers.current[id]) {
      clearTimeout(timers.current[id])
      delete timers.current[id]
    }
  }, [])

  const push = useCallback(
    (message, type = 'info', duration = 4200) => {
      const id = ++idCounter
      setToasts((prev) => [...prev, { id, message, type }])
      timers.current[id] = setTimeout(() => dismiss(id), duration)
    },
    [dismiss]
  )

  // Memoize the context value so adding/removing a toast (which rerenders this
  // provider) does not change the identity of `toast` for consumers. An
  // unstable value would rerun any effect depending on it — e.g. the
  // health-check effect in Create.jsx would loop: check -> error toast ->
  // provider rerender -> new value -> effect rerun.
  const value = useMemo(
    () => ({
      success: (m, d) => push(m, 'success', d),
      error: (m, d) => push(m, 'error', d),
      info: (m, d) => push(m, 'info', d),
    }),
    [push]
  )

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div
        className="fixed bottom-5 right-5 z-[100] flex flex-col gap-2.5 max-w-sm w-[calc(100%-2.5rem)]"
        role="region"
        aria-label="Notifications"
      >
        {toasts.map((t) => (
          <ToastCard key={t.id} toast={t} onDismiss={() => dismiss(t.id)} />
        ))}
      </div>
    </ToastContext.Provider>
  )
}

const ICONS = {
  success: CheckCircle2,
  error: AlertCircle,
  info: Info,
}

const ACCENT = {
  success: 'text-emerald-600',
  error: 'text-rose-600',
  info: 'text-primary',
}

function ToastCard({ toast, onDismiss }) {
  const Icon = ICONS[toast.type] || Info
  return (
    <div
      role="status"
      className="flex items-start gap-3 rounded-xl border border-border bg-surface/95 backdrop-blur px-4 py-3 shadow-xl shadow-primary/10 animate-fade-up"
    >
      <Icon size={19} className={`mt-0.5 shrink-0 ${ACCENT[toast.type] || 'text-primary'}`} />
      <p className="text-sm leading-snug text-mist flex-1">{toast.message}</p>
      <button
        onClick={onDismiss}
        aria-label="Dismiss notification"
        className="text-mute hover:text-mist transition-colors shrink-0"
      >
        <X size={16} />
      </button>
    </div>
  )
}

export function useToast() {
  return useContext(ToastContext)
}
