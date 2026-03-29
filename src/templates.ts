import type { TemplateDef, TemplateDef as TD, BGGradient, TextItem, SizePreset } from './types'

// ─────────────────────────────────────────────
// 12 template definitions
// Positions use ratios (0–1) relative to canvas size.
// xRatio/yRatio = left/top edge of the text box.
// fontSizeRatio = fontSize / canvasHeight
// ─────────────────────────────────────────────
export const TEMPLATES: TemplateDef[] = [
  {
    id: 'night',
    name: 'ナイトモード',
    category: '黒系',
    bgColor: '#0a0a0a',
    thumbStyle: '#0a0a0a',
    texts: [
      { text: 'タイトルを入力', xRatio: 0.05, yRatio: 0.25, fontSizeRatio: 0.115, color: '#ffffff', fontFamily: 'Noto Sans JP', bold: true,  italic: false, align: 'left',   widthRatio: 0.9  },
      { text: 'サブタイトル・説明文',    xRatio: 0.05, yRatio: 0.60, fontSizeRatio: 0.057, color: '#888888', fontFamily: 'Noto Sans JP', bold: false, italic: false, align: 'left',   widthRatio: 0.9  },
    ],
  },
  {
    id: 'indigo',
    name: 'インディゴ',
    category: 'グラデーション',
    bgColor: '#4f46e5',
    bgGradient: { from: '#4f46e5', to: '#7c3aed', angle: 'to-bottom-right' },
    thumbStyle: 'linear-gradient(135deg, #4f46e5, #7c3aed)',
    texts: [
      { text: 'タイトルを入力', xRatio: 0.10, yRatio: 0.26, fontSizeRatio: 0.105, color: '#ffffff', fontFamily: 'Noto Sans JP', bold: true,  italic: false, align: 'center', widthRatio: 0.80 },
      { text: 'サブタイトル・説明文',    xRatio: 0.10, yRatio: 0.59, fontSizeRatio: 0.053, color: '#c4b5fd', fontFamily: 'Noto Sans JP', bold: false, italic: false, align: 'center', widthRatio: 0.80 },
    ],
  },
  {
    id: 'sunset',
    name: 'サンセット',
    category: 'グラデーション',
    bgColor: '#f97316',
    bgGradient: { from: '#f97316', to: '#db2777', angle: 'to-bottom-right' },
    thumbStyle: 'linear-gradient(135deg, #f97316, #db2777)',
    texts: [
      { text: 'タイトルを入力', xRatio: 0.05, yRatio: 0.25, fontSizeRatio: 0.115, color: '#ffffff', fontFamily: 'Noto Sans JP', bold: true,  italic: false, align: 'left',   widthRatio: 0.85 },
      { text: 'サブタイトル・説明文',    xRatio: 0.05, yRatio: 0.60, fontSizeRatio: 0.057, color: '#fce7f3', fontFamily: 'Noto Sans JP', bold: false, italic: false, align: 'left',   widthRatio: 0.85 },
    ],
  },
  {
    id: 'ocean',
    name: 'オーシャン',
    category: 'グラデーション',
    bgColor: '#0c1445',
    bgGradient: { from: '#0c1445', to: '#1d4ed8', angle: 'to-bottom-right' },
    thumbStyle: 'linear-gradient(135deg, #0c1445, #1d4ed8)',
    texts: [
      { text: 'タイトルを入力', xRatio: 0.05, yRatio: 0.25, fontSizeRatio: 0.115, color: '#ffffff', fontFamily: 'Noto Sans JP', bold: true,  italic: false, align: 'left',   widthRatio: 0.85 },
      { text: 'サブタイトル・説明文',    xRatio: 0.05, yRatio: 0.60, fontSizeRatio: 0.057, color: '#93c5fd', fontFamily: 'Noto Sans JP', bold: false, italic: false, align: 'left',   widthRatio: 0.85 },
    ],
  },
  {
    id: 'minimal',
    name: 'ミニマル白',
    category: '明るい',
    bgColor: '#ffffff',
    thumbStyle: '#f8fafc',
    texts: [
      { text: 'タイトルを入力', xRatio: 0.05, yRatio: 0.25, fontSizeRatio: 0.115, color: '#1e293b', fontFamily: 'Noto Sans JP', bold: true,  italic: false, align: 'left',   widthRatio: 0.85 },
      { text: 'サブタイトル・説明文',    xRatio: 0.05, yRatio: 0.60, fontSizeRatio: 0.057, color: '#64748b', fontFamily: 'Noto Sans JP', bold: false, italic: false, align: 'left',   widthRatio: 0.85 },
    ],
  },
  {
    id: 'corporate',
    name: 'コーポレート',
    category: '黒系',
    bgColor: '#0f172a',
    thumbStyle: '#0f172a',
    texts: [
      { text: 'タイトルを入力', xRatio: 0.05, yRatio: 0.25, fontSizeRatio: 0.115, color: '#f8fafc', fontFamily: 'Noto Sans JP', bold: true,  italic: false, align: 'left',   widthRatio: 0.85 },
      { text: 'サブタイトル・説明文',    xRatio: 0.05, yRatio: 0.60, fontSizeRatio: 0.057, color: '#38bdf8', fontFamily: 'Noto Sans JP', bold: false, italic: false, align: 'left',   widthRatio: 0.85 },
    ],
  },
  {
    id: 'neon',
    name: 'ネオン',
    category: '黒系',
    bgColor: '#030712',
    thumbStyle: '#030712',
    texts: [
      { text: 'タイトルを入力', xRatio: 0.05, yRatio: 0.25, fontSizeRatio: 0.115, color: '#4ade80', fontFamily: 'Noto Sans JP', bold: true,  italic: false, align: 'left',   widthRatio: 0.85 },
      { text: 'サブタイトル・説明文',    xRatio: 0.05, yRatio: 0.60, fontSizeRatio: 0.057, color: '#6b7280', fontFamily: 'Noto Sans JP', bold: false, italic: false, align: 'left',   widthRatio: 0.85 },
    ],
  },
  {
    id: 'cherry',
    name: 'チェリー',
    category: 'グラデーション',
    bgColor: '#9f1239',
    bgGradient: { from: '#9f1239', to: '#ef4444', angle: 'to-bottom-right' },
    thumbStyle: 'linear-gradient(135deg, #9f1239, #ef4444)',
    texts: [
      { text: 'タイトルを入力', xRatio: 0.10, yRatio: 0.26, fontSizeRatio: 0.105, color: '#ffffff', fontFamily: 'Noto Sans JP', bold: true,  italic: false, align: 'center', widthRatio: 0.80 },
      { text: 'サブタイトル・説明文',    xRatio: 0.10, yRatio: 0.59, fontSizeRatio: 0.053, color: '#fecdd3', fontFamily: 'Noto Sans JP', bold: false, italic: false, align: 'center', widthRatio: 0.80 },
    ],
  },
  {
    id: 'emerald',
    name: 'エメラルド',
    category: '黒系',
    bgColor: '#064e3b',
    thumbStyle: '#064e3b',
    texts: [
      { text: 'タイトルを入力', xRatio: 0.05, yRatio: 0.25, fontSizeRatio: 0.115, color: '#ffffff', fontFamily: 'Noto Sans JP', bold: true,  italic: false, align: 'left',   widthRatio: 0.85 },
      { text: 'サブタイトル・説明文',    xRatio: 0.05, yRatio: 0.60, fontSizeRatio: 0.057, color: '#6ee7b7', fontFamily: 'Noto Sans JP', bold: false, italic: false, align: 'left',   widthRatio: 0.85 },
    ],
  },
  {
    id: 'morning',
    name: 'モーニング',
    category: '明るい',
    bgColor: '#dbeafe',
    bgGradient: { from: '#bfdbfe', to: '#eff6ff', angle: 'to-bottom-right' },
    thumbStyle: 'linear-gradient(135deg, #bfdbfe, #eff6ff)',
    texts: [
      { text: 'タイトルを入力', xRatio: 0.10, yRatio: 0.26, fontSizeRatio: 0.105, color: '#1e3a8a', fontFamily: 'Noto Sans JP', bold: true,  italic: false, align: 'center', widthRatio: 0.80 },
      { text: 'サブタイトル・説明文',    xRatio: 0.10, yRatio: 0.59, fontSizeRatio: 0.053, color: '#3b82f6', fontFamily: 'Noto Sans JP', bold: false, italic: false, align: 'center', widthRatio: 0.80 },
    ],
  },
  {
    id: 'golden',
    name: 'ゴールデン',
    category: 'グラデーション',
    bgColor: '#1c1007',
    bgGradient: { from: '#1c1007', to: '#92400e', angle: 'to-bottom-right' },
    thumbStyle: 'linear-gradient(135deg, #1c1007, #92400e)',
    texts: [
      { text: 'タイトルを入力', xRatio: 0.05, yRatio: 0.25, fontSizeRatio: 0.115, color: '#fbbf24', fontFamily: 'Noto Sans JP', bold: true,  italic: false, align: 'left',   widthRatio: 0.85 },
      { text: 'サブタイトル・説明文',    xRatio: 0.05, yRatio: 0.60, fontSizeRatio: 0.057, color: '#fde68a', fontFamily: 'Noto Sans JP', bold: false, italic: false, align: 'left',   widthRatio: 0.85 },
    ],
  },
  {
    id: 'twilight',
    name: 'トワイライト',
    category: 'グラデーション',
    bgColor: '#1e1b4b',
    bgGradient: { from: '#1e1b4b', to: '#4c1d95', angle: 'to-bottom-right' },
    thumbStyle: 'linear-gradient(135deg, #1e1b4b, #4c1d95)',
    texts: [
      { text: 'タイトルを入力', xRatio: 0.10, yRatio: 0.26, fontSizeRatio: 0.105, color: '#ffffff', fontFamily: 'Noto Sans JP', bold: true,  italic: false, align: 'center', widthRatio: 0.80 },
      { text: 'サブタイトル・説明文',    xRatio: 0.10, yRatio: 0.59, fontSizeRatio: 0.053, color: '#ddd6fe', fontFamily: 'Noto Sans JP', bold: false, italic: false, align: 'center', widthRatio: 0.80 },
    ],
  },
]

// ─────────────────────────────────────────────
// Apply a template to the current canvas size
// ─────────────────────────────────────────────
export function applyTemplate(
  template: TD,
  preset: SizePreset,
): { bgColor: string; bgGradient: BGGradient | null; texts: TextItem[] } {
  const texts: TextItem[] = template.texts.map((def, i) => ({
    id: `text-${Date.now()}-${i}`,
    text: def.text,
    x: Math.round(def.xRatio * preset.width),
    y: Math.round(def.yRatio * preset.height),
    fontSize: Math.max(12, Math.round(def.fontSizeRatio * preset.height)),
    color: def.color,
    fontFamily: def.fontFamily,
    bold: def.bold,
    italic: def.italic,
    align: def.align,
    width: Math.round(def.widthRatio * preset.width),
  }))
  return {
    bgColor: template.bgColor,
    bgGradient: template.bgGradient ?? null,
    texts,
  }
}

// Helper: convert GradientAngle to Konva start/end points
export function getGradientPoints(
  angle: BGGradient['angle'],
  w: number,
  h: number,
) {
  switch (angle) {
    case 'to-right':        return { start: { x: 0, y: 0 }, end: { x: w, y: 0 } }
    case 'to-bottom':       return { start: { x: 0, y: 0 }, end: { x: 0, y: h } }
    case 'to-bottom-left':  return { start: { x: w, y: 0 }, end: { x: 0, y: h } }
    case 'to-bottom-right':
    default:                return { start: { x: 0, y: 0 }, end: { x: w, y: h } }
  }
}
