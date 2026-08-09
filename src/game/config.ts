/**
 * Central tuning + identity constants for MrFinnertyTV World.
 *
 * Anything an artist or designer might want to change lives here or in
 * `src/game/world/*`, never buried inside a scene.
 */

/** Fixed virtual resolution. The whole game is authored against this and the
 *  canvas is integer-scaled up, so pixels stay square and never blur. */
export const VIRTUAL_WIDTH = 480
export const VIRTUAL_HEIGHT = 270

/** World grid. */
export const TILE_SIZE = 16

/**
 * Asset contract (see docs/ART_BIBLE.md).
 *
 * Every prop/character asset is a 64x64 logical canvas, horizontally centred,
 * standing on a baseline at y=56. Sprites therefore use origin (0.5, 56/64):
 * a sprite's `y` is its ground-contact point, which makes `depth = y` the
 * correct back-to-front sort and makes swapping a placeholder for real art a
 * pure file substitution — no repositioning.
 */
export const ASSET_SIZE = 64
export const ASSET_BASELINE_Y = 56
export const ASSET_ORIGIN_Y = ASSET_BASELINE_Y / ASSET_SIZE

/** Palette. Mirrors docs/ART_BIBLE.md — keep the two in sync. */
export const PALETTE = {
  ink: 0x14202b,
  grassShadow: 0x365e41,
  grassMid: 0x5e9a52,
  grassLight: 0x9bcb68,
  stoneShadow: 0x5b5b54,
  stoneMid: 0x9f9583,
  stoneLight: 0xe0d1b3,
  woodDark: 0x6e442a,
  woodLight: 0xa86e3f,
  cobalt: 0x2e6eea,
  lightBlue: 0x68a8ff,
  paleBlue: 0xd6f0ff,
  lanternAmber: 0xffc45b,
  liveRed: 0xe8564e,

  // Extended set — materials the initial brand palette does not cover.
  // Flagged in docs/ART_BIBLE.md for the artist to confirm or replace.
  waterDeep: 0x1e3a52,
  waterMid: 0x2d5a78,
  waterLight: 0x4a86a8,
  dirtShadow: 0x5a4632,
  dirtMid: 0x7a6047,
  dirtLight: 0x9a7d5c,
  cobaltShadow: 0x1c4aa8,
} as const

/** Movement. Deliberately unhurried: this is a world to wander, not a runner. */
export const PLAYER_SPEED = 66

/** Default proximity radius for interactables, in world pixels. */
export const INTERACT_RANGE = 30

/** Seconds for one full day -> night -> day cycle. */
export const DAY_CYCLE_SECONDS = 300

/** Texture keys. Shipped art loads from `public/assets/`; the Arrival Lodge is
 *  an isolated procedural placeholder until its final 64x64 asset arrives. */
export const TextureKeys = {
  tileset: 'tileset',
  player: 'player',
  tree: 'prop-tree',
  pine: 'prop-pine',
  bush: 'prop-bush',
  boulder: 'prop-boulder',
  stone: 'prop-stone',
  lantern: 'prop-lantern',
  crate: 'prop-crate',
  banner: 'prop-banner',
  flowers: 'prop-flowers',
  weeds: 'prop-weeds',
  cable: 'prop-cable',
  portal: 'prop-portal',
  sign: 'prop-sign',
  liveSign: 'prop-live-sign',
  /** Procedural lodge placeholder. A supplied 64x64 asset can replace it. */
  lodge: 'prop-lodge',
  light: 'fx-light',
  shadow: 'fx-shadow',
} as const

/** Render order. Entities sort against each other by their baseline `y`
 *  (0..worldHeight), so everything above sits well clear of that range. */
export const Depths = {
  ground: 0,
  decal: 4,
  /** Entities occupy 8 .. 8 + worldHeight via `depth = 8 + y`. */
  entities: 8,
  nightOverlay: 9000,
  lights: 9100,
  worldUi: 9300,
} as const
