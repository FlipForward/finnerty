import { useCallback, useEffect, useRef, useState } from 'react'
import { createGame, type GameHandle } from '../game/createGame'
import { on, emit, type DialogPayload } from '../game/events'
import { DialogOverlay } from './DialogOverlay'
import { LiveOverlay } from './LiveOverlay'
import { StartScreen } from './StartScreen'

type Phase = 'loading' | 'title' | 'playing'
type Overlay = { kind: 'dialog'; payload: DialogPayload } | { kind: 'live' } | null

/**
 * Owns the Phaser canvas and every DOM layer stacked above it.
 *
 * React never touches the game's internals: it mounts the canvas, listens on
 * the event bus for "the player interacted with X", and tells the game when an
 * overlay closed so input can resume.
 */
export function GameShell() {
  const containerRef = useRef<HTMLDivElement>(null)
  const gameRef = useRef<GameHandle | null>(null)
  const [phase, setPhase] = useState<Phase>('loading')
  const [overlay, setOverlay] = useState<Overlay>(null)
  const [showHint, setShowHint] = useState(false)

  // Mount the game.
  //
  // Creation is deferred by one frame so React strict mode's throwaway first
  // mount never boots an engine at all. Booting and immediately destroying a
  // Phaser game works, but it costs a full WebGL context and leaves its closed
  // AudioContext complaining in the console — cheaper to simply not do it.
  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    let handle: GameHandle | null = null
    let cancelled = false
    const frame = requestAnimationFrame(() => {
      if (cancelled) return
      handle = createGame(container)
      gameRef.current = handle
    })

    return () => {
      cancelled = true
      cancelAnimationFrame(frame)
      handle?.destroy()
      gameRef.current = null
    }
  }, [])

  useEffect(() => {
    const unsubscribes = [
      on('game:ready', () => setPhase((current) => (current === 'loading' ? 'title' : current))),
      on('game:started', () => {
        setShowHint(true)
        window.setTimeout(() => setShowHint(false), 7000)
      }),
      on('overlay:dialog', (payload) => setOverlay({ kind: 'dialog', payload })),
      on('overlay:live', () => setOverlay({ kind: 'live' })),
    ]
    return () => {
      for (const off of unsubscribes) off()
    }
  }, [])

  const start = useCallback(() => {
    setPhase((current) => {
      if (current !== 'title') return current
      emit('ui:start')
      return 'playing'
    })
  }, [])

  const closeOverlay = useCallback(() => {
    setOverlay(null)
    emit('ui:overlay-closed')
    gameRef.current?.focus()
  }, [])

  // Escape closes whatever is open, from anywhere.
  useEffect(() => {
    if (!overlay) return
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== 'Escape') return
      event.preventDefault()
      closeOverlay()
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [overlay, closeOverlay])

  return (
    <div className="shell">
      <div className="shell__canvas" ref={containerRef} />

      {phase === 'loading' && (
        <div className="shell__loading">
          <span>LOADING</span>
        </div>
      )}

      {phase === 'title' && <StartScreen onStart={start} />}

      {phase === 'playing' && !overlay && (
        <p className={`shell__hint ${showHint ? '' : 'shell__hint--faded'}`}>
          WASD / ARROWS TO MOVE &nbsp;·&nbsp; E TO INTERACT &nbsp;·&nbsp; ESC TO CLOSE
        </p>
      )}

      {overlay?.kind === 'dialog' && <DialogOverlay payload={overlay.payload} onClose={closeOverlay} />}
      {overlay?.kind === 'live' && <LiveOverlay onClose={closeOverlay} />}
    </div>
  )
}
