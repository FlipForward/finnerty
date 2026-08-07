/**
 * Procedural development placeholders.
 *
 * ALL of this is temporary. Every texture generated here maps 1:1 onto a file
 * the artist will deliver (see docs/ART_BIBLE.md for the contract), and
 * `BootScene` is the single place that decides between generated and loaded
 * art — so replacing a placeholder is a load call, not a refactor.
 *
 * The generators still obey the art bible (hard pixels, max three shades per
 * material, light from the upper-left, ink outlines) so the world reads
 * correctly while the real art is being made. They are deliberately simple
 * shapes: nobody should mistake these for final assets.
 */

import Phaser from 'phaser'
import { ASSET_SIZE, PALETTE, TextureKeys, TILE_SIZE } from '../config'
import { drawText, measureText } from '../ui/pixelFont'

const hex = (color: number): string => `#${color.toString(16).padStart(6, '0')}`

const C = {
  ink: hex(PALETTE.ink),
  grassShadow: hex(PALETTE.grassShadow),
  grassMid: hex(PALETTE.grassMid),
  grassLight: hex(PALETTE.grassLight),
  stoneShadow: hex(PALETTE.stoneShadow),
  stoneMid: hex(PALETTE.stoneMid),
  stoneLight: hex(PALETTE.stoneLight),
  woodDark: hex(PALETTE.woodDark),
  woodLight: hex(PALETTE.woodLight),
  cobalt: hex(PALETTE.cobalt),
  cobaltShadow: hex(PALETTE.cobaltShadow),
  lightBlue: hex(PALETTE.lightBlue),
  paleBlue: hex(PALETTE.paleBlue),
  amber: hex(PALETTE.lanternAmber),
  liveRed: hex(PALETTE.liveRed),
  waterDeep: hex(PALETTE.waterDeep),
  waterMid: hex(PALETTE.waterMid),
  waterLight: hex(PALETTE.waterLight),
  dirtShadow: hex(PALETTE.dirtShadow),
  dirtMid: hex(PALETTE.dirtMid),
  dirtLight: hex(PALETTE.dirtLight),
}

/**
 * A tiny indexed pixel canvas.
 *
 * Everything is authored one pixel at a time so nothing can sneak in a
 * gradient or an anti-aliased edge, and `outline()` gives every prop the same
 * ink silhouette without hand-placing it.
 */
class PixelBuffer {
  private readonly px: (string | null)[]

  constructor(
    readonly width: number,
    readonly height: number,
  ) {
    this.px = new Array<string | null>(width * height).fill(null)
  }

  set(x: number, y: number, color: string | null): void {
    if (x < 0 || y < 0 || x >= this.width || y >= this.height) return
    this.px[y * this.width + x] = color
  }

  get(x: number, y: number): string | null {
    if (x < 0 || y < 0 || x >= this.width || y >= this.height) return null
    return this.px[y * this.width + x]
  }

  rect(x: number, y: number, w: number, h: number, color: string): void {
    for (let dy = 0; dy < h; dy++) for (let dx = 0; dx < w; dx++) this.set(x + dx, y + dy, color)
  }

  ellipse(cx: number, cy: number, rx: number, ry: number, color: string): void {
    for (let y = Math.floor(cy - ry); y <= Math.ceil(cy + ry); y++) {
      for (let x = Math.floor(cx - rx); x <= Math.ceil(cx + rx); x++) {
        const nx = (x - cx) / rx
        const ny = (y - cy) / ry
        if (nx * nx + ny * ny <= 1) this.set(x, y, color)
      }
    }
  }

  /**
   * A filled ellipse lit from the upper-left, quantised to exactly three
   * shades. This is the workhorse for organic props.
   */
  ellipseShaded(
    cx: number,
    cy: number,
    rx: number,
    ry: number,
    light: string,
    mid: string,
    shadow: string,
  ): void {
    for (let y = Math.floor(cy - ry); y <= Math.ceil(cy + ry); y++) {
      for (let x = Math.floor(cx - rx); x <= Math.ceil(cx + rx); x++) {
        const nx = (x - cx) / rx
        const ny = (y - cy) / ry
        if (nx * nx + ny * ny > 1) continue
        // Tight highlight cap, broad mid, deep shadow — a wide light band
        // reads as cartoon "shine" rather than a lit form.
        const lum = -nx - ny
        this.set(x, y, lum > 0.82 ? light : lum < -0.42 ? shadow : mid)
      }
    }
  }

  /** Ink where an empty pixel touches a filled one — the shared silhouette. */
  outline(color: string): void {
    const edges: [number, number][] = []
    for (let y = 0; y < this.height; y++) {
      for (let x = 0; x < this.width; x++) {
        if (this.get(x, y)) continue
        if (this.get(x - 1, y) || this.get(x + 1, y) || this.get(x, y - 1) || this.get(x, y + 1)) {
          edges.push([x, y])
        }
      }
    }
    for (const [x, y] of edges) this.set(x, y, color)
  }

  blit(ctx: CanvasRenderingContext2D, ox = 0, oy = 0): void {
    for (let y = 0; y < this.height; y++) {
      for (let x = 0; x < this.width; x++) {
        const color = this.px[y * this.width + x]
        if (!color) continue
        ctx.fillStyle = color
        ctx.fillRect(ox + x, oy + y, 1, 1)
      }
    }
  }
}

/**
 * Creates a blank canvas texture, or returns null if `key` already exists —
 * which means BootScene.preload loaded real art for it and this placeholder
 * should stand down.
 */
function canvasFor(scene: Phaser.Scene, key: string, width: number, height: number) {
  if (scene.textures.exists(key)) return null
  const texture = scene.textures.createCanvas(key, width, height)
  if (!texture) throw new Error(`textures: could not create canvas texture "${key}"`)
  const ctx = texture.getContext()
  ctx.imageSmoothingEnabled = false
  return { texture, ctx }
}

// --------------------------------------------------------------------- tileset
// One 16x16 tile per row, stacked into a single column. Index order must match
// `Tile` in world/worldLayout.ts.

/** Fixed speckle positions — deterministic so neighbouring tiles stay coherent. */
const LIGHT_SPECKS: [number, number][] = [
  [2, 3],
  [9, 1],
  [13, 8],
  [5, 11],
  [11, 13],
]
const DARK_SPECKS: [number, number][] = [
  [6, 6],
  [1, 9],
  [14, 4],
  [8, 10],
  [3, 14],
]

function tileGrass(buf: PixelBuffer, tuft: boolean): void {
  buf.rect(0, 0, TILE_SIZE, TILE_SIZE, C.grassMid)
  for (const [x, y] of LIGHT_SPECKS) buf.set(x, y, C.grassLight)
  for (const [x, y] of DARK_SPECKS) buf.set(x, y, C.grassShadow)
  if (!tuft) return
  // A three-blade tuft, lit from the upper-left.
  buf.rect(6, 10, 1, 3, C.grassShadow)
  buf.rect(8, 8, 1, 5, C.grassLight)
  buf.rect(10, 10, 1, 3, C.grassShadow)
  buf.set(8, 7, C.grassLight)
  buf.rect(6, 13, 5, 1, C.grassShadow)
}

function tileDirt(buf: PixelBuffer): void {
  buf.rect(0, 0, TILE_SIZE, TILE_SIZE, C.dirtMid)
  for (const [x, y] of LIGHT_SPECKS) buf.set(x, y, C.dirtLight)
  for (const [x, y] of DARK_SPECKS) buf.set(x, y, C.dirtShadow)
  buf.rect(4, 6, 3, 1, C.dirtShadow)
  buf.rect(10, 12, 3, 1, C.dirtShadow)
}

/**
 * Trodden flagstones set into earth.
 *
 * Deliberately low relief: a strong light/dark bevel on every stone made a
 * two-tile-wide path read as a brick wall from this top-down angle, so the
 * stones only catch a single lit pixel on their upper-left edge.
 */
function tilePath(buf: PixelBuffer): void {
  buf.rect(0, 0, TILE_SIZE, TILE_SIZE, C.dirtMid)
  const stones: [number, number, number, number][] = [
    [0, 0, 8, 7],
    [9, 0, 7, 8],
    [0, 8, 7, 8],
    [8, 9, 8, 7],
  ]
  for (const [x, y, w, h] of stones) {
    buf.rect(x, y, w, h, C.stoneMid)
    buf.rect(x, y, w, 1, C.stoneLight)
    buf.rect(x, y, 1, h, C.stoneLight)
  }
  // A little wear so the surface is not a flat grid.
  buf.set(4, 4, C.stoneShadow)
  buf.set(12, 12, C.stoneShadow)
  buf.set(11, 3, C.stoneLight)
}

/** Neat cream plaza slabs — reads as built, unlike the path. */
function tileSlab(buf: PixelBuffer): void {
  buf.rect(0, 0, TILE_SIZE, TILE_SIZE, C.stoneLight)
  buf.rect(0, 0, TILE_SIZE, 1, C.stoneMid)
  buf.rect(0, 0, 1, TILE_SIZE, C.stoneMid)
  buf.rect(0, 7, TILE_SIZE, 1, C.stoneMid)
  buf.rect(7, 0, 1, TILE_SIZE, C.stoneMid)
  buf.set(4, 4, C.stoneMid)
  buf.set(12, 11, C.stoneMid)
  buf.set(11, 3, C.stoneMid)
}

function tileShore(buf: PixelBuffer): void {
  buf.rect(0, 0, TILE_SIZE, TILE_SIZE, C.stoneLight)
  for (const [x, y] of DARK_SPECKS) buf.set(x, y, C.stoneMid)
  buf.set(5, 2, C.stoneMid)
  buf.set(12, 6, C.stoneMid)
}

function tileWater(buf: PixelBuffer): void {
  buf.rect(0, 0, TILE_SIZE, TILE_SIZE, C.waterMid)
  buf.rect(0, 0, TILE_SIZE, 4, C.waterDeep)
  buf.rect(2, 6, 5, 1, C.waterLight)
  buf.rect(9, 11, 4, 1, C.waterLight)
  buf.rect(11, 2, 3, 1, C.waterLight)
  buf.rect(1, 13, 3, 1, C.waterDeep)
}

function tileCliff(buf: PixelBuffer): void {
  buf.rect(0, 0, TILE_SIZE, TILE_SIZE, C.stoneShadow)
  buf.rect(0, 0, TILE_SIZE, 2, C.stoneMid) // top face catches the sky
  buf.rect(0, 0, 2, TILE_SIZE, C.stoneMid)
  buf.rect(0, 0, TILE_SIZE, 1, C.stoneLight)
  // Blocky masonry, plus a couple of ink cracks.
  buf.rect(0, 7, TILE_SIZE, 1, C.ink)
  buf.rect(6, 2, 1, 5, C.ink)
  buf.rect(11, 8, 1, 8, C.ink)
  buf.rect(3, 9, 1, 3, C.ink)
}

function generateTileset(scene: Phaser.Scene): void {
  const builders = [
    (b: PixelBuffer) => tileGrass(b, false),
    (b: PixelBuffer) => tileGrass(b, true),
    tileDirt,
    tilePath,
    tileSlab,
    tileShore,
    tileWater,
    tileCliff,
  ]
  const made = canvasFor(scene, TextureKeys.tileset, TILE_SIZE, TILE_SIZE * builders.length)
  if (!made) return
  const { texture, ctx } = made
  builders.forEach((build, index) => {
    const buf = new PixelBuffer(TILE_SIZE, TILE_SIZE)
    build(buf)
    buf.blit(ctx, 0, index * TILE_SIZE)
  })
  texture.refresh()
}

// ----------------------------------------------------------------------- props
// All props are 64x64 with the figure centred on x=32 and standing on y=56.

function propCanvas(scene: Phaser.Scene, key: string, draw: (buf: PixelBuffer) => void): void {
  const made = canvasFor(scene, key, ASSET_SIZE, ASSET_SIZE)
  if (!made) return
  const { texture, ctx } = made
  const buf = new PixelBuffer(ASSET_SIZE, ASSET_SIZE)
  draw(buf)
  buf.outline(C.ink)
  buf.blit(ctx)
  texture.refresh()
}

function generateProps(scene: Phaser.Scene): void {
  propCanvas(scene, TextureKeys.tree, (buf) => {
    buf.rect(29, 38, 6, 18, C.woodDark)
    buf.rect(29, 38, 2, 18, C.woodLight)
    // Two offset masses rather than one oval: a single ellipse reads as a
    // lollipop, which is exactly the mobile-game look the brief rules out.
    buf.ellipseShaded(33, 24, 16, 19, C.grassLight, C.grassMid, C.grassShadow)
    buf.ellipseShaded(24, 33, 10, 11, C.grassLight, C.grassMid, C.grassShadow)
    buf.ellipseShaded(41, 34, 8, 9, C.grassLight, C.grassMid, C.grassShadow)
  })

  propCanvas(scene, TextureKeys.treeSmall, (buf) => {
    buf.rect(31, 48, 3, 8, C.woodDark)
    buf.rect(31, 48, 1, 8, C.woodLight)
    buf.ellipseShaded(32, 44, 12, 9, C.grassLight, C.grassMid, C.grassShadow)
  })

  propCanvas(scene, TextureKeys.rock, (buf) => {
    buf.ellipseShaded(32, 50, 10, 6, C.stoneLight, C.stoneMid, C.stoneShadow)
    buf.ellipseShaded(25, 53, 4, 3, C.stoneLight, C.stoneMid, C.stoneShadow)
  })

  propCanvas(scene, TextureKeys.lantern, (buf) => {
    buf.rect(27, 53, 10, 3, C.stoneShadow) // footing
    buf.rect(27, 53, 10, 1, C.stoneMid)
    buf.rect(30, 26, 4, 28, C.woodDark) // post
    buf.rect(30, 26, 1, 28, C.woodLight)
    buf.rect(26, 22, 12, 5, C.ink) // housing
    buf.rect(28, 13, 8, 10, C.amber) // glass
    buf.rect(28, 13, 2, 10, C.paleBlue)
    buf.rect(25, 9, 14, 4, C.ink) // cap
    buf.rect(25, 9, 14, 1, C.stoneMid)
  })

  propCanvas(scene, TextureKeys.portal, (buf) => {
    // An arch: vertical jambs below the springline, a half-round above it.
    const arch = (halfW: number, top: number, bottom: number) => {
      const spring = top + halfW
      return (x: number, y: number) => {
        if (y > bottom || y < top) return false
        const dx = x - 32
        if (y >= spring) return Math.abs(dx) <= halfW
        const dy = spring - y
        return dx * dx + dy * dy <= halfW * halfW
      }
    }
    const outer = arch(20, 10, 56)
    const inner = arch(13, 20, 56)

    for (let y = 0; y < ASSET_SIZE; y++) {
      for (let x = 0; x < ASSET_SIZE; x++) {
        if (inner(x, y)) {
          // The gate itself: cobalt, banded so it reads as energy not glass.
          const band = (y + Math.abs(x - 32)) % 9
          buf.set(x, y, band < 2 ? C.lightBlue : band < 6 ? C.cobalt : C.cobaltShadow)
        } else if (outer(x, y)) {
          const dx = x - 32
          buf.set(x, y, dx < -12 ? C.stoneLight : dx > 12 ? C.stoneShadow : C.stoneMid)
        }
      }
    }
    // Keystone + a couple of pale motes so the gate looks awake.
    buf.rect(29, 10, 6, 4, C.stoneLight)
    buf.set(26, 34, C.paleBlue)
    buf.set(38, 27, C.paleBlue)
    buf.set(33, 45, C.paleBlue)
  })

  propCanvas(scene, TextureKeys.sign, (buf) => {
    buf.rect(23, 36, 3, 20, C.woodDark) // posts
    buf.rect(38, 36, 3, 20, C.woodDark)
    buf.rect(23, 36, 1, 20, C.woodLight)
    buf.rect(38, 36, 1, 20, C.woodLight)
    buf.rect(16, 22, 32, 17, C.woodLight) // board
    buf.rect(16, 22, 32, 2, C.stoneLight)
    buf.rect(16, 37, 32, 2, C.woodDark)
    for (let i = 0; i < 3; i++) buf.rect(20, 27 + i * 3, 24 - i * 5, 1, C.woodDark)
  })

  propCanvas(scene, TextureKeys.liveSign, (buf) => {
    buf.rect(23, 40, 3, 16, C.woodDark)
    buf.rect(38, 40, 3, 16, C.woodDark)
    buf.rect(23, 40, 1, 16, C.woodLight)
    buf.rect(38, 40, 1, 16, C.woodLight)
    buf.rect(12, 16, 40, 24, C.ink) // dark board so the red dot reads
    buf.rect(13, 17, 38, 1, C.stoneShadow)
    buf.ellipse(20, 28, 4, 4, C.liveRed)
    buf.ellipse(19, 27, 2, 2, C.stoneLight)
  })

  // "LIVE" is baked in with the same bitmap font the rest of the game uses,
  // so the sign and the [E] prompt share a typeface. Skipped entirely if real
  // art replaced the sign, since that art will carry its own lettering.
  const liveTexture = scene.textures.get(TextureKeys.liveSign)
  if (liveTexture instanceof Phaser.Textures.CanvasTexture) {
    const liveCtx = liveTexture.getContext()
    liveCtx.imageSmoothingEnabled = false
    const { width } = measureText('LIVE', 1)
    drawText(liveCtx, 'LIVE', 38 - Math.round(width / 2), 25, 1, C.stoneLight)
    liveTexture.refresh()
  }
}

// ------------------------------------------------------------------- character
// A 4x4 sheet of 64x64 frames. Rows are directions, columns are the walk cycle:
//   row 0 down, 1 left, 2 right, 3 up
//   col 0 idle, 1 step A, 2 idle, 3 step B
// Real art must ship in exactly this layout (see docs/ART_BIBLE.md).

export const PLAYER_COLUMNS = 4
export const PLAYER_ROWS = 4

type Facing = 'down' | 'left' | 'right' | 'up'
const FACINGS: Facing[] = ['down', 'left', 'right', 'up']

function drawPlayerFrame(buf: PixelBuffer, facing: Facing, step: number): void {
  // step: 0 and 2 idle, 1 left foot forward, 3 right foot forward.
  const moving = step === 1 || step === 3
  const bob = moving ? -1 : 0
  const side = facing === 'left' ? -1 : facing === 'right' ? 1 : 0

  // Legs first so the tunic overlaps them.
  const legY = 51
  const front = step === 1 ? -1 : step === 3 ? 1 : 0
  buf.rect(27, legY + (front < 0 ? -1 : 0), 4, 5, C.ink)
  buf.rect(33, legY + (front > 0 ? -1 : 0), 4, 5, C.ink)
  buf.rect(27, 55, 4, 1, C.stoneShadow)
  buf.rect(33, 55, 4, 1, C.stoneShadow)

  // Torso — the cobalt hoodie is the one piece of brand colour on the player.
  const ty = 39 + bob
  buf.rect(25 + side, ty, 14, 13, C.cobalt)
  buf.rect(25 + side, ty, 4, 13, C.lightBlue) // lit edge, upper-left
  buf.rect(35 + side, ty, 4, 13, C.cobaltShadow)
  buf.rect(25 + side, ty + 11, 14, 2, C.cobaltShadow)

  // Arms.
  buf.rect(22 + side, ty + 2, 3, 8, C.cobalt)
  buf.rect(39 + side, ty + 2, 3, 8, C.cobaltShadow)

  // Head.
  const hy = 27 + bob
  buf.rect(26 + side, hy, 12, 13, C.stoneLight)
  buf.rect(26 + side, hy, 4, 13, C.paleBlue)
  buf.rect(26 + side, hy, 12, 4, C.ink) // hair
  buf.rect(26 + side, hy, 2, 8, C.ink)
  buf.rect(36 + side, hy, 2, 8, C.ink)

  if (facing === 'down') {
    buf.rect(29, hy + 7, 2, 2, C.ink)
    buf.rect(34, hy + 7, 2, 2, C.ink)
  } else if (facing === 'up') {
    buf.rect(26, hy, 12, 11, C.ink) // back of the head is all hair
  } else {
    const eyeX = facing === 'left' ? 28 : 34
    buf.rect(eyeX, hy + 7, 2, 2, C.ink)
    // Push the hair across so the profile reads directionally.
    buf.rect(facing === 'left' ? 24 : 36, hy, 4, 9, C.ink)
  }
}

function generatePlayer(scene: Phaser.Scene): void {
  const sheetWidth = ASSET_SIZE * PLAYER_COLUMNS
  const sheetHeight = ASSET_SIZE * PLAYER_ROWS
  const made = canvasFor(scene, TextureKeys.player, sheetWidth, sheetHeight)
  if (!made) return
  const { texture, ctx } = made

  FACINGS.forEach((facing, row) => {
    for (let col = 0; col < PLAYER_COLUMNS; col++) {
      const buf = new PixelBuffer(ASSET_SIZE, ASSET_SIZE)
      drawPlayerFrame(buf, facing, col)
      buf.outline(C.ink)
      buf.blit(ctx, col * ASSET_SIZE, row * ASSET_SIZE)
    }
  })
  texture.refresh()

  // Register the grid as numbered frames so animations can address them.
  for (let i = 0; i < PLAYER_COLUMNS * PLAYER_ROWS; i++) {
    texture.add(
      i,
      0,
      (i % PLAYER_COLUMNS) * ASSET_SIZE,
      Math.floor(i / PLAYER_COLUMNS) * ASSET_SIZE,
      ASSET_SIZE,
      ASSET_SIZE,
    )
  }
}

// -------------------------------------------------------------------- effects

/**
 * A hard-stepped light pool. Quantised to five alpha bands so it stays pixel
 * art rather than a soft radial gradient — tinted and additively blended at
 * runtime for lanterns (amber) and the portal (cobalt).
 */
function generateLight(scene: Phaser.Scene): void {
  const size = 128
  const made = canvasFor(scene, TextureKeys.light, size, size)
  if (!made) return
  const { texture, ctx } = made
  const centre = size / 2
  const bands: [number, number][] = [
    [0.3, 0.95],
    [0.5, 0.66],
    [0.68, 0.42],
    [0.84, 0.22],
    [1.0, 0.09],
  ]
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const d = Math.hypot(x + 0.5 - centre, y + 0.5 - centre) / centre
      const band = bands.find(([edge]) => d <= edge)
      if (!band) continue
      ctx.fillStyle = `rgba(255,255,255,${band[1]})`
      ctx.fillRect(x, y, 1, 1)
    }
  }
  texture.refresh()
}

/** A flat contact shadow. Hard edge, no blur — see the art bible. */
function generateShadow(scene: Phaser.Scene): void {
  const width = 22
  const height = 9
  const made = canvasFor(scene, TextureKeys.shadow, width, height)
  if (!made) return
  const { texture, ctx } = made
  const buf = new PixelBuffer(width, height)
  buf.ellipse(width / 2 - 0.5, height / 2 - 0.5, width / 2 - 1, height / 2 - 1, C.ink)
  buf.blit(ctx)
  texture.refresh()
}

/**
 * Builds every placeholder texture. Called once from BootScene.
 *
 * TODO(art): when real assets land, replace each call with a `this.load.*` in
 * BootScene.preload and delete the corresponding generator.
 */
export function generatePlaceholderTextures(scene: Phaser.Scene): void {
  generateTileset(scene)
  generateProps(scene)
  generatePlayer(scene)
  generateLight(scene)
  generateShadow(scene)
}
