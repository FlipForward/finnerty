import { useEffect } from 'react'
import { PixelText } from './PixelText'

interface Props {
  onStart: () => void
}

/**
 * The title state.
 *
 * Deliberately thin: the world itself is the backdrop (WorldScene runs in
 * title mode, drifting the camera across the hillside), and the giant
 * MRFINNERTYTV lettering is world geometry on that hillside rather than DOM
 * text laid over the top. All this layer adds is the prompt and the controls.
 */
export function StartScreen({ onStart }: Props) {
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== 'Enter') return
      event.preventDefault()
      onStart()
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [onStart])

  return (
    <div className="title">
      <div className="title__content">
        <button className="title__prompt" type="button" onClick={onStart}>
          <PixelText text="PRESS ENTER TO PLAY" scale={4} color="#e0d1b3" shadowColor="#14202b" />
        </button>
        <p className="title__controls">WASD OR ARROW KEYS TO MOVE &nbsp;·&nbsp; E TO INTERACT</p>
      </div>
    </div>
  )
}
