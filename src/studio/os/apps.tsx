import { useEffect, useMemo, useRef } from 'react'
import { ABOUT, CLIPS, SOCIALS, TWITCH_CHANNEL, type ClipDef } from './osConfig'

/* ------------------------------------------------------------------ LIVE */

/**
 * Twitch's official player and chat.
 *
 * Whether the channel is live is reported by the embed itself. Detecting it
 * here would need a Helix token, which does not belong in a client bundle — so
 * nothing on this screen claims a status, a viewer count or any chat content.
 * The channel name and a route to Twitch are always present either way.
 */
export function LiveApp() {
  const { playerSrc, chatSrc, channelUrl } = useMemo(() => {
    if (!TWITCH_CHANNEL) return { playerSrc: '', chatSrc: '', channelUrl: '' }
    const parent = encodeURIComponent(window.location.hostname)
    const name = encodeURIComponent(TWITCH_CHANNEL)
    return {
      playerSrc: `https://player.twitch.tv/?channel=${name}&parent=${parent}`,
      chatSrc: `https://www.twitch.tv/embed/${name}/chat?parent=${parent}&darkpopout`,
      channelUrl: `https://www.twitch.tv/${name}`,
    }
  }, [])

  if (!TWITCH_CHANNEL) {
    return (
      <div className="state">
        <PixelGlyph shape="signal" />
        <p className="state__head">NO CHANNEL ROUTED</p>
        <p className="state__body">
          This machine has no stream source configured.
          {import.meta.env.DEV && (
            <>
              {' '}
              Set <code>VITE_TWITCH_CHANNEL</code> and rebuild.
            </>
          )}
        </p>
      </div>
    )
  }

  return (
    <div className="live">
      <div className="live__player">
        <iframe
          title={`${TWITCH_CHANNEL} on Twitch`}
          src={playerSrc}
          allowFullScreen
          allow="autoplay; fullscreen; encrypted-media; picture-in-picture"
        />
      </div>

      <aside className="live__side">
        <div className="live__chat">
          <iframe title={`${TWITCH_CHANNEL} chat`} src={chatSrc} />
        </div>
        <a className="btn btn--primary" href={channelUrl} target="_blank" rel="noopener noreferrer">
          OPEN ON TWITCH
        </a>
      </aside>
    </div>
  )
}

/* ----------------------------------------------------------------- CLIPS */

export function ClipsApp({ onSelect }: { onSelect: (clip: ClipDef) => void }) {
  const [featured, ...rest] = CLIPS

  return (
    <div className="clips">
      <button className="clips__feature" type="button" onClick={() => onSelect(featured)}>
        <Thumb clip={featured} large />
        <span className="clips__ftitle">{featured.title}</span>
        <span className="clips__fmeta">
          {featured.meta} · {featured.duration}
        </span>
      </button>

      <div className="clips__list">
        <p className="clips__lhead">RECENT</p>
        {rest.map((clip) => (
          <button key={clip.id} className="clips__row" type="button" onClick={() => onSelect(clip)}>
            <Thumb clip={clip} />
            <span className="clips__rtext">
              <span className="clips__rtitle">{clip.title}</span>
              <span className="clips__rmeta">
                {clip.meta} · {clip.duration}
              </span>
            </span>
          </button>
        ))}
      </div>
    </div>
  )
}

/** Generated pixel pattern until a real thumbnail path is set in the config. */
function Thumb({ clip, large = false }: { clip: ClipDef; large?: boolean }) {
  return (
    <span className={`thumb${large ? ' thumb--lg' : ''}`}>
      {clip.thumbnail ? (
        <img src={clip.thumbnail} alt="" />
      ) : (
        <span className="thumb__grid" aria-hidden />
      )}
      <span className="thumb__play" aria-hidden />
      <span className="thumb__dur">{clip.duration}</span>
    </span>
  )
}

export function ClipModal({ clip, onClose }: { clip: ClipDef; onClose: () => void }) {
  const closeRef = useRef<HTMLButtonElement>(null)
  useEffect(() => {
    closeRef.current?.focus()
  }, [])

  return (
    <div className="modal" role="dialog" aria-modal="true" aria-label={clip.title}>
      <div className="modal__scrim" onClick={onClose} />
      <div className="modal__box">
        <header className="modal__strip">
          <span className="modal__title">{clip.title}</span>
          <button ref={closeRef} className="modal__x" type="button" onClick={onClose}>
            CLOSE [ESC]
          </button>
        </header>
        <div className="modal__screen">
          <span className="thumb__grid" aria-hidden />
          <span className="modal__note">
            {clip.url ? 'Clip source configured.' : 'Clip source not wired up yet.'}
          </span>
        </div>
        <footer className="modal__foot">
          <span>
            {clip.meta} · {clip.duration}
          </span>
          {clip.url && (
            <a className="btn" href={clip.url} target="_blank" rel="noopener noreferrer">
              WATCH ↗
            </a>
          )}
        </footer>
      </div>
    </div>
  )
}

/* ------------------------------------------------------------------ PLAY */

export function PlayApp() {
  return (
    <div className="state">
      <PixelGlyph shape="cone" />
      <p className="state__head">IN PROGRESS</p>
      <p className="state__body">A small game is being built. Come back soon.</p>
      <span className="state__bar" aria-hidden>
        <span />
      </span>
    </div>
  )
}

/* ----------------------------------------------------------------- ABOUT */

export function AboutApp() {
  return (
    <div className="about">
      <div className="about__bio">
        <p className="about__name">{ABOUT.name}</p>
        <p className="about__role">{ABOUT.role}</p>
        <p className="about__blurb">{ABOUT.blurb}</p>
      </div>

      <ul className="about__links">
        {SOCIALS.map((s) =>
          s.href ? (
            <li key={s.id}>
              <a className="link" href={s.href} target="_blank" rel="noopener noreferrer">
                <span className="link__label">{s.label}</span>
                <span className="link__handle">{s.handle}</span>
                <span className="link__arrow" aria-hidden>
                  ↗
                </span>
              </a>
            </li>
          ) : (
            // Unconfigured destinations are stated plainly rather than dressed
            // up as buttons that do nothing.
            <li key={s.id}>
              <span className="link link--empty">
                <span className="link__label">{s.label}</span>
                <span className="link__handle">{s.handle}</span>
              </span>
            </li>
          ),
        )}
      </ul>
    </div>
  )
}

/* ---------------------------------------------------------------- shared */

const SHAPES = {
  cone: [
    ['a', 6, 2, 4, 2],
    ['a', 5, 4, 6, 2],
    ['c', 5, 5, 6, 1],
    ['a', 4, 6, 8, 2],
    ['a', 3, 8, 10, 2],
    ['c', 3, 9, 10, 1],
    ['a', 2, 10, 12, 2],
    ['d', 1, 12, 14, 3],
  ],
  signal: [
    ['a', 7, 7, 2, 2],
    ['a', 3, 5, 1, 6],
    ['a', 4, 4, 1, 1],
    ['a', 4, 11, 1, 1],
    ['a', 12, 5, 1, 6],
    ['a', 11, 4, 1, 1],
    ['a', 11, 11, 1, 1],
  ],
} as const

/** Hard-edged pixel geometry. No icon font, no curves. */
function PixelGlyph({ shape }: { shape: keyof typeof SHAPES }) {
  return (
    <svg className="pglyph" viewBox="0 0 16 16" shapeRendering="crispEdges" aria-hidden>
      {SHAPES[shape].map(([tone, x, y, w, h], i) => (
        <rect key={i} className={`pglyph--${tone}`} x={x} y={y} width={w} height={h} />
      ))}
    </svg>
  )
}
