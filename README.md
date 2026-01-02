# Dashgram JavaScript SDK

Client-side analytics SDK for **Telegram Mini Apps**.

## What is this?

Dashgram JavaScript SDK is a lightweight analytics library designed specifically for [Telegram Mini Apps](https://core.telegram.org/bots/webapps). It automatically captures user interactions, Telegram WebApp events, and allows you to track custom events—all with minimal setup.

### Important

- ✅ **This SDK is for Telegram Mini Apps** (web apps embedded in Telegram)
- ❌ **This SDK is NOT for Telegram bots** — if you're building a bot, use the [Python SDK](https://github.com/dashgram/dashgram-python) or [Go SDK](https://github.com/dashgram/go-dashgram) instead
- ⚠️ **Backend ingestion is not yet publicly available** — see [Current Limitations](#current-limitations)

---

## Installation

```bash
# npm
npm install @dashgram/javascript

# pnpm
pnpm add @dashgram/javascript

# yarn
yarn add @dashgram/javascript
```

---

## Quick Start

```typescript
import DashgramMini from "@dashgram/javascript"

// Initialize the SDK
DashgramMini.init({
  projectId: "your-project-id",
  apiKey: "your-api-key",
  trackLevel: 2, // 1 = minimal, 2 = interactions, 3 = deep analytics
  debug: true // Enable console logging (disable in production)
})

// Track a custom event
DashgramMini.track("purchase_completed", {
  item_id: "premium_subscription",
  price: 9.99,
  currency: "USD"
})

// Identify the user (optional, Telegram user ID is captured automatically)
DashgramMini.identify("user-123", {
  plan: "premium"
})
```

Once initialized, the SDK automatically captures events based on the configured `trackLevel`.

---

## Track Levels

The SDK supports three tracking levels. Higher levels include all events from lower levels.

### Level 1 — Core (Default)

Minimal tracking for basic analytics:

| Event           | Description               |
| --------------- | ------------------------- |
| `app_open`      | Mini App opened           |
| `app_close`     | Mini App closed or hidden |
| `session_start` | New session started       |
| `session_end`   | Session ended             |

Also captures: device info, platform, Telegram user ID (if available).

### Level 2 — Interaction

Adds user interaction tracking:

| Event                 | Description                  |
| --------------------- | ---------------------------- |
| `screen_view`         | Page/route navigation        |
| `button_click`        | Button clicks                |
| `link_click`          | Link clicks                  |
| `form_submit`         | Form submissions             |
| `input_focus`         | Input field focus            |
| `js_error`            | JavaScript errors            |
| `unhandled_rejection` | Unhandled Promise rejections |

### Level 3 — Deep Analytics

Adds performance metrics and **all Telegram WebApp events**:

**Performance:**

- `scroll_depth` — Scroll milestones (25%, 50%, 75%, 100%)
- `element_visible` — Element visibility tracking
- `rage_click` — Frustration detection (5+ clicks in 2 seconds)
- `long_task` — JavaScript tasks >50ms
- `web_vital_lcp`, `web_vital_fid`, `web_vital_cls` — Core Web Vitals

**Telegram WebApp Events:**

All events from the official [Telegram Web Events API](https://core.telegram.org/api/web-events) are captured automatically, including:

- UI: `themeChanged`, `viewportChanged`, `safeAreaChanged`, `fullscreenChanged`
- Buttons: `mainButtonClicked`, `backButtonClicked`, `settingsButtonClicked`, `secondaryButtonClicked`
- Payments: `invoiceClosed`
- Popups: `popupClosed`, `scanQrPopupClosed`
- Permissions: `writeAccessRequested`, `contactRequested`
- Sensors: `accelerometerChanged`, `gyroscopeChanged`, `deviceOrientationChanged`
- Biometrics: `biometricManagerUpdated`, `biometricAuthRequested`
- And 30+ more events

Event names and payloads follow the official Telegram specification.

---

## API Reference

### `DashgramMini.init(config)`

Initialize the SDK. Must be called before any other method.

```typescript
DashgramMini.init({
  projectId: string,       // Required: Your project ID
  apiKey: string,          // Required: Your API key
  trackLevel?: 1 | 2 | 3,  // Default: 1
  debug?: boolean,         // Default: false
  disabled?: boolean,      // Default: false (set true to disable tracking)
  batchSize?: number,      // Default: 10
  flushInterval?: number,  // Default: 5000 (ms)
  apiUrl?: string,         // Custom API endpoint (optional)
  onError?: (error) => void // Error handler callback (optional)
})
```

### `DashgramMini.track(event, properties?)`

Track a custom event.

```typescript
DashgramMini.track("button_clicked", {
  button_name: "subscribe",
  screen: "pricing"
})
```

### `DashgramMini.identify(userId, traits?)`

Associate events with a user identity.

```typescript
DashgramMini.identify("user-456", {
  email: "user@example.com",
  subscription: "pro"
})
```

### `DashgramMini.setTrackLevel(level)`

Change the tracking level at runtime.

```typescript
DashgramMini.setTrackLevel(3)
```

### `DashgramMini.flush()`

Force-send all queued events immediately.

```typescript
await DashgramMini.flush()
```

### `DashgramMini.reset()`

Clear the current session and user identity.

```typescript
DashgramMini.reset()
```

### `DashgramMini.shutdown()`

Stop tracking and flush remaining events.

```typescript
DashgramMini.shutdown()
```

---

## Element Visibility Tracking

At Level 3, you can track when specific elements become visible:

```html
<div data-track-visible="pricing-section">
  <!-- Your content -->
</div>
```

An `element_visible` event fires when the element is ≥50% visible in the viewport.

---

## TypeScript Support

The SDK is written in TypeScript and ships with full type definitions.

```typescript
import DashgramMini, {
  type DashgramConfig,
  type DashgramEvent,
  type EventProperties,
  type UserTraits,
  type TrackLevel,
  DashgramError,
  InvalidCredentialsError,
  DashgramAPIError,
  NetworkError,
  DashgramConfigurationError
} from "@dashgram/javascript"
```

---

## Error Handling

The SDK provides typed error classes:

```typescript
DashgramMini.init({
  projectId: "xxx",
  apiKey: "yyy",
  onError: error => {
    if (error instanceof InvalidCredentialsError) {
      console.error("Invalid credentials")
    } else if (error instanceof NetworkError) {
      console.error("Network error:", error.originalError)
    } else if (error instanceof DashgramConfigurationError) {
      console.error("Config error:", error.message)
    }
  }
})
```

---

## Event Payload Format

Every event sent by the SDK follows this structure:

```typescript
{
  event: string,              // Event name
  properties: object,         // Custom properties
  timestamp: string,          // ISO 8601 timestamp
  source: "auto" | "manual",  // How the event was triggered
  level: 1 | 2 | 3,           // Track level
  session_id: string,         // Session UUID
  user_id: string | null,     // Telegram user ID or custom ID
  context: {
    platform: string,         // e.g., "android", "ios", "web"
    app_version: string,
    language: string,
    screen_width: number,
    screen_height: number,
    viewport_width: number,
    viewport_height: number,
    user_agent: string,
    timezone: string,
    telegram_version: string,
    theme: string             // "light" or "dark"
  }
}
```

---

## Current Limitations

### Backend Ingestion

The backend event ingestion API is **not yet publicly available**. The SDK collects and sends events, but:

- There is no public dashboard yet
- Event processing and storage are under development
- The ingestion API shape may change

If you're evaluating Dashgram for production use, please contact the team for early access.

### What This SDK Does NOT Do

- ❌ Does not work server-side (Node.js)
- ❌ Does not work with Telegram bots (use Python/Go SDKs)
- ❌ Does not provide real-time analytics (yet)
- ❌ Does not handle user consent/GDPR (implement separately if required)

---

## Telegram Web Events Reference

This SDK implements event tracking according to the official Telegram specification:

📖 **[Telegram Web Events API](https://core.telegram.org/api/web-events)**

All event names and payload structures match the official documentation.

---

## Stability

The client-side API is **stable**. Method signatures and event formats will not change in breaking ways without a major version bump.

The backend integration is still in development. See [BACKEND_INTEGRATION.md](./BACKEND_INTEGRATION.md) for details.

---

## License

MIT
