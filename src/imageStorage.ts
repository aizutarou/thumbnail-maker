import type { ImageItem } from './types'

const DB_NAME    = 'thumbnail-maker-db'
const DB_VERSION = 1
const STORE      = 'session'
const KEY        = 'current'
const MAX_BYTES  = 5 * 1024 * 1024 // 5 MB

// ── Open (or create) the IndexedDB database ──────────────────────
function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION)
    req.onupgradeneeded = () => req.result.createObjectStore(STORE)
    req.onsuccess       = () => resolve(req.result)
    req.onerror         = () => reject(req.error)
  })
}

// ── Compress an image dataURL to max 1280px JPEG 80% ─────────────
export function compressImage(dataUrl: string, maxSide = 1280, quality = 0.8): Promise<string> {
  return new Promise(resolve => {
    const img = new window.Image()
    img.onerror = () => resolve(dataUrl) // fallback: use original
    img.onload  = () => {
      let { width, height } = img
      if (width > maxSide || height > maxSide) {
        if (width >= height) {
          height = Math.round(height * maxSide / width)
          width  = maxSide
        } else {
          width  = Math.round(width * maxSide / height)
          height = maxSide
        }
      }
      const canvas = document.createElement('canvas')
      canvas.width  = width
      canvas.height = height
      canvas.getContext('2d')!.drawImage(img, 0, 0, width, height)
      resolve(canvas.toDataURL('image/jpeg', quality))
    }
    img.src = dataUrl
  })
}

// ── Save images to IndexedDB. Returns false if data is too large. ─
export async function saveImagesToDB(images: ImageItem[]): Promise<boolean> {
  try {
    if (images.length === 0) {
      await clearImagesFromDB()
      return true
    }
    // Estimate byte size (base64 len × 0.75 ≈ actual bytes)
    const totalBytes = images.reduce((sum, img) => sum + img.url.length * 0.75, 0)
    if (totalBytes > MAX_BYTES) return false

    const db = await openDB()
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(STORE, 'readwrite')
      tx.objectStore(STORE).put(images, KEY)
      tx.oncomplete = () => resolve()
      tx.onerror    = () => reject(tx.error)
    })
    return true
  } catch {
    return false
  }
}

// ── Load images from IndexedDB ────────────────────────────────────
export async function loadImagesFromDB(): Promise<ImageItem[]> {
  try {
    const db = await openDB()
    return new Promise(resolve => {
      const tx  = db.transaction(STORE, 'readonly')
      const req = tx.objectStore(STORE).get(KEY)
      req.onsuccess = () => resolve((req.result as ImageItem[] | undefined) ?? [])
      req.onerror   = () => resolve([])
    })
  } catch {
    return []
  }
}

// ── Delete saved images from IndexedDB ───────────────────────────
export async function clearImagesFromDB(): Promise<void> {
  try {
    const db = await openDB()
    await new Promise<void>(resolve => {
      const tx = db.transaction(STORE, 'readwrite')
      tx.objectStore(STORE).delete(KEY)
      tx.oncomplete = () => resolve()
      tx.onerror    = () => resolve()
    })
  } catch { /* noop */ }
}
