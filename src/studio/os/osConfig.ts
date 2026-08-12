/**
 * FINN OS — all data in one place.
 *
 * The OS renders inside the monitor's screen rectangle, which is always exactly
 * SCREEN_WIDTH x SCREEN_HEIGHT logical pixels: the whole stage scales
 * uniformly, so 1366x768 and 1920x1080 differ only by scale factor. Window
 * geometry below is therefore authored once against these numbers and cannot
 * break or overflow at another resolution.
 */

export const SCREEN_WIDTH = 1190
export const SCREEN_HEIGHT = 622
export const PANEL_HEIGHT = 30
export const DOCK_HEIGHT = 44
/** Usable desktop between the panel and the dock. */
export const DESK_HEIGHT = SCREEN_HEIGHT - PANEL_HEIGHT - DOCK_HEIGHT

export type AppId =
  | 'browser'
  | 'stream'
  | 'files'
  | 'gallery'
  | 'atlaz'
  | 'game'
  | 'about'
  | 'settings'
  | 'viewer'

/** Public handle, identical on every platform. */
export const HANDLE = 'mrfinnertytv'

/**
 * Twitch channel. Public login name, not a secret. `parent` is derived from
 * window.location.hostname at render time, so one build works on localhost,
 * previews and production without a hardcoded domain.
 */
export const TWITCH_CHANNEL = import.meta.env.VITE_TWITCH_CHANNEL?.trim() ?? HANDLE

export const LINKS = {
  twitch: `https://www.twitch.tv/${HANDLE}`,
  instagram: `https://www.instagram.com/${HANDLE}`,
  youtube: `https://www.youtube.com/@${HANDLE}`,
  atlaz: 'https://atlazmusic.be',
  /** TODO(links): no contact address confirmed yet. */
  contact: null as string | null,
} as const

export interface AppDef {
  id: AppId
  /** Shown in titlebars, the panel and the dock tooltip. */
  name: string
  /** Pixel glyph key — drawn as rects, never an icon font. */
  icon: IconKey
  /** Default window box, in desktop-local logical px. */
  size: { w: number; h: number }
  /** Hidden from the dock; opened by other apps (the file viewer). */
  internal?: boolean
}

export type IconKey =
  | 'browser'
  | 'stream'
  | 'files'
  | 'gallery'
  | 'atlaz'
  | 'game'
  | 'about'
  | 'settings'
  | 'folder'
  | 'doc'
  | 'image'
  | 'music'
  | 'trash'
  | 'home'
  | 'launcher'

/** Every window size fits inside 1190 x 548, so nothing can open off-screen. */
export const APPS: Record<AppId, AppDef> = {
  browser: { id: 'browser', name: 'Browser', icon: 'browser', size: { w: 900, h: 496 } },
  stream: { id: 'stream', name: 'Stream Center', icon: 'stream', size: { w: 930, h: 520 } },
  files: { id: 'files', name: 'Files', icon: 'files', size: { w: 780, h: 452 } },
  gallery: { id: 'gallery', name: 'Gallery', icon: 'gallery', size: { w: 840, h: 480 } },
  atlaz: { id: 'atlaz', name: 'ATLAZ Music', icon: 'atlaz', size: { w: 720, h: 430 } },
  game: { id: 'game', name: 'Game Launcher', icon: 'game', size: { w: 700, h: 410 } },
  about: { id: 'about', name: 'About Finn', icon: 'about', size: { w: 640, h: 430 } },
  settings: { id: 'settings', name: 'Settings', icon: 'settings', size: { w: 580, h: 370 } },
  viewer: { id: 'viewer', name: 'Viewer', icon: 'doc', size: { w: 620, h: 400 }, internal: true },
}

/** Dock order, left to right. The launcher button is rendered separately. */
export const DOCK_APPS: AppId[] = [
  'browser',
  'stream',
  'files',
  'gallery',
  'atlaz',
  'game',
  'settings',
]

export interface ShortcutDef {
  id: string
  label: string
  icon: IconKey
  /** What double-clicking does. */
  opens: { app: AppId; arg?: string }
}

/** Deliberately few — a desktop covered in icons reads as a menu, not a desktop. */
export const SHORTCUTS: ShortcutDef[] = [
  { id: 'home', label: 'Home', icon: 'home', opens: { app: 'files', arg: '/home/finn' } },
  { id: 'projects', label: 'Projects', icon: 'folder', opens: { app: 'files', arg: '/home/finn/Projects' } },
  { id: 'atlaz', label: 'ATLAZ', icon: 'music', opens: { app: 'atlaz' } },
  { id: 'photos', label: 'Photos', icon: 'image', opens: { app: 'gallery' } },
  { id: 'trash', label: 'Trash', icon: 'trash', opens: { app: 'files', arg: '/home/finn/.Trash' } },
]

/* ------------------------------------------------------------------ files */

export interface FsNode {
  name: string
  kind: 'dir' | 'file'
  icon: IconKey
  /** Files only. */
  size?: string
  modified: string
  /** What opening this file does. Directories navigate in place. */
  opens?: { app: AppId; arg?: string }
  /** Shown by the internal viewer for text files. */
  body?: string[]
}

/**
 * The filesystem. Portfolio entries disguised as files — opening one routes to
 * the app that can actually show it.
 */
export const FS: Record<string, FsNode[]> = {
  '/home/finn': [
    { name: 'Projects', kind: 'dir', icon: 'folder', modified: '12 Aug 14:02' },
    { name: 'Music', kind: 'dir', icon: 'folder', modified: '02 Aug 22:15' },
    { name: 'Photography', kind: 'dir', icon: 'folder', modified: '28 Jul 09:41' },
    { name: 'Downloads', kind: 'dir', icon: 'folder', modified: '11 Aug 18:30' },
    { name: 'About', kind: 'dir', icon: 'folder', modified: '01 Jul 12:00' },
    {
      name: 'notes.txt',
      kind: 'file',
      icon: 'doc',
      size: '1.2 kB',
      modified: '12 Aug 08:55',
      opens: { app: 'viewer', arg: '/home/finn/notes.txt' },
    },
  ],
  '/home/finn/Projects': [
    {
      name: 'mrfinnertytv',
      kind: 'dir',
      icon: 'folder',
      modified: '12 Aug 14:02',
    },
    { name: 'PixelPanzer', kind: 'dir', icon: 'folder', modified: '04 Aug 23:10' },
  ],
  '/home/finn/Projects/mrfinnertytv': [
    {
      name: 'README.md',
      kind: 'file',
      icon: 'doc',
      size: '2.4 kB',
      modified: '12 Aug 14:02',
      opens: { app: 'viewer', arg: '/home/finn/Projects/mrfinnertytv/README.md' },
    },
    { name: 'stream', kind: 'dir', icon: 'folder', modified: '12 Aug 10:00' },
  ],
  '/home/finn/Projects/mrfinnertytv/stream': [
    {
      name: 'open-stream.desktop',
      kind: 'file',
      icon: 'stream',
      size: '0.3 kB',
      modified: '12 Aug 10:00',
      opens: { app: 'stream' },
    },
  ],
  '/home/finn/Projects/PixelPanzer': [
    {
      name: 'README.md',
      kind: 'file',
      icon: 'doc',
      size: '1.1 kB',
      modified: '04 Aug 23:10',
      opens: { app: 'viewer', arg: '/home/finn/Projects/PixelPanzer/README.md' },
    },
    {
      name: 'launch.desktop',
      kind: 'file',
      icon: 'game',
      size: '0.3 kB',
      modified: '04 Aug 23:10',
      opens: { app: 'game' },
    },
  ],
  '/home/finn/Music': [{ name: 'ATLAZ', kind: 'dir', icon: 'music', modified: '02 Aug 22:15' }],
  '/home/finn/Music/ATLAZ': [
    {
      name: 'open-atlaz.desktop',
      kind: 'file',
      icon: 'atlaz',
      size: '0.3 kB',
      modified: '02 Aug 22:15',
      opens: { app: 'atlaz' },
    },
  ],
  '/home/finn/Photography': [
    {
      name: 'open-gallery.desktop',
      kind: 'file',
      icon: 'image',
      size: '0.3 kB',
      modified: '28 Jul 09:41',
      opens: { app: 'gallery' },
    },
  ],
  '/home/finn/Downloads': [],
  '/home/finn/About': [
    {
      name: 'finn.txt',
      kind: 'file',
      icon: 'doc',
      size: '0.8 kB',
      modified: '01 Jul 12:00',
      opens: { app: 'viewer', arg: '/home/finn/About/finn.txt' },
    },
  ],
  '/home/finn/.Trash': [],
}

/** Sidebar places in Files. */
export const PLACES: { label: string; path: string; icon: IconKey }[] = [
  { label: 'Home', path: '/home/finn', icon: 'home' },
  { label: 'Projects', path: '/home/finn/Projects', icon: 'folder' },
  { label: 'Music', path: '/home/finn/Music', icon: 'music' },
  { label: 'Photography', path: '/home/finn/Photography', icon: 'image' },
  { label: 'Downloads', path: '/home/finn/Downloads', icon: 'folder' },
]

/** Contents for the internal text viewer, keyed by path. */
export const DOCS: Record<string, { title: string; body: string[] }> = {
  '/home/finn/About/finn.txt': {
    title: 'finn.txt',
    body: [
      'FINN VANGRONSVELD',
      '',
      'Streamer, creator, DJ/producer. Based in Flanders.',
      '',
      'Variety streams on Twitch, clips when they are worth keeping, and',
      'music under ATLAZ from the decks in the corner of the room.',
      '',
      `twitch     twitch.tv/${HANDLE}`,
      `instagram  @${HANDLE}`,
      `youtube    @${HANDLE}`,
      'atlaz      atlazmusic.be',
    ],
  },
  '/home/finn/notes.txt': {
    title: 'notes.txt',
    body: [
      'todo',
      '----',
      '- finish the arcade cabinet build',
      '- re-cut the summer set, the intro drags',
      '- back up the photo card before the next trip',
      '- fix the lamp behind the desk (again)',
    ],
  },
  '/home/finn/Projects/mrfinnertytv/README.md': {
    title: 'README.md',
    body: [
      '# mrfinnertytv',
      '',
      'The site you are currently standing inside.',
      '',
      'A fixed pixel-art studio you can walk around, with this desktop',
      'running on the machine in the corner.',
      '',
      '## stack',
      'react · typescript · vite · canvas',
      '',
      '## status',
      'live at mrfinnertytv.com',
    ],
  },
  '/home/finn/Projects/PixelPanzer/README.md': {
    title: 'README.md',
    body: [
      '# PixelPanzer',
      '',
      'Small top-down tank game. Currently a prototype.',
      '',
      '## status',
      'in development — see Game Launcher',
    ],
  },
}

/* ---------------------------------------------------------------- browser */

export type PageId = 'home' | 'twitch' | 'clips' | 'atlaz' | 'photography' | 'instagram'

export interface BookmarkDef {
  id: PageId
  label: string
  url: string
  blurb: string
  /**
   * External destinations are NOT framed. Browsers and the sites themselves
   * block it, and pretending otherwise would be a broken feature — these open a
   * real link-out page instead.
   */
  external?: string
}

export const BOOKMARKS: BookmarkDef[] = [
  { id: 'twitch', label: 'Twitch', url: 'https://twitch.tv/' + HANDLE, blurb: 'Live stream and chat' },
  { id: 'clips', label: 'Clips', url: 'mrfinnertytv://clips', blurb: 'Recent cuts' },
  {
    id: 'atlaz',
    label: 'ATLAZ',
    url: 'https://atlazmusic.be',
    blurb: 'Music, mixes, bookings',
    external: LINKS.atlaz,
  },
  { id: 'photography', label: 'Photography', url: 'mrfinnertytv://photos', blurb: 'Stills' },
  {
    id: 'instagram',
    label: 'Instagram',
    url: 'https://instagram.com/' + HANDLE,
    blurb: `@${HANDLE}`,
    external: LINKS.instagram,
  },
]

export const HOME_URL = 'mrfinnertytv://home'

/* ----------------------------------------------------------------- media */

export interface ClipDef {
  id: string
  title: string
  meta: string
  duration: string
  /** Set a real clip URL to enable the watch action. */
  url: string | null
}

/** TODO(content): swap for real clips. */
export const CLIPS: ClipDef[] = [
  { id: 'c1', title: 'One-tap and a long silence', meta: 'Valorant · last week', duration: '0:42', url: null },
  { id: 'c2', title: 'Chat picks the setlist', meta: 'Just Chatting · last month', duration: '1:18', url: null },
  { id: 'c3', title: 'The 4am build that worked', meta: 'Late stream · last month', duration: '2:05', url: null },
]

export interface PhotoDef {
  id: string
  title: string
  meta: string
  /** Set a real path to replace the generated placeholder frame. */
  src: string | null
}

/** TODO(content): drop real photographs in and set `src`. */
export const PHOTOS: PhotoDef[] = [
  { id: 'p1', title: 'valley_0141.png', meta: '2048 × 1365 · f/2.8', src: null },
  { id: 'p2', title: 'riverbank_0198.png', meta: '2048 × 1365 · f/4', src: null },
  { id: 'p3', title: 'town_dusk_0233.png', meta: '2048 × 1365 · f/1.8', src: null },
  { id: 'p4', title: 'balcony_0277.png', meta: '2048 × 1365 · f/5.6', src: null },
  { id: 'p5', title: 'ridge_0301.png', meta: '2048 × 1365 · f/8', src: null },
]

export interface ReleaseDef {
  id: string
  title: string
  kind: string
  length: string
  year: string
}

/** TODO(content): real ATLAZ releases and mixes. */
export const RELEASES: ReleaseDef[] = [
  { id: 'r1', title: 'Nightline', kind: 'Single', length: '3:48', year: '2026' },
  { id: 'r2', title: 'Summer Set — live', kind: 'Mix', length: '58:12', year: '2026' },
  { id: 'r3', title: 'Low Tide', kind: 'Single', length: '4:12', year: '2025' },
  { id: 'r4', title: 'Basement Tapes Vol. 2', kind: 'Mix', length: '46:30', year: '2025' },
]

export const GAME = {
  title: 'MRFINNERTY ARCADE',
  status: 'IN DEVELOPMENT',
  blurb: 'A small arcade cabinet for the studio. Not installed yet.',
  meta: [
    ['Publisher', 'MrFinnertyTV'],
    ['Genre', 'Arcade'],
    ['Size', '—'],
    ['Installed', 'No'],
  ] as [string, string][],
}

/** Boot lines. Short — nobody wants to read a kernel log to see a portfolio. */
export const BOOT_LINES = [
  'FINN OS 1.0',
  'mounting /home/finn ......... ok',
  'capture device .............. ok',
  'audio interface ............. ok',
  'starting desktop',
]

export const BOOT_LINE_MS = 130
export const BOOT_BLACK_MS = 380
