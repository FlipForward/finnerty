import { useCallback, useEffect, useMemo, useReducer, useRef, useState } from 'react'
import { Icon } from './Icon'
import { Window } from './Window'
import { BrowserApp, StreamApp } from './apps/Browser'
import {
  AboutApp,
  AtlazApp,
  FilesApp,
  GalleryApp,
  GameApp,
  SettingsApp,
  ViewerApp,
  type Prefs,
} from './apps/Desk'
import {
  APPS,
  BOOT_BLACK_MS,
  BOOT_LINES,
  BOOT_LINE_MS,
  DOCK_APPS,
  DOCS,
  SHORTCUTS,
  type AppId,
} from './osConfig'
import { wallpaperUrl } from './wallpaper'
import { focusedWindow, initialWm, wmReducer } from './wm'

interface Props {
  /** Power control, Settings, or Escape on an empty desktop. */
  onPowerOff: () => void
}

type Phase = 'black' | 'boot' | 'desktop'

/**
 * FINN OS.
 *
 * The desktop shell: panel, wallpaper, shortcuts, dock, and a small window
 * manager. Apps are dumb views; everything about *where* a window is lives in
 * the reducer, and everything about *what* an app is lives in osConfig.
 */
export function Os({ onPowerOff }: Props) {
  const [phase, setPhase] = useState<Phase>('black')
  const [bootLine, setBootLine] = useState(0)
  const [wm, dispatch] = useReducer(wmReducer, initialWm)
  const [menu, setMenu] = useState(false)
  const [filesPath, setFilesPath] = useState('/home/finn')
  const [prefs, setPrefs] = useState<Prefs>({ reducedMotion: false, sound: true })
  const wallpaper = useMemo(() => wallpaperUrl(), [])
  const deskRef = useRef<HTMLDivElement>(null)

  const boot = useCallback(() => {
    setPhase('black')
    setBootLine(0)
  }, [])

  // Boot: black, then lines, then the desktop.
  useEffect(() => {
    if (phase === 'black') {
      const id = window.setTimeout(() => setPhase('boot'), BOOT_BLACK_MS)
      return () => window.clearTimeout(id)
    }
    if (phase === 'boot') {
      if (bootLine >= BOOT_LINES.length) {
        const id = window.setTimeout(() => setPhase('desktop'), 260)
        return () => window.clearTimeout(id)
      }
      const id = window.setTimeout(() => setBootLine((l) => l + 1), BOOT_LINE_MS)
      return () => window.clearTimeout(id)
    }
  }, [phase, bootLine])

  const open = useCallback((app: AppId, arg?: string) => {
    if (app === 'files' && arg) setFilesPath(arg)
    dispatch({ type: 'open', app, arg })
    setMenu(false)
  }, [])

  const focused = focusedWindow(wm)

  // Escape: menu first, then the focused window, then out to the studio.
  // Alt+Tab cycles the visible stack.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Tab' && e.altKey) {
        e.preventDefault()
        dispatch({ type: 'cycle' })
        return
      }
      if (e.key !== 'Escape') return
      e.preventDefault()
      e.stopPropagation()
      if (menu) setMenu(false)
      else if (focused) dispatch({ type: 'close', id: focused.id })
      else onPowerOff()
    }
    window.addEventListener('keydown', onKey, true)
    return () => window.removeEventListener('keydown', onKey, true)
  }, [menu, focused, onPowerOff])

  if (phase !== 'desktop') {
    return (
      <div className="os os--boot">
        {phase === 'boot' && (
          <div className="os__bootlines">
            {BOOT_LINES.slice(0, bootLine).map((l, i) => (
              <p key={l} className={i === 0 ? 'os__bootlead' : undefined}>
                {l}
              </p>
            ))}
            <span className="os__caret" />
          </div>
        )}
      </div>
    )
  }

  return (
    <div className={`os${prefs.reducedMotion ? ' os--still' : ''}`}>
      <TopPanel
        active={focused ? APPS[focused.id].name : 'Desktop'}
        sound={prefs.sound}
        menuOpen={menu}
        onMenu={() => setMenu((m) => !m)}
        onPower={onPowerOff}
      />

      {menu && (
        <div className="menu" role="menu">
          <p className="menu__head">Applications</p>
          {DOCK_APPS.map((id) => (
            <button key={id} className="menu__item" type="button" role="menuitem" onClick={() => open(id)}>
              <Icon name={APPS[id].icon} size={14} />
              <span>{APPS[id].name}</span>
            </button>
          ))}
          <div className="menu__sep" />
          <button className="menu__item menu__item--power" type="button" role="menuitem" onClick={onPowerOff}>
            <Icon name="home" size={14} />
            <span>Return to studio</span>
          </button>
        </div>
      )}

      <div
        className="desk"
        ref={deskRef}
        style={{ backgroundImage: `url(${wallpaper})` }}
        onPointerDown={(e) => {
          if (e.target === e.currentTarget) setMenu(false)
        }}
      >
        <div className="desk__icons">
          {SHORTCUTS.map((s) => (
            <button
              key={s.id}
              className="desk__icon"
              type="button"
              onDoubleClick={() => open(s.opens.app, s.opens.arg)}
              onClick={() => open(s.opens.app, s.opens.arg)}
            >
              <Icon name={s.icon} size={26} />
              <span>{s.label}</span>
            </button>
          ))}
        </div>

        {wm.wins
          .filter((w) => !w.minimised)
          .map((w) => (
            <Window
              key={w.id}
              win={w}
              focused={focused?.id === w.id}
              title={w.id === 'viewer' && w.arg ? (DOCS[w.arg]?.title ?? 'Viewer') : undefined}
              onFocus={() => dispatch({ type: 'focus', id: w.id })}
              onClose={() => dispatch({ type: 'close', id: w.id })}
              onMinimise={() => dispatch({ type: 'minimise', id: w.id })}
              onToggleMax={() => dispatch({ type: 'toggleMax', id: w.id })}
              onMove={(x, y) => dispatch({ type: 'move', id: w.id, x, y })}
            >
              {w.id === 'browser' && <BrowserApp onOpenApp={(a) => open(a)} />}
              {w.id === 'stream' && <StreamApp />}
              {w.id === 'files' && <FilesApp path={filesPath} onPath={setFilesPath} onOpen={open} />}
              {w.id === 'viewer' && <ViewerApp path={w.arg} />}
              {w.id === 'gallery' && <GalleryApp />}
              {w.id === 'atlaz' && <AtlazApp />}
              {w.id === 'game' && <GameApp />}
              {w.id === 'about' && <AboutApp />}
              {w.id === 'settings' && (
                <SettingsApp prefs={prefs} onPrefs={setPrefs} onReboot={boot} onExit={onPowerOff} />
              )}
            </Window>
          ))}
      </div>

      <Dock
        openIds={wm.wins.map((w) => w.id)}
        focusedId={focused?.id ?? null}
        minimised={wm.wins.filter((w) => w.minimised).map((w) => w.id)}
        onLaunch={() => setMenu((m) => !m)}
        onPick={(id) => {
          const w = wm.wins.find((x) => x.id === id)
          if (w && !w.minimised && focused?.id === id) dispatch({ type: 'minimise', id })
          else open(id)
        }}
      />
    </div>
  )
}

function TopPanel({
  active,
  sound,
  menuOpen,
  onMenu,
  onPower,
}: {
  active: string
  sound: boolean
  menuOpen: boolean
  onMenu: () => void
  onPower: () => void
}) {
  const [now, setNow] = useState(() => new Date())
  useEffect(() => {
    const id = window.setInterval(() => setNow(new Date()), 30_000)
    return () => window.clearInterval(id)
  }, [])

  return (
    <header className="panel">
      <button className={`panel__menu${menuOpen ? ' is-on' : ''}`} type="button" onClick={onMenu} aria-expanded={menuOpen}>
        <span className="panel__mf">MF</span>
        <span>FINN OS</span>
      </button>

      <span className="panel__active">{active}</span>

      <span className="panel__right">
        <span className="panel__stat" title="Network">
          <svg viewBox="0 0 12 10" shapeRendering="crispEdges" aria-hidden>
            <rect x="0" y="7" width="2" height="3" />
            <rect x="3" y="5" width="2" height="5" />
            <rect x="6" y="3" width="2" height="7" />
            <rect x="9" y="1" width="2" height="9" />
          </svg>
        </span>
        <span className="panel__stat" title={sound ? 'Sound on' : 'Sound muted'}>
          <svg viewBox="0 0 12 10" shapeRendering="crispEdges" aria-hidden>
            <rect x="1" y="4" width="2" height="2" />
            <rect x="3" y="3" width="1" height="4" />
            <rect x="4" y="1" width="2" height="8" />
            {sound ? (
              <>
                <rect x="7" y="3" width="1" height="4" />
                <rect x="9" y="1" width="1" height="8" />
              </>
            ) : (
              <>
                <rect x="7" y="4" width="1" height="1" />
                <rect x="8" y="5" width="1" height="1" />
                <rect x="9" y="6" width="1" height="1" />
                <rect x="9" y="4" width="1" height="1" />
                <rect x="7" y="6" width="1" height="1" />
              </>
            )}
          </svg>
        </span>
        <span className="panel__clock">
          {String(now.getHours()).padStart(2, '0')}:{String(now.getMinutes()).padStart(2, '0')}
        </span>
        <button className="panel__power" type="button" onClick={onPower} title="Return to studio" aria-label="Return to studio">
          <svg viewBox="0 0 12 12" shapeRendering="crispEdges" aria-hidden>
            <rect x="5" y="1" width="2" height="5" />
            <rect x="2" y="3" width="1" height="1" />
            <rect x="1" y="4" width="1" height="4" />
            <rect x="2" y="8" width="1" height="1" />
            <rect x="3" y="9" width="6" height="1" />
            <rect x="9" y="8" width="1" height="1" />
            <rect x="10" y="4" width="1" height="4" />
            <rect x="9" y="3" width="1" height="1" />
          </svg>
        </button>
      </span>
    </header>
  )
}

function Dock({
  openIds,
  focusedId,
  minimised,
  onLaunch,
  onPick,
}: {
  openIds: AppId[]
  focusedId: AppId | null
  minimised: AppId[]
  onLaunch: () => void
  onPick: (id: AppId) => void
}) {
  return (
    <nav className="dock" aria-label="Dock">
      <button className="dock__launch" type="button" onClick={onLaunch} aria-label="Applications">
        <Icon name="launcher" size={20} />
      </button>
      <span className="dock__sep" />
      {DOCK_APPS.map((id) => {
        const running = openIds.includes(id)
        return (
          <button
            key={id}
            className={`dock__item${running ? ' is-running' : ''}${focusedId === id && !minimised.includes(id) ? ' is-focused' : ''}`}
            type="button"
            onClick={() => onPick(id)}
            title={APPS[id].name}
            aria-label={APPS[id].name}
          >
            <Icon name={APPS[id].icon} size={20} />
            <span className="dock__pip" aria-hidden />
          </button>
        )
      })}
    </nav>
  )
}
