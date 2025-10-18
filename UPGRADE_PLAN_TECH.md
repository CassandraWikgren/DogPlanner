# 🔧 TEKNISK INFRASTRUKTUR

## 🚀 PRESTANDA OPTIMERINGAR

### Databas optimering

```sql
-- Lägg till index för snabbare queries
CREATE INDEX idx_dogs_org_subscription ON dogs(org_id, subscription);
CREATE INDEX idx_bookings_date_range ON bookings(start_date, end_date);
CREATE INDEX idx_owners_email ON owners(email);

-- Partitionering för stora tabeller
CREATE TABLE bookings_2025 PARTITION OF bookings
FOR VALUES FROM ('2025-01-01') TO ('2026-01-01');
```

### Caching strategi

```tsx
// Redis cache för ofta använda data
const CacheService = {
  getDogs: async (orgId) => {
    const cacheKey = `dogs:${orgId}`;
    const cached = await redis.get(cacheKey);

    if (cached) return JSON.parse(cached);

    const dogs = await supabase.from("dogs").select("*").eq("org_id", orgId);
    await redis.setex(cacheKey, 300, JSON.stringify(dogs)); // 5 min cache

    return dogs;
  },

  invalidateCache: async (pattern) => {
    const keys = await redis.keys(pattern);
    if (keys.length > 0) await redis.del(keys);
  },
};
```

### Real-time updates

```tsx
// WebSocket för live-uppdateringar
const RealtimeService = {
  subscribeToChanges: (orgId, callback) => {
    const channel = supabase
      .channel(`org:${orgId}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "dogs" },
        callback
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "bookings" },
        callback
      )
      .subscribe();

    return channel;
  },
};
```

## 📱 PWA & OFFLINE KAPACITET

### Service Worker

```javascript
// sw.js - Offline funktionalitet
const CACHE_NAME = "dogplanner-v1";
const urlsToCache = [
  "/",
  "/dashboard",
  "/hunddagis",
  "/static/js/bundle.js",
  "/static/css/main.css",
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(urlsToCache))
  );
});

self.addEventListener("fetch", (event) => {
  event.respondWith(
    caches.match(event.request).then((response) => {
      // Returnera från cache eller hämta från nätet
      return response || fetch(event.request);
    })
  );
});
```

### Background sync

```tsx
const OfflineSync = {
  queueAction: (action, data) => {
    const queue = JSON.parse(localStorage.getItem("actionQueue") || "[]");
    queue.push({ action, data, timestamp: Date.now() });
    localStorage.setItem("actionQueue", JSON.stringify(queue));
  },

  processQueue: async () => {
    const queue = JSON.parse(localStorage.getItem("actionQueue") || "[]");

    for (let item of queue) {
      try {
        await executeAction(item.action, item.data);
        // Ta bort från kö vid framgång
        queue.splice(queue.indexOf(item), 1);
      } catch (error) {
        console.error("Failed to sync:", error);
      }
    }

    localStorage.setItem("actionQueue", JSON.stringify(queue));
  },
};
```

## 🔒 SÄKERHET & GDPR

### Enhanced säkerhet

```tsx
const SecurityService = {
  // Rate limiting
  rateLimit: new Map(),

  checkRateLimit: (userId, action) => {
    const key = `${userId}:${action}`;
    const now = Date.now();
    const window = 60000; // 1 minut
    const limit = 100; // 100 requests per minut

    const requests = this.rateLimit.get(key) || [];
    const recent = requests.filter((time) => now - time < window);

    if (recent.length >= limit) {
      throw new Error("Rate limit exceeded");
    }

    recent.push(now);
    this.rateLimit.set(key, recent);
  },

  // Input sanitization
  sanitizeInput: (input) => {
    return DOMPurify.sanitize(input, {
      ALLOWED_TAGS: [],
      ALLOWED_ATTR: [],
    });
  },
};
```

### GDPR compliance

```tsx
const GDPRService = {
  exportUserData: async (userId) => {
    const userData = {
      profile: await getUserProfile(userId),
      dogs: await getUserDogs(userId),
      bookings: await getUserBookings(userId),
      invoices: await getUserInvoices(userId),
    };

    return {
      data: userData,
      exportDate: new Date(),
      format: "JSON",
    };
  },

  deleteUserData: async (userId) => {
    // Anonymisera istället för att radera (för bokföringslagen)
    await supabase
      .from("owners")
      .update({
        full_name: "ANONYMISERAD ANVÄNDARE",
        email: null,
        phone: null,
        gdpr_deleted: true,
        deletion_date: new Date(),
      })
      .eq("id", userId);
  },
};
```

## 📊 MONITORING & ANALYTICS

### Error tracking

```tsx
// Sentry integration
import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  environment: process.env.NODE_ENV,
});

const ErrorBoundary = ({ children }) => {
  return (
    <Sentry.ErrorBoundary fallback={ErrorFallback} showDialog>
      {children}
    </Sentry.ErrorBoundary>
  );
};
```

### Performance monitoring

```tsx
const Analytics = {
  trackEvent: (event, properties) => {
    // Mixpanel/Google Analytics
    mixpanel.track(event, {
      ...properties,
      timestamp: Date.now(),
      user_id: user?.id,
      org_id: user?.org_id,
    });
  },

  trackPageView: (page) => {
    gtag("config", "GA_MEASUREMENT_ID", {
      page_title: page,
      page_location: window.location.href,
    });
  },
};
```

## 🔄 CI/CD & DEPLOYMENT

### GitHub Actions

```yaml
# .github/workflows/deploy.yml
name: Deploy to Production
on:
  push:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - run: npm ci
      - run: npm run test
      - run: npm run build

  deploy:
    needs: test
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - uses: vercel/action@v20
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.ORG_ID }}
          vercel-project-id: ${{ secrets.PROJECT_ID }}
```

### Automated testing

```tsx
// Jest + React Testing Library
describe("Dog Management", () => {
  test("should add new dog successfully", async () => {
    render(<DogForm />);

    fireEvent.change(screen.getByLabelText("Hundnamn"), {
      target: { value: "Test Hund" },
    });

    fireEvent.click(screen.getByText("Spara"));

    await waitFor(() => {
      expect(screen.getByText("Hund sparad!")).toBeInTheDocument();
    });
  });
});
```
