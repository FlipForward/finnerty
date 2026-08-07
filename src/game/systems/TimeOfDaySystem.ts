import Phaser from 'phaser'
import { DAY_CYCLE_SECONDS, Depths, TextureKeys, VIRTUAL_HEIGHT, VIRTUAL_WIDTH } from '../config'

export type DayPhase = 'DAY' | 'DUSK' | 'NIGHT' | 'DAWN'

export interface LightOptions {
  /** Pool radius in world pixels. */
  radius: number
  color: number
  /** Alpha in full daylight — normally 0, small for the portal. */
  dayAlpha?: number
  /** Alpha at deep night. */
  nightAlpha: number
  /** Amplitude of the idle flicker, 0 disables it. */
  flicker?: number
}

interface Light {
  image: Phaser.GameObjects.Image
  options: Required<LightOptions>
  /** Per-light phase so a row of lanterns does not pulse in unison. */
  phase: number
}

type Stop<T> = readonly [number, T]

/**
 * Colour the world is multiplied by, across one cycle. White is "no change",
 * so daytime is genuinely untouched rather than tinted-but-bright.
 *
 * Night is a moonlit blue at roughly 40% luminance — dark enough to matter,
 * nowhere near black, and deliberately not neon.
 */
const TINT_STOPS: Stop<number>[] = [
  [0.0, 0xffffff],
  [0.4, 0xffffff],
  [0.5, 0xffd2a6],
  [0.58, 0xc79a9c],
  [0.66, 0x7c8bbc],
  [0.74, 0x6376ac],
  [0.86, 0x6376ac],
  [0.93, 0xd6a894],
  [0.98, 0xfff0dc],
  [1.0, 0xffffff],
]

/** How "night" it is, for lantern intensity. Tracks the tint but not identically. */
const NIGHT_STOPS: Stop<number>[] = [
  [0.0, 0],
  [0.42, 0],
  [0.52, 0.2],
  [0.62, 0.7],
  [0.72, 1],
  [0.86, 1],
  [0.93, 0.45],
  [0.99, 0],
  [1.0, 0],
]

/** Normalised cycle positions the dev toggle jumps between. */
const NOON = 0.2
const MIDNIGHT = 0.79
/** Seconds the dev toggle takes to ease from one to the other. */
const TOGGLE_SECONDS = 1.4

interface Transition {
  from: number
  /** Signed distance around the cycle, already reduced to the shorter arc. */
  distance: number
  elapsed: number
}

function sample(stops: Stop<number>[], t: number): number {
  for (let i = 0; i < stops.length - 1; i++) {
    const [t0, v0] = stops[i]
    const [t1, v1] = stops[i + 1]
    if (t >= t0 && t <= t1) {
      const k = t1 === t0 ? 0 : (t - t0) / (t1 - t0)
      return v0 + (v1 - v0) * k
    }
  }
  return stops[stops.length - 1][1]
}

function sampleColor(stops: Stop<number>[], t: number): number {
  for (let i = 0; i < stops.length - 1; i++) {
    const [t0, c0] = stops[i]
    const [t1, c1] = stops[i + 1]
    if (t >= t0 && t <= t1) {
      const k = t1 === t0 ? 0 : (t - t0) / (t1 - t0)
      const r = Math.round(((c0 >> 16) & 0xff) + (((c1 >> 16) & 0xff) - ((c0 >> 16) & 0xff)) * k)
      const g = Math.round(((c0 >> 8) & 0xff) + (((c1 >> 8) & 0xff) - ((c0 >> 8) & 0xff)) * k)
      const b = Math.round((c0 & 0xff) + ((c1 & 0xff) - (c0 & 0xff)) * k)
      return (r << 16) | (g << 8) | b
    }
  }
  return stops[stops.length - 1][1]
}

/**
 * Day/night.
 *
 * A single screen-space multiply overlay handles the ambient shift; light
 * pools are additive sprites drawn above it, which is why lanterns read as
 * light sources at night and cost nothing during the day.
 */
export class TimeOfDaySystem {
  private readonly overlay: Phaser.GameObjects.Rectangle
  private readonly lights: Light[] = []
  private elapsed = NOON * DAY_CYCLE_SECONDS
  private nightFactor = 0
  private clock = 0
  /** Non-null while the dev toggle is easing between day and night. */
  private transition?: Transition

  constructor(
    private readonly scene: Phaser.Scene,
    private readonly cycleSeconds: number = DAY_CYCLE_SECONDS,
  ) {
    this.overlay = scene.add
      .rectangle(VIRTUAL_WIDTH / 2, VIRTUAL_HEIGHT / 2, VIRTUAL_WIDTH, VIRTUAL_HEIGHT, 0xffffff)
      .setScrollFactor(0)
      .setDepth(Depths.nightOverlay)
      .setBlendMode(Phaser.BlendModes.MULTIPLY)
  }

  addLight(x: number, y: number, options: LightOptions): void {
    const resolved: Required<LightOptions> = {
      dayAlpha: 0,
      flicker: 0,
      ...options,
    }
    const image = this.scene.add
      .image(x, y, TextureKeys.light)
      .setDepth(Depths.lights)
      .setBlendMode(Phaser.BlendModes.ADD)
      .setTint(resolved.color)
      .setAlpha(0)
    image.setDisplaySize(resolved.radius * 2, resolved.radius * 2)
    this.lights.push({ image, options: resolved, phase: this.lights.length * 1.7 })
  }

  /** 0 in full daylight, 1 at deep night. Drives lantern and portal intensity. */
  getNightFactor(): number {
    return this.nightFactor
  }

  getPhase(): DayPhase {
    const t = this.getNormalisedTime()
    if (t < 0.46) return 'DAY'
    if (t < 0.68) return 'DUSK'
    if (t < 0.9) return 'NIGHT'
    return 'DAWN'
  }

  getNormalisedTime(): number {
    return (this.elapsed % this.cycleSeconds) / this.cycleSeconds
  }

  /**
   * Development-only shortcut (bound to `N` in WorldScene): eases to the
   * opposite half of the cycle so the transition can be seen, not just the
   * end state.
   *
   * Driven from this system's own `update` rather than a Phaser tween: the
   * clock already lives here, and owning the ease keeps the behaviour
   * independent of scene tween timing.
   */
  toggleDayNight(): void {
    const from = this.getNormalisedTime()
    const target = this.nightFactor > 0.5 ? NOON : MIDNIGHT
    // Take the shorter arc around the cycle, so a toggle never fast-forwards
    // through a whole day to reach a time that is minutes behind us.
    let distance = target - from
    if (distance > 0.5) distance -= 1
    if (distance < -0.5) distance += 1
    this.transition = { from, distance, elapsed: 0 }
  }

  update(deltaMs: number): void {
    const deltaSeconds = deltaMs / 1000
    this.clock += deltaSeconds

    if (this.transition) {
      this.transition.elapsed += deltaSeconds
      const k = Math.min(1, this.transition.elapsed / TOGGLE_SECONDS)
      const eased = 0.5 - Math.cos(Math.PI * k) / 2 // sine ease in/out
      const position = this.transition.from + this.transition.distance * eased
      // `position` can leave [0,1) at either end; wrap it back in.
      this.elapsed = (((position % 1) + 1) % 1) * this.cycleSeconds
      if (k >= 1) this.transition = undefined
    } else {
      this.elapsed = (this.elapsed + deltaSeconds) % this.cycleSeconds
    }

    const t = this.getNormalisedTime()
    this.overlay.setFillStyle(sampleColor(TINT_STOPS, t))
    this.nightFactor = sample(NIGHT_STOPS, t)

    for (const light of this.lights) {
      const { dayAlpha, nightAlpha, flicker } = light.options
      const base = dayAlpha + (nightAlpha - dayAlpha) * this.nightFactor
      const wobble = flicker === 0 ? 0 : Math.sin(this.clock * 2.1 + light.phase) * flicker * this.nightFactor
      light.image.setAlpha(Math.max(0, base + wobble))
    }
  }

  destroy(): void {
    this.transition = undefined
    this.overlay.destroy()
    for (const light of this.lights) light.image.destroy()
    this.lights.length = 0
  }
}
