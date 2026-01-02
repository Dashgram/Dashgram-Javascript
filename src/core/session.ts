import { generateUUID } from '../utils/helpers';

const SESSION_KEY = 'dashgram_session_id';
const SESSION_TIMEOUT = 30 * 60 * 1000; // 30 minutes
const LAST_ACTIVITY_KEY = 'dashgram_last_activity';

/**
 * Session manager
 */
export class Session {
  private sessionId: string;
  private lastActivity: number;

  constructor() {
    this.sessionId = this.loadOrCreateSession();
    this.lastActivity = Date.now();
    this.updateLastActivity();
  }

  /**
   * Load existing session or create new one
   */
  private loadOrCreateSession(): string {
    if (typeof window === 'undefined' || typeof localStorage === 'undefined') {
      return generateUUID();
    }

    try {
      const storedSessionId = localStorage.getItem(SESSION_KEY);
      const storedLastActivity = localStorage.getItem(LAST_ACTIVITY_KEY);

      if (storedSessionId && storedLastActivity) {
        const lastActivity = parseInt(storedLastActivity, 10);
        const now = Date.now();

        // Check if session is still valid
        if (now - lastActivity < SESSION_TIMEOUT) {
          return storedSessionId;
        }
      }
    } catch (error) {
      // localStorage might not be available
    }

    // Create new session
    return this.createNewSession();
  }

  /**
   * Create new session
   */
  private createNewSession(): string {
    const newSessionId = generateUUID();

    try {
      localStorage.setItem(SESSION_KEY, newSessionId);
      localStorage.setItem(LAST_ACTIVITY_KEY, Date.now().toString());
    } catch (error) {
      // Ignore localStorage errors
    }

    return newSessionId;
  }

  /**
   * Update last activity timestamp
   */
  updateLastActivity(): void {
    this.lastActivity = Date.now();

    try {
      localStorage.setItem(LAST_ACTIVITY_KEY, this.lastActivity.toString());
    } catch (error) {
      // Ignore localStorage errors
    }
  }

  /**
   * Get current session ID
   */
  getSessionId(): string {
    return this.sessionId;
  }

  /**
   * Reset session (create new session)
   */
  reset(): void {
    this.sessionId = this.createNewSession();
    this.lastActivity = Date.now();
  }

  /**
   * Check if session has expired
   */
  isExpired(): boolean {
    return Date.now() - this.lastActivity > SESSION_TIMEOUT;
  }

  /**
   * Renew session if expired
   */
  renewIfExpired(): void {
    if (this.isExpired()) {
      this.reset();
    }
  }
}





