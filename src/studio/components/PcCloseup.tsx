import { useEffect, useState } from 'react'
import { ASSETS, MONITOR_RECT, SCENE_HEIGHT, SCENE_WIDTH, ZOOM_MS } from '../config/scene'
import { useStageScale } from '../hooks/useStageScale'
import { Os } from '../os/Os'

interface Props {
  onExit: () => void
}

/**
 * The monitor close-up.
 *
 * Fills the viewport with `pc-closeup-green.png` and mounts the OS exactly over
 * its green rectangle, so the bezel, desk strip and dark second monitor from the
 * artwork are preserved and no green is ever visible.
 */
export function PcCloseup({ onExit }: Props) {
  const { scale, offsetX, offsetY, upscaling } = useStageScale()
  const [entered, setEntered] = useState(false)

  useEffect(() => {
    const id = window.requestAnimationFrame(() => setEntered(true))
    return () => window.cancelAnimationFrame(id)
  }, [])

  return (
    <div
      className={`closeup${entered ? ' is-in' : ''}`}
      style={{ ['--zoom-ms' as string]: `${ZOOM_MS}ms` }}
    >
      <div
        className={`stage__inner${upscaling ? ' stage__inner--pixelated' : ''}`}
        style={{ transform: `translate(${offsetX}px, ${offsetY}px) scale(${scale})` }}
      >
        <img className="stage__room" src={ASSETS.pcCloseup} alt="Streaming desk close-up" draggable={false} />

        <div
          className="closeup__screen"
          style={{
            left: MONITOR_RECT.x * SCENE_WIDTH,
            top: MONITOR_RECT.y * SCENE_HEIGHT,
            width: MONITOR_RECT.width * SCENE_WIDTH,
            height: MONITOR_RECT.height * SCENE_HEIGHT,
          }}
        >
          <Os onPowerOff={onExit} />
        </div>
      </div>
    </div>
  )
}
