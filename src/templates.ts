import type { TemplateDef, TemplateDef as TD, BGGradient, TextItem, SizePreset } from './types'

// ─────────────────────────────────────────────
// 12 layout templates — background is NOT applied (layout only).
// Positions use ratios (0–1) relative to canvas size.
// ─────────────────────────────────────────────
export const TEMPLATES: TemplateDef[] = [
  // ── 2-text / standard ──
  {
    id: 'layout-2-left',
    name: '2段・左揃え',
    category: 'スタンダード',
    bgColor: '#1a1a2e',
    thumbStyle: '#dde3ef',
    texts: [
      { text: 'タイトルを入力',       xRatio: 0.05, yRatio: 0.25, fontSizeRatio: 0.115, color: '#ffffff', fontFamily: 'Noto Sans JP', bold: true,  italic: false, align: 'left',   widthRatio: 0.90 },
      { text: 'サブタイトル・説明文', xRatio: 0.05, yRatio: 0.60, fontSizeRatio: 0.057, color: '#cccccc', fontFamily: 'Noto Sans JP', bold: false, italic: false, align: 'left',   widthRatio: 0.90 },
    ],
  },
  {
    id: 'layout-2-center',
    name: '2段・中央揃え',
    category: 'スタンダード',
    bgColor: '#1a1a2e',
    thumbStyle: '#dde3ef',
    texts: [
      { text: 'タイトルを入力',       xRatio: 0.10, yRatio: 0.25, fontSizeRatio: 0.105, color: '#ffffff', fontFamily: 'Noto Sans JP', bold: true,  italic: false, align: 'center', widthRatio: 0.80 },
      { text: 'サブタイトル・説明文', xRatio: 0.10, yRatio: 0.59, fontSizeRatio: 0.053, color: '#cccccc', fontFamily: 'Noto Sans JP', bold: false, italic: false, align: 'center', widthRatio: 0.80 },
    ],
  },
  {
    id: 'layout-2-right',
    name: '2段・右揃え',
    category: 'スタンダード',
    bgColor: '#1a1a2e',
    thumbStyle: '#dde3ef',
    texts: [
      { text: 'タイトルを入力',       xRatio: 0.05, yRatio: 0.25, fontSizeRatio: 0.115, color: '#ffffff', fontFamily: 'Noto Sans JP', bold: true,  italic: false, align: 'right',  widthRatio: 0.90 },
      { text: 'サブタイトル・説明文', xRatio: 0.05, yRatio: 0.60, fontSizeRatio: 0.057, color: '#cccccc', fontFamily: 'Noto Sans JP', bold: false, italic: false, align: 'right',  widthRatio: 0.90 },
    ],
  },

  // ── 2-text / top-heavy ──
  {
    id: 'layout-top-left',
    name: '上寄り・左揃え',
    category: '上寄り',
    bgColor: '#1a1a2e',
    thumbStyle: '#dde3ef',
    texts: [
      { text: 'タイトルを入力',       xRatio: 0.05, yRatio: 0.10, fontSizeRatio: 0.110, color: '#ffffff', fontFamily: 'Noto Sans JP', bold: true,  italic: false, align: 'left',   widthRatio: 0.90 },
      { text: 'サブタイトル・説明文', xRatio: 0.05, yRatio: 0.42, fontSizeRatio: 0.055, color: '#cccccc', fontFamily: 'Noto Sans JP', bold: false, italic: false, align: 'left',   widthRatio: 0.90 },
    ],
  },
  {
    id: 'layout-top-center',
    name: '上寄り・中央揃え',
    category: '上寄り',
    bgColor: '#1a1a2e',
    thumbStyle: '#dde3ef',
    texts: [
      { text: 'タイトルを入力',       xRatio: 0.10, yRatio: 0.10, fontSizeRatio: 0.100, color: '#ffffff', fontFamily: 'Noto Sans JP', bold: true,  italic: false, align: 'center', widthRatio: 0.80 },
      { text: 'サブタイトル・説明文', xRatio: 0.10, yRatio: 0.42, fontSizeRatio: 0.052, color: '#cccccc', fontFamily: 'Noto Sans JP', bold: false, italic: false, align: 'center', widthRatio: 0.80 },
    ],
  },

  // ── 2-text / bottom-heavy ──
  {
    id: 'layout-bottom-left',
    name: '下寄り・左揃え',
    category: '下寄り',
    bgColor: '#1a1a2e',
    thumbStyle: '#dde3ef',
    texts: [
      { text: 'タイトルを入力',       xRatio: 0.05, yRatio: 0.50, fontSizeRatio: 0.110, color: '#ffffff', fontFamily: 'Noto Sans JP', bold: true,  italic: false, align: 'left',   widthRatio: 0.90 },
      { text: 'サブタイトル・説明文', xRatio: 0.05, yRatio: 0.76, fontSizeRatio: 0.055, color: '#cccccc', fontFamily: 'Noto Sans JP', bold: false, italic: false, align: 'left',   widthRatio: 0.90 },
    ],
  },
  {
    id: 'layout-bottom-center',
    name: '下寄り・中央揃え',
    category: '下寄り',
    bgColor: '#1a1a2e',
    thumbStyle: '#dde3ef',
    texts: [
      { text: 'タイトルを入力',       xRatio: 0.10, yRatio: 0.50, fontSizeRatio: 0.100, color: '#ffffff', fontFamily: 'Noto Sans JP', bold: true,  italic: false, align: 'center', widthRatio: 0.80 },
      { text: 'サブタイトル・説明文', xRatio: 0.10, yRatio: 0.76, fontSizeRatio: 0.050, color: '#cccccc', fontFamily: 'Noto Sans JP', bold: false, italic: false, align: 'center', widthRatio: 0.80 },
    ],
  },

  // ── 2-text / spread ──
  {
    id: 'layout-spread',
    name: '上下分割',
    category: 'ワイド',
    bgColor: '#1a1a2e',
    thumbStyle: '#dde3ef',
    texts: [
      { text: 'タイトルを入力',       xRatio: 0.05, yRatio: 0.08, fontSizeRatio: 0.110, color: '#ffffff', fontFamily: 'Noto Sans JP', bold: true,  italic: false, align: 'left',   widthRatio: 0.90 },
      { text: 'サブタイトル・説明文', xRatio: 0.05, yRatio: 0.77, fontSizeRatio: 0.055, color: '#cccccc', fontFamily: 'Noto Sans JP', bold: false, italic: false, align: 'left',   widthRatio: 0.90 },
    ],
  },

  // ── 1-text ──
  {
    id: 'layout-1-center',
    name: '1段・中央',
    category: '1段',
    bgColor: '#1a1a2e',
    thumbStyle: '#dde3ef',
    texts: [
      { text: 'タイトルを入力', xRatio: 0.05, yRatio: 0.37, fontSizeRatio: 0.130, color: '#ffffff', fontFamily: 'Noto Sans JP', bold: true, italic: false, align: 'center', widthRatio: 0.90 },
    ],
  },
  {
    id: 'layout-1-left',
    name: '1段・左揃え',
    category: '1段',
    bgColor: '#1a1a2e',
    thumbStyle: '#dde3ef',
    texts: [
      { text: 'タイトルを入力', xRatio: 0.05, yRatio: 0.37, fontSizeRatio: 0.130, color: '#ffffff', fontFamily: 'Noto Sans JP', bold: true, italic: false, align: 'left', widthRatio: 0.90 },
    ],
  },

  // ── 3-text ──
  {
    id: 'layout-3-left',
    name: '3段・左揃え',
    category: '3段',
    bgColor: '#1a1a2e',
    thumbStyle: '#dde3ef',
    texts: [
      { text: 'タイトルを入力',       xRatio: 0.05, yRatio: 0.12, fontSizeRatio: 0.100, color: '#ffffff', fontFamily: 'Noto Sans JP', bold: true,  italic: false, align: 'left', widthRatio: 0.90 },
      { text: 'サブタイトル',         xRatio: 0.05, yRatio: 0.44, fontSizeRatio: 0.065, color: '#cccccc', fontFamily: 'Noto Sans JP', bold: false, italic: false, align: 'left', widthRatio: 0.90 },
      { text: '補足テキスト',         xRatio: 0.05, yRatio: 0.70, fontSizeRatio: 0.045, color: '#999999', fontFamily: 'Noto Sans JP', bold: false, italic: false, align: 'left', widthRatio: 0.90 },
    ],
  },
  {
    id: 'layout-3-center',
    name: '3段・中央揃え',
    category: '3段',
    bgColor: '#1a1a2e',
    thumbStyle: '#dde3ef',
    texts: [
      { text: 'タイトルを入力',       xRatio: 0.10, yRatio: 0.12, fontSizeRatio: 0.095, color: '#ffffff', fontFamily: 'Noto Sans JP', bold: true,  italic: false, align: 'center', widthRatio: 0.80 },
      { text: 'サブタイトル',         xRatio: 0.10, yRatio: 0.44, fontSizeRatio: 0.060, color: '#cccccc', fontFamily: 'Noto Sans JP', bold: false, italic: false, align: 'center', widthRatio: 0.80 },
      { text: '補足テキスト',         xRatio: 0.10, yRatio: 0.70, fontSizeRatio: 0.042, color: '#999999', fontFamily: 'Noto Sans JP', bold: false, italic: false, align: 'center', widthRatio: 0.80 },
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
    shadowEnabled: false,
    shadowColor: '#000000',
    shadowBlur: 10,
    shadowOffsetX: 3,
    shadowOffsetY: 3,
    outlineWidth: 0,
    outlineColor: '#000000',
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
