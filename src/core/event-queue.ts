import type { DashgramEvent } from '../types';

/**
 * Event queue manager
 */
export class EventQueue {
  private queue: DashgramEvent[] = [];
  private maxSize: number;

  constructor(maxSize: number = 100) {
    this.maxSize = maxSize;
  }

  /**
   * Add event to queue
   */
  enqueue(event: DashgramEvent): void {
    this.queue.push(event);

    // Prevent queue from growing too large
    if (this.queue.length > this.maxSize) {
      this.queue.shift();
    }
  }

  /**
   * Get all events and clear queue
   */
  flush(): DashgramEvent[] {
    const events = [...this.queue];
    this.queue = [];
    return events;
  }

  /**
   * Get events without clearing queue
   */
  peek(): DashgramEvent[] {
    return [...this.queue];
  }

  /**
   * Get queue size
   */
  size(): number {
    return this.queue.length;
  }

  /**
   * Check if queue is empty
   */
  isEmpty(): boolean {
    return this.queue.length === 0;
  }

  /**
   * Clear queue
   */
  clear(): void {
    this.queue = [];
  }
}





