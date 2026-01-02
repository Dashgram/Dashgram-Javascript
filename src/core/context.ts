import type { EventContext } from '../types';
import { getDeviceContext } from '../utils/device';
import { getTelegramUserId } from '../utils/telegram';

/**
 * Context manager - maintains event context
 */
export class Context {
  private context: EventContext;
  private userId: string | null;

  constructor() {
    this.context = getDeviceContext();
    this.userId = getTelegramUserId();
  }

  /**
   * Get current context
   */
  getContext(): EventContext {
    return { ...this.context };
  }

  /**
   * Update context (e.g., after viewport resize)
   */
  updateContext(): void {
    this.context = getDeviceContext();
  }

  /**
   * Get user ID
   */
  getUserId(): string | null {
    return this.userId;
  }

  /**
   * Set user ID (for identify())
   */
  setUserId(userId: string): void {
    this.userId = userId;
  }

  /**
   * Clear user ID
   */
  clearUserId(): void {
    this.userId = null;
  }
}





