import { useCallback, useEffect, useRef, useState } from 'react'
import {
  HOTSPOTS,
  HOVER_FADE_MS,
  SCENE_HEIGHT,
  SCENE_WIDTH,
  type Hotspot,
  type HotspotId,
} from '../config/scene'

interface Props {
  hovered: HotspotId | null
  onHover: (id: HotspotId | null) => void
  onActivate: (spot: Hotspot) => void
  interactive: boolean
}

/** Alpha below this counts as "not the object". */
const ALPHA_THRESHOLD = 12

type Masks = Partial<Record<HotspotId, Uint8Array>>

/**
 * Builds a per-object alpha mask from each normal overlay.
 *
 * This is what makes the hover follow the real silhouette: an <img> would take
 * pointer events across its whole box, and these boxes are the full 1672x941
 * canvas, so all three would overlap everything. Sampling the alpha instead
 * means only the actual desk, decks or camera can be hit.
 */
function useAlphaMasks(): Masks {
  const [masks, setMasks] = useState<Masks>({})

  useEffect(() => {
    let cancelled = false
    const canvas = document.createElement('canvas')
    canvas.width = SCENE_WIDTH
    canvas.height = SCENE_HEIGHT
    const ctx = canvas.getContext('2d', { willReadFrequently: true })
    if (!ctx) return

    Promise.all(
      HOTSPOTS.map(
        (spot) =>
          new Promise<[HotspotId, Uint8Array | null]>((resolve) => {
            const img = new Image()
            img.onload = () => {
              ctx.clearRect(0, 0, SCENE_WIDTH, SCENE_HEIGHT)
              ctx.drawImage(img, 0, 0, SCENE_WIDTH, SCENE_HEIGHT)
              const { data } = ctx.getImageData(0, 0, SCENE_WIDTH, SCENE_HEIGHT)
              const mask = new Uint8Array(SCENE_WIDTH * SCENE_HEIGHT)
              for (let p = 0; p < mask.length; p++) mask[p] = data[p * 4 + 3]
              resolve([spot.id, mask])
            }
            img.onerror = () => resolve([spot.id, null])
            img.src = spot.layers.normal
          }),
      ),
    ).then((entries) => {
      if (cancelled) return
      const next: Masks = {}
      for (const [id, mask] of entries) if (mask) next[id] = mask
      setMasks(next)
    })

    return () => {
      cancelled = true
    }
  }, [])

  return masks
}

export function Hotspots({ hovered, onHover, onActivate, interactive }: Props) {
  const masks = useAlphaMasks()
  const layerRef = useRef<HTMLDivElement>(null)

  /** Screen point -> which object is under it, respecting painter order. */
  const hitTest = useCallback(
    (clientX: number, clientY: number): Hotspot | null => {
      const el = layerRef.current
      if (!el) return null
      const rect = el.getBoundingClientRect()
      if (rect.width === 0 || rect.height === 0) return null
      const x = Math.floor(((clientX - rect.left) / rect.width) * SCENE_WIDTH)
      const y = Math.floor(((clientY - rect.top) / rect.height) * SCENE_HEIGHT)
      if (x < 0 || y < 0 || x >= SCENE_WIDTH || y >= SCENE_HEIGHT) return null
      const index = y * SCENE_WIDTH + x
      // Topmost first: later entries in HOTSPOTS are nearer the viewer.
      for (let i = HOTSPOTS.length - 1; i >= 0; i--) {
        const spot = HOTSPOTS[i]
        const mask = masks[spot.id]
        if (mask && mask[index] > ALPHA_THRESHOLD) return spot
      }
      return null
    },
    [masks],
  )

  // Hover tracking lives on the window so it keeps up with the cursor even
  // while the character is still walking somewhere else.
  useEffect(() => {
    if (!interactive) {
      onHover(null)
      return
    }
    const onMove = (e: MouseEvent) => onHover(hitTest(e.clientX, e.clientY)?.id ?? null)
    const onClick = (e: MouseEvent) => {
      const spot = hitTest(e.clientX, e.clientY)
      if (spot) onActivate(spot)
    }
    window.addEventListener('mousemove', onMove)
    window.addEventListener('click', onClick)
    return () => {
      window.removeEventListener('mousemove', onMove)
      window.removeEventListener('click', onClick)
    }
  }, [interactive, hitTest, onHover, onActivate])

  // The cursor only turns into a pointer over real object pixels.
  useEffect(() => {
    document.body.style.cursor = interactive && hovered ? 'pointer' : ''
    return () => {
      document.body.style.cursor = ''
    }
  }, [hovered, interactive])

  return (
    <div
      className="overlays"
      ref={layerRef}
      style={{ ['--hover-fade' as string]: `${HOVER_FADE_MS}ms` }}
    >
      {HOTSPOTS.map((spot) => {
        const isOn = hovered === spot.id
        return (
          <div key={spot.id} className="overlay">
            <img
              className={`overlay__img${isOn ? ' is-hidden' : ''}`}
              src={spot.layers.normal}
              alt=""
              aria-hidden
              draggable={false}
            />
            <img
              className={`overlay__img overlay__img--hot${isOn ? '' : ' is-hidden'}`}
              src={spot.layers.highlight}
              alt=""
              aria-hidden
              draggable={false}
            />
          </div>
        )
      })}

      {/* Keyboard route to the same behaviour. Kept out of the mouse's way so
          the alpha hit test stays the single authority for pointer input. */}
      {HOTSPOTS.map((spot) => (
        <button
          key={`${spot.id}-a11y`}
          className="overlay__key"
          type="button"
          disabled={!interactive}
          style={{
            left: spot.bounds.left,
            top: spot.bounds.top,
            width: spot.bounds.width,
            height: spot.bounds.height,
          }}
          onFocus={() => onHover(spot.id)}
          onBlur={() => onHover(null)}
          onClick={() => onActivate(spot)}
        >
          {spot.label}
        </button>
      ))}

      {hovered && <Tooltip spot={HOTSPOTS.find((s) => s.id === hovered)!} />}
    </div>
  )
}

function Tooltip({ spot }: { spot: Hotspot }) {
  return (
    <span
      className="overlay__tip"
      style={{ left: spot.bounds.left + spot.bounds.width / 2, top: spot.bounds.top - 10 }}
    >
      {spot.label}
    </span>
  )
}
