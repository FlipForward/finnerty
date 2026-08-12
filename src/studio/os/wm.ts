import { APPS, DESK_HEIGHT, SCREEN_WIDTH, type AppId } from './osConfig'

export interface WinState {
  id: AppId
  /** App-specific argument, e.g. a Files path or a viewer document. */
  arg?: string
  x: number
  y: number
  w: number
  h: number
  z: number
  minimised: boolean
  maximised: boolean
  /** Geometry to restore to when un-maximising. */
  restore?: { x: number; y: number; w: number; h: number }
}

export interface WmState {
  wins: WinState[]
  /** Monotonic stacking counter. */
  z: number
  /** Cascade offset for the next fresh window. */
  spawn: number
}

export type WmAction =
  | { type: 'open'; app: AppId; arg?: string }
  | { type: 'close'; id: AppId }
  | { type: 'focus'; id: AppId }
  | { type: 'minimise'; id: AppId }
  | { type: 'toggleMax'; id: AppId }
  | { type: 'move'; id: AppId; x: number; y: number }
  | { type: 'cycle' }

export const initialWm: WmState = { wins: [], z: 10, spawn: 0 }

/** Keeps a window fully inside the desktop area. */
function clamp(x: number, y: number, w: number, h: number) {
  return {
    x: Math.max(0, Math.min(x, SCREEN_WIDTH - w)),
    y: Math.max(0, Math.min(y, DESK_HEIGHT - h)),
  }
}

function topmost(wins: WinState[]): WinState | undefined {
  return wins.filter((w) => !w.minimised).sort((a, b) => b.z - a.z)[0]
}

/**
 * A small window manager.
 *
 * One window per app by design — reopening a running app focuses it rather than
 * stacking duplicates, which is what a dock-driven desktop actually does. The
 * `viewer` app is the exception in spirit: reopening it swaps the document.
 */
export function wmReducer(state: WmState, action: WmState extends never ? never : WmAction): WmState {
  switch (action.type) {
    case 'open': {
      const existing = state.wins.find((w) => w.id === action.app)
      const z = state.z + 1
      if (existing) {
        return {
          ...state,
          z,
          wins: state.wins.map((w) =>
            w.id === action.app ? { ...w, z, minimised: false, arg: action.arg ?? w.arg } : w,
          ),
        }
      }
      const def = APPS[action.app]
      const n = state.spawn % 5
      const wanted = clamp(38 + n * 26, 16 + n * 22, def.size.w, def.size.h)
      return {
        ...state,
        z,
        spawn: state.spawn + 1,
        wins: [
          ...state.wins,
          {
            id: action.app,
            arg: action.arg,
            x: wanted.x,
            y: wanted.y,
            w: def.size.w,
            h: def.size.h,
            z,
            minimised: false,
            maximised: false,
          },
        ],
      }
    }

    case 'close':
      return { ...state, wins: state.wins.filter((w) => w.id !== action.id) }

    case 'focus': {
      const z = state.z + 1
      return {
        ...state,
        z,
        wins: state.wins.map((w) => (w.id === action.id ? { ...w, z, minimised: false } : w)),
      }
    }

    case 'minimise':
      return {
        ...state,
        wins: state.wins.map((w) => (w.id === action.id ? { ...w, minimised: true } : w)),
      }

    case 'toggleMax': {
      const z = state.z + 1
      return {
        ...state,
        z,
        wins: state.wins.map((w) => {
          if (w.id !== action.id) return w
          if (w.maximised) {
            const r = w.restore ?? { x: w.x, y: w.y, w: w.w, h: w.h }
            return { ...w, ...r, maximised: false, z, restore: undefined }
          }
          return {
            ...w,
            restore: { x: w.x, y: w.y, w: w.w, h: w.h },
            x: 0,
            y: 0,
            w: SCREEN_WIDTH,
            h: DESK_HEIGHT,
            maximised: true,
            z,
          }
        }),
      }
    }

    case 'move': {
      return {
        ...state,
        wins: state.wins.map((w) => {
          if (w.id !== action.id || w.maximised) return w
          const p = clamp(action.x, action.y, w.w, w.h)
          return { ...w, x: p.x, y: p.y }
        }),
      }
    }

    case 'cycle': {
      // Alt+Tab: send the front window to the back of the visible stack.
      const visible = state.wins.filter((w) => !w.minimised)
      if (visible.length < 2) return state
      const front = topmost(state.wins)
      if (!front) return state
      const lowest = Math.min(...visible.map((w) => w.z))
      const z = state.z + 1
      const next = visible.filter((w) => w.id !== front.id).sort((a, b) => b.z - a.z)[0]
      return {
        ...state,
        z,
        wins: state.wins.map((w) => {
          if (w.id === next.id) return { ...w, z }
          if (w.id === front.id) return { ...w, z: lowest - 1 }
          return w
        }),
      }
    }

    default:
      return state
  }
}

export function focusedWindow(state: WmState): WinState | undefined {
  return topmost(state.wins)
}
