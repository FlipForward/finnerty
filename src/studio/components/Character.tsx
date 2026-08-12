import { useEffect, useMemo, useRef, useState } from 'react'
import { PLAYER_START, SCENE_HEIGHT, SCENE_WIDTH, WALK_SPEED, type Point } from '../config/scene'
import { facingFor, route, type Facing } from '../lib/geometry'
import { COLUMNS, FACING_ROW, FRAME, characterSheetUrl, characterShadowUrl } from '../lib/sprites'

interface Props {
  /** Where to walk to, in normalised room space. Null parks the character. */
  target: Point | null
  /** Facing to settle into on arrival. */
  arriveFacing?: Facing
  onArrive?: () => void
}

/** How close counts as "there", in normalised units. */
const ARRIVE_EPSILON = 0.004

/**
 * The player. Walks a short route to whatever hotspot the cursor is over, and
 * retargets cleanly mid-walk rather than restarting or teleporting.
 */
export function Character({ target, arriveFacing, onArrive }: Props) {
  const [pos, setPos] = useState<Point>(PLAYER_START)
  const [facing, setFacing] = useState<Facing>('down')
  const [walking, setWalking] = useState(false)
  const [frame, setFrame] = useState(0)

  const posRef = useRef(pos)
  const pathRef = useRef<Point[]>([])
  const arrivedRef = useRef(true)
  const onArriveRef = useRef(onArrive)
  posRef.current = pos
  onArriveRef.current = onArrive

  const sheet = useMemo(() => characterSheetUrl(), [])
  const shadow = useMemo(() => characterShadowUrl(), [])

  // Recompute the route whenever the destination changes. Starting from the
  // live position is what makes retargeting mid-walk look continuous.
  useEffect(() => {
    if (!target) {
      pathRef.current = []
      return
    }
    pathRef.current = route(posRef.current, target)
    arrivedRef.current = false
  }, [target])

  useEffect(() => {
    let raf = 0
    let last = performance.now()

    const tick = (now: number) => {
      const dt = Math.min(0.05, (now - last) / 1000)
      last = now

      const path = pathRef.current
      if (path.length === 0) {
        setWalking(false)
        raf = requestAnimationFrame(tick)
        return
      }

      const next = path[0]
      const cur = posRef.current
      const dx = next.x - cur.x
      const dy = next.y - cur.y
      const dist = Math.hypot(dx, dy)

      if (dist < ARRIVE_EPSILON) {
        path.shift()
        if (path.length === 0) {
          setWalking(false)
          if (!arrivedRef.current) {
            arrivedRef.current = true
            if (arriveFacing) setFacing(arriveFacing)
            onArriveRef.current?.()
          }
        }
        raf = requestAnimationFrame(tick)
        return
      }

      const stepLen = Math.min(dist, WALK_SPEED * dt)
      const moved = { x: cur.x + (dx / dist) * stepLen, y: cur.y + (dy / dist) * stepLen }
      posRef.current = moved
      setPos(moved)
      setFacing((f) => facingFor(dx, dy, f))
      setWalking(true)
      raf = requestAnimationFrame(tick)
    }

    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [arriveFacing])

  // Walk cycle. Idle parks on the neutral frame rather than freezing mid-stride.
  useEffect(() => {
    if (!walking) {
      setFrame(0)
      return
    }
    const id = window.setInterval(() => setFrame((f) => (f + 1) % COLUMNS), 125)
    return () => window.clearInterval(id)
  }, [walking])

  const left = pos.x * SCENE_WIDTH
  const top = pos.y * SCENE_HEIGHT

  return (
    <div className="character" style={{ left, top }}>
      <img className="character__shadow" src={shadow} alt="" aria-hidden />
      <div
        className="character__sprite"
        style={{
          backgroundImage: `url(${sheet})`,
          backgroundPosition: `${-frame * FRAME}px ${-FACING_ROW[facing] * FRAME}px`,
        }}
      />
    </div>
  )
}
