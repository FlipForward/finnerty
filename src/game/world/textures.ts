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
 * correctly while the real art is being made.
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
 * wide path read as a brick wall from this top-down angle, so the stones only
 * catch a single lit pixel on their upper-left edge.
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

/**
 * Darker dressed stone. Used for the gate dais and the short aisle leading to
 * it, so the plaza reads as two-tone architecture that points at the gate.
 *
 * Carries no blue at all, on purpose. An earlier version inlaid cobalt here
 * and the plaza floor turned into a field of blue dots — in the arrival plaza
 * the portal and the two banners should be the only blue there is.
 */
function tileAccent(buf: PixelBuffer): void {
  buf.rect(0, 0, TILE_SIZE, TILE_SIZE, C.stoneMid)
  buf.rect(0, 0, TILE_SIZE, 1, C.stoneShadow)
  buf.rect(0, 0, 1, TILE_SIZE, C.stoneShadow)
  buf.rect(0, 7, TILE_SIZE, 1, C.stoneShadow)
  buf.rect(7, 0, 1, TILE_SIZE, C.stoneShadow)
  // Lit upper-left corner of each quarter-slab.
  for (const [x, y] of [[1, 1], [9, 1], [1, 9], [9, 9]]) {
    buf.rect(x, y, 6, 1, C.stoneLight)
    buf.rect(x, y, 1, 6, C.stoneLight)
  }
  buf.set(4, 12, C.stoneShadow)
  buf.set(13, 4, C.stoneShadow)
}

/** Timber decking for the live platform over the water. */
function tileDeck(buf: PixelBuffer): void {
  buf.rect(0, 0, TILE_SIZE, TILE_SIZE, C.woodLight)
  for (const y of [0, 5, 10, 15]) buf.rect(0, y, TILE_SIZE, 1, C.woodDark)
  for (const y of [1, 6, 11]) buf.rect(0, y, TILE_SIZE, 1, C.stoneLight)
  buf.rect(7, 0, 1, TILE_SIZE, C.woodDark)
  for (const [x, y] of [[3, 3], [11, 8], [4, 13]]) buf.set(x, y, C.stoneShadow)
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
  buf.rect(0, 0, TILE_SIZE, 2, C.stoneMid)
  buf.rect(0, 0, 2, TILE_SIZE, C.stoneMid)
  buf.rect(0, 0, TILE_SIZE, 1, C.stoneLight)
  // Broken cracks rather than a full-width course line: an unbroken horizontal
  // rule every 16px turned the whole cliff into brickwork and fought the
  // MRFINNERTYTV lettering sitting on top of it.
  buf.rect(0, 7, 5, 1, C.ink)
  buf.rect(9, 7, 7, 1, C.ink)
  buf.rect(6, 2, 1, 4, C.ink)
  buf.rect(11, 9, 1, 6, C.ink)
  buf.rect(3, 10, 1, 3, C.ink)
  buf.set(13, 4, C.stoneShadow)
  buf.set(7, 12, C.stoneShadow)
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
    tileAccent,
    tileDeck,
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

/** One tapered conifer tier: rows widen toward the base. */
function pineTier(buf: PixelBuffer, top: number, bottom: number, halfWidthAtBase: number): void {
  const rows = bottom - top
  for (let i = 0; i <= rows; i++) {
    const y = top + i
    const half = Math.round((i / rows) * halfWidthAtBase)
    for (let x = 32 - half; x <= 32 + half; x++) {
      // Light from the upper-left: the left flank of each tier catches it.
      const t = (x - (32 - half)) / Math.max(1, half * 2)
      buf.set(x, y, t < 0.28 ? C.grassMid : t > 0.72 ? C.grassShadow : C.grassShadow)
    }
    // A lit ridge down the left edge keeps the tiers readable against each other.
    buf.set(32 - half, y, C.grassMid)
    if (half > 2) buf.set(32 - half + 1, y, C.grassMid)
  }
  buf.rect(32 - halfWidthAtBase, bottom, halfWidthAtBase * 2 + 1, 1, C.grassShadow)
}

function generateProps(scene: Phaser.Scene): void {
  // Broadleaf: three offset masses rather than one oval, so it never reads as
  // a lollipop. This is the common tree, so its silhouette matters most.
  propCanvas(scene, TextureKeys.tree, (buf) => {
    buf.rect(29, 38, 6, 18, C.woodDark)
    buf.rect(29, 38, 2, 18, C.woodLight)
    buf.ellipseShaded(33, 24, 16, 19, C.grassLight, C.grassMid, C.grassShadow)
    buf.ellipseShaded(24, 33, 10, 11, C.grassLight, C.grassMid, C.grassShadow)
    buf.ellipseShaded(41, 34, 8, 9, C.grassLight, C.grassMid, C.grassShadow)
  })

  // Conifer: a tall, hard-edged triangular silhouette. Its whole job is to be
  // unmistakably NOT the broadleaf at a glance.
  propCanvas(scene, TextureKeys.pine, (buf) => {
    buf.rect(30, 46, 4, 10, C.woodDark)
    buf.rect(30, 46, 1, 10, C.woodLight)
    pineTier(buf, 6, 22, 9)
    pineTier(buf, 18, 36, 13)
    pineTier(buf, 32, 50, 17)
  })

  propCanvas(scene, TextureKeys.bush, (buf) => {
    buf.ellipseShaded(32, 45, 13, 10, C.grassLight, C.grassMid, C.grassShadow)
    buf.ellipseShaded(24, 49, 7, 6, C.grassLight, C.grassMid, C.grassShadow)
  })

  propCanvas(scene, TextureKeys.boulder, (buf) => {
    buf.ellipseShaded(32, 46, 13, 10, C.stoneLight, C.stoneMid, C.stoneShadow)
    buf.ellipseShaded(43, 52, 6, 4, C.stoneLight, C.stoneMid, C.stoneShadow)
    buf.rect(26, 44, 6, 1, C.stoneShadow) // a bedding crack
  })

  propCanvas(scene, TextureKeys.stone, (buf) => {
    buf.ellipseShaded(32, 52, 7, 4, C.stoneLight, C.stoneMid, C.stoneShadow)
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

  // Flight-case style crate: the streamer-kit detail, kept plain so the deck
  // reads as "gear lives here", not as an industrial yard.
  propCanvas(scene, TextureKeys.crate, (buf) => {
    buf.rect(20, 34, 24, 22, C.woodLight)
    buf.rect(20, 34, 24, 3, C.stoneLight) // lit top edge
    buf.rect(20, 34, 3, 22, C.stoneLight)
    buf.rect(41, 34, 3, 22, C.woodDark)
    buf.rect(20, 53, 24, 3, C.woodDark)
    // Corner braces and a strap.
    buf.rect(20, 34, 5, 5, C.woodDark)
    buf.rect(39, 34, 5, 5, C.woodDark)
    buf.rect(20, 51, 5, 5, C.woodDark)
    buf.rect(39, 51, 5, 5, C.woodDark)
    buf.rect(30, 34, 4, 22, C.woodDark)
    buf.rect(30, 34, 1, 22, C.stoneLight)
    // A small cobalt stencil so the kit belongs to this world.
    buf.rect(25, 43, 4, 4, C.cobalt)
    buf.set(25, 43, C.lightBlue)
  })

  // Cobalt standing banner: the "subtle blue signage" that marks the plaza and
  // the deck as the same operation.
  propCanvas(scene, TextureKeys.banner, (buf) => {
    buf.rect(30, 30, 4, 26, C.woodDark) // pole
    buf.rect(30, 30, 1, 26, C.woodLight)
    buf.rect(26, 52, 12, 4, C.stoneShadow) // foot
    buf.rect(26, 52, 12, 1, C.stoneMid)
    // A narrow hanging pennant, not a road sign. The mark is a plain bar and
    // stud — a chevron at this size reads as a directional arrow.
    buf.rect(25, 10, 14, 24, C.cobalt)
    buf.rect(25, 10, 2, 24, C.lightBlue)
    buf.rect(37, 10, 2, 24, C.cobaltShadow)
    buf.rect(25, 10, 14, 2, C.stoneLight) // header bar
    buf.rect(29, 17, 6, 2, C.stoneLight)
    buf.rect(31, 21, 2, 2, C.stoneLight)
    buf.rect(29, 25, 6, 2, C.stoneLight)
    // Pennant tail.
    buf.rect(25, 34, 4, 2, C.cobaltShadow)
    buf.rect(35, 34, 4, 2, C.cobaltShadow)
  })

  propCanvas(scene, TextureKeys.flowers, (buf) => {
    const blooms: [number, number, string][] = [
      [26, 48, C.stoneLight],
      [32, 45, C.amber],
      [38, 49, C.paleBlue],
      [30, 51, C.amber],
    ]
    for (const [x, y, color] of blooms) {
      buf.rect(x, y + 2, 1, 5, C.grassShadow) // stem
      buf.rect(x - 1, y, 3, 2, color)
      buf.set(x - 1, y, C.stoneLight)
    }
    buf.rect(25, 54, 15, 1, C.grassShadow)
  })

  propCanvas(scene, TextureKeys.weeds, (buf) => {
    const blades: [number, number, number][] = [
      [27, 49, 7],
      [30, 46, 10],
      [33, 48, 8],
      [36, 50, 6],
    ]
    for (const [x, y, h] of blades) {
      buf.rect(x, y, 1, h, C.grassShadow)
      buf.set(x, y, C.grassLight)
    }
    buf.rect(26, 55, 12, 1, C.grassShadow)
  })

  // A coiled cable run: flat set dressing near the live deck.
  propCanvas(scene, TextureKeys.cable, (buf) => {
    buf.ellipse(32, 51, 11, 5, C.ink)
    buf.ellipse(32, 51, 7, 3, C.stoneShadow)
    buf.ellipse(32, 50, 4, 2, C.ink)
    buf.rect(22, 49, 3, 1, C.stoneShadow) // lit top of the coil
    buf.rect(40, 53, 4, 1, C.ink)
  })

  // The gate: a heavy stone arch with a calm field inside it. Deliberately
  // unbusy — it is the first thing a visitor sees, so it should read as
  // architecture rather than as an effect.
  propCanvas(scene, TextureKeys.portal, (buf) => {
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
    const outer = arch(21, 8, 56)
    const inner = arch(13, 20, 56)

    for (let y = 0; y < ASSET_SIZE; y++) {
      for (let x = 0; x < ASSET_SIZE; x++) {
        if (inner(x, y)) {
          // Three flat bands, brightest down the centre. No chevrons, no
          // animation: a steady light, not a special effect.
          const dx = Math.abs(x - 32)
          buf.set(x, y, dx < 4 ? C.lightBlue : dx < 9 ? C.cobalt : C.cobaltShadow)
        } else if (outer(x, y)) {
          const dx = x - 32
          buf.set(x, y, dx < -13 ? C.stoneLight : dx > 13 ? C.stoneShadow : C.stoneMid)
        }
      }
    }
    // Masonry courses across the frame so it reads as cut blocks.
    for (const y of [16, 26, 36, 46]) {
      for (let x = 8; x < 56; x++) if (outer(x, y) && !inner(x, y)) buf.set(x, y, C.stoneShadow)
    }
    buf.rect(28, 8, 8, 5, C.stoneLight) // keystone
    buf.rect(28, 8, 8, 1, C.stoneMid)
    // A few pale motes so the field looks awake without moving.
    for (const [x, y] of [[27, 34], [37, 27], [32, 45], [29, 50]]) buf.set(x, y, C.paleBlue)
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

/**
 * Adult proportions on purpose: the head is roughly a quarter of the figure,
 * not a third. Chibi head-to-body ratios were the single biggest thing making
 * the old placeholder read as a mobile game.
 */
function drawPlayerFrame(buf: PixelBuffer, facing: Facing, step: number): void {
  const moving = step === 1 || step === 3
  const bob = moving ? -1 : 0
  const side = facing === 'left' ? -1 : facing === 'right' ? 1 : 0
  const narrow = side !== 0 ? 2 : 0 // profiles are slimmer than front/back

  // --- legs (drawn first so the coat overlaps them) ---
  const stride = step === 1 ? -1 : step === 3 ? 1 : 0
  buf.rect(28, 46 + (stride < 0 ? -1 : 0), 4, 10, C.ink)
  buf.rect(33, 46 + (stride > 0 ? -1 : 0), 4, 10, C.ink)
  buf.rect(27, 53, 5, 3, C.ink) // boots
  buf.rect(33, 53, 5, 3, C.ink)
  buf.rect(27, 53, 5, 1, C.stoneShadow)
  buf.rect(33, 53, 5, 1, C.stoneShadow)

  // --- torso: a long cobalt coat, the one piece of brand colour ---
  const ty = 34 + bob
  const tx = 26 + side + narrow / 2
  const tw = 13 - narrow
  buf.rect(tx, ty, tw, 13, C.cobalt)
  buf.rect(tx, ty, 3, 13, C.lightBlue) // lit edge, upper-left
  buf.rect(tx + tw - 3, ty, 3, 13, C.cobaltShadow)
  buf.rect(tx, ty + 11, tw, 2, C.cobaltShadow) // hem
  buf.rect(tx + 1, ty, tw - 2, 2, C.stoneLight) // cream collar

  // --- arms ---
  buf.rect(tx - 3, ty + 3, 3, 9, C.cobalt)
  buf.rect(tx + tw, ty + 3, 3, 9, C.cobaltShadow)

  // --- head ---
  const hy = 25 + bob
  const hx = 28 + side
  buf.rect(hx, hy, 9, 10, C.stoneLight) // face
  buf.rect(hx, hy, 3, 10, C.paleBlue) // lit side
  buf.rect(hx, hy, 9, 4, C.ink) // hair
  buf.rect(hx, hy, 2, 7, C.ink)
  buf.rect(hx + 7, hy, 2, 7, C.ink)

  if (facing === 'down') {
    buf.rect(hx + 2, hy + 6, 2, 2, C.ink)
    buf.rect(hx + 5, hy + 6, 2, 2, C.ink)
  } else if (facing === 'up') {
    buf.rect(hx, hy, 9, 9, C.ink) // back of the head is all hair
  } else {
    buf.rect(facing === 'left' ? hx : hx + 6, hy, 3, 8, C.ink) // hair sweep
    buf.rect(facing === 'left' ? hx + 3 : hx + 4, hy + 6, 2, 2, C.ink) // one eye
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
