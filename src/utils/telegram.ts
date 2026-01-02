import type { TelegramWebApp, TelegramWindow } from '../types';

/**
 * Get Telegram WebApp instance
 */
export function getTelegramWebApp(): TelegramWebApp | null {
  if (typeof window === 'undefined') {
    return null;
  }

  const win = window as TelegramWindow;
  return win.Telegram?.WebApp || null;
}

/**
 * Check if running inside Telegram Mini App
 */
export function isTelegramMiniApp(): boolean {
  return getTelegramWebApp() !== null;
}

/**
 * Get Telegram user ID
 */
export function getTelegramUserId(): string | null {
  const webApp = getTelegramWebApp();
  const userId = webApp?.initDataUnsafe?.user?.id;
  return userId ? String(userId) : null;
}

/**
 * Get Telegram platform
 */
export function getTelegramPlatform(): string {
  const webApp = getTelegramWebApp();
  return webApp?.platform || 'unknown';
}

/**
 * Get Telegram version
 */
export function getTelegramVersion(): string {
  const webApp = getTelegramWebApp();
  return webApp?.version || 'unknown';
}

/**
 * Get Telegram user language
 */
export function getTelegramLanguage(): string | null {
  const webApp = getTelegramWebApp();
  return webApp?.initDataUnsafe?.user?.language_code || null;
}

/**
 * Get Telegram theme
 */
export function getTelegramTheme(): string {
  const webApp = getTelegramWebApp();
  if (!webApp?.themeParams) {
    return 'unknown';
  }

  // Check if theme is dark based on background color
  const bgColor = webApp.themeParams.bg_color || '';
  if (bgColor) {
    // Simple heuristic: check if background is dark
    const rgb = parseInt(bgColor.slice(1), 16);
    const r = (rgb >> 16) & 0xff;
    const g = (rgb >> 8) & 0xff;
    const b = (rgb >> 0) & 0xff;
    const luma = 0.2126 * r + 0.7152 * g + 0.0722 * b;
    return luma < 128 ? 'dark' : 'light';
  }

  return 'unknown';
}

/**
 * Subscribe to Telegram WebApp events
 */
export function subscribeToTelegramEvent(
  event: string,
  callback: () => void
): () => void {
  const webApp = getTelegramWebApp();

  if (webApp && webApp.onEvent) {
    webApp.onEvent(event, callback);

    // Return unsubscribe function
    return () => {
      if (webApp.offEvent) {
        webApp.offEvent(event, callback);
      }
    };
  }

  // Return no-op unsubscribe
  return () => {};
}





