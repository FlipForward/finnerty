import Phaser from 'phaser'
import { PALETTE, VIRTUAL_HEIGHT, VIRTUAL_WIDTH } from './config'
import { BootScene } from './scenes/BootScene'
import { WorldScene } from './scenes/WorldScene'

export interface GameHandle {
  game: Phaser.Game
  /** Tears down the game, its listeners and the canvas. Safe to call twice. */
  destroy: () => void
  /** Moves keyboard focus back to the canvas (after closing a DOM overlay). */
  focus: () => void
}

/**
 * Boots Phaser into `parent`.
 *
 * Scaling is deliberately integer-only. Phaser's FIT mode would letterbox to a
 * fractional scale, which makes some source pixels 3 screen pixels wide and
 * others 4 — sharp, but visibly uneven on a 480x270 canvas. Rounding down to a
 * whole multiple keeps every pixel square at the cost of a slightly smaller
 * picture, which is the trade real pixel-art games make.
 */
export function createGame(parent: HTMLElement): GameHandle {
  const game = new Phaser.Game({
    type: Phaser.AUTO,
    parent,
    width: VIRTUAL_WIDTH,
    height: VIRTUAL_HEIGHT,
    backgroundColor: PALETTE.ink,
    // pixelArt sets nearest-neighbour filtering and disables antialiasing.
    pixelArt: true,
    roundPixels: true,
    scale: {
      mode: Phaser.Scale.NONE,
      autoCenter: Phaser.Scale.CENTER_BOTH,
    },
    physics: {
      default: 'arcade',
      arcade: { gravity: { x: 0, y: 0 }, debug: false },
    },
    scene: [BootScene, WorldScene],
  })

  const applyScale = (): void => {
    const width = parent.clientWidth || window.innerWidth
    const height = parent.clientHeight || window.innerHeight
    const raw = Math.min(width / VIRTUAL_WIDTH, height / VIRTUAL_HEIGHT)
    const zoom = Math.max(1, Math.floor(raw))
    if (game.scale.zoom !== zoom) game.scale.setZoom(zoom)
  }

  const focus = (): void => game.canvas?.focus()

  const observer = new ResizeObserver(applyScale)
  observer.observe(parent)

  let destroyed = false

  game.events.once(Phaser.Core.Events.READY, () => {
    // Boot is asynchronous, so this can land after the caller already gave up.
    if (destroyed) return

    // Make the canvas a real focus target so keyboard input is reliable after
    // a DOM overlay steals focus.
    game.canvas.tabIndex = 0
    game.canvas.style.outline = 'none'
    applyScale()
    focus()

    if (import.meta.env.DEV) {
      // Handy for poking at the running game from the browser console.
      ;(window as unknown as Record<string, unknown>).__FINNERTY__ = {
        game,
        state: () => (game.scene.getScene('World') as WorldScene | null)?.getDebugState() ?? null,
      }
    }
  })

  const destroy = (): void => {
    if (destroyed) return
    destroyed = true
    observer.disconnect()
    // Deliberately not clearing the global event bus here: React components
    // own their own subscriptions and outlive the canvas during a resize.
    game.destroy(true)
    if (import.meta.env.DEV) {
      delete (window as unknown as Record<string, unknown>).__FINNERTY__
    }
    // Phaser defers the real teardown to its next step, which never comes if
    // the game is destroyed before it boots (React strict mode does exactly
    // that). Clearing the container guarantees no orphan canvas is left behind.
    parent.replaceChildren()
  }

  return { game, destroy, focus }
}
