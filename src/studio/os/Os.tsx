import { useEffect, useState } from 'react'
import { AboutApp, ClipModal, ClipsApp, LiveApp, PlayApp } from './apps'
import { APPS, APP_FADE_MS, DEFAULT_APP, type AppId, type ClipDef } from './osConfig'

interface Props {
  /** EXIT, or Escape with nothing else open. */
  onPowerOff: () => void
}

/**
 * MRFINNERTYTV OS.
 *
 * A fixed-size desktop that lives inside the monitor's screen rectangle. The
 * shell owns exactly three things: which app is showing, whether a modal is up,
 * and the Escape ordering between them. Apps themselves are dumb views.
 */
export function Os({ onPowerOff }: Props) {
  const [app, setApp] = useState<AppId>(DEFAULT_APP)
  const [modalClip, setModalClip] = useState<ClipDef | null>(null)

  // Escape closes a modal first, and only exits the OS once nothing is stacked
  // on top of the desktop. Capture phase so it beats anything inside an app.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== 'Escape') return
      e.preventDefault()
      e.stopPropagation()
      if (modalClip) setModalClip(null)
      else onPowerOff()
    }
    window.addEventListener('keydown', onKey, true)
    return () => window.removeEventListener('keydown', onKey, true)
  }, [modalClip, onPowerOff])

  const active = APPS.find((a) => a.id === app) ?? APPS[0]

  return (
    <div className="os" style={{ ['--app-fade' as string]: `${APP_FADE_MS}ms` }}>
      {/* Oversized, cropped, and well behind everything. Pure texture.
          Wrapped in its own clipping layer so an intentionally out-of-bounds
          decoration can never contribute to the desktop's scroll box. */}
      <div className="os__bg" aria-hidden>
        <div className="os__wordmark">MRFINNERTYTV</div>
      </div>

      <TopBar onExit={onPowerOff} />

      <div className="os__body">
        <Dock active={app} onSelect={setApp} />

        <main className="os__main">
          <section className="win" key={app}>
            <header className="win__strip">
              <span className="win__dot" aria-hidden />
              <span className="win__name">{active.name}</span>
              <span className="win__path">mrfinnertytv://{active.id}</span>
            </header>

            <div className="win__body">
              <h1 className="win__heading">{active.heading}</h1>
              <div className="win__content">
                {app === 'live' && <LiveApp />}
                {app === 'clips' && <ClipsApp onSelect={setModalClip} />}
                {app === 'play' && <PlayApp />}
                {app === 'about' && <AboutApp />}
              </div>
            </div>
          </section>
        </main>
      </div>

      {modalClip && <ClipModal clip={modalClip} onClose={() => setModalClip(null)} />}
    </div>
  )
}

function TopBar({ onExit }: { onExit: () => void }) {
  return (
    <header className="os__bar">
      <span className="os__mark" aria-hidden>
        MF
      </span>
      <span className="os__brand">MRFINNERTYTV OS</span>
      <span className="os__spacer" />
      <span className="os__status">
        <span className="os__led" aria-hidden />
        ONLINE
      </span>
      <Clock />
      <button className="os__exit" type="button" onClick={onExit}>
        EXIT
      </button>
    </header>
  )
}

function Clock() {
  const [now, setNow] = useState(() => new Date())
  useEffect(() => {
    const id = window.setInterval(() => setNow(new Date()), 30_000)
    return () => window.clearInterval(id)
  }, [])
  return (
    <span className="os__clock">
      {String(now.getHours()).padStart(2, '0')}:{String(now.getMinutes()).padStart(2, '0')}
    </span>
  )
}

/** Pixel glyphs as rects on a 12x12 grid — no icon font, no SVG curves. */
const GLYPHS: Record<AppId, [number, number, number, number][]> = {
  // broadcast: centre dot with a bracket either side
  live: [
    [5, 5, 2, 2],
    [2, 3, 1, 6],
    [3, 2, 1, 1],
    [3, 9, 1, 1],
    [9, 3, 1, 6],
    [8, 2, 1, 1],
    [8, 9, 1, 1],
  ],
  // film strip: body with sprocket holes
  clips: [
    [1, 2, 10, 8],
    [2, 3, 1, 1],
    [2, 5, 1, 1],
    [2, 7, 1, 1],
    [9, 3, 1, 1],
    [9, 5, 1, 1],
    [9, 7, 1, 1],
    [4, 4, 4, 4],
  ],
  // d-pad
  play: [
    [4, 1, 4, 10],
    [1, 4, 10, 4],
  ],
  // head and shoulders
  about: [
    [4, 2, 4, 4],
    [2, 7, 8, 4],
  ],
}

function Glyph({ id }: { id: AppId }) {
  return (
    <svg className="dock__glyph" viewBox="0 0 12 12" shapeRendering="crispEdges" aria-hidden>
      {GLYPHS[id].map(([x, y, w, h], i) => (
        <rect key={i} x={x} y={y} width={w} height={h} />
      ))}
    </svg>
  )
}

function Dock({ active, onSelect }: { active: AppId; onSelect: (id: AppId) => void }) {
  return (
    <nav className="dock" aria-label="Applications">
      {APPS.map((a) => (
        <button
          key={a.id}
          className={`dock__item${active === a.id ? ' is-active' : ''}`}
          type="button"
          onClick={() => onSelect(a.id)}
          aria-current={active === a.id}
        >
          <Glyph id={a.glyph} />
          <span className="dock__label">{a.name}</span>
        </button>
      ))}
    </nav>
  )
}
