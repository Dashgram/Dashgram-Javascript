/**
 * Dashgram SDK - React Example
 *
 * This example shows how to integrate Dashgram SDK in a React application.
 * Install the package: npm install @dashgram/javascript
 */

import React, { useEffect } from "react"
import DashgramMini from "@dashgram/javascript"

// Initialize SDK once when app loads
DashgramMini.init({
  projectId: process.env.REACT_APP_DASHGRAM_PROJECT_ID || "your-project-id",
  apiKey: process.env.REACT_APP_DASHGRAM_API_KEY || "your-api-key",
  trackLevel: 2, // Track interactions (clicks, form submissions, etc.)
  debug: process.env.NODE_ENV === "development"
})

function App() {
  useEffect(() => {
    // Track page view when component mounts
    DashgramMini.track("screen_view", {
      screen_name: "home",
      screen_path: "/"
    })
  }, [])

  const handleSubscribe = () => {
    DashgramMini.track("subscription_started", {
      plan: "premium",
      price: 9.99,
      currency: "USD"
    })
    // Your subscription logic here
  }

  const handlePurchase = (productId: string, price: number) => {
    DashgramMini.track("purchase_completed", {
      product_id: productId,
      amount: price,
      currency: "USD",
      payment_method: "card"
    })
    // Your purchase logic here
  }

  const handleUserLogin = (userId: string, userEmail: string) => {
    DashgramMini.identify(userId, {
      email: userEmail,
      plan: "free",
      signup_date: new Date().toISOString()
    })
  }

  return (
    <div>
      <h1>My Telegram Mini App</h1>
      <button onClick={handleSubscribe}>Subscribe</button>
      <button onClick={() => handlePurchase("product-123", 19.99)}>Buy Product</button>
    </div>
  )
}

export default App
