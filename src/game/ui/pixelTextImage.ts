/**
 * Renders the 5x7 bitmap font to a data URL so React can use it too.
 *
 * The DOM has no pixel font available, and a normal web font would be
 * anti-aliased — so headings and the start prompt are drawn with the same
 * glyphs as the in-world text and shown as `<img>` with image-rendering:
 * pixelated. One typeface across canvas and DOM, genuinely crisp.
 *
 * TODO(art): if a real pixel webfont ships in public/assets/ui/, this can be
 * replaced with a @font-face rule and plain text nodes.
 */

import { drawText, measureText, normalise } from './pixelFont'

export interface PixelImageOptions {
  /** Font pixel size in CSS pixels. */
  scale?: number
  color?: string
  /** Hard 1-pixel drop shadow, offset down-right. */
  shadowColor?: string | null
}

const cache = new Map<string, string>()

export function pixelTextDataUrl(text: string, options: PixelImageOptions = {}): string {
  const { scale = 4, color = '#e0d1b3', shadowColor = null } = options
  const label = normalise(text)
  const key = `${label}|${scale}|${color}|${shadowColor ?? '-'}`

  const cached = cache.get(key)
  if (cached) return cached

  const { width, height } = measureText(label, scale)
  const offset = shadowColor ? scale : 0

  const canvas = document.createElement('canvas')
  canvas.width = Math.max(1, width + offset)
  canvas.height = Math.max(1, height + offset)

  const ctx = canvas.getContext('2d')
  if (!ctx) return ''
  ctx.imageSmoothingEnabled = false

  if (shadowColor) drawText(ctx, label, offset, offset, scale, shadowColor)
  drawText(ctx, label, 0, 0, scale, color)

  const url = canvas.toDataURL()
  cache.set(key, url)
  return url
}
