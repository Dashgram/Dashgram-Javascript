import type { Telemetry } from "../types"
import { getTelegramPlatform, getTelegramTheme } from "./telegram"

/**
 * Get telemetry data for events
 */
export function getTelemetry(): Telemetry {
  if (typeof window === "undefined") {
    return {
      platform: "unknown"
    }
  }

  return {
    platform: getTelegramPlatform(),
    user_agent: navigator.userAgent,
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || undefined,
    theme: getTelegramTheme()
  }
}

/**
 * Get current URL
 */
export function getCurrentUrl(): string {
  if (typeof window === "undefined") {
    return ""
  }

  return window.location.href
}

/**
 * Get current page path
 */
export function getCurrentPath(): string {
  if (typeof window === "undefined") {
    return ""
  }

  return window.location.pathname
}

/**
 * Get page title
 */
export function getPageTitle(): string {
  if (typeof document === "undefined") {
    return ""
  }

  return document.title || ""
}

/**
 * Get current origin
 */
export function getCurrentOrigin(): string {
  if (typeof window === "undefined") {
    return ""
  }

  return window.location.origin
}

import { LIBRARY_ORIGIN } from "../version"

/**
 * Get library identifier (name + version)
 */
export function getLibraryOrigin(): string {
  return LIBRARY_ORIGIN
}
