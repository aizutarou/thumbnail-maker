import type { TextItem, BGGradient } from './types'

const KEY = 'thumbnail-maker-autosave'

export interface SavedState {
  texts: TextItem[]
  bgColor: string
  bgGradient: BGGradient | null
  bgOverlay: number
  presetId: string
  savedAt: string
}

export function loadSavedState(): SavedState | null {
  try {
    const raw = localStorage.getItem(KEY)
    if (!raw) return null
    return JSON.parse(raw) as SavedState
  } catch {
    return null
  }
}

export function saveState(state: SavedState): void {
  try {
    localStorage.setItem(KEY, JSON.stringify(state))
  } catch {
    // Storage full or unavailable — fail silently
  }
}

export function clearSavedState(): void {
  try {
    localStorage.removeItem(KEY)
  } catch { /* noop */ }
}

export function formatTimeAgo(isoString: string): string {
  const diff = Date.now() - new Date(isoString).getTime()
  const mins  = Math.floor(diff / 60_000)
  if (mins < 1)  return 'たった今'
  if (mins < 60) return `${mins}分前`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `${hours}時間前`
  return `${Math.floor(hours / 24)}日前`
}
