/**
 * FINN CAM — everything the photography experience needs, in one place.
 *
 * All subject coordinates are in the panorama's NATIVE pixel space
 * (PANORAMA.width x PANORAMA.height). The viewfinder converts them to screen
 * space, so they stay correct at every resolution and zoom.
 */

export const PANORAMA = {
  src: '/assets/camera/valley-panorama.png',
  width: 1774,
  height: 887,
} as const

/**
 * How much panorama width fills the viewfinder, in native px.
 *
 * The panorama is only 2:1, so fitting its full height to a 16:9 viewfinder
 * would leave barely any room to pan. Showing ~900px of the 1774 crops in far
 * enough to give real movement on both axes.
 */
export const VIEW_NATIVE_WIDTH = 900

/** A subject counts as framed when its centre is within this fraction of the
 *  viewfinder's smaller side from dead centre. */
export const FRAME_TOLERANCE = 0.14

export interface TargetDef {
  id: string
  /** Shown in the capture toast and the gallery. */
  name: string
  /** Centre of the subject, in native panorama pixels. */
  x: number
  y: number
  /** Confidence in the coordinate — see the note below. */
  note?: string
}

/**
 * The three hidden subjects.
 *
 * MEASURED, not eyeballed: `node scripts/find-camera-targets.mjs` scans the
 * panorama for saturated colour clusters and filters them by blob shape.
 *
 *   sailboat — unambiguous. Exactly one tall red cluster in the whole image
 *              (15x38px at 1005,621), which is a sail and nothing else.
 *   car      — best car-shaped yellow blob (23x8px, aspect 2.9 at 806,460).
 *              Good but not certain.
 *   bird     — NOT resolved by colour. The panorama is warm-toned throughout
 *              and dark blobs on the right are mostly foliage, so this is a
 *              positioned estimate.
 *
 * Open the camera with `?camcal=1` to see crosshairs on each target plus a live
 * native-coordinate readout under the cursor, and correct any of these in
 * seconds.
 */
export const TARGETS: TargetDef[] = [
  { id: 'car', name: 'YELLOW CAR', x: 806, y: 460, note: 'measured, medium confidence' },
  { id: 'boat', name: 'RED SAILBOAT', x: 1005, y: 621, note: 'measured, high confidence' },
  { id: 'bird', name: 'BIRD OF PREY', x: 1527, y: 302, note: 'ESTIMATE — verify with ?camcal=1' },
]

export interface MemoryPhoto {
  id: string
  src: string
  title: string
  meta: string
}

/** Already in the gallery when a visitor first opens it. */
export const MEMORY_PHOTOS: MemoryPhoto[] = [
  { id: 'mem-cat', src: '/assets/camera/cat-studio.png', title: 'Studio cat', meta: 'Home · the good chair' },
  { id: 'mem-safari', src: '/assets/camera/safari-elephant.png', title: 'Elephant', meta: 'Safari · long lens' },
]

/** Stored captures. Bump when the shape changes so old data is discarded. */
export const STORAGE_KEY = 'finncam.captures.v1'

/** Saved shot size. Small enough that several fit comfortably in localStorage. */
export const CAPTURE_WIDTH = 480
export const CAPTURE_QUALITY = 0.72

export const SHUTTER_MS = 130
/** How long the frame holds after a successful capture. */
export const FREEZE_MS = 420
export const TOAST_MS = 2200

/** Pan speed for the arrow keys, in native px per second. */
export const KEY_PAN_SPEED = 620
