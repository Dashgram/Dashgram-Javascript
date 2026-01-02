/**
 * Dashgram SDK - Next.js Example
 *
 * This example shows how to integrate Dashgram SDK in a Next.js application.
 * Install the package: npm install @dashgram/javascript
 *
 * For Next.js, initialize the SDK in a client component or use a custom hook.
 */

"use client"

import { useEffect } from "react"
import DashgramMini from "@dashgram/javascript"

// Initialize SDK (only on client side)
if (typeof window !== "undefined") {
  DashgramMini.init({
    projectId: process.env.NEXT_PUBLIC_DASHGRAM_PROJECT_ID || "your-project-id",
    apiKey: process.env.NEXT_PUBLIC_DASHGRAM_API_KEY || "your-api-key",
    trackLevel: 2,
    debug: process.env.NODE_ENV === "development"
  })
}

export default function HomePage() {
  useEffect(() => {
    // Track page view
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
  }

  const handlePurchase = (productId: string, price: number) => {
    DashgramMini.track("purchase_completed", {
      product_id: productId,
      amount: price,
      currency: "USD"
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
