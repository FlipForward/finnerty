import { PixelText } from './PixelText'

/**
 * Shown on narrow and touch-only devices.
 *
 * V1 is a keyboard game. Rather than bolt a virtual joystick onto a world that
 * was not designed for one, this says so plainly and leaves a slot for the
 * mobile-appropriate content (clips, stream links) that comes later.
 */
export function MobileFallback() {
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
          The world is a keyboard game — you walk it with WASD. Come back on a desktop or laptop and
          the whole thing opens up.
        </p>

        <div className="placeholder placeholder--tall">
          <span className="placeholder__label">CLIPS &amp; STREAM</span>
          <span className="placeholder__note">
            Mobile-friendly stream and clips land here in a later phase.
          </span>
        </div>
      </div>
    </div>
  )
}
