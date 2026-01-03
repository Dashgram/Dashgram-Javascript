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
 * Telemetry data sent with events (backend contract)
 */
export interface Telemetry {
  /** IP address (optional, can be filled by backend) */
  ip?: string

  /** Platform from Telegram WebApp */
  platform?: string

  /** Browser user agent */
  user_agent?: string

  /** IANA timezone (e.g. "Europe/Moscow") */
  timezone?: string

  /** Theme: "light" or "dark" */
  theme?: string
}

/**
 * Event properties (user-defined)
 */
export type EventProperties = Record<string, unknown>

/**
 * WebApp event payload (backend contract)
 */
export interface WebAppEvent {
  /** Event ID - MUST be UUID */
  eventId: string

  /** Event type/name */
  type: string

  /** Raw Telegram initData string (passed as-is) */
  initData: Record<string, unknown>

  /** Custom event properties */
  properties?: unknown

  /** Telemetry data */
  telemetry?: Telemetry

  /** Event source: "auto" or "manual" */
  source?: string

  /** Track level that captured this event */
  level?: number

  /** Timestamp in unix milliseconds */
  timestamp: number
}

/**
 * Track request payload (backend contract)
 */
export interface WebAppTrackRequest {
  /** Origin URL */
  origin?: string

  /** Array of events to track */
  updates: WebAppEvent[]
}

/**
 * Telegram WebApp interface (simplified)
 * Based on official Telegram Mini Apps API
 */
export interface TelegramWebApp {
  /** Raw init data string */
  initData?: string

  /** Parsed init data (unsafe, not validated) */
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
  onEvent?: (event: string, callback: (eventType: string, eventData?: unknown) => void) => void
  offEvent?: (event: string, callback: (eventType: string, eventData?: unknown) => void) => void

  // Methods (used for patching)
  openLink?: (url: string, options?: { try_instant_view?: boolean }) => void
  openTelegramLink?: (url: string) => void
  switchInlineQuery?: (query: string, chooseChatTypes?: string[]) => void
  shareToStory?: (mediaUrl: string, params?: unknown) => void
  close?: (options?: { return_back?: boolean }) => void
  exitFullscreen?: () => void
  openInvoice?: (slug: string, callback?: (status: string) => void) => void
  requestAccess?: (accessType: string, callback?: (status: string) => void) => void
  requestContact?: (callback?: (status: string) => void) => void
  requestPhone?: (callback?: (status: string) => void) => void
  requestLocation?: (callback?: (status: string, location?: unknown) => void) => void
  checkLocation?: (callback?: (isAvailable: boolean, location?: unknown) => void) => void
}

/**
 * Window with Telegram
 */
export interface TelegramWindow extends Window {
  Telegram?: {
    WebApp?: TelegramWebApp
  }
}
