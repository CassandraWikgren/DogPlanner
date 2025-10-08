// ========================================
// 📁 next.config.ts
// Next.js-konfiguration för DogPlanner
// ========================================

import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,

  // Gör så att importaliaset "@/lib/..." fungerar överallt
  experimental: {
    typedRoutes: true,
  },

  // Om du använder bilder i public/ via <Image />
  images: {
    domains: ["lh3.googleusercontent.com", "res.cloudinary.com"],
  },
};

export default nextConfig;
