import type { DashgramConfig, DashgramEvent, EventProperties, UserTraits, TrackLevel } from "./types"
import { Config } from "./core/config"
import { Context } from "./core/context"
import { Session } from "./core/session"
import { Transport } from "./transport/transport"
import { BatchProcessor } from "./transport/batch-processor"
import { CoreTracker } from "./trackers/core-tracker"
import { InteractionTracker } from "./trackers/interaction-tracker"
import { DeepTracker } from "./trackers/deep-tracker"
import { getTimestamp, isBrowser } from "./utils/helpers"
import { getTelegramUserId } from "./utils/telegram"

/**
 * Main Dashgram SDK class
 */
class DashgramSDK {
  private config: Config | null = null
  private context: Context | null = null
  private session: Session | null = null
  private transport: Transport | null = null
  private batchProcessor: BatchProcessor | null = null
  private trackers: Array<CoreTracker | InteractionTracker | DeepTracker> = []
  private isInitialized = false

  /**
   * Initialize Dashgram SDK
   */
  init(userConfig: DashgramConfig): void {
    if (this.isInitialized) {
      console.warn("Dashgram: Already initialized")
      return
    }

    if (!isBrowser()) {
      console.warn("Dashgram: Not running in browser environment")
      return
    }

    try {
      // Initialize core components
      this.config = new Config(userConfig)
      this.context = new Context()
      this.session = new Session()
      this.transport = new Transport(this.config)
      this.batchProcessor = new BatchProcessor(this.config, this.transport)

      // Setup trackers
      this.setupTrackers()

      // Start batch processor
      this.batchProcessor.start()

      this.isInitialized = true

      this.log("Initialized successfully", {
        projectId: this.config.get("projectId"),
        trackLevel: this.config.getTrackLevel()
      })
    } catch (error) {
      console.error("Dashgram: Initialization failed", error)
      throw error
    }
  }

  /**
   * Setup trackers based on track level
   */
  private setupTrackers(): void {
    if (!this.config) return

    const trackCallback = (event: string, properties: EventProperties) => {
      this.trackAuto(event, properties)
    }

    // Core tracker (Level 1)
    const coreTracker = new CoreTracker(this.config, trackCallback)
    this.trackers.push(coreTracker)
    coreTracker.start()

    // Interaction tracker (Level 2)
    const interactionTracker = new InteractionTracker(this.config, trackCallback)
    this.trackers.push(interactionTracker)
    interactionTracker.start()

    // Deep tracker (Level 3)
    const deepTracker = new DeepTracker(this.config, trackCallback)
    this.trackers.push(deepTracker)
    deepTracker.start()
  }

  /**
   * Track custom event (manual)
   */
  track(event: string, properties: EventProperties = {}): void {
    this.ensureInitialized()

    const fullEvent = this.buildEvent(event, properties, "manual")
    this.batchProcessor!.addEvent(fullEvent)

    this.log("Tracked event", { event, properties })
  }

  /**
   * Track auto event (internal use by trackers)
   */
  private trackAuto(event: string, properties: EventProperties = {}): void {
    if (!this.isInitialized) return

    const fullEvent = this.buildEvent(event, properties, "auto")
    this.batchProcessor!.addEvent(fullEvent)

    this.log("Auto-tracked event", { event, properties })
  }

  /**
   * Build full event object
   */
  private buildEvent(event: string, properties: EventProperties, source: "auto" | "manual"): DashgramEvent {
    this.ensureInitialized()

    // Renew session if expired
    this.session!.renewIfExpired()
    this.session!.updateLastActivity()

    return {
      event,
      properties,
      timestamp: getTimestamp(),
      source,
      level: this.config!.getTrackLevel(),
      session_id: this.session!.getSessionId(),
      user_id: this.context!.getUserId() || getTelegramUserId(),
      context: this.context!.getContext()
    }
  }

  /**
   * Identify user
   */
  identify(userId: string, traits: UserTraits = {}): void {
    this.ensureInitialized()

    this.context!.setUserId(userId)

    this.track("identify", {
      user_id: userId,
      ...traits
    })

    this.log("Identified user", { userId, traits })
  }

  /**
   * Set track level
   */
  setTrackLevel(level: TrackLevel): void {
    this.ensureInitialized()

    const oldLevel = this.config!.getTrackLevel()
    this.config!.setTrackLevel(level)

    // Restart trackers with new level
    this.trackers.forEach(tracker => {
      tracker.stop()
      tracker.start()
    })

    this.log("Track level changed", { from: oldLevel, to: level })
  }

  /**
   * Flush all pending events
   */
  async flush(): Promise<void> {
    this.ensureInitialized()

    await this.batchProcessor!.flushAsync()

    this.log("Flushed all events")
  }

  /**
   * Reset SDK (clear session, user)
   */
  reset(): void {
    this.ensureInitialized()

    this.session!.reset()
    this.context!.clearUserId()

    this.log("Reset session and user")
  }

  /**
   * Shutdown SDK
   */
  shutdown(): void {
    if (!this.isInitialized) {
      return
    }

    // Stop all trackers
    this.trackers.forEach(tracker => tracker.stop())
    this.trackers = []

    // Flush and stop batch processor
    this.batchProcessor!.flush()
    this.batchProcessor!.stop()

    this.isInitialized = false

    this.log("Shutdown complete")
  }

  /**
   * Ensure SDK is initialized
   */
  private ensureInitialized(): void {
    if (!this.isInitialized) {
      throw new Error("Dashgram: SDK not initialized. Call init() first.")
    }
  }

  /**
   * Log debug message
   */
  private log(...args: any[]): void {
    if (this.config?.isDebug()) {
      console.log("[Dashgram SDK]", ...args)
    }
  }
}

// Create singleton instance
const DashgramMini = new DashgramSDK()

// Export types
export type { DashgramConfig, DashgramEvent, EventProperties, UserTraits, TrackLevel }

// Export error classes
export {
  DashgramError,
  InvalidCredentialsError,
  DashgramAPIError,
  NetworkError,
  DashgramConfigurationError
} from "./errors"

// Export singleton
export { DashgramMini }

// Default export
export default DashgramMini
