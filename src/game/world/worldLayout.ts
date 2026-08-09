/**
 * The arrival valley of MrFinnertyTV World, as data.
 *
 * Two 60x40 character grids: one for ground tiles, one for scenery props.
 * They are meant to be edited by hand — open the file, redraw a row, reload.
 * Nothing in WorldScene hardcodes a coordinate.
 *
 * Layout intent: this is Arrival Island, a real lobby rather than a menu
 * plaza. The arrival path curves up from the southern water to the lodge,
 * then breaks into three readable routes: woodland across the timber bridge,
 * a lakeside Live Deck, and a sealed cliff route. Trees and shorelines frame
 * the paths without turning the map into a repeated tile matrix.
 *
 * Ground legend                      Prop legend
 *   .  grass                           (space)  nothing
 *   ,  grass with a tuft               T        broadleaf tree (solid)
 *   d  bare dirt                       P        pine           (solid)
 *   p  stone path                      b        bush           (solid)
 *   s  stone slab (plaza)              R        boulder        (solid)
 *   a  accent slab (dressed stone)     r        stone          (solid)
 *   W  timber deck                     l        lantern        (solid, light)
 *   _  shore                           c        crate          (solid)
 *   ~  water  (solid)                  B        banner         (solid, light)
 *   #  cliff  (solid)                  f        flowers        (decor)
 *                                      w        weeds          (decor)
 *                                      =        cable run      (decor)
 */

import { TILE_SIZE } from '../config'

export const MAP_WIDTH = 60
export const MAP_HEIGHT = 40

export const WORLD_WIDTH = MAP_WIDTH * TILE_SIZE
export const WORLD_HEIGHT = MAP_HEIGHT * TILE_SIZE

const GROUND_ROWS = [
  '############################################################',
  '############################################################',
  '############################################################',
  '############################################################',
  '############################################################',
  '############################################################',
  '###########.....................................############',
  '#######..............................................#######',
  '####....................................................####',
  '###....,..,___..,.,.....,..,.......,...,..,...,.....,....###',
  '##........._~_...........................pdddd............##',
  '##........._~__.........................pd................##',
  '##........._~~_........................pd.................##',
  '##.....,..,_~~_.,.,.....,..,.......,..pd..,...,.....,.....##',
  '##........._~__......................pd...................##',
  '##........._~_......................pd....................##',
  '##........_WWWWddddddddddddddd.....pd.....................##',
  '##........_~~_...............pd...pd...........___________##',
  '##........_~~_................pd.pd............_~~~~~~~~~~~~',
  '##.....,..,~~_..,.,.....,..,..pd...,...,..,.._,_~~~~~~~~~~~~',
  '##........__~_................pd............__~~~~~~~~~~~~~~',
  '##........._~_.................pddd........__~~~~~~~~~~~~~~~',
  '##........._~_.................pd.pdd.....__~~~~~~~~~~~~~~~~',
  '##........._~_................pd....pdd..__~~~~~~~~~~~~~~~~~',
  '##.....,..,___..,.,.....,..,..pd...,..pdd_~~~~~~~~~~~~~~~~~~',
  '##...........................pd........_pddWWWWWWWWWW~~~~~~~',
  '##...........................pd.......__~~pWWWWWWWWWW~~~~~~~',
  '##...........................pd......__~~~~~WWWWWWWW~~~~~~~~',
  '###....,..,.....,.,.....,..,.pd....,__~~~~~~~WWWWWW~~~~~~~~~',
  '####.........................pd...___~~~~~~~~~~~~~~~~~~~~~~~',
  '######____...................pd.___~~~~~~~~~~~~~~~~~~~~~~~~~',
  '~~~~~~~~~____..................._~~~~~~~~~~~~~~~~~~~~~~~~~~~',
  '~~~~~~~~~~~~____................_________________~~~~~~~~~~~',
  '~~~~~~~~~~~~~~~____.......................____~~~~~~~~~~~~~~',
  '~~~~~~~~~~~~~~~~~~_____................____~~~~~~~~~~~~~~~~~',
  '~~~~~~~~~~~~~~~~~~~~~~_____.........____~~~~~~~~~~~~~~~~~~~~',
  '~~~~~~~~~~~~~~~~~~~~~~~~~~___________~~~~~~~~~~~~~~~~~~~~~~~',
  '~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~',
  '~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~',
  '~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~',
]

const PROP_ROWS = [
  '                                                            ',
  '                                                            ',
  '                                                            ',
  '                                                            ',
  '                                                            ',
  '                                                            ',
  '                                                            ',
  '                                                            ',
  '                                                            ',
  '                                        T                   ',
  '        P       T  P    T           T  P     P      P       ',
  '    T     b  r      T              P              T         ',
  '               P      wP              w    w            P   ',
  '      w          w   f          w      b    b               ',
  '              r   f   b f  w       b                  T     ',
  '          w      b       b               r      b    w      ',
  '       T                             r                      ',
  '         R                                     T    b       ',
  '    P           r         B       B          r              ',
  '       b               r l        l        R                ',
  '                b           f   f   b         R        T    ',
  '        w  R        b                  b    f               ',
  '     T      w      f     w         f              R         ',
  '              R w      f               f       f            ',
  '          P          w           rw      l          l       ',
  '         f   r P  T           f      w                      ',
  '        T           f                                       ',
  '               f  r              T            =  c          ',
  '          w   w       T      b              l   =  c        ',
  '           R     R        P    P   R                        ',
  '                        w                                   ',
  '                                                            ',
  '                                                            ',
  '                                                            ',
  '                                                            ',
  '                                                            ',
  '                                                            ',
  '                                                            ',
  '                                                            ',
  '                                                            ',
]

/**
 * Tile indices into the generated tileset (one row per index).
 *
 * The order is load-bearing and matches docs/ART_BIBLE.md. New tiles are
 * appended so existing indices never shift under delivered art.
 */
export const Tile = {
  Grass: 0,
  GrassTuft: 1,
  Dirt: 2,
  Path: 3,
  Slab: 4,
  Shore: 5,
  Water: 6,
  Cliff: 7,
  Accent: 8,
  Deck: 9,
} as const

const GROUND_CHARS: Record<string, number> = {
  '.': Tile.Grass,
  ',': Tile.GrassTuft,
  d: Tile.Dirt,
  p: Tile.Path,
  s: Tile.Slab,
  a: Tile.Accent,
  W: Tile.Deck,
  _: Tile.Shore,
  '~': Tile.Water,
  '#': Tile.Cliff,
}

/** Tiles the player cannot walk onto. Props carry their own bodies. */
export const SOLID_TILES: number[] = [Tile.Water, Tile.Cliff]

export type PropKind =
  | 'tree'
  | 'pine'
  | 'bush'
  | 'boulder'
  | 'stone'
  | 'lantern'
  | 'crate'
  | 'banner'
  | 'flowers'
  | 'weeds'
  | 'cable'

const PROP_CHARS: Record<string, PropKind> = {
  T: 'tree',
  P: 'pine',
  b: 'bush',
  R: 'boulder',
  r: 'stone',
  l: 'lantern',
  c: 'crate',
  B: 'banner',
  f: 'flowers',
  w: 'weeds',
  '=': 'cable',
}

export interface PropPlacement {
  kind: PropKind
  tileX: number
  tileY: number
}

/** Arrival path, in the lower foreground of the lodge. */
export const SPAWN_TILE = { x: 29, y: 26 } as const

/** Feature placement stays data-driven so a finished 64x64 lodge is a file swap. */
export const LOBBY_FEATURES = {
  lodge: { tileX: 30, tileY: 17 },
} as const

/**
 * The giant MRFINNERTYTV lettering is carved into the northern cliff band. It
 * is world geometry, not UI: the arrival screen points the camera at it, but
 * the player can stand in front of the hillside once play begins.
 */
export const HILLSIDE = {
  text: 'MRFINNERTYTV',
  /** Pixel scale applied to the 5x7 font: 12 chars ends up ~355px wide. */
  scale: 5,
  /** Centre of the lettering, in world pixels. */
  x: WORLD_WIDTH / 2,
  y: 68,
} as const

/** Camera framing for the arrival state — cliff lettering and lodge in one view. */
export const TITLE_CAMERA = {
  x: HILLSIDE.x,
  y: 194,
  driftX: 20,
  driftSeconds: 22,
} as const

export interface ParsedWorld {
  width: number
  height: number
  /** Row-major tile indices, ready for `this.make.tilemap({ data })`. */
  tiles: number[][]
  props: PropPlacement[]
}

/**
 * Parses the grids above into engine-ready data, and fails loudly on a malformed
 * edit. A silently truncated row would show up as an invisible wall much later,
 * so this throws at boot instead.
 */
export function parseWorld(): ParsedWorld {
  if (GROUND_ROWS.length !== MAP_HEIGHT || PROP_ROWS.length !== MAP_HEIGHT) {
    throw new Error(
      `worldLayout: expected ${MAP_HEIGHT} rows, got ${GROUND_ROWS.length} ground / ${PROP_ROWS.length} prop`,
    )
  }

  const tiles: number[][] = []
  const props: PropPlacement[] = []

  for (let y = 0; y < MAP_HEIGHT; y++) {
    const groundRow = GROUND_ROWS[y]
    const propRow = PROP_ROWS[y]
    if (groundRow.length !== MAP_WIDTH) {
      throw new Error(`worldLayout: ground row ${y} is ${groundRow.length} chars, expected ${MAP_WIDTH}`)
    }
    if (propRow.length !== MAP_WIDTH) {
      throw new Error(`worldLayout: prop row ${y} is ${propRow.length} chars, expected ${MAP_WIDTH}`)
    }

    const row: number[] = []
    for (let x = 0; x < MAP_WIDTH; x++) {
      const groundChar = groundRow[x]
      const tile = GROUND_CHARS[groundChar]
      if (tile === undefined) {
        throw new Error(`worldLayout: unknown ground char '${groundChar}' at (${x}, ${y})`)
      }
      row.push(tile)

      const propChar = propRow[x]
      if (propChar !== ' ') {
        const kind = PROP_CHARS[propChar]
        if (!kind) {
          throw new Error(`worldLayout: unknown prop char '${propChar}' at (${x}, ${y})`)
        }
        props.push({ kind, tileX: x, tileY: y })
      }
    }
    tiles.push(row)
  }

  return { width: MAP_WIDTH, height: MAP_HEIGHT, tiles, props }
}

/** Tile coordinate -> world pixel at the tile's horizontal centre and baseline. */
export function tileToWorld(tileX: number, tileY: number): { x: number; y: number } {
  return { x: tileX * TILE_SIZE + TILE_SIZE / 2, y: tileY * TILE_SIZE + TILE_SIZE }
}
