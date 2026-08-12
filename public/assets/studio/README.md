# Studio assets — drop the two generated images here

The studio experience is driven entirely by two images. Nothing else in the
codebase needs to change when they land: every coordinate that depends on them
lives in `src/studio/config/scene.ts`.

| File                                          | What it is                                                                       |
| --------------------------------------------- | -------------------------------------------------------------------------------- |
| `public/assets/studio/studio-master.png`      | The full static room. **No character baked in.** This is the fixed background.    |
| `public/assets/studio/pc-closeup-green.png`   | The monitor close-up. The bright green rectangle is the OS mount point.           |

## Requirements

- **16:9.** Both images must share the same aspect ratio so the zoom transition
  between them lands cleanly. 1920 × 1080 or larger is ideal; the room is scaled
  with `cover` so anything smaller than the viewport will soften.
- **Same framing.** `pc-closeup-green.png` should be a true close-up of the same
  desk in `studio-master.png` — the transition cross-fades between them.
- **The green must be a flat, saturated key colour** (pure `#00FF00` is what the
  calibration script expects). It is never shown to a visitor: the OS layer is
  positioned exactly over it, and the green is only there so the rectangle can be
  measured automatically.
- **No character in either image.** The player is a separate overlay sprite.

## After dropping them in

Start the dev server and open the calibration overlay:

```bash
npm run dev -- --open "/?calibrate=1"
```

It decodes the real PNG in a canvas, finds the exact green key-colour bounds and
prints the normalised values to paste into `MONITOR_RECT` in `scene.ts` — so the
OS is positioned from the asset rather than from an eyeballed guess. The same
overlay reads out normalised coordinates under the cursor, which is how the
hotspot polygons and the walkable floor get traced against the real room.

Calibration runs in the browser deliberately: decoding a PNG in Node would mean
adding an image library for a job the page can already do.

The character sprite sheet is separate and also lives here as
`studio/player.png` — a 4 × 2 grid (idle, walk) described in `scene.ts`.
