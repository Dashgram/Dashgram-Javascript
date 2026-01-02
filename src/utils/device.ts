import type { EventContext } from '../types';
import {
  getTelegramPlatform,
  getTelegramVersion,
  getTelegramLanguage,
  getTelegramTheme,
} from './telegram';

/**
 * Get device and browser context
 */
export function getDeviceContext(): EventContext {
  if (typeof window === 'undefined') {
    return {
      platform: 'unknown',
      app_version: 'unknown',
      language: 'unknown',
      screen_width: 0,
      screen_height: 0,
      viewport_width: 0,
      viewport_height: 0,
      user_agent: '',
      timezone: 'UTC',
    };
  }

  const telegramLang = getTelegramLanguage();
  const browserLang = navigator.language || 'en';

  return {
    platform: getTelegramPlatform(),
    app_version: getTelegramVersion(),
    language: telegramLang || browserLang,
    screen_width: window.screen.width,
    screen_height: window.screen.height,
    viewport_width: window.innerWidth,
    viewport_height: window.innerHeight,
    user_agent: navigator.userAgent,
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC',
    telegram_version: getTelegramVersion(),
    theme: getTelegramTheme(),
  };
}

/**
 * Get viewport size
 */
export function getViewportSize(): { width: number; height: number } {
  if (typeof window === 'undefined') {
    return { width: 0, height: 0 };
  }

  return {
    width: window.innerWidth,
    height: window.innerHeight,
  };
}

/**
 * Get scroll depth percentage
 */
export function getScrollDepth(): number {
  if (typeof window === 'undefined' || typeof document === 'undefined') {
    return 0;
  }

  const windowHeight = window.innerHeight;
  const documentHeight = document.documentElement.scrollHeight;
  const scrollTop = window.pageYOffset || document.documentElement.scrollTop;

  if (documentHeight <= windowHeight) {
    return 100;
  }

  const maxScroll = documentHeight - windowHeight;
  const scrollPercentage = (scrollTop / maxScroll) * 100;

  return Math.min(Math.round(scrollPercentage), 100);
}

/**
 * Get current URL
 */
export function getCurrentUrl(): string {
  if (typeof window === 'undefined') {
    return '';
  }

  return window.location.href;
}

/**
 * Get current page path
 */
export function getCurrentPath(): string {
  if (typeof window === 'undefined') {
    return '';
  }

  return window.location.pathname;
}

/**
 * Get page title
 */
export function getPageTitle(): string {
  if (typeof document === 'undefined') {
    return '';
  }

  return document.title || '';
}





