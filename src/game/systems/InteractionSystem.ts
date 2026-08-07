import Phaser from 'phaser'
import { Depths, PALETTE } from '../config'
import { emit } from '../events'
import { PixelLabel } from '../ui/PixelText'
import { rangeFor, type InteractableDef } from '../world/interactables'

interface Entry {
  def: InteractableDef
  /** Interaction origin in world pixels — normally the prop's baseline. */
  x: number
  y: number
  /** Where the prompt floats, in world pixels. */
  promptY: number
  range: number
}

const hex = (color: number) => `#${color.toString(16).padStart(6, '0')}`

/**
 * Proximity interactions.
 *
 * Owns exactly two responsibilities: deciding which interactable (if any) the
 * player is close enough to, and turning a keypress on it into an event.
 * It knows nothing about portals, signs or Twitch — those are data in
 * `world/interactables.ts`, and the consequences are React's problem.
 */
export class InteractionSystem {
  private readonly entries: Entry[] = []
  private readonly prompt: PixelLabel
  private active: Entry | null = null
  private locked = false

  constructor(private readonly scene: Phaser.Scene) {
    this.prompt = new PixelLabel(scene, 0, 0, [''], {
      scale: 1,
      color: hex(PALETTE.stoneLight),
      backgroundColor: hex(PALETTE.ink),
      borderColor: hex(PALETTE.stoneShadow),
      shadowColor: hex(PALETTE.ink),
      padding: 3,
    })
    this.prompt.setOrigin(0.5, 1).setDepth(Depths.worldUi).setVisible(false)
  }

  register(def: InteractableDef, x: number, y: number, promptY: number): void {
    this.entries.push({ def, x, y, promptY, range: rangeFor(def) })
  }

  /** While locked (overlay open) the prompt hides and [E] does nothing. */
  setLocked(locked: boolean): void {
    this.locked = locked
    if (locked) {
      this.active = null
      this.prompt.setVisible(false)
    }
  }

  /** Nearest interactable within range, or null. */
  getActive(): InteractableDef | null {
    return this.active?.def ?? null
  }

  update(playerX: number, playerY: number): void {
    if (this.locked) return

    let best: Entry | null = null
    let bestDistance = Number.POSITIVE_INFINITY
    for (const entry of this.entries) {
      const distance = Phaser.Math.Distance.Between(playerX, playerY, entry.x, entry.y)
      if (distance > entry.range || distance >= bestDistance) continue
      best = entry
      bestDistance = distance
    }

    if (best !== this.active) {
      this.active = best
      if (best) {
        this.prompt.setLines([`[E]  ${best.def.label}`])
        this.prompt.setPosition(Math.round(best.x), Math.round(best.promptY))
        this.prompt.setVisible(true)
      } else {
        this.prompt.setVisible(false)
      }
    }
  }

  /**
   * Fires the active interactable. Returns true if something happened, so the
   * scene knows whether to lock the player.
   */
  trigger(): boolean {
    if (this.locked || !this.active) return false
    const { def } = this.active
    const { action } = def

    switch (action.type) {
      case 'dialog':
        emit('overlay:dialog', { id: def.id, title: action.title, body: action.body })
        return true
      case 'live':
        emit('overlay:live')
        return true
      default: {
        // Adding a variant to InteractableAction without handling it here is a
        // compile error, which is the point of routing everything through one switch.
        const exhaustive: never = action
        void exhaustive
        return false
      }
    }
  }

  destroy(): void {
    this.prompt.destroy()
    this.entries.length = 0
    this.active = null
    void this.scene
  }
}
