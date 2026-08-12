import type { IconKey } from './osConfig'

/**
 * Pixel icons as rects on a 16x16 grid.
 *
 * Hand-placed rather than an icon font or SVG paths, so every edge lands on a
 * whole pixel at any scale. `[x, y, w, h, tone]` — tone picks the fill.
 */
type Rect = [number, number, number, number, Tone?]
type Tone = 'a' | 'b' | 'c' | 'd'

const ICONS: Record<IconKey, Rect[]> = {
  // window with a globe-ish band
  browser: [
    [1, 2, 14, 12, 'b'],
    [1, 2, 14, 3, 'a'],
    [2, 6, 12, 7, 'c'],
    [2, 9, 12, 1, 'a'],
    [7, 6, 2, 7, 'a'],
  ],
  // broadcast dot with brackets
  stream: [
    [7, 7, 2, 2, 'a'],
    [3, 4, 1, 8, 'b'],
    [4, 3, 1, 1, 'b'],
    [4, 12, 1, 1, 'b'],
    [12, 4, 1, 8, 'b'],
    [11, 3, 1, 1, 'b'],
    [11, 12, 1, 1, 'b'],
  ],
  files: [
    [1, 3, 6, 2, 'a'],
    [1, 4, 14, 9, 'b'],
    [1, 4, 14, 2, 'a'],
  ],
  folder: [
    [1, 3, 6, 2, 'a'],
    [1, 4, 14, 9, 'b'],
    [1, 4, 14, 2, 'a'],
  ],
  gallery: [
    [1, 3, 14, 10, 'b'],
    [1, 3, 14, 10, 'b'],
    [3, 9, 4, 3, 'c'],
    [7, 6, 6, 6, 'c'],
    [11, 5, 2, 2, 'd'],
  ],
  image: [
    [1, 3, 14, 10, 'b'],
    [3, 9, 4, 3, 'c'],
    [7, 6, 6, 6, 'c'],
    [11, 5, 2, 2, 'd'],
  ],
  // vinyl / disc
  atlaz: [
    [3, 3, 10, 10, 'b'],
    [6, 6, 4, 4, 'a'],
    [7, 7, 2, 2, 'd'],
  ],
  music: [
    [9, 2, 4, 2, 'd'],
    [9, 2, 2, 8, 'b'],
    [5, 9, 5, 3, 'b'],
    [3, 4, 2, 8, 'b'],
  ],
  // d-pad
  game: [
    [5, 2, 6, 12, 'b'],
    [2, 5, 12, 6, 'b'],
    [6, 6, 4, 4, 'a'],
  ],
  about: [
    [6, 2, 4, 4, 'b'],
    [3, 8, 10, 6, 'b'],
  ],
  settings: [
    [6, 1, 4, 14, 'b'],
    [1, 6, 14, 4, 'b'],
    [5, 5, 6, 6, 'a'],
    [6, 6, 4, 4, 'd'],
  ],
  doc: [
    [3, 1, 9, 14, 'c'],
    [5, 4, 6, 1, 'a'],
    [5, 6, 6, 1, 'a'],
    [5, 8, 6, 1, 'a'],
    [5, 10, 4, 1, 'a'],
  ],
  trash: [
    [4, 2, 8, 1, 'b'],
    [3, 4, 10, 11, 'b'],
    [6, 6, 1, 7, 'a'],
    [9, 6, 1, 7, 'a'],
  ],
  home: [
    [8, 1, 1, 1, 'd'],
    [2, 7, 12, 7, 'b'],
    [7, 10, 3, 4, 'a'],
    [1, 7, 14, 1, 'd'],
  ],
  launcher: [
    [2, 2, 5, 5, 'b'],
    [9, 2, 5, 5, 'b'],
    [2, 9, 5, 5, 'b'],
    [9, 9, 5, 5, 'd'],
  ],
}

interface Props {
  name: IconKey
  size?: number
  className?: string
}

export function Icon({ name, size = 16, className }: Props) {
  const rects = ICONS[name] ?? ICONS.doc
  return (
    <svg
      className={className ? `pxicon ${className}` : 'pxicon'}
      width={size}
      height={size}
      viewBox="0 0 16 16"
      shapeRendering="crispEdges"
      aria-hidden
      focusable="false"
    >
      {rects.map(([x, y, w, h, tone], i) => (
        <rect key={i} className={`t-${tone ?? 'b'}`} x={x} y={y} width={w} height={h} />
      ))}
    </svg>
  )
}
