export type Align = 'left' | 'center' | 'right'
export type GradientAngle = 'to-right' | 'to-bottom' | 'to-bottom-right' | 'to-bottom-left'
export interface TextItem {
  id: string
  text: string
  x: number
  y: number
  fontSize: number
  color: string
  fontFamily: string
  bold: boolean
  italic: boolean
  align: Align
  width: number
  rotation: number
  // Shadow
  shadowEnabled: boolean
  shadowColor: string
  shadowBlur: number
  shadowOffsetX: number
  shadowOffsetY: number
  // Outline (stroke)
  outlineWidth: number
  outlineColor: string
}

export interface SizePreset {
  id: string
  name: string
  width: number
  height: number
}

export interface BGGradient {
  from: string
  to: string
  angle: GradientAngle
}

export interface TemplateTextDef {
  text: string
  xRatio: number
  yRatio: number
  fontSizeRatio: number
  color: string
  fontFamily: string
  bold: boolean
  italic: boolean
  align: Align
  widthRatio: number
}

export interface ImageItem {
  id: string
  url: string
  x: number
  y: number
  width: number
  height: number
  opacity: number
  rotation: number
}

export interface HistorySnapshot {
  texts: TextItem[]
  bgColor: string
  bgGradient: BGGradient | null
}

export interface TemplateDef {
  id: string
  name: string
  category: string
  bgColor: string
  bgGradient?: BGGradient
  thumbStyle: string
  texts: TemplateTextDef[]
}
