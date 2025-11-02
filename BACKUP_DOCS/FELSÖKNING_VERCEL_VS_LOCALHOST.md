# FELSÖKNING: Vercel vs Localhost — Slutstatus 2025-11-02

Det här dokumentet sammanfattar arbetet för att få produktionen (Vercel) att bete sig identiskt med utvecklingsmiljön (localhost), inklusive rotorsak, åtgärder och slutresultat.

## Bakgrund

- Visuella skillnader mellan localhost och Vercel (t.ex. textfärg som såg grå ut i produktion).
- Byggen började fallera när projektet råkade länkas till ett backup-projekt i Vercel utan nödvändiga miljövariabler (NEXT_PUBLIC_SUPABASE_URL/ANON_KEY, SUPABASE_SERVICE_ROLE_KEY).

## Åtgärder

1. Undvek build-time pre-render av e-posttest-endpointen genom att markera `app/api/test-email/route.ts` som dynamisk:
   - `export const dynamic = 'force-dynamic'`
   - `export const revalidate = 0`
2. Rättade felaktig Tailwind-användning i `app/globals.css` där `@apply` användes för icke-existerande utilitys (variabelbaserade). Ersattes med direkta CSS-värden (`hsl(var(--...))`).
3. Relänkade lokalt till rätt Vercel-projekt ("dog-planner") och verifierade miljövariabler i Vercel.
4. Genomförde ny deployment till produktion; deployment-status: Ready.
5. Lade till diagnostik-endpoint `app/api/env/route.ts` för att säkert visa vilken Supabase-projektref/host som används vid runtime.

## Resultat

- Produktion och localhost beter sig nu likadant.
- Inga kvarstående visuella skillnader noterade efter deploy.
- Deploymentflödet fungerar igen på korrekt Vercel-projekt med kompletta env-variabler.

## Så verifierar du miljöerna framöver

- Lokal: `http://localhost:3000/api/env` (eller `:3002` om porten är upptagen).
- Produktion: `https://dog-planner.vercel.app/api/env`.
- Jämför `supabase.projectRef` och `supabase.host`. Om de matchar är det samma Supabase-projekt. Om de skiljer sig, uppdatera env-variabler i Vercel.

## Lärdomar

- Undvik modulinitiering som läser env vid build om den endast behövs vid runtime (särskilt i API-routes). Markera routes som dynamiska vid behov.
- Säkerställ rätt Vercel-länkning innan deploy; verifiers ettor i `.vercel`-mappen och i Vercel UI.
- Använd direkta CSS-variabler i `globals.css` istället för `@apply` när utility-klasser inte existerar.

## Status 2025-11-02

- Allt fungerar och produktionen matchar utvecklingsmiljön.
- Eventuella framtida avvikelser kan snabbt kontrolleras via `/api/env`-endpointen och Tailwind-builden.
