/**
 * Everything the player can press [E] on, as data.
 *
 * Adding a new landmark is meant to be a matter of appending an entry here:
 * WorldScene builds the sprite and the collider from `kind`, and
 * InteractionSystem dispatches `action` without knowing what any of them mean.
 */

import { INTERACT_RANGE } from '../config'

/** Determines which placeholder texture and collider the scene builds. */
export type InteractableKind = 'portal' | 'live' | 'sign'

/**
 * What pressing [E] does. Every variant is handled in exactly one place
 * (InteractionSystem.trigger), so a new action type is a compiler error until
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
    id: 'portal',
    kind: 'portal',
    tileX: 13,
    tileY: 11,
    label: 'ENTER PORTAL',
    range: 34,
    action: {
      type: 'dialog',
      title: 'THE PORTAL',
      body: [
        'The gate hums, but nothing on the other side is finished yet.',
        'More worlds are coming soon.',
      ],
    },
  },
  {
    id: 'lobby-board',
    kind: 'sign',
    tileX: 17,
    tileY: 14,
    label: 'READ BOARD',
    action: {
      type: 'dialog',
      title: 'WELCOME',
      body: [
        'This is the lobby of MrFinnertyTV World.',
        'Move with WASD or the arrow keys. Press E when a prompt appears. Escape closes anything that opens.',
        'Follow the stone path east to find the rest of the world.',
      ],
    },
  },
  {
    id: 'trail-sign',
    kind: 'sign',
    tileX: 42,
    tileY: 20,
    label: 'READ SIGN',
    action: {
      type: 'dialog',
      title: 'TRAIL MARKER',
      body: [
        'South: the lake deck.',
        'North: the lobby, and the letters on the ridge.',
        'The path keeps going. Most of it has not been built yet.',
      ],
    },
  },
  {
    id: 'live-stage',
    kind: 'live',
    tileX: 44,
    tileY: 26,
    label: 'WATCH LIVE',
    range: 36,
    action: { type: 'live' },
  },
]

export function rangeFor(def: InteractableDef): number {
  return def.range ?? INTERACT_RANGE
}
