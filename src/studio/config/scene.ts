/**
 * The single source of truth for everything spatial in the studio.
 *
 * All geometry is expressed in **normalised 0..1 coordinates** relative to the
 * room image, never in pixels. The room is rendered with `cover` into whatever
 * viewport it gets, and every hotspot, standing point and walkable edge is
 * projected through the same transform — so one set of numbers is correct at
 * 1366×768, 1920×1080 and everything between.
 *
 * If a hotspot sits slightly off the furniture, this file is the only place
 * that needs touching. Run the dev calibration overlay (`?calibrate=1`) to read
 * coordinates straight off the room under the cursor.
 */

export const ASSETS = {
  room: '/assets/studio/studio-master.png',
  pcCloseup: '/assets/studio/pc-closeup-green.png',
  player: '/assets/studio/player.png',
} as const

/**
 * Native size of the source artwork. Everything is laid out in this coordinate
 * space and the whole stage is then scaled to the viewport, so children can use
 * plain pixel positions here and stay correct at every resolution.
 */
export const SCENE_WIDTH = 1672
export const SCENE_HEIGHT = 941

/**
 * The green rectangle inside `pc-closeup-green.png`, as a fraction of that
 * image. The OS layer is positioned exactly here, which is why no green is ever
 * visible in the finished site.
 *
 * MEASURED from the shipped PNG, not estimated: the key region spans pixels
 * (271, 71) to (1460, 692) — 1190 × 622 — and fills 99.88% of that box, so it
 * is a clean solid rectangle. Re-run the `?calibrate=1` overlay if the artwork
 * is ever regenerated.
 */
export const MONITOR_RECT = {
  x: 0.1621,
  y: 0.0755,
  width: 0.7117,
  height: 0.661,
} as const

/** Where the character stands, and what it walks around. */
export interface Point {
  x: number
  y: number
}

/**
 * The clear central wooden floor. The character is confined to this polygon so
 * it can never walk through the couch, the desks or the balcony rail.
 *
 * PROVISIONAL — traced by eye from the supplied room. Re-trace with the
 * calibration overlay once the real image is in place.
 */
export const WALKABLE_FLOOR: Point[] = [
  { x: 0.340, y: 0.625 },
  { x: 0.500, y: 0.475 },
  { x: 0.660, y: 0.445 },
  { x: 0.725, y: 0.550 },
  { x: 0.690, y: 0.700 },
  { x: 0.480, y: 0.765 },
]

/** Lower-centre of the floor, per the brief. */
export const PLAYER_START: Point = { x: 0.520, y: 0.690 }

export type HotspotId = 'pc' | 'atlaz' | 'photography'

/** Object bounds inside the master image's native 1672x941 pixel space. */
export interface Bounds {
  left: number
  top: number
  width: number
  height: number
}

export interface Hotspot {
  id: HotspotId
  /** Shown on hover, in the small pixel tooltip. */
  label: string
  /**
   * The two overlay layers for this object.
   *
   * Both are full-canvas 1672x941 PNGs cut from the master composition, so they
   * are drawn at the stage origin at native size and inherit exactly the same
   * transform as the room itself. That is what makes drift impossible at any
   * viewport size — there is no separate crop rect to keep in step.
   *
   * `highlight` points at the derived *-highlight-alpha.png, which has the pale
   * yellow halo stripped. Regenerate with `node scripts/build-highlight-alpha.mjs`.
   */
  layers: { normal: string; highlight: string }
  /**
   * Where the object actually sits, for anchoring the tooltip and the keyboard
   * focus target. MEASURED from the asset alpha by
   * `node scripts/inspect-overlays.mjs` — not estimated.
   */
  bounds: Bounds
  /** Where the character stops before the hotspot opens. Must be inside WALKABLE_FLOOR. */
  standing: Point
  /** Which way the character faces once it arrives. */
  facing: 'left' | 'right' | 'up' | 'down'
}

/**
 * Painter order: later entries sit on top and win the hit test where objects
 * overlap. The camera tripod is listed last because it stands in front of the
 * balcony, nearest the viewer.
 */
export const HOTSPOTS: Hotspot[] = [
  {
    id: 'pc',
    label: 'MRFINNERTYTV OS',
    layers: {
      normal: '/assets/studio/desk.png',
      highlight: '/assets/studio/desk-highlight-alpha.png',
    },
    bounds: { left: 132, top: 195, width: 561, height: 348 },
    standing: { x: 0.378, y: 0.618 },
    facing: 'left',
  },
  {
    id: 'atlaz',
    label: 'ATLAZ',
    layers: {
      normal: '/assets/studio/atlaz.png',
      highlight: '/assets/studio/atlaz-highlight-alpha.png',
    },
    bounds: { left: 1163, top: 354, width: 498, height: 351 },
    standing: { x: 0.702, y: 0.612 },
    facing: 'right',
  },
  {
    id: 'photography',
    label: 'PHOTOGRAPHY',
    layers: {
      normal: '/assets/studio/camera.png',
      highlight: '/assets/studio/camera-highlight-alpha.png',
    },
    bounds: { left: 1091, top: 211, width: 105, height: 221 },
    standing: { x: 0.632, y: 0.500 },
    facing: 'up',
  },
]

/** Crossfade duration for the hover swap, in ms. */
export const HOVER_FADE_MS = 170

/**
 * External destinations. Kept here so they can be changed without touching a
 * component — the photography portfolio does not exist yet and is expected to
 * be filled in later.
 */
export const LINKS = {
  atlaz: 'https://atlazmusic.be',
  /** TODO(links): replace when the photography portfolio ships. */
  photography: null as string | null,
} as const

/**
 * Ambient animation layers. Each is an absolutely positioned loop over the
 * room, with its own randomised idle delay so they never fall into sync.
 * Positions are normalised room space, sizes are a fraction of room width.
 */
export interface AmbientLayer {
  id: string
  at: Point
  /** Width as a fraction of the room; height follows the sprite's aspect. */
  scale: number
  /** Seconds between loop plays, randomised within this range. */
  idleRange: [number, number]
}

export const AMBIENT: AmbientLayer[] = [
  { id: 'cat', at: { x: 0.30, y: 0.79 }, scale: 0.045, idleRange: [4, 11] },
  { id: 'plant-balcony', at: { x: 0.635, y: 0.36 }, scale: 0.055, idleRange: [3, 7] },
  { id: 'plant-hanging', at: { x: 0.545, y: 0.05 }, scale: 0.05, idleRange: [5, 9] },
  { id: 'plant-corner', at: { x: 0.045, y: 0.66 }, scale: 0.07, idleRange: [4, 8] },
  { id: 'pc-led', at: { x: 0.175, y: 0.50 }, scale: 0.018, idleRange: [2, 4] },
  { id: 'dust', at: { x: 0.60, y: 0.30 }, scale: 0.16, idleRange: [7, 14] },
]

/** Movement tuning, in fractions of room width per second. */
export const WALK_SPEED = 0.085

/** Milliseconds for the studio → monitor zoom. */
export const ZOOM_MS = 420
