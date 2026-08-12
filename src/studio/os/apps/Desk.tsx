import { useMemo, useState } from 'react'
import { Icon } from '../Icon'
import {
  DOCS,
  FS,
  GAME,
  HANDLE,
  LINKS,
  PHOTOS,
  PLACES,
  RELEASES,
  type AppId,
  type FsNode,
} from '../osConfig'

type OpenFn = (app: AppId, arg?: string) => void

/* ------------------------------------------------------------------ files */

export function FilesApp({ path, onPath, onOpen }: { path: string; onPath: (p: string) => void; onOpen: OpenFn }) {
  const entries = FS[path] ?? []
  const parent = path.split('/').slice(0, -1).join('/')
  const canUp = path !== '/home/finn' && FS[parent] !== undefined

  const activate = (node: FsNode) => {
    if (node.kind === 'dir') {
      const next = `${path}/${node.name}`
      if (FS[next]) onPath(next)
      return
    }
    if (node.opens) onOpen(node.opens.app, node.opens.arg)
  }

  return (
    <div className="files">
      <nav className="files__side">
        <p className="files__shead">Places</p>
        {PLACES.map((p) => (
          <button
            key={p.path}
            className={`files__place${path === p.path ? ' is-on' : ''}`}
            type="button"
            onClick={() => onPath(p.path)}
          >
            <Icon name={p.icon} size={13} />
            <span>{p.label}</span>
          </button>
        ))}
      </nav>

      <div className="files__main">
        <div className="files__path">
          <button className="files__up" type="button" disabled={!canUp} onClick={() => onPath(parent)} aria-label="Up one level">
            ↑
          </button>
          <span className="files__crumbs">{path}</span>
          <span className="files__count">{entries.length} items</span>
        </div>

        {entries.length === 0 ? (
          <p className="files__empty">This folder is empty.</p>
        ) : (
          <table className="files__list">
            <thead>
              <tr>
                <th>Name</th>
                <th>Size</th>
                <th>Modified</th>
              </tr>
            </thead>
            <tbody>
              {entries.map((n) => (
                <tr key={n.name}>
                  <td>
                    <button className="files__row" type="button" onDoubleClick={() => activate(n)} onClick={() => activate(n)}>
                      <Icon name={n.icon} size={14} />
                      <span>{n.name}</span>
                    </button>
                  </td>
                  <td>{n.kind === 'dir' ? '—' : n.size}</td>
                  <td>{n.modified}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}

/* ----------------------------------------------------------------- viewer */

export function ViewerApp({ path }: { path?: string }) {
  const doc = path ? DOCS[path] : undefined
  if (!doc) return <p className="files__empty">No document.</p>
  return (
    <div className="viewer">
      <pre>{doc.body.join('\n')}</pre>
    </div>
  )
}

/* ---------------------------------------------------------------- gallery */

export function GalleryApp() {
  const [sel, setSel] = useState(0)
  const photo = PHOTOS[sel]
  return (
    <div className="gal">
      <div className="gal__stage">
        {photo.src ? (
          <img src={photo.src} alt={photo.title} />
        ) : (
          // Placeholder frame, not stock photography — nothing here pretends
          // to be one of Finn's photographs.
          <div className="gal__ph">
            <span className="gal__phgrid" aria-hidden />
            <span className="gal__phlabel">NO IMAGE LOADED</span>
          </div>
        )}
      </div>
      <div className="gal__bar">
        <span className="gal__title">{photo.title}</span>
        <span className="gal__meta">{photo.meta}</span>
      </div>
      <div className="gal__strip">
        {PHOTOS.map((p, i) => (
          <button
            key={p.id}
            className={`gal__thumb${i === sel ? ' is-on' : ''}`}
            type="button"
            onClick={() => setSel(i)}
            aria-label={p.title}
          >
            {p.src ? <img src={p.src} alt="" /> : <span className="gal__phgrid" aria-hidden />}
          </button>
        ))}
      </div>
    </div>
  )
}

/* ------------------------------------------------------------------ atlaz */

export function AtlazApp() {
  const [sel, setSel] = useState(0)
  // A visualiser that does not pretend to analyse audio — there is none playing.
  const bars = useMemo(() => Array.from({ length: 28 }, (_, i) => 24 + ((i * 37) % 62)), [])
  const release = RELEASES[sel]

  return (
    <div className="atlaz">
      <div className="atlaz__list">
        <p className="atlaz__head">Library</p>
        {RELEASES.map((r, i) => (
          <button
            key={r.id}
            className={`atlaz__row${i === sel ? ' is-on' : ''}`}
            type="button"
            onClick={() => setSel(i)}
          >
            <Icon name={r.kind === 'Mix' ? 'atlaz' : 'music'} size={13} />
            <span className="atlaz__t">{r.title}</span>
            <span className="atlaz__len">{r.length}</span>
          </button>
        ))}
      </div>

      <div className="atlaz__now">
        <div className="atlaz__art" aria-hidden>
          <Icon name="atlaz" size={54} />
        </div>
        <p className="atlaz__title">{release.title}</p>
        <p className="atlaz__sub">
          ATLAZ · {release.kind} · {release.year}
        </p>

        <div className="atlaz__viz" aria-hidden>
          {bars.map((h, i) => (
            <span key={i} style={{ height: `${h}%`, animationDelay: `${(i % 7) * 90}ms` }} />
          ))}
        </div>

        <p className="atlaz__note">Streaming is on the ATLAZ site, not on this machine.</p>
        <a className="btn btn--go" href={LINKS.atlaz} target="_blank" rel="noopener noreferrer">
          Open atlazmusic.be ↗
        </a>
      </div>
    </div>
  )
}

/* ------------------------------------------------------------------- game */

export function GameApp() {
  return (
    <div className="game">
      <div className="game__tile">
        <div className="game__art" aria-hidden>
          <Icon name="game" size={46} />
        </div>
        <span className="game__status">{GAME.status}</span>
      </div>
      <div className="game__info">
        <p className="game__title">{GAME.title}</p>
        <p className="game__blurb">{GAME.blurb}</p>
        <dl className="game__meta">
          {GAME.meta.map(([k, v]) => (
            <div key={k}>
              <dt>{k}</dt>
              <dd>{v}</dd>
            </div>
          ))}
        </dl>
        <div className="game__bar" aria-hidden>
          <span />
        </div>
      </div>
    </div>
  )
}

/* ------------------------------------------------------------------ about */

export function AboutApp() {
  const rows: [string, string | null][] = [
    ['twitch', LINKS.twitch],
    ['instagram', LINKS.instagram],
    ['youtube', LINKS.youtube],
    ['atlaz', LINKS.atlaz],
    ['contact', LINKS.contact],
  ]
  return (
    <div className="viewer viewer--md">
      <pre>
        <span className="md__h1"># Finn Vangronsveld</span>
        {'\n\n'}
        Streamer, creator, DJ/producer. Based in Flanders.
        {'\n\n'}
        Variety streams on Twitch, clips when they are worth keeping, and music
        {'\n'}
        under ATLAZ from the decks in the corner of this room.
        {'\n\n'}
        <span className="md__h2">## links</span>
        {'\n'}
      </pre>
      <ul className="about__links">
        {rows.map(([k, href]) => (
          <li key={k}>
            <span className="about__k">{k}</span>
            {href ? (
              <a href={href} target="_blank" rel="noopener noreferrer">
                {href.replace(/^https?:\/\//, '')} ↗
              </a>
            ) : (
              <span className="about__none">not published yet</span>
            )}
          </li>
        ))}
      </ul>
      <p className="about__handle">@{HANDLE} everywhere</p>
    </div>
  )
}

/* --------------------------------------------------------------- settings */

export interface Prefs {
  reducedMotion: boolean
  sound: boolean
}

export function SettingsApp({
  prefs,
  onPrefs,
  onReboot,
  onExit,
}: {
  prefs: Prefs
  onPrefs: (p: Prefs) => void
  onReboot: () => void
  onExit: () => void
}) {
  return (
    <div className="settings">
      <Row
        label="Reduced motion"
        note="Stops the desktop's idle animations."
        on={prefs.reducedMotion}
        onToggle={() => onPrefs({ ...prefs, reducedMotion: !prefs.reducedMotion })}
      />
      <Row
        label="System sounds"
        note="No sound pack is installed yet, so this only sets the indicator."
        on={prefs.sound}
        onToggle={() => onPrefs({ ...prefs, sound: !prefs.sound })}
      />
      <div className="settings__row">
        <span className="settings__label">
          Boot sequence
          <span className="settings__note">Replays the FINN OS startup.</span>
        </span>
        <button className="btn" type="button" onClick={onReboot}>
          Reboot
        </button>
      </div>
      <div className="settings__row">
        <span className="settings__label">
          Session
          <span className="settings__note">Leaves the desktop and walks back into the studio.</span>
        </span>
        <button className="btn btn--go" type="button" onClick={onExit}>
          Return to studio
        </button>
      </div>
    </div>
  )
}

function Row({
  label,
  note,
  on,
  onToggle,
}: {
  label: string
  note: string
  on: boolean
  onToggle: () => void
}) {
  return (
    <div className="settings__row">
      <span className="settings__label">
        {label}
        <span className="settings__note">{note}</span>
      </span>
      <button
        className={`toggle${on ? ' is-on' : ''}`}
        type="button"
        role="switch"
        aria-checked={on}
        aria-label={label}
        onClick={onToggle}
      >
        <span />
      </button>
    </div>
  )
}
