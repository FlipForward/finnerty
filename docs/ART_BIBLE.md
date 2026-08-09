# MrFinnertyTV World — Art Bible

These are hard constraints, not suggestions. Anything that breaks one of them
does not go in the game.

## Hard rules

- Virtual game resolution: **480 × 270**
- World grid: **16 × 16 px**
- All future generated individual assets use a **64 × 64 px** logical canvas.
- Every prop/character is **horizontally centred** and shares a **ground baseline at logical `y=56`**.
- Camera: **diagonal top-down world view, square grid**; do not use true 3D or isometric diamond tiles.
- Player directions: **four directions only** for V1.
- Lighting always comes from the **upper-left**.
- Maximum **three shades per material**.
- **No** anti-aliasing, blur, smooth gradients, glossy effects, bloom, or soft realistic shadows.
- Pixel-art should be **sharp, deliberate and mature** — not chibi/mobile-game art.

## Palette

| Role                | Hex       |
| ------------------- | --------- |
| Ink / outline       | `#14202B` |
| Grass shadow        | `#365E41` |
| Grass mid           | `#5E9A52` |
| Grass light         | `#9BCB68` |
| Stone shadow        | `#5B5B54` |
| Stone mid           | `#9F9583` |
| Stone light / cream | `#E0D1B3` |
| Wood dark           | `#6E442A` |
| Wood light          | `#A86E3F` |
| Cobalt blue         | `#2E6EEA` |
| Light blue          | `#68A8FF` |
| Pale blue           | `#D6F0FF` |
| Lantern amber       | `#FFC45B` |
| Live indicator red  | `#E8564E` |

### Extended set — needs sign-off

The brand palette above has no ramp for water, bare earth, or a dark cobalt.
These were added so the placeholder world reads correctly. **Treat them as
provisional** and replace them with the artist's own choices if preferred.

| Role          | Hex       | Why it was needed                                          |
| ------------- | --------- | ---------------------------------------------------------- |
| Water deep    | `#1E3A52` | Cobalt at full saturation reads as neon, not as a lake.     |
| Water mid     | `#2D5A78` |                                                            |
| Water light   | `#4A86A8` |                                                            |
| Dirt shadow   | `#5A4632` | The wood ramp is too orange to use as trodden ground.       |
| Dirt mid      | `#7A6047` |                                                            |
| Dirt light    | `#9A7D5C` |                                                            |
| Cobalt shadow | `#1C4AA8` | Third shade for the player's hoodie and the portal banding. |

Palette values live in code at [`src/game/config.ts`](../src/game/config.ts)
(`PALETTE`) and in CSS at [`src/styles/app.css`](../src/styles/app.css)
(`:root`). Keep all three in sync.

## Why the 64×64 / baseline-56 contract matters

Every prop and character sprite is a 64 × 64 frame, drawn centred on `x=32`
with its feet on `y=56`. In the engine those sprites use origin
`(0.5, 56/64)`, which buys three things at once:

1. A sprite's `y` **is** its ground contact point, so `depth = y` gives correct
   back-to-front sorting for free.
2. The 8 px below the baseline leaves room for contact shadows without shifting
   the art.
3. Replacing a placeholder with real art is a **file swap** — no repositioning,
   no per-asset offsets.

Collision is deliberately **not** derived from the sprite. Each prop gets a
small invisible box at its feet, defined in `PROP_COLLIDERS` in
[`src/game/scenes/WorldScene.ts`](../src/game/scenes/WorldScene.ts), so changing
a silhouette never silently changes the walkable map.

## Character spritesheet layout

The player sheet is a **4 × 4 grid of 64 × 64 frames (256 × 256 total)**:

| Row | Direction | Col 0 | Col 1  | Col 2 | Col 3  |
| --- | --------- | ----- | ------ | ----- | ------ |
| 0   | down      | idle  | step A | idle  | step B |
| 1   | left      | idle  | step A | idle  | step B |
| 2   | right     | idle  | step A | idle  | step B |
| 3   | up        | idle  | step A | idle  | step B |

Real art must ship in exactly this layout. Walk animations run at 8 fps.

## Replacing the placeholders

Everything currently on screen is generated at runtime by
[`src/game/world/textures.ts`](../src/game/world/textures.ts). Nothing is a
final asset.

To swap in real art, add a load call in `BootScene.preload()` using the matching
key from `TextureKeys`:

```ts
this.load.image(TextureKeys.tileset, 'assets/tiles/tileset.png')
this.load.spritesheet(TextureKeys.player, 'assets/characters/player.png', {
  frameWidth: 64,
  frameHeight: 64,
})
```

The generators check whether a key already exists and stand down if it does, so
loaded art always wins. Delete the corresponding generator once its asset lands.

| Texture key      | Size      | Destination                 |
| ---------------- | --------- | --------------------------- |
| `tileset`        | 16 × 160  | `public/assets/tiles/`      |
| `player`         | 256 × 256 | `public/assets/characters/` |
| `prop-tree`      | 64 × 64   | `public/assets/props/`      |
| `prop-pine`      | 64 × 64   | `public/assets/props/`      |
| `prop-bush`      | 64 × 64   | `public/assets/props/`      |
| `prop-boulder`   | 64 × 64   | `public/assets/props/`      |
| `prop-stone`     | 64 × 64   | `public/assets/props/`      |
| `prop-lantern`   | 64 × 64   | `public/assets/props/`      |
| `prop-crate`     | 64 × 64   | `public/assets/props/`      |
| `prop-banner`    | 64 × 64   | `public/assets/props/`      |
| `prop-flowers`   | 64 × 64   | `public/assets/props/`      |
| `prop-weeds`     | 64 × 64   | `public/assets/props/`      |
| `prop-cable`     | 64 × 64   | `public/assets/props/`      |
| `prop-portal`    | 64 × 64   | `public/assets/props/`      |
| `prop-sign`      | 64 × 64   | `public/assets/props/`      |
| `prop-live-sign` | 64 × 64   | `public/assets/props/`      |
| `fx-light`       | 128 × 128 | `public/assets/ui/`         |
| `fx-shadow`      | 22 × 9    | `public/assets/ui/`         |

### Tileset row order

One 16 × 16 tile per row, stacked into a single column. The order is load-bearing —
it must match `Tile` in
[`src/game/world/worldLayout.ts`](../src/game/world/worldLayout.ts). New tiles are
appended so existing indices never shift under delivered art:

`0` grass · `1` grass tuft · `2` dirt · `3` stone path · `4` stone slab ·
`5` shore · `6` water · `7` cliff · `8` accent slab · `9` timber deck

Tiles `6` (water) and `7` (cliff) are solid.

The accent slab is the darker dressed stone used for the gate dais and the short
aisle leading to it. It deliberately carries **no blue**: an earlier version
inlaid cobalt into it and the plaza floor turned into a field of blue dots. In
the arrival plaza the gate and the two banners should be the only blue there is.

### Which props are solid

Solidity is decided by one table — `PROP_COLLIDERS` in
[`src/game/scenes/WorldScene.ts`](../src/game/scenes/WorldScene.ts) — where
`null` means the player walks straight through. Flowers, weeds and cable runs
are walk-through decor, and they carry most of the world's visual density.
That is what lets the woodland stay thin enough to see across without the open
ground looking bare.

## Text

In-world text uses a 5 × 7 bitmap font defined in
[`src/game/ui/pixelFont.ts`](../src/game/ui/pixelFont.ts) — glyphs are authored
as editable strings, not a font file. It renders the hillside `MRFINNERTYTV`
lettering, the `[E]` prompt, and the DOM headings (via a data-URL `<img>`, so
the canvas and the page share one typeface).

Uppercase only. If a real pixel webfont is delivered into
`public/assets/ui/`, `pixelTextImage.ts` can be replaced with an `@font-face`
rule; the in-canvas font should stay bitmap.
