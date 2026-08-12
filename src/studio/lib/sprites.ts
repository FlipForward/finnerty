/**
 * Procedural placeholder sprites, drawn once into data URLs.
 *
 * The room and the monitor close-up are finished artwork; the character and the
 * cat are not, and are explicitly placeholders. They are generated here rather
 * than shipped as files so there is no half-real asset to mistake for final
 * art — dropping `studio/player.png` in and pointing ASSETS.player at it
 * replaces the character wholesale.
 *
 * Hard pixels only: fillRect, no gradients, no anti-aliasing.
 */

const INK = '#14202b'
const COBALT = '#2e6eea'
const COBALT_DARK = '#1c4aa8'
const LIGHT_BLUE = '#68a8ff'
const CREAM = '#e0d1b3'
const PALE = '#d6f0ff'
const SHADOW = '#5b5b54'

export const FRAME = 64
export const COLUMNS = 4
export const ROWS = 4
/** Row order in the generated sheet. */
export const FACING_ROW = { down: 0, left: 1, right: 2, up: 3 } as const

function sheetContext(w: number, h: number) {
  const canvas = document.createElement('canvas')
  canvas.width = w
  canvas.height = h
  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('sprites: 2d context unavailable')
  ctx.imageSmoothingEnabled = false
  return { canvas, ctx }
}

type Facing = keyof typeof FACING_ROW

/**
 * One character frame. Adult proportions on purpose — the head is about a
 * quarter of the figure, which keeps it away from chibi/mobile-game shapes.
 */
function drawCharacter(ctx: CanvasRenderingContext2D, ox: number, oy: number, facing: Facing, step: number) {
  const px = (x: number, y: number, w: number, h: number, c: string) => {
    ctx.fillStyle = c
    ctx.fillRect(ox + x, oy + y, w, h)
  }
  const moving = step === 1 || step === 3
  const bob = moving ? -1 : 0
  const side = facing === 'left' ? -1 : facing === 'right' ? 1 : 0
  const narrow = side !== 0 ? 2 : 0
  const stride = step === 1 ? -1 : step === 3 ? 1 : 0

  // legs + boots
  px(28, 46 + (stride < 0 ? -1 : 0), 4, 10, INK)
  px(33, 46 + (stride > 0 ? -1 : 0), 4, 10, INK)
  px(27, 53, 5, 3, INK)
  px(33, 53, 5, 3, INK)
  px(27, 53, 5, 1, SHADOW)
  px(33, 53, 5, 1, SHADOW)

  // coat
  const ty = 34 + bob
  const tx = 26 + side + narrow / 2
  const tw = 13 - narrow
  px(tx, ty, tw, 13, COBALT)
  px(tx, ty, 3, 13, LIGHT_BLUE)
  px(tx + tw - 3, ty, 3, 13, COBALT_DARK)
  px(tx, ty + 11, tw, 2, COBALT_DARK)
  px(tx + 1, ty, tw - 2, 2, CREAM)

  // arms
  px(tx - 3, ty + 3, 3, 9, COBALT)
  px(tx + tw, ty + 3, 3, 9, COBALT_DARK)

  // head
  const hy = 25 + bob
  const hx = 28 + side
  px(hx, hy, 9, 10, CREAM)
  px(hx, hy, 3, 10, PALE)
  px(hx, hy, 9, 4, INK)
  px(hx, hy, 2, 7, INK)
  px(hx + 7, hy, 2, 7, INK)

  if (facing === 'down') {
    px(hx + 2, hy + 6, 2, 2, INK)
    px(hx + 5, hy + 6, 2, 2, INK)
  } else if (facing === 'up') {
    px(hx, hy, 9, 9, INK)
  } else {
    px(facing === 'left' ? hx : hx + 6, hy, 3, 8, INK)
    px(facing === 'left' ? hx + 3 : hx + 4, hy + 6, 2, 2, INK)
  }
}

let characterSheet: string | null = null

/** 4x4 sheet: columns are the walk cycle, rows are down/left/right/up. */
export function characterSheetUrl(): string {
  if (characterSheet) return characterSheet
  const { canvas, ctx } = sheetContext(FRAME * COLUMNS, FRAME * ROWS)
  for (const facing of Object.keys(FACING_ROW) as Facing[]) {
    for (let col = 0; col < COLUMNS; col++) {
      drawCharacter(ctx, col * FRAME, FACING_ROW[facing] * FRAME, facing, col)
    }
  }
  characterSheet = canvas.toDataURL()
  return characterSheet
}

/** A flat contact shadow so the character sits on the floor rather than floating. */
let shadowUrl: string | null = null
export function characterShadowUrl(): string {
  if (shadowUrl) return shadowUrl
  const { canvas, ctx } = sheetContext(24, 10)
  ctx.fillStyle = 'rgba(20,32,43,0.34)'
  for (let y = 0; y < 10; y++) {
    for (let x = 0; x < 24; x++) {
      const nx = (x - 11.5) / 11.5
      const ny = (y - 4.5) / 4.5
      if (nx * nx + ny * ny <= 1) ctx.fillRect(x, y, 1, 1)
    }
  }
  shadowUrl = canvas.toDataURL()
  return shadowUrl
}

/**
 * Sleeping cat, two frames: tail down and tail flicked. Placeholder — the room
 * art has no cat in it, so this is additive rather than matched to the scene.
 */
let catSheet: string | null = null
export const CAT_FRAME = 32
export function catSheetUrl(): string {
  if (catSheet) return catSheet
  const { canvas, ctx } = sheetContext(CAT_FRAME * 3, CAT_FRAME)
  const body = '#2a2f38'
  const light = '#3d4450'
  const dark = '#1a1e24'
  for (let f = 0; f < 3; f++) {
    const ox = f * CAT_FRAME
    const px = (x: number, y: number, w: number, h: number, c: string) => {
      ctx.fillStyle = c
      ctx.fillRect(ox + x, y, w, h)
    }
    // curled body
    px(7, 18, 18, 9, body)
    px(7, 18, 18, 2, light)
    px(7, 25, 18, 2, dark)
    px(5, 20, 3, 6, body)
    // head, turned on the third frame
    const headX = f === 2 ? 20 : 18
    px(headX, 14, 8, 7, body)
    px(headX, 14, 8, 2, light)
    px(headX + 1, 12, 2, 3, body) // ears
    px(headX + 5, 12, 2, 3, body)
    px(headX + 2, 17, 1, 1, dark)
    px(headX + 5, 17, 1, 1, dark)
    // tail: flicked on frame 1
    if (f === 1) {
      px(3, 16, 5, 2, body)
      px(2, 14, 2, 3, body)
    } else {
      px(2, 22, 6, 2, body)
      px(2, 22, 2, 2, dark)
    }
  }
  catSheet = canvas.toDataURL()
  return catSheet
}
