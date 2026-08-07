import Phaser from 'phaser'
import { Player } from '../entities/Player'
import { generatePlaceholderTextures } from '../world/textures'

/**
 * Builds every texture the game needs, then hands over to the world.
 *
 * This is the single seam between "placeholder art" and "real art". When the
 * final sprites arrive they get loaded in `preload()` below and the matching
 * generator is deleted from world/textures.ts — nothing else in the codebase
 * needs to know which of the two it got.
 */
export class BootScene extends Phaser.Scene {
  constructor() {
    super('Boot')
  }

  preload(): void {
    // TODO(art): load real assets here as they land, e.g.
    //   this.load.image(TextureKeys.tileset, 'assets/tiles/tileset.png')
    //   this.load.spritesheet(TextureKeys.player, 'assets/characters/player.png',
    //     { frameWidth: 64, frameHeight: 64 })
    // Anything loaded here wins, because generatePlaceholderTextures() only
    // fills in keys that have not already been provided.
  }

  create(): void {
    generatePlaceholderTextures(this)
    Player.createAnimations(this)
    this.scene.start('World')
  }
}
