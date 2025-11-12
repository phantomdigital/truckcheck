// This file configures the initialization of Sentry for edge features (middleware, edge routes, and so on).
// The config you add here will be used whenever one of the edge features is loaded.
// Note that this config is unrelated to the Vercel Edge Runtime and is also required when running locally.
// https://docs.sentry.io/platforms/javascript/guides/nextjs/

import * as Sentry from "@sentry/nextjs";

// Check if we're in development
const isDevelopment = process.env.NODE_ENV === "development";

// Only initialise Sentry in production
if (!isDevelopment) {
  Sentry.init({
    dsn: process.env.SENTRY_DSN || process.env.NEXT_PUBLIC_SENTRY_DSN || "https://0656b5986de4f6b12b0d22ff8db59662@o4510353855348736.ingest.us.sentry.io/4510353856004096",

    // Set the environment
    environment: process.env.NODE_ENV || "production",

    // Define how likely traces are sampled. Adjust this value in production, or use tracesSampler for greater control.
    tracesSampleRate: process.env.NODE_ENV === "production" ? 0.1 : 1.0,

    // Enable logs to be sent to Sentry
    enableLogs: true,

    // Enable sending user PII (Personally Identifiable Information)
    // https://docs.sentry.io/platforms/javascript/guides/nextjs/configuration/options/#sendDefaultPii
    sendDefaultPii: false, // Disable PII by default for privacy

    // Filter out localhost requests
    beforeSend(event, hint) {
      // Check if the request is from localhost
      const request = hint.request;
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
