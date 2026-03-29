import { useRef, useState, useEffect, useCallback } from 'react'
import Konva from 'konva'
import { Stage, Layer, Rect, Text, Image as KonvaImage } from 'react-konva'
import { TEMPLATES, applyTemplate, getGradientPoints } from './templates'
import type { TextItem, SizePreset, BGGradient, Align, MobileTab, GradientAngle } from './types'
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
  { id: 'template', label: 'テンプレ', icon: '🎨' },
  { id: 'bg',       label: '背景',     icon: '🖼'  },
  { id: 'text',     label: 'テキスト', icon: 'T'  },
  { id: 'export',   label: '出力',     icon: '⬇'  },
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
  const [scale,      setScale]      = useState(0.5)
  const [mobileTab,  setMobileTab]  = useState<MobileTab>('template')
  const [activeTemplate, setActiveTemplate] = useState<string | null>(null)

  const [texts,      setTexts]      = useState<TextItem[]>(() => {
    const result = applyTemplate(TEMPLATES[0], SIZE_PRESETS[0])
    return result.texts
  })
  const [selectedId, setSelectedId] = useState<string | null>(null)

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
  const selectedText = texts.find(t => t.id === selectedId) ?? null

  // ── Text helpers ──
  const updateText = (id: string, patch: Partial<TextItem>) =>
    setTexts(prev => prev.map(t => t.id === id ? { ...t, ...patch } : t))

  const addText = () => {
    const item = makeText(preset, { y: 80 + texts.length * 90 })
    setTexts(prev => [...prev, item])
    setSelectedId(item.id)
  }

  const removeText = (id: string) => {
    setTexts(prev => prev.filter(t => t.id !== id))
    if (selectedId === id) setSelectedId(null)
  }

  // ── Preset change ──
  const handlePresetChange = (id: string) => {
    const next = SIZE_PRESETS.find(p => p.id === id)!
    setPreset(next)
    setBgImage(null)
    setTexts(prev => prev.map(t => ({ ...t, width: next.width - 120 })))
  }

  // ── Template apply ──
  const handleApplyTemplate = (templateId: string) => {
    const tmpl = TEMPLATES.find(t => t.id === templateId)!
    const result = applyTemplate(tmpl, preset)
    setBgColor(result.bgColor)
    setBgGradient(result.bgGradient)
    setBgImage(null)
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
      const img = new window.Image()
      img.onload = () => {
        setBgImage(img)
        setBgGradient(null)
      }
      img.src = ev.target?.result as string
    }
    reader.readAsDataURL(file)
    e.target.value = ''
  }

  // ── PNG Download ──
  const handleDownload = () => {
    if (!stageRef.current) return
    const uri = stageRef.current.toDataURL({ pixelRatio: 1 / scale })
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
        <KonvaImage
          image={bgImage}
          x={0} y={0}
          width={preset.width}
          height={preset.height}
        />
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
      </header>

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
            <h2>テンプレート</h2>
            <div className="tmpl-grid">
              {TEMPLATES.map(t => (
                <button
                  key={t.id}
                  className={`tmpl-card ${activeTemplate === t.id ? 'active' : ''}`}
                  onClick={() => handleApplyTemplate(t.id)}
                  title={t.name}
                >
                  <div
                    className="tmpl-thumb"
                    style={{ background: t.thumbStyle }}
                  >
                    <div
                      className="tmpl-line tmpl-line-title"
                      style={{ background: t.texts[0]?.color + 'bb' }}
                    />
                    <div
                      className="tmpl-line tmpl-line-sub"
                      style={{ background: t.texts[1]?.color + '88' }}
                    />
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
                    setBgImage(null)
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
                <button className="btn-small btn-danger" onClick={() => setBgImage(null)}>
                  削除
                </button>
              )}
            </div>
          </section>

          {/* Text List */}
          <section className="panel-section s-text">
            <div className="section-header">
              <h2>テキスト</h2>
              <button className="btn-small btn-primary" onClick={addText}>＋ 追加</button>
            </div>
            <div className="text-list">
              {texts.map(t => (
                <div
                  key={t.id}
                  className={`text-item ${selectedId === t.id ? 'selected' : ''}`}
                  onClick={() => setSelectedId(t.id)}
                >
                  <span className="text-preview">
                    {t.text.slice(0, 16)}{t.text.length > 16 ? '…' : ''}
                  </span>
                  <button
                    className="btn-icon btn-danger"
                    title="削除"
                    onClick={e => { e.stopPropagation(); removeText(t.id) }}
                  >✕</button>
                </div>
              ))}
            </div>
          </section>

          {/* Text Editor */}
          {selectedText && (
            <section className="panel-section s-text">
              <h2>テキスト編集</h2>

              <div className="control-col">
                <label>テキスト内容</label>
                <textarea
                  className="textarea"
                  rows={3}
                  value={selectedText.text}
                  onChange={e => updateText(selectedText.id, { text: e.target.value })}
                />
              </div>

              <div className="control-row">
                <label>フォント</label>
                <select
                  className="select select-sm"
                  value={selectedText.fontFamily}
                  onChange={e => updateText(selectedText.id, { fontFamily: e.target.value })}
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
                  value={selectedText.fontSize}
                  onChange={e => updateText(selectedText.id, { fontSize: Number(e.target.value) })}
                />
                <span className="value-badge">{selectedText.fontSize}px</span>
              </div>

              <div className="control-row">
                <label>色</label>
                <input
                  type="color"
                  className="color-input"
                  value={selectedText.color}
                  onChange={e => updateText(selectedText.id, { color: e.target.value })}
                />
                <span className="color-value">{selectedText.color}</span>
              </div>

              <div className="control-row">
                <label>スタイル</label>
                <button
                  className={`btn-toggle ${selectedText.bold ? 'active' : ''}`}
                  style={{ fontWeight: 700 }}
                  onClick={() => updateText(selectedText.id, { bold: !selectedText.bold })}
                >B</button>
                <button
                  className={`btn-toggle ${selectedText.italic ? 'active' : ''}`}
                  style={{ fontStyle: 'italic' }}
                  onClick={() => updateText(selectedText.id, { italic: !selectedText.italic })}
                >I</button>
              </div>

              <div className="control-row">
                <label>揃え</label>
                {(['left', 'center', 'right'] as Align[]).map(a => (
                  <button
                    key={a}
                    className={`btn-toggle ${selectedText.align === a ? 'active' : ''}`}
                    onClick={() => updateText(selectedText.id, { align: a })}
                  >
                    {a === 'left' ? '左' : a === 'center' ? '中' : '右'}
                  </button>
                ))}
              </div>
            </section>
          )}

          {/* Download */}
          <section className="panel-section s-export">
            <div className="preset-badge">
              {preset.width} × {preset.height} px
            </div>
            <button className="btn-download" onClick={handleDownload}>
              ⬇ PNG でダウンロード
            </button>
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
                    shadowColor={selectedId === t.id ? '#6366f1' : 'transparent'}
                    shadowBlur={selectedId === t.id ? 14 / scale : 0}
                    shadowOpacity={selectedId === t.id ? 0.9 : 0}
                  />
                ))}
              </Layer>
            </Stage>
          </div>
          <p className="canvas-hint">テキストはドラッグで移動 • クリックで選択</p>
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
