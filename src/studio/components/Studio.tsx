import { useCallback, useEffect, useRef, useState } from 'react'
import {
  ASSETS,
  HOTSPOTS,
  SCENE_HEIGHT,
  SCENE_WIDTH,
  WALKABLE_FLOOR,
  type Hotspot,
  type HotspotId,
  type Point,
} from '../config/scene'
import { polygonToStagePath } from '../lib/geometry'
import { useStageScale } from '../hooks/useStageScale'
import { Ambient } from './Ambient'
import { Character } from './Character'

interface Props {
  onOpen: (id: HotspotId) => void
  /** Suppresses hover/click while something is open on top of the room. */
  interactive: boolean
}

const CALIBRATE = typeof window !== 'undefined' && new URLSearchParams(window.location.search).has('calibrate')

export function Studio({ onOpen, interactive }: Props) {
  const { scale, offsetX, offsetY, upscaling } = useStageScale()
  const [hovered, setHovered] = useState<Hotspot | null>(null)
  const [pending, setPending] = useState<Hotspot | null>(null)
  const [probe, setProbe] = useState<Point>({ x: 0, y: 0 })
  const stageRef = useRef<HTMLDivElement>(null)

  // Hovering sends the character walking; the destination is simply whichever
  // hotspot is under the cursor, so moving between them retargets on its own.
  const target = hovered?.standing ?? null

  const handleArrive = useCallback(() => {
    setPending((queued) => {
      if (queued) onOpen(queued.id)
      return null
    })
  }, [onOpen])

  // If the cursor leaves before arrival, the queued click is abandoned.
  useEffect(() => {
    if (!pending) return
    if (hovered?.id !== pending.id) setPending(null)
  }, [hovered, pending])

  const handleClick = useCallback(
    (spot: Hotspot) => {
      if (!interactive) return
      setHovered(spot)
      setPending(spot)
    },
    [interactive],
  )

  // Dev-only handle for smoke checks: lets the hover/open flow be driven without
  // a visible tab, where requestAnimationFrame is throttled to zero.
  useEffect(() => {
    if (!import.meta.env.DEV) return
    const w = window as unknown as Record<string, unknown>
    w.__STUDIO__ = {
      hotspots: HOTSPOTS,
      hover: (id: HotspotId | null) => setHovered(HOTSPOTS.find((h) => h.id === id) ?? null),
      open: (id: HotspotId) => onOpen(id),
      state: () => ({ hovered: hovered?.id ?? null, pending: pending?.id ?? null }),
    }
    return () => {
      delete w.__STUDIO__
    }
  }, [hovered, pending, onOpen])

  const handleProbe = useCallback(
    (event: React.MouseEvent<HTMLDivElement>) => {
      if (!CALIBRATE) return
      const rect = stageRef.current?.getBoundingClientRect()
      if (!rect) return
      setProbe({
        x: (event.clientX - rect.left) / rect.width,
        y: (event.clientY - rect.top) / rect.height,
      })
    },
    [],
  )

  return (
    <div className="stage" onMouseMove={handleProbe}>
      <div
        ref={stageRef}
        className={`stage__inner${upscaling ? ' stage__inner--pixelated' : ''}`}
        style={{ transform: `translate(${offsetX}px, ${offsetY}px) scale(${scale})` }}
      >
        <img className="stage__room" src={ASSETS.room} alt="MrFinnertyTV studio" draggable={false} />

        <Ambient />

        <Character target={target} arriveFacing={hovered?.facing} onArrive={handleArrive} />

        <svg
          className="hotspots"
          viewBox={`0 0 ${SCENE_WIDTH} ${SCENE_HEIGHT}`}
          style={{ pointerEvents: interactive ? 'auto' : 'none' }}
        >
          {CALIBRATE && (
            <polygon className="hotspot__floor" points={polygonToStagePath(WALKABLE_FLOOR)} />
          )}
          {HOTSPOTS.map((spot) => (
            <polygon
              key={spot.id}
              className={`hotspot${hovered?.id === spot.id ? ' is-hovered' : ''}`}
              points={polygonToStagePath(spot.shape)}
              onMouseEnter={() => setHovered(spot)}
              onMouseLeave={() => setHovered((h) => (h?.id === spot.id ? null : h))}
              onClick={() => handleClick(spot)}
              role="button"
              tabIndex={interactive ? 0 : -1}
              aria-label={spot.label}
              onFocus={() => setHovered(spot)}
              onBlur={() => setHovered((h) => (h?.id === spot.id ? null : h))}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault()
                  handleClick(spot)
                }
              }}
            />
          ))}
        </svg>

        {hovered && (
          <div
            className="hotspot-label"
            style={{
              left: hovered.standing.x * SCENE_WIDTH,
              top: hovered.shape.reduce((min, p) => Math.min(min, p.y), 1) * SCENE_HEIGHT - 26,
            }}
          >
            {hovered.label}
          </div>
        )}
      </div>

      {CALIBRATE && (
        <div className="calibrate">
          <strong>CALIBRATE</strong>
          <span>
            x: {probe.x.toFixed(4)} &nbsp; y: {probe.y.toFixed(4)}
          </span>
          <span>
            scale {scale.toFixed(3)} · {upscaling ? 'pixelated' : 'smooth'}
          </span>
        </div>
      )}
    </div>
  )
}
