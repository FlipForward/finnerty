import { useEffect, useRef } from 'react'
import type { DialogPayload } from '../game/events'
import { PixelText } from './PixelText'

interface Props {
  payload: DialogPayload
  onClose: () => void
}

/**
 * The generic info panel behind signs and the portal.
 *
 * Every `{ type: 'dialog' }` interactable renders through here, so adding a new
 * readable landmark needs no new component — just an entry in
 * game/world/interactables.ts.
 */
export function DialogOverlay({ payload, onClose }: Props) {
  const closeRef = useRef<HTMLButtonElement>(null)

  // Move focus into the panel so Escape and Enter are handled here rather than
  // leaking to the canvas underneath.
  useEffect(() => {
    closeRef.current?.focus()
  }, [])

  return (
    <div className="overlay" role="dialog" aria-modal="true" aria-label={payload.title}>
      <div className="overlay__backdrop" onClick={onClose} />
      <div className="panel panel--dialog">
        <header className="panel__header">
          <PixelText text={payload.title} scale={3} color="#e0d1b3" shadowColor="#14202b" />
        </header>
        <div className="panel__body">
          {payload.body.map((paragraph, index) => (
            <p key={index}>{paragraph}</p>
          ))}
        </div>
        <footer className="panel__footer">
          <button ref={closeRef} className="button" type="button" onClick={onClose}>
            CLOSE [ESC]
          </button>
        </footer>
      </div>
    </div>
  )
}
