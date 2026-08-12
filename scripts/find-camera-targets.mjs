// Locates the photo-hunt subjects in the panorama, so the hotspot coordinates
// in cameraConfig.ts are measured rather than eyeballed.
//
// The panorama is warm-toned throughout, so loose colour tests match half the
// image. These tests are deliberately strict on saturation AND on the shape of
// the resulting blob.
//
//   node scripts/find-camera-targets.mjs
import { readFileSync } from 'node:fs'
import { decodePng } from './png.mjs'

const { width, height, data } = decodePng(readFileSync('public/assets/camera/valley-panorama.png'))
const at = (x, y) => {
  const i = (y * width + x) * 4
  return [data[i], data[i + 1], data[i + 2]]
}

function clusters(test, { minSize = 20, maxSize = 4000 } = {}) {
  const seen = new Uint8Array(width * height)
  const out = []
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const idx = y * width + x
      if (seen[idx]) continue
      seen[idx] = 1
      const [r, g, b] = at(x, y)
      if (!test(r, g, b, x, y)) continue
      const stack = [idx]
      let n = 0, sx = 0, sy = 0, minX = x, maxX = x, minY = y, maxY = y
      while (stack.length) {
        const p = stack.pop()
        const px = p % width
        const py = (p / width) | 0
        n++; sx += px; sy += py
        if (px < minX) minX = px
        if (px > maxX) maxX = px
        if (py < minY) minY = py
        if (py > maxY) maxY = py
        for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
          const nx = px + dx, ny = py + dy
          if (nx < 0 || ny < 0 || nx >= width || ny >= height) continue
          const ni = ny * width + nx
          if (seen[ni]) continue
          seen[ni] = 1
          const [r2, g2, b2] = at(nx, ny)
          if (test(r2, g2, b2, nx, ny)) stack.push(ni)
        }
      }
      if (n >= minSize && n <= maxSize) {
        out.push({ n, cx: Math.round(sx / n), cy: Math.round(sy / n), w: maxX - minX + 1, h: maxY - minY + 1 })
      }
    }
  }
  return out
}

const show = (label, list, take = 8) => {
  console.log(`\n=== ${label} ===`)
  if (!list.length) return console.log('  (none)')
  for (const c of list.slice(0, take)) {
    console.log(
      `  (${String(c.cx).padStart(4)}, ${String(c.cy).padStart(3)})  ${String(c.n).padStart(4)}px  ` +
        `${c.w}x${c.h}  ar ${(c.w / c.h).toFixed(2)}  norm (${(c.cx / width).toFixed(4)}, ${(c.cy / height).toFixed(4)})`,
    )
  }
}

console.log(`panorama ${width} x ${height}`)

// True saturated yellow: green must track red closely and blue must be far below
// both, which excludes warm stone, sand and sunlit roofs.
const yellow = clusters(
  (r, g, b) => r > 185 && g > 155 && b < 95 && r - b > 115 && Math.abs(r - g) < 55,
  { minSize: 45, maxSize: 2200 },
)
show('YELLOW — car-shaped (wider than tall)', yellow.filter((c) => c.w / c.h > 1.15 && c.w / c.h < 4).sort((a, b) => b.n - a.n))
show('YELLOW — all', yellow.sort((a, b) => b.n - a.n), 5)

// Strong red with very low green: a painted sail, not brick or terracotta.
const red = clusters(
  (r, g, b) => r > 130 && g < 80 && b < 85 && r - g > 75 && r - b > 70,
  { minSize: 18, maxSize: 2500 },
)
show('RED — tall (sail-shaped)', red.filter((c) => c.h / c.w > 1.3).sort((a, b) => b.n - a.n))
show('RED — all', red.sort((a, b) => b.n - a.n), 5)

// Bird: a small dark blob in the right third that sits against sky (its row has
// bright blue neighbours), which rules out foliage and cliff shadow.
const skyish = (x, y) => {
  const [r, g, b] = at(x, y)
  return b > r + 18 && b > 120
}
const bird = clusters(
  (r, g, b, x, y) => {
    if (x < width * 0.6) return false
    if (r > 85 || g > 85 || b > 95) return false
    // must have sky within 22px horizontally on either side
    for (let d = 6; d < 22; d++) {
      if (x + d < width && skyish(x + d, y)) return true
      if (x - d >= 0 && skyish(x - d, y)) return true
    }
    return false
  },
  { minSize: 25, maxSize: 1400 },
)
show('BIRD — dark, right third, against sky', bird.sort((a, b) => b.n - a.n), 10)
