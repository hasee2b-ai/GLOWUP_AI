import { useCallback, useState } from 'react'

/**
 * useState backed by localStorage. Used only for lightweight, non-sensitive
 * preferences and a small session history of image metadata/thumbnails. Never
 * stores secrets or full-resolution image data.
 *
 * A persistence failure (e.g. the browser storage quota) is reported with a
 * warning instead of being swallowed, and the in-memory value is still returned
 * so the current session keeps working. Array values are trimmed (oldest
 * first) and the write retried, so at least the most recent data survives
 * rather than the whole write being lost silently.
 */
export function useLocalStorage(key, initialValue) {
  const [value, setValue] = useState(() => {
    try {
      const raw = window.localStorage.getItem(key)
      return raw !== null ? JSON.parse(raw) : initialValue
    } catch {
      return initialValue
    }
  })

  const set = useCallback(
    (next) => {
      setValue((prev) => {
        const resolved = typeof next === 'function' ? next(prev) : next
        persist(key, resolved)
        return resolved
      })
    },
    [key]
  )

  const remove = useCallback(() => {
    try {
      window.localStorage.removeItem(key)
    } catch {
      /* ignore */
    }
    setValue(initialValue)
  }, [key, initialValue])

  return [value, set, remove]
}

function persist(key, value) {
  let candidate = value
  // On quota errors, drop the oldest array entries and retry a few times so
  // recent data is persisted instead of the whole write failing silently.
  for (let attempt = 0; attempt < 4; attempt++) {
    try {
      window.localStorage.setItem(key, JSON.stringify(candidate))
      return
    } catch (err) {
      if (!Array.isArray(candidate) || candidate.length <= 1) {
        console.warn(`[useLocalStorage] Could not persist "${key}" to localStorage.`, err)
        return
      }
      candidate = candidate.slice(0, Math.max(1, Math.floor(candidate.length / 2)))
    }
  }
  console.warn(`[useLocalStorage] Could not persist "${key}" to localStorage after trimming.`)
}
