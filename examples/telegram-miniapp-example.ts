/**
 * Dashgram SDK - Telegram Mini App Example
 *
 * This example demonstrates typical analytics tracking in a Telegram Mini App.
 * Install the package: npm install @dashgram/javascript
 */

import DashgramMini from "@dashgram/javascript"

// Initialize SDK when Mini App loads
DashgramMini.init({
  projectId: "your-project-id",
  apiKey: "your-api-key",
  trackLevel: 3, // Enable all tracking (core + interactions + deep analytics)
  debug: false // Set to false in production
})

// Example: Track when user opens the app
// This is automatically tracked at Level 1, but you can add custom properties
window.addEventListener("load", () => {
  DashgramMini.track("app_opened", {
    source: "telegram",
    version: "1.0.0"
  })
})

// Example: Identify user from Telegram WebApp
if (window.Telegram?.WebApp) {
  const tg = window.Telegram.WebApp

  // Get Telegram user info
  const user = tg.initDataUnsafe?.user

  if (user) {
    DashgramMini.identify(user.id.toString(), {
      username: user.username,
      first_name: user.first_name,
      last_name: user.last_name,
      language_code: user.language_code,
      is_premium: user.is_premium || false
    })
  }

  // Track Telegram-specific events
  tg.onEvent("themeChanged", () => {
    DashgramMini.track("telegram_theme_changed", {
      theme: tg.colorScheme
    })
  })

  tg.onEvent("viewportChanged", () => {
    DashgramMini.track("telegram_viewport_changed", {
      viewport_height: tg.viewportHeight,
      viewport_stable_height: tg.viewportStableHeight
    })
  })

  tg.onEvent("mainButtonClicked", () => {
    DashgramMini.track("telegram_main_button_clicked", {
      button_text: tg.MainButton.text
    })
  })
}

// Example: Track custom business events
function trackProductView(productId: string, productName: string) {
  DashgramMini.track("product_viewed", {
    product_id: productId,
    product_name: productName,
    category: "electronics"
  })
}

function trackAddToCart(productId: string, price: number) {
  DashgramMini.track("add_to_cart", {
    product_id: productId,
    price: price,
    currency: "USD"
  })
}

function trackCheckoutStarted(cartValue: number, itemCount: number) {
  DashgramMini.track("checkout_started", {
    cart_value: cartValue,
    item_count: itemCount,
    currency: "USD"
  })
}

function trackPurchaseCompleted(orderId: string, total: number, items: any[]) {
  DashgramMini.track("purchase_completed", {
    order_id: orderId,
    total: total,
    currency: "USD",
    item_count: items.length,
    items: items
  })
}

// Example: Track user engagement
function trackFeatureUsed(featureName: string) {
  DashgramMini.track("feature_used", {
    feature_name: featureName,
    timestamp: new Date().toISOString()
  })
}

// Example: Flush events before app closes
window.addEventListener("beforeunload", async () => {
  await DashgramMini.flush()
})

// Export for use in your app
export { trackProductView, trackAddToCart, trackCheckoutStarted, trackPurchaseCompleted, trackFeatureUsed }
