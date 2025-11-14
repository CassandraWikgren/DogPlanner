## DogPlanner — Quick guidance for AI coding agents

Follow these concise, actionable rules when editing or extending this repo.

- Framework & runtime: Next.js (App Router) + React + TypeScript. Version in package.json is Next ^15 and React ^19. Routes live under `app/`.
- Auth & DB: Supabase is the primary backend. Client helper is `lib/supabase.ts` and the app-level client is created in `app/layout.tsx` via `createClientComponentClient()`.
- Important env vars (required locally and on Vercel):
  - `NEXT_PUBLIC_SUPABASE_URL`
  - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
  - `SUPABASE_SERVICE_ROLE_KEY` (server-side uses)

- Start / build commands:
  - Dev: `npm run dev` (hot reload; README notes it may use port 3002 if 3000 is busy)
  - Build: `npm run build`
  - Start (prod): `npm run start`

- Database: Supabase schema and helpers are in the `supabase/` folder. If the DB is broken or empty, run `complete_testdata.sql` in Supabase SQL editor — it disables RLS/triggers that commonly block development and inserts canonical test data.

- Triggers & RLS: The project relies on several DB triggers (organisation assignment, anonymize triggers, invoice triggers). These often cause breakage in dev. If you see missing rows or "column does not exist" errors, check `complete_testdata.sql` and `check_current_status.sql`.

- PDF & server-side packages: The app uses `pdfkit`, `stream-buffers` and `qrcode` in server code (see `next.config.ts` for `serverExternalPackages` and `outputFileTracingIncludes`). When adding server code that requires native packages, mirror this pattern to ensure Vercel builds include the modules.

- Import aliases: `next.config.ts` defines aliases — prefer `@components`, `@lib`, `@context`, or `@` root imports when editing files.

- Conventions & patterns specific to this repo:
  - UI: Tailwind + Radix components living in `components/` and global styles in `app/globals.css`.
  - Auth: New registered users are auto-assigned to an organisation (triggered server-side). See `app/context/AuthContext` for client-side auth flows.
  - **🔒 CRITICAL: org_id Assignment System** (DO NOT MODIFY without understanding all 3 layers):
    - **Layer 1 (Primary)**: Database trigger `on_auth_user_created` → `handle_new_user()` creates org + profile with org_id from user_metadata (org_name, org_number, phone, full_name)
    - **Layer 2 (Fallback)**: `/api/onboarding/auto` creates org if trigger fails (called from AuthContext)
    - **Layer 3 (Healing)**: AuthContext's `refreshProfile()` calls `heal_user_missing_org()` RPC if org_id is NULL
    - **Why 3 layers?**: Past bugs caused "Ingen organisation tilldelad" errors. This triple-redundancy ensures users ALWAYS get org_id.
    - **Migration file**: `supabase/migrations/PERMANENT_FIX_org_assignment.sql` contains complete implementation and documentation
    - **Testing**: After ANY changes to auth/registration, verify: new user → check profiles.org_id is NOT NULL
  - Types: Strongly typed Supabase DB types live in `types/` (use `Database` generic when creating Supabase client).
  - Room calculations: Business rules for room sizing (Jordbruksverket) are implemented in `lib/roomCalculator.ts` — reference this when touching capacity logic.

- Debugging & developer workflows:
  - If server won't start, check ports with `lsof -i :3000` / `lsof -i :3002`.
  - To reproduce DB-related bugs locally, prefer running the SQL mentioned above in Supabase rather than trying to mutate the production DB.
  - `npm run build` surfaces TypeScript errors; use it to get full type-check output.

- Files to reference for common tasks (examples):
  - DB & data seeds: `complete_testdata.sql`, `supabase/current_schema.sql`, `create-rooms-table.sql`
  - App shell / Supabase client: `app/layout.tsx`, `lib/supabase.ts`
  - Business logic examples: `lib/roomCalculator.ts`, `lib/pricing.ts`, `lib/pensionatCalculations.ts`
  - Reusable components: `components/*`, UI helpers in `components/ui/`

- Small safety rules for automated edits:
  - Never alter `complete_testdata.sql` automatically without human review — it intentionally disables triggers/RLS.
  - **Never modify `handle_new_user()` trigger or `heal_user_missing_org()` function** — they are part of critical 3-layer org_id assignment system. See migration file for details.
  - Preserve import aliases and `next.config.ts` webpack alias entries.
  - When adding server-side dependencies, update `next.config.ts`'s `serverExternalPackages`/`outputFileTracingIncludes` if they are used in API routes.
  - **Pages requiring org_id**: If adding new page that uses `currentOrgId` from AuthContext, ALWAYS add else-case: `if (currentOrgId) { loadData(); } else { setLoading(false); }` to prevent infinite loading spinner.

If anything in these instructions is unclear or you want more coverage for a subsystem (PDFs, billing, or room rules), tell me which area and I will expand this file.
