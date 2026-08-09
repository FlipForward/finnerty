import { useEffect, useMemo, useRef } from 'react'
import { PixelText } from './PixelText'

interface Props {
  onClose: () => void
}

/**
 * The Live Deck: Twitch's official player and chat embeds.
 *
 * ARCHITECTURE — this is a DOM overlay rather than something drawn in the
 * canvas because Twitch's embeds are iframes. They cannot be rendered inside
 * WebGL, and Twitch requires the player to be visible and unobstructed. So the
 * live view is a normal HTML layer stacked above the Phaser canvas, and the
 * game underneath is paused (WorldScene locks input while an overlay is open).
 *
 * No credentials, no Helix API, no invented live status or viewer count. The
 * embed reports whether the channel is live entirely on its own — which is the
 * only honest way to show it without a server-side token.
 *
 * Note on Escape: while focus is inside a cross-origin iframe, key events go to
 * Twitch, not to this page, so the Escape handler in GameShell cannot see them.
 * That is a browser security boundary, not something to work around — hence the
 * always-visible close button and the click-anywhere backdrop.
 */
export function LiveOverlay({ onClose }: Props) {
  const closeRef = useRef<HTMLButtonElement>(null)

  const channel = import.meta.env.VITE_TWITCH_CHANNEL?.trim() ?? ''

  // Twitch keys its embeds to the hostname serving the page. Reading it at
  // runtime is what lets one build work on localhost, preview deploys and
  // production without hardcoding a domain anywhere.
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

  useEffect(() => {
    closeRef.current?.focus()
  }, [])

  return (
    <div className="overlay" role="dialog" aria-modal="true" aria-label="The Live Deck">
      <div className="overlay__backdrop" onClick={onClose} />
      <div className="panel panel--live">
        <header className="panel__header panel__header--live">
          <PixelText text="THE LIVE DECK" scale={3} color="#e0d1b3" shadowColor="#14202b" />
          <button ref={closeRef} className="button" type="button" onClick={onClose}>
            CLOSE [ESC]
          </button>
        </header>

        {channel ? (
          <div className="live">
            <div className="live__player">
              <iframe
                title={`${channel} on Twitch`}
                src={playerSrc}
                allowFullScreen
                allow="autoplay; fullscreen; encrypted-media; picture-in-picture"
                frameBorder="0"
                scrolling="no"
              />
            </div>
            <div className="live__chat">
              <iframe
                title={`${channel} chat`}
                src={chatSrc}
                frameBorder="0"
                scrolling="no"
              />
            </div>
          </div>
        ) : (
          // Misconfiguration should still read as the world, not as an error
          // page. The operator-facing detail is dev-only.
          <div className="live__dark">
            <p>The deck is dark tonight. No feed is running from here.</p>
            {import.meta.env.DEV && (
              <p className="live__dark-hint">
                Set <code>VITE_TWITCH_CHANNEL</code> and rebuild to point the deck at a channel.
              </p>
            )}
          </div>
        )}

        {channel && (
          <p className="live__footnote">
            <a href={channelUrl} target="_blank" rel="noopener noreferrer">
              Open twitch.tv/{channel} in a new tab
            </a>
          </p>
        )}
      </div>
    </div>
  )
}
