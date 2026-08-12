import { SCREEN_HEIGHT, SCREEN_WIDTH } from './osConfig'

/**
 * The desktop wallpaper: the same sunlit river valley town the studio balcony
 * looks out over, drawn procedurally.
 *
 * Generated rather than shipped as a file so there is no half-real asset to
 * mistake for final art — set `WALLPAPER_SRC` in the OS config to a real image
 * later and this is never called. Everything is drawn with fillRect on whole
 * pixels; the only soft ramps are in the sky, which is the one place the brief
 * allows lighting to be gradual.
 */

let cached: string | null = null

/** Deterministic, so the town does not rearrange itself between renders. */
function rng(seed: number) {
  let s = seed >>> 0
  return () => ((s = (s * 1664525 + 1013904223) >>> 0) / 4294967296)
}

export function wallpaperUrl(): string {
  if (cached) return cached

  const W = SCREEN_WIDTH
  const H = SCREEN_HEIGHT
  const canvas = document.createElement('canvas')
  canvas.width = W
  canvas.height = H
  const ctx = canvas.getContext('2d')
  if (!ctx) return ''
  ctx.imageSmoothingEnabled = false

  const rand = rng(20260812)
  const HORIZON = Math.round(H * 0.46)

  // ---- sky: stepped bands, warm low, cool high -----------------------------
  const skyTop = [26, 44, 74]
  const skyLow = [214, 158, 112]
  const BANDS = 22
  for (let b = 0; b < BANDS; b++) {
    const t = b / (BANDS - 1)
    const y0 = Math.round((b / BANDS) * HORIZON)
    const y1 = Math.round(((b + 1) / BANDS) * HORIZON)
    const c = skyTop.map((v, i) => Math.round(v + (skyLow[i] - v) * Math.pow(t, 1.7)))
    ctx.fillStyle = `rgb(${c[0]},${c[1]},${c[2]})`
    ctx.fillRect(0, y0, W, y1 - y0)
  }

  // ---- sun: hard concentric steps, low and to the right --------------------
  const sunX = Math.round(W * 0.72)
  const sunY = Math.round(HORIZON - 54)
  const halo: [number, string][] = [
    [128, 'rgba(255,206,138,0.05)'],
    [92, 'rgba(255,214,150,0.08)'],
    [60, 'rgba(255,226,170,0.13)'],
    [34, 'rgba(255,238,198,0.22)'],
    [18, 'rgba(255,246,222,0.85)'],
  ]
  for (const [r, fill] of halo) {
    ctx.fillStyle = fill
    for (let y = -r; y <= r; y++) {
      const dx = Math.floor(Math.sqrt(Math.max(0, r * r - y * y)))
      ctx.fillRect(sunX - dx, sunY + y, dx * 2, 1)
    }
  }

  // ---- hills: three receding ridges ---------------------------------------
  const ridges: [number, string, number][] = [
    [HORIZON - 34, '#4d5f74', 0.020],
    [HORIZON - 16, '#3d5361', 0.014],
    [HORIZON - 2, '#33474f', 0.009],
  ]
  for (const [base, color, freq] of ridges) {
    ctx.fillStyle = color
    for (let x = 0; x < W; x++) {
      const h = Math.round(
        base - 20 * Math.sin(x * freq) - 12 * Math.sin(x * freq * 2.3 + 1.4) - 6 * Math.sin(x * freq * 5 + 0.7),
      )
      ctx.fillRect(x, h, 1, H - h)
    }
  }

  // ---- valley floor --------------------------------------------------------
  ctx.fillStyle = '#2b3a34'
  ctx.fillRect(0, HORIZON, W, H - HORIZON)
  ctx.fillStyle = '#33453b'
  ctx.fillRect(0, HORIZON + 26, W, H - HORIZON - 26)
  ctx.fillStyle = '#3b503f'
  ctx.fillRect(0, HORIZON + 78, W, H - HORIZON - 78)

  // ---- river: widens toward the viewer ------------------------------------
  const riverAt = (y: number) => {
    const t = (y - HORIZON) / (H - HORIZON)
    const cx = W * 0.42 + Math.sin(t * 2.4) * W * 0.09 + t * W * 0.06
    const half = 5 + t * t * 96
    return [cx - half, cx + half] as const
  }
  for (let y = HORIZON; y < H; y++) {
    const [l, r] = riverAt(y)
    const t = (y - HORIZON) / (H - HORIZON)
    const c = Math.round(70 + t * 26)
    ctx.fillStyle = `rgb(${Math.round(c * 0.6)},${Math.round(c * 0.86)},${c + 26})`
    ctx.fillRect(Math.round(l), y, Math.round(r - l), 1)
  }
  // sun glitter on the water
  ctx.fillStyle = 'rgba(255,232,186,0.5)'
  for (let i = 0; i < 90; i++) {
    const y = HORIZON + Math.floor(rand() * (H - HORIZON))
    const [l, r] = riverAt(y)
    const x = l + rand() * (r - l)
    ctx.fillRect(Math.round(x), y, 1 + Math.floor(rand() * 3), 1)
  }

  // ---- town: blocks along both banks --------------------------------------
  const roofs = ['#7a4638', '#6d4a3c', '#83513c', '#5f4136']
  const walls = ['#c8b79a', '#bda98d', '#d2c2a5', '#b3a087']
  for (let i = 0; i < 130; i++) {
    const y = HORIZON + 4 + Math.floor(rand() * (H - HORIZON - 40))
    const t = (y - HORIZON) / (H - HORIZON)
    const [l, r] = riverAt(y)
    const side = rand() < 0.5
    const bw = Math.round(5 + t * 20)
    const bh = Math.round(5 + t * 22)
    const x = side
      ? l - 14 - rand() * (l - 10) * 0.9
      : r + 8 + rand() * (W - r - 10) * 0.9
    if (x < 2 || x + bw > W - 2) continue
    ctx.fillStyle = walls[Math.floor(rand() * walls.length)]
    ctx.fillRect(Math.round(x), y, bw, bh)
    ctx.fillStyle = roofs[Math.floor(rand() * roofs.length)]
    ctx.fillRect(Math.round(x), y - Math.max(2, Math.round(bh * 0.3)), bw, Math.max(2, Math.round(bh * 0.3)))
    // a lit window or two
    if (t > 0.3 && rand() < 0.55) {
      ctx.fillStyle = 'rgba(255,206,130,0.8)'
      ctx.fillRect(Math.round(x + bw * 0.25), Math.round(y + bh * 0.35), Math.max(1, Math.round(bw * 0.2)), 2)
    }
  }

  // ---- foreground treeline, framing the bottom corners --------------------
  ctx.fillStyle = '#1d2a26'
  for (let x = 0; x < W; x++) {
    const edge = Math.abs(x - W / 2) / (W / 2)
    const h = Math.round(Math.pow(edge, 2.6) * 150)
    if (h > 2) ctx.fillRect(x, H - h, 1, h)
  }

  // ---- the wordmark, embedded and barely there ----------------------------
  ctx.save()
  ctx.globalAlpha = 0.045
  ctx.fillStyle = '#ffffff'
  ctx.font = '800 168px Inter, "Segoe UI", system-ui, sans-serif'
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.fillText('MRFINNERTYTV', W / 2, HORIZON - 96)
  ctx.restore()

  // ---- a gentle vignette so windows read against it -----------------------
  ctx.fillStyle = 'rgba(10,16,24,0.22)'
  ctx.fillRect(0, 0, W, H)

  cached = canvas.toDataURL()
  return cached
}
