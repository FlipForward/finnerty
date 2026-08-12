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

**Geometry is measured, not guessed.** The OS sits over the green key area of
`pc-closeup-green.png` — pixels (271, 71) to (1460, 692), filling 99.88% of that
box, read straight out of the shipped PNG. Object bounds come from the overlay
alpha the same way.

**Hover follows the real silhouette.** Each hotspot is a pair of full-canvas
crops from the master art (`desk.png` / `desk-highlight-alpha.png`, and so on)
drawn at the stage origin, so they inherit the room's exact transform and cannot
drift from it. Pointer hits are resolved by sampling the overlay's alpha, which
is why only the actual desk, decks or camera can light up — there are no
polygons or rectangles anywhere.

### Asset scripts

```bash
node scripts/inspect-overlays.mjs
```
Reports each overlay's alpha coverage and content bounds — the numbers that go
into `bounds` in the config.

```bash
node scripts/build-highlight-alpha.mjs
```
Regenerates `*-highlight-alpha.png`. The supplied highlights carry a pale-yellow
halo ~21px proud of the object; this masks each one against its own normal
crop's silhouette so the halo goes and any warm pixels genuinely belonging to
the object survive. Sources are never modified. Both scripts use a small
dependency-free PNG codec in `scripts/png.mjs`.

```
src/studio/
  config/scene.ts        all geometry, links and tuning
  config/calibrate.ts    key-colour measurement (dev)
  lib/geometry.ts        cover transform, polygon containment, routing
  lib/sprites.ts         procedural character + cat placeholders
  hooks/useStageScale.ts viewport fitting
  components/            Studio, Character, Ambient, PcCloseup, Panels, MobileStudio
  os/                    Os shell, apps and osConfig (apps, clips, socials)
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
