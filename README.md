# Dashgram JavaScript SDK

Analytics SDK for Telegram Mini Apps.

## Installation

```bash
npm install @dashgram/javascript
```

## Quick Start

```typescript
import DashgramMini from "@dashgram/javascript"

// Initialize SDK
DashgramMini.init({
  projectId: "your-project-id",
  apiKey: "your-api-key",
  trackLevel: 2, // 1, 2, or 3
  debug: true // for development
})

// Track custom events
DashgramMini.track("button_clicked", {
  button_name: "subscribe",
  screen: "home"
})

// Identify user
DashgramMini.identify("user-123", {
  plan: "premium",
  email: "user@example.com"
})
```

## Track Levels

### Level 1 — Core (minimal, default)

Automatically tracks:

- `app_open` — App opened
- `app_close` — App closed
- `session_start` — Session started
- `session_end` — Session ended
- Device/platform information
- Telegram user ID (if available)

### Level 2 — Interaction

Includes Level 1 + automatically tracks:

- `screen_view` — Screen views (URL/history changes)
- `button_click` — Button clicks
- `link_click` — Link clicks
- `form_submit` — Form submissions
- `input_focus` — Input field focus
- `js_error` — JavaScript errors
- `unhandled_rejection` — Unhandled Promise rejections

### Level 3 — Deep / Product

Includes Level 1 + 2 + automatically tracks:

- `scroll_depth` — Scroll depth (25%, 50%, 75%, 100%)
- `element_visible` — Element visibility (IntersectionObserver)
- `rage_click` — Rage clicks (5+ clicks in 2 seconds)
- `long_task` — Long tasks (Performance API, >50ms)
- `web_vital_lcp` — Largest Contentful Paint
- `web_vital_fid` — First Input Delay
- `web_vital_cls` — Cumulative Layout Shift
- Telegram WebApp events:
  - `telegram_theme_changed`
  - `telegram_viewport_changed`
  - `telegram_back_button_clicked`
  - `telegram_main_button_clicked`

## API

### `DashgramMini.init(config)`

Initializes the SDK.

```typescript
interface DashgramConfig {
  projectId: string // Project ID from Dashgram dashboard
  apiKey: string // API key for authentication
  trackLevel?: 1 | 2 | 3 // Track level (default: 1)
  apiUrl?: string // API endpoint URL (optional)
  batchSize?: number // Batch size (default: 10)
  flushInterval?: number // Flush interval in ms (default: 5000)
  debug?: boolean // Debug mode (default: false)
  disabled?: boolean // Disable tracking (default: false)
  onError?: (error: DashgramError) => void // Optional error handler
}
```

### `DashgramMini.track(event, properties?)`

Tracks a custom event.

```typescript
DashgramMini.track("purchase_completed", {
  product_id: "123",
  amount: 99.99,
  currency: "USD"
})
```

### `DashgramMini.identify(userId, traits?)`

Identifies a user.

```typescript
DashgramMini.identify("user-123", {
  email: "user@example.com",
  plan: "premium",
  signup_date: "2024-01-01"
})
```

### `DashgramMini.setTrackLevel(level)`

Changes the track level.

```typescript
DashgramMini.setTrackLevel(3) // Enable all auto-events
```

### `DashgramMini.flush()`

Forces sending all pending events to the server.

```typescript
await DashgramMini.flush()
```

### `DashgramMini.reset()`

Resets the session and user information.

```typescript
DashgramMini.reset()
```

### `DashgramMini.shutdown()`

Stops the SDK and sends all remaining events.

```typescript
DashgramMini.shutdown()
```

## Element Visibility Tracking

For Level 3, you can mark elements for visibility tracking:

```html
<div data-track-visible="hero-banner">
  <!-- Content -->
</div>
```

When the element becomes visible (>50% of area), an `element_visible` event will be sent.

## Event Format

Every event is sent in the following format:

```typescript
{
  "event": "event_name",
  "properties": { /* custom properties */ },
  "timestamp": "2024-01-01T12:00:00.000Z",
  "source": "auto" | "manual",
  "level": 1 | 2 | 3,
  "session_id": "uuid",
  "user_id": "telegram_user_id | null",
  "context": {
    "platform": "...",
    "app_version": "...",
    "language": "...",
    "screen_width": 1920,
    "screen_height": 1080,
    "viewport_width": 1200,
    "viewport_height": 800,
    "user_agent": "...",
    "timezone": "Europe/Moscow",
    "telegram_version": "...",
    "theme": "dark"
  }
}
```

## TypeScript

The SDK is written in TypeScript and includes all types:

```typescript
import DashgramMini, {
  DashgramConfig,
  EventProperties,
  UserTraits,
  DashgramError,
  InvalidCredentialsError,
  DashgramAPIError,
  NetworkError,
  DashgramConfigurationError
} from "@dashgram/javascript"
```

## Error Handling

The SDK provides typed error classes for better error handling:

```typescript
import {
  DashgramError,
  InvalidCredentialsError,
  DashgramAPIError,
  NetworkError,
  DashgramConfigurationError
} from "@dashgram/javascript"

// Optional error handler callback
DashgramMini.init({
  projectId: "xxx",
  apiKey: "yyy",
  onError: error => {
    if (error instanceof InvalidCredentialsError) {
      console.error("Invalid credentials!")
    } else if (error instanceof NetworkError) {
      console.error("Network issue:", error.originalError)
    } else if (error instanceof DashgramConfigurationError) {
      console.error("Configuration error:", error.message)
    }
  }
})
```

## Features

- ✅ Tree-shakeable
- ✅ No heavy dependencies
- ✅ Batching and automatic sending
- ✅ sendBeacon support for reliable page unload tracking
- ✅ Automatic session management (30-minute timeout)
- ✅ Graceful degradation (works even without Telegram WebApp)
- ✅ Throttling and debouncing for performance optimization
- ✅ Offline mode support
- ✅ Typed error classes
- ✅ Optional error handler callback

## License

MIT
