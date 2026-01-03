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
 * Get raw Telegram initData string (passed as-is to backend)
 */
export function getTelegramInitData(): string {
  const webApp = getTelegramWebApp()
  return webApp?.initData || ""
}

/**
 * Get Telegram platform
 */
export function getTelegramPlatform(): string {
  const webApp = getTelegramWebApp()
  return webApp?.platform || "unknown"
}

/**
 * Get Telegram theme (light/dark)
 */
export function getTelegramTheme(): string | undefined {
  const webApp = getTelegramWebApp()

  // Use colorScheme directly if available
  if (webApp?.colorScheme) {
    return webApp.colorScheme
  }

  // Fallback: detect from themeParams
  if (webApp?.themeParams?.bg_color) {
    const bgColor = webApp.themeParams.bg_color
    try {
      const rgb = parseInt(bgColor.slice(1), 16)
      const r = (rgb >> 16) & 0xff
      const g = (rgb >> 8) & 0xff
      const b = (rgb >> 0) & 0xff
      const luma = 0.2126 * r + 0.7152 * g + 0.0722 * b
      return luma < 128 ? "dark" : "light"
    } catch {
      return undefined
    }
  }

  return undefined
}

/**
 * Subscribe to Telegram WebApp events
 */
export function subscribeToTelegramEvent(event: string, callback: (eventData?: unknown) => void): () => void {
  const webApp = getTelegramWebApp()

  if (!webApp || !webApp.onEvent) {
    return () => {}
  }

  try {
    const wrappedCallback = (_eventType: string, eventData?: unknown) => {
      try {
        callback(eventData)
      } catch (error) {
        if (
          typeof window !== "undefined" &&
          (window as typeof window & { __DASHGRAM_DEBUG__?: boolean }).__DASHGRAM_DEBUG__
        ) {
          console.warn(`[Dashgram] Error in Telegram event callback for ${event}:`, error)
        }
      }
    }

    webApp.onEvent(event, wrappedCallback)

    return () => {
      try {
        if (webApp.offEvent) {
          webApp.offEvent(event, wrappedCallback)
        }
      } catch {
        // Ignore unsubscribe errors silently
      }
    }
  } catch {
    return () => {}
  }
}
