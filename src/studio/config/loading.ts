import { ASSETS, HOTSPOTS } from './scene'

/** The coin face, exported from the Sun Coin design project. */
export const COIN_LOGO = '/assets/studio/sun-coin.png'

/** Rendered size of the coin on the loading screen, px. Small and centred. */
export const COIN_SIZE = 96

/**
 * Everything that must be decoded before the studio is revealed.
 *
 * The room and the close-up are ~3.8MB between them, and the six hover overlay
 * layers add ~1.6MB more. Without waiting for all of it the room paints in
 * pieces and the hover art arrives late, so the whole set is gated here.
 */
export const PRELOAD_SOURCES: string[] = [
  COIN_LOGO,
  ASSETS.room,
  ASSETS.pcCloseup,
  ...HOTSPOTS.flatMap((h) => [h.layers.normal, h.layers.highlight]),
]

/**
 * Cycled while loading. In-world rather than technical — nobody needs to read
 * "hydrating bundle" on the way into a pixel-art studio.
 */
export const LOADING_LINES: string[] = [
  'WAKING THE VALLEY',
  'UNTANGLING THE CABLES',
  'WARMING UP THE DECKS',
  'FOCUSING THE CAMERA',
  'FEEDING THE CAT',
  'POURING THE COFFEE',
  'CHECKING THE LEVELS',
  'OPENING THE BALCONY',
  'DUSTING THE MONITORS',
  'FINDING THE GOOD MIC',
]

/** How long each line stays up, ms. */
export const LINE_INTERVAL_MS = 850

/**
 * How long the screen holds after everything has decoded, ms. A beat so the
 * screen reads as finishing rather than blinking out — not an artificial wait,
 * since it only starts once loading is genuinely done.
 */
export const REVEAL_HOLD_MS = 520

/** Fade-out of the loading screen, ms. Must match `--reveal-fade` usage. */
export const REVEAL_FADE_MS = 460
