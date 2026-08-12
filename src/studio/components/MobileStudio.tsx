import { ASSETS, LINKS } from '../config/scene'

/**
 * Phone and narrow-screen view.
 *
 * A still of the room with the three destinations as plain buttons. No virtual
 * joystick and no attempt to squeeze the walking studio onto a phone.
 */
export function MobileStudio() {
  const channel = import.meta.env.VITE_TWITCH_CHANNEL?.trim() ?? ''

  return (
    <div className="mobile">
      <div className="mobile__preview">
        <img src={ASSETS.room} alt="The MrFinnertyTV studio" />
        <div className="mobile__fade" />
        <h1 className="mobile__wordmark">MRFINNERTYTV</h1>
      </div>

      <div className="mobile__actions">
        <p className="mobile__note">
          The studio is a desktop room — you walk it with a cursor. Open it on a laptop for the full
          thing. Everything below works right here.
        </p>

        {channel && (
          <a
            className="os-button os-button--primary"
            href={`https://www.twitch.tv/${encodeURIComponent(channel)}`}
            target="_blank"
            rel="noopener noreferrer"
          >
            WATCH THE STREAM ↗
          </a>
        )}
        <a className="os-button" href={LINKS.atlaz} target="_blank" rel="noopener noreferrer">
          ATLAZ — MUSIC ↗
        </a>
        {LINKS.photography ? (
          <a className="os-button" href={LINKS.photography} target="_blank" rel="noopener noreferrer">
            PHOTOGRAPHY ↗
          </a>
        ) : (
          <button className="os-button" type="button" disabled>
            PHOTOGRAPHY — SOON
          </button>
        )}
      </div>
    </div>
  )
}
