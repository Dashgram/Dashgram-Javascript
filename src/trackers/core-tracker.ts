import { BaseTracker } from "./base-tracker"
import type { Config } from "../core/config"
import type { TrackCallback } from "./base-tracker"

/**
 * Core tracker (Level 1)
 * Tracks: app_open, app_close
 */
export class CoreTracker extends BaseTracker {
  private unsubscribers: (() => void)[] = []
  private hasTrackedAppOpen = false

  constructor(config: Config, trackCallback: TrackCallback) {
    super(config, trackCallback, 1)
  }

  protected setup(): void {
    if (typeof window === "undefined") {
      return
    }

    // Track app_open on first load
    this.trackAppOpen()

    // Track app_close on visibility change and page unload
    this.setupVisibilityTracking()
    this.setupUnloadTracking()
  }

  protected teardown(): void {
    this.unsubscribers.forEach(unsubscribe => unsubscribe())
    this.unsubscribers = []
  }

  /**
   * Track app_open event
   */
  private trackAppOpen(): void {
    if (this.hasTrackedAppOpen) {
      return
    }

    this.track("app_open", {
      referrer: document.referrer || "direct"
    })

    this.hasTrackedAppOpen = true
  }

  /**
   * Setup visibility tracking
   */
  private setupVisibilityTracking(): void {
    const handleVisibilityChange = () => {
      if (document.visibilityState === "hidden") {
        this.track("app_close", {
          visibility_state: "hidden"
        })
      } else if (document.visibilityState === "visible") {
        this.track("app_open", {
          visibility_state: "visible"
        })
      }
    }

    document.addEventListener("visibilitychange", handleVisibilityChange)

    this.unsubscribers.push(() => {
      document.removeEventListener("visibilitychange", handleVisibilityChange)
    })
  }

  /**
   * Setup page unload tracking
   */
  private setupUnloadTracking(): void {
    const handleUnload = () => {
      this.track("app_close", {
        reason: "unload"
      })
    }

    window.addEventListener("pagehide", handleUnload)

    this.unsubscribers.push(() => {
      window.removeEventListener("pagehide", handleUnload)
    })

    window.addEventListener("beforeunload", handleUnload)

    this.unsubscribers.push(() => {
      window.removeEventListener("beforeunload", handleUnload)
    })
  }
}
