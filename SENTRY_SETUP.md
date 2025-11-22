# 🔍 Error Tracking med Sentry

## Installation

```bash
npm install @sentry/nextjs
npx @sentry/wizard@latest -i nextjs
```

## Environment Variables

Lägg till i `.env.local`:

```env
NEXT_PUBLIC_SENTRY_DSN=din-sentry-dsn
SENTRY_AUTH_TOKEN=din-auth-token
SENTRY_ORG=din-org
SENTRY_PROJECT=dogplanner
```

## Sentry Configuration

Wizard:en skapar automatiskt:

- `sentry.client.config.ts` - Client-side error tracking
- `sentry.server.config.ts` - Server-side error tracking
- `sentry.edge.config.ts` - Edge runtime error tracking
- `next.config.ts` uppdateras med Sentry plugin

## Manual Setup (om wizard misslyckas)

### sentry.client.config.ts

```typescript
import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,

  tracesSampleRate: 1.0,

  debug: false,

  replaysOnErrorSampleRate: 1.0,
  replaysSessionSampleRate: 0.1,

  integrations: [
    new Sentry.Replay({
      maskAllText: true,
      blockAllMedia: true,
    }),
  ],

  environment: process.env.NODE_ENV,
});
```

### sentry.server.config.ts

```typescript
import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,

  tracesSampleRate: 1.0,

  debug: false,

  environment: process.env.NODE_ENV,
});
```

## Användning i ErrorBoundary

Uppdatera `components/ErrorBoundary.tsx`:

```typescript
import * as Sentry from "@sentry/nextjs";

componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
  // Skicka till Sentry
  Sentry.captureException(error, {
    contexts: {
      react: {
        componentStack: errorInfo.componentStack,
      },
    },
  });

  // Original logging
  console.error('ErrorBoundary caught an error:', error, errorInfo);

  if (this.props.onError) {
    this.props.onError(error, errorInfo);
  }
}
```

## Manual Error Reporting

```typescript
import * as Sentry from "@sentry/nextjs";

try {
  // Din kod
} catch (error) {
  Sentry.captureException(error, {
    tags: {
      section: "booking",
      user_role: "customer",
    },
    extra: {
      bookingId: booking.id,
      timestamp: new Date().toISOString(),
    },
  });
  throw error;
}
```

## Testing

```typescript
// Lägg till en test-knapp i dev-läge
{process.env.NODE_ENV === 'development' && (
  <button onClick={() => {
    throw new Error("Sentry Test Error!");
  }}>
    Test Sentry
  </button>
)}
```

## Performance Monitoring

```typescript
import * as Sentry from "@sentry/nextjs";

// Spåra långsamma databas-queries
const transaction = Sentry.startTransaction({
  name: "Database Query",
  op: "db.query",
});

const span = transaction.startChild({
  op: "db",
  description: "SELECT * FROM bookings WHERE org_id = ?",
});

try {
  const result = await supabase.from("bookings").select("*");
  span.setStatus("ok");
  return result;
} catch (error) {
  span.setStatus("internal_error");
  throw error;
} finally {
  span.finish();
  transaction.finish();
}
```

## Dashboard Setup

1. Gå till https://sentry.io
2. Skapa konto/logga in
3. Skapa nytt projekt: "DogPlanner"
4. Kopiera DSN från Settings → Client Keys
5. Sätt upp alerts för critical errors

## Alerts att konfigurera

- **Critical Errors**: Email vid alla exceptions
- **Performance**: Email om response time > 3s
- **User Impact**: Slack/Email om > 10 users påverkade
- **Release Health**: Email vid crash rate > 1%

## Best Practices

1. **Tag errors** med context:
   - `user_role`: customer, staff, admin
   - `page`: registration, booking, invoice
   - `org_id`: För företagsspecifika fel

2. **Add breadcrumbs**:

```typescript
Sentry.addBreadcrumb({
  category: "auth",
  message: "User logged in",
  level: "info",
});
```

3. **Set user context**:

```typescript
Sentry.setUser({
  id: user.id,
  email: user.email,
  org_id: profile.org_id,
});
```

4. **Filter sensitive data**:

```typescript
Sentry.init({
  beforeSend(event) {
    // Ta bort lösenord, tokens, etc
    if (event.request) {
      delete event.request.cookies;
      delete event.request.headers?.Authorization;
    }
    return event;
  },
});
```

## Cost Optimization

- **Free tier**: 5,000 errors/månad
- **Sampling**: Använd `tracesSampleRate: 0.1` i prod för att spara quota
- **Filter spam**: Ignorera kända bot errors

```typescript
Sentry.init({
  ignoreErrors: [
    "Non-Error promise rejection captured",
    "ResizeObserver loop limit exceeded",
    // Lägg till fler efter behov
  ],
});
```

---

**Status**: ⏳ REDO ATT INSTALLERA
**Prioritet**: 🔴 HÖRT (efter Error Boundaries)
**Tid**: ~30 min setup + 15 min test
