// Centralized API service for the GlowUp AI backend.
// The backend URL is read from a Vite env var (never contains secrets).

const API_BASE = (import.meta.env.VITE_API_BASE_URL || '').replace(/\/+$/, '')

async function parseError(res) {
  let message = `Request failed (${res.status})`
  try {
    const data = await res.json()
    if (data && typeof data.detail === 'string') {
      message = data.detail
    }
  } catch {
    // keep default message
  }
  return message
}

export async function checkHealth() {
  const res = await fetch(`${API_BASE}/api/health`, { method: 'GET' })
  if (!res.ok) {
    throw new Error('Backend is unreachable')
  }
  return res.json()
}

export async function generateImage(payload) {
  const res = await fetch(`${API_BASE}/api/generate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })
  if (!res.ok) {
    throw new Error(await parseError(res))
  }
  return res.json()
}
