/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** Twitch channel login name for the future live embed. See .env.example. */
  readonly VITE_TWITCH_CHANNEL?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
