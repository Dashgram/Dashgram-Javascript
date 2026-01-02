import type { DashgramEvent } from "../types"
import type { Config } from "../core/config"
import { safeStringify } from "../utils/helpers"
import { InvalidCredentialsError, DashgramAPIError, NetworkError } from "../errors"

/**
 * Transport layer - sends events to backend
 */
export class Transport {
  private config: Config
  private isOnline: boolean = true
  private pendingRequests: Set<Promise<void>> = new Set()

  constructor(config: Config) {
    this.config = config
    this.setupOnlineListener()
  }

  /**
   * Setup online/offline listener
   */
  private setupOnlineListener(): void {
    if (typeof window === "undefined") {
      return
    }

    window.addEventListener("online", () => {
      this.isOnline = true
      this.log("Connection restored")
    })

    window.addEventListener("offline", () => {
      this.isOnline = false
      this.log("Connection lost")
    })

    this.isOnline = navigator.onLine
  }

  /**
   * Send events to backend
   * Errors are caught and handled by default (backward compatible)
   * Users can opt-in to error handling via onError callback
   */
  async send(events: DashgramEvent[]): Promise<void> {
    if (events.length === 0) {
      return
    }

    if (this.config.isDisabled()) {
      this.log("Tracking disabled, skipping send")
      return
    }

    if (!this.isOnline) {
      this.log("Offline, skipping send")
      return
    }

    const request = this.sendRequest(events)
    this.pendingRequests.add(request)

    try {
      await request
    } catch (error) {
      // Default behavior: log error (backward compatible)
      this.logError("Failed to send events:", error)

      // Call user's error handler if provided
      const onError = this.config.getOnError()
      if (onError) {
        try {
          // error is already a DashgramError from sendRequest
          if (
            error instanceof InvalidCredentialsError ||
            error instanceof DashgramAPIError ||
            error instanceof NetworkError
          ) {
            onError(error)
          } else if (error instanceof Error) {
            // Fallback: wrap unknown errors
            onError(new NetworkError(error))
          }
        } catch (handlerError) {
          // Don't let user's error handler break SDK
          this.logError("Error in onError callback:", handlerError)
        }
      }
    } finally {
      this.pendingRequests.delete(request)
    }
  }

  /**
   * Send request to backend
   * @throws {InvalidCredentialsError} If credentials are invalid (403)
   * @throws {DashgramAPIError} If API returns an error
   * @throws {NetworkError} If network request fails
   */
  private async sendRequest(events: DashgramEvent[]): Promise<void> {
    const url = this.config.get("apiUrl")
    const apiKey = this.config.get("apiKey")
    const projectId = this.config.get("projectId")

    try {
      const response = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-API-Key": apiKey,
          "X-Project-ID": projectId
        },
        body: safeStringify({ events }),
        keepalive: true
      })

      if (response.status === 403) {
        throw new InvalidCredentialsError()
      }

      if (!response.ok) {
        let details = response.statusText
        try {
          const errorData = await response.json()
          details = errorData.details || errorData.message || details
        } catch {
          // Ignore JSON parse errors, use statusText
        }

        throw new DashgramAPIError(response.status, details)
      }

      this.log(`Sent ${events.length} events successfully`)
    } catch (error) {
      // Re-throw typed errors
      if (error instanceof InvalidCredentialsError || error instanceof DashgramAPIError) {
        throw error
      }

      // Wrap network/unknown errors
      if (error instanceof Error) {
        throw new NetworkError(error)
      }

      // Fallback for non-Error exceptions
      throw new NetworkError(new Error(String(error)))
    }
  }

  /**
   * Send events using sendBeacon (for page unload)
   */
  sendBeacon(events: DashgramEvent[]): boolean {
    if (events.length === 0) {
      return true
    }

    if (this.config.isDisabled()) {
      return true
    }

    if (typeof navigator === "undefined" || !navigator.sendBeacon) {
      return false
    }

    const url = this.config.get("apiUrl")
    const apiKey = this.config.get("apiKey")
    const projectId = this.config.get("projectId")

    // sendBeacon doesn't support custom headers, so include auth in payload
    const payload = safeStringify({
      events,
      apiKey,
      projectId
    })

    const blob = new Blob([payload], { type: "application/json" })
    const sent = navigator.sendBeacon(url, blob)

    this.log(`sendBeacon ${sent ? "succeeded" : "failed"} for ${events.length} events`)

    return sent
  }

  /**
   * Wait for all pending requests to complete
   */
  async flush(): Promise<void> {
    await Promise.all(Array.from(this.pendingRequests))
  }

  /**
   * Log debug message
   */
  private log(...args: any[]): void {
    if (this.config.isDebug()) {
      console.log("[Dashgram Transport]", ...args)
    }
  }

  /**
   * Log error message
   */
  private logError(...args: any[]): void {
    if (this.config.isDebug()) {
      console.error("[Dashgram Transport]", ...args)
    }
  }
}
