// Reports what each overlay asset actually contains, so placement and the
// background-removal threshold are measured rather than guessed.
import { readFileSync } from 'node:fs'
import { decodePng } from './png.mjs'

const DIR = 'public/assets/studio'
const NAMES = [
  'desk.png',
  'desk-highlight.png',
  'atlaz.png',
  'atlaz-highlight.png',
  'camera.png',
  'camera-highlight.png',
]

for (const name of NAMES) {
  const { width, height, data } = decodePng(readFileSync(`${DIR}/${name}`))

  let opaque = 0
  let clear = 0
  let partial = 0
  let minX = width
  let minY = height
  let maxX = -1
  let maxY = -1
  const colors = new Map()

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const i = (y * width + x) * 4
      const a = data[i + 3]
      if (a === 0) {
        clear++
        continue
      }
      if (a === 255) opaque++
      else partial++
      if (x < minX) minX = x
      if (y < minY) minY = y
      if (x > maxX) maxX = x
      if (y > maxY) maxY = y
      // Sample the colour histogram sparsely; we only need the dominant tone.
      if ((x & 3) === 0 && (y & 3) === 0) {
        const key = `${data[i] >> 3},${data[i + 1] >> 3},${data[i + 2] >> 3}`
        colors.set(key, (colors.get(key) ?? 0) + 1)
      }
    }
  }

  const corners = [
    [0, 0],
    [width - 1, 0],
    [0, height - 1],
    [width - 1, height - 1],
  ].map(([x, y]) => {
    const i = (y * width + x) * 4
    return `rgba(${data[i]},${data[i + 1]},${data[i + 2]},${data[i + 3]})`
  })

  const top = [...colors.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([k, n]) => {
      const [r, g, b] = k.split(',').map((v) => Number(v) * 8)
      return `rgb(${r},${g},${b}) x${n}`
    })

  const total = width * height
  console.log(`\n=== ${name} ===`)
  console.log(`  size          ${width} x ${height}`)
  console.log(`  alpha         opaque ${((opaque / total) * 100).toFixed(1)}%  partial ${((partial / total) * 100).toFixed(1)}%  clear ${((clear / total) * 100).toFixed(1)}%`)
  console.log(`  content bbox  x:${minX} y:${minY} w:${maxX - minX + 1} h:${maxY - minY + 1}`)
  console.log(`  corners       ${corners.join('  ')}`)
  console.log(`  dominant      ${top.join('  |  ')}`)
}
