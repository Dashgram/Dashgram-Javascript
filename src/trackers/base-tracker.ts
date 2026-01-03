import type { TrackLevel, EventProperties } from "../types"
import type { Config } from "../core/config"

/**
 * Callback for tracking events
 */
export type TrackCallback = (event: string, properties: EventProperties) => void

/**
 * Base tracker class
 */
export abstract class BaseTracker {
  protected config: Config
  protected trackCallback: TrackCallback
  protected isActive: boolean = false
  protected level: TrackLevel

  constructor(config: Config, trackCallback: TrackCallback, level: TrackLevel) {
    this.config = config
    this.trackCallback = trackCallback
    this.level = level
  }

  /**
   * Start tracking
   */
  start(): void {
    if (this.isActive) {
      return
    }

    const currentLevel = this.config.getTrackLevel()

    // Only start if current track level meets required level
    if (currentLevel >= this.level) {
      this.isActive = true
      this.setup()
      this.log(`Started (level ${this.level})`)
    }
  }

  /**
   * Stop tracking
   */
  stop(): void {
    if (!this.isActive) {
      return
    }

    this.isActive = false
    this.teardown()
    this.log(`Stopped`)
  }

  /**
   * Track event
   */
  protected track(event: string, properties: EventProperties = {}): void {
    if (!this.isActive) {
      return
    }

    this.trackCallback(event, properties)
  }

  /**
   * Setup tracking (implement in subclass)
   */
  protected abstract setup(): void

  /**
   * Teardown tracking (implement in subclass)
   */
  protected abstract teardown(): void

  /**
   * Log debug message
   */
  protected log(...args: unknown[]): void {
    if (this.config.isDebug()) {
      console.log(`[Dashgram ${this.constructor.name}]`, ...args)
    }
  }
}
