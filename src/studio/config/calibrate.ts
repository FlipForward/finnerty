/**
 * Dev-only calibration helpers.
 *
 * The OS layer has to sit exactly inside the monitor's green rectangle. Rather
 * than hardcode an eyeballed guess, this measures the real key-colour bounds
 * out of the shipped PNG and reports them in the same normalised space that
 * `scene.ts` uses.
 *
 * It runs in the browser on purpose: the page can already decode a PNG into a
 * canvas, whereas doing it in Node would mean adding an image library for one
 * measurement.
 */

export interface NormalisedRect {
  x: number
  y: number
  width: number
  height: number
}

/** Flat chroma key used by `pc-closeup-green.png`. */
const KEY_COLOR = { r: 0, g: 255, b: 0 }
/** Generous, because generated art rarely lands on an exact channel value. */
const TOLERANCE = 60

function isKey(r: number, g: number, b: number): boolean {
  // Green-dominant rather than "close to #00FF00": generators often shift the
  // key slightly, but nothing else in a warm wooden room is strongly green.
  return (
    g > 140 &&
    g - r > 70 &&
    g - b > 70 &&
    Math.abs(r - KEY_COLOR.r) < TOLERANCE + 120 &&
    Math.abs(b - KEY_COLOR.b) < TOLERANCE + 120
  )
}

/**
 * Loads `src` and returns the bounding box of its key-coloured region,
 * normalised to the image. Returns null if no key pixels are found — which
 * usually means the asset is missing or the green was flattened away.
 */
export async function measureKeyRect(src: string): Promise<NormalisedRect | null> {
  const image = new Image()
  image.crossOrigin = 'anonymous'
  image.src = src
  await image.decode()

  const canvas = document.createElement('canvas')
  canvas.width = image.naturalWidth
  canvas.height = image.naturalHeight
  const ctx = canvas.getContext('2d', { willReadFrequently: true })
  if (!ctx) return null
  ctx.drawImage(image, 0, 0)

  const { data } = ctx.getImageData(0, 0, canvas.width, canvas.height)
  let minX = canvas.width
  let minY = canvas.height
  let maxX = -1
  let maxY = -1

  for (let y = 0; y < canvas.height; y++) {
    for (let x = 0; x < canvas.width; x++) {
      const i = (y * canvas.width + x) * 4
      if (!isKey(data[i], data[i + 1], data[i + 2])) continue
      if (x < minX) minX = x
      if (y < minY) minY = y
      if (x > maxX) maxX = x
      if (y > maxY) maxY = y
    }
  }

  if (maxX < 0) return null

  return {
    x: minX / canvas.width,
    y: minY / canvas.height,
    width: (maxX - minX + 1) / canvas.width,
    height: (maxY - minY + 1) / canvas.height,
  }
}

/** Formats a measured rect as a paste-ready `MONITOR_RECT` literal. */
export function formatRect(rect: NormalisedRect): string {
  const f = (n: number) => n.toFixed(4)
  return [
    'export const MONITOR_RECT = {',
    `  x: ${f(rect.x)},`,
    `  y: ${f(rect.y)},`,
    `  width: ${f(rect.width)},`,
    `  height: ${f(rect.height)},`,
    '} as const',
  ].join('\n')
}
