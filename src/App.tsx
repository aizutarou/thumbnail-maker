import { useRef, useState, useEffect, useCallback } from 'react'
import Konva from 'konva'
import { Stage, Layer, Rect, Text, Image as KonvaImage } from 'react-konva'
import { TEMPLATES, applyTemplate, getGradientPoints } from './templates'
import type { TextItem, SizePreset, BGGradient, Align, MobileTab, GradientAngle, HistorySnapshot } from './types'
import { loadSavedState, saveState, clearSavedState, formatTimeAgo } from './storage'
import type { SavedState } from './storage'
import './App.css'

// ── Constants ──────────────────────────────────────────────────────
const SIZE_PRESETS: SizePreset[] = [
  { id: 'ogp',     name: 'OGP          1200×630',  width: 1200, height: 630  },
  { id: 'youtube', name: 'YouTube      1280×720',  width: 1280, height: 720  },
  { id: 'twitter', name: 'X/Twitter   1200×675',  width: 1200, height: 675  },
  { id: 'note',    name: 'note         1280×670',  width: 1280, height: 670  },
  { id: 'square',  name: 'Instagram    1080×1080', width: 1080, height: 1080 },
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

const MOBILE_TABS: { id: MobileTab; label: string; icon: string }[] = [
  { id: 'template', label: 'レイアウト', icon: '🎨' },
  { id: 'bg',       label: '背景',     icon: '🖼'  },
  { id: 'text',     label: 'テキスト', icon: 'T'  },
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
  const stageRef   = useRef<Konva.Stage>(null)
  const previewRef = useRef<HTMLDivElement>(null)

  const [preset,     setPreset]     = useState<SizePreset>(SIZE_PRESETS[0])
  const [bgColor,    setBgColor]    = useState('#1a1a2e')
  const [bgGradient, setBgGradient] = useState<BGGradient | null>(null)
  const [bgImage,    setBgImage]    = useState<HTMLImageElement | null>(null)
  const [bgImageUrl, setBgImageUrl] = useState<string | null>(null)
  const [bgOverlay,  setBgOverlay]  = useState(0)
  const [scale,      setScale]      = useState(0.5)
  const [mobileTab,  setMobileTab]  = useState<MobileTab>('template')
  const [activeTemplate, setActiveTemplate] = useState<string | null>(null)

  const [texts,      setTexts]      = useState<TextItem[]>(() => {
    const result = applyTemplate(TEMPLATES[0], SIZE_PRESETS[0])
    return result.texts
  })
  const [selectedId, setSelectedId] = useState<string | null>(null)

  // ── Auto-save & Restore ──
  type SaveStatus = 'idle' | 'saving' | 'saved'
  const [saveStatus,        setSaveStatus]        = useState<SaveStatus>('idle')
  const [restoreData,       setRestoreData]       = useState<SavedState | null>(null)
  const saveTimerRef  = useRef<ReturnType<typeof setTimeout> | null>(null)
  const savedTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Check for saved state on mount
  useEffect(() => {
    const saved = loadSavedState()
    if (saved) setRestoreData(saved)
  }, [])

  // Debounced auto-save (1.5s after last change)
  useEffect(() => {
    if (saveTimerRef.current)  clearTimeout(saveTimerRef.current)
    if (savedTimerRef.current) clearTimeout(savedTimerRef.current)
    setSaveStatus('saving')
    saveTimerRef.current = setTimeout(() => {
      saveState({ texts, bgColor, bgGradient, bgOverlay, presetId: preset.id, savedAt: new Date().toISOString() })
      setSaveStatus('saved')
      savedTimerRef.current = setTimeout(() => setSaveStatus('idle'), 2500)
    }, 1500)
    return () => {
      if (saveTimerRef.current)  clearTimeout(saveTimerRef.current)
      if (savedTimerRef.current) clearTimeout(savedTimerRef.current)
    }
  }, [texts, bgColor, bgGradient, preset.id]) // eslint-disable-line react-hooks/exhaustive-deps

  const handleRestore = () => {
    if (!restoreData) return
    const p = SIZE_PRESETS.find(p => p.id === restoreData.presetId) ?? SIZE_PRESETS[0]
    setPreset(p)
    setBgColor(restoreData.bgColor)
    setBgGradient(restoreData.bgGradient)
    setBgOverlay(restoreData.bgOverlay ?? 0)
    setTexts(restoreData.texts)
    setBgImageUrl(null)
    setRestoreData(null)
  }

  const handleDismissRestore = () => {
    clearSavedState()
    setRestoreData(null)
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
    bgImageUrl,
    bgOverlay,
  }), [texts, bgColor, bgGradient, bgImageUrl, bgOverlay])

  const recordHistory = useCallback(() => {
    const snap = captureSnapshot()
    setHistoryPast(p => [...p.slice(-(MAX_HISTORY - 1)), snap])
    setHistoryFuture([])
  }, [captureSnapshot])

  const restoreSnapshot = (snap: HistorySnapshot) => {
    setTexts(snap.texts)
    setBgColor(snap.bgColor)
    setBgGradient(snap.bgGradient)
    setBgImageUrl(snap.bgImageUrl)
    setBgOverlay(snap.bgOverlay ?? 0)
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

  // ── bgImageUrl → HTMLImageElement ──
  useEffect(() => {
    if (!bgImageUrl) { setBgImage(null); return }
    const img = new window.Image()
    img.onload = () => setBgImage(img)
    img.src = bgImageUrl
  }, [bgImageUrl])

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

  // ── Derived ──
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
  }


  // ── Preset change ──
  const handlePresetChange = (id: string) => {
    recordHistory()
    const next = SIZE_PRESETS.find(p => p.id === id)!
    setPreset(next)
    setBgImageUrl(null)
    setTexts(prev => prev.map(t => ({ ...t, width: next.width - 120 })))
  }

  // ── Template apply (layout only — background is preserved) ──
  const handleApplyTemplate = (templateId: string) => {
    recordHistory()
    const tmpl = TEMPLATES.find(t => t.id === templateId)!
    const result = applyTemplate(tmpl, preset)
    setTexts(result.texts)
    setSelectedId(null)
    setActiveTemplate(templateId)
  }

  // ── Background image upload ──
  const handleBgUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = ev => {
      recordHistory()
      setBgImageUrl(ev.target?.result as string)
      setBgGradient(null)
    }
    reader.readAsDataURL(file)
    e.target.value = ''
  }

  // ── Share on X ──
  const handleShare = () => {
    const text = encodeURIComponent('サムネイルメーカーで画像を作りました！登録不要・無料で使えます🖼')
    const url  = encodeURIComponent('https://thumbnail-maker.aizutarou1008.workers.dev')
    const tags = encodeURIComponent('サムネイルメーカー,無料ツール')
    window.open(`https://twitter.com/intent/tweet?text=${text}&url=${url}&hashtags=${tags}`, '_blank', 'noopener')
  }

  // ── PNG Download ──
  const handleDownload = () => {
    if (!stageRef.current) return
    const uri = stageRef.current.toDataURL({ pixelRatio: 2 / scale })
    const a = document.createElement('a')
    a.download = `thumbnail-${preset.id}.png`
    a.href = uri
    a.click()
  }

  // ── fontStyle string for Konva ──
  const fontStyle = (t: TextItem) => {
    if (t.bold && t.italic) return 'bold italic'
    if (t.bold)   return 'bold'
    if (t.italic) return 'italic'
    return 'normal'
  }

  // ── Gradient background rendering ──
  const renderBackground = () => {
    if (bgImage) {
      return (
        <>
          <KonvaImage
            image={bgImage}
            x={0} y={0}
            width={preset.width}
            height={preset.height}
          />
          {bgOverlay > 0 && (
            <Rect
              x={0} y={0}
              width={preset.width}
              height={preset.height}
              fill="#000000"
              opacity={bgOverlay / 100}
              listening={false}
            />
          )}
        </>
      )
    }
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
          </span>
          <button className="btn-restore" onClick={handleRestore}>復元する</button>
          <button className="btn-dismiss" onClick={handleDismissRestore}>新しく始める</button>
        </div>
      )}

      <div className="workspace">

        {/* ── Mobile Tab Bar ── */}
        <nav className="mobile-tabs">
          {MOBILE_TABS.map(tab => (
            <button
              key={tab.id}
              className={`mobile-tab ${mobileTab === tab.id ? 'active' : ''}`}
              onClick={() => setMobileTab(tab.id)}
            >
              <span className="mobile-tab-icon">{tab.icon}</span>
              <span className="mobile-tab-label">{tab.label}</span>
            </button>
          ))}
        </nav>

        {/* ── Left Control Panel ── */}
        <aside className="control-panel" data-tab={mobileTab}>

          {/* Template Gallery */}
          <section className="panel-section s-template">
            <div className="section-header">
              <h2>レイアウト</h2>
            </div>
            <p className="section-note">テキストの配置のみ適用。背景はそのまま保持されます。</p>
            <div className="tmpl-grid">
              {TEMPLATES.map(t => (
                <button
                  key={t.id}
                  className={`tmpl-card ${activeTemplate === t.id ? 'active' : ''}`}
                  onClick={() => handleApplyTemplate(t.id)}
                  title={t.name}
                >
                  <div className="tmpl-thumb">
                    {t.texts.map((txt, i) => (
                      <div
                        key={i}
                        className="tmpl-line"
                        style={{
                          top:    `${txt.yRatio * 100}%`,
                          left:   txt.align === 'right' ? 'auto' : `${txt.xRatio * 100}%`,
                          right:  txt.align === 'right' ? `${txt.xRatio * 100}%` : 'auto',
                          width:  `${txt.widthRatio * (txt.align === 'center' ? 68 : 78)}%`,
                          height: i === 0 ? '13%' : '8%',
                          background: i === 0 ? '#334155cc' : i === 1 ? '#94a3b8bb' : '#cbd5e177',
                        }}
                      />
                    ))}
                  </div>
                  <span className="tmpl-name">{t.name}</span>
                </button>
              ))}
            </div>
          </section>

          {/* Size Preset */}
          <section className="panel-section s-bg">
            <h2>サイズ</h2>
            <select
              className="select"
              value={preset.id}
              onChange={e => handlePresetChange(e.target.value)}
            >
              {SIZE_PRESETS.map(p => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
          </section>

          {/* Background */}
          <section className="panel-section s-bg">
            <h2>背景</h2>

            {/* Type toggle */}
            <div className="control-row">
              <label>種類</label>
              <div className="bg-type-group">
                <button
                  className={`btn-toggle ${!bgGradient && !bgImage ? 'active' : ''}`}
                  onClick={() => { setBgGradient(null); setBgImage(null) }}
                >単色</button>
                <button
                  className={`btn-toggle ${!!bgGradient ? 'active' : ''}`}
                  onClick={() => {
                    if (!bgGradient) setBgGradient({ from: bgColor, to: '#7c3aed', angle: 'to-bottom-right' })
                    setBgImageUrl(null)
                  }}
                >グラデーション</button>
              </div>
            </div>

            {/* Solid color */}
            {!bgGradient && !bgImage && (
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

            {/* Gradient controls */}
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

            {/* Background image */}
            <div className="control-row">
              <label>画像</label>
              <label className="file-upload-btn">
                {bgImage ? '画像を変更' : '画像を選択'}
                <input
                  type="file"
                  accept="image/*"
                  style={{ display: 'none' }}
                  onChange={handleBgUpload}
                />
              </label>
              {bgImage && (
                <button className="btn-small btn-danger" onClick={() => { recordHistory(); setBgImageUrl(null); setBgOverlay(0) }}>
                  削除
                </button>
              )}
            </div>

            {/* Overlay slider — only shown when bg image is set */}
            {bgImage && (
              <div className="control-row">
                <label>暗さ</label>
                <input
                  type="range"
                  className="range"
                  min={0} max={90}
                  value={bgOverlay}
                  onChange={e => setBgOverlay(Number(e.target.value))}
                />
                <span className="value-badge">{bgOverlay}%</span>
              </div>
            )}
          </section>

          {/* Text Accordion */}
          <section className="panel-section s-text">
            <div className="section-header">
              <h2>テキスト</h2>
              <button className="btn-small btn-primary" onClick={addText}>＋ 追加</button>
            </div>
            <div className="text-list">
              {texts.map(t => (
                <div key={t.id} className={`text-accordion ${selectedId === t.id ? 'open' : ''}`}>

                  {/* ── Header row (always visible) ── */}
                  <div
                    className="text-accordion-header"
                    onClick={() => setSelectedId(selectedId === t.id ? null : t.id)}
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

                  {/* ── Editing controls (visible when open) ── */}
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

        {/* ── Right Canvas Preview ── */}
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
                if (e.target === e.target.getStage()) setSelectedId(null)
              }}
            >
              <Layer>
                {renderBackground()}

                {texts.map(t => (
                  <Text
                    key={t.id}
                    id={t.id}
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
                    draggable
                    onClick={() => setSelectedId(t.id)}
                    onTap={() => setSelectedId(t.id)}
                    onDragEnd={e => updateText(t.id, { x: e.target.x(), y: e.target.y() })}
                    shadowEnabled={t.shadowEnabled || selectedId === t.id}
                    shadowColor={t.shadowEnabled ? t.shadowColor : '#6366f1'}
                    shadowBlur={t.shadowEnabled ? t.shadowBlur : (selectedId === t.id ? 14 / scale : 0)}
                    shadowOffsetX={t.shadowEnabled ? t.shadowOffsetX : 0}
                    shadowOffsetY={t.shadowEnabled ? t.shadowOffsetY : 0}
                    shadowOpacity={t.shadowEnabled ? 0.85 : (selectedId === t.id ? 0.9 : 0)}
                    stroke={t.outlineWidth > 0 ? t.outlineColor : undefined}
                    strokeWidth={t.outlineWidth > 0 ? t.outlineWidth : 0}
                    fillAfterStrokeEnabled={t.outlineWidth > 0}
                  />
                ))}
              </Layer>
            </Stage>
          </div>
          <p className="canvas-hint">テキストはドラッグで移動 • クリックで選択</p>

          {/* ── Export Bar ── */}
          <div className="export-bar">
            <span className="preset-badge">{preset.width} × {preset.height} px</span>
            <button className="btn-download" onClick={handleDownload}>
              ⬇ PNG でダウンロード
            </button>
            <button className="btn-share" onClick={handleShare}>
              𝕏 でシェアする
            </button>
          </div>
        </main>

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
