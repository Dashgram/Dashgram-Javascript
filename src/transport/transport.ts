import type { WebAppEvent, WebAppTrackRequest } from "../types"
import type { Config } from "../core/config"
import { safeStringify } from "../utils/helpers"
import { DashgramAPIError, NetworkError } from "../errors"
import { getCurrentOrigin } from "../utils/device"

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
   * Build request payload
   */
  private buildPayload(events: WebAppEvent[]): WebAppTrackRequest {
    return {
      origin: getCurrentOrigin() || undefined,
      updates: events
    }
  }

  /**
   * Send events to backend
   */
  async send(events: WebAppEvent[]): Promise<void> {
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
      this.logError("Failed to send events:", error)

      const onError = this.config.getOnError()
      if (onError) {
        try {
          if (error instanceof DashgramAPIError || error instanceof NetworkError) {
            onError(error)
          } else if (error instanceof Error) {
            onError(new NetworkError(error))
          }
        } catch (handlerError) {
          this.logError("Error in onError callback:", handlerError)
        }
      }
    } finally {
      this.pendingRequests.delete(request)
    }
  }

  /**
   * Send request to backend
   */
  private async sendRequest(events: WebAppEvent[]): Promise<void> {
    const url = this.config.getTrackUrl()
    const payload = this.buildPayload(events)

    try {
      const response = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: safeStringify(payload),
        keepalive: true
      })

      if (!response.ok) {
        let details = response.statusText
        try {
          const errorData = await response.json()
          details = errorData.details || errorData.message || details
        } catch {
          // Ignore JSON parse errors
        }

        throw new DashgramAPIError(response.status, details)
      }

      this.log(`Sent ${events.length} events successfully`)
    } catch (error) {
      if (error instanceof DashgramAPIError) {
        throw error
      }

      if (error instanceof Error) {
        throw new NetworkError(error)
      }

      throw new NetworkError(new Error(String(error)))
    }
  }

  /**
   * Send events using sendBeacon (for page unload)
   */
  sendBeacon(events: WebAppEvent[]): boolean {
    if (events.length === 0) {
      return true
    }

    if (this.config.isDisabled()) {
      return true
    }

    if (typeof navigator === "undefined" || !navigator.sendBeacon) {
      return false
    }

    const url = this.config.getTrackUrl()
    const payload = this.buildPayload(events)

    const blob = new Blob([safeStringify(payload)], { type: "application/json" })
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
  private log(...args: unknown[]): void {
    if (this.config.isDebug()) {
      console.log("[Dashgram Transport]", ...args)
    }
  }

  /**
   * Log error message
   */
  private logError(...args: unknown[]): void {
    if (this.config.isDebug()) {
      console.error("[Dashgram Transport]", ...args)
    }
  }
}
