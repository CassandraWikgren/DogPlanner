import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: "https://a16e34b82b60e6b0b9ac2b442db5f7d6@o4510409076899840.ingest.de.sentry.io/4510409081815120",

  // Only trace 1% of requests in production (reduces overhead dramatically)
  tracesSampleRate: process.env.NODE_ENV === "production" ? 0.01 : 0,

  // Disable debug logging in production
  debug: false,

  // Disable automatic log sending (too much overhead)
  enableLogs: false,

  integrations: [
    // Only send critical errors to Sentry
    Sentry.consoleLoggingIntegration({ levels: ["error"] }),

    // Disable replay integration - too heavy for performance
    // Sentry.replayIntegration({
    //   maskAllText: true,
    //   blockAllMedia: true,
    // }),
  ],

  // Disable session replay (major performance impact)
  replaysSessionSampleRate: 0,
  replaysOnErrorSampleRate: 0,

  // Environment
  environment: process.env.NODE_ENV || "development",
});
