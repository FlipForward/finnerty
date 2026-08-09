/**
 * The arrival valley of MrFinnertyTV World, as data.
 *
 * Two 60x40 character grids: one for ground tiles, one for scenery props.
 * They are meant to be edited by hand — open the file, redraw a row, reload.
 * Nothing in WorldScene hardcodes a coordinate.
 *
 * Layout intent: every structure is placed deliberately and the woodland only
 * decorates around it. The plaza is symmetrical about column 14, an accent
 * centreline runs from the spawn tile up to the gate, and a three-tile avenue
 * leaves the plaza east before narrowing into a trail that turns south to the
 * live deck. Sightlines along that route are kept clear of trees on purpose,
 * so the player can always see where the path goes next.
 *
 * Ground legend                      Prop legend
 *   .  grass                           (space)  nothing
 *   ,  grass with a tuft               T        broadleaf tree (solid)
 *   d  bare dirt                       P        pine           (solid)
 *   p  stone path                      b        bush           (solid)
 *   s  stone slab (plaza)              R        boulder        (solid)
 *   a  accent slab (cobalt inlay)      r        stone          (solid)
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
  '############.........##################################...##',
  '##########.....,.,......######.........##############.....##',
  '########..............,............,.,...##########.....,.##',
  '###.,.................,......,......,.......####..,.......##',
  '###....d..dddd,.d.dd.d...,,...............................##',
  '###...d..ssaaaaaaassddd..............,..............,.....##',
  '###...ddsssaaaaaaasssd..............................,.....##',
  '###....ssssaaaaaaassss.....,..,....,,.,...................##',
  '###,..dssssaaaaaaassss..,........................,........##',
  '###..,.sssssssasssssssppppppppppppppppp......,............##',
  '###....sssssssasssssssppppppppppppppppp.,...,.............##',
  '###...dsssssssasssssssppppppppppppppppp...............,...##',
  '###....sssssssasssssssd...,....,.....pp..,................##',
  '###...dsssssssssssssssd,.............pp.........,....,,...##',
  '###.,.d.sssssssssssssd.......,.......pp.......,...........##',
  '###...dddsssssssssssddd.......,......pp..............,....##',
  '###...d..ddd.dd.dd..ddd,.............pp....,..........,...##',
  '###...............,...,..,,...,....,.pp...................##',
  '###.................,...,............pp...................##',
  '###..........,....,...............,,.pp.,.WWWWWWWWWWW.....##',
  '###...............,................,.pp...WWWWWWWWWWW_~~~~~~',
  '###..................................pp...WWWWWWWWWWW_WW~~~~',
  '###.......................,..........ppdddWWWWWWWWWWW._W~~~~',
  '###......,...........................ppdddWWWWWWWWWWW_WW~~~~',
  '###..........................,,...,..pppppWWWWWWWWWWW_WW~~~~',
  '###..,.........,.......,,............pppppWWWWWWWWWWW~~~~~~~',
  '###...............,.......,............dddWWWWWWWWWWW~~~~~~~',
  '###.............,......,.......,....,..ddd......_~~~~~~~~~~~',
  '###.........................................._~~~~~~~~~~~~~~',
  '###................,.....,.........,...____~~~~~~~~~~~~~~~~~',
  '###..,............._,...............___~~~~~~~~~~~~~~~~~~~~~',
  '###....,...,.._____~______........__~~~~~~~~~~~~~~~~~~~~~~~~',
  '___......,.___~~~~~~~~~~~~________~~~~~~~~~~~~~~~~~~~~~~~~~~',
  '~~~________~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~',
  '~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~',
  '~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~',
]

const PROP_ROWS = [
  '                                                            ',
  '                                                            ',
  '                                                            ',
  '                                                            ',
  '            T Tbf   b                                       ',
  '            b       fPTP       f Tbb                        ',
  '          w        f           TTPb  w P                 T  ',
  '   b    w          ff           fT       w P    b P     w   ',
  '         w          r   ww     P rw   w      TwT            ',
  '                           rwr b  rw    r       w           ',
  '   w                     ff     w        rf         T       ',
  '        l B       B l                  ffff r    b   ww     ',
  '   T r                    lf            w       T T  P      ',
  '                                        fff  w w TTP    fT  ',
  '   w                                   f  w       T TPr  w  ',
  '                                       f f f    w P  w wf   ',
  '    w                        r  l      ww     ww  b      P  ',
  '         l         l      w                         w   w   ',
  '   P    l           l                            f       P  ',
  '   T f                   w   T   w  l         r  w    Tb    ',
  '   f        w     ff      b  T  f  f     w    f rfwf  wb    ',
  '   P  f         f  f  w   T T Tf w  w     r w  f  fw        ',
  '    ww          f   rw  w  T  b ff             fff    w     ',
  '     ff w TTPw  r w  f       b  fffw                    r   ',
  '   f w   bP        Tf         w ffff   l   B       l        ',
  '   w    w   T     b          w                              ',
  '      w  w r w w   PTTw  w w   R                            ',
  '   w    r fwf      b  w   wff r   w                 c       ',
  '   P     f R   w       wff     RR                           ',
  '   P    TPP rr         w  f         w      l=     =lc       ',
  '     w   Pffrff w w   w f  w f R                            ',
  '        T Tf             wf     T    w     f                ',
  '        b w       w     TfPb       T   f                    ',
  '     w     w   w      wT w bw  bTTP      P                  ',
  '            r       w    b      T    b                      ',
  '   T       w        b TT          P                         ',
  '      f w                 T  PP                             ',
  '     b T                                                    ',
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

/** Where the player stands when the world begins: below the gate, on the centreline. */
export const SPAWN_TILE = { x: 14, y: 16 } as const

/**
 * The giant MRFINNERTYTV lettering, sitting on the cliff band that closes off
 * the north of the map. It is world geometry, not UI: you see it from the plaza
 * by walking north, and the title screen simply points the camera at it.
 */
export const HILLSIDE = {
  text: 'MRFINNERTYTV',
  /** Pixel scale applied to the 5x7 font: 12 chars ends up ~355px wide. */
  scale: 5,
  /** Centre of the lettering, in world pixels. */
  x: WORLD_WIDTH / 2,
  y: 34,
} as const

/** Camera framing for the title state — a slow drift across the hillside. */
export const TITLE_CAMERA = {
  x: HILLSIDE.x,
  y: 96,
  driftX: 34,
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
