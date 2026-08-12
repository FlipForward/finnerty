import { useCallback, useEffect, useState } from 'react'
import { ASSETS, HOTSPOTS, type Hotspot, type HotspotId } from '../config/scene'
import { useStageScale } from '../hooks/useStageScale'
import { Ambient } from './Ambient'
import { Character } from './Character'
import { Hotspots } from './Hotspots'

interface Props {
  onOpen: (id: HotspotId) => void
  /** Suppresses hover/click while something is open on top of the room. */
  interactive: boolean
}

export function Studio({ onOpen, interactive }: Props) {
  const { scale, offsetX, offsetY, upscaling } = useStageScale()
  const [hovered, setHovered] = useState<HotspotId | null>(null)
  const [pending, setPending] = useState<Hotspot | null>(null)

  const spot = hovered ? (HOTSPOTS.find((s) => s.id === hovered) ?? null) : null

  // Hovering sends the character walking; whichever object the cursor is over is
  // the destination, so moving between them retargets on its own.
  const target = spot?.standing ?? null

  const handleArrive = useCallback(() => {
    setPending((queued) => {
      if (queued) onOpen(queued.id)
      return null
    })
  }, [onOpen])

  // If the cursor leaves before the character arrives, drop the queued open.
  useEffect(() => {
    if (pending && hovered !== pending.id) setPending(null)
  }, [hovered, pending])

  const handleActivate = useCallback(
    (target: Hotspot) => {
      if (!interactive) return
      setHovered(target.id)
      setPending(target)
    },
    [interactive],
  )

  return (
    <div className="stage">
      <div
        className={`stage__inner${upscaling ? ' stage__inner--pixelated' : ''}`}
        style={{ transform: `translate(${offsetX}px, ${offsetY}px) scale(${scale})` }}
      >
        <img className="stage__room" src={ASSETS.room} alt="MrFinnertyTV studio" draggable={false} />

        <Hotspots
          hovered={hovered}
          onHover={setHovered}
          onActivate={handleActivate}
          interactive={interactive}
        />

        <Ambient />

        <Character target={target} arriveFacing={spot?.facing} onArrive={handleArrive} />
      </div>
    </div>
  )
}
