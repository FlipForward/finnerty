import { useEffect, useMemo, useState } from 'react'
import { AMBIENT, SCENE_HEIGHT, SCENE_WIDTH } from '../config/scene'
import { catSheetUrl } from '../lib/sprites'

function useReducedMotion(): boolean {
  const [reduced, setReduced] = useState(
    () => typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches,
  )
  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)')
    const onChange = () => setReduced(mq.matches)
    mq.addEventListener('change', onChange)
    return () => mq.removeEventListener('change', onChange)
  }, [])
  return reduced
}

/** Plays a short frame sequence, then idles for a randomised gap. */
function useIdleLoop(frames: number, range: [number, number], enabled: boolean): number {
  const [frame, setFrame] = useState(0)

  useEffect(() => {
    if (!enabled) {
      setFrame(0)
      return
    }
    let cancelled = false
    let timer = 0

    const scheduleIdle = () => {
      const [min, max] = range
      const wait = (min + Math.random() * (max - min)) * 1000
      timer = window.setTimeout(playOnce, wait)
    }

    const playOnce = () => {
      let f = 0
      const step = () => {
        if (cancelled) return
        f += 1
        if (f >= frames) {
          setFrame(0)
          scheduleIdle()
          return
        }
        setFrame(f)
        timer = window.setTimeout(step, 180)
      }
      step()
    }

    scheduleIdle()
    return () => {
      cancelled = true
      window.clearTimeout(timer)
    }
    // `range` is a literal in config and never changes identity meaningfully.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [frames, enabled, range[0], range[1]])

  return frame
}

function Cat({ x, y, scale, range, enabled }: { x: number; y: number; scale: number; range: [number, number]; enabled: boolean }) {
  const sheet = useMemo(() => catSheetUrl(), [])
  const frame = useIdleLoop(3, range, enabled)
  const size = scale * SCENE_WIDTH
  return (
    <div
      className="ambient ambient--cat"
      style={{
        left: x * SCENE_WIDTH,
        top: y * SCENE_HEIGHT,
        width: size,
        height: size,
        backgroundImage: `url(${sheet})`,
        backgroundSize: `${size * 3}px ${size}px`,
        backgroundPosition: `${-frame * size}px 0`,
      }}
      aria-hidden
    />
  )
}

/** Slow brightness pulse over the tower's LEDs. No sprite needed — it is light. */
function LedPulse({ x, y, scale, enabled }: { x: number; y: number; scale: number; enabled: boolean }) {
  const size = scale * SCENE_WIDTH
  return (
    <div
      className={`ambient ambient--led${enabled ? ' is-live' : ''}`}
      style={{ left: x * SCENE_WIDTH, top: y * SCENE_HEIGHT, width: size, height: size * 2.4 }}
      aria-hidden
    />
  )
}

/** A few motes drifting through the balcony light. */
function Dust({ x, y, scale, enabled }: { x: number; y: number; scale: number; enabled: boolean }) {
  const motes = useMemo(
    () =>
      Array.from({ length: 7 }, (_, i) => ({
        id: i,
        dx: Math.random(),
        dy: Math.random(),
        delay: Math.random() * 9,
        duration: 11 + Math.random() * 9,
      })),
    [],
  )
  if (!enabled) return null
  const size = scale * SCENE_WIDTH
  return (
    <div className="ambient ambient--dust" style={{ left: x * SCENE_WIDTH, top: y * SCENE_HEIGHT, width: size, height: size }} aria-hidden>
      {motes.map((m) => (
        <span
          key={m.id}
          style={{
            left: `${m.dx * 100}%`,
            top: `${m.dy * 100}%`,
            animationDelay: `${m.delay}s`,
            animationDuration: `${m.duration}s`,
          }}
        />
      ))}
    </div>
  )
}

/**
 * Ambient life, as independent layers rather than one baked loop.
 *
 * Each has its own randomised idle gap so they never fall into sync, and the
 * whole set goes still under `prefers-reduced-motion`.
 *
 * NOTE: the plant-sway layers in `AMBIENT` are intentionally not rendered yet.
 * The plants are painted into `studio-master.png`, so animating them needs
 * matching cut-out sprites lifted from that artwork — overlaying an invented
 * frond on top of the baked-in one looks wrong. The config slots are kept so
 * the sprites can be dropped in without touching this component.
 */
export function Ambient() {
  const reduced = useReducedMotion()
  const enabled = !reduced

  return (
    <>
      {AMBIENT.map((layer) => {
        if (layer.id === 'cat') {
          return <Cat key={layer.id} x={layer.at.x} y={layer.at.y} scale={layer.scale} range={layer.idleRange} enabled={enabled} />
        }
        if (layer.id === 'pc-led') {
          return <LedPulse key={layer.id} x={layer.at.x} y={layer.at.y} scale={layer.scale} enabled={enabled} />
        }
        if (layer.id === 'dust') {
          return <Dust key={layer.id} x={layer.at.x} y={layer.at.y} scale={layer.scale} enabled={enabled} />
        }
        return null
      })}
    </>
  )
}
