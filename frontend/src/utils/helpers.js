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
