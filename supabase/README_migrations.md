# Supabase migrations added (2025-11-02)

This repo now separates organisation subscriptions from dog daycare subscriptions and adds grooming tables to match the UI.

## What was added

1. public.org_subscriptions

- Tracks the organisation's DogPlanner plan/status (trialing/active/past_due/canceled)
- Columns: org_id, plan, status, trial_starts_at, trial_ends_at, current_period_end, is_active, created_at, updated_at
- One active row per org (enforced by usage + partial index)

2. public.grooming_bookings

- Matches /frisor booking UI (appointment_date/time, service_type, estimated_price, status)

3. public.grooming_journal

- Matches /frisor journal UI (final_price, duration, notes, photos etc.)

See: supabase/migrations/2025-11-02_org_subscriptions_grooming.sql

## How to apply (Production / Supabase SQL editor)

1. Open Supabase → SQL Editor
2. Paste the full content of `supabase/migrations/2025-11-02_org_subscriptions_grooming.sql`
3. Run

The operation is `IF NOT EXISTS` safe and can be run repeatedly without harm.

## Code changes that depend on this

- app/api/subscription/status/route.ts now reads `org_subscriptions` for status/trial_ends_at
- app/api/onboarding/auto/route.ts creates a trial `org_subscriptions` row for a newly created org
- types/database.ts updated to:
  - add `profiles` table
  - add `org_subscriptions`
  - correct `subscriptions` to be dog-level (as in schema.sql)
  - add `grooming_bookings` and `grooming_journal`

## Keeping types in sync (recommended)

Use Supabase CLI to generate types from your live project to avoid drift:

```sh
# Install once
npm i -D supabase

# Or install globally if you prefer
# npm i -g supabase

# Generate types (replace with your project ref and anon key or service role)
# This command is an example; follow Supabase docs for your setup.
# supabase gen types typescript --project-id <PROJECT_REF> --schema public > types/database.ts
```

Alternatively, use the Dashboard → API → Generate Types and copy-paste into `types/database.ts`.
