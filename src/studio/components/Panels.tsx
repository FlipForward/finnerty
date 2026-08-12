import { useEffect, useRef } from 'react'
import { LINKS } from '../config/scene'

interface Props {
  onClose: () => void
}

function Panel({ title, children, onClose }: Props & { title: string; children: React.ReactNode }) {
  const closeRef = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    closeRef.current?.focus()
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== 'Escape') return
      e.preventDefault()
      onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  return (
    <div className="panel-overlay" role="dialog" aria-modal="true" aria-label={title}>
      <div className="panel-overlay__backdrop" onClick={onClose} />
      <div className="panel-card">
        <header className="panel-card__head">
          <h2>{title}</h2>
          <button ref={closeRef} className="os-button" type="button" onClick={onClose}>
            CLOSE [ESC]
          </button>
        </header>
        <div className="panel-card__body">{children}</div>
      </div>
    </div>
  )
}

/** Placeholder by design — the full music section is not part of this pass. */
export function AtlazPanel({ onClose }: Props) {
  return (
    <Panel title="ATLAZ" onClose={onClose}>
      <p className="panel-card__lead">MUSIC / DJ / PRODUCER</p>
      <p>
        The decks in the corner belong to ATLAZ — the music side of the room. Releases, sets and
        bookings all live on the ATLAZ site.
      </p>
      <a className="os-button os-button--primary" href={LINKS.atlaz} target="_blank" rel="noopener noreferrer">
        VISIT ATLAZMUSIC.BE ↗
      </a>
    </Panel>
  )
}

/**
 * Placeholder. `LINKS.photography` is null until the portfolio exists — when it
 * does, setting it there is the only change needed.
 */
export function PhotographyPanel({ onClose }: Props) {
  const href = LINKS.photography
  return (
    <Panel title="PHOTOGRAPHY" onClose={onClose}>
      <p className="panel-card__lead">STILLS FROM THE VALLEY AND BEYOND</p>
      <p>
        The camera by the balcony gets carried out more than it stays in. A gallery of the results is
        on its way.
      </p>
      {href ? (
        <a className="os-button os-button--primary" href={href} target="_blank" rel="noopener noreferrer">
          OPEN THE PORTFOLIO ↗
        </a>
      ) : (
        <button className="os-button" type="button" disabled>
          PORTFOLIO COMING INTO FOCUS
        </button>
      )}
    </Panel>
  )
}
