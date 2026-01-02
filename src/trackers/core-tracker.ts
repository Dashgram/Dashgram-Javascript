import { BaseTracker } from './base-tracker';
import type { Config } from '../core/config';
import type { TrackCallback } from './base-tracker';

/**
 * Core tracker (Level 1)
 * Tracks: app_open, app_close, session_start, session_end
 */
export class CoreTracker extends BaseTracker {
  private unsubscribers: (() => void)[] = [];
  private hasTrackedAppOpen = false;

  constructor(config: Config, trackCallback: TrackCallback) {
    super(config, trackCallback, 1);
  }

  protected setup(): void {
    if (typeof window === 'undefined') {
      return;
    }

    // Track app_open on first load
    this.trackAppOpen();

    // Track session_start
    this.track('session_start', {});

    // Track app_close on visibility change and page unload
    this.setupVisibilityTracking();
    this.setupUnloadTracking();
  }

  protected teardown(): void {
    // Unsubscribe from all events
    this.unsubscribers.forEach((unsubscribe) => unsubscribe());
    this.unsubscribers = [];
  }

  /**
   * Track app_open event
   */
  private trackAppOpen(): void {
    if (this.hasTrackedAppOpen) {
      return;
    }

    this.track('app_open', {
      referrer: document.referrer || 'direct',
    });

    this.hasTrackedAppOpen = true;
  }

  /**
   * Setup visibility tracking
   */
  private setupVisibilityTracking(): void {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden') {
        this.track('app_close', {
          visibility_state: 'hidden',
        });
      } else if (document.visibilityState === 'visible') {
        this.track('app_open', {
          visibility_state: 'visible',
        });
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    this.unsubscribers.push(() => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    });
  }

  /**
   * Setup page unload tracking
   */
  private setupUnloadTracking(): void {
    const handleUnload = () => {
      this.track('app_close', {
        reason: 'unload',
      });

      this.track('session_end', {});
    };

    // pagehide is more reliable on mobile
    window.addEventListener('pagehide', handleUnload);

    this.unsubscribers.push(() => {
      window.removeEventListener('pagehide', handleUnload);
    });

    // Fallback for older browsers
    window.addEventListener('beforeunload', handleUnload);

    this.unsubscribers.push(() => {
      window.removeEventListener('beforeunload', handleUnload);
    });
  }
}





