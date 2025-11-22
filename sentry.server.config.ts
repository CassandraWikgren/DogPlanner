import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: "https://a16e34b82b60e6b0b9ac2b442db5f7d6@o4510409076899840.ingest.de.sentry.io/4510409081815120",

  // Adjust this value in production, or use tracesSampler for greater control
  tracesSampleRate: 1.0,

  // Setting this option to true will print useful information to the console while you're setting up Sentry.
  debug: false,

  // Enable logging
  enableLogs: true,

  integrations: [
    // Send console.log, console.warn, and console.error calls as logs to Sentry
    Sentry.consoleLoggingIntegration({ levels: ["warn", "error"] }),
  ],

  // Environment
  environment: process.env.NODE_ENV || "development",
});
