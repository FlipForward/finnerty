/**
 * Phaser wrappers around the 5x7 bitmap font.
 *
 * Text is baked into a canvas texture once per unique string and cached in the
 * texture manager, so a label that changes between a handful of values (the
 * [E] prompt, the dev clock) costs nothing after the first frame.
 */

import Phaser from 'phaser'
import { drawText, measureText } from './pixelFont'

export interface PixelTextOptions {
  /** Font pixel size. 1 = a 5x7 glyph, 5 = the hillside lettering. */
  scale?: number
  color?: string
  /** Hard 1-pixel-offset drop shadow. No blur, ever. */
  shadowColor?: string | null
  backgroundColor?: string | null
  borderColor?: string | null
  /** Padding inside the background box, in font pixels (multiplied by scale). */
  padding?: number
  /** Extra blank rows between lines, in font pixels. */
  lineSpacing?: number
}

interface ResolvedOptions extends Required<PixelTextOptions> {}

const DEFAULTS: ResolvedOptions = {
  scale: 1,
  color: '#e0d1b3',
  shadowColor: null,
  backgroundColor: null,
  borderColor: null,
  padding: 0,
  lineSpacing: 2,
}

function resolve(options: PixelTextOptions | undefined): ResolvedOptions {
  return { ...DEFAULTS, ...options }
}

function cacheKey(lines: string[], o: ResolvedOptions): string {
  return [
    'pixeltext',
    o.scale,
    o.color,
    o.shadowColor ?? '-',
    o.backgroundColor ?? '-',
    o.borderColor ?? '-',
    o.padding,
    o.lineSpacing,
    lines.join(''),
  ].join('|')
}

/**
 * Bakes `lines` into a texture and returns its key. Idempotent: calling twice
 * with identical arguments reuses the existing texture.
 */
export function makeTextTexture(
  scene: Phaser.Scene,
  lines: string[],
  options?: PixelTextOptions,
): { key: string; width: number; height: number } {
  const o = resolve(options)
  const key = cacheKey(lines, o)

  const pad = o.padding * o.scale
  const shadowOffset = o.shadowColor ? o.scale : 0
  const lineHeight = (7 + o.lineSpacing) * o.scale
  const textWidth = Math.max(...lines.map((line) => measureText(line, o.scale).width), 0)
  const textHeight = lines.length * lineHeight - o.lineSpacing * o.scale

  const width = Math.max(1, textWidth + pad * 2 + shadowOffset)
  const height = Math.max(1, textHeight + pad * 2 + shadowOffset)

  if (scene.textures.exists(key)) return { key, width, height }

  const texture = scene.textures.createCanvas(key, width, height)
  if (!texture) throw new Error(`PixelText: could not create canvas texture "${key}"`)
  const ctx = texture.getContext()
  ctx.imageSmoothingEnabled = false

  if (o.backgroundColor) {
    ctx.fillStyle = o.backgroundColor
    ctx.fillRect(0, 0, width - shadowOffset, height - shadowOffset)
  }
  if (o.borderColor) {
    ctx.fillStyle = o.borderColor
    const w = width - shadowOffset
    const h = height - shadowOffset
    ctx.fillRect(0, 0, w, o.scale)
    ctx.fillRect(0, h - o.scale, w, o.scale)
    ctx.fillRect(0, 0, o.scale, h)
    ctx.fillRect(w - o.scale, 0, o.scale, h)
  }

  lines.forEach((line, index) => {
    const y = pad + index * lineHeight
    if (o.shadowColor) drawText(ctx, line, pad + shadowOffset, y + shadowOffset, o.scale, o.shadowColor)
    drawText(ctx, line, pad, y, o.scale, o.color)
  })

  texture.refresh()
  return { key, width, height }
}

/**
 * An image whose texture is bitmap text. `setLines` swaps the texture rather
 * than re-rasterising, so flipping the prompt between a few labels is free.
 */
export class PixelLabel extends Phaser.GameObjects.Image {
  private readonly options: PixelTextOptions

  constructor(scene: Phaser.Scene, x: number, y: number, lines: string[], options?: PixelTextOptions) {
    const { key } = makeTextTexture(scene, lines, options)
    super(scene, x, y, key)
    this.options = options ?? {}
    scene.add.existing(this)
  }

  setLines(lines: string[]): this {
    const { key } = makeTextTexture(this.scene, lines, this.options)
    if (this.texture.key !== key) this.setTexture(key)
    return this
  }
}
