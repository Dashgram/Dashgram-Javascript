/**
 * Generate a UUID v4
 */
export function generateUUID(): string {
  if (typeof crypto !== "undefined" && crypto.randomUUID) {
    return crypto.randomUUID()
  }

  // Fallback for older browsers
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, c => {
    const r = (Math.random() * 16) | 0
    const v = c === "x" ? r : (r & 0x3) | 0x8
    return v.toString(16)
  })
}

/**
 * Get current ISO 8601 timestamp
 */
export function getTimestamp(): string {
  return new Date().toISOString()
}

/**
 * Throttle function execution
 */
export function throttle<T extends (...args: any[]) => any>(func: T, wait: number): (...args: Parameters<T>) => void {
  let timeout: ReturnType<typeof setTimeout> | null = null
  let previous = 0

  return function (this: any, ...args: Parameters<T>) {
    const now = Date.now()
    const remaining = wait - (now - previous)

    if (remaining <= 0 || remaining > wait) {
      if (timeout) {
        clearTimeout(timeout)
        timeout = null
      }
      previous = now
      func.apply(this, args)
    } else if (!timeout) {
      timeout = setTimeout(() => {
        previous = Date.now()
        timeout = null
        func.apply(this, args)
      }, remaining)
    }
  }
}

/**
 * Debounce function execution
 */
export function debounce<T extends (...args: any[]) => any>(func: T, wait: number): (...args: Parameters<T>) => void {
  let timeout: ReturnType<typeof setTimeout> | null = null

  return function (this: any, ...args: Parameters<T>) {
    if (timeout) {
      clearTimeout(timeout)
    }
    timeout = setTimeout(() => {
      func.apply(this, args)
    }, wait)
  }
}

/**
 * Safe JSON stringify
 */
export function safeStringify(obj: any): string {
  try {
    return JSON.stringify(obj)
  } catch (error) {
    return "{}"
  }
}

/**
 * Check if code is running in browser
 */
export function isBrowser(): boolean {
  return typeof window !== "undefined" && typeof document !== "undefined"
}

/**
 * Get element selector path
 */
export function getElementSelector(element: Element): string {
  if (element.id) {
    return `#${element.id}`
  }

  if (element.className && typeof element.className === "string") {
    const classes = element.className.trim().split(/\s+/).slice(0, 2).join(".")
    if (classes) {
      return `${element.tagName.toLowerCase()}.${classes}`
    }
  }

  return element.tagName.toLowerCase()
}

/**
 * Get element text content (truncated)
 */
export function getElementText(element: Element, maxLength = 50): string {
  const text = element.textContent?.trim() || ""
  return text.length > maxLength ? text.substring(0, maxLength) + "..." : text
}

/**
 * Convert camelCase string to snake_case
 */
function toSnakeCase(str: string): string {
  return str.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`).replace(/^_/, "") // Remove leading underscore if string started with capital
}

/**
 * Recursively convert object keys from camelCase to snake_case
 */
export function convertToSnakeCase(obj: unknown): unknown {
  if (obj === null || obj === undefined) {
    return obj
  }

  if (Array.isArray(obj)) {
    return obj.map(convertToSnakeCase)
  }

  if (typeof obj === "object" && obj.constructor === Object) {
    const result: Record<string, unknown> = {}
    for (const [key, value] of Object.entries(obj)) {
      const snakeKey = toSnakeCase(key)
      result[snakeKey] = convertToSnakeCase(value)
    }
    return result
  }

  return obj
}
