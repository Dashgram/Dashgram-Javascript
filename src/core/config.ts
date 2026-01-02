import type { DashgramConfig, TrackLevel } from "../types"
import { DashgramConfigurationError } from "../errors"

/**
 * Default configuration
 */
const DEFAULT_CONFIG: Required<Omit<DashgramConfig, "projectId" | "apiKey" | "onError">> = {
  trackLevel: 1,
  apiUrl: "https://api.dashgram.com/v1/events",
  batchSize: 10,
  flushInterval: 5000, // 5 seconds
  debug: false,
  disabled: false
}

/**
 * Configuration manager
 */
export class Config {
  private config: Required<Omit<DashgramConfig, "onError">> & Pick<DashgramConfig, "onError">

  constructor(userConfig: DashgramConfig) {
    this.config = {
      ...DEFAULT_CONFIG,
      ...userConfig
    } as Required<Omit<DashgramConfig, "onError">> & Pick<DashgramConfig, "onError">

    this.validate()
  }

  /**
   * Validate configuration
   */
  private validate(): void {
    if (!this.config.projectId) {
      throw new DashgramConfigurationError("projectId is required")
    }

    if (!this.config.apiKey) {
      throw new DashgramConfigurationError("apiKey is required")
    }

    if (![1, 2, 3].includes(this.config.trackLevel)) {
      throw new DashgramConfigurationError("trackLevel must be 1, 2, or 3")
    }
  }

  /**
   * Get configuration value
   */
  get<K extends keyof Required<Omit<DashgramConfig, "onError">>>(key: K): Required<Omit<DashgramConfig, "onError">>[K] {
    return this.config[key]
  }

  /**
   * Get error handler callback
   */
  getOnError(): DashgramConfig["onError"] {
    return this.config.onError
  }

  /**
   * Set track level
   */
  setTrackLevel(level: TrackLevel): void {
    if (![1, 2, 3].includes(level)) {
      throw new DashgramConfigurationError("trackLevel must be 1, 2, or 3")
    }
    this.config.trackLevel = level
  }

  /**
   * Get track level
   */
  getTrackLevel(): TrackLevel {
    return this.config.trackLevel
  }

  /**
   * Check if debug mode is enabled
   */
  isDebug(): boolean {
    return this.config.debug
  }

  /**
   * Check if tracking is disabled
   */
  isDisabled(): boolean {
    return this.config.disabled
  }
}
