import type { DashgramEvent } from '../types';
import type { Config } from '../core/config';
import { EventQueue } from '../core/event-queue';
import { Transport } from './transport';

/**
 * Batch processor - batches events and sends them periodically
 */
export class BatchProcessor {
  private config: Config;
  private queue: EventQueue;
  private transport: Transport;
  private flushTimer: ReturnType<typeof setTimeout> | null = null;
  private isStarted: boolean = false;

  constructor(config: Config, transport: Transport) {
    this.config = config;
    this.transport = transport;
    this.queue = new EventQueue(200);
  }

  /**
   * Start batch processor
   */
  start(): void {
    if (this.isStarted) {
      return;
    }

    this.isStarted = true;
    this.scheduleFlush();
    this.setupPageUnloadHandler();
  }

  /**
   * Stop batch processor
   */
  stop(): void {
    this.isStarted = false;

    if (this.flushTimer) {
      clearTimeout(this.flushTimer);
      this.flushTimer = null;
    }
  }

  /**
   * Add event to batch
   */
  addEvent(event: DashgramEvent): void {
    this.queue.enqueue(event);

    // Auto-flush if batch size reached
    const batchSize = this.config.get('batchSize');
    if (this.queue.size() >= batchSize) {
      this.flush();
    }
  }

  /**
   * Schedule periodic flush
   */
  private scheduleFlush(): void {
    if (this.flushTimer) {
      clearTimeout(this.flushTimer);
    }

    const interval = this.config.get('flushInterval');
    this.flushTimer = setTimeout(() => {
      this.flush();

      if (this.isStarted) {
        this.scheduleFlush();
      }
    }, interval);
  }

  /**
   * Flush all events
   */
  flush(): void {
    const events = this.queue.flush();

    if (events.length > 0) {
      this.transport.send(events);
    }
  }

  /**
   * Flush all events and wait for completion
   */
  async flushAsync(): Promise<void> {
    const events = this.queue.flush();

    if (events.length > 0) {
      await this.transport.send(events);
    }

    await this.transport.flush();
  }

  /**
   * Setup page unload handler
   */
  private setupPageUnloadHandler(): void {
    if (typeof window === 'undefined') {
      return;
    }

    // Use visibilitychange and pagehide for better mobile support
    const handleUnload = () => {
      const events = this.queue.flush();
      if (events.length > 0) {
        this.transport.sendBeacon(events);
      }
    };

    window.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'hidden') {
        handleUnload();
      }
    });

    window.addEventListener('pagehide', handleUnload);

    // Fallback for older browsers
    window.addEventListener('beforeunload', handleUnload);
  }
}





