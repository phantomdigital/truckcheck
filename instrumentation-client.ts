// This file configures PostHog analytics for the client-side
// Using Next.js 16+ instrumentation-client.ts for lightweight integration
// https://posthog.com/docs/libraries/nextjs

import posthog from "posthog-js"

// Check if we're in development or localhost
const isDevelopment = process.env.NODE_ENV === "development"
const posthogKey = process.env.NEXT_PUBLIC_POSTHOG_KEY
const posthogHost = process.env.NEXT_PUBLIC_POSTHOG_HOST || "https://us.posthog.com"

// Only initialise PostHog if we have a key and we're not on localhost
if (posthogKey && typeof window !== "undefined") {
  // Check if we're on localhost
  const isLocalhost =
    window.location.hostname === "localhost" ||
    window.location.hostname === "127.0.0.1" ||
    window.location.hostname === "[::1]" ||
    window.location.hostname.startsWith("192.168.") ||
    window.location.hostname.startsWith("10.")

  // Only initialise PostHog in production and not on localhost
  if (!isDevelopment && !isLocalhost) {
    posthog.init(posthogKey, {
      api_host: posthogHost,
      ui_host: posthogHost,
      // Enable automatic pageview tracking
      autocapture: true,
      // Capture pageviews automatically
      capture_pageview: true,
      // Capture pageleaves
      capture_pageleave: true,
      // Enable session recording with privacy settings
      session_recording: {
        recordCrossOriginIframes: false,
        maskAllInputs: true, // Mask sensitive inputs for privacy
        maskTextSelector: '[data-ph-no-capture]', // Don't capture elements with this attribute
      },
      // Capture exceptions (complementary to Sentry)
      capture_exceptions: true,
      // Enable debug mode (disabled in production for performance)
      debug: false,
      // Load callback
      loaded: (posthog) => {
        if (isDevelopment) {
          console.log("[PostHog] Initialised successfully")
        }
        // Set user properties if available (can be called later)
        // posthog.identify(userId, { email, name })
      },
      // Filter out localhost events (safety check)
      before_send: (event) => {
        // Double-check we're not on localhost
        if (typeof window !== "undefined") {
          const hostname = window.location.hostname
          if (
            hostname === "localhost" ||
            hostname === "127.0.0.1" ||
            hostname === "[::1]" ||
            hostname.startsWith("192.168.") ||
            hostname.startsWith("10.")
          ) {
            return null // Don't send events from localhost
          }
        }
        return event
      },
      // Privacy settings
      respect_dnt: true, // Respect Do Not Track header
      // Persistence settings
      persistence: "localStorage+cookie", // Use both localStorage and cookies
      // Cross-domain tracking
      cross_subdomain_cookie: false, // Disable cross-subdomain cookies for privacy
      // Secure cookie in production
      secure_cookie: process.env.NODE_ENV === "production",
      // Advanced options
      advanced_disable_decide: false, // Enable feature flags and other PostHog features
      // Disable persistence in development for testing
      disable_persistence: isDevelopment,
    })
  } else {
    if (isDevelopment) {
      console.log("[PostHog] Disabled in development/localhost mode")
    }
  }
} else {
  if (isDevelopment && typeof window !== "undefined") {
    console.warn("[PostHog] NEXT_PUBLIC_POSTHOG_KEY is not set")
  }
}