// This file configures the initialization of Sentry on the server.
// The config you add here will be used whenever the server handles a request.
// https://docs.sentry.io/platforms/javascript/guides/nextjs/

import * as Sentry from "@sentry/nextjs";

// Check if we're in development
const isDevelopment = process.env.NODE_ENV === "development";

// Only initialise Sentry in production
if (!isDevelopment) {
  Sentry.init({
    dsn: process.env.SENTRY_DSN || process.env.NEXT_PUBLIC_SENTRY_DSN || "https://ba38cc81a62baab7730d727b8717db76@o4510353855348736.ingest.us.sentry.io/4510353913610240",

    // Set the environment
    environment: process.env.NODE_ENV || "production",

    // Define how likely traces are sampled. Adjust this value in production, or use tracesSampler for greater control.
    tracesSampleRate: process.env.NODE_ENV === "production" ? 0.1 : 1.0,

    // Enable logs to be sent to Sentry
    enableLogs: true,

    // Enable sending user PII (Personally Identifiable Information)
    // https://docs.sentry.io/platforms/javascript/guides/nextjs/configuration/options/#sendDefaultPii
    sendDefaultPii: false, // Disable PII by default for privacy

    // Ignore specific errors
    ignoreErrors: [
      // Non-actionable errors
      "ECONNREFUSED",
      "ENOTFOUND",
      "ETIMEDOUT",
      "ECONNRESET",
      // Database connection errors (handled by Supabase)
      "PGRST",
      "postgres",
    ],

    // Filter out localhost requests
    beforeSend(event, hint) {
      // Check if the request is from localhost
      // Request info is available in event.request or event.contexts
      const request = (event as any).request;
      if (request?.headers) {
        const host = request.headers.host || request.headers["x-forwarded-host"];
        if (
          host &&
          (host.includes("localhost") ||
            host.includes("127.0.0.1") ||
            host.startsWith("192.168.") ||
            host.startsWith("10."))
        ) {
          return null; // Don't send events from localhost
        }
      }
      return event;
    },
  });
} else {
  console.log("[Sentry] Disabled in development mode");
}
