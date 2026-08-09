import Phaser from 'phaser'
import { Player } from '../entities/Player'
import { TextureKeys } from '../config'
import { generatePlaceholderTextures } from '../world/textures'

/**
 * Builds every texture the game needs, then hands over to the world.
 *
 * This is the single seam between shipped art and procedural fallbacks.
 * `preload()` loads any real PNGs that exist, while `generatePlaceholderTextures()`
 * quietly fills any missing keys so the rest of the codebase never needs to
 * care which source won.
 */
export class BootScene extends Phaser.Scene {
  constructor() {
    super('Boot')
  }

  preload(): void {
    this.load.image(TextureKeys.tileset, 'assets/tiles/tileset.png')
    this.load.spritesheet(TextureKeys.player, 'assets/characters/player.png', {
      frameWidth: 64,
      frameHeight: 64,
    })
    this.load.image(TextureKeys.tree, 'assets/props/prop-tree.png')
    this.load.image(TextureKeys.pine, 'assets/props/prop-pine.png')
    this.load.image(TextureKeys.bush, 'assets/props/prop-bush.png')
    this.load.image(TextureKeys.boulder, 'assets/props/prop-boulder.png')
    this.load.image(TextureKeys.stone, 'assets/props/prop-stone.png')
    this.load.image(TextureKeys.lantern, 'assets/props/prop-lantern.png')
    this.load.image(TextureKeys.crate, 'assets/props/prop-crate.png')
    this.load.image(TextureKeys.banner, 'assets/props/prop-banner.png')
    this.load.image(TextureKeys.flowers, 'assets/props/prop-flowers.png')
    this.load.image(TextureKeys.weeds, 'assets/props/prop-weeds.png')
    this.load.image(TextureKeys.cable, 'assets/props/prop-cable.png')
    this.load.image(TextureKeys.portal, 'assets/props/prop-portal.png')
    this.load.image(TextureKeys.sign, 'assets/props/prop-sign.png')
    this.load.image(TextureKeys.liveSign, 'assets/props/prop-live-sign.png')
    this.load.image(TextureKeys.light, 'assets/ui/fx-light.png')
    this.load.image(TextureKeys.shadow, 'assets/ui/fx-shadow.png')

    // Anything loaded here wins, because generatePlaceholderTextures() only
    // fills in keys that have not already been provided. Missing or invalid
    // files simply fall back to the procedural generators.
  }

  create(): void {
    generatePlaceholderTextures(this)
    Player.createAnimations(this)
    this.scene.start('World')
  }
}
