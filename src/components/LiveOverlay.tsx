import { useEffect, useMemo, useRef } from 'react'
import { PixelText } from './PixelText'

interface Props {
  onClose: () => void
}

/**
 * Placeholder for the Twitch integration.
 *
 * ARCHITECTURE — this is why it is a DOM overlay and not drawn in the canvas:
 * Twitch's embeds are iframes. They cannot be rendered inside WebGL, and
 * Twitch's terms require the player to be visible and unobstructed. So the
 * live view is a normal HTML layer stacked above the Phaser canvas, and the
 * game underneath is paused (WorldScene locks input while an overlay is open).
 *
 * TODO(twitch): replace the two placeholder panels below with Twitch's official
 * embeds. Nothing else in this component needs to change — the channel and
 * parent values are already resolved correctly:
 *
 *   <iframe
 *     src={`https://player.twitch.tv/?channel=${channel}&parent=${parent}`}
 *     allowFullScreen
 *   />
 *   <iframe src={`https://www.twitch.tv/embed/${channel}/chat?parent=${parent}`} />
 *
 * Notes for whoever does that:
 *   - `parent` MUST be the hostname serving the page (no protocol, no port).
 *     It is read from window.location at runtime, so localhost, a preview
 *     deploy and production all work without a rebuild.
 *   - Every Twitch host serving the embed needs its own `parent` entry.
 *   - Live/offline state and viewer counts require the Helix API, which needs a
 *     server-side token. No credentials belong in this client bundle, and this
 *     component deliberately shows no invented status or viewer numbers.
 */
export function LiveOverlay({ onClose }: Props) {
  const closeRef = useRef<HTMLButtonElement>(null)

  const channel = import.meta.env.VITE_TWITCH_CHANNEL?.trim() ?? ''
  // Twitch's embeds are keyed to the hostname serving the page. Reading it at
  // runtime is what lets one build work across localhost and production.
  const parent = useMemo(() => window.location.hostname, [])

  useEffect(() => {
    closeRef.current?.focus()
  }, [])

  return (
    <div className="overlay" role="dialog" aria-modal="true" aria-label="Live stream">
      <div className="overlay__backdrop" onClick={onClose} />
      <div className="panel panel--live">
        <header className="panel__header panel__header--live">
          <PixelText text="LIVE" scale={3} color="#e8564e" shadowColor="#14202b" />
          <button ref={closeRef} className="button button--icon" type="button" onClick={onClose}>
            CLOSE [ESC]
          </button>
        </header>

        <div className="live">
          <div className="live__player">
            <div className="placeholder">
              <span className="placeholder__label">TWITCH PLAYER</span>
              <span className="placeholder__note">
                {channel
                  ? `Ready to embed twitch.tv/${channel}`
                  : 'Set VITE_TWITCH_CHANNEL in .env.local to point this at a channel.'}
              </span>
            </div>
          </div>

          <div className="live__chat">
            <div className="placeholder placeholder--tall">
              <span className="placeholder__label">CHAT</span>
              <span className="placeholder__note">Twitch chat embed goes here.</span>
            </div>
          </div>
        </div>

        {import.meta.env.DEV && (
          <p className="live__debug">
            embed parent: <code>{parent}</code> · channel: <code>{channel || 'unset'}</code>
          </p>
        )}
      </div>
    </div>
  )
}
