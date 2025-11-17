# ✅ Juridiska Dokument - DogPlanner

## STATUS: KOMPLETT (7/7 dokument skapade)

**Skapad:** 17 november 2025  
**Total storlek:** ~5800 rader professionell juridisk dokumentation  
**B2C:** 3/3 ✅ | **B2B:** 4/4 ✅

---

## 📄 Skapade dokument

### För Hundägare (B2C)

1. ✅ **Integritetspolicy** - 756 rader  
   `/legal/privacy-policy-customer` | GDPR Art. 6, 7, 15-17, 20, 21, 30, 32

2. ✅ **Användarvillkor** - 727 rader  
   `/legal/terms-customer` | 14 sektioner | Tydlig ansvarsbegränsning

3. ✅ **Cookie-policy** - 487 rader  
   `/legal/cookies` | 4 kategorier | Cookietabell | e-privatlagen

### För Företag (B2B)

4. ✅ **Integritetspolicy för Företag** - 930 rader  
   `/legal/privacy-policy-business` | Företagsdata vs hundägardata

5. ✅ **Allmänna Villkor (SaaS)** - 1280 rader  
   `/legal/terms-business` | Prisplaner | 3 mån gratis provperiod

6. ✅ **Personuppgiftsbiträdesavtal (PUB)** - 1320 rader ⚠️ KRITISK  
   `/legal/pub-agreement` | GDPR Art. 28 | Obligatoriskt för B2B

7. ✅ **Servicenivåavtal (SLA)** - 930 rader  
   `/legal/sla` | Uptime-garantier | Supportnivåer | Servicekrediter

---

## 🔧 Implementation (Nästa steg)

### 1. Fyll i placeholders (30 min)

Alla dokument innehåller:

```
[DITT ORG-NR]
[DIN ADRESS]
[DITT TELEFONNUMMER]
[DIN HEMORTS TINGSRÄTT]
```

**Sök:** `grep -r "\[DITT\|DIN\]" app/legal/`

### 2. Skapa e-postadresser (15 min)

- privacy@dogplanner.se
- dpo@dogplanner.se
- support@dogplanner.se
- faktura@dogplanner.se
- sales@dogplanner.se

### 3. React-komponenter (4 timmar)

```
components/legal/
  ├── LegalCheckbox.tsx    (Samtycke-checkbox)
  ├── LegalModal.tsx       (Visa dokument i modal)
  └── LegalFooter.tsx      (Footer med länkar)
```

### 4. Integrera i flöden (3 timmar)

- Register (hundägare): Samtycke privacy + terms
- Onboarding (företag): Samtycke privacy + terms + PUB
- Bokning: Samtycke (första gången)

### 5. Spåra samtycke (1 timme)

```typescript
// POST /api/consent
{
  agreementType: 'privacy_customer',
  version: '1.0'
}
// Sparar i consent_agreements med IP + user agent
```

### 6. Status-sida (4 timmar eller extern tjänst)

- status.dogplanner.se
- Verktyg: Statuspage.io, Upptime, eller Cachet

---

## 📊 Detaljer per dokument

### Integritetspolicy Hundägare (B2C)

**Omfattar:**

- 12 sektioner
- Vad samlas: Kontakt, hund, bokning, tekniskt
- Varför: Avtal, lag, berättigat intresse, samtycke
- Vem delas med: Anläggningar, teknikleverantörer, myndigheter
- Var: EU-only (Frankfurt, Stockholm)
- Hur länge: 3 år persondata, 7 år bokföringsdata
- Rättigheter: Tillgång, rättelse, radering, portabilitet, invändning
- Klagomål: IMY kontaktinfo

### Användarvillkor Hundägare (B2C)

**Omfattar:**

- 14 sektioner
- Definitioner
- Bokningsflöde: Ansökan → Godkännande → Bindande avtal
- Betalning: Förskott/efterskott per anläggning
- Ansvar hundägare: Korrekt info, vaccinationer, försäkring
- Ansvar anläggning: Säkerhet, tillsyn, omvårdnad
- **Ansvar DogPlanner: BEGRÄNSAT** (plattform endast, max 5000 kr)
- Tvistlösning: Support → ARN → Tingsrätt

**Viktigt:** Tydligt separerar DogPlanners ansvar från anläggningens ansvar.

### Cookie-policy

**Omfattar:**

- 8 sektioner
- **Nödvändiga** (kan ej avböjas): supabase-auth-token, session, csrf
- **Funktionella**: språk, cookie-consent
- **Analytiska** (kräver samtycke): \_ga, \_gid (Google Analytics)
- **Marknadsföring**: Används ej ännu
- Cookietabell med namn, typ, giltighetstid
- Hantering via webbläsare (länkar till Chrome, Firefox, Safari, Edge)
- Tredjepartsleverantörer: Supabase, Google Analytics

### Integritetspolicy Företag (B2B)

**Omfattar:**

- 13 sektioner
- **Viktig distinktion:**
  - Företagsuppgifter → DogPlanner = Personuppgiftsansvarig (denna policy)
  - Hundägardata → DogPlanner = Personuppgiftsbiträde (se PUB)
- Företagsinfo, kontaktpersoner, fakturering, tekniskt
- Rättslig grund: Avtal, lag, berättigat intresse, samtycke
- Underbiträden med DPA: Supabase, Vercel, Resend, Stripe
- Var: EU-only (Frankfurt, Stockholm)
- Lagringstider: 3 år företagsinfo, 7 år fakturor
- Dataskyddsombud: dpo@dogplanner.se

### Allmänna Villkor Företag (B2B/SaaS)

**Omfattar:**

- 13 sektioner
- **Tjänstebeskrivning:** SaaS-plattform med bokningshantering, hundregister, fakturering, kundportal
- **Provperiod:** 🎁 3 månader gratis (Professional)
- **Prisplaner:**
  - Free: 0 kr/mån (max 5 hundar)
  - Basic: 299 kr/mån (max 50 hundar)
  - Professional: 799 kr/mån (obegränsat) ⭐ POPULÄRAST
  - Enterprise: Kontakta oss
- **GDPR-ansvar:** Kunden = Personuppgiftsansvarig, DogPlanner = Personuppgiftsbiträde
- **Åtaganden:** 99.5% tillgänglighet (strävan), backup daglig/veckovis/månatlig
- **Ansvarsbegränsning:** Free/Basic max 10k kr, Pro max 6 mån avgift
- **Uppsägning:** 30 dagar (månatlig), 30 dagar export efter uppsägning

### Personuppgiftsbiträdesavtal - PUB (B2B)

⚠️ **KRITISKT DOKUMENT** - Juridiskt obligatoriskt enligt GDPR Art. 28

**Omfattar:**

- 16 sektioner
- **Rollförklaring:** NI (Personuppgiftsansvarig) vs DOGPLANNER (Personuppgiftsbiträde)
- **Avtalsföremål:**
  - Syfte: 6 tjänster
  - Art: Lagring, visning, ändring, radering
  - Registrerade: Hundägare, kontakter, veterinärer
  - Personuppgifter: Tabell med känslighetsmarkering
- **Biträdets skyldigheter (GDPR Art. 32):**
  - Behandla endast enligt instruktioner
  - Sekretess
  - Tekniska åtgärder: Kryptering (TLS 1.3, AES-256), åtkomstkontroll (RBAC, 2FA), övervakning (24/7), backup
  - Stöd vid dataskyddsrättigheter (Art. 15-22)
  - Stöd vid DPIA (Art. 35)
- **Underbiträden med DPA:**
  - Supabase (Frankfurt | ISO 27001, SOC 2)
  - Vercel (Stockholm/Frankfurt | SOC 2)
  - Resend (EU via AWS)
  - Stripe (Irland | PCI DSS Level 1)
- **Överföring tredje land:** NEJ - All data i EU
- **Incidenter:** Rapportering inom 24h till kund, kund rapporterar till IMY inom 72h
- **Lagringstid:** 3-7 år beroende på typ
- **Revision:** Kundens rätt 1 gång/år, 30 dagar varsel
- **Ansvar:** Fördelning av IMY-böter
- **Kundens skyldigheter:** Rättslig grund, information, samtycke, dataminimering, rättigheter
- **Vid avtalets upphörande:** Återlämning (export) eller radering (30 dagar), bokföringsdata 7 år

**Juridisk betydelse:** Utan detta avtal är det olagligt att använda DogPlanner för hundägardata.

### Servicenivåavtal - SLA (B2B)

**Omfattar:**

- 11 sektioner
- **Tillgänglighetsgaranti:**
  - Free: Ingen garanti
  - Basic: 99.0% (~7.2h/mån)
  - Professional: 99.5% (~3.6h/mån)
  - Enterprise: 99.9% (~43 min/mån)
- **Supportnivåer:**
  - Free: FAQ, Community
  - Basic: E-post (48h kritiskt)
  - Professional: E-post + Chat (4h kritiskt) ⭐
  - Enterprise: Dedikerad manager + Telefon (1h kritiskt, 24/7)
- **Prioritetsnivåer:**
  - P1 Kritisk: Plattformen nere
  - P2 Hög: Viktiga funktioner ej fungerande
  - P3 Normal: Mindre buggar
  - P4 Låg: Kosmetiskt, önskemål
- **Planerat underhåll:** Tisdag/Torsdag 02:00-05:00, 48h varsel, <15 min
- **Prestanda:** Sidladdning <2s, API read <200ms, API write <500ms
- **Servicekrediter vid SLA-brott:**
  - Basic: 10-25% rabatt
  - Professional: 10-50% rabatt
  - Enterprise: 10-100% rabatt + eskalering
- **Statussida:** status.dogplanner.se (offentlig)
- **Eskalering:** L1 (support) → L2 (specialist) → L3 (CTO)

---

## 🎯 Prioriterad implementation

### Fas 1 - Innan lansering (5 timmar)

1. Fyll i placeholders → 30 min
2. Skapa e-postadresser → 15 min
3. Skapa Legal Checkbox → 1h
4. Integrera i register/onboarding → 2h
5. Spåra samtycke (API) → 1h
6. Lägg till footer → 30 min

### Fas 2 - Första veckan (3 timmar)

7. Skapa LegalModal → 2h
8. Uppdatera e-postmallar → 1h

### Fas 3 - När tid finns (4 timmar)

9. Skapa status-sida → 4h (eller extern tjänst: Statuspage.io, Upptime)

---

## 📞 Kontakt & Support

**Teknisk implementation:**  
När e-postadresser skapats: support@dogplanner.se

**Juridisk granskning:**  
Rekommenderar att låta jurist granska dokumenten innan lansering.

**GDPR-specifika frågor:**  
Integritetsskyddsmyndigheten (IMY): www.imy.se

---

**Version:** 1.0  
**Status:** ✅ KOMPLETT - Redo för implementation  
**Senast uppdaterad:** 17 november 2025
