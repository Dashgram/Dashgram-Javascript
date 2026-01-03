import type { Telemetry } from "../types"
import { getTelemetry } from "../utils/device"

/**
 * Context manager - maintains telemetry data
 */
export class Context {
  private telemetry: Telemetry

  constructor() {
    this.telemetry = getTelemetry()
  }

  /**
   * Get current telemetry
   */
  getTelemetry(): Telemetry {
    return { ...this.telemetry }
  }

  /**
   * Update telemetry (e.g., after theme change)
   */
  updateTelemetry(): void {
    this.telemetry = getTelemetry()
  }
}
