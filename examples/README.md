# Dashgram JavaScript SDK Examples

This directory contains example implementations showing how to use the Dashgram JavaScript SDK in **Telegram Mini Apps**.

## Installation

All examples require the SDK to be installed from npm:

```bash
npm install @dashgram/javascript
```

## Examples

### Basic Usage (`basic-usage.html`)

Simple HTML example showing basic SDK initialization and event tracking. Can be used with a bundler or ES module loader.

### Vanilla JavaScript (`vanilla-js-example.js`)

Standalone JavaScript example demonstrating SDK usage in a vanilla JS application. Requires a bundler (Webpack, Vite, Parcel) or ES module support.

### React (`react-example.tsx`)

React component example showing SDK integration in a React application. Includes TypeScript types.

### Vue 3 (`vue-example.vue`)

Vue 3 Composition API example with TypeScript support.

### Next.js (`nextjs-example.tsx`)

Next.js App Router example with client-side SDK initialization.

### Telegram Mini App (`telegram-miniapp-example.ts`)

Comprehensive example showing typical analytics tracking patterns in a Telegram Mini App.

## Configuration

All examples use placeholder values for `projectId`. Replace with your actual project ID from the Dashgram dashboard:

```typescript
DashgramMini.init({
  projectId: "your-project-id", // Replace with your project ID
  trackLevel: 2, // 1, 2, or 3
  debug: true // Set to false in production
})
```

## Track Levels

- **Level 1 (Core)**: Minimal tracking — app open/close, device info
- **Level 2 (Interaction)**: Level 1 + clicks, form submissions, errors, screen views
- **Level 3 (Deep)**: Level 1 + 2 + scroll depth, element visibility, web vitals, all Telegram events

## Common Patterns

### Custom Event Tracking

```typescript
DashgramMini.track("purchase_completed", {
  product_id: "123",
  amount: 99.99,
  currency: "USD"
})
```

### Flush Events Before Unload

```typescript
window.addEventListener("beforeunload", async () => {
  await DashgramMini.flush()
})
```

## User Identification

User identification is handled **automatically** via Telegram's `initData`. The SDK sends the raw initData with every event, and the backend validates and extracts user information.

You do **not** need to call any identify method.

## Environment Variables

For production apps, use environment variables:

- **React**: `REACT_APP_DASHGRAM_PROJECT_ID`
- **Next.js**: `NEXT_PUBLIC_DASHGRAM_PROJECT_ID`
- **Vite**: `VITE_DASHGRAM_PROJECT_ID`

## More Information

See the main [README.md](../README.md) for complete API documentation.
