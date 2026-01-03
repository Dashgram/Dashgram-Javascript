# Dashgram JavaScript SDK

Analytics SDK for **Telegram Mini Apps**. Automatically captures user interactions and sends events to the Dashgram backend.

> ⚠️ **Important**: This SDK is designed exclusively for **Telegram Mini Apps** (WebApps).
> It is **NOT** for Telegram bots. For bot analytics, use the [Python SDK](../sdk-python) or [Go SDK](../go-dashgram).

## Installation

```bash
npm install @dashgram/javascript
# or
pnpm add @dashgram/javascript
# or
yarn add @dashgram/javascript
```

## Quick Start

```typescript
import DashgramMini from "@dashgram/javascript"

// Initialize SDK
DashgramMini.init({
  projectId: "your-project-id",
  trackLevel: 2, // 1 = core, 2 = interactions, 3 = deep analytics
  debug: true // Enable in development
})

// Track custom events
DashgramMini.track("purchase_completed", {
  product_id: "premium-plan",
  price: 9.99,
  currency: "USD"
})
```

## Configuration

```typescript
DashgramMini.init({
  projectId: "your-project-id", // Required
  trackLevel: 2, // Optional: 1, 2, or 3 (default: 1)
  debug: false, // Optional: enable console logs
  disabled: false, // Optional: disable tracking entirely
  batchSize: 10, // Optional: events per batch
  flushInterval: 5000 // Optional: flush interval in ms
})
```

## Track Levels

### Level 1 — Core (Default)

Minimal tracking:

| Event       | Description                       |
| ----------- | --------------------------------- |
| `app_open`  | Mini App opened or became visible |
| `app_close` | Mini App closed or hidden         |

### Level 2 — Interactions

Adds user interaction tracking:

| Event                 | Description                      |
| --------------------- | -------------------------------- |
| `screen_view`         | Page/route navigation            |
| `button_click`        | Button clicks                    |
| `link_click`          | Link clicks (external detection) |
| `form_submit`         | Form submissions                 |
| `input_focus`         | Input field focus                |
| `input_change`        | Input field value changed        |
| `copy`                | Text copied to clipboard         |
| `cut`                 | Text cut to clipboard            |
| `paste`               | Text pasted from clipboard       |
| `text_select`         | Text selection                   |
| `js_error`            | JavaScript errors                |
| `unhandled_rejection` | Unhandled Promise rejections     |

### Level 3 — Deep Analytics

Adds performance and Telegram-specific tracking:

| Event                            | Description                    |
| -------------------------------- | ------------------------------ |
| `scroll_depth`                   | Scroll milestone reached       |
| `element_visible`                | Tracked element became visible |
| `rage_click`                     | Rapid repeated clicks          |
| `long_task`                      | JS task >50ms                  |
| `web_vital_lcp`                  | Largest Contentful Paint       |
| `web_vital_fid`                  | First Input Delay              |
| `web_vital_cls`                  | Cumulative Layout Shift        |
| `network_status`                 | Online/offline status          |
| `orientation_change`             | Device orientation change      |
| `media_play/pause/ended`         | Video/audio events             |
| `telegram_theme_changed`         | Telegram theme change          |
| `telegram_viewport_changed`      | Viewport size change           |
| `telegram_main_button_clicked`   | Main button pressed            |
| `telegram_back_button_clicked`   | Back button pressed            |
| `telegram_invoice_closed`        | Invoice closed                 |
| ...and all other Telegram events |                                |

## API

### `DashgramMini.init(config)`

Initialize the SDK. Call once when your app loads.

### `DashgramMini.track(event, properties)`

Track a custom event.

```typescript
DashgramMini.track("checkout_started", {
  cart_value: 49.99,
  item_count: 3
})
```

### `DashgramMini.setTrackLevel(level)`

Change the track level at runtime.

```typescript
DashgramMini.setTrackLevel(3) // Enable deep analytics
```

### `DashgramMini.flush()`

Force send all pending events.

```typescript
await DashgramMini.flush()
```

### `DashgramMini.shutdown()`

Stop tracking and clean up.

```typescript
DashgramMini.shutdown()
```

## User Identification

User identification is handled **automatically** via Telegram's `initData`. The SDK sends the raw `initData` string with every event, allowing the backend to validate and extract user information securely.

You do **not** need to call any identify method.

## How It Works

1. SDK captures events based on `trackLevel`
2. Events are batched for efficiency
3. Each event includes:
   - `eventId`: UUID for deduplication
   - `type`: Event name
   - `initData`: Raw Telegram initData (for backend validation)
   - `properties`: Custom event data
   - `telemetry`: Platform, user agent, timezone, theme
   - `timestamp`: Unix milliseconds
4. Events are sent to `POST /v1/{projectId}/webapp/track`

## TypeScript Support

Full TypeScript support with exported types:

```typescript
import type { DashgramConfig, WebAppEvent, EventProperties, TrackLevel } from "@dashgram/javascript"
```

## Error Handling

```typescript
import { DashgramMini, DashgramAPIError, NetworkError } from "@dashgram/javascript"

DashgramMini.init({
  projectId: "your-project-id",
  onError: error => {
    if (error instanceof NetworkError) {
      console.log("Network issue:", error.message)
    } else if (error instanceof DashgramAPIError) {
      console.log("API error:", error.statusCode, error.details)
    }
  }
})
```

## Browser Support

- Chrome 64+
- Firefox 67+
- Safari 12+
- Edge 79+

Works in all environments that support Telegram Mini Apps.

## License

MIT
