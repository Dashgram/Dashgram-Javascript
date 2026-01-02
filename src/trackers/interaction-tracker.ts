import { BaseTracker } from './base-tracker';
import type { Config } from '../core/config';
import type { TrackCallback } from './base-tracker';
import { throttle } from '../utils/helpers';
import { getElementSelector, getElementText } from '../utils/helpers';
import { getCurrentPath, getPageTitle, getCurrentUrl } from '../utils/device';

/**
 * Interaction tracker (Level 2)
 * Tracks: screen_view, button_click, link_click, form_submit, input_focus, errors
 */
export class InteractionTracker extends BaseTracker {
  private unsubscribers: (() => void)[] = [];
  private lastPath: string = '';

  constructor(config: Config, trackCallback: TrackCallback) {
    super(config, trackCallback, 2);
  }

  protected setup(): void {
    if (typeof window === 'undefined') {
      return;
    }

    // Track initial screen view
    this.trackScreenView();

    // Setup tracking
    this.setupHistoryTracking();
    this.setupClickTracking();
    this.setupFormTracking();
    this.setupInputTracking();
    this.setupErrorTracking();
  }

  protected teardown(): void {
    this.unsubscribers.forEach((unsubscribe) => unsubscribe());
    this.unsubscribers = [];
  }

  /**
   * Track screen view
   */
  private trackScreenView(): void {
    const path = getCurrentPath();

    if (path === this.lastPath) {
      return;
    }

    this.lastPath = path;

    this.track('screen_view', {
      path,
      url: getCurrentUrl(),
      title: getPageTitle(),
      referrer: document.referrer || 'direct',
    });
  }

  /**
   * Setup history tracking (for SPAs)
   */
  private setupHistoryTracking(): void {
    // Patch pushState and replaceState
    const originalPushState = history.pushState;
    const originalReplaceState = history.replaceState;

    const trackOnHistoryChange = () => {
      this.trackScreenView();
    };

    history.pushState = function (...args) {
      originalPushState.apply(history, args);
      trackOnHistoryChange();
    };

    history.replaceState = function (...args) {
      originalReplaceState.apply(history, args);
      trackOnHistoryChange();
    };

    // Listen to popstate (back/forward buttons)
    window.addEventListener('popstate', trackOnHistoryChange);

    this.unsubscribers.push(() => {
      history.pushState = originalPushState;
      history.replaceState = originalReplaceState;
      window.removeEventListener('popstate', trackOnHistoryChange);
    });
  }

  /**
   * Setup click tracking
   */
  private setupClickTracking(): void {
    const handleClick = (event: MouseEvent) => {
      const target = event.target as Element;
      if (!target) return;

      // Find closest interactive element
      const button = target.closest('button, [role="button"], a');

      if (button) {
        const tagName = button.tagName.toLowerCase();
        const isLink = tagName === 'a';

        this.track(isLink ? 'link_click' : 'button_click', {
          element: getElementSelector(button),
          text: getElementText(button),
          href: isLink ? (button as HTMLAnchorElement).href : undefined,
          target: isLink ? (button as HTMLAnchorElement).target : undefined,
        });
      }
    };

    document.addEventListener('click', handleClick, { capture: true });

    this.unsubscribers.push(() => {
      document.removeEventListener('click', handleClick, { capture: true });
    });
  }

  /**
   * Setup form tracking
   */
  private setupFormTracking(): void {
    const handleSubmit = (event: SubmitEvent) => {
      const form = event.target as HTMLFormElement;
      if (!form) return;

      this.track('form_submit', {
        form_id: form.id || undefined,
        form_name: form.name || undefined,
        form_action: form.action || undefined,
        form_method: form.method || undefined,
      });
    };

    document.addEventListener('submit', handleSubmit, { capture: true });

    this.unsubscribers.push(() => {
      document.removeEventListener('submit', handleSubmit, { capture: true });
    });
  }

  /**
   * Setup input tracking
   */
  private setupInputTracking(): void {
    const handleFocus = throttle((event: FocusEvent) => {
      const target = event.target as HTMLElement;
      if (!target) return;

      const tagName = target.tagName.toLowerCase();
      if (['input', 'textarea', 'select'].includes(tagName)) {
        const input = target as HTMLInputElement;

        this.track('input_focus', {
          element: getElementSelector(input),
          input_type: input.type || tagName,
          input_name: input.name || undefined,
          input_id: input.id || undefined,
        });
      }
    }, 1000);

    document.addEventListener('focus', handleFocus, { capture: true });

    this.unsubscribers.push(() => {
      document.removeEventListener('focus', handleFocus, { capture: true });
    });
  }

  /**
   * Setup error tracking
   */
  private setupErrorTracking(): void {
    // Track JavaScript errors
    const handleError = (event: ErrorEvent) => {
      this.track('js_error', {
        message: event.message,
        filename: event.filename,
        lineno: event.lineno,
        colno: event.colno,
        stack: event.error?.stack,
      });
    };

    window.addEventListener('error', handleError);

    this.unsubscribers.push(() => {
      window.removeEventListener('error', handleError);
    });

    // Track unhandled promise rejections
    const handleRejection = (event: PromiseRejectionEvent) => {
      this.track('unhandled_rejection', {
        reason: String(event.reason),
        promise: String(event.promise),
      });
    };

    window.addEventListener('unhandledrejection', handleRejection);

    this.unsubscribers.push(() => {
      window.removeEventListener('unhandledrejection', handleRejection);
    });
  }
}





