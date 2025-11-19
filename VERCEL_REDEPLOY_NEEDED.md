# Vercel Redeploy Krävs

**Datum:** 2025-11-19  
**Anledning:** Nya funktioner har lagts till som kräver redeploy

## Problem som rapporterats:

1. ❌ Kapitalisering fungerar inte (malin olsson → Malin Olsson)
2. ❌ Väntelistan visar samma hundar som "Våra hundar"

## Rot-orsak:

- Kod är korrekt pushad till GitHub
- `capitalize()` funktion finns och används korrekt
- Vercel cachar gamla build-artifakter

## Lösning:

### Steg 1: Force redeploy på Vercel

1. Gå till https://vercel.com/cassandrawikgren/dogplanner
2. Klicka på "Deployments"
3. Klicka på senaste deployment
4. Klicka "Redeploy" → "Redeploy with existing Build Cache cleared"

ELLER

### Steg 2: Push en ny commit (tvingar rebuild)

```bash
git commit --allow-empty -m "Force Vercel rebuild - clear cache"
git push origin main
```

## Verifiering efter deploy:

- [ ] Hundnamn visas med stor bokstav (Malin Olsson, Bonnie, Aussie)
- [ ] Raser visas med stor bokstav (Beagle, Basenji)
- [ ] Väntelistan fungerar korrekt (endast hundar med waitlist=true)
- [ ] ApplicationCard-komponenten visas korrekt

## Teknisk info:

- **capitalize()** funktion: `lib/textUtils.ts`
- Används i: `app/hunddagis/page.tsx`, `components/ApplicationCard.tsx`
- Senaste commit: `efe1fec` - Modern väntelista tracking system

---

**OBS:** Detta är ett känt problem med Vercel's caching. Samma issue uppstår ofta efter större uppdateringar.
