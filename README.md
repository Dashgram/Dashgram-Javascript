# Dashgram JavaScript SDK

Analytics SDK for **Telegram Mini Apps**. Automatically captures user interactions and sends events to the Dashgram.

> [!NOTE]
> This SDK is for **Telegram Mini Apps** built with JavaScript/TypeScript. For Telegram bots or Mini Apps in other languages, see our [other SDKs](https://docs.dashgram.io/sdk).

## Quick Start

Place these scripts in your HTML before `</head>` closing tag:

```html
<script src="https://telegram.org/js/telegram-web-app.js"></script>
<script src="https://unpkg.com/@dashgram/javascript@latest/dist/dashgram.min.js"></script>
```

Initialize Dashgram inside `<body>`:

```html
<script>
  DashgramMini.init({
    projectId: "your-project-id",
    trackLevel: 2
  })
</script>
```

**Configuration parameters:**

- `projectId` — Your project identifier from the [Dashgram dashboard](https://app.dashgram.io). Get it after creating a project.
- `trackLevel` — Controls which events are automatically captured. See [Track Levels](#track-levels) section below for details.

> [!TIP]
> **Looking for a complete example?** Check out [`examples/basic-usage.html`](examples/basic-usage.html) for a working HTML example with event tracking.

## Track Levels

Choose how much data to collect. Higher levels capture more events but send more data.

### Level 1 — Core

**Minimal tracking** — Basic app lifecycle events only.

| Event       | Description                       |
| ----------- | --------------------------------- |
| `app_open`  | Mini App opened or became visible |
| `app_close` | Mini App closed or hidden         |

**Use when:** You only need basic usage metrics.

### Level 2 — Interactions

**Standard tracking** — Level 1 + user interactions.

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

**Use when:** You want standard web analytics (recommended for most apps).

### Level 3 — Deep Analytics

**Comprehensive tracking** — Level 1 + 2 + performance metrics + all Telegram events.

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

**Use when:** You need detailed performance monitoring and all Telegram WebApp events.

### All Configuration Options

| Option          | Type          | Default | Description                                                |
| --------------- | ------------- | ------- | ---------------------------------------------------------- |
| `projectId`     | `string`      | —       | **Required.** Your project ID from Dashgram dashboard      |
| `trackLevel`    | `1 \| 2 \| 3` | `2`     | Event collection level (see [Track Levels](#track-levels)) |
| `debug`         | `boolean`     | `false` | Enable debug logging to console                            |
| `disabled`      | `boolean`     | `false` | Disable all tracking (useful for opt-out)                  |
| `batchSize`     | `number`      | `10`    | Number of events to batch before sending                   |
| `flushInterval` | `number`      | `5000`  | Milliseconds between automatic flushes                     |
| `onError`       | `function`    | —       | Callback for handling errors                               |


## API Reference

### `DashgramMini.init(config)`

Initialize the SDK. Must be called once when your app loads.

```typescript
DashgramMini.init({
  projectId: "your-project-id",
  trackLevel: 2
})
```

### `DashgramMini.track(event, properties)`

Track a custom event with optional properties.

```typescript
DashgramMini.track("purchase_completed", {
  product_id: "premium-plan",
  price: 9.99,
  currency: "USD"
})
```

**Parameters:**

- `event` — Event name (string)
- `properties` — Optional event properties (object)

### `DashgramMini.flush()`

Force send all pending events immediately. Returns a Promise.

```typescript
await DashgramMini.flush()
```

**Use cases:**

- Before page unload
- After critical user actions
- When switching users

### `DashgramMini.shutdown()`

Stop tracking and clean up resources.

```typescript
DashgramMini.shutdown()
```

## Contributing

Contributions are welcome! Please open issues or pull requests on the [GitHub repository](https://github.com/dashgram/dashgram-javascript).

## License

This project is licensed under the MIT License. See the LICENSE file for more information.

## Contact

For questions or support, reach out to us at [team@dashgram.io](mailto:team@dashgram.io) or visit our [website](https://dashgram.io).
