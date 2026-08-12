import { useEffect, useState } from 'react'
import { SCENE_HEIGHT, SCENE_WIDTH } from '../config/scene'

export interface StageTransform {
  scale: number
  offsetX: number
  offsetY: number
  /** True once the room is being enlarged, which is when nearest-neighbour helps. */
  upscaling: boolean
}

/**
 * Fits the 1672x941 stage to the viewport with `cover`, so the room always
 * fills the screen with no letterboxing and no distortion.
 *
 * Children lay out in native stage pixels and inherit this transform, which
 * means one set of coordinates is correct at every resolution.
 */
export function useStageScale(): StageTransform {
  const [transform, setTransform] = useState<StageTransform>(() => compute())

  useEffect(() => {
    const onResize = () => setTransform(compute())
    onResize()
    window.addEventListener('resize', onResize)
    return () => window.removeEventListener('resize', onResize)
  }, [])

  return transform
}

function compute(): StageTransform {
  const vw = window.innerWidth
  const vh = window.innerHeight
  const scale = Math.max(vw / SCENE_WIDTH, vh / SCENE_HEIGHT)
  return {
    scale,
    offsetX: (vw - SCENE_WIDTH * scale) / 2,
    offsetY: (vh - SCENE_HEIGHT * scale) / 2,
    upscaling: scale >= 1,
  }
}
