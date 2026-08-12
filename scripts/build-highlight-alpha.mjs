// Derives `*-highlight-alpha.png` from the supplied highlight art.
//
// The highlights are not isolated objects on a background rectangle — they are
// the object plus a pale-yellow halo (~rgb(248,240,152)) painted around its
// silhouette, roughly 21px proud of the object on every side.
//
// Rather than colour-keying the yellow (which would also eat any warm pixels
// that genuinely belong to the object, e.g. the desk lamp), this masks the
// highlight against the matching NORMAL crop's own alpha, dilated a couple of
// pixels to allow for the highlight's brighter edge. Anything outside the real
// object silhouette is halo by definition, so it goes; everything inside is
// kept exactly as painted.
//
// Sources are never modified. Re-runnable: node scripts/build-highlight-alpha.mjs
import { readFileSync, writeFileSync } from 'node:fs'
import { decodePng, encodePng } from './png.mjs'

const DIR = 'public/assets/studio'
const PAIRS = [
  ['desk', 'desk.png', 'desk-highlight.png'],
  ['atlaz', 'atlaz.png', 'atlaz-highlight.png'],
  ['camera', 'camera.png', 'camera-highlight.png'],
]
/** Pixels of slack around the object silhouette. Halo is ~21px, so 2 is safe. */
const DILATE = 2

/** Separable max filter over the alpha channel. */
function dilateAlpha(alpha, width, height, radius) {
  const tmp = new Uint8Array(alpha.length)
  const out = new Uint8Array(alpha.length)
  for (let y = 0; y < height; y++) {
    const row = y * width
    for (let x = 0; x < width; x++) {
      let m = 0
      for (let d = -radius; d <= radius; d++) {
        const nx = x + d
        if (nx < 0 || nx >= width) continue
        const v = alpha[row + nx]
        if (v > m) m = v
      }
      tmp[row + x] = m
    }
  }
  for (let x = 0; x < width; x++) {
    for (let y = 0; y < height; y++) {
      let m = 0
      for (let d = -radius; d <= radius; d++) {
        const ny = y + d
        if (ny < 0 || ny >= height) continue
        const v = tmp[ny * width + x]
        if (v > m) m = v
      }
      out[y * width + x] = m
    }
  }
  return out
}

for (const [id, normalName, highlightName] of PAIRS) {
  const normal = decodePng(readFileSync(`${DIR}/${normalName}`))
  const highlight = decodePng(readFileSync(`${DIR}/${highlightName}`))
  const { width, height } = highlight
  if (normal.width !== width || normal.height !== height) {
    throw new Error(`${id}: normal and highlight differ in size`)
  }

  const silhouette = new Uint8Array(width * height)
  for (let i = 0; i < silhouette.length; i++) silhouette[i] = normal.data[i * 4 + 3]
  const mask = dilateAlpha(silhouette, width, height, DILATE)

  const out = new Uint8Array(width * height * 4)
  let kept = 0
  let removed = 0
  let minX = width
  let minY = height
  let maxX = -1
  let maxY = -1

  for (let p = 0; p < width * height; p++) {
    const i = p * 4
    const a = highlight.data[i + 3]
    // Multiplying by the (dilated) silhouette keeps the object's own
    // anti-aliased edge instead of stamping a hard cut-out.
    const alpha = Math.round((a * mask[p]) / 255)
    out[i] = highlight.data[i]
    out[i + 1] = highlight.data[i + 1]
    out[i + 2] = highlight.data[i + 2]
    out[i + 3] = alpha
    if (a > 0 && alpha === 0) removed++
    if (alpha > 0) {
      kept++
      const x = p % width
      const y = (p / width) | 0
      if (x < minX) minX = x
      if (y < minY) minY = y
      if (x > maxX) maxX = x
      if (y > maxY) maxY = y
    }
  }

  // Confirm no pale yellow survived outside the object.
  let yellowLeft = 0
  for (let p = 0; p < width * height; p++) {
    const i = p * 4
    if (out[i + 3] < 8) continue
    const dr = out[i] - 248
    const dg = out[i + 1] - 240
    const db = out[i + 2] - 152
    if (dr * dr + dg * dg + db * db < 900 && mask[p] === 0) yellowLeft++
  }

  const target = `${DIR}/${id}-highlight-alpha.png`
  writeFileSync(target, encodePng(width, height, out))
  console.log(
    `${id.padEnd(7)} kept ${kept.toString().padStart(7)}  halo removed ${removed
      .toString()
      .padStart(7)}  bbox x:${minX} y:${minY} w:${maxX - minX + 1} h:${maxY - minY + 1}  strayYellow ${yellowLeft}`,
  )
}
