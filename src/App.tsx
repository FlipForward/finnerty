import { useEffect, useState } from 'react'
import { GameShell } from './components/GameShell'
import { MobileFallback } from './components/MobileFallback'

/** Below this width the world is not worth playing, so we do not pretend. */
const MIN_PLAYABLE_WIDTH = 900
const MIN_PLAYABLE_HEIGHT = 480

function isPlayable(): boolean {
  const wideEnough =
    window.innerWidth >= MIN_PLAYABLE_WIDTH && window.innerHeight >= MIN_PLAYABLE_HEIGHT
  // A coarse pointer with no hover is a touch device: there is no keyboard, and
  // V1 deliberately ships no virtual controls.
  const touchOnly = window.matchMedia('(pointer: coarse) and (hover: none)').matches
  return wideEnough && !touchOnly
}

export function App() {
  const [playable, setPlayable] = useState(isPlayable)

  useEffect(() => {
    const onResize = () => setPlayable(isPlayable())
    window.addEventListener('resize', onResize)
    return () => window.removeEventListener('resize', onResize)
  }, [])

  return playable ? <GameShell /> : <MobileFallback />
}
