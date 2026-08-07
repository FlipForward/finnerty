/**
 * A 5x7 bitmap font, drawn with hard pixels only.
 *
 * Canvas/DOM text would be anti-aliased, which the art bible forbids, so all
 * in-world text goes through here instead: the hillside MRFINNERTYTV lettering,
 * the [E] prompt, and the dev clock.
 *
 * Glyphs are authored as strings so they stay editable by eye — '1' is ink,
 * anything else is transparent. Uppercase only by design; `layout()` folds
 * lowercase input up.
 */

export const GLYPH_WIDTH = 5
export const GLYPH_HEIGHT = 7
/** Blank columns between glyphs, in font pixels. */
export const TRACKING = 1

const GLYPHS: Record<string, string> = {
  A: '01110/10001/10001/11111/10001/10001/10001',
  B: '11110/10001/10001/11110/10001/10001/11110',
  C: '01110/10001/10000/10000/10000/10001/01110',
  D: '11110/10001/10001/10001/10001/10001/11110',
  E: '11111/10000/10000/11110/10000/10000/11111',
  F: '11111/10000/10000/11110/10000/10000/10000',
  G: '01110/10001/10000/10111/10001/10001/01111',
  H: '10001/10001/10001/11111/10001/10001/10001',
  I: '11111/00100/00100/00100/00100/00100/11111',
  J: '00111/00010/00010/00010/00010/10010/01100',
  K: '10001/10010/10100/11000/10100/10010/10001',
  L: '10000/10000/10000/10000/10000/10000/11111',
  M: '10001/11011/10101/10101/10001/10001/10001',
  N: '10001/11001/10101/10011/10001/10001/10001',
  O: '01110/10001/10001/10001/10001/10001/01110',
  P: '11110/10001/10001/11110/10000/10000/10000',
  Q: '01110/10001/10001/10001/10101/10010/01101',
  R: '11110/10001/10001/11110/10100/10010/10001',
  S: '01111/10000/10000/01110/00001/00001/11110',
  T: '11111/00100/00100/00100/00100/00100/00100',
  U: '10001/10001/10001/10001/10001/10001/01110',
  V: '10001/10001/10001/10001/10001/01010/00100',
  W: '10001/10001/10001/10101/10101/11011/10001',
  X: '10001/10001/01010/00100/01010/10001/10001',
  Y: '10001/10001/01010/00100/00100/00100/00100',
  Z: '11111/00001/00010/00100/01000/10000/11111',
  '0': '01110/10001/10011/10101/11001/10001/01110',
  '1': '00100/01100/00100/00100/00100/00100/01110',
  '2': '01110/10001/00001/00010/00100/01000/11111',
  '3': '11111/00010/00100/00010/00001/10001/01110',
  '4': '00010/00110/01010/10010/11111/00010/00010',
  '5': '11111/10000/11110/00001/00001/10001/01110',
  '6': '00110/01000/10000/11110/10001/10001/01110',
  '7': '11111/00001/00010/00100/01000/01000/01000',
  '8': '01110/10001/10001/01110/10001/10001/01110',
  '9': '01110/10001/10001/01111/00001/00010/01100',
  ' ': '00000/00000/00000/00000/00000/00000/00000',
  '.': '00000/00000/00000/00000/00000/01100/01100',
  ',': '00000/00000/00000/00000/01100/01100/01000',
  ':': '00000/01100/01100/00000/01100/01100/00000',
  '!': '00100/00100/00100/00100/00100/00000/00100',
  '?': '01110/10001/00001/00010/00100/00000/00100',
  "'": '00100/00100/00000/00000/00000/00000/00000',
  '-': '00000/00000/00000/11111/00000/00000/00000',
  '+': '00000/00100/00100/11111/00100/00100/00000',
  '/': '00001/00010/00010/00100/01000/01000/10000',
  '[': '01110/01000/01000/01000/01000/01000/01110',
  ']': '01110/00010/00010/00010/00010/00010/01110',
  '(': '00010/00100/01000/01000/01000/00100/00010',
  ')': '01000/00100/00010/00010/00010/00100/01000',
}

const FALLBACK = GLYPHS['?']

/** Rows of a glyph, pre-split. Built once; the draw loop runs per frame-ish. */
const glyphCache = new Map<string, string[]>()

function rowsFor(char: string): string[] {
  let rows = glyphCache.get(char)
  if (!rows) {
    rows = (GLYPHS[char] ?? FALLBACK).split('/')
    glyphCache.set(char, rows)
  }
  return rows
}

export function normalise(text: string): string {
  return text.toUpperCase()
}

/** Size of `text` once rendered at `scale`, in device pixels. */
export function measureText(text: string, scale: number): { width: number; height: number } {
  const chars = normalise(text).length
  if (chars === 0) return { width: 0, height: 0 }
  return {
    width: (chars * (GLYPH_WIDTH + TRACKING) - TRACKING) * scale,
    height: GLYPH_HEIGHT * scale,
  }
}

/**
 * Draws `text` with its top-left at (x, y). Uses fillRect per lit pixel — no
 * paths, no anti-aliasing, no sub-pixel positions.
 */
export function drawText(
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  scale: number,
  color: string,
): void {
  ctx.fillStyle = color
  const chars = normalise(text)
  let penX = x
  for (const char of chars) {
    const rows = rowsFor(char)
    for (let row = 0; row < rows.length; row++) {
      const bits = rows[row]
      for (let col = 0; col < bits.length; col++) {
        if (bits[col] !== '1') continue
        ctx.fillRect(penX + col * scale, y + row * scale, scale, scale)
      }
    }
    penX += (GLYPH_WIDTH + TRACKING) * scale
  }
}

/**
 * Greedy word wrap at `maxChars` per line. Used for in-world sign text; React
 * overlays wrap with CSS instead.
 */
export function wrapText(text: string, maxChars: number): string[] {
  const lines: string[] = []
  let line = ''
  for (const word of normalise(text).split(/\s+/)) {
    if (!word) continue
    if (line.length === 0) line = word
    else if (line.length + 1 + word.length <= maxChars) line += ` ${word}`
    else {
      lines.push(line)
      line = word
    }
  }
  if (line) lines.push(line)
  return lines
}
