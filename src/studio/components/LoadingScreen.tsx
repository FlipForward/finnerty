import { useEffect, useState } from 'react'
import { COIN_SIZE, LINE_INTERVAL_MS, LOADING_LINES, REVEAL_FADE_MS } from '../config/loading'
import { SunCoin } from './SunCoin'

interface Props {
  /** 0..1 from the preloader. */
  progress: number
  /** Set once everything has decoded; starts the fade out. */
  complete: boolean
}

/**
 * Black screen, small spinning coin, one line of copy underneath.
 *
 * Stays up until every asset has actually decoded — it is not on a timer.
 */
export function LoadingScreen({ progress, complete }: Props) {
  const [line, setLine] = useState(0)

  useEffect(() => {
    if (complete) return
    const id = window.setInterval(() => setLine((n) => (n + 1) % LOADING_LINES.length), LINE_INTERVAL_MS)
    return () => window.clearInterval(id)
  }, [complete])

  return (
    <div
      className={`loading${complete ? ' is-done' : ''}`}
      style={{ ['--reveal-fade' as string]: `${REVEAL_FADE_MS}ms` }}
      role="status"
      aria-live="polite"
    >
      <SunCoin size={COIN_SIZE} />

      <p className="loading__line" key={line}>
        {complete ? 'READY' : LOADING_LINES[line]}
      </p>

      <div className="loading__bar" aria-hidden>
        <span style={{ transform: `scaleX(${Math.max(0.02, progress)})` }} />
      </div>

      <span className="loading__sr">
        Loading the studio, {Math.round(progress * 100)} percent complete.
      </span>
    </div>
  )
}
