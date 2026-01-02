import type { TelegramWebApp, TelegramWindow } from "../types"

/**
 * Get Telegram WebApp instance
 */
export function getTelegramWebApp(): TelegramWebApp | null {
  if (typeof window === "undefined") {
    return null
  }

  const win = window as TelegramWindow
  return win.Telegram?.WebApp || null
}

/**
 * Check if running inside Telegram Mini App
 */
export function isTelegramMiniApp(): boolean {
  return getTelegramWebApp() !== null
}

/**
 * Get Telegram user ID
 */
export function getTelegramUserId(): string | null {
  const webApp = getTelegramWebApp()
  const userId = webApp?.initDataUnsafe?.user?.id
  return userId ? String(userId) : null
}

/**
 * Get Telegram platform
 */
export function getTelegramPlatform(): string {
  const webApp = getTelegramWebApp()
  return webApp?.platform || "unknown"
}

/**
 * Get Telegram version
 */
export function getTelegramVersion(): string {
  const webApp = getTelegramWebApp()
  return webApp?.version || "unknown"
}

/**
 * Get Telegram user language
 */
export function getTelegramLanguage(): string | null {
  const webApp = getTelegramWebApp()
  return webApp?.initDataUnsafe?.user?.language_code || null
}

/**
 * Get Telegram theme
 */
export function getTelegramTheme(): string {
  const webApp = getTelegramWebApp()
  if (!webApp?.themeParams) {
    return "unknown"
  }

  // Check if theme is dark based on background color
  const bgColor = webApp.themeParams.bg_color || ""
  if (bgColor) {
    // Simple heuristic: check if background is dark
    const rgb = parseInt(bgColor.slice(1), 16)
    const r = (rgb >> 16) & 0xff
    const g = (rgb >> 8) & 0xff
    const b = (rgb >> 0) & 0xff
    const luma = 0.2126 * r + 0.7152 * g + 0.0722 * b
    return luma < 128 ? "dark" : "light"
  }

  return "unknown"
}

/**
 * Subscribe to Telegram WebApp events
 * Handles both camelCase and snake_case event names for compatibility
 */
export function subscribeToTelegramEvent(event: string, callback: (eventData?: any) => void): () => void {
  const webApp = getTelegramWebApp()

  if (!webApp || !webApp.onEvent) {
    // Return no-op unsubscribe if WebApp is not available
    return () => {}
  }

  try {
    // Telegram WebApp onEvent signature: (eventType, callback) where callback receives (eventType, eventData)
    const wrappedCallback = (_eventType: string, eventData?: any) => {
      try {
        callback(eventData)
      } catch (error) {
        // Don't let callback errors break the SDK
        // Only log in debug mode to avoid console pollution
        if (typeof window !== "undefined" && (window as any).__DASHGRAM_DEBUG__) {
          console.warn(`[Dashgram] Error in Telegram event callback for ${event}:`, error)
        }
      }
    }

    webApp.onEvent(event, wrappedCallback)

    // Return unsubscribe function
    return () => {
      try {
        if (webApp.offEvent) {
          webApp.offEvent(event, wrappedCallback)
        }
      } catch (error) {
        // Ignore unsubscribe errors silently
      }
    }
  } catch (error) {
    // If event doesn't exist or subscription fails, return no-op silently
    // Events may not be available in all Telegram versions
    return () => {}
  }
}
