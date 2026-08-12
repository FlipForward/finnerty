/**
 * Everything the OS displays, in one place.
 *
 * The OS renders inside the monitor's screen rectangle, which is always exactly
 * SCREEN_WIDTH x SCREEN_HEIGHT logical pixels regardless of viewport — the whole
 * stage is uniformly scaled, so 1366x768 and 1920x1080 differ only by scale
 * factor. Layout is therefore designed once against these numbers and can never
 * reflow or scroll at desktop sizes.
 */

export const SCREEN_WIDTH = 1190
export const SCREEN_HEIGHT = 622

export type AppId = 'live' | 'clips' | 'play' | 'about'

export interface AppDef {
  id: AppId
  /** Dock label and window title strip. */
  name: string
  /** Big display heading inside the window. */
  heading: string
  /** Drawn as pixel geometry, not an icon font — see Dock in Os.tsx. */
  glyph: AppId
}

export const APPS: AppDef[] = [
  { id: 'live', name: 'LIVE', heading: 'LIVE NOW', glyph: 'live' },
  { id: 'clips', name: 'CLIPS', heading: 'CLIPS', glyph: 'clips' },
  { id: 'play', name: 'PLAY', heading: 'PLAY', glyph: 'play' },
  { id: 'about', name: 'ABOUT', heading: 'ABOUT', glyph: 'about' },
]

export const DEFAULT_APP: AppId = 'live'

/**
 * Twitch channel. Public login name, not a secret.
 *
 * `parent` is derived from window.location.hostname at render time rather than
 * configured here, so one build works on localhost, previews and production.
 */
export const TWITCH_CHANNEL = import.meta.env.VITE_TWITCH_CHANNEL?.trim() ?? ''

export interface ClipDef {
  id: string
  title: string
  /** Free text — shown under the title. */
  meta: string
  duration: string
  /**
   * Replace with a real thumbnail path to swap the generated pixel pattern for
   * artwork. Nothing else needs changing.
   */
  thumbnail: string | null
  /** Replace with a real clip URL; null keeps the internal preview modal. */
  url: string | null
}

/** TODO(content): swap for real clips. Order is the display order. */
export const CLIPS: ClipDef[] = [
  {
    id: 'clip-01',
    title: 'ONE-TAP AND A LONG SILENCE',
    meta: 'Valorant · last week',
    duration: '0:42',
    thumbnail: null,
    url: null,
  },
  {
    id: 'clip-02',
    title: 'CHAT PICKS THE SETLIST',
    meta: 'Just Chatting · last month',
    duration: '1:18',
    thumbnail: null,
    url: null,
  },
  {
    id: 'clip-03',
    title: 'THE 4AM BUILD THAT WORKED',
    meta: 'Late stream · last month',
    duration: '2:05',
    thumbnail: null,
    url: null,
  },
]

export interface SocialDef {
  id: string
  label: string
  /** Shown next to the label. Kept short. */
  handle: string
  /** null renders as a dim, non-interactive row — never a fake button. */
  href: string | null
}

/** TODO(links): fill in the nulls as the accounts are confirmed. */
export const SOCIALS: SocialDef[] = [
  {
    id: 'twitch',
    label: 'TWITCH',
    handle: TWITCH_CHANNEL ? `/${TWITCH_CHANNEL}` : '—',
    href: TWITCH_CHANNEL ? `https://www.twitch.tv/${encodeURIComponent(TWITCH_CHANNEL)}` : null,
  },
  { id: 'atlaz', label: 'ATLAZ', handle: 'atlazmusic.be', href: 'https://atlazmusic.be' },
  { id: 'instagram', label: 'INSTAGRAM', handle: 'not linked yet', href: null },
  { id: 'youtube', label: 'YOUTUBE', handle: 'not linked yet', href: null },
  { id: 'contact', label: 'CONTACT', handle: 'not linked yet', href: null },
]

export const ABOUT = {
  name: 'FINN VANGRONSVELD',
  role: 'Streamer, creator, DJ/producer.',
  blurb:
    'Streams out of Flanders. Variety on Twitch, clips when they are worth keeping, and music under ATLAZ from the decks in the corner of this room.',
} as const

/** App switch crossfade, ms. Fast and flat — no bounce. */
export const APP_FADE_MS = 180
