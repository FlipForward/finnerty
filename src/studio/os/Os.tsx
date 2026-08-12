import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Minigame } from './Minigame'

type AppId = 'live' | 'clips' | 'play' | 'about'

interface Props {
  /** POWER, or Escape from the desktop. */
  onPowerOff: () => void
}

const APPS: { id: AppId; name: string; glyph: string; blurb: string }[] = [
  { id: 'live', name: 'LIVE', glyph: '▶', blurb: 'Stream + chat' },
  { id: 'clips', name: 'CLIPS', glyph: '✂', blurb: 'Recent cuts' },
  { id: 'play', name: 'PLAY', glyph: '✦', blurb: 'Signal Catch' },
  { id: 'about', name: 'ABOUT', glyph: 'ⓘ', blurb: 'Who / where' },
]

const BOOT_LINES = [
  'MRFINNERTYTV OS',
  'checking capture device .......... ok',
  'mounting /clips .................. ok',
  'audio interface .................. ok',
  'ready',
]

/**
 * The OS inside the monitor.
 *
 * A DOM layer positioned exactly over the artwork's green rectangle, so the
 * bezel, desk strip and dark second monitor in the photograph stay untouched
 * and only the screen itself is live.
 */
export function Os({ onPowerOff }: Props) {
  const [booted, setBooted] = useState(false)
  const [bootLine, setBootLine] = useState(0)
  const [open, setOpen] = useState<AppId | null>(null)
  const rootRef = useRef<HTMLDivElement>(null)

  // Boot sequence, then the desktop.
  useEffect(() => {
    if (booted) return
    if (bootLine >= BOOT_LINES.length) {
      const id = window.setTimeout(() => setBooted(true), 260)
      return () => window.clearTimeout(id)
    }
    const id = window.setTimeout(() => setBootLine((l) => l + 1), bootLine === 0 ? 420 : 190)
    return () => window.clearTimeout(id)
  }, [bootLine, booted])

  // Escape closes the open app first, and only then powers down. The window
  // listener is here rather than in the parent so the ordering is explicit.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== 'Escape') return
      e.preventDefault()
      e.stopPropagation()
      if (open) setOpen(null)
      else onPowerOff()
    }
    window.addEventListener('keydown', onKey, true)
    return () => window.removeEventListener('keydown', onKey, true)
  }, [open, onPowerOff])

  const closeApp = useCallback(() => setOpen(null), [])

  if (!booted) {
    return (
      <div className="os os--boot" ref={rootRef}>
        <div className="os__bootlines">
          {BOOT_LINES.slice(0, bootLine).map((line, i) => (
            <p key={line} className={i === 0 ? 'os__bootlead' : undefined}>
              {line}
            </p>
          ))}
          <span className="os__caret" />
        </div>
      </div>
    )
  }

  return (
    <div className="os" ref={rootRef}>
      <header className="os__bar">
        <span className="os__brand">MRFINNERTYTV OS</span>
        <span className="os__spacer" />
        <Clock />
        <button className="os__power" type="button" onClick={onPowerOff} title="Power off">
          ⏻
        </button>
      </header>

      <div className="os__desktop">
        {APPS.map((app) => (
          <button key={app.id} className="os__icon" type="button" onClick={() => setOpen(app.id)}>
            <span className="os__glyph">{app.glyph}</span>
            <span className="os__name">{app.name}</span>
            <span className="os__blurb">{app.blurb}</span>
          </button>
        ))}
      </div>

      {open && (
        <div className="os__window">
          <header className="os__winbar">
            <span>{APPS.find((a) => a.id === open)?.name}</span>
            <button className="os__close" type="button" onClick={closeApp}>
              CLOSE [ESC]
            </button>
          </header>
          <div className="os__winbody">
            {open === 'live' && <LiveApp />}
            {open === 'clips' && <ClipsApp />}
            {open === 'play' && <Minigame />}
            {open === 'about' && <AboutApp />}
          </div>
        </div>
      )}
    </div>
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

/**
 * Twitch's official player and chat.
 *
 * Channel from VITE_TWITCH_CHANNEL, `parent` from the live hostname so one
 * build works on localhost, previews and production. No credentials, no Helix
 * calls, no invented live status — the embed reports that itself.
 */
function LiveApp() {
  const channel = import.meta.env.VITE_TWITCH_CHANNEL?.trim() ?? ''
  const { playerSrc, chatSrc, channelUrl } = useMemo(() => {
    if (!channel) return { playerSrc: '', chatSrc: '', channelUrl: '' }
    const parent = encodeURIComponent(window.location.hostname)
    const name = encodeURIComponent(channel)
    return {
      playerSrc: `https://player.twitch.tv/?channel=${name}&parent=${parent}`,
      chatSrc: `https://www.twitch.tv/embed/${name}/chat?parent=${parent}&darkpopout`,
      channelUrl: `https://www.twitch.tv/${name}`,
    }
  }, [channel])

  if (!channel) {
    return (
      <div className="os__empty">
        <p>No feed is routed to this machine.</p>
        {import.meta.env.DEV && (
          <p className="os__hint">
            Set <code>VITE_TWITCH_CHANNEL</code> and rebuild.
          </p>
        )}
      </div>
    )
  }

  return (
    <div className="os-live">
      <div className="os-live__player">
        <iframe
          title={`${channel} on Twitch`}
          src={playerSrc}
          allowFullScreen
          allow="autoplay; fullscreen; encrypted-media; picture-in-picture"
        />
      </div>
      <div className="os-live__chat">
        <iframe title={`${channel} chat`} src={chatSrc} />
      </div>
      <p className="os-live__foot">
        <a href={channelUrl} target="_blank" rel="noopener noreferrer">
          Open twitch.tv/{channel} ↗
        </a>
      </p>
    </div>
  )
}

/** TODO(content): swap for real clip embeds/thumbnails. */
const CLIPS = [
  { id: 1, title: 'CLIP SLOT 01', meta: 'Recent' },
  { id: 2, title: 'CLIP SLOT 02', meta: 'Recent' },
  { id: 3, title: 'CLIP SLOT 03', meta: 'Recent' },
]

function ClipsApp() {
  return (
    <div className="os-clips">
      {CLIPS.map((clip) => (
        <article key={clip.id} className="os-clip">
          <div className="os-clip__thumb" />
          <h4>{clip.title}</h4>
          <p>{clip.meta}</p>
        </article>
      ))}
    </div>
  )
}

/** TODO(content): real bio and final social list. */
function AboutApp() {
  return (
    <div className="os-about">
      <h4>MRFINNERTYTV</h4>
      <p>
        Streamer and creator from Flanders. Variety streams, clips and the occasional late-night
        production session in the corner of this room.
      </p>
      <ul>
        <li>
          <a href="https://www.twitch.tv/mrfinnertytv" target="_blank" rel="noopener noreferrer">
            Twitch ↗
          </a>
        </li>
        <li>
          <a href="https://atlazmusic.be" target="_blank" rel="noopener noreferrer">
            ATLAZ — music ↗
          </a>
        </li>
      </ul>
    </div>
  )
}
