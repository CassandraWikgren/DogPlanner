import path from "path";
import type { NextConfig } from "next";

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

  // ⚠️ Förhindra att Next.js försöker för-rendera /_not-found under build
  output: "standalone",
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
    "/api/pdf": [
      "./node_modules/pdfkit/**/*",
      "./node_modules/stream-buffers/**/*",
      "./node_modules/qrcode/**/*",
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

export default nextConfig;
