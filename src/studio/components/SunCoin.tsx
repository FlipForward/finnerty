import { useEffect, useMemo, useRef, useState } from 'react'
import { COIN_LOGO } from '../config/loading'

interface Props {
  /** Rendered width/height in px. */
  size?: number
  /** Extrusion depth at the reference size of 480px. Scales with `size`. */
  thickness?: number
  /** Seconds for one full loop (two turns). */
  loopSeconds?: number
  /** Ease amount — how much the spin speeds up and slows down. */
  swing?: number
}

/**
 * The spinning gold sun coin.
 *
 * Ported from the `sun-coin.jsx` source in the Sun Coin design project. The
 * coin is the logo silhouette extruded along Z: a stack of copies of the same
 * PNG, the two outermost acting as the faces and the rest as the milled edge,
 * lit by a single warm directional source.
 *
 * Two deviations from the source, both because it was authored for a 1080px
 * stage and this renders at ~96px:
 *   - layer count has a floor of 10, or a small coin's extrusion visibly bands
 *   - perspective scales with `size` to keep the same foreshortening
 */

const GOLD = 'grayscale(1) sepia(1) saturate(3.4) hue-rotate(-8deg)'
const FACE_BRIGHT = 1.35
const EDGE_BRIGHT = 0.72
/** The source's authored size; thickness and perspective are relative to it. */
const REFERENCE_SIZE = 480

export function SunCoin({ size = 96, thickness = 22, loopSeconds = 4, swing = 100 }: Props) {
  const [rotY, setRotY] = useState(0)
  const [logoOk, setLogoOk] = useState<boolean | null>(null)
  const startRef = useRef<number | null>(null)

  // The coin face is a real asset; if it is missing we still want a loader, so
  // fall back to a drawn disc rather than rendering nothing.
  useEffect(() => {
    let cancelled = false
    const img = new Image()
    img.onload = () => !cancelled && setLogoOk(true)
    img.onerror = () => !cancelled && setLogoOk(false)
    img.src = COIN_LOGO
    return () => {
      cancelled = true
    }
  }, [])

  const reduced = useMemo(
    () => typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches,
    [],
  )

  useEffect(() => {
    if (reduced) return
    let raf = 0
    const tick = (now: number) => {
      if (startRef.current === null) startRef.current = now
      const p = (((now - startRef.current) / 1000) % loopSeconds) / loopSeconds
      // Two full turns per loop. The sine term accelerates then decelerates and
      // returns to zero at the seam, so the loop is perfectly smooth.
      setRotY(p * 720 + swing * Math.sin(p * Math.PI * 2))
      raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [loopSeconds, swing, reduced])

  const depth = thickness * (size / REFERENCE_SIZE)
  const count = Math.min(48, Math.max(10, Math.round(depth)))
  const step = depth / (count - 1)

  const a = (rotY * Math.PI) / 180
  const facing = Math.cos(a - 0.45)
  const lit = 0.74 + 0.5 * Math.pow(Math.max(0, facing), 1.4)
  const glint = Math.pow(Math.max(0, Math.abs(facing)), 26)

  const layers = []
  for (let i = 0; i < count; i++) {
    const isFace = i === 0 || i === count - 1
    const brightness = isFace ? FACE_BRIGHT * lit + glint * 0.55 : EDGE_BRIGHT * lit
    layers.push(
      <span
        key={i}
        className="coin__layer"
        style={{
          transform: `translateZ(${i * step - depth / 2}px)`,
          filter: `${GOLD} brightness(${brightness}) contrast(${isFace ? 1.08 : 1})`,
          // Longhand only. Mixing the `background` shorthand with
          // `backgroundImage` here means React resets background-image to none
          // when it drops the shorthand on a state flip, silently wiping the coin.
          backgroundImage: logoOk
            ? `url(${COIN_LOGO})`
            : 'radial-gradient(circle, #ffd68a 58%, #b8801f 60%)',
        }}
      />,
    )
  }

  // Specular flash as each face swings through the light.
  const flashFront = Math.pow(Math.max(0, facing), 26)
  const flashBack = Math.pow(Math.max(0, -facing), 26) * 0.7
  for (const [side, g] of [
    [1, flashFront],
    [-1, flashBack],
  ] as const) {
    layers.push(
      <span
        key={`flash${side}`}
        className="coin__layer coin__flash"
        style={{
          transform: `translateZ(${side * (depth / 2 + 0.3)}px)${side < 0 ? ' rotateY(180deg)' : ''}`,
          opacity: g * 0.6,
          backgroundImage: logoOk
            ? `url(${COIN_LOGO})`
            : 'radial-gradient(circle, #fff 58%, transparent 60%)',
        }}
      />,
    )
  }

  return (
    <div className="coin" style={{ width: size, height: size, perspective: size * 2.92 }} aria-hidden>
      <div
        className="coin__body"
        style={{ transform: `rotateX(-11deg) rotateY(${rotY}deg)` }}
      >
        {layers}
      </div>
    </div>
  )
}
