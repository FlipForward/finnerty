# Scope — what exists, and what deliberately does not

The site is a **fixed interactive studio room**, not an open world. One static
artwork fills the viewport, a separate character walks the floor, and clicking
the desk zooms into a working pixel-art OS.

## Built

- Fullscreen studio room from `studio-master.png`, scaled with `cover` at every
  resolution. No page chrome, no letterboxing, no canvas.
- A separate placeholder character with idle + walk, confined to the wooden
  floor. Hovering a hotspot routes it there; moving to another retargets mid-walk.
- Three hotspots — the PC, the ATLAZ decks, the camera — with cobalt hover
  outlines and labels. Click walks first, opens on arrival.
- PC close-up: cross-fade into `pc-closeup-green.png` with the OS mounted
  exactly over the measured green rectangle. The bezel, desk strip and dark
  second monitor are untouched artwork.
- MRFINNERTYTV OS: boot sequence, desktop, and LIVE / CLIPS / PLAY / ABOUT /
  POWER. Escape closes an app, Escape again returns to the room.
- LIVE: Twitch's official player and chat embeds.
- PLAY: a deliberate IN PROGRESS screen. The mini-game is not built yet.
- Ambient layers with randomised idle gaps, disabled under
  `prefers-reduced-motion`.
- Mobile fallback: a still of the room and three direct links.

## Placeholder, by design

| Area                  | State                                                                       |
| --------------------- | --------------------------------------------------------------------------- |
| Character sprite      | Procedurally drawn. Ship `studio/player.png` and repoint `ASSETS.player`.   |
| Cat                   | Procedurally drawn; the room art has no cat, so it is additive.             |
| Plant sway            | **Not rendered.** See below.                                                 |
| CLIPS                 | Three empty cards. Swap `CLIPS` in `os/Os.tsx` for real embeds.              |
| ABOUT                 | Short bio and two links.                                                     |
| Photography           | Panel with a disabled button until `LINKS.photography` is set.               |
| ATLAZ                 | Panel + link to atlazmusic.be. No music product, per the brief.              |

### Why plant sway is not rendered

The plants are painted into `studio-master.png`. Animating them needs cut-out
sprites lifted from that artwork — overlaying an invented frond on top of the
baked-in one looks wrong at any opacity. The `AMBIENT` config slots are kept so
the sprites can be dropped in without touching the component. The cat, the PC
LED pulse and the sunbeam dust are all live.

## Not built

Accounts, database, persistence, pets, skins, shop, currency, leaderboards,
multiplayer, quests, combat, WASD free-roam, and the Earth intro video — the
last explicitly out of scope for this pass.

## Retired

The Phaser open-world prototype is gone: `src/game/` in full, the old React
shell components, and the `phaser` dependency. Bundle dropped from 1,446 kB to
215 kB (407 kB → 69 kB gzipped).

The old world's tiles, props and character PNGs are still in
`public/assets/{tiles,props,characters}`. They are unused and can be deleted
once you are sure the world is not coming back.

## Known limitations

- **Hotspot polygons and the walkable floor were traced by eye** against the
  artwork. They are verified to be self-consistent — every standing point is
  inside the floor, and every route solves — but the outlines may want nudging
  against the furniture. `?calibrate=1` shows the floor and reads out
  coordinates under the cursor.
- **`cover` crops.** The artwork is 1672 × 941 (1.777). On a viewport with a
  different ratio the overflow is cropped rather than letterboxed — at 1440×900
  that is 159px of width. Nothing interactive sits near the edges.
- **Escape inside the Twitch iframe** goes to Twitch, not to the page. The
  window close button covers it.
- **Nearest-neighbour only above 1× scale.** Downscaling with `pixelated` drops
  rows and makes detailed artwork shimmer, so below 1× it uses smooth scaling.
