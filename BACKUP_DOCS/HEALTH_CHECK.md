# Health check – snabb verifiering av miljöer

Syfte: Ge ett kort, säkert sätt att verifiera att localhost och Vercel använder samma miljö och att UI beter sig likadant.

## 1) Kontrollera Supabase-projekt (utan hemligheter)

- Lokal: http://localhost:3000/api/env (om 3000 är upptagen: :3002)
- Produktion: https://dog-planner.vercel.app/api/env

Som standard är endpointen avstängd i produktion:

- Den returnerar 404 på Vercel om du inte explicit aktiverar den med `NEXT_PUBLIC_ENABLE_ENV_ROUTE="true"` i Vercel.
- I lokal utveckling är den påslagen (ingen hemlig data visas, bara host/projektref).

JSON-nycklar:

- `supabase.host` – exempel: `abcd1234.supabase.co`
- `supabase.projectRef` – exempel: `abcd1234`
- `nodeEnv`, `vercel`, `vercelUrl`, `vercelProjectName`

Matcha `projectRef` mellan lokal och produktion för att säkerställa att båda pekar mot samma Supabase-projekt.

## 2) Vanliga UI-avvikelser och snabba kontroller

- Tailwind-variabler: Kontrollera att globala färgvariabler används via `hsl(var(--...))` i `app/globals.css` (inte via `@apply` på icke-existerande utilities).
- Temat: Kontrollera att bakgrund/text/border inte påverkas av ofrivillig opacitet eller alpha.
- Safelist: Om någon klass saknas i produktion, lägg till den i safelist (tailwind.config.js) eller använd statiska classNames.

## 3) Miljövariabler

Obligatoriska:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY` (server)

Tips:

- Se till att rätt Vercel-projekt är länkat i `.vercel/project.json`.
- Verifiera envs i Vercel Dashboard → Settings → Environment Variables.

## 4) Snabb felsökning av dataflöde

- “Inte inloggad eller saknar organisation” – kontrollera att användaren har `org_id` kopplat i profiler och att RLS/triggers inte hindrar inserts.
- Om testdata saknas eller triggers blockerar: kör `complete_testdata.sql` i Supabase SQL Editor (skapar data och avaktiverar problematiska triggers i dev).

## 5) Aktivera env-endpoint i produktion (tillfälligt)

Sätt i Vercel (Environment Variables):

- `NEXT_PUBLIC_ENABLE_ENV_ROUTE = true`

Deploya om. Gå till `/api/env`, jämför `projectRef`, stäng sedan av igen genom att ta bort variabeln.

---

Dokumentet är fristående från README och kan uppdateras vid behov utan risk för produktionsflödet.
