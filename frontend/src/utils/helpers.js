// Small, pure helper functions used across the UI.

export function formatTimestamp(ts) {
  try {
    return new Date(ts).toLocaleString(undefined, {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  } catch {
    return ''
  }
}

function extensionFromMime(mime) {
  if (!mime) return 'png'
  if (mime.includes('jpeg') || mime.includes('jpg')) return 'jpg'
  if (mime.includes('webp')) return 'webp'
  if (mime.includes('gif')) return 'gif'
  return 'png'
}

function dateStamp() {
  const d = new Date()
  const pad = (n) => String(n).padStart(2, '0')
  return `${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}-${pad(
    d.getHours()
  )}${pad(d.getMinutes())}`
}

export function imageFilename(mime, index = 1) {
  return `glowup-ai-${dateStamp()}-${index}.${extensionFromMime(mime)}`
}

/**
 * Build a small, browser-safe thumbnail from a generated image URL.
 *
 * Full-resolution provider images are large base64 data URLs that must never be
 * copied into localStorage (see Create.jsx history). This returns a lightweight
 * data URL for same-origin/data images, or the original remote URL unchanged
 * when the image is served over http(s) (storing that string is already small).
 *
 * Returns `null` when the image cannot be decoded or the canvas is tainted
 * (e.g. a cross-origin image without CORS headers), so callers can skip the
 * thumbnail without breaking history. Never throws.
 */
export async function makeThumbnail(url, maxEdge = 256) {
  if (!url || typeof url !== 'string') return null
  if (url.startsWith('http://') || url.startsWith('https://')) {
    return { url }
  }

  return new Promise((resolve) => {
    const img = new Image()
    img.onload = () => {
      try {
        const sourceWidth = img.naturalWidth || img.width
        const sourceHeight = img.naturalHeight || img.height
        if (!sourceWidth || !sourceHeight) {
          resolve(null)
          return
        }
        const scale = Math.min(1, maxEdge / Math.max(sourceWidth, sourceHeight))
        const width = Math.max(1, Math.round(sourceWidth * scale))
        const height = Math.max(1, Math.round(sourceHeight * scale))
        const canvas = document.createElement('canvas')
        canvas.width = width
        canvas.height = height
        const ctx = canvas.getContext('2d')
        if (!ctx) {
          resolve(null)
          return
        }
        ctx.drawImage(img, 0, 0, width, height)
        resolve({
          url: canvas.toDataURL('image/jpeg', 0.72),
          width,
          height,
          mime_type: 'image/jpeg',
          // Explicit marker so the UI can tell a downscaled thumbnail (no
          // full-resolution original available) from a full-resolution image.
          isThumbnail: true,
        })
      } catch {
        // Canvas tainted or encoding unsupported — skip the thumbnail.
        resolve(null)
      }
    }
    img.onerror = () => resolve(null)
    img.src = url
  })
}

/**
 * Trigger a browser download for a generated image.
 * Works for both data URLs (base64) and remote http(s) URLs.
 */
export function downloadImage(src, filename) {
  const a = document.createElement('a')
  a.href = src
  a.download = filename
  if (src.startsWith('http')) {
    a.target = '_blank'
    a.rel = 'noopener noreferrer'
  }
  document.body.appendChild(a)
  a.click()
  a.remove()
}

export async function copyText(text) {
  await navigator.clipboard.writeText(text)
}
