import { useCallback, useEffect, useState } from 'react'
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
      <Studio onOpen={open} interactive={view.kind === 'studio'} />
      {view.kind === 'pc' && <PcCloseup onExit={close} />}
      {view.kind === 'panel' && view.id === 'atlaz' && <AtlazPanel onClose={close} />}
      {view.kind === 'panel' && view.id === 'photography' && <PhotographyPanel onClose={close} />}
    </>
  )
}
