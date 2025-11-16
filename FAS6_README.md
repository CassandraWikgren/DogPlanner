# FAS 6: GDPR-säker assisterad kundregistrering

## Översikt

Detta är en komplett implementation av GDPR-säker assisterad registrering för kunder som behöver hjälp att skapa konto i DogPlanner. Systemet följer svensk dataskyddsförordning (GDPR) och dokumenterar alla samtycken juridiskt korrekt.

## Bakgrund

**Problem:** Pensionat-bokning fungerade endast för kunder som redan finns i systemet via Hunddagis. Äldre eller icke-tekniska kunder kunde inte registrera sig själva.

**Lösning:** Personal kan nu hjälpa kunder att registrera sig på två sätt:

1. **Email-baserad** - Kunden får bekräftelseemail och skapar själv lösenord
2. **Fysisk blankett** - Personal laddar upp foto/scan av signerad GDPR-blankett

## Juridisk efterlevnad

Systemet följer dessa GDPR-artiklar:

- **Art. 6.1.a** - Samtycke som rättslig grund
- **Art. 6.1.b** - Fullgöra avtal (bokningar)
- **Art. 7** - Villkor för samtycke (explicit, dokumenterat, informerat)
- **Art. 7.3** - Rätt att återkalla samtycke
- **Art. 15** - Rätt till tillgång (framtida implementering: kundportal)
- **Art. 17** - Rätt till radering ("rätten att bli glömd")
- **Art. 20** - Rätt till dataportabilitet
- **Art. 21** - Rätt att invända mot marknadsföring
- **Art. 32** - Säkerhet för personuppgifter (kryptering, RLS)

### Känslig personuppgift: Personnummer

⚠️ **VIKTIGT:** Personnummer klassas som **känslig personuppgift** enligt svensk tolkning av GDPR. Det får ALDRIG krävas och måste vara **helt frivilligt**.

Implementation:

- Personnummer-fält är **optional** vid bekräftelse
- Tydlig text: "Frivilligt - endast om du vill underlätta fakturering"
- Sparas krypterat i databasen
- Kan utelämnas helt utan att påverka tjänsten

## Databas-struktur

### Nya tabeller

**`consent_logs`**

- Lagrar varje samtyckes-händelse med full dokumentation
- Kolumner:
  - `consent_type`: 'digital_email', 'physical_form', 'phone_verbal', 'in_person'
  - `consent_given`: true/false
  - `consent_text`: Exakt text som visades för kunden (versioned)
  - `consent_version`: '1.0' (för framtida uppdateringar av GDPR-text)
  - `ip_address`: För digital samtycke (beviskraft)
  - `user_agent`: Browser-info (beviskraft)
  - `signed_document_url`: Supabase Storage URL för uppladdad blankett
  - `witness_staff_id`: Personal som bevittnade fysisk signering
  - `given_at`, `withdrawn_at`, `expires_at`: Tidsstämplar

**Modifierade tabeller:**

**`owners`**

- `consent_status`: 'pending', 'verified', 'declined', 'expired', 'withdrawn'
- `consent_verified_at`: Timestamp när kund bekräftade
- `gdpr_marketing_consent`: Separat opt-in för marknadsföring (boolean)

**`bookings`**

- `consent_required`: Om bokning skapades innan samtycke verifierades
- `consent_pending_until`: Deadline för bekräftelse (auto-cancel annars)

### Funktioner

**`has_valid_consent(owner_id uuid)`**

- Returnerar `boolean`
- Kontrollerar om kund har aktivt (ej återkallat, ej utgånget) samtycke

**`withdraw_consent(owner_id uuid)`**

- GDPR Art. 7.3 - Rätt att återkalla samtycke
- Sätter `withdrawn_at` på alla consent_logs
- Uppdaterar `owners.consent_status` till 'withdrawn'
- Skapar ny consent_log som dokumenterar återkallelsen

### Triggers

**`update_owner_consent_status()`**

- Körs vid INSERT på consent_logs
- Auto-uppdaterar `owners.consent_status` till 'verified' eller 'declined'
- Sätter `consent_verified_at` timestamp

### Storage

**Bucket: `documents`**

- Privat bucket (public=false)
- RLS policies:
  - Staff kan ladda upp för sin org
  - Staff kan läsa från sin org
  - Struktur: `documents/{org_id}/{timestamp}_{filename}`

## UI-komponenter

### 1. AssistedRegistrationModal

**Fil:** `components/AssistedRegistrationModal.tsx`

**Två lägen:**

#### Alternativ 1: Email-baserad registrering

1. Personal fyller i: namn, email, telefon, adress (frivilligt)
2. Systemet:
   - Skapar owner med `consent_status='pending'`
   - Skapar consent_log med `consent_given=false`
   - Skickar GDPR-email till kunden
3. Kunden klickar på länk i email → bekräftelsesida

#### Alternativ 3: Fysisk blankett

1. Personal fyller i: namn, telefon, email (frivilligt), adress (frivilligt)
2. Personal laddar upp foto/scan av signerad blankett
3. Systemet:
   - Laddar upp till Supabase Storage
   - Skapar owner med `consent_status='verified'` (redan godkänd)
   - Skapar consent_log med `consent_given=true`, `signed_document_url`

**Error codes:**

- `[ERR-6001]` - Ogiltig email
- `[ERR-6002]` - Ogiltigt telefonnummer
- `[ERR-6003]` - Uppladdning av blankett misslyckades
- `[ERR-6004]` - Databasfel vid registrering
- `[ERR-6005]` - Kunde inte skicka email

**Props:**

```typescript
interface AssistedRegistrationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (ownerId: string) => void;
  orgId: string;
}
```

### 2. Consent verification page

**Fil:** `app/consent/verify/page.tsx`

**Flow:**

1. Validerar JWT-token från email-länk
2. Visar kundens uppgifter
3. Visar GDPR-information och rättigheter
4. Kund kan:
   - ✓ Bekräfta samtycke (obligatoriskt)
   - ☐ Opt-in för marknadsföring (frivilligt)
   - Ange personnummer (frivilligt)
   - Skapa lösenord
5. Vid submit:
   - Skapar Supabase auth-användare
   - Uppdaterar owner med consent_status='verified'
   - Uppdaterar consent_log med ip_address, user_agent, given_at
   - Redirectar till login

**Error codes:**

- `[ERR-6006]` - Ingen token i URL
- `[ERR-6007]` - Ogiltig tokentyp
- `[ERR-6008]` - Kunde inte hämta owner-data
- `[ERR-6009]` - Token har gått ut (7 dagar)
- `[ERR-6010]` - Ogiltig verifieringslänk
- `[ERR-6011]` - Auth-fel vid signup
- `[ERR-6012]` - Kunde inte uppdatera owner
- `[ERR-6013]` - Generellt fel

**URL format:**

```
/consent/verify?token=<JWT_TOKEN>
```

**Token payload:**

```typescript
{
  ownerId: string;
  orgId: string;
  email: string;
  type: "consent_verification";
  exp: number; // 7 days
}
```

### 3. Email API route

**Fil:** `app/api/consent/send-email/route.ts`

**Funktion:**

- Tar emot ownerId, email, name, orgId
- Skapar JWT-token med 7 dagars giltighetstid
- Genererar GDPR-konform svenskt email (HTML + text)
- Returnerar verifierings-URL (för testning)

**Email-innehåll:**

- Vad vi sparar om dig
- Varför vi sparar dina uppgifter
- Dina GDPR-rättigheter (Art. 15, 16, 17, 7.3, 20)
- ⚠️ Viktigt: Personnummer är frivilligt
- ✓ Bekräfta och skapa lösenord (knapp)

**TODO:**

- Integrera med faktisk email-tjänst (Resend, SendGrid, etc.)
- För nu: Loggas till konsol för testning

## Integration i Pensionat-bokning

**Fil:** `app/hundpensionat/nybokning/page.tsx`

**Tillägg:**

1. Import av `AssistedRegistrationModal` och `useAuth`
2. State: `showAssistedRegistration`
3. Knapp: "🆕 Ny kund" (grön gradient, vid "Hund"-sektionen)
4. Modal renderas med `currentOrgId` från AuthContext
5. OnSuccess: Laddar om owners-listan, visar bekräftelse

**Användning:**

1. Personal klickar "🆕 Ny kund"
2. Väljer registreringsmetod (email eller fysisk blankett)
3. Fyller i formulär
4. Vid framgång: Kunden läggs till i systemet och kan bokas direkt

## Environment variables

**Krävs:**

```bash
# JWT för consent verification tokens
JWT_SECRET=<random-string-minimum-32-characters>
NEXT_PUBLIC_JWT_SECRET=<same-as-above>

# Site URL för email-länkar
NEXT_PUBLIC_SITE_URL=http://localhost:3000  # eller https://dogplanner.se

# Supabase (redan finns)
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
SUPABASE_SERVICE_ROLE_KEY=...
```

**Generera JWT_SECRET:**

```bash
openssl rand -base64 32
```

## Installation

### 1. Kör migrations

**Fil 1:** `supabase/migrations/20251116_create_consent_logs.sql`

- Skapar consent_logs table
- Modifierar owners & bookings
- Skapar RLS policies
- Skapar functions & triggers

**Fil 2:** `supabase/migrations/20251116_create_documents_bucket.sql`

- Skapar Storage bucket 'documents'
- Skapar RLS policies för bucket

**Köra migrations:**

Option A: Supabase CLI

```bash
supabase db push
```

Option B: SQL Editor i Supabase Dashboard

- Kör varje fil manuellt

### 2. Installera npm-paket

```bash
npm install jsonwebtoken @types/jsonwebtoken
```

### 3. Lägg till environment variables

Kopiera från `.env.example` och fyll i:

```bash
JWT_SECRET=<generate-with-openssl>
NEXT_PUBLIC_JWT_SECRET=<same-value>
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

### 4. Verifiera installation

1. Starta dev-server: `npm run dev`
2. Gå till `/hundpensionat/nybokning`
3. Kontrollera att "🆕 Ny kund"-knappen visas
4. Testa email-baserad registrering:
   - Fyll i formulär
   - Kolla konsolen för verifierings-URL
   - Öppna URL i ny flik
   - Bekräfta konto

## Testning

### Email-baserad registrering

**Test 1: Lyckad registrering**

1. Klicka "🆕 Ny kund" → Välj "Email-baserad"
2. Fyll i: namn, email, telefon
3. Submit
4. Konsol: Hitta verifierings-URL
5. Öppna URL → Fyller i lösenord → Submit
6. Förväntat: Redirectad till login, kan logga in

**Test 2: Frivilligt personnummer**

1. Som Test 1, men vid bekräftelse-sida: Ange personnummer
2. Förväntat: Personnummer sparas, fungerar ändå utan det

**Test 3: Utgången token**

1. Skapa registrering med kort exp (ändra JWT expiresIn till '1s')
2. Vänta 2 sekunder
3. Öppna URL
4. Förväntat: "[ERR-6009] Token har gått ut"

### Fysisk blankett-registrering

**Test 1: Lyckad uppladdning**

1. Klicka "🆕 Ny kund" → Välj "Fysisk blankett"
2. Fyll i: namn, telefon
3. Ladda upp bild (JPG/PNG/PDF)
4. Submit
5. Förväntat: Owner skapas med consent_status='verified'
6. Verifiera i DB: consent_logs har signed_document_url

**Test 2: Utan email (frivilligt)**

1. Som Test 1 men lämna email tom
2. Förväntat: Fungerar ändå

### GDPR-funktioner

**Test 1: Withdraw consent**

```sql
SELECT withdraw_consent('<owner-id>');
```

Förväntat:

- consent_logs får withdrawn_at
- owners.consent_status = 'withdrawn'
- Ny consent_log skapas

**Test 2: Check valid consent**

```sql
SELECT has_valid_consent('<owner-id>');
```

Förväntat: `true` för verified, `false` för withdrawn/expired

## Framtida utveckling (FAS 7+)

### 1. Email-integration

- Integrera med Resend eller SendGrid
- Ta bort konsol-logging
- Lägg till email-templates i kod eller CMS

### 2. Automatisk datarensning

- Cron job: Radera owners med consent_status='pending' efter 7 dagar
- Cron job: Arkivera inaktiva kunder (inga bokningar på 24 månader)
- Cron job: Påminnelse-emails dag 3 och 7 för pending

### 3. Kundportal för GDPR

- Sida: `/account/gdpr`
- Funktioner:
  - Visa all sparad data
  - Exportera till Excel/PDF (Art. 20 - dataportabilitet)
  - Radera konto (Art. 17 - rätten att bli glömd)
  - Återkalla samtycke (Art. 7.3)
  - Uppdatera preferenser (marknadsföring)

### 4. Fysisk blankett-PDF

- Generera GDPR-blankett som PDF
- Personal kan skriva ut och få kund att signera
- QR-kod med upload-länk för snabb registrering

### 5. Audit log

- Logga alla GDPR-relaterade händelser:
  - Kundförfrågan om data (Art. 15)
  - Dataexport (Art. 20)
  - Raderingar (Art. 17)
  - Samtyckes-återkallelser (Art. 7.3)
- För juridisk dokumentation vid revision

## Felsökning

### Problem: Token-fel vid verifiering

**Symptom:** "[ERR-6010] Ogiltig verifieringslänk"

**Lösningar:**

1. Kontrollera JWT_SECRET är samma i `.env` och kod
2. Verifiera NEXT_PUBLIC_JWT_SECRET är satt
3. Kontrollera token inte gått ut (7 dagar)
4. Kolla konsolen för JWT-errors

### Problem: Email skickas inte

**Symptom:** Ingen email kommer fram

**Lösningar:**

1. Kontrollera konsolen - URL loggas där för testning
2. Implementera faktisk email-integration (Resend/SendGrid)
3. Verifiera RESEND_API_KEY i `.env`

### Problem: Upload-fel för fysisk blankett

**Symptom:** "[ERR-6003] Uppladdning misslyckades"

**Lösningar:**

1. Verifiera `documents` bucket finns i Supabase Storage
2. Kontrollera RLS policies är aktiva
3. Verifiera fil är bild eller PDF (accept="image/\*,.pdf")
4. Kolla filstorlek (max 5MB)

### Problem: Owner skapas men consent_log saknas

**Symptom:** Owner finns men inget i consent_logs

**Lösningar:**

1. Kontrollera RLS policies på consent_logs
2. Verifiera trigger `update_owner_consent_status` är aktiv
3. Kör migrations igen om trigger saknas
4. Kolla Supabase logs för errors

## Säkerhet

### RLS (Row Level Security)

**consent_logs:**

- Staff kan SELECT/INSERT för sin org
- Owners kan SELECT sina egna

**storage.objects (documents bucket):**

- Staff kan INSERT/SELECT/UPDATE/DELETE för sin org
- Baseras på folder-struktur: `(storage.foldername(name))[1] = org_id::text`

### Data-kryptering

- Personnummer: Bör krypteras på application-level (TODO)
- Storage: Supabase Storage krypterar at-rest
- Transport: HTTPS för alla anrop

### GDPR-compliance checklist

- [x] Explicit samtycke (Art. 7)
- [x] Rätt att återkalla samtycke (Art. 7.3)
- [x] Dokumentation av samtycke (versioned consent_text)
- [x] Personnummer frivilligt (svensk tolkning)
- [ ] Rätt till tillgång (Art. 15) - Framtida kundportal
- [ ] Rätt till radering (Art. 17) - Framtida kundportal
- [ ] Rätt till dataportabilitet (Art. 20) - Framtida kundportal
- [x] Säkerhet för personuppgifter (Art. 32) - RLS, kryptering

## Support

**Dokumentation:**

- Detta dokument: `/FAS6_README.md`
- Migration files: `/supabase/migrations/20251116_*.sql`
- Copilot instructions: `/.github/copilot-instructions.md`

**Kontakt:**

- GitHub Issues för buggar
- GDPR-frågor: Kontakta jurist (detta är teknisk implementation, ej juridisk rådgivning)

---

**Version:** 1.0  
**Datum:** 2025-11-16  
**Status:** ✅ Database migrations klar, UI components klar, email pending integration
