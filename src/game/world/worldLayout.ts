/**
 * The first playable slice of MrFinnertyTV World, as data.
 *
 * Two 60x40 character grids: one for ground tiles, one for scenery props.
 * They are meant to be edited by hand — open the file, redraw a row, reload.
 * Nothing in WorldScene hardcodes a coordinate.
 *
 * Ground legend                      Prop legend
 *   .  grass                           (space)  nothing
 *   ,  grass with a tuft               T        tree        (solid)
 *   d  bare dirt                       t        small tree  (solid)
 *   p  stone path                      r        rock        (solid)
 *   s  stone slab (plaza / deck)       l        lantern     (solid, light source)
 *   _  shore
 *   ~  water  (solid)
 *   #  cliff  (solid)
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
  '############..,.##########,...,...##########################',
  '##########.........#####.,..........#######......###########',
  '########.......,................,..,..##..,........#########',
  '#######.....,.d.,........,..........,..,.............#######',
  '###..,..........,...............,.........,...,....,...,..##',
  '###...d.ddd.d.d..ddd.d....................................##',
  '###......ssssssssssd.............,...,,..................,##',
  '###.,.d.ssssssssssssdd.........,.,.....,.....,...,...,,...##',
  '###....ssssssssssssssd...d,........,.d..................,.##',
  '###...,ssssssssssssssppppppppppppppppppppp................##',
  '###...dssssssssssssssppppppppppppppppppppp........,,......##',
  '###,..dssssssssssssss.........,d..,.....pp.......,.......,##',
  '###....ssssssssssssss....,..............pp..d,......,.....##',
  '###...d.ssssssssssss.d...............,..pp................##',
  '###...dd.ssssssssssd..................,.pp...,.,..........##',
  '###,..d..ddddd.dd,dd....................pp....,,....,.....##',
  '###.......,...,...,......,.....,........pp..,.............##',
  '###........................,..,.......d.pp.......,........##',
  '###..........,...............,...,......pp.........,......##',
  '##.,......,...................d....d....pp...........,...,##',
  '##..........,..........,..,.,,..........ppssssssss....,...##',
  '##......................,............,..ppssssssss.....,..##',
  '##..,.........,.....,..,........,.....d.ppssssssss~~~~~~~~~~',
  '##..........................,,...,......ppssssssssd_~~~~~~~~',
  '##........,........,..............,.....ppssssssss.._~~~~~~~',
  '##........,........,...,......d.........ppppppppppp._~~~~~~~',
  '##...,........,.,.................,.....ppppppppppp_~~~~~~~~',
  '##.....,...,..,.,.....,..........d,.......d......_~~~~~~~~~~',
  '##........,......,............................_~~~~~~~~~~~~~',
  '##...,..............................._______~~~~~~~~~~~~~~~~',
  '##.............,,...,.............___~~~~~~~~~~~~~~~~~~~~~~~',
  '##...........__________.........__~~~~~~~~~~~~~~~~~~~~~~~~~~',
  '___........__~~~~~~~~~~_________~~~~~~~~~~~~~~~~~~~~~~~~~~~~',
  '~~~________~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~',
  '~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~',
  '~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~',
]

const PROP_ROWS = [
  '                                                            ',
  '                                                            ',
  '                                                            ',
  '                                                            ',
  '                           TT  tT                           ',
  '          TT t    t              TTT       T   Tt           ',
  '        T      T    T  TT tT   T  TT T  Ttt   TTT T         ',
  '       T      l    T tT TT tT T    TTT  tTt  T   TT         ',
  '   TT                  T TtTT   r tT  T      r     T   T    ',
  '   T             l      T  t      TT  T  T            T     ',
  '   tT                   T TT  T     T                 T  t  ',
  '    T   l          l                TT              r       ',
  '                         l           l                   T  ',
  '                                                   TT    t  ',
  '                                                  tTT       ',
  '   TT                          l                T Tt    t   ',
  '    T                            TTT        l  TT  TT   t   ',
  '    T   l          l            TtT            T TT tT      ',
  '   T                          T TT tt             tTtT      ',
  '                               TT               TTT         ',
  '    T                           t T                         ',
  '                                 T    l                  t  ',
  '             TTT                                 r       t  ',
  '  t    T     T tT         T                             tT  ',
  '   T      T T   T T   T                             T  TT   ',
  '   T     T    TtT      TTt T  T                         T   ',
  '   Tt             Tr     TT           l                     ',
  '     T     T   T     TTTT                         l         ',
  '  TT       r    r    T  T t                                 ',
  '        T  T          T               T        l            ',
  '  T    Tt    T  T                                           ',
  '  T   T TT T                        t     l                 ',
  '       TTTtt               T               T  T             ',
  '          TT r               r          T                   ',
  '      t     T T  T T T          TTt                         ',
  '             T T t t  T TT t  T TT                          ',
  '   TT   T  T             TTT tT                             ',
  '   TTt T  T                                                 ',
  '                                                            ',
  '                                                            ',
]

/** Tile indices into the generated tileset (one row per index). */
export const Tile = {
  Grass: 0,
  GrassTuft: 1,
  Dirt: 2,
  Path: 3,
  Slab: 4,
  Shore: 5,
  Water: 6,
  Cliff: 7,
} as const

const GROUND_CHARS: Record<string, number> = {
  '.': Tile.Grass,
  ',': Tile.GrassTuft,
  d: Tile.Dirt,
  p: Tile.Path,
  s: Tile.Slab,
  _: Tile.Shore,
  '~': Tile.Water,
  '#': Tile.Cliff,
}

/** Tiles the player cannot walk onto. Props carry their own bodies. */
export const SOLID_TILES: number[] = [Tile.Water, Tile.Cliff]

export type PropKind = 'tree' | 'treeSmall' | 'rock' | 'lantern'

const PROP_CHARS: Record<string, PropKind> = {
  T: 'tree',
  t: 'treeSmall',
  r: 'rock',
  l: 'lantern',
}

export interface PropPlacement {
  kind: PropKind
  tileX: number
  tileY: number
}

/** Where the player stands when the world begins: the middle of the lobby plaza. */
export const SPAWN_TILE = { x: 13, y: 15 } as const

/**
 * The giant MRFINNERTYTV lettering, sitting on the cliff band that closes off
 * the north of the map. It is world geometry, not UI: you see it from the lobby
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
