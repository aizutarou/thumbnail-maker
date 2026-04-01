import { useRef, useState, useEffect, useCallback } from 'react'
import Konva from 'konva'
import { Stage, Layer, Rect, Text, Image as KonvaImage, Transformer } from 'react-konva'
import { getGradientPoints } from './templates'
import type { TextItem, ImageItem, SizePreset, BGGradient, Align, GradientAngle, HistorySnapshot } from './types'
import { loadSavedState, saveState, clearSavedState, formatTimeAgo } from './storage'
import type { SavedState } from './storage'
import { compressImage, saveImagesToDB, loadImagesFromDB, clearImagesFromDB } from './imageStorage'
import './App.css'

// ── Constants ──────────────────────────────────────────────────────
const SIZE_PRESETS: SizePreset[] = [
  { id: 'ogp',     name: 'OGP',       width: 1200, height: 630  },
  { id: 'youtube', name: 'YouTube',   width: 1280, height: 720  },
  { id: 'twitter', name: 'X/Twitter', width: 1200, height: 675  },
  { id: 'note',    name: 'note',      width: 1280, height: 670  },
  { id: 'square',  name: 'Instagram', width: 1080, height: 1080 },
]

const FONT_FAMILIES = [
  'Noto Sans JP',
  'serif',
  'Arial',
  'Georgia',
  'Impact',
  'Courier New',
]

const GRADIENT_ANGLES: { value: GradientAngle; label: string }[] = [
  { value: 'to-bottom-right', label: '斜め（↘）' },
  { value: 'to-right',        label: '横（→）'   },
  { value: 'to-bottom',       label: '縦（↓）'   },
  { value: 'to-bottom-left',  label: '斜め（↙）' },
]

function makeText(preset: SizePreset, overrides: Partial<TextItem> = {}): TextItem {
  return {
    id: `${Date.now()}-${Math.random()}`,
    text: '新しいテキスト',
    x: 60,
    y: 100,
    fontSize: 64,
    color: '#ffffff',
    fontFamily: 'Noto Sans JP',
    bold: false,
    italic: false,
    align: 'left',
    width: preset.width - 120,
    rotation: 0,
    shadowEnabled: false,
    shadowColor: '#000000',
    shadowBlur: 10,
    shadowOffsetX: 3,
    shadowOffsetY: 3,
    outlineWidth: 0,
    outlineColor: '#000000',
    ...overrides,
  }
}

// ── Component ──────────────────────────────────────────────────────
export default function App() {
  const stageRef             = useRef<Konva.Stage>(null)
  const previewRef           = useRef<HTMLDivElement>(null)
  const imageRefs            = useRef<Map<string, Konva.Image>>(new Map())
  const transformerRef       = useRef<Konva.Transformer>(null)
  const loadedImagesRef      = useRef<Map<string, HTMLImageElement>>(new Map())
  const textRefs             = useRef<Map<string, Konva.Text>>(new Map())
  const textTransformerRef   = useRef<Konva.Transformer>(null)

  const [preset,     setPreset]     = useState<SizePreset>(SIZE_PRESETS[0])
  const [bgColor,    setBgColor]    = useState('#1a1a2e')
  const [bgGradient, setBgGradient] = useState<BGGradient | null>(null)
  const [scale,      setScale]      = useState(0.5)

  const [texts,           setTexts]           = useState<TextItem[]>([])
  const [selectedId,      setSelectedId]      = useState<string | null>(null)
  const [images,          setImages]          = useState<ImageItem[]>([])
  const [selectedImageId, setSelectedImageId] = useState<string | null>(null)
  const [pendingImages,   setPendingImages]   = useState<ImageItem[]>([])
  // Force re-render when a new HTMLImageElement finishes loading
  const [, forceUpdate] = useState(0)
  const imagesSaveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // ── Auto-save & Restore ──
  type SaveStatus = 'idle' | 'saving' | 'saved'
  const [saveStatus,  setSaveStatus]  = useState<SaveStatus>('idle')
  const [restoreData, setRestoreData] = useState<SavedState | null>(null)
  const saveTimerRef  = useRef<ReturnType<typeof setTimeout> | null>(null)
  const savedTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    const saved = loadSavedState()
    if (saved) {
      setRestoreData(saved)
      loadImagesFromDB().then(setPendingImages)
    }
  }, [])

  useEffect(() => {
    if (saveTimerRef.current)  clearTimeout(saveTimerRef.current)
    if (savedTimerRef.current) clearTimeout(savedTimerRef.current)
    setSaveStatus('saving')
    saveTimerRef.current = setTimeout(() => {
      saveState({ texts, bgColor, bgGradient, presetId: preset.id, savedAt: new Date().toISOString() })
      setSaveStatus('saved')
      savedTimerRef.current = setTimeout(() => setSaveStatus('idle'), 2500)
    }, 1500)
    return () => {
      if (saveTimerRef.current)  clearTimeout(saveTimerRef.current)
      if (savedTimerRef.current) clearTimeout(savedTimerRef.current)
    }
  }, [texts, bgColor, bgGradient, preset.id]) // eslint-disable-line react-hooks/exhaustive-deps

  // ── Debounce-save images to IndexedDB ──
  useEffect(() => {
    if (imagesSaveTimerRef.current) clearTimeout(imagesSaveTimerRef.current)
    imagesSaveTimerRef.current = setTimeout(() => {
      saveImagesToDB(images)
    }, 1500)
    return () => {
      if (imagesSaveTimerRef.current) clearTimeout(imagesSaveTimerRef.current)
    }
  }, [images]) // eslint-disable-line react-hooks/exhaustive-deps

  // ── Force-save on page close / reload (timers may still be pending) ──
  useEffect(() => {
    const handler = () => {
      saveState({ texts, bgColor, bgGradient, presetId: preset.id, savedAt: new Date().toISOString() })
      saveImagesToDB(images) // async fire-and-forget; browser usually completes IDB writes
    }
    window.addEventListener('beforeunload', handler)
    return () => window.removeEventListener('beforeunload', handler)
  }, [texts, bgColor, bgGradient, preset.id, images]) // eslint-disable-line react-hooks/exhaustive-deps

  const handleRestore = () => {
    if (!restoreData) return
    const p = SIZE_PRESETS.find(p => p.id === restoreData.presetId) ?? SIZE_PRESETS[0]
    setPreset(p)
    setBgColor(restoreData.bgColor)
    setBgGradient(restoreData.bgGradient)
    setTexts(restoreData.texts)
    // Restore images: load each URL into an HTMLImageElement then add to state
    pendingImages.forEach(img => {
      const el = new window.Image()
      el.onload = () => {
        loadedImagesRef.current.set(img.id, el)
        setImages(prev => prev.find(i => i.id === img.id) ? prev : [...prev, img])
        forceUpdate(n => n + 1)
      }
      el.src = img.url
    })
    setRestoreData(null)
    setPendingImages([])
  }

  const handleDismissRestore = () => {
    clearSavedState()
    clearImagesFromDB()
    setRestoreData(null)
    setPendingImages([])
  }

  // ── History (Undo / Redo) ──
  const MAX_HISTORY = 40
  const [historyPast,   setHistoryPast]   = useState<HistorySnapshot[]>([])
  const [historyFuture, setHistoryFuture] = useState<HistorySnapshot[]>([])
  const canUndo = historyPast.length > 0
  const canRedo = historyFuture.length > 0

  const captureSnapshot = useCallback((): HistorySnapshot => ({
    texts: JSON.parse(JSON.stringify(texts)),
    bgColor,
    bgGradient: bgGradient ? { ...bgGradient } : null,
  }), [texts, bgColor, bgGradient])

  const recordHistory = useCallback(() => {
    const snap = captureSnapshot()
    setHistoryPast(p => [...p.slice(-(MAX_HISTORY - 1)), snap])
    setHistoryFuture([])
  }, [captureSnapshot])

  const restoreSnapshot = (snap: HistorySnapshot) => {
    setTexts(snap.texts)
    setBgColor(snap.bgColor)
    setBgGradient(snap.bgGradient)
  }

  const handleUndo = useCallback(() => {
    if (historyPast.length === 0) return
    const prev = historyPast[historyPast.length - 1]
    const cur  = captureSnapshot()
    setHistoryPast(p => p.slice(0, -1))
    setHistoryFuture(f => [cur, ...f])
    restoreSnapshot(prev)
  }, [historyPast, captureSnapshot])

  const handleRedo = useCallback(() => {
    if (historyFuture.length === 0) return
    const next = historyFuture[0]
    const cur  = captureSnapshot()
    setHistoryFuture(f => f.slice(1))
    setHistoryPast(p => [...p, cur])
    restoreSnapshot(next)
  }, [historyFuture, captureSnapshot])

  // ── Keyboard shortcuts: Cmd/Ctrl+Z / Cmd/Ctrl+Shift+Z ──
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const mod = e.metaKey || e.ctrlKey
      if (!mod) return
      if (e.key === 'z' && !e.shiftKey) { e.preventDefault(); handleUndo() }
      if ((e.key === 'z' && e.shiftKey) || e.key === 'y') { e.preventDefault(); handleRedo() }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [handleUndo, handleRedo])

  // ── Scale canvas to fit container ──
  const updateScale = useCallback(() => {
    if (!previewRef.current) return
    const pw = previewRef.current.clientWidth  - 48
    const ph = previewRef.current.clientHeight - 48
    setScale(Math.min(pw / preset.width, ph / preset.height, 1))
  }, [preset])

  useEffect(() => {
    updateScale()
    window.addEventListener('resize', updateScale)
    return () => window.removeEventListener('resize', updateScale)
  }, [updateScale])

  // ── Attach transformer to selected image ──
  useEffect(() => {
    if (!transformerRef.current) return
    const node = imageRefs.current.get(selectedImageId ?? '')
    transformerRef.current.nodes(node ? [node] : [])
    transformerRef.current.getLayer()?.batchDraw()
  }, [selectedImageId])

  // ── Attach transformer to selected text ──
  useEffect(() => {
    if (!textTransformerRef.current) return
    const node = textRefs.current.get(selectedId ?? '')
    textTransformerRef.current.nodes(node ? [node] : [])
    textTransformerRef.current.getLayer()?.batchDraw()
  }, [selectedId])

  // ── Text helpers ──
  const updateText = (id: string, patch: Partial<TextItem>) => {
    recordHistory()
    setTexts(prev => prev.map(t => t.id === id ? { ...t, ...patch } : t))
  }

  const addText = () => {
    recordHistory()
    const item = makeText(preset, { y: 80 + texts.length * 90 })
    setTexts(prev => [...prev, item])
    setSelectedId(item.id)
    setSelectedImageId(null)
  }

  const removeText = (id: string) => {
    recordHistory()
    setTexts(prev => prev.filter(t => t.id !== id))
    if (selectedId === id) setSelectedId(null)
  }

  const duplicateText = (id: string) => {
    recordHistory()
    const src = texts.find(t => t.id === id)
    if (!src) return
    const copy: TextItem = {
      ...src,
      id: `${Date.now()}-${Math.random()}`,
      x: src.x + 20,
      y: src.y + 20,
    }
    setTexts(prev => [...prev, copy])
    setSelectedId(copy.id)
    setSelectedImageId(null)
  }

  // ── Image helpers ──
  const addImage = (file: File) => {
    const reader = new FileReader()
    reader.onload = ev => {
      const originalUrl = ev.target?.result as string
      // Load original to get dimensions for initial placement
      const orig = new window.Image()
      orig.onload = async () => {
        const maxW = preset.width  * 0.6
        const maxH = preset.height * 0.6
        const s = Math.min(maxW / orig.width, maxH / orig.height, 1)
        // Compress to max 1280px JPEG-80 for both rendering and storage
        const compressedUrl = await compressImage(originalUrl)
        const el = new window.Image()
        el.onload = () => {
          const item: ImageItem = {
            id: `img-${Date.now()}`,
            url: compressedUrl,
            x: Math.round((preset.width  - orig.width  * s) / 2),
            y: Math.round((preset.height - orig.height * s) / 2),
          width:   Math.round(orig.width  * s),
          height:  Math.round(orig.height * s),
          opacity:  1,
          rotation: 0,
          }
          loadedImagesRef.current.set(item.id, el)
          setImages(prev => [...prev, item])
          setSelectedImageId(item.id)
          setSelectedId(null)
          forceUpdate(n => n + 1)
        }
        el.src = compressedUrl
      }
      orig.src = originalUrl
    }
    reader.readAsDataURL(file)
  }

  const removeImage = (id: string) => {
    loadedImagesRef.current.delete(id)
    imageRefs.current.delete(id)
    setImages(prev => prev.filter(img => img.id !== id))
    if (selectedImageId === id) setSelectedImageId(null)
  }

  const updateImage = (id: string, patch: Partial<ImageItem>) => {
    setImages(prev => prev.map(img => img.id === id ? { ...img, ...patch } : img))
  }

  // ── Preset change ──
  const handlePresetChange = (id: string) => {
    recordHistory()
    const next = SIZE_PRESETS.find(p => p.id === id)!
    setPreset(next)
    setTexts(prev => prev.map(t => ({ ...t, width: next.width - 120 })))
  }

  // ── Share on X ──
  const handleShare = () => {
    const text = encodeURIComponent('サムネイルメーカーで画像を作りました！登録不要・無料で使えます🖼')
    const url  = encodeURIComponent('https://thumbnail-maker.aizutarou1008.workers.dev')
    const tags = encodeURIComponent('サムネイルメーカー,無料ツール')
    window.open(`https://twitter.com/intent/tweet?text=${text}&url=${url}&hashtags=${tags}`, '_blank', 'noopener')
  }

  // ── PNG Download (deselect first to hide transformer handles) ──
  const handleDownload = () => {
    if (!stageRef.current) return
    const prevTextId  = selectedId
    const prevImageId = selectedImageId
    setSelectedId(null)
    setSelectedImageId(null)
    setTimeout(() => {
      const uri = stageRef.current!.toDataURL({ pixelRatio: 2 / scale })
      const a = document.createElement('a')
      a.download = `thumbnail-${preset.id}.png`
      a.href = uri
      a.click()
      setSelectedId(prevTextId)
      setSelectedImageId(prevImageId)
    }, 50)
  }

  // ── fontStyle string for Konva ──
  const fontStyle = (t: TextItem) => {
    if (t.bold && t.italic) return 'bold italic'
    if (t.bold)   return 'bold'
    if (t.italic) return 'italic'
    return 'normal'
  }

  // ── Background rendering ──
  const renderBackground = () => {
    if (bgGradient) {
      const pts = getGradientPoints(bgGradient.angle, preset.width, preset.height)
      return (
        <Rect
          x={0} y={0}
          width={preset.width}
          height={preset.height}
          fillLinearGradientStartPoint={pts.start}
          fillLinearGradientEndPoint={pts.end}
          fillLinearGradientColorStops={[0, bgGradient.from, 1, bgGradient.to]}
        />
      )
    }
    return (
      <Rect
        x={0} y={0}
        width={preset.width}
        height={preset.height}
        fill={bgColor}
      />
    )
  }

  return (
    <div className="app">

      {/* ── Header ── */}
      <header className="header">
        <div className="header-logo">
          <span className="header-icon">🖼</span>
          <h1>サムネイルメーカー</h1>
        </div>
        <p className="header-sub">OGP・YouTube・X対応の無料画像作成ツール — 登録不要</p>
        <div className="header-actions">
          {saveStatus === 'saving' && <span className="save-indicator saving">保存中…</span>}
          {saveStatus === 'saved'  && <span className="save-indicator saved">✓ 保存済み</span>}
          <button
            className="btn-undoredo"
            onClick={handleUndo}
            disabled={!canUndo}
            title="元に戻す (⌘Z)"
          >↩</button>
          <button
            className="btn-undoredo"
            onClick={handleRedo}
            disabled={!canRedo}
            title="やり直す (⌘⇧Z)"
          >↪</button>
        </div>
      </header>

      {/* ── Restore Banner ── */}
      {restoreData && (
        <div className="restore-banner">
          <span className="restore-msg">
            💾 {formatTimeAgo(restoreData.savedAt)}の作業が見つかりました
            {(restoreData.texts.length > 0 || pendingImages.length > 0) && (
              <span className="restore-detail">
                （テキスト {restoreData.texts.length} 件
                {pendingImages.length > 0 && `・画像 ${pendingImages.length} 枚`}）
              </span>
            )}
          </span>
          <button className="btn-restore" onClick={handleRestore}>復元する</button>
          <button className="btn-dismiss" onClick={handleDismissRestore}>新しく始める</button>
        </div>
      )}

      <div className="workspace">

        {/* ── Control Panel ── */}
        <aside className="control-panel">

          {/* Background */}
          <section className="panel-section s-bg">
            <h2>背景</h2>

            <div className="control-row">
              <label>種類</label>
              <div className="bg-type-group">
                <button
                  className={`btn-toggle ${!bgGradient ? 'active' : ''}`}
                  onClick={() => setBgGradient(null)}
                >単色</button>
                <button
                  className={`btn-toggle ${!!bgGradient ? 'active' : ''}`}
                  onClick={() => {
                    if (!bgGradient) setBgGradient({ from: bgColor, to: '#7c3aed', angle: 'to-bottom-right' })
                  }}
                >グラデーション</button>
              </div>
            </div>

            {!bgGradient && (
              <div className="control-row">
                <label>背景色</label>
                <input
                  type="color"
                  className="color-input"
                  value={bgColor}
                  onChange={e => setBgColor(e.target.value)}
                />
                <span className="color-value">{bgColor}</span>
              </div>
            )}

            {bgGradient && (
              <div className="gradient-controls">
                <div className="control-row">
                  <label>開始色</label>
                  <input
                    type="color"
                    className="color-input"
                    value={bgGradient.from}
                    onChange={e => setBgGradient({ ...bgGradient, from: e.target.value })}
                  />
                  <span className="color-value">{bgGradient.from}</span>
                </div>
                <div className="control-row">
                  <label>終了色</label>
                  <input
                    type="color"
                    className="color-input"
                    value={bgGradient.to}
                    onChange={e => setBgGradient({ ...bgGradient, to: e.target.value })}
                  />
                  <span className="color-value">{bgGradient.to}</span>
                </div>
                <div className="control-row">
                  <label>方向</label>
                  <select
                    className="select select-sm"
                    value={bgGradient.angle}
                    onChange={e => setBgGradient({ ...bgGradient, angle: e.target.value as GradientAngle })}
                  >
                    {GRADIENT_ANGLES.map(a => (
                      <option key={a.value} value={a.value}>{a.label}</option>
                    ))}
                  </select>
                </div>
              </div>
            )}
          </section>

          {/* Images */}
          <section className="panel-section s-images">
            <div className="section-header">
              <h2>画像</h2>
              <label className="btn-small btn-primary file-upload-btn">
                ＋ 追加
                <input
                  type="file"
                  accept="image/*"
                  style={{ display: 'none' }}
                  onChange={e => {
                    const file = e.target.files?.[0]
                    if (file) addImage(file)
                    e.target.value = ''
                  }}
                />
              </label>
            </div>

            {images.length === 0 && (
              <p className="empty-hint">画像をアップロードすると<br />キャンバス上に配置できます</p>
            )}

            <div className="image-list">
              {images.map((img, idx) => (
                <div
                  key={img.id}
                  className={`image-accordion ${selectedImageId === img.id ? 'open' : ''}`}
                >
                  <div
                    className="image-accordion-header"
                    onClick={() => {
                      setSelectedImageId(selectedImageId === img.id ? null : img.id)
                      setSelectedId(null)
                    }}
                  >
                    <span className="accordion-arrow">{selectedImageId === img.id ? '▼' : '▶'}</span>
                    <span className="image-thumb-label">画像 {idx + 1}</span>
                    <button
                      className="btn-icon btn-danger"
                      title="削除"
                      onClick={e => { e.stopPropagation(); removeImage(img.id) }}
                    >✕</button>
                  </div>

                  {selectedImageId === img.id && (
                    <div className="image-accordion-body">
                      <div className="control-row">
                        <label>不透明度</label>
                        <input
                          type="range"
                          className="range"
                          min={0.1} max={1} step={0.05}
                          value={img.opacity}
                          onChange={e => updateImage(img.id, { opacity: Number(e.target.value) })}
                        />
                        <span className="value-badge">{Math.round(img.opacity * 100)}%</span>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </section>

          {/* Text */}
          <section className="panel-section s-text">
            <div className="section-header">
              <h2>テキスト</h2>
              <button className="btn-small btn-primary" onClick={addText}>＋ 追加</button>
            </div>
            <div className="text-list">
              {texts.map(t => (
                <div key={t.id} className={`text-accordion ${selectedId === t.id ? 'open' : ''}`}>

                  <div
                    className="text-accordion-header"
                    onClick={() => {
                      setSelectedId(selectedId === t.id ? null : t.id)
                      setSelectedImageId(null)
                    }}
                  >
                    <span className="accordion-arrow">{selectedId === t.id ? '▼' : '▶'}</span>
                    <span className="text-preview">
                      {t.text.slice(0, 15)}{t.text.length > 15 ? '…' : ''}
                    </span>
                    <button
                      className="btn-icon btn-duplicate"
                      title="複製"
                      onClick={e => { e.stopPropagation(); duplicateText(t.id) }}
                    >⧉</button>
                    <button
                      className="btn-icon btn-danger"
                      title="削除"
                      onClick={e => { e.stopPropagation(); removeText(t.id) }}
                    >✕</button>
                  </div>

                  {selectedId === t.id && (
                    <div className="text-accordion-body">

                      <div className="control-col">
                        <label>テキスト内容</label>
                        <textarea
                          className="textarea"
                          rows={3}
                          value={t.text}
                          onChange={e => updateText(t.id, { text: e.target.value })}
                        />
                      </div>

                      <div className="control-row">
                        <label>フォント</label>
                        <select
                          className="select select-sm"
                          value={t.fontFamily}
                          onChange={e => updateText(t.id, { fontFamily: e.target.value })}
                        >
                          {FONT_FAMILIES.map(f => (
                            <option key={f} value={f}>{f}</option>
                          ))}
                        </select>
                      </div>

                      <div className="control-row">
                        <label>サイズ</label>
                        <input
                          type="range"
                          className="range"
                          min={12} max={200}
                          value={t.fontSize}
                          onChange={e => updateText(t.id, { fontSize: Number(e.target.value) })}
                        />
                        <span className="value-badge">{t.fontSize}px</span>
                      </div>

                      <div className="control-row">
                        <label>色</label>
                        <input
                          type="color"
                          className="color-input"
                          value={t.color}
                          onChange={e => updateText(t.id, { color: e.target.value })}
                        />
                        <span className="color-value">{t.color}</span>
                      </div>

                      <div className="control-row">
                        <label>スタイル</label>
                        <button
                          className={`btn-toggle ${t.bold ? 'active' : ''}`}
                          style={{ fontWeight: 700 }}
                          onClick={() => updateText(t.id, { bold: !t.bold })}
                        >B</button>
                        <button
                          className={`btn-toggle ${t.italic ? 'active' : ''}`}
                          style={{ fontStyle: 'italic' }}
                          onClick={() => updateText(t.id, { italic: !t.italic })}
                        >I</button>
                      </div>

                      <div className="control-row">
                        <label>揃え</label>
                        {(['left', 'center', 'right'] as Align[]).map(a => (
                          <button
                            key={a}
                            className={`btn-toggle ${t.align === a ? 'active' : ''}`}
                            onClick={() => updateText(t.id, { align: a })}
                          >
                            {a === 'left' ? '左' : a === 'center' ? '中' : '右'}
                          </button>
                        ))}
                      </div>

                      <div className="control-row">
                        <label>影</label>
                        <button
                          className={`btn-toggle ${t.shadowEnabled ? 'active' : ''}`}
                          onClick={() => updateText(t.id, { shadowEnabled: !t.shadowEnabled })}
                        >{t.shadowEnabled ? 'ON' : 'OFF'}</button>
                        {t.shadowEnabled && (
                          <input
                            type="color"
                            className="color-input"
                            value={t.shadowColor}
                            onChange={e => updateText(t.id, { shadowColor: e.target.value })}
                            title="影の色"
                          />
                        )}
                      </div>
                      {t.shadowEnabled && (
                        <div className="control-row">
                          <label>影強度</label>
                          <input
                            type="range"
                            className="range"
                            min={0} max={40}
                            value={t.shadowBlur}
                            onChange={e => updateText(t.id, { shadowBlur: Number(e.target.value) })}
                          />
                          <span className="value-badge">{t.shadowBlur}</span>
                        </div>
                      )}

                      <div className="control-row">
                        <label>縁取り</label>
                        <input
                          type="color"
                          className="color-input"
                          value={t.outlineColor}
                          onChange={e => updateText(t.id, { outlineColor: e.target.value })}
                          title="縁取りの色"
                        />
                        <input
                          type="range"
                          className="range"
                          min={0} max={20}
                          value={t.outlineWidth}
                          onChange={e => updateText(t.id, { outlineWidth: Number(e.target.value) })}
                        />
                        <span className="value-badge">{t.outlineWidth}px</span>
                      </div>

                    </div>
                  )}
                </div>
              ))}
            </div>
          </section>

        </aside>

        {/* ── Right: Canvas + Export ── */}
        <div className="canvas-column">

          <main className="preview-area" ref={previewRef}>
            <div
              className="canvas-wrapper"
              style={{ width: preset.width * scale, height: preset.height * scale }}
            >
              <Stage
                ref={stageRef}
                width={preset.width * scale}
                height={preset.height * scale}
                scaleX={scale}
                scaleY={scale}
                onMouseDown={e => {
                  if (e.target === e.target.getStage()) {
                    setSelectedId(null)
                    setSelectedImageId(null)
                  }
                }}
              >
                <Layer>
                  {renderBackground()}

                  {/* Image objects — rendered below text */}
                  {images.map(img => {
                    const el = loadedImagesRef.current.get(img.id)
                    if (!el) return null
                    return (
                      <KonvaImage
                        key={img.id}
                        ref={node => {
                          if (node) imageRefs.current.set(img.id, node)
                          else imageRefs.current.delete(img.id)
                        }}
                        image={el}
                        x={img.x}
                        y={img.y}
                        width={img.width}
                        height={img.height}
                        opacity={img.opacity}
                        rotation={img.rotation ?? 0}
                        draggable
                        onClick={() => { setSelectedImageId(img.id); setSelectedId(null) }}
                        onTap={() => { setSelectedImageId(img.id); setSelectedId(null) }}
                        onDragEnd={e => updateImage(img.id, { x: e.target.x(), y: e.target.y() })}
                        onTransformEnd={() => {
                          const node = imageRefs.current.get(img.id)
                          if (!node) return
                          updateImage(img.id, {
                            x:        node.x(),
                            y:        node.y(),
                            width:    Math.abs(node.width()  * node.scaleX()),
                            height:   Math.abs(node.height() * node.scaleY()),
                            rotation: node.rotation(),
                          })
                          node.scaleX(1)
                          node.scaleY(1)
                        }}
                      />
                    )
                  })}

                  {/* Text objects */}
                  {texts.map(t => (
                    <Text
                      key={t.id}
                      id={t.id}
                      ref={node => {
                        if (node) textRefs.current.set(t.id, node)
                        else textRefs.current.delete(t.id)
                      }}
                      text={t.text}
                      x={t.x}
                      y={t.y}
                      width={t.width}
                      fontSize={t.fontSize}
                      fill={t.color}
                      fontFamily={t.fontFamily}
                      fontStyle={fontStyle(t)}
                      align={t.align}
                      lineHeight={1.3}
                      rotation={t.rotation ?? 0}
                      draggable
                      onClick={() => { setSelectedId(t.id); setSelectedImageId(null) }}
                      onTap={() => { setSelectedId(t.id); setSelectedImageId(null) }}
                      onDragEnd={e => updateText(t.id, { x: e.target.x(), y: e.target.y() })}
                      onTransformEnd={() => {
                        const node = textRefs.current.get(t.id)
                        if (!node) return
                        const newWidth = Math.max(80, Math.abs(node.width() * node.scaleX()))
                        updateText(t.id, { x: node.x(), y: node.y(), width: newWidth, rotation: node.rotation() })
                        node.scaleX(1)
                        node.scaleY(1)
                      }}
                      shadowEnabled={t.shadowEnabled}
                      shadowColor={t.shadowEnabled ? t.shadowColor : '#000000'}
                      shadowBlur={t.shadowEnabled ? t.shadowBlur : 0}
                      shadowOffsetX={t.shadowEnabled ? t.shadowOffsetX : 0}
                      shadowOffsetY={t.shadowEnabled ? t.shadowOffsetY : 0}
                      shadowOpacity={t.shadowEnabled ? 0.85 : 0}
                      stroke={t.outlineWidth > 0 ? t.outlineColor : undefined}
                      strokeWidth={t.outlineWidth > 0 ? t.outlineWidth : 0}
                      fillAfterStrokeEnabled={t.outlineWidth > 0}
                    />
                  ))}

                  {/* Transformer for image objects */}
                  <Transformer
                    ref={transformerRef}
                    rotateEnabled={true}
                    keepRatio={false}
                    boundBoxFunc={(oldBox, newBox) => {
                      if (newBox.width < 20 || newBox.height < 20) return oldBox
                      return newBox
                    }}
                  />
                  {/* Transformer for text objects — width resize + rotation */}
                  <Transformer
                    ref={textTransformerRef}
                    rotateEnabled={true}
                    enabledAnchors={['middle-left', 'middle-right']}
                    boundBoxFunc={(oldBox, newBox) => {
                      if (newBox.width < 80) return oldBox
                      return newBox
                    }}
                  />
                </Layer>
              </Stage>
            </div>
            <p className="canvas-hint">テキスト・画像はドラッグで移動 • 画像は角をドラッグでリサイズ</p>
          </main>

          {/* ── Export Bar ── */}
          <div className="export-bar">
            <div className="size-presets">
              {SIZE_PRESETS.map(p => (
                <button
                  key={p.id}
                  className={`size-preset-btn ${preset.id === p.id ? 'active' : ''}`}
                  onClick={() => handlePresetChange(p.id)}
                >
                  <span className="size-preset-name">{p.name.split(/\s+/)[0]}</span>
                  <span className="size-preset-dim">{p.width}×{p.height}</span>
                </button>
              ))}
            </div>
            <div className="export-actions">
              <button className="btn-download" onClick={handleDownload}>
                ⬇ PNG でダウンロード
              </button>
              <button className="btn-share" onClick={handleShare}>
                𝕏 でシェアする
              </button>
            </div>
          </div>

        </div>{/* /canvas-column */}

      </div>

      {/* ── Footer ── */}
      <footer className="app-footer">
        <a href="/privacy.html" target="_blank" rel="noopener">プライバシーポリシー</a>
        <span className="footer-sep">|</span>
        <span>&copy; 2026 サムネイルメーカー</span>
      </footer>

    </div>
  )
}
