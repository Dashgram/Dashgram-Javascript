/**
 * Extended ErrorConstructor interface for V8-specific methods
 */
interface ErrorConstructorWithCapture {
  captureStackTrace?(error: Error, constructor?: Function): void
}

/**
 * Base error class for all Dashgram SDK errors
 */
export class DashgramError extends Error {
  constructor(message: string) {
    super(message)
    this.name = "DashgramError"
    const ErrorWithCapture = Error as unknown as ErrorConstructorWithCapture
    if (typeof ErrorWithCapture.captureStackTrace === "function") {
      ErrorWithCapture.captureStackTrace(this, DashgramError)
    }
  }
}

/**
 * Error thrown when the Dashgram API returns an error response
 */
export class DashgramAPIError extends DashgramError {
  constructor(public statusCode: number, public details: string) {
    super(`Dashgram API error (${statusCode}): ${details}`)
    this.name = "DashgramAPIError"
    const ErrorWithCapture = Error as unknown as ErrorConstructorWithCapture
    if (typeof ErrorWithCapture.captureStackTrace === "function") {
      ErrorWithCapture.captureStackTrace(this, DashgramAPIError)
    }
  }
}

/**
 * Error thrown when a network request fails
 */
export class NetworkError extends DashgramError {
  constructor(public originalError: Error) {
    super(`Network error: ${originalError.message}`)
    this.name = "NetworkError"
    const ErrorWithCapture = Error as unknown as ErrorConstructorWithCapture
    if (typeof ErrorWithCapture.captureStackTrace === "function") {
      ErrorWithCapture.captureStackTrace(this, NetworkError)
    }
  }
}

/**
 * Error thrown when SDK is used incorrectly (e.g., not initialized)
 */
export class DashgramConfigurationError extends DashgramError {
  constructor(message: string) {
    super(message)
    this.name = "DashgramConfigurationError"
    const ErrorWithCapture = Error as unknown as ErrorConstructorWithCapture
    if (typeof ErrorWithCapture.captureStackTrace === "function") {
      ErrorWithCapture.captureStackTrace(this, DashgramConfigurationError)
    }
  }
}
