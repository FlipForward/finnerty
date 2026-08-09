import Phaser from 'phaser'
import { Depths, PALETTE, TextureKeys, TILE_SIZE, VIRTUAL_HEIGHT } from '../config'
import { Player, type MoveInput } from '../entities/Player'
import { emit, on } from '../events'
import { InteractionSystem } from '../systems/InteractionSystem'
import { TimeOfDaySystem } from '../systems/TimeOfDaySystem'
import { PixelLabel, makeTextTexture } from '../ui/PixelText'
import { INTERACTABLES, type InteractableDef, type InteractableKind } from '../world/interactables'
import {
  HILLSIDE,
  SOLID_TILES,
  SPAWN_TILE,
  TITLE_CAMERA,
  WORLD_HEIGHT,
  WORLD_WIDTH,
  parseWorld,
  tileToWorld,
  type PropKind,
} from '../world/worldLayout'

const hex = (color: number) => `#${color.toString(16).padStart(6, '0')}`

/**
 * Collider footprint per prop, in world pixels, measured up from the baseline.
 *
 * `null` means the player walks straight through it. This table is the single
 * authority on what is solid — decor is defined by having no collider here
 * rather than by a second list that could drift out of sync.
 */
const PROP_COLLIDERS: Record<PropKind | InteractableKind, { width: number; height: number } | null> = {
  tree: { width: 14, height: 8 },
  pine: { width: 12, height: 8 },
  bush: { width: 12, height: 6 },
  boulder: { width: 18, height: 8 },
  stone: { width: 10, height: 5 },
  lantern: { width: 6, height: 5 },
  crate: { width: 22, height: 10 },
  banner: { width: 8, height: 5 },
  flowers: null,
  weeds: null,
  cable: null,
  portal: { width: 34, height: 10 },
  sign: { width: 22, height: 6 },
  live: { width: 26, height: 6 },
}

/** Props that lie flat on the ground, so the player walks over them. */
const FLAT_PROPS: ReadonlySet<PropKind> = new Set<PropKind>(['cable'])

const PROP_TEXTURES: Record<PropKind, string> = {
  tree: TextureKeys.tree,
  pine: TextureKeys.pine,
  bush: TextureKeys.bush,
  boulder: TextureKeys.boulder,
  stone: TextureKeys.stone,
  lantern: TextureKeys.lantern,
  crate: TextureKeys.crate,
  banner: TextureKeys.banner,
  flowers: TextureKeys.flowers,
  weeds: TextureKeys.weeds,
  cable: TextureKeys.cable,
}

const INTERACTABLE_TEXTURES: Record<InteractableKind, string> = {
  portal: TextureKeys.portal,
  sign: TextureKeys.sign,
  live: TextureKeys.liveSign,
  crate: TextureKeys.crate,
}

/** How far above an interactable's baseline the [E] prompt floats. */
const PROMPT_OFFSET: Record<InteractableKind, number> = {
  portal: 54,
  sign: 44,
  live: 46,
  crate: 30,
}

type Mode = 'title' | 'play'

export class WorldScene extends Phaser.Scene {
  private player!: Player
  private interactions!: InteractionSystem
  private timeOfDay!: TimeOfDaySystem
  private solids!: Phaser.Physics.Arcade.StaticGroup
  private mode: Mode = 'title'
  private inputLocked = false

  private keys: Record<string, Phaser.Input.Keyboard.Key> = {}
  private cursors?: Phaser.Types.Input.Keyboard.CursorKeys
  private titleTween?: Phaser.Tweens.Tween
  private devClock?: PixelLabel
  private unsubscribe: Array<() => void> = []
  private torndown = false

  constructor() {
    super('World')
  }

  create(): void {
    this.mode = 'title'
    this.inputLocked = false

    const world = parseWorld()

    this.physics.world.setBounds(0, 0, WORLD_WIDTH, WORLD_HEIGHT)
    this.cameras.main.setBounds(0, 0, WORLD_WIDTH, WORLD_HEIGHT)
    this.cameras.main.setRoundPixels(true)

    // ---- ground -----------------------------------------------------------
    const map = this.make.tilemap({
      data: world.tiles,
      tileWidth: TILE_SIZE,
      tileHeight: TILE_SIZE,
    })
    const tileset = map.addTilesetImage('placeholder', TextureKeys.tileset, TILE_SIZE, TILE_SIZE, 0, 0)
    if (!tileset) throw new Error('WorldScene: failed to build the tileset')
    const layer = map.createLayer(0, tileset, 0, 0)
    if (!layer) throw new Error('WorldScene: failed to build the ground layer')
    layer.setDepth(Depths.ground)
    layer.setCollision(SOLID_TILES)

    // ---- landmark lettering ------------------------------------------------
    this.createHillsideLettering()

    // ---- player ------------------------------------------------------------
    const spawn = tileToWorld(SPAWN_TILE.x, SPAWN_TILE.y)
    this.player = new Player(this, spawn.x, spawn.y)
    this.physics.add.collider(this.player, layer)

    // ---- systems -----------------------------------------------------------
    this.timeOfDay = new TimeOfDaySystem(this)
    this.interactions = new InteractionSystem(this)

    // ---- scenery -----------------------------------------------------------
    this.solids = this.physics.add.staticGroup()
    for (const prop of world.props) {
      const { x, y } = tileToWorld(prop.tileX, prop.tileY)
      this.addProp(PROP_TEXTURES[prop.kind], x, y, PROP_COLLIDERS[prop.kind], FLAT_PROPS.has(prop.kind))
      if (prop.kind === 'lantern') {
        this.timeOfDay.addLight(x, y - 38, {
          radius: 44,
          color: PALETTE.lanternAmber,
          nightAlpha: 0.5,
          flicker: 0.05,
        })
      } else if (prop.kind === 'banner') {
        // Signage stays faintly lit after dark, the way real signage does.
        this.timeOfDay.addLight(x, y - 34, {
          radius: 26,
          color: PALETTE.cobalt,
          dayAlpha: 0.05,
          nightAlpha: 0.26,
        })
      }
    }

    // ---- interactables -----------------------------------------------------
    for (const def of INTERACTABLES) this.addInteractable(def)

    this.physics.add.collider(this.player, this.solids)

    // ---- input + wiring ----------------------------------------------------
    this.bindInput()
    this.bindEvents()
    this.enterTitleMode()
    this.createDevClock()

    emit('game:ready')
  }

  // ------------------------------------------------------------------ builders

  private createHillsideLettering(): void {
    // World geometry, not UI: the letters sit on the cliff band closing off the
    // north of the map, so you meet them by walking toward them.
    const { key } = makeTextTexture(this, [HILLSIDE.text], {
      scale: HILLSIDE.scale,
      color: hex(PALETTE.stoneLight),
      shadowColor: hex(PALETTE.ink),
    })
    this.add
      .image(HILLSIDE.x, HILLSIDE.y, key)
      .setOrigin(0.5, 0.5)
      .setDepth(Depths.decal)
  }

  /** Adds a sprite plus, unless it is decor, an invisible collider at its feet. */
  private addProp(
    texture: string,
    x: number,
    y: number,
    collider: { width: number; height: number } | null,
    flat = false,
  ): Phaser.GameObjects.Image {
    const image = this.add.image(x, y, texture)
    image.setOrigin(0.5, 56 / 64)
    // Flat props sit under everything so the player walks over them; everything
    // else sorts against the player by its baseline.
    image.setDepth(flat ? Depths.decal : Depths.entities + y)

    if (collider) {
      // Collision lives on its own rectangle rather than the sprite body, so
      // final art can change silhouette without breaking the walkable map.
      const box = this.add.rectangle(x, y - collider.height / 2, collider.width, collider.height)
      box.setVisible(false)
      this.solids.add(box)
    }
    return image
  }

  private addInteractable(def: InteractableDef): void {
    const { x, y } = tileToWorld(def.tileX, def.tileY)
    this.addProp(INTERACTABLE_TEXTURES[def.kind], x, y, PROP_COLLIDERS[def.kind])
    this.interactions.register(def, x, y, y - PROMPT_OFFSET[def.kind])

    if (def.kind === 'portal') {
      // Restrained: the gate is a cobalt presence at night, not a floodlight.
      this.timeOfDay.addLight(x, y - 30, {
        radius: 52,
        color: PALETTE.cobalt,
        dayAlpha: 0.1,
        nightAlpha: 0.42,
        flicker: 0.04,
      })
    } else if (def.kind === 'live') {
      this.timeOfDay.addLight(x - 12, y - 30, {
        radius: 26,
        color: PALETTE.liveRed,
        dayAlpha: 0.06,
        nightAlpha: 0.3,
        flicker: 0.06,
      })
    }
  }

  private createDevClock(): void {
    if (!import.meta.env.DEV) return
    // Bottom-left: the top of the frame is where the hillside lettering sits.
    this.devClock = new PixelLabel(this, 4, VIRTUAL_HEIGHT - 4, [''], {
      scale: 1,
      color: hex(PALETTE.stoneLight),
      backgroundColor: hex(PALETTE.ink),
      padding: 2,
    })
    this.devClock.setOrigin(0, 1).setScrollFactor(0).setDepth(Depths.worldUi).setAlpha(0.5)
  }

  // --------------------------------------------------------------------- input

  private bindInput(): void {
    const keyboard = this.input.keyboard
    if (!keyboard) return

    this.cursors = keyboard.createCursorKeys()
    this.keys = keyboard.addKeys('W,A,S,D,E,N') as Record<string, Phaser.Input.Keyboard.Key>

    // Stop arrows/space from scrolling the page while the canvas has focus.
    keyboard.addCapture(['UP', 'DOWN', 'LEFT', 'RIGHT', 'SPACE', 'W', 'A', 'S', 'D', 'E', 'N'])

    this.keys.E?.on('down', () => {
      if (this.mode !== 'play' || this.inputLocked) return
      if (this.interactions.trigger()) this.setInputLocked(true)
    })

    if (import.meta.env.DEV) {
      // Development-only day/night shortcut. Not advertised in the UI.
      this.keys.N?.on('down', () => this.timeOfDay.toggleDayNight())
    }
  }

  private bindEvents(): void {
    this.unsubscribe.push(
      on('ui:start', () => this.beginPlay()),
      on('ui:overlay-closed', () => {
        this.setInputLocked(false)
        this.game.canvas?.focus()
      }),
    )
    // Phaser emits SHUTDOWN on a scene stop but only DESTROY when the whole
    // game is torn down, and teardown() must run either way.
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => this.teardown())
    this.events.once(Phaser.Scenes.Events.DESTROY, () => this.teardown())
  }

  private setInputLocked(locked: boolean): void {
    this.inputLocked = locked
    this.player.setLocked(locked)
    this.interactions.setLocked(locked)
  }

  // ---------------------------------------------------------------- game modes

  private enterTitleMode(): void {
    this.mode = 'title'
    this.player.setVisible(false)
    this.setInputLocked(true)

    const camera = this.cameras.main
    camera.centerOn(TITLE_CAMERA.x, TITLE_CAMERA.y)
    const centreScroll = camera.scrollX

    // A slow drift across the lettering, so the title screen is a live view of
    // the world rather than a static hero image.
    camera.setScroll(centreScroll - TITLE_CAMERA.driftX, camera.scrollY)
    this.titleTween = this.tweens.add({
      targets: camera,
      scrollX: centreScroll + TITLE_CAMERA.driftX,
      duration: TITLE_CAMERA.driftSeconds * 1000,
      ease: 'Sine.easeInOut',
      yoyo: true,
      repeat: -1,
    })
  }

  private beginPlay(): void {
    if (this.mode === 'play') return
    this.mode = 'play'

    this.titleTween?.remove()
    this.titleTween = undefined

    this.player.setVisible(true)
    const camera = this.cameras.main
    camera.startFollow(this.player, true, 0.14, 0.14)
    camera.fadeIn(420, 0, 0, 0)

    this.setInputLocked(false)
    this.game.canvas?.focus()
    emit('game:started')
  }

  // -------------------------------------------------------------------- update

  override update(_time: number, delta: number): void {
    this.timeOfDay.update(delta)

    if (this.mode === 'play') {
      this.player.tick(this.readMoveInput())
      this.interactions.update(this.player.x, this.player.y)
    }

    // Phase only, deliberately: each distinct string bakes a texture that lives
    // for the session, so a ticking percentage would leak one per update.
    if (this.devClock) this.devClock.setLines([`${this.timeOfDay.getPhase()}  N:TOGGLE`])
  }

  private readMoveInput(): MoveInput {
    if (this.inputLocked) return { up: false, down: false, left: false, right: false }
    const c = this.cursors
    const k = this.keys
    return {
      up: Boolean(c?.up.isDown || k.W?.isDown),
      down: Boolean(c?.down.isDown || k.S?.isDown),
      left: Boolean(c?.left.isDown || k.A?.isDown),
      right: Boolean(c?.right.isDown || k.D?.isDown),
    }
  }

  private teardown(): void {
    if (this.torndown) return
    this.torndown = true
    for (const off of this.unsubscribe) off()
    this.unsubscribe = []
    this.titleTween?.remove()
    this.interactions?.destroy()
    this.timeOfDay?.destroy()
  }

  /**
   * A snapshot of everything worth asserting on. Used by the dev-only
   * `window.__FINNERTY__` handle so the game can be smoke-tested from a
   * browser console without reaching into private state.
   */
  getDebugState() {
    return {
      mode: this.mode,
      inputLocked: this.inputLocked,
      player: {
        x: Math.round(this.player.x),
        y: Math.round(this.player.y),
        facing: this.player.getFacing(),
      },
      camera: {
        x: Math.round(this.cameras.main.scrollX),
        y: Math.round(this.cameras.main.scrollY),
      },
      nearest: this.interactions.getActive()?.id ?? null,
      phase: this.timeOfDay.getPhase(),
      night: Number(this.timeOfDay.getNightFactor().toFixed(2)),
    }
  }
}
