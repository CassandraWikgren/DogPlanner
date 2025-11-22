// This file configures the initialization of Sentry on the server.
// The config you add here will be used whenever the server handles a request.
// https://docs.sentry.io/platforms/javascript/guides/nextjs/

import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: "https://a16e34b82b60e6b0b9ac2b442db5f7d6@o4510409076899840.ingest.de.sentry.io/4510409081815120",

  // Only trace 1% of server requests in production (reduces overhead)
  tracesSampleRate: process.env.NODE_ENV === "production" ? 0.01 : 0,

  // Disable automatic log sending (too much overhead)
  enableLogs: false,

  // Disable PII for privacy and performance
  sendDefaultPii: false,
});
