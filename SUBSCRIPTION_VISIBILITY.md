# SUBSCRIPTION_VISIBILITY.md

## System för synlighet av organisationer baserat på abonnemang

**Senast uppdaterad:** 2025-12-06

---

### Syfte

Styr vilka organisationer som visas i kundportalen och ansökningsflöden beroende på abonnemangsstatus och om de accepterar nya ansökningar.

---

## Affärslogik

- **Synlig för kund:**
  - `subscription_status = 'active'` _och_ `accepting_applications = true`
- **Dold för kund:**
  - Om organisationen slutar betala (abonnemang inaktivt eller avslutat) → `accepting_applications = false`
  - Om organisationen återupptar betalning → `accepting_applications = true`

---

## Tekniska detaljer

### 1. Databas

- Kolumnen `accepting_applications` i tabellen `orgs` styr synlighet.
- Index för snabb filtrering:
  - `idx_orgs_accepting_applications` (endast accepterande orgs)
  - `idx_orgs_active_accepting` (kombinerad status + synlighet)
- Initial datauppdatering sätter rätt värde baserat på abonnemangsstatus.

### 2. Webhook (Stripe)

- Hanterar events:
  - `checkout.session.completed`
  - `invoice.payment_succeeded`
  - `invoice.payment_failed`
  - `subscription.deleted`
  - `subscription.updated`
- Logik:
  - Vid misslyckad betalning eller avslutat abonnemang → sätt `accepting_applications = false`
  - Vid lyckad betalning eller återaktiverat abonnemang → sätt `accepting_applications = true`

### 3. Frontend

- Alla kundlistor och ansökningsflöden filtrerar:
  - `.eq('accepting_applications', true)`
  - `.eq('subscription_status', 'active')`
- Gäller t.ex. OrganisationSelector, ansokan/hunddagis, ansokan/pensionat, kundportal/soka-hunddagis.

---

## Testflöde

1. Skapa/aktivera abonnemang → organisation syns i listor.
2. Låt betalning misslyckas eller avsluta abonnemang → organisation döljs.
3. Återuppta betalning → organisation syns igen.
4. Verifiera via SQL:
   ```sql
   SELECT id, org_name, subscription_status, accepting_applications FROM orgs ORDER BY org_name;
   ```
5. Kontrollera webhook-loggar för event och statusändring.

---

## Felsökning

- Om organisationer inte syns: kontrollera att både `subscription_status = 'active'` och `accepting_applications = true`.
- Om status inte uppdateras: kontrollera Stripe-webhook och eventlogik.
- Index och kolumnnamn måste matcha databasens schema.

---

## Vidare utveckling

- Systemet är utbyggbart för fler statusar och automatiska notifieringar.
- All logik är robust och långsiktigt hållbar enligt nuvarande affärsregler.

---

**Senaste migrering:**

- Se `supabase/migrations/20251206_org_accepting_applications.sql` för full SQL och index.

**Kontakt:**

- Systemansvarig: Cassandra Wikgren
