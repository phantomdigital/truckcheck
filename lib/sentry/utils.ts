/**
 * Utility functions for Sentry error tracking
 */

/**
 * Check if Sentry is enabled (not in development or localhost)
 */
export function isSentryEnabled(): boolean {
  // Check environment
  if (process.env.NODE_ENV === "development") {
    return false;
  }

  // Check if we're on localhost (client-side only)
  if (typeof window !== "undefined") {
    const hostname = window.location.hostname;
    if (
      hostname === "localhost" ||
      hostname === "127.0.0.1" ||
      hostname === "[::1]" ||
      hostname.startsWith("192.168.") ||
      hostname.startsWith("10.")
    ) {
      return false;
    }
  }

  return true;
}

/**
 * Safely capture an exception only if Sentry is enabled
 */
export function safeCaptureException(error: Error, context?: Record<string, unknown>): void {
  if (!isSentryEnabled()) {
    // Log to console in development
    console.error("[Sentry] Error (not sent):", error, context);
    return;
  }

  // Dynamic import to avoid bundling Sentry in development
  import("@sentry/nextjs").then((Sentry) => {
    if (context) {
      Sentry.captureException(error, { extra: context });
    } else {
      Sentry.captureException(error);
    }
  });
}

