import { SCENE_HEIGHT, SCENE_WIDTH, WALKABLE_FLOOR, type Point } from '../config/scene'

/** Normalised (0..1) room space -> the 1672x941 stage space children lay out in. */
export function toStage(p: Point): Point {
  return { x: p.x * SCENE_WIDTH, y: p.y * SCENE_HEIGHT }
}

export function polygonToStagePath(points: Point[]): string {
  return points.map((p) => `${(p.x * SCENE_WIDTH).toFixed(1)},${(p.y * SCENE_HEIGHT).toFixed(1)}`).join(' ')
}

/** Standard ray-cast containment. Works for the concave floor outline too. */
export function pointInPolygon(p: Point, poly: Point[]): boolean {
  let inside = false
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    const a = poly[i]
    const b = poly[j]
    const straddles = a.y > p.y !== b.y > p.y
    if (straddles && p.x < ((b.x - a.x) * (p.y - a.y)) / (b.y - a.y) + a.x) inside = !inside
  }
  return inside
}

function distanceSq(a: Point, b: Point): number {
  const dx = a.x - b.x
  const dy = a.y - b.y
  return dx * dx + dy * dy
}

/** Nearest point on segment ab to p. */
function closestOnSegment(p: Point, a: Point, b: Point): Point {
  const dx = b.x - a.x
  const dy = b.y - a.y
  const lenSq = dx * dx + dy * dy
  if (lenSq === 0) return a
  let t = ((p.x - a.x) * dx + (p.y - a.y) * dy) / lenSq
  t = Math.max(0, Math.min(1, t))
  return { x: a.x + t * dx, y: a.y + t * dy }
}

/** Pulls a point just inside the floor. Used so a target is never unreachable. */
export function clampToFloor(p: Point, poly: Point[] = WALKABLE_FLOOR): Point {
  if (pointInPolygon(p, poly)) return p
  let best = poly[0]
  let bestDist = Infinity
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    const c = closestOnSegment(p, poly[j], poly[i])
    const d = distanceSq(p, c)
    if (d < bestDist) {
      bestDist = d
      best = c
    }
  }
  // Nudge toward the centroid so the result is strictly inside, not on the edge.
  const c = centroid(poly)
  return { x: best.x + (c.x - best.x) * 0.04, y: best.y + (c.y - best.y) * 0.04 }
}

export function centroid(poly: Point[]): Point {
  const sum = poly.reduce((acc, p) => ({ x: acc.x + p.x, y: acc.y + p.y }), { x: 0, y: 0 })
  return { x: sum.x / poly.length, y: sum.y / poly.length }
}

/** True if every sample along a..b stays inside the polygon. */
function segmentInside(a: Point, b: Point, poly: Point[]): boolean {
  const steps = 24
  for (let i = 0; i <= steps; i++) {
    const t = i / steps
    const p = { x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t }
    if (!pointInPolygon(p, poly)) return false
  }
  return true
}

/**
 * A short sensible route from `from` to `to`, both in normalised space.
 *
 * The floor is close to convex, so a straight line almost always works and is
 * what the character should take. When it does not — the outline bends around
 * the couch — one waypoint through the floor's centroid is enough to get around
 * it without pulling in a full navmesh for a single room.
 */
export function route(from: Point, to: Point, poly: Point[] = WALKABLE_FLOOR): Point[] {
  const target = clampToFloor(to, poly)
  if (segmentInside(from, target, poly)) return [target]

  const via = centroid(poly)
  if (segmentInside(from, via, poly) && segmentInside(via, target, poly)) return [via, target]

  // Last resort: hop along inset polygon vertices until something connects.
  for (const vertex of poly) {
    const inset = { x: vertex.x + (via.x - vertex.x) * 0.18, y: vertex.y + (via.y - vertex.y) * 0.18 }
    if (segmentInside(from, inset, poly) && segmentInside(inset, target, poly)) return [inset, target]
  }
  return [target]
}

export type Facing = 'left' | 'right' | 'up' | 'down'

/** Which way a walker faces along a heading. Horizontal wins on diagonals. */
export function facingFor(dx: number, dy: number, fallback: Facing): Facing {
  if (Math.abs(dx) < 0.0005 && Math.abs(dy) < 0.0005) return fallback
  if (Math.abs(dx) >= Math.abs(dy)) return dx > 0 ? 'right' : 'left'
  return dy > 0 ? 'down' : 'up'
}
