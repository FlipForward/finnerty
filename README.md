# MRFINNERTYTV — World

A playable pixel-art portfolio site for the Flemish streamer MrFinnertyTV. The
website *is* a small 2D world: you arrive at a lobby, press Enter, and walk
around with the keyboard.

This repository is the **V1 foundation** — one real, walkable slice of world
with clean seams for everything that comes next. See
[`docs/V1_SCOPE.md`](docs/V1_SCOPE.md) for exactly what is and is not built.

## Requirements

Node 20.19+ or 22.12+ (Vite 7). Built and verified on Node 24.

## Commands

Install:

```bash
npm install
```

Run the dev server at http://localhost:5173:

```bash
npm run dev
```

Type-check and build for production into `dist/`:

```bash
npm run build
```

Serve the production build locally:

```bash
npm run preview
```

## Controls

| Key                | Action                          |
| ------------------ | ------------------------------- |
| `Enter` or click   | Start from the title screen     |
| `WASD` / arrows    | Move                            |
| `E`                | Interact (when a prompt appears) |
| `Escape`           | Close an overlay                 |
| `N`                | Toggle day/night — **dev only** |

## What V1 does

- **Title state** — a live, slowly drifting view of the world rather than a web
  hero section. The giant `MRFINNERTYTV` lettering is world geometry on the
  cliff to the north, not UI text: you can walk up to it.
- **A designed arrival** — 60 × 40 tiles (960 × 640 px), about four screens.
  You arrive at a symmetrical plaza built around the gate, on a darker stone
  dais between two cobalt banners. A three-tile avenue leaves east and narrows
  into a trail that turns south to a timber live deck over the lake.
- **Movement** — four directions, normalised diagonals, Arcade Physics
  collision against water, cliffs, trees, lanterns and props.
- **Camera** — smooth follow, clamped to world bounds.
- **Interactions** — a reusable proximity system driven by data. Five landmarks
  on it: the gate, two signs, the kit crate, and the Live board.
- **Day/night** — a ~5 minute cycle. Daylight is genuinely untouched; night is
  moonlit blue with warm lantern pools and a restrained cobalt glow from the
  gate and the banners.
- **The Live Deck** — the Twitch player and chat, embedded for real. Whether
  the channel is live is reported by Twitch's own embed; nothing here fakes
  status or viewer counts.
- **Overlays** — dialogs and the Twitch player are normal DOM layers above the
  canvas. Player input is disabled while one is open, and focus returns to the
  canvas when it closes.
- **Desktop-first** — narrow and touch-only devices get a pixel-art fallback
  screen instead of a cramped game with a virtual joystick.

Rendering is a fixed **480 × 270** virtual resolution, scaled up by whole
multiples with nearest-neighbour filtering, so pixels stay square and sharp.

## Architecture

React owns the page and every DOM layer. Phaser owns the canvas, the world and
the simulation. They never reach into each other — they talk over one typed
event bus, [`src/game/events.ts`](src/game/events.ts).

```
src/
  App.tsx                     desktop vs. mobile-fallback decision
  main.tsx
  components/
    GameShell.tsx             mounts the canvas, owns overlay state
    StartScreen.tsx           title prompt and controls
    LiveOverlay.tsx           Twitch player + chat (DOM, above the canvas)
    DialogOverlay.tsx         generic panel for every 'dialog' interactable
    MobileFallback.tsx        narrow/touch screen
    PixelText.tsx             bitmap-font text for the DOM
  game/
    config.ts                 resolution, grid, palette, tuning, depths
    events.ts                 the React <-> Phaser seam
    createGame.ts             Phaser boot + integer scaling + focus
    scenes/
      BootScene.ts            texture generation / future asset loading
      WorldScene.ts           the world, wiring, modes
    entities/
      Player.ts               movement, facing, animation
    systems/
      InteractionSystem.ts    proximity, [E] prompt, action dispatch
      TimeOfDaySystem.ts      cycle, ambient tint, light pools
    world/
      worldLayout.ts          the map, as two editable character grids
      interactables.ts        every landmark and its copy, as data
      textures.ts             procedural placeholder art
    ui/
      pixelFont.ts            5x7 glyphs
      PixelText.ts            bitmap text as Phaser textures
      pixelTextImage.ts       bitmap text as data URLs, for React
  styles/
    app.css                   palette, resets, shared controls
    game.css                  canvas, title, overlays, fallback
docs/
  ART_BIBLE.md                hard art constraints — read before making assets
  V1_SCOPE.md                 what is deliberately not built
public/assets/                tiles, props, characters, pets, ui, maps
```

### Editing the world

The map is two 60 × 40 character grids in
[`src/game/world/worldLayout.ts`](src/game/world/worldLayout.ts) — one for
ground, one for props. Redraw a row, save, reload. Malformed grids throw at boot
with the offending coordinate rather than failing silently.

Landmarks are data in
[`src/game/world/interactables.ts`](src/game/world/interactables.ts): give one
an id, a tile, a label and an action, and the scene builds the sprite, the
collider and the prompt for it. A new `dialog` landmark needs no new code.

### Art

All textures are generated at runtime and are obviously temporary. Real assets
drop in via `BootScene.preload()` and automatically take precedence over the
generators. The contract — 64 × 64 canvases, baseline at `y=56`, sheet layouts,
palette — is in [`docs/ART_BIBLE.md`](docs/ART_BIBLE.md).

## Configuration

Copy `.env.example` to `.env.local`:

```bash
VITE_TWITCH_CHANNEL=mrfinnertytv
```

That is the only setting, and it is not a secret — it is a public channel name.
The Twitch `parent` parameter is derived from `window.location.hostname` at
runtime, so one build works on localhost, preview deploys and production without
a hardcoded domain anywhere.

**Deploying:** `VITE_TWITCH_CHANNEL` must also be set in the hosting
environment. Vite inlines env vars at **build** time, so adding or changing it
requires a redeploy — it is not read at runtime. Without it the Live Deck opens
and reports that the deck is dark rather than showing an error.
