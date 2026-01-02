import type { DashgramError } from "../errors"

/**
 * Track level defines how many auto-events are collected
 */
export type TrackLevel = 1 | 2 | 3

/**
 * Event source type
 */
export type EventSource = "auto" | "manual"

/**
 * SDK Configuration
 */
export interface DashgramConfig {
  /** Project ID from Dashgram dashboard */
  projectId: string

  /** API Key for authentication */
  apiKey: string

  /** Track level (1-3) */
  trackLevel?: TrackLevel

  /** API endpoint URL */
  apiUrl?: string

  /** Batch size for events */
  batchSize?: number

  /** Flush interval in milliseconds */
  flushInterval?: number

  /** Enable debug logging */
  debug?: boolean

  /** Disable tracking (useful for development) */
  disabled?: boolean

  /** Optional error handler callback */
  onError?: (error: DashgramError) => void
}

/**
 * Event context information
 */
export interface EventContext {
  /** Platform (from Telegram WebApp) */
  platform: string

  /** App version (from Telegram WebApp) */
  app_version: string

  /** Language */
  language: string

  /** Screen width */
  screen_width: number

  /** Screen height */
  screen_height: number

  /** Viewport width */
  viewport_width: number

  /** Viewport height */
  viewport_height: number

  /** User agent */
  user_agent: string

  /** Timezone */
  timezone: string

  /** Telegram WebApp version */
  telegram_version?: string

  /** Theme (from Telegram WebApp) */
  theme?: string
}

/**
 * Event properties (user-defined)
 */
export type EventProperties = Record<string, any>

/**
 * Full event payload
 */
export interface DashgramEvent {
  /** Event name */
  event: string

  /** Custom properties */
  properties: EventProperties

  /** ISO 8601 timestamp */
  timestamp: string

  /** Event source */
  source: EventSource

  /** Track level */
  level: TrackLevel

  /** Session ID */
  session_id: string

  /** User ID (Telegram user ID or null) */
  user_id: string | null

  /** Event context */
  context: EventContext
}

/**
 * User traits for identification
 */
export type UserTraits = Record<string, any>

/**
 * Telegram WebApp interface (simplified)
 */
export interface TelegramWebApp {
  initDataUnsafe?: {
    user?: {
      id: number
      first_name?: string
      last_name?: string
      username?: string
      language_code?: string
    }
  }
  platform?: string
  version?: string
  themeParams?: Record<string, string>
  onEvent?: (event: string, callback: () => void) => void
  offEvent?: (event: string, callback: () => void) => void
}

/**
 * Window with Telegram
 */
export interface TelegramWindow extends Window {
  Telegram?: {
    WebApp?: TelegramWebApp
  }
}
