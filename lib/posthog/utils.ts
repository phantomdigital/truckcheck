/**
 * Utility functions for PostHog analytics
 * PostHog is initialised in instrumentation-client.ts
 */

/**
 * Check if PostHog is enabled and available
 */
export function isPostHogEnabled(): boolean {
  if (typeof window === "undefined") {
    return false
  }

  // Check environment
  if (process.env.NODE_ENV === "development") {
    return false
  }

  // Check if we're on localhost
  const hostname = window.location.hostname
  if (
    hostname === "localhost" ||
    hostname === "127.0.0.1" ||
    hostname === "[::1]" ||
    hostname.startsWith("192.168.") ||
    hostname.startsWith("10.")
  ) {
    return false
  }

  // Check if PostHog is loaded
  return typeof window !== "undefined" && typeof (window as any).posthog !== "undefined"
}

/**
 * Safely capture an event only if PostHog is enabled
 */
export function captureEvent(eventName: string, properties?: Record<string, unknown>): void {
  if (!isPostHogEnabled()) {
    if (process.env.NODE_ENV === "development") {
      console.log("[PostHog] Event (not sent):", eventName, properties)
    }
    return
  }

  try {
    const posthog = (window as any).posthog
    if (posthog && typeof posthog.capture === "function") {
      posthog.capture(eventName, properties)
    }
  } catch (error) {
    console.error("[PostHog] Error capturing event:", error)
  }
}

/**
 * Identify a user in PostHog
 */
export function identifyUser(userId: string, properties?: Record<string, unknown>): void {
  if (!isPostHogEnabled()) {
    if (process.env.NODE_ENV === "development") {
      console.log("[PostHog] Identify (not sent):", userId, properties)
    }
    return
  }

  try {
    const posthog = (window as any).posthog
    if (posthog && typeof posthog.identify === "function") {
      posthog.identify(userId, properties)
    }
  } catch (error) {
    console.error("[PostHog] Error identifying user:", error)
  }
}

/**
 * Reset user identification (e.g., on logout)
 */
export function resetUser(): void {
  if (!isPostHogEnabled()) {
    return
  }

  try {
    const posthog = (window as any).posthog
    if (posthog && typeof posthog.reset === "function") {
      posthog.reset()
    }
  } catch (error) {
    console.error("[PostHog] Error resetting user:", error)
  }
}

/**
 * Set user properties
 */
export function setUserProperties(properties: Record<string, unknown>): void {
  if (!isPostHogEnabled()) {
    if (process.env.NODE_ENV === "development") {
      console.log("[PostHog] Set properties (not sent):", properties)
    }
    return
  }

  try {
    const posthog = (window as any).posthog
    if (posthog && typeof posthog.setPersonProperties === "function") {
      posthog.setPersonProperties(properties)
    }
  } catch (error) {
    console.error("[PostHog] Error setting user properties:", error)
  }
}

