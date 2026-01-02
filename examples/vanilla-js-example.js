/**
 * Dashgram SDK - Vanilla JavaScript Example
 *
 * This example shows how to use Dashgram SDK in a vanilla JavaScript application.
 * Install the package: npm install @dashgram/javascript
 *
 * For browser usage, you'll need a bundler like Webpack, Vite, or Parcel,
 * or use a CDN that supports ES modules.
 */

import DashgramMini from "@dashgram/javascript"

// Initialize SDK
DashgramMini.init({
  projectId: "your-project-id",
  apiKey: "your-api-key",
  trackLevel: 2, // Track interactions
  debug: true, // Set to false in production
  batchSize: 10,
  flushInterval: 5000
})

// Example: Track button clicks
document.addEventListener("DOMContentLoaded", () => {
  const subscribeButton = document.getElementById("subscribe-btn")
  if (subscribeButton) {
    subscribeButton.addEventListener("click", () => {
      DashgramMini.track("button_clicked", {
        button_name: "subscribe",
        screen: "home",
        position: "header"
      })
    })
  }

  // Example: Track form submissions
  const form = document.getElementById("contact-form")
  if (form) {
    form.addEventListener("submit", e => {
      e.preventDefault()

      DashgramMini.track("form_submitted", {
        form_name: "contact",
        form_type: "contact_us"
      })

      // Your form submission logic here
    })
  }

  // Example: Track page navigation
  window.addEventListener("popstate", () => {
    DashgramMini.track("screen_view", {
      screen_name: document.title,
      screen_path: window.location.pathname
    })
  })
})

// Example: Identify user after login
function onUserAuthenticated(userId, userData) {
  DashgramMini.identify(userId, {
    email: userData.email,
    name: userData.name,
    plan: userData.plan || "free"
  })
}

// Example: Track purchase
function trackPurchase(orderId, items, total) {
  DashgramMini.track("purchase_completed", {
    order_id: orderId,
    items: items,
    total: total,
    currency: "USD"
  })
}

// Example: Flush events before page unload
window.addEventListener("beforeunload", () => {
  DashgramMini.flush()
})
