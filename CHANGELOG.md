# Changelog

All notable changes to @dashgram/javascript will be documented in this file.

## [1.0.0] - 2024-12-29

### Added

- 🎉 Initial release of Dashgram JavaScript SDK
- ✨ Track Levels 1, 2, 3 support
- ✨ Auto-tracking for lifecycle, interactions, and deep metrics
- ✨ Manual event tracking with `track()` API
- ✨ User identification with `identify()` API
- ✨ Session management (30-minute timeout)
- ✨ Batching and retry logic
- ✨ sendBeacon support for reliable page unload tracking
- ✨ Telegram WebApp integration
- ✨ TypeScript support with full type definitions
- ✨ Performance optimizations (throttling, debouncing, event delegation)
- ✨ Offline detection and graceful degradation
- ✨ Debug mode for development
- 📚 Comprehensive documentation
- 📚 Vanilla JavaScript example

### Track Level 1 (Core)
- `app_open` — App opened
- `app_close` — App closed
- `session_start` — Session started
- `session_end` — Session ended

### Track Level 2 (Interaction)
- `screen_view` — Page/screen viewed
- `button_click` — Button clicked
- `link_click` — Link clicked
- `form_submit` — Form submitted
- `input_focus` — Input focused
- `js_error` — JavaScript error
- `unhandled_rejection` — Unhandled promise rejection

### Track Level 3 (Deep)
- `scroll_depth` — Scroll depth milestones (25%, 50%, 75%, 100%)
- `element_visible` — Element became visible
- `rage_click` — Rage click detected (5+ clicks in 2s)
- `long_task` — Long task detected (>50ms)
- `web_vital_lcp` — Largest Contentful Paint
- `web_vital_fid` — First Input Delay
- `web_vital_cls` — Cumulative Layout Shift
- `telegram_theme_changed` — Telegram theme changed
- `telegram_viewport_changed` — Telegram viewport changed
- `telegram_back_button_clicked` — Telegram back button clicked
- `telegram_main_button_clicked` — Telegram main button clicked





