import { useCallback, useEffect, useState } from 'react'
import { PRELOAD_SOURCES, REVEAL_HOLD_MS } from './studio/config/loading'
import { usePreload } from './studio/hooks/usePreload'
import { LoadingScreen } from './studio/components/LoadingScreen'
import { MobileStudio } from './studio/components/MobileStudio'
import { PcCloseup } from './studio/components/PcCloseup'
import { AtlazPanel, PhotographyPanel } from './studio/components/Panels'
import { Studio } from './studio/components/Studio'
import type { HotspotId } from './studio/config/scene'

/** Below this the room is not worth walking, so we do not pretend. */
const MIN_WIDTH = 900
const MIN_HEIGHT = 480

function isDesktop(): boolean {
  const bigEnough = window.innerWidth >= MIN_WIDTH && window.innerHeight >= MIN_HEIGHT
  const touchOnly = window.matchMedia('(pointer: coarse) and (hover: none)').matches
  return bigEnough && !touchOnly
}

type View = { kind: 'studio' } | { kind: 'pc' } | { kind: 'panel'; id: 'atlaz' | 'photography' }

export function App() {
  const [desktop, setDesktop] = useState(isDesktop)
  const [view, setView] = useState<View>({ kind: 'studio' })

  // Nothing is interactive until every asset has decoded. `revealed` trails
  // `preload.done` by the hold + fade so the screen reads as finishing rather
  // than blinking out, and the room is not clickable through it.
  const preload = usePreload(PRELOAD_SOURCES)
  const [revealed, setRevealed] = useState(false)

  useEffect(() => {
    if (!preload.done || revealed) return
    const id = window.setTimeout(() => setRevealed(true), REVEAL_HOLD_MS)
    return () => window.clearTimeout(id)
  }, [preload.done, revealed])

  // `?loading=1` pins the loading screen open in dev. On a warm cache it is
  // gone in under a frame, which makes it impossible to look at otherwise.
  // Same convention as `?calibrate=1` on the room.
  const pinLoading =
    import.meta.env.DEV && new URLSearchParams(window.location.search).has('loading')
  const showLoading = pinLoading || !revealed

  useEffect(() => {
    const onResize = () => setDesktop(isDesktop())
    window.addEventListener('resize', onResize)
    return () => window.removeEventListener('resize', onResize)
  }, [])

  const open = useCallback((id: HotspotId) => {
    if (id === 'pc') setView({ kind: 'pc' })
    else setView({ kind: 'panel', id })
  }, [])

  const close = useCallback(() => setView({ kind: 'studio' }), [])

  // Dev-only handle. The normal route into a view is hovering a hotspot and
  // waiting for the character to walk there, which needs requestAnimationFrame —
  // unavailable in a headless/background tab, so smoke checks need a way in.
  useEffect(() => {
    if (!import.meta.env.DEV) return
    const w = window as unknown as Record<string, unknown>
    w.__APP__ = { open, close, view: () => view }
    return () => {
      delete w.__APP__
    }
  }, [open, close, view])

  if (!desktop) return <MobileStudio />

  return (
    <>
      {/* The room mounts underneath immediately so it is fully painted by the
          time the loading screen lifts. */}
      <Studio onOpen={open} interactive={!showLoading && view.kind === 'studio'} />
      {view.kind === 'pc' && <PcCloseup onExit={close} />}
      {view.kind === 'panel' && view.id === 'atlaz' && <AtlazPanel onClose={close} />}
      {view.kind === 'panel' && view.id === 'photography' && <PhotographyPanel onClose={close} />}
      {showLoading && (
        <LoadingScreen progress={pinLoading ? 0.42 : preload.progress} complete={!pinLoading && preload.done} />
      )}
    </>
  )
}
