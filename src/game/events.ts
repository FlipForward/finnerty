/**
 * The single seam between Phaser and React.
 *
 * Phaser never imports a React component and React never reaches into a scene.
 * They talk through this typed bus only, which is what keeps a "the player
 * pressed E on the Live sign" event from turning into spaghetti.
 *
 * Deliberately dependency-free (no Phaser import) so React components can
 * subscribe without dragging the engine into their module graph.
 */

export interface DialogPayload {
  /** Interactable id, so React can key/animate per source. */
  id: string
  title: string
  /** One string per paragraph. */
  body: string[]
}

export interface GameEvents {
  /** Phaser -> React: engine booted, first frame of the world preview is up. */
  'game:ready': undefined
  /** React -> Phaser: leave the title state and hand control to the player. */
  'ui:start': undefined
  /** Phaser -> React: the world is now playable (fade finished). */
  'game:started': undefined
  /** Phaser -> React: open the generic info panel. */
  'overlay:dialog': DialogPayload
  /** Phaser -> React: open the Twitch/live overlay. */
  'overlay:live': undefined
  /** React -> Phaser: overlay dismissed; resume input and refocus the canvas. */
  'ui:overlay-closed': undefined
}

type Handler<K extends keyof GameEvents> = (payload: GameEvents[K]) => void

const handlers = new Map<keyof GameEvents, Set<Handler<never>>>()

/** Subscribe. Returns an unsubscribe function, which is what React effects want. */
export function on<K extends keyof GameEvents>(event: K, handler: Handler<K>): () => void {
  let set = handlers.get(event)
  if (!set) {
    set = new Set()
    handlers.set(event, set)
  }
  set.add(handler as Handler<never>)
  return () => {
    set.delete(handler as Handler<never>)
  }
}

export function off<K extends keyof GameEvents>(event: K, handler: Handler<K>): void {
  handlers.get(event)?.delete(handler as Handler<never>)
}

export function emit<K extends keyof GameEvents>(
  ...args: GameEvents[K] extends undefined ? [event: K] : [event: K, payload: GameEvents[K]]
): void {
  const [event, payload] = args as [K, GameEvents[K]]
  const set = handlers.get(event)
  if (!set) return
  // Copy first: a handler is allowed to unsubscribe itself while we iterate.
  for (const handler of [...set]) {
    ;(handler as Handler<K>)(payload)
  }
}

/** Used when the Phaser game is torn down (React strict mode, resize teardown). */
export function clearAllListeners(): void {
  handlers.clear()
}
