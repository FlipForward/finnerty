import { PixelText } from './PixelText'

/**
 * Shown on narrow and touch-only devices.
 *
 * The valley is a keyboard world. Rather than bolt a virtual joystick onto a
 * map that was not designed for one, this says so plainly and sends people to
 * the one thing that genuinely works on a phone: the stream itself.
 */
export function MobileFallback() {
  const channel = import.meta.env.VITE_TWITCH_CHANNEL?.trim() ?? ''

  return (
    <div className="fallback">
      <div className="fallback__inner">
        <PixelText
          className="fallback__wordmark"
          text="MRFINNERTYTV"
          scale={4}
          color="#e0d1b3"
          shadowColor="#14202b"
        />

        <div className="fallback__rule" />

        <PixelText text="BEST ON DESKTOP" scale={2} color="#68a8ff" shadowColor="#14202b" />

        <p className="fallback__body">
          The valley is a keyboard world — you walk it with WASD, and the gate only opens on a proper
          screen. Come back on a desktop or laptop and it is all there.
        </p>

        {channel && (
          <a
            className="button fallback__cta"
            href={`https://www.twitch.tv/${encodeURIComponent(channel)}`}
            target="_blank"
            rel="noopener noreferrer"
          >
            WATCH ON TWITCH
          </a>
        )}
      </div>
    </div>
  )
}
