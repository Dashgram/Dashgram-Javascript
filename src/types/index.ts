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
 * Based on official Telegram Mini Apps API
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
  colorScheme?: "light" | "dark"
  isExpanded?: boolean
  viewportHeight?: number
  viewportStableHeight?: number

  // Safe area insets (Bot API 7.10+)
  safeAreaInset?: {
    top: number
    bottom: number
    left: number
    right: number
  }
  contentSafeAreaInset?: {
    top: number
    bottom: number
    left: number
    right: number
  }

  // Main and Secondary buttons
  MainButton?: {
    text?: string
    isVisible?: boolean
    isActive?: boolean
    isProgressVisible?: boolean
  }
  SecondaryButton?: {
    text?: string
    isVisible?: boolean
    isActive?: boolean
    isProgressVisible?: boolean
  }

  // Biometric manager (Bot API 7.2+)
  BiometricManager?: {
    isInited?: boolean
    isBiometricAvailable?: boolean
    biometricType?: "finger" | "face" | "unknown"
    isAccessRequested?: boolean
    isAccessGranted?: boolean
    isBiometricTokenSaved?: boolean
    deviceId?: string
  }

  // Location manager (Bot API 8.0+)
  LocationManager?: {
    isInited?: boolean
    isLocationAvailable?: boolean
    isAccessRequested?: boolean
    isAccessGranted?: boolean
  }

  // Accelerometer (Bot API 8.0+)
  Accelerometer?: {
    isStarted?: boolean
    x?: number
    y?: number
    z?: number
  }

  // Gyroscope (Bot API 8.0+)
  Gyroscope?: {
    isStarted?: boolean
    x?: number
    y?: number
    z?: number
  }

  // Device orientation (Bot API 8.0+)
  DeviceOrientation?: {
    isStarted?: boolean
    absolute?: boolean
    alpha?: number
    beta?: number
    gamma?: number
  }

  // Event methods
  onEvent?: (event: string, callback: (eventType: string, eventData?: any) => void) => void
  offEvent?: (event: string, callback: (eventType: string, eventData?: any) => void) => void

  // Methods (used for patching)
  openLink?: (url: string, options?: { try_instant_view?: boolean }) => void
  openTelegramLink?: (url: string) => void
  switchInlineQuery?: (query: string, chooseChatTypes?: string[]) => void
  shareToStory?: (mediaUrl: string, params?: any) => void
  close?: (options?: { return_back?: boolean }) => void
  exitFullscreen?: () => void
  openInvoice?: (slug: string, callback?: (status: string) => void) => void
  requestAccess?: (accessType: string, callback?: (status: string) => void) => void
  requestContact?: (callback?: (status: string) => void) => void
  requestPhone?: (callback?: (status: string) => void) => void
  requestLocation?: (callback?: (status: string, location?: any) => void) => void
  checkLocation?: (callback?: (isAvailable: boolean, location?: any) => void) => void
}

/**
 * Window with Telegram
 */
export interface TelegramWindow extends Window {
  Telegram?: {
    WebApp?: TelegramWebApp
  }
}
