import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react'
import {
  CAPTURE_QUALITY,
  CAPTURE_WIDTH,
  FRAME_TOLERANCE,
  FREEZE_MS,
  KEY_PAN_SPEED,
  MEMORY_PHOTOS,
  PANORAMA,
  SHUTTER_MS,
  STORAGE_KEY,
  TARGETS,
  TOAST_MS,
  VIEW_NATIVE_WIDTH,
  type TargetDef,
} from './cameraConfig'

const CALIBRATE =
  typeof window !== 'undefined' && new URLSearchParams(window.location.search).has('camcal')

export interface Capture {
  id: string
  /** Target id, or null for an ordinary scenery shot. */
  targetId: string | null
  name: string
  dataUrl: string
  at: number
}

/* --------------------------------------------------------------- storage */

function loadCaptures(): Capture[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw)
    return Array.isArray(parsed) ? parsed : []
  } catch {
    // Corrupt or unavailable storage must never stop the camera opening.
    return []
  }
}

function saveCaptures(list: Capture[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(list))
  } catch {
    // Quota exceeded — the session still works, it just will not persist.
  }
}

/* ------------------------------------------------------------------ audio */

/** A short synthesised shutter click. No audio asset needed. */
function playShutter() {
  try {
    const Ctx = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext
    if (!Ctx) return
    const ctx = new Ctx()
    const now = ctx.currentTime
    // Two clacks: mirror up, mirror down.
    for (const [t, f, g] of [
      [0, 1800, 0.22],
      [0.055, 1200, 0.15],
    ] as const) {
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()
      osc.type = 'square'
      osc.frequency.setValueAtTime(f, now + t)
      gain.gain.setValueAtTime(g, now + t)
      gain.gain.exponentialRampToValueAtTime(0.0001, now + t + 0.045)
      osc.connect(gain).connect(ctx.destination)
      osc.start(now + t)
      osc.stop(now + t + 0.05)
    }
    window.setTimeout(() => void ctx.close(), 400)
  } catch {
    // Audio is a nicety; never let it break a capture.
  }
}

/* -------------------------------------------------------------------- cam */

interface Props {
  onExit: () => void
}

type View = 'finder' | 'gallery'

export function Camera({ onExit }: Props) {
  const [view, setView] = useState<View>('finder')
  const [captures, setCaptures] = useState<Capture[]>(loadCaptures)
  const [sound, setSound] = useState(true)

  const found = new Set(captures.map((c) => c.targetId).filter(Boolean) as string[])

  const addCapture = useCallback((c: Capture) => {
    setCaptures((prev) => {
      // One shot per subject; scenery shots accumulate up to a sane cap.
      const withoutDupe = c.targetId ? prev.filter((p) => p.targetId !== c.targetId) : prev
      const next = [...withoutDupe, c].slice(-12)
      saveCaptures(next)
      return next
    })
  }, [])

  // Escape: gallery returns to the viewfinder, viewfinder exits to the studio.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== 'Escape') return
      e.preventDefault()
      e.stopPropagation()
      if (view === 'gallery') setView('finder')
      else onExit()
    }
    window.addEventListener('keydown', onKey, true)
    return () => window.removeEventListener('keydown', onKey, true)
  }, [view, onExit])

  return (
    <div className="cam">
      {view === 'finder' ? (
        <Viewfinder
          found={found}
          sound={sound}
          onSound={() => setSound((s) => !s)}
          onCapture={addCapture}
          onGallery={() => setView('gallery')}
          onExit={onExit}
        />
      ) : (
        <Gallery
          captures={captures}
          onBack={() => setView('finder')}
          onExit={onExit}
        />
      )}
    </div>
  )
}

/* ------------------------------------------------------------- viewfinder */

function Viewfinder({
  found,
  sound,
  onSound,
  onCapture,
  onGallery,
  onExit,
}: {
  found: Set<string>
  sound: boolean
  onSound: () => void
  onCapture: (c: Capture) => void
  onGallery: () => void
  onExit: () => void
}) {
  const frameRef = useRef<HTMLDivElement>(null)
  const imgRef = useRef<HTMLImageElement>(null)
  const [box, setBox] = useState({ w: 0, h: 0 })
  const [pan, setPan] = useState({ x: PANORAMA.width / 2 - VIEW_NATIVE_WIDTH / 2, y: 0 })
  const [flash, setFlash] = useState(false)
  const [frozen, setFrozen] = useState(false)
  const [toast, setToast] = useState<string | null>(null)
  const [cursor, setCursor] = useState({ x: 0, y: 0 })
  const keys = useRef<Record<string, boolean>>({})
  const panRef = useRef(pan)
  panRef.current = pan

  useLayoutEffect(() => {
    const el = frameRef.current
    if (!el) return
    const measure = () => setBox({ w: el.clientWidth, h: el.clientHeight })
    measure()
    const ro = new ResizeObserver(measure)
    ro.observe(el)
    return () => ro.disconnect()
  }, [])

  const scale = box.w > 0 ? box.w / VIEW_NATIVE_WIDTH : 1
  const viewNativeH = scale > 0 ? box.h / scale : 0
  const maxX = Math.max(0, PANORAMA.width - VIEW_NATIVE_WIDTH)
  const maxY = Math.max(0, PANORAMA.height - viewNativeH)

  const clampPan = useCallback(
    (p: { x: number; y: number }) => ({
      x: Math.max(0, Math.min(p.x, maxX)),
      y: Math.max(0, Math.min(p.y, maxY)),
    }),
    [maxX, maxY],
  )

  useEffect(() => setPan((p) => clampPan(p)), [clampPan])

  /** Native coordinate at the centre of the viewfinder. */
  const centre = { x: pan.x + VIEW_NATIVE_WIDTH / 2, y: pan.y + viewNativeH / 2 }
  const tolerance = FRAME_TOLERANCE * Math.min(VIEW_NATIVE_WIDTH, viewNativeH || VIEW_NATIVE_WIDTH)

  const framed: TargetDef | null =
    TARGETS.find(
      (t) => !found.has(t.id) && Math.hypot(t.x - centre.x, t.y - centre.y) <= tolerance,
    ) ?? null

  /* ---- dragging ---- */
  const drag = useRef<{ px: number; py: number; ox: number; oy: number } | null>(null)
  const onPointerDown = (e: React.PointerEvent) => {
    drag.current = { px: e.clientX, py: e.clientY, ox: pan.x, oy: pan.y }
    e.currentTarget.setPointerCapture(e.pointerId)
  }
  const onPointerMove = (e: React.PointerEvent) => {
    if (CALIBRATE) {
      const r = frameRef.current?.getBoundingClientRect()
      if (r) {
        setCursor({
          x: Math.round(panRef.current.x + (e.clientX - r.left) / scale),
          y: Math.round(panRef.current.y + (e.clientY - r.top) / scale),
        })
      }
    }
    const d = drag.current
    if (!d) return
    setPan(clampPan({ x: d.ox - (e.clientX - d.px) / scale, y: d.oy - (e.clientY - d.py) / scale }))
  }
  const endDrag = (e: React.PointerEvent) => {
    drag.current = null
    if (e.currentTarget.hasPointerCapture?.(e.pointerId)) e.currentTarget.releasePointerCapture(e.pointerId)
  }

  /* ---- keyboard pan ---- */
  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'].includes(e.key)) {
        e.preventDefault()
        keys.current[e.key] = true
      }
    }
    const up = (e: KeyboardEvent) => {
      keys.current[e.key] = false
    }
    window.addEventListener('keydown', down)
    window.addEventListener('keyup', up)
    return () => {
      window.removeEventListener('keydown', down)
      window.removeEventListener('keyup', up)
    }
  }, [])

  useEffect(() => {
    let raf = 0
    let last = performance.now()
    const tick = (now: number) => {
      const dt = Math.min(0.05, (now - last) / 1000)
      last = now
      const k = keys.current
      const dx = (k.ArrowRight ? 1 : 0) - (k.ArrowLeft ? 1 : 0)
      const dy = (k.ArrowDown ? 1 : 0) - (k.ArrowUp ? 1 : 0)
      if (dx || dy) {
        setPan((p) => clampPan({ x: p.x + dx * KEY_PAN_SPEED * dt, y: p.y + dy * KEY_PAN_SPEED * dt }))
      }
      raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [clampPan])

  /* ---- capture ---- */
  const capture = useCallback(() => {
    if (frozen) return
    const img = imgRef.current
    if (!img || !img.complete) return

    if (sound) playShutter()
    setFlash(true)
    setFrozen(true)
    window.setTimeout(() => setFlash(false), SHUTTER_MS)

    // Crop exactly what the viewfinder is showing.
    const canvas = document.createElement('canvas')
    const outW = CAPTURE_WIDTH
    const outH = Math.round((viewNativeH / VIEW_NATIVE_WIDTH) * CAPTURE_WIDTH)
    canvas.width = outW
    canvas.height = Math.max(1, outH)
    const ctx = canvas.getContext('2d')
    let dataUrl = ''
    if (ctx) {
      ctx.imageSmoothingEnabled = false
      ctx.drawImage(img, pan.x, pan.y, VIEW_NATIVE_WIDTH, viewNativeH, 0, 0, outW, canvas.height)
      dataUrl = canvas.toDataURL('image/jpeg', CAPTURE_QUALITY)
    }

    const hit = framed
    onCapture({
      id: `${Date.now()}`,
      targetId: hit?.id ?? null,
      name: hit ? hit.name : 'VALLEY',
      dataUrl,
      at: Date.now(),
    })

    window.setTimeout(() => setFrozen(false), FREEZE_MS)
    setToast(hit ? `${hit.name} CAPTURED` : 'SCENERY SAVED')
    window.setTimeout(() => setToast(null), TOAST_MS)
  }, [frozen, sound, pan, viewNativeH, framed, onCapture])

  // Enter / Space fire the shutter.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== 'Enter' && e.key !== ' ') return
      const tag = (e.target as HTMLElement)?.tagName
      if (tag === 'BUTTON') return // let the button's own handler run
      e.preventDefault()
      capture()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [capture])

  const imgW = PANORAMA.width * scale

  return (
    <div className="finder">
      <div
        className="finder__frame"
        ref={frameRef}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={endDrag}
        onPointerCancel={endDrag}
      >
        <img
          ref={imgRef}
          className={`finder__pano${frozen ? ' is-frozen' : ''}`}
          src={PANORAMA.src}
          alt="The valley, through the camera"
          draggable={false}
          style={{ width: imgW, transform: `translate(${-pan.x * scale}px, ${-pan.y * scale}px)` }}
        />

        {CALIBRATE &&
          TARGETS.map((t) => (
            <span
              key={t.id}
              className="finder__cal"
              style={{ left: (t.x - pan.x) * scale, top: (t.y - pan.y) * scale }}
            >
              {t.id}
            </span>
          ))}

        <div className="finder__corners" aria-hidden>
          <span /><span /><span /><span />
        </div>

        {/* The centre reticle brightens when a subject is framed — the only
            hint given. No arrows or markers are drawn over the scene. */}
        <div className={`finder__reticle${framed ? ' is-locked' : ''}`} aria-hidden>
          <span /><span /><span /><span />
        </div>

        {flash && <div className="finder__flash" aria-hidden />}
        {toast && <p className="finder__toast">{toast}</p>}
      </div>

      <div className="hud hud--top">
        <span className="hud__brand">FINN CAM</span>
        <span className="hud__rec" aria-hidden />
        <span className="hud__spacer" />
        {CALIBRATE && (
          <span className="hud__cal">
            native {cursor.x}, {cursor.y}
          </span>
        )}
        <button className="hud__btn" type="button" onClick={onSound}>
          {sound ? 'SOUND ON' : 'SOUND OFF'}
        </button>
        <button className="hud__btn" type="button" onClick={onExit}>
          ESC · STUDIO
        </button>
      </div>

      <div className="hud hud--bottom">
        <span className="hud__count">
          {found.size} / {TARGETS.length} FOUND
        </span>
        <span className="hud__spacer" />
        <button className="hud__btn" type="button" onClick={onGallery}>
          GALLERY
        </button>
        <button className="hud__shutter" type="button" onClick={capture} disabled={frozen}>
          <span className="hud__dot" aria-hidden />
          CAPTURE
        </button>
      </div>
    </div>
  )
}

/* ---------------------------------------------------------------- gallery */

function Gallery({
  captures,
  onBack,
  onExit,
}: {
  captures: Capture[]
  onBack: () => void
  onExit: () => void
}) {
  type Slot =
    | { kind: 'photo'; id: string; src: string; title: string; meta: string }
    | { kind: 'empty'; id: string; title: string }

  const slots: Slot[] = [
    ...MEMORY_PHOTOS.map((m) => ({ kind: 'photo' as const, id: m.id, src: m.src, title: m.title, meta: m.meta })),
    ...captures.map((c) => ({
      kind: 'photo' as const,
      id: c.id,
      src: c.dataUrl,
      title: c.name,
      meta: new Date(c.at).toLocaleDateString(),
    })),
    // Undiscovered subjects read as empty film slots, not locked rewards.
    ...TARGETS.filter((t) => !captures.some((c) => c.targetId === t.id)).map((t) => ({
      kind: 'empty' as const,
      id: `empty-${t.id}`,
      title: 'EMPTY SLOT',
    })),
  ]

  const firstPhoto = slots.findIndex((s) => s.kind === 'photo')
  const [sel, setSel] = useState(firstPhoto < 0 ? 0 : firstPhoto)
  const active = slots[Math.min(sel, slots.length - 1)]

  return (
    <div className="gallery">
      <div className="hud hud--top">
        <span className="hud__brand">FINN CAM · GALLERY</span>
        <span className="hud__spacer" />
        <button className="hud__btn" type="button" onClick={onBack}>
          BACK TO VIEWFINDER
        </button>
        <button className="hud__btn" type="button" onClick={onExit}>
          EXIT TO STUDIO
        </button>
      </div>

      <div className="gallery__stage">
        {active?.kind === 'photo' ? (
          <img src={active.src} alt={active.title} />
        ) : (
          <div className="gallery__empty">
            <span className="gallery__emptyframe" aria-hidden />
            <p>NOT PHOTOGRAPHED YET</p>
          </div>
        )}
      </div>

      <div className="gallery__caption">
        <span>{active?.kind === 'photo' ? active.title : 'EMPTY SLOT'}</span>
        <span className="gallery__meta">{active?.kind === 'photo' ? active.meta : '—'}</span>
      </div>

      <div className="gallery__strip">
        {slots.map((s, i) => (
          <button
            key={s.id}
            className={`gallery__thumb${i === sel ? ' is-on' : ''}${s.kind === 'empty' ? ' is-empty' : ''}`}
            type="button"
            onClick={() => setSel(i)}
            aria-label={s.title}
          >
            {s.kind === 'photo' ? <img src={s.src} alt="" /> : <span className="gallery__slotmark" aria-hidden />}
          </button>
        ))}
      </div>
    </div>
  )
}
