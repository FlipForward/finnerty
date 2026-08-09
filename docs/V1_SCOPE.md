# V1 Scope — what exists, and what deliberately does not

V1 is a **foundation**, not a feature set. The goal was one real, walkable
slice of world with clean seams, so the next phase adds content instead of
untangling architecture.

## In V1

- Title state that is a live view of the world, not a web hero section.
- One playable map, 60 × 40 tiles (960 × 640 px), roughly four screens: an
  Arrival Island lobby around a cosy streamer lodge, a forest bridge route, a
  visible but sealed cliff route, and a timber Live Deck over the lake.
- Walking, four-direction animation, normalised diagonals, arcade collision.
- Camera follow, clamped to world bounds.
- A reusable interaction system with five landmarks on it.
- A day/night cycle with lantern, banner and gate lighting.
- Working Twitch player and chat embeds on the live deck.
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
| Live/offline detection        | Twitch's own embed reports it. We never compute or fake it. See below.                      |
| Audio                         | No music or sound effects.                                                                  |
| Mobile controls               | No virtual joystick, by decision. Narrow/touch devices get the fallback screen.             |
| Final art                     | Every texture is generated at runtime. See `docs/ART_BIBLE.md`.                              |

## Twitch: what is and is not there

`src/components/LiveOverlay.tsx` now embeds Twitch for real — the official
player and the official chat, as two `<iframe>` elements.

- It **is** a DOM overlay above the canvas, because Twitch embeds are iframes
  and cannot be drawn inside WebGL — and Twitch requires the player to be
  visible and unobstructed. Nothing is layered on top of either frame.
- The channel comes from `VITE_TWITCH_CHANNEL`; the `parent` parameter is read
  from `window.location.hostname` at runtime, so localhost, preview deploys and
  production all work from a single build with no hardcoded domain.
- It contains **no credentials, no Helix API calls, no invented live status and
  no viewer count**. Whether the channel is live is reported by Twitch's own
  embed. Anything more would need a server-side token, which does not belong in
  a client bundle.
- If `VITE_TWITCH_CHANNEL` is missing, the panel says the deck is dark rather
  than showing a configuration error to a visitor. The operator-facing hint is
  dev-only.

**Deployment note:** Vite inlines env vars at build time, so setting
`VITE_TWITCH_CHANNEL` in the host's environment requires a redeploy to take
effect — it is not read at runtime.

One genuine limitation: while focus is inside a cross-origin iframe, key events
go to Twitch rather than to this page, so Escape cannot be observed there. That
is a browser security boundary. The close button is always visible and the
backdrop is clickable, which covers it.

## Known limitations worth knowing about

- **Integer-only canvas scaling.** The canvas scales by whole multiples so
  pixels stay square. At viewport widths in the 2.x range (e.g. 1280 × 720 →
  ×2) this leaves visible letterboxing. The alternative — fractional scaling —
  keeps edges sharp but makes some source pixels 3 screen pixels wide and
  others 4, which looks wrong on a 480 × 270 canvas.
- **Placeholder art is not final.** Trees, the player and props are simple
  generated shapes. They obey the art bible so the world reads correctly, but
  they are meant to be replaced wholesale.
- **Parts of the map are decorative.** The boundary treeline seals off pockets
  of grass near the map edges that the player cannot reach — about 10% of the
  walkable tiles. This is intentional world boundary, not a pathfinding bug.
- **The gate is solid.** Walking straight north from the spawn tile stops at
  the portal. The route to the hillside lettering goes around the west side of
  the plaza, which is kept clear of trees on purpose.
- **No loading screen of substance.** Textures are generated in a few
  milliseconds, so the "LOADING" state is nearly invisible. When real assets are
  loaded over the network this will need a proper progress bar in `BootScene`.
