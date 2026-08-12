import { useCallback, useRef, type ReactNode } from 'react'
import { Icon } from './Icon'
import { APPS } from './osConfig'
import type { WinState } from './wm'

interface Props {
  win: WinState
  focused: boolean
  title?: string
  onFocus: () => void
  onClose: () => void
  onMinimise: () => void
  onToggleMax: () => void
  onMove: (x: number, y: number) => void
  children: ReactNode
}

/**
 * A desktop window: titlebar, controls, body.
 *
 * Dragging converts pointer deltas through the stage's scale factor. The whole
 * OS lives inside a uniformly scaled stage, so a 10px mouse move is not 10px of
 * window movement — without dividing by the measured scale the window drifts
 * away from the cursor at any resolution other than 1:1.
 */
export function Window({
  win,
  focused,
  title,
  onFocus,
  onClose,
  onMinimise,
  onToggleMax,
  onMove,
  children,
}: Props) {
  const def = APPS[win.id]
  const drag = useRef<{ dx: number; dy: number; scale: number } | null>(null)

  const onPointerDown = useCallback(
    (e: React.PointerEvent<HTMLElement>) => {
      if (win.maximised) return
      const bar = e.currentTarget
      const box = bar.closest('.win') as HTMLElement | null
      if (!box) return
      // Measured, not assumed: rendered width / layout width is the live scale.
      const scale = box.getBoundingClientRect().width / box.offsetWidth || 1
      drag.current = {
        dx: e.clientX / scale - win.x,
        dy: e.clientY / scale - win.y,
        scale,
      }
      bar.setPointerCapture(e.pointerId)
      onFocus()
    },
    [win.maximised, win.x, win.y, onFocus],
  )

  const onPointerMove = useCallback(
    (e: React.PointerEvent<HTMLElement>) => {
      const d = drag.current
      if (!d) return
      onMove(Math.round(e.clientX / d.scale - d.dx), Math.round(e.clientY / d.scale - d.dy))
    },
    [onMove],
  )

  const endDrag = useCallback((e: React.PointerEvent<HTMLElement>) => {
    drag.current = null
    if (e.currentTarget.hasPointerCapture?.(e.pointerId)) {
      e.currentTarget.releasePointerCapture(e.pointerId)
    }
  }, [])

  return (
    <section
      className={`win${focused ? ' is-focused' : ''}`}
      style={{ left: win.x, top: win.y, width: win.w, height: win.h, zIndex: win.z }}
      onPointerDownCapture={onFocus}
      aria-label={def.name}
    >
      <header
        className="win__bar"
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={endDrag}
        onPointerCancel={endDrag}
        onDoubleClick={onToggleMax}
      >
        <Icon name={def.icon} size={13} className="win__icon" />
        <span className="win__title">{title ?? def.name}</span>
        <span className="win__controls">
          <button className="win__btn" type="button" onClick={onMinimise} aria-label={`Minimise ${def.name}`}>
            <svg viewBox="0 0 10 10" shapeRendering="crispEdges" aria-hidden>
              <rect x="2" y="6" width="6" height="1" />
            </svg>
          </button>
          <button
            className="win__btn"
            type="button"
            onClick={onToggleMax}
            aria-label={`${win.maximised ? 'Restore' : 'Maximise'} ${def.name}`}
          >
            <svg viewBox="0 0 10 10" shapeRendering="crispEdges" aria-hidden>
              <rect x="2" y="2" width="6" height="1" />
              <rect x="2" y="7" width="6" height="1" />
              <rect x="2" y="2" width="1" height="6" />
              <rect x="7" y="2" width="1" height="6" />
            </svg>
          </button>
          <button
            className="win__btn win__btn--close"
            type="button"
            onClick={onClose}
            aria-label={`Close ${def.name}`}
          >
            <svg viewBox="0 0 10 10" shapeRendering="crispEdges" aria-hidden>
              <rect x="2" y="2" width="1" height="1" />
              <rect x="3" y="3" width="1" height="1" />
              <rect x="4" y="4" width="2" height="2" />
              <rect x="6" y="6" width="1" height="1" />
              <rect x="7" y="7" width="1" height="1" />
              <rect x="7" y="2" width="1" height="1" />
              <rect x="6" y="3" width="1" height="1" />
              <rect x="3" y="6" width="1" height="1" />
              <rect x="2" y="7" width="1" height="1" />
            </svg>
          </button>
        </span>
      </header>

      <div className="win__body">{children}</div>
    </section>
  )
}
