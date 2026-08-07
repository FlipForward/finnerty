import Phaser from 'phaser'
import { ASSET_ORIGIN_Y, ASSET_SIZE, Depths, PLAYER_SPEED, TextureKeys } from '../config'

export type Facing = 'down' | 'left' | 'right' | 'up'

/** Row order in the player sheet. Real art must match (see docs/ART_BIBLE.md). */
const ROWS: Record<Facing, number> = { down: 0, left: 1, right: 2, up: 3 }
const COLUMNS = 4

export interface MoveInput {
  up: boolean
  down: boolean
  left: boolean
  right: boolean
}

const NO_INPUT: MoveInput = { up: false, down: false, left: false, right: false }

/**
 * The player character.
 *
 * The sprite is a full 64x64 asset frame with origin (0.5, 56/64), so `y` is
 * the character's ground contact point. That keeps depth sorting honest and
 * means dropping in the real spritesheet requires no repositioning — only the
 * texture load in BootScene changes.
 */
export class Player extends Phaser.Physics.Arcade.Sprite {
  private facing: Facing = 'down'
  private locked = false
  private readonly shadow: Phaser.GameObjects.Image

  constructor(scene: Phaser.Scene, x: number, y: number) {
    super(scene, x, y, TextureKeys.player, ROWS.down * COLUMNS)
    scene.add.existing(this)
    scene.physics.add.existing(this)
    this.setOrigin(0.5, ASSET_ORIGIN_Y)

    // A small body at the feet, not the whole 64x64 frame: the character
    // collides with what is under them, so they can overlap tree canopies.
    const body = this.body as Phaser.Physics.Arcade.Body
    body.setSize(12, 8, false)
    body.setOffset((ASSET_SIZE - 12) / 2, 48)
    body.setCollideWorldBounds(true)

    this.shadow = scene.add
      .image(x, y, TextureKeys.shadow)
      .setOrigin(0.5, 0.5)
      .setAlpha(0.28)

    this.play(animKey(this.facing, 'idle'))
  }

  /** Disables movement without unbinding input — used while an overlay is open. */
  setLocked(locked: boolean): void {
    this.locked = locked
    if (locked) {
      const body = this.body as Phaser.Physics.Arcade.Body | null
      body?.setVelocity(0, 0)
      this.play(animKey(this.facing, 'idle'), true)
    }
  }

  get isLocked(): boolean {
    return this.locked
  }

  getFacing(): Facing {
    return this.facing
  }

  /** Called every frame from WorldScene with the resolved key state. */
  tick(rawInput: MoveInput): void {
    const body = this.body as Phaser.Physics.Arcade.Body | null
    if (!body) return

    const input = this.locked ? NO_INPUT : rawInput
    const vx = (input.right ? 1 : 0) - (input.left ? 1 : 0)
    const vy = (input.down ? 1 : 0) - (input.up ? 1 : 0)

    if (vx === 0 && vy === 0) {
      body.setVelocity(0, 0)
      this.play(animKey(this.facing, 'idle'), true)
    } else {
      // Normalise so diagonals are not ~1.41x faster than the cardinals.
      const length = Math.hypot(vx, vy)
      body.setVelocity((vx / length) * PLAYER_SPEED, (vy / length) * PLAYER_SPEED)
      this.facing = vx !== 0 ? (vx > 0 ? 'right' : 'left') : vy > 0 ? 'down' : 'up'
      this.play(animKey(this.facing, 'walk'), true)
    }

    this.setDepth(Depths.entities + this.y)
    this.shadow.setPosition(this.x, this.y - 2)
    this.shadow.setDepth(Depths.entities + this.y - 1)
  }

  override destroy(fromScene?: boolean): void {
    this.shadow.destroy()
    super.destroy(fromScene)
  }

  /**
   * Registers the walk/idle animations. Called once from BootScene, after the
   * player texture exists — generated or loaded, this code does not care.
   */
  static createAnimations(scene: Phaser.Scene): void {
    for (const facing of Object.keys(ROWS) as Facing[]) {
      const base = ROWS[facing] * COLUMNS
      const idle = animKey(facing, 'idle')
      const walk = animKey(facing, 'walk')

      if (!scene.anims.exists(idle)) {
        scene.anims.create({
          key: idle,
          frames: [{ key: TextureKeys.player, frame: base }],
          frameRate: 1,
          repeat: -1,
        })
      }
      if (!scene.anims.exists(walk)) {
        scene.anims.create({
          key: walk,
          frames: Array.from({ length: COLUMNS }, (_, i) => ({
            key: TextureKeys.player,
            frame: base + i,
          })),
          frameRate: 8,
          repeat: -1,
        })
      }
    }
  }
}

function animKey(facing: Facing, state: 'idle' | 'walk'): string {
  return `player-${state}-${facing}`
}
