import { useCallback, useEffect, useRef, useState } from 'react'

/** Logical playfield. Scaled up by CSS; all logic is in these units. */
const W = 240
const H = 150
const PLAYER_W = 18
const PLAYER_H = 8

interface Faller {
  x: number
  y: number
  vy: number
  good: boolean
}

type Phase = 'ready' | 'playing' | 'over'

/**
 * SIGNAL CATCH — a tiny, self-contained dodge/collect game.
 *
 * Catch the cream packets, dodge the red ones. Deliberately small: it exists so
 * PLAY does something real, not to be a product.
 */
export function Minigame() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [phase, setPhase] = useState<Phase>('ready')
  const [score, setScore] = useState(0)
  const [best, setBest] = useState(0)
  const [lives, setLives] = useState(3)

  const stateRef = useRef({
    playerX: W / 2,
    fallers: [] as Faller[],
    spawnIn: 0,
    speed: 1,
    left: false,
    right: false,
    score: 0,
    lives: 3,
    running: false,
  })

  const start = useCallback(() => {
    const s = stateRef.current
    s.playerX = W / 2
    s.fallers = []
    s.spawnIn = 0
    s.speed = 1
    s.score = 0
    s.lives = 3
    s.running = true
    setScore(0)
    setLives(3)
    setPhase('playing')
  }, [])

  // Keyboard. Stops propagation so OS-level Escape handling stays predictable.
  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      const s = stateRef.current
      if (e.key === 'ArrowLeft' || e.key === 'a') s.left = true
      if (e.key === 'ArrowRight' || e.key === 'd') s.right = true
      if ((e.key === 'Enter' || e.key === ' ') && !s.running) {
        e.preventDefault()
        start()
      }
    }
    const up = (e: KeyboardEvent) => {
      const s = stateRef.current
      if (e.key === 'ArrowLeft' || e.key === 'a') s.left = false
      if (e.key === 'ArrowRight' || e.key === 'd') s.right = false
    }
    window.addEventListener('keydown', down)
    window.addEventListener('keyup', up)
    return () => {
      window.removeEventListener('keydown', down)
      window.removeEventListener('keyup', up)
    }
  }, [start])

  const onPointer = useCallback((e: React.PointerEvent<HTMLCanvasElement>) => {
    const rect = e.currentTarget.getBoundingClientRect()
    stateRef.current.playerX = ((e.clientX - rect.left) / rect.width) * W
  }, [])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    ctx.imageSmoothingEnabled = false

    let raf = 0
    let last = performance.now()

    const loop = (now: number) => {
      const dt = Math.min(0.05, (now - last) / 1000)
      last = now
      const s = stateRef.current

      if (s.running) {
        if (s.left) s.playerX -= 150 * dt
        if (s.right) s.playerX += 150 * dt
        s.playerX = Math.max(PLAYER_W / 2, Math.min(W - PLAYER_W / 2, s.playerX))

        s.spawnIn -= dt
        if (s.spawnIn <= 0) {
          s.spawnIn = Math.max(0.28, 0.9 - s.score * 0.01)
          s.fallers.push({
            x: 8 + Math.random() * (W - 16),
            y: -6,
            vy: 42 + Math.random() * 26 + s.score * 0.7,
            good: Math.random() > 0.32,
          })
        }

        for (const f of s.fallers) f.y += f.vy * dt
        const catchY = H - 14
        s.fallers = s.fallers.filter((f) => {
          const hit =
            f.y >= catchY - 4 &&
            f.y <= catchY + PLAYER_H &&
            Math.abs(f.x - s.playerX) < PLAYER_W / 2 + 4
          if (hit) {
            if (f.good) {
              s.score += 1
              setScore(s.score)
            } else {
              s.lives -= 1
              setLives(s.lives)
              if (s.lives <= 0) {
                s.running = false
                setPhase('over')
                setBest((b) => Math.max(b, s.score))
              }
            }
            return false
          }
          if (f.y > H + 8) {
            // Missing a good packet costs nothing; this is a catch game.
            return false
          }
          return true
        })
      }

      // ---- draw ----
      ctx.fillStyle = '#0d161e'
      ctx.fillRect(0, 0, W, H)
      ctx.fillStyle = '#14202b'
      for (let y = 0; y < H; y += 6) ctx.fillRect(0, y, W, 1)

      for (const f of s.fallers) {
        ctx.fillStyle = f.good ? '#e0d1b3' : '#e8564e'
        ctx.fillRect(Math.round(f.x) - 3, Math.round(f.y) - 3, 6, 6)
        ctx.fillStyle = f.good ? '#fff' : '#ff9a94'
        ctx.fillRect(Math.round(f.x) - 3, Math.round(f.y) - 3, 2, 2)
      }

      const px = Math.round(s.playerX - PLAYER_W / 2)
      ctx.fillStyle = '#2e6eea'
      ctx.fillRect(px, H - 14, PLAYER_W, PLAYER_H)
      ctx.fillStyle = '#68a8ff'
      ctx.fillRect(px, H - 14, PLAYER_W, 2)
      ctx.fillStyle = '#1c4aa8'
      ctx.fillRect(px, H - 8, PLAYER_W, 2)

      raf = requestAnimationFrame(loop)
    }

    raf = requestAnimationFrame(loop)
    return () => cancelAnimationFrame(raf)
  }, [])

  return (
    <div className="mini">
      <div className="mini__hud">
        <span>SCORE {String(score).padStart(3, '0')}</span>
        <span>LIVES {'♥'.repeat(Math.max(0, lives))}</span>
        <span>BEST {String(best).padStart(3, '0')}</span>
      </div>

      <div className="mini__screen">
        <canvas ref={canvasRef} width={W} height={H} onPointerMove={onPointer} />
        {phase !== 'playing' && (
          <div className="mini__overlay">
            <p className="mini__title">SIGNAL CATCH</p>
            <p className="mini__hint">
              {phase === 'over' ? `Signal lost — ${score} caught` : 'Catch the cream. Dodge the red.'}
            </p>
            <button className="os-button" type="button" onClick={start}>
              {phase === 'over' ? 'RUN AGAIN' : 'START'}
            </button>
            <p className="mini__keys">← → or move the mouse</p>
          </div>
        )}
      </div>
    </div>
  )
}
