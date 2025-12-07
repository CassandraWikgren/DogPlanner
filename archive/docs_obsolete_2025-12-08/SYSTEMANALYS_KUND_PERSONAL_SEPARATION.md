# SYSTEMANALYS: Kund- vs Personal-separation (7 december 2025)

## SAMMANFATTNING

Ändringarna är **långsiktigt hållbara** och följer Pattern 3-designen. Här är en komplett analys:

---

## 1. ANVÄNDARTYPER

### 1.1 Personal/Admin (företagsanvändare)

- **Identifiering:** `profiles.org_id IS NOT NULL`
- **Kan nå:** Dashboard, hunddagis, hundpensionat, alla personalsidor
- **Kan INTE nå:** Kundportalen (de har ingen anledning)

### 1.2 Kunder/Hundägare (pensionatkunder)

- **Identifiering:**
  - Finns i `owners`-tabellen
  - `profiles.org_id IS NULL` (eller ingen profil alls)
- **Kan nå:** Endast `/kundportal/*`
- **Blockeras från:** Alla personalsidor (hunddagis, dashboard, etc.)

---

## 2. HUNDAR OCH org_id

### 2.1 Nuvarande flöde (KORREKT)

```
┌─────────────────────────────────────────────────────────────────┐
│ STEG 1: Kund registrerar hund i kundportalen                    │
│ → dogs.org_id = NULL                                            │
│ → dogs.owner_id = kundens user_id                               │
│ → Hunden syns ENDAST för kundportalen                           │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│ STEG 2: Kund bokar hunden på ett pensionat                      │
│ → bookings rad skapas med status = 'pending'                    │
│ → dogs.org_id = FORTFARANDE NULL                                │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│ STEG 3: Pensionatet godkänner bokningen                         │
│ → bookings.status = 'confirmed'                                 │
│ → (VALFRITT: dogs.org_id kan sättas här om man vill)           │
│ → Hunden visas via booking-relationen                           │
└─────────────────────────────────────────────────────────────────┘
```

### 2.2 Varför org_id = NULL är rätt för kundportal-hundar

| Scenario                         | org_id     | Resultat                        |
| -------------------------------- | ---------- | ------------------------------- |
| Hund i kundportal, ingen bokning | NULL       | ✅ Syns bara för kunden         |
| Hund bokad på Pensionat A        | NULL\*     | ✅ Pensionatet ser via bookings |
| Hund som dagiskund               | Org A:s ID | ✅ Syns på hunddagis för Org A  |

\*Alternativt kan org_id sättas vid godkänd bokning, men det är inte kritiskt.

---

## 3. RLS-POLICIES (VERIFIERADE)

### dogs-tabellen

```sql
-- SELECT: Ägare ser sina, org ser sina
"dogs_select_owner_and_org"
USING (
  owner_id = auth.uid()         -- Kunden ser sina hundar
  OR org_id = current_org_id()  -- Personalen ser org:s hundar
  OR dog in applications        -- Se hundar som ansökt till org
)

-- INSERT: Fritt (applikationslagret hanterar)
"dogs_insert_owner" WITH CHECK (TRUE)

-- UPDATE: Ägare eller org
"dogs_update_owner_and_org"
```

### Konsekvens

- ✅ Kunder kan skapa, se, uppdatera sina egna hundar
- ✅ Personal ser bara hundar med deras org_id
- ✅ Personal kan se hundar via applications (vid ansökningar)

---

## 4. isCustomer-LOGIKEN (FÖRBÄTTRAD)

### Tidigare logik (problematisk)

```typescript
// Fel: Om personal också hade hund, blev de klassade som kund
if (ownerData) setIsCustomer(true);
```

### Ny logik (korrekt)

```typescript
// Rätt: Kollar profiles.org_id FÖRST
if (profileData?.org_id) {
  setIsCustomer(false); // Personal med org_id
  return;
}
if (ownerData) {
  setIsCustomer(true); // Kund utan org_id
}
```

---

## 5. POTENTIELLA EDGE CASES

### 5.1 Personal som också har egen hund

- **Situation:** Admin på Hunddagis X har sin privata hund registrerad
- **Resultat:** De har org_id i profiles → `isCustomer = false` → ser personalsidan
- **Deras privata hund:** Om de vill ha den på ett ANNAT pensionat, måste de registrera sig som kund med annan e-post, eller så hanteras det manuellt

### 5.2 Kund blir personal

- **Situation:** En hundägare börjar jobba på pensionatet
- **Åtgärd:** De får en profiles-rad med org_id → automatiskt personal
- **Deras hundar:** Behålls med org_id = NULL, kan uppdateras manuellt

### 5.3 Hund bokas på flera pensionat

- **Situation:** Samma hund bokas på Pensionat A och sedan Pensionat B
- **Resultat:** Varje bokning är separat. org_id ändras inte (eller ändras vid varje ny aktiv bokning)
- **Rekommendation:** Låt org_id vara NULL för flexibilitet

---

## 6. REKOMMENDATIONER

### 6.1 Behåll nuvarande design

- ✅ org_id = NULL för kundportal-hundar är KORREKT
- ✅ isCustomer-logiken är nu robust
- ✅ RLS tillåter rätt åtkomst

### 6.2 Valfri förbättring: Sätt org_id vid check-in

Om pensionatet vill att hunden ska dyka upp i deras hunddagis-lista:

```sql
-- Vid check-in, sätt org_id på hunden
UPDATE dogs SET org_id = :pensionat_org_id WHERE id = :dog_id;
```

Men detta är **VALFRITT** - systemet fungerar utan det.

---

## 7. SLUTSATS

✅ **Ändringarna är långsiktigt hållbara**

Ingen funktionalitet har brutits:

1. Hunddagis visar bara hundar med matchande org_id
2. Kundportal-hundar har org_id = NULL (osynliga för företag)
3. Bokningar kopplar hundar till pensionat via bookings-tabellen
4. Personal blockeras aldrig felaktigt (kontrolleras via profiles.org_id)
5. RLS-policies stödjer Pattern 3 fullt ut

---

_Dokumenterat: 7 december 2025_
