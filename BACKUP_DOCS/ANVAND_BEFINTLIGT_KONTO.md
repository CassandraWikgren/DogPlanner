# ✅ CHECKLISTA: Ditt befintliga konto

## Steg 1: Verifiera i Supabase Dashboard

1. Gå till: https://supabase.com/dashboard
2. Välj ditt projekt (det som används i produktion)
3. Gå till **SQL Editor**
4. Öppna `VERIFIERA_KONTO.sql` och kör Query 1 (byt ut e-postadressen)

### Förväntat resultat:

```
user_id        | abc-123-def-456
email          | din@email.se
registered_at  | 2025-10-15
org_id         | xyz-789-uvw-012  ← VIKTIGT: Ska INTE vara NULL
role           | admin
full_name      | Ditt Namn
org_name       | Ditt Företag AB
org_number     | 123456-7890
```

### ✅ Om org_id finns:

Du är redo att använda kontot både lokalt och på Vercel!

### ❌ Om org_id är NULL:

Ditt konto saknar organisation. Kör detta i SQL Editor:

```sql
-- 1. Skapa organisation (om den inte finns)
INSERT INTO orgs (name, org_number, email, vat_included, vat_rate)
VALUES (
  'Mitt Hunddagis',           -- Företagsnamn
  '123456-7890',              -- Påhittat org-nummer
  'din@email.se',             -- Din e-post
  true,
  25
)
RETURNING id;

-- 2. Kopiera det id som returneras (t.ex. xyz-789-uvw-012)

-- 3. Uppdatera din profil med org_id
UPDATE profiles
SET
  org_id = 'xyz-789-uvw-012',  -- ⬅️ Klistra in id från steg 2
  role = 'admin',
  full_name = 'Ditt Namn'
WHERE id IN (
  SELECT id FROM auth.users WHERE email = 'din@email.se'
);

-- 4. Verifiera
SELECT id, email, org_id, role FROM profiles
WHERE id IN (SELECT id FROM auth.users WHERE email = 'din@email.se');
```

---

## Steg 2: Logga in lokalt

1. **Starta dev-server** (om den inte kör):

   ```bash
   cd /Users/cassandrawikgren/Desktop/Dogplanner/dogplanner-backup-20251031_075031
   npm run dev
   ```

2. **Öppna browser:**

   ```
   http://localhost:3000/login
   ```

   (Om port 3000 är upptagen: http://localhost:3002/login)

3. **Logga in med samma uppgifter som på Vercel:**
   - E-post: din@email.se
   - Lösenord: ditt-lösenord

4. **Kontrollera i browser console (F12):**
   ```
   ✅ Användare hämtad: abc-123-def...
   ✅ Profil redan kopplad till org: xyz-789-uvw...
   ```

---

## Steg 3: Testa funktionalitet

### A) Kolla Dashboard

Efter inloggning ska du se:

- ✅ Ditt företagsnamn uppe till höger
- ✅ "Logga ut"-knapp
- ✅ Huvudmeny med Hunddagis, Pensionat, etc.

### B) Lägg till en hund

1. Gå till "Hunddagis" eller "Pensionat"
2. Klicka "Ny hund"
3. Fyll i:
   - Hundnamn: "Testdog"
   - Ras: "Golden Retriever"
   - Ägare: Skapa ny ägare med e-post
4. Spara

**Förväntad outcome:**

- ✅ Hunden syns i tabellen
- ✅ Ingen röd feltext "Du är inte inloggad eller saknar organisation"
- ✅ Console visar: "Hund skapad i databasen med ID: ..."

### C) Kolla att hunden syns på båda ställen

1. **Localhost:** Ladda om sidan → hunden ska finnas kvar
2. **Vercel:** Gå till https://dog-planner.vercel.app → samma hund ska synas där!

Detta bevisar att du använder samma databas 🎉

---

## Steg 4: Bekräfta organisation

Öppna browser console (F12) när du är inloggad:

```javascript
// I DevTools Console:
console.log("Current Org ID:", localStorage.getItem("currentOrgId"));
```

Eller kolla i Network-tab:

1. Tryck F12 → Network
2. Ladda om sidan
3. Klicka på en request (t.ex. "dogs")
4. Kolla Headers → org_id ska finnas i payload

---

## 🆘 Felsökning

### Problem: "Du är inte inloggad eller saknar organisation"

**Lösning 1: Kolla console (F12)**

```javascript
// Ska returnera ett UUID:
console.log(currentOrgId);

// Om NULL eller undefined:
// 1. Logga ut
// 2. Logga in igen
// 3. Kör VERIFIERA_KONTO.sql i Supabase
```

**Lösning 2: Kontrollera AuthContext**

```bash
# Browser console ska visa:
✅ Användare hämtad: abc-123...
✅ Profil redan kopplad till org: xyz-789...
✅ currentOrgId: xyz-789...

# Om du ser:
❌ Profil saknas eller inte kopplad till org
# → Kör SQL-fixar ovan för att skapa org och uppdatera profil
```

---

## 📋 Sammanfattning

### ✅ Du har ett befintligt konto på Vercel

- E-post: din@email.se
- Organisation: Ditt företag med påhittat org-nummer
- Roll: Admin

### ✅ Du kan använda samma konto lokalt

- Logga in på http://localhost:3000/login
- Samma e-post och lösenord
- Samma organisation och data

### ✅ Samma databas = Samma data

- Ändringar lokalt syns på Vercel
- Perfekt för att testa nya features
- Ingen risk att "förstöra" något - du kan alltid radera testdata i Supabase

### ❌ Du behöver INTE köra complete_testdata.sql

- Din databas är redan uppsatt
- Ditt konto fungerar
- Triggers är aktiva (förhoppningsvis - kolla med Query 5)

---

**Nästa steg:** Kör `VERIFIERA_KONTO.sql` i Supabase och se om allt ser bra ut! 🐾
