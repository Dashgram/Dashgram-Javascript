import type { WebAppEvent } from "../types"

/**
 * Event queue manager
 */
export class EventQueue {
  private queue: WebAppEvent[] = []
  private maxSize: number

  constructor(maxSize: number = 100) {
    this.maxSize = maxSize
  }

  /**
   * Add event to queue
   */
  enqueue(event: WebAppEvent): void {
    this.queue.push(event)

    // Prevent queue from growing too large
    if (this.queue.length > this.maxSize) {
      this.queue.shift()
    }
  }

  /**
   * Get all events and clear queue
   */
  flush(): WebAppEvent[] {
    const events = [...this.queue]
    this.queue = []
    return events
  }

  /**
   * Get events without clearing queue
   */
  peek(): WebAppEvent[] {
    return [...this.queue]
  }

  /**
   * Get queue size
   */
  size(): number {
    return this.queue.length
  }

  /**
   * Check if queue is empty
   */
  isEmpty(): boolean {
    return this.queue.length === 0
  }

  /**
   * Clear queue
   */
  clear(): void {
    this.queue = []
  }
}
