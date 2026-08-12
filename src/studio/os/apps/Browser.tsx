import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Icon } from '../Icon'
import {
  BOOKMARKS,
  CLIPS,
  HANDLE,
  HOME_URL,
  LINKS,
  PHOTOS,
  TWITCH_CHANNEL,
  type PageId,
} from '../osConfig'

/** Twitch keys its embeds to the hostname serving the page. */
function twitchSrc(kind: 'player' | 'chat'): string {
  const parent = encodeURIComponent(window.location.hostname)
  const name = encodeURIComponent(TWITCH_CHANNEL)
  return kind === 'player'
    ? `https://player.twitch.tv/?channel=${name}&parent=${parent}`
    : `https://www.twitch.tv/embed/${name}/chat?parent=${parent}&darkpopout`
}

/**
 * The Twitch player.
 *
 * Whether the channel is live is reported by the embed itself — detecting it
 * here would need a Helix token, which has no business in a client bundle, so
 * nothing here claims a status, a viewer count or any chat content.
 *
 * If the frame has not signalled load after a few seconds it is treated as
 * blocked (extension, CSP, network) and a real link-out replaces it, rather
 * than leaving the visitor staring at a dead rectangle.
 */
function TwitchFrame({ chat = false }: { chat?: boolean }) {
  const [blocked, setBlocked] = useState(false)
  const loaded = useRef(false)

  useEffect(() => {
    const id = window.setTimeout(() => {
      if (!loaded.current) setBlocked(true)
    }, 6000)
    return () => window.clearTimeout(id)
  }, [])

  if (blocked) {
    return (
      <div className="netfail">
        <p className="netfail__code">ERR_EMBED_BLOCKED</p>
        <p className="netfail__msg">
          The stream could not be embedded here. It plays fine on Twitch itself.
        </p>
        <a className="btn btn--go" href={LINKS.twitch} target="_blank" rel="noopener noreferrer">
          Open on Twitch ↗
        </a>
      </div>
    )
  }

  return (
    <iframe
      title={chat ? `${TWITCH_CHANNEL} chat` : `${TWITCH_CHANNEL} on Twitch`}
      src={twitchSrc(chat ? 'chat' : 'player')}
      allowFullScreen={!chat}
      allow="autoplay; fullscreen; encrypted-media; picture-in-picture"
      onLoad={() => {
        loaded.current = true
      }}
    />
  )
}

/* --------------------------------------------------------------- browser */

const PAGE_URL: Record<PageId, string> = {
  home: HOME_URL,
  twitch: `https://twitch.tv/${HANDLE}`,
  clips: 'mrfinnertytv://clips',
  atlaz: 'https://atlazmusic.be',
  photography: 'mrfinnertytv://photos',
  instagram: `https://instagram.com/${HANDLE}`,
}

export function BrowserApp({ onOpenApp }: { onOpenApp: (app: 'gallery' | 'atlaz') => void }) {
  const [history, setHistory] = useState<PageId[]>(['home'])
  const [index, setIndex] = useState(0)
  const [reloadKey, setReloadKey] = useState(0)
  const page = history[index]

  const go = useCallback(
    (next: PageId) => {
      setHistory((h) => [...h.slice(0, index + 1), next])
      setIndex((i) => i + 1)
    },
    [index],
  )

  const canBack = index > 0
  const canFwd = index < history.length - 1

  return (
    <div className="br">
      <div className="br__tabs">
        <span className="br__tab is-active">
          <Icon name="browser" size={11} />
          <span>{page === 'home' ? 'FINN OS — start' : PAGE_URL[page].replace(/^https?:\/\//, '')}</span>
        </span>
        <span className="br__newtab" aria-hidden>
          +
        </span>
      </div>

      <div className="br__chrome">
        <button className="br__nav" type="button" disabled={!canBack} onClick={() => setIndex((i) => i - 1)} aria-label="Back">
          ‹
        </button>
        <button className="br__nav" type="button" disabled={!canFwd} onClick={() => setIndex((i) => i + 1)} aria-label="Forward">
          ›
        </button>
        <button className="br__nav" type="button" onClick={() => setReloadKey((k) => k + 1)} aria-label="Reload">
          ⟳
        </button>
        <span className="br__addr">
          <span className="br__lock" aria-hidden />
          {PAGE_URL[page]}
        </span>
      </div>

      <div className="br__marks">
        {BOOKMARKS.map((b) => (
          <button
            key={b.id}
            className={`br__mark${page === b.id ? ' is-on' : ''}`}
            type="button"
            onClick={() => go(b.id)}
          >
            {b.label}
          </button>
        ))}
      </div>

      <div className="br__view" key={`${page}-${reloadKey}`}>
        {page === 'home' && <HomePage onGo={go} />}
        {page === 'twitch' && <TwitchFrame />}
        {page === 'clips' && <ClipsPage />}
        {page === 'photography' && <LinkOutPage
          title="Photography"
          body="The gallery lives in its own application on this machine."
          actionLabel="Open Gallery"
          onAction={() => onOpenApp('gallery')}
        />}
        {page === 'atlaz' && <LinkOutPage
          title="atlazmusic.be"
          body="External site. It cannot be framed here, so this opens it in a real browser tab."
          actionLabel="Open atlazmusic.be ↗"
          href={LINKS.atlaz}
          secondaryLabel="Open ATLAZ Music app"
          onAction={() => onOpenApp('atlaz')}
        />}
        {page === 'instagram' && <LinkOutPage
          title={`instagram.com/${HANDLE}`}
          body="External site. Instagram does not allow embedding, so this opens in a real browser tab."
          actionLabel="Open Instagram ↗"
          href={LINKS.instagram}
        />}
      </div>
    </div>
  )
}

function HomePage({ onGo }: { onGo: (p: PageId) => void }) {
  return (
    <div className="start">
      <p className="start__brand">MRFINNERTYTV</p>
      <p className="start__sub">start page</p>
      <div className="start__grid">
        {BOOKMARKS.map((b) => (
          <button key={b.id} className="start__card" type="button" onClick={() => onGo(b.id)}>
            <span className="start__label">{b.label}</span>
            <span className="start__blurb">{b.blurb}</span>
            <span className="start__url">{b.url.replace(/^https?:\/\//, '')}</span>
          </button>
        ))}
      </div>
    </div>
  )
}

function ClipsPage() {
  return (
    <div className="page">
      <h2 className="page__h">Clips</h2>
      <ul className="cliplist">
        {CLIPS.map((c) => (
          <li key={c.id}>
            <span className="cliplist__thumb" aria-hidden>
              <span className="cliplist__play" />
            </span>
            <span className="cliplist__text">
              <span className="cliplist__title">{c.title}</span>
              <span className="cliplist__meta">
                {c.meta} · {c.duration}
              </span>
            </span>
            {c.url ? (
              <a className="btn" href={c.url} target="_blank" rel="noopener noreferrer">
                Watch ↗
              </a>
            ) : (
              <span className="cliplist__soon">not published</span>
            )}
          </li>
        ))}
      </ul>
      <p className="page__note">{PHOTOS.length ? '' : ''}</p>
    </div>
  )
}

function LinkOutPage({
  title,
  body,
  actionLabel,
  href,
  onAction,
  secondaryLabel,
}: {
  title: string
  body: string
  actionLabel: string
  href?: string
  onAction?: () => void
  secondaryLabel?: string
}) {
  return (
    <div className="netfail">
      <p className="netfail__code">{title}</p>
      <p className="netfail__msg">{body}</p>
      <div className="netfail__row">
        {href ? (
          <a className="btn btn--go" href={href} target="_blank" rel="noopener noreferrer">
            {actionLabel}
          </a>
        ) : (
          <button className="btn btn--go" type="button" onClick={onAction}>
            {actionLabel}
          </button>
        )}
        {href && secondaryLabel && onAction && (
          <button className="btn" type="button" onClick={onAction}>
            {secondaryLabel}
          </button>
        )}
      </div>
    </div>
  )
}

/* ---------------------------------------------------------------- stream */

export function StreamApp() {
  const channelUrl = useMemo(() => LINKS.twitch, [])
  return (
    <div className="stream">
      <div className="stream__player">
        <TwitchFrame />
      </div>
      <aside className="stream__side">
        <div className="stream__chat">
          <TwitchFrame chat />
        </div>
        <div className="stream__meta">
          <p className="stream__name">{TWITCH_CHANNEL}</p>
          <p className="stream__note">
            Live status is whatever Twitch reports above — nothing here guesses it.
          </p>
          <a className="btn btn--go" href={channelUrl} target="_blank" rel="noopener noreferrer">
            Visit Twitch ↗
          </a>
        </div>
      </aside>
    </div>
  )
}
