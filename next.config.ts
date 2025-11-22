import path from "path";
import type { NextConfig } from "next";
import { withSentryConfig } from "@sentry/nextjs";

const nextConfig: NextConfig = {
  // 🌍 Miljövariabler tillgängliga i hela appen
  env: {
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY,
  },

  // ⚙️ Tillåt externa server-paket (för Supabase, PDF, QR-kod)
  serverExternalPackages: [
    "@supabase/supabase-js",
    "stream-buffers",
    "pdfkit",
    "qrcode",
  ],

  // 🚀 Edge & build-optimeringar (uppdaterad för Next.js 15)
  turbopack: {
    rules: {
      "*.ts": {
        loaders: ["ts-loader"],
        as: "js",
      },
    },
  },

  // 🔄 Använd unikt build ID baserat på git commit eller timestamp
  generateBuildId: async () => {
    // På Vercel: använd VERCEL_GIT_COMMIT_SHA
    // Lokalt: använd timestamp
    return process.env.VERCEL_GIT_COMMIT_SHA || `build-${Date.now()}`;
  },

  // 🖼️ Bildoptimering för Supabase-lagrade bilder
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "lh3.googleusercontent.com",
      },
      {
        protocol: "https",
        hostname: "**.supabase.co",
      },
      {
        protocol: "https",
        hostname: "avatars.githubusercontent.com",
      },
    ],
  },

  // 📦 Output tracing – gör att PDF-funktioner & Supabase fungerar på Vercel
  outputFileTracingIncludes: {
    "/api/invoices/[id]/pdf": [
      "./node_modules/pdfkit/**/*",
      "./node_modules/stream-buffers/**/*",
      "./node_modules/qrcode/**/*",
    ],
    "/api/pdf": [
      "./node_modules/pdfkit/**/*",
      "./node_modules/stream-buffers/**/*",
    ],
  },

  // 🧩 Experimentella inställningar (uppdaterad för Next.js 15+)
  experimental: {
    disableOptimizedLoading: true,
  },

  // 🎨 CSS optimering för konsistent styling mellan miljöer
  compiler: {
    removeConsole:
      process.env.NODE_ENV === "production" ? { exclude: ["error"] } : false,
  },
};

// 🧭 Alias-stöd för importvägar
nextConfig.webpack = (config) => {
  config.resolve.alias = {
    ...config.resolve.alias,
    "@": path.resolve(__dirname),
    "@components": path.resolve(__dirname, "components"),
    "@lib": path.resolve(__dirname, "lib"),
    "@context": path.resolve(__dirname, "app/context"),
  };
  return config;
};

// Wrap with Sentry config
export default withSentryConfig(nextConfig, {
  // For all available options, see:
  // https://www.npmjs.com/package/@sentry/webpack-plugin#options

  org: "dogplanner",

  project: "javascript-nextjs",

  // Only print logs for uploading source maps in CI
  silent: !process.env.CI,

  // Upload a larger set of source maps for prettier stack traces (increases build time)
  widenClientFileUpload: false, // ⚡ Ändrat till false för snabbare builds

  // Route browser requests to Sentry through a Next.js rewrite to circumvent ad-blockers.
  tunnelRoute: "/monitoring",

  // Automatically tree-shake Sentry logger statements to reduce bundle size
  disableLogger: true,

  // Enables automatic instrumentation of Vercel Cron Monitors
  automaticVercelMonitors: true,
});