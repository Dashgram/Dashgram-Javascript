<template>
  <div class="app">
    <h1>My Telegram Mini App</h1>
    <button @click="handleSubscribe">Subscribe</button>
    <button @click="handlePurchase">Purchase</button>
  </div>
</template>

<script setup>
/**
 * Dashgram SDK - Vue 3 Example
 *
 * Install the package: npm install @dashgram/javascript
 */

import { onMounted, onUnmounted } from "vue"
import DashgramMini from "@dashgram/javascript"

// Initialize SDK
DashgramMini.init({
  projectId: import.meta.env.VITE_DASHGRAM_PROJECT_ID || "your-project-id",
  apiKey: import.meta.env.VITE_DASHGRAM_API_KEY || "your-api-key",
  trackLevel: 2,
  debug: import.meta.env.DEV
})

// Track page view on mount
onMounted(() => {
  DashgramMini.track("screen_view", {
    screen_name: "home",
    screen_path: "/"
  })
})

// Flush events on unmount
onUnmounted(async () => {
  await DashgramMini.flush()
})

const handleSubscribe = () => {
  DashgramMini.track("subscription_started", {
    plan: "premium",
    price: 9.99
  })
  // Your subscription logic
}

const handlePurchase = () => {
  DashgramMini.track("purchase_completed", {
    product_id: "product-123",
    amount: 19.99,
    currency: "USD"
  })
  // Your purchase logic
}

// Example: Identify user
function identifyUser(userId, traits) {
  DashgramMini.identify(userId, traits)
}
</script>
