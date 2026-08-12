import { useEffect, useState } from 'react'

export interface PreloadState {
  /** 0..1 across every source, settled or failed. */
  progress: number
  /** True once every source has been fetched (and decoded, where possible). */
  done: boolean
  loaded: number
  total: number
  /** Sources that failed. The site still opens; it never hangs on them. */
  failed: string[]
}

/**
 * How long to wait for a decode once the bytes are in, ms.
 *
 * Browsers deprioritise image decoding for pages that are not visible, and
 * `decode()` can sit unresolved indefinitely in a background tab — verified in
 * this project: nine images all stalled at 0% until something forced the work.
 * Bytes are always waited for; decoding gets this long and then we move on, so
 * the loading screen can never hang.
 */
const DECODE_GRACE_MS = 4000

/** Absolute ceiling per image, ms. A dead asset must not trap the visitor. */
const LOAD_TIMEOUT_MS = 20000

function after(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

/**
 * Fetches and decodes every given image before reporting done.
 *
 * Decoding matters as much as downloading here: `onload` fires when the bytes
 * have arrived, but the browser may still stall decoding a 2.4MB PNG on first
 * paint — exactly the hitch the loading screen exists to hide. So this waits
 * for both, with the guards above so it always terminates.
 */
export function usePreload(sources: string[]): PreloadState {
  const [state, setState] = useState<PreloadState>(() => ({
    progress: sources.length === 0 ? 1 : 0,
    done: sources.length === 0,
    loaded: 0,
    total: sources.length,
    failed: [],
  }))

  useEffect(() => {
    let cancelled = false
    let settled = 0
    const failed: string[] = []
    const total = sources.length

    if (total === 0) {
      setState({ progress: 1, done: true, loaded: 0, total: 0, failed: [] })
      return
    }

    const settle = () => {
      settled += 1
      if (cancelled) return
      setState({
        progress: settled / total,
        done: settled >= total,
        loaded: settled,
        total,
        failed: [...failed],
      })
    }

    const load = async (src: string): Promise<void> => {
      const img = new Image()

      const bytesIn = new Promise<void>((resolve) => {
        img.onload = () => resolve()
        img.onerror = () => {
          failed.push(src)
          resolve()
        }
      })

      img.src = src
      if (img.complete && img.naturalWidth > 0) {
        // Already cached — onload will not fire again.
      } else {
        await Promise.race([bytesIn, after(LOAD_TIMEOUT_MS)])
      }

      if (typeof img.decode === 'function') {
        // Never let decoding be the thing that keeps the visitor waiting.
        await Promise.race([img.decode().catch(() => undefined), after(DECODE_GRACE_MS)])
      }
    }

    for (const src of sources) void load(src).then(settle, settle)

    return () => {
      cancelled = true
    }
    // Sources come from a module-level constant; identity is stable.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sources.length])

  return state
}
