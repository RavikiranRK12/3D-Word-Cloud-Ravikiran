import type { AnalyzeResponse } from './types'

const API_BASE = 'http://localhost:8000'

export async function analyzeUrl(url: string): Promise<AnalyzeResponse> {
  const res = await fetch(`${API_BASE}/analyze`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ url }),
  })

  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(err.detail ?? `Server error ${res.status}`)
  }

  return res.json()
}
