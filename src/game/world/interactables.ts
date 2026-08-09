/**
 * Everything the player can press [E] on, as data.
 *
 * Adding a new landmark is meant to be a matter of appending an entry here:
 * WorldScene builds the sprite and the collider from `kind`, and
 * InteractionSystem dispatches `action` without knowing what any of them mean.
 *
 * Copy rule: this text is the game talking to a visitor, not the project
 * talking about itself. Nothing here reports build status, roadmap or what
 * does not exist yet — a place that describes its own gaps stops being a place.
 */

import { INTERACT_RANGE } from '../config'

/** Determines which placeholder texture and collider the scene builds. */
export type InteractableKind = 'portal' | 'live' | 'sign' | 'crate'

/**
 * What pressing [E] does. Every variant is handled in exactly one place
 * (InteractionSystem.trigger), so a new action type is a compile error until
 * it is handled — which is the point.
 */
export type InteractableAction =
  | { type: 'dialog'; title: string; body: string[] }
  | { type: 'live' }

export interface InteractableDef {
  id: string
  kind: InteractableKind
  /** Position on the world grid. */
  tileX: number
  tileY: number
  /** Shown in the world-space prompt, e.g. "[E]  READ SIGN". */
  label: string
  /** Proximity radius in world pixels. Defaults to INTERACT_RANGE. */
  range?: number
  action: InteractableAction
}

export const INTERACTABLES: InteractableDef[] = [
  {
    id: 'cliff-gate',
    kind: 'portal',
    tileX: 43,
    tileY: 10,
    label: 'LOOK TO THE RIDGE',
    range: 36,
    action: {
      type: 'dialog',
      title: 'THE CLIFF PATH',
      body: [
        'The ridge path climbs beyond the old stone, past where the island turns into the wider world.',
        'The gate is quiet for now. It will open when there is somewhere new to walk.',
      ],
    },
  },
  {
    id: 'arrival-board',
    kind: 'sign',
    tileX: 23,
    tileY: 18,
    label: 'READ ARRIVAL BOARD',
    action: {
      type: 'dialog',
      title: 'ARRIVAL',
      body: [
        'Welcome to Arrival Island. The lodge is home base; the paths are yours to follow.',
        'WASD or the arrow keys to walk. E to look closer. Escape to step back.',
        'West crosses into the forest. East follows the water to the Live Deck. North climbs toward the ridge.',
      ],
    },
  },
  {
    id: 'forest-sign',
    kind: 'sign',
    tileX: 17,
    tileY: 16,
    label: 'READ TRAIL SIGN',
    action: {
      type: 'dialog',
      title: 'TRAIL MARKER',
      body: [
        'FOREST TRAIL — keep to the boardwalk where the stream cuts through the trees.',
        'ARRIVAL LODGE — back east, past the blue pennants.',
      ],
    },
  },
  {
    id: 'live-stage',
    kind: 'live',
    tileX: 48,
    tileY: 26,
    label: 'ENTER THE LIVE DECK',
    range: 38,
    action: { type: 'live' },
  },
]

export function rangeFor(def: InteractableDef): number {
  return def.range ?? INTERACT_RANGE
}
