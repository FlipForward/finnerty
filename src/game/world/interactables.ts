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
    id: 'portal',
    kind: 'portal',
    tileX: 14,
    tileY: 11,
    label: 'EXAMINE THE GATE',
    range: 36,
    action: {
      type: 'dialog',
      title: 'THE GATE',
      body: [
        'Cut from old stone and lit from somewhere underneath. The plaza was built around it, not the other way round.',
        'Tonight its light runs inward. When it turns outward again, it opens on the other districts.',
      ],
    },
  },
  {
    id: 'lobby-board',
    kind: 'sign',
    tileX: 19,
    tileY: 15,
    label: 'READ THE BOARD',
    action: {
      type: 'dialog',
      title: 'ARRIVAL',
      body: [
        'You came through the gate. Welcome to the valley.',
        'WASD or the arrow keys to walk. E to look at whatever offers. Escape to step back.',
        'The avenue runs east, then south to the Live Deck.',
      ],
    },
  },
  {
    id: 'trail-sign',
    kind: 'sign',
    tileX: 39,
    tileY: 20,
    label: 'READ THE SIGN',
    action: {
      type: 'dialog',
      title: 'TRAIL MARKER',
      body: [
        'SOUTH — THE LIVE DECK. Follow the trail down to the water.',
        'NORTH — THE PLAZA, and the gate you came in by.',
      ],
    },
  },
  {
    id: 'live-stage',
    kind: 'live',
    tileX: 46,
    tileY: 26,
    label: 'WATCH THE STREAM',
    range: 38,
    action: { type: 'live' },
  },
  {
    id: 'kit-crate',
    kind: 'crate',
    tileX: 49,
    tileY: 27,
    label: 'CHECK THE KIT',
    range: 28,
    action: {
      type: 'dialog',
      title: 'THE KIT',
      body: [
        'Flight cases, a spare stand, and more cable than anyone here will admit to owning.',
        'Someone has written DO NOT TOUCH on the lid in marker pen. It has plainly been ignored.',
      ],
    },
  },
]

export function rangeFor(def: InteractableDef): number {
  return def.range ?? INTERACT_RANGE
}
