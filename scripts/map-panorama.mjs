// Prints a coarse colour-classified map of the panorama so its composition can
// be read without opening an image viewer.
import { readFileSync } from 'node:fs'
import { decodePng } from './png.mjs'

const { width, height, data } = decodePng(readFileSync('public/assets/camera/valley-panorama.png'))

const COLS = 88
const ROWS = 30
const cw = width / COLS
const ch = height / ROWS

function classify(r, g, b) {
  const max = Math.max(r, g, b)
  const min = Math.min(r, g, b)
  const sat = max === 0 ? 0 : (max - min) / max
  const lum = 0.299 * r + 0.587 * g + 0.114 * b

  if (sat > 0.42 && r > 140 && g > 110 && b < 120) return 'Y' // yellow
  if (sat > 0.40 && r > 110 && g < 100 && b < 100) return 'R' // red
  if (b > r + 26 && b > 110 && lum > 120) return '~' // sky / bright water
  if (b > r + 14 && lum <= 120) return 'w' // darker water
  if (g > r + 8 && g > b + 8) return lum > 105 ? 'v' : 'V' // foliage light / dark
  if (lum > 190) return '.' // very bright
  if (lum > 140) return ':' // light stone
  if (lum > 95) return '+' // mid
  if (lum > 55) return '#' // dark
  return '@' // very dark
}

console.log(`panorama ${width} x ${height}   grid ${COLS} x ${ROWS}  (cell ${cw.toFixed(1)} x ${ch.toFixed(1)} px)`)
console.log('legend: ~sky  w water  v/V foliage  . bright  : stone  + mid  # dark  @ v.dark  Y yellow  R red\n')

// column ruler in native px
let ruler = '    '
for (let c = 0; c < COLS; c += 8) ruler += String(Math.round(c * cw)).padEnd(8)
console.log(ruler)

for (let row = 0; row < ROWS; row++) {
  let line = ''
  for (let col = 0; col < COLS; col++) {
    const counts = {}
    for (let y = Math.floor(row * ch); y < Math.floor((row + 1) * ch); y += 3) {
      for (let x = Math.floor(col * cw); x < Math.floor((col + 1) * cw); x += 3) {
        const i = (y * width + x) * 4
        const k = classify(data[i], data[i + 1], data[i + 2])
        counts[k] = (counts[k] || 0) + 1
      }
    }
    // Saturated hits win even when rare — they are the subjects we care about.
    const k = counts.R > 2 ? 'R' : counts.Y > 3 ? 'Y' : Object.entries(counts).sort((a, b) => b[1] - a[1])[0][0]
    line += k
  }
  console.log(String(Math.round(row * ch)).padStart(3) + ' ' + line)
}
