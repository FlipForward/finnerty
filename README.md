# MRFINNERTYTV — Studio

The site is a fixed interactive pixel-art studio. The room fills the screen,
a character walks its floor, and clicking the streaming desk zooms into a
working pixel-art OS.

See [`docs/V1_SCOPE.md`](docs/V1_SCOPE.md) for what is real and what is still
placeholder.

## Commands

```bash
npm install
```
```bash
npm run dev
```
```bash
npm run build
```
```bash
npm run preview
```

## How it works

**One coordinate space.** Everything lays out in the artwork's native
1672 × 941 pixels inside `.stage__inner`, which is then scaled to the viewport
with `cover`. One set of numbers is therefore correct at every resolution — no
per-breakpoint geometry.

**One config file.** [`src/studio/config/scene.ts`](src/studio/config/scene.ts)
holds the asset paths, the monitor rectangle, the three hotspots with their
polygons and standing points, the walkable floor, the ambient layers and the
tuning constants. Nothing spatial is hardcoded in a component.

**The monitor rectangle is measured, not guessed.** The OS sits over the green
key area of `pc-closeup-green.png`. Those bounds were read out of the shipped
PNG — pixels (271, 71) to (1460, 692), filling 99.88% of that box. Open
`?calibrate=1` to re-measure if the artwork changes; it also reads out
normalised coordinates under the cursor for tracing hotspots.

```
src/studio/
  config/scene.ts        all geometry, links and tuning
  config/calibrate.ts    key-colour measurement (dev)
  lib/geometry.ts        cover transform, polygon containment, routing
  lib/sprites.ts         procedural character + cat placeholders
  hooks/useStageScale.ts viewport fitting
  components/            Studio, Character, Ambient, PcCloseup, Panels, MobileStudio
  os/                    Os shell + Signal Catch mini-game
  styles/                studio.css, os.css
```

## Assets

Both images live in `public/assets/studio/` — see the
[README there](public/assets/studio/README.md) for the contract. The character
sprite is generated in code; drop in `studio/player.png` and repoint
`ASSETS.player` to replace it.

## Configuration

```bash
VITE_TWITCH_CHANNEL=mrfinnertytv
```

Not a secret — a public channel name. The Twitch `parent` parameter is derived
from `window.location.hostname` at runtime, so one build works on localhost,
preview deploys and production without a hardcoded domain.

**Deploying:** this must also be set in the hosting environment. Vite inlines
env vars at **build** time, so adding or changing it needs a redeploy. Without
it, LIVE reports that no feed is routed rather than showing an error.
