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
 *
 * For values that are expected to be arrays (such as the session history), the
 * hook now normalizes whatever is in storage into a safe array on read, and the
 * update callback safely handles a non-array previous value. That prevents
 * malformed JSON and valid-but-unexpected JSON values (null, strings, numbers,
 * or plain objects) from crashing the Create page or HistoryStrip. Existing
 * valid history arrays are preserved as-is; only corrupted or unexpected values
 * are replaced with an empty array so the rest of the app keeps running.
 */

const HISTORY_KEY = 'glowup.history'

const isValidHistoryEntry = (entry) =>
  entry != null && typeof entry === 'object' && !Array.isArray(entry)

const isHistoryArray = (value) =>
  Array.isArray(value) && value.every(isValidHistoryEntry)

export function useLocalStorage(key, initialValue, { normalize = false } = {}) {
  const [value, setValue] = useState(() => {
    let parsed
    try {
      const raw = window.localStorage.getItem(key)
      parsed = raw !== null ? JSON.parse(raw) : initialValue
    } catch {
      parsed = initialValue
    }

    if (!normalize) return parsed

    if (key === HISTORY_KEY) {
      if (!Array.isArray(parsed)) {
        return []
      }
      const filtered = parsed.filter(isValidHistoryEntry)
      return filtered
    }
    return parsed
  })

  const set = useCallback(
    (next) => {
      setValue((prev) => {
        let resolved
        if (typeof next === 'function') {
          resolved = next(prev)
        } else {
          resolved = next
        }

        // History updates must tolerate a corrupted previous value without
        // throwing, while still appending/building on top of a non-array
        // baseline when callers use functional updates.
        if (key === HISTORY_KEY) {
          if (!Array.isArray(resolved)) {
            resolved = []
          }
        }

        persist(key, resolved)
        return resolved
      })
    },
    [key],
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

// Keep `isHistoryArray` available for future callers that may want to
// validate stored history using the same heuristics as this module.
export { isHistoryArray }

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
