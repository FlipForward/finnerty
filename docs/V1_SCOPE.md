# V1 Scope — what exists, and what deliberately does not

V1 is a **foundation**, not a feature set. The goal was one real, walkable
slice of world with clean seams, so the next phase adds content instead of
untangling architecture.

## In V1

- Title state that is a live view of the world, not a web hero section.
- One playable map, 60 × 40 tiles (960 × 640 px), roughly four screens.
- Walking, four-direction animation, normalised diagonals, arcade collision.
- Camera follow, clamped to world bounds.
- A reusable interaction system with four landmarks on it.
- A day/night cycle with lantern and portal lighting.
- A DOM overlay layer for dialogs and the future Twitch player.
- A desktop-only posture with an honest mobile fallback.

## Deliberately not built

None of the following exists, in any partial form. There are no stub tables, no
dead flags, and no half-wired UI for them.

| Not built                     | Notes for later                                                                            |
| ----------------------------- | ------------------------------------------------------------------------------------------ |
| Accounts / login              | No auth, no session, no user identity anywhere.                                             |
| Database / backend            | The app is fully static. There is no server beyond the dev/preview host.                    |
| Persistence                   | Nothing is saved — not even position or time of day. Reload resets the world.               |
| Pets                          | `public/assets/pets/` exists as a placeholder directory only.                               |
| Skins / customisation         | The player has one appearance.                                                              |
| Shop, currency, inventory     | No economy of any kind. Explicitly out of brand.                                            |
| Leaderboards                  | —                                                                                            |
| Multiplayer / presence        | Single player, entirely local. No networking code.                                          |
| Minigames                     | —                                                                                            |
| Achievements / quests         | —                                                                                           |
| Combat, health, damage        | No hostiles, no health model, no RPG stats.                                                 |
| Extra biomes                  | The portal is the seam where they attach. It currently only opens a dialog.                 |
| Real Twitch integration       | `LiveOverlay` is a structured placeholder. See below.                                       |
| Audio                         | No music or sound effects.                                                                  |
| Mobile controls               | No virtual joystick, by decision. Narrow/touch devices get the fallback screen.             |
| Final art                     | Every texture is generated at runtime. See `docs/ART_BIBLE.md`.                              |

## Twitch: what is and is not there

`src/components/LiveOverlay.tsx` is a real component with the correct
architecture and no functionality:

- It **is** a DOM overlay above the canvas, because Twitch embeds are iframes
  and cannot be drawn inside WebGL — and Twitch requires the player to be
  visible and unobstructed.
- It **does** resolve the two values the embed needs: the channel from
  `VITE_TWITCH_CHANNEL`, and the `parent` parameter from `window.location.hostname`
  at runtime (so localhost, previews and production all work from one build).
- It **does not** contain any credentials, API calls, live/offline detection, or
  a viewer count. Those need a Helix token, which requires a server — none of it
  belongs in a client bundle, and none of it is faked.

Swapping in the real embeds is two `<iframe>` elements; the TODO in the
component spells out the exact markup and the gotchas.

## Known limitations worth knowing about

- **Integer-only canvas scaling.** The canvas scales by whole multiples so
  pixels stay square. At viewport widths in the 2.x range (e.g. 1280 × 720 →
  ×2) this leaves visible letterboxing. The alternative — fractional scaling —
  keeps edges sharp but makes some source pixels 3 screen pixels wide and
  others 4, which looks wrong on a 480 × 270 canvas.
- **Placeholder art is not final.** Trees, the player and props are simple
  generated shapes. They obey the art bible so the world reads correctly, but
  they are meant to be replaced wholesale.
- **Parts of the map are decorative.** The treeline seals off pockets of grass
  near the map edges that the player cannot reach. This is intentional world
  boundary, not a pathfinding bug.
- **No loading screen of substance.** Textures are generated in a few
  milliseconds, so the "LOADING" state is nearly invisible. When real assets are
  loaded over the network this will need a proper progress bar in `BootScene`.
