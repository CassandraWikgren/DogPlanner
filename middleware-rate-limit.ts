import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// Rate limiting store (in-memory för enkelhet, använd Redis i produktion)
const rateLimit = new Map<string, { count: number; resetTime: number }>();

interface RateLimitConfig {
  windowMs: number; // Tidsfönster i millisekunder
  maxRequests: number; // Max antal requests per tidsfönster
}

const RATE_LIMITS: Record<string, RateLimitConfig> = {
  // Publika registreringsendpoints - striktare
  "/api/register": { windowMs: 60000, maxRequests: 3 }, // 3 requests/minut
  "/ansokan": { windowMs: 60000, maxRequests: 5 }, // 5 ansökningar/minut

  // Auth endpoints
  "/api/auth": { windowMs: 60000, maxRequests: 10 }, // 10 login-försök/minut

  // API endpoints - mer generöst för inloggade
  "/api": { windowMs: 60000, maxRequests: 60 }, // 60 requests/minut default
};

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Hitta matchande rate limit config
  let config: RateLimitConfig | null = null;
  let matchedPath = "";

  for (const [path, limit] of Object.entries(RATE_LIMITS)) {
    if (pathname.startsWith(path)) {
      // Använd mest specifika matchen
      if (path.length > matchedPath.length) {
        config = limit;
        matchedPath = path;
      }
    }
  }

  // Ingen rate limiting för denna path
  if (!config) {
    return NextResponse.next();
  }

  // Identifiera klienten (IP + User-Agent för bättre fingerprinting)
  const forwarded = request.headers.get("x-forwarded-for");
  const ip = forwarded
    ? forwarded.split(",")[0].trim()
    : request.headers.get("x-real-ip") || "unknown";
  const userAgent = request.headers.get("user-agent") || "unknown";
  const identifier = `${ip}:${userAgent.slice(0, 50)}:${matchedPath}`;

  const now = Date.now();
  const record = rateLimit.get(identifier);

  if (!record || now > record.resetTime) {
    // Nytt tidsfönster
    rateLimit.set(identifier, {
      count: 1,
      resetTime: now + config.windowMs,
    });
    return NextResponse.next();
  }

  if (record.count >= config.maxRequests) {
    // Rate limit överskriden
    console.warn(`[RATE_LIMIT] ${identifier} exceeded limit on ${pathname}`);

    return new NextResponse(
      JSON.stringify({
        error: "För många förfrågningar. Försök igen om en stund.",
        retryAfter: Math.ceil((record.resetTime - now) / 1000),
      }),
      {
        status: 429,
        headers: {
          "Content-Type": "application/json",
          "Retry-After": Math.ceil((record.resetTime - now) / 1000).toString(),
          "X-RateLimit-Limit": config.maxRequests.toString(),
          "X-RateLimit-Remaining": "0",
          "X-RateLimit-Reset": new Date(record.resetTime).toISOString(),
        },
      }
    );
  }

  // Öka räknare
  record.count += 1;
  rateLimit.set(identifier, record);

  // Lägg till rate limit headers
  const response = NextResponse.next();
  response.headers.set("X-RateLimit-Limit", config.maxRequests.toString());
  response.headers.set(
    "X-RateLimit-Remaining",
    (config.maxRequests - record.count).toString()
  );
  response.headers.set(
    "X-RateLimit-Reset",
    new Date(record.resetTime).toISOString()
  );

  return response;
}

// Cleanup gamla entries varje 5 minuter
setInterval(() => {
  const now = Date.now();
  for (const [key, record] of rateLimit.entries()) {
    if (now > record.resetTime + 60000) {
      // 1 minut extra marginal
      rateLimit.delete(key);
    }
  }
}, 300000);

// Konfigurera vilka paths som ska ha middleware
export const config = {
  matcher: ["/api/:path*", "/ansokan/:path*"],
};
