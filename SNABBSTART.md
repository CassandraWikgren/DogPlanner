# 🚀 SNABBSTART - Kör detta för att få allt att fungera

## ✅ EN fil att köra: `complete_testdata.sql`

### Vad gör den?

1. **Tar bort triggers och RLS** (som ofta krånglar i dev)
2. **Lägger till ALLA saknade kolumner** (personnummer, försäkring, email-config, etc.)
3. **Skapar ALLA nya tabeller** (interest_applications, subscription_types, etc.)
4. **Rensar gammal testdata**
5. **Lägger in komplett ny testdata**:
   - ✅ Organisation: "Bella Hunddagis" (demo)
   - ✅ Email: info@belladagis.se, kontakt@, faktura@
   - ✅ Priser: 6st (heltid + deltid för 3 storleksintervall)
   - ✅ Ägare: 2st (Anna, Bengt)
   - ✅ Hundar: 2st (Bella, Max)
   - ✅ Ansökningar: 3st (Luna=pending, Rex=contacted, Charlie=accepted)
   - ✅ Tjänster: 2st (kloklipp + tassklipp)

---

## 📋 Steg-för-steg

### 1. Öppna Supabase

```
https://supabase.com/dashboard/project/DIN-PROJECT-ID
```

### 2. Gå till SQL Editor

```
Sidebar → SQL Editor → New query
```

### 3. Kopiera innehållet från:

```
complete_testdata.sql
```

### 4. Kör SQL

```
Klicka "Run" (eller Cmd/Ctrl + Enter)
```

### 5. Verifiera output

Du ska se:

```sql
=== SUCCESS! ===
orgs_count: 1
owners_count: 2
dogs_count: 2
applications_count: 3
prices_count: 6
services_count: 2
system_config_count: 4

=== ORGANISATION ===
Bella Hunddagis | info@belladagis.se | kontakt@belladagis.se | demo

=== ÄGARE ===
Anna Andersson | anna@example.com | Stockholm
Bengt Bengtsson | bengt@example.com | Göteborg

=== HUNDAR ===
Bella | Golden Retriever | heltid | Anna Andersson
Max | Border Collie | deltid_3 | Bengt Bengtsson

=== INTRESSEANMÄLNINGAR ===
Maria Svensson | Luna | pending
Erik Andersson | Rex | contacted
Lisa Johansson | Charlie | accepted ← REDO ATT ÖVERFÖRA

=== PRISER ===
heltid | 0-35 | 4500 SEK
heltid | 36-50 | 5200 SEK
heltid | 51-999 | 5900 SEK
...
```

---

## ✅ Testa att allt fungerar

### 1. Gå till hunddagis

```
http://localhost:3000/hunddagis
```

Ska visa:

- 📊 2 dagishundar (Bella + Max)
- 📧 3 intresseanmälningar
- 💰 Priser (klicka på "Mina priser")

### 2. Gå till intresseanmälningar

```
http://localhost:3000/hunddagis/intresseanmalningar
```

Ska visa:

- Luna (pending) - gul
- Rex (contacted) - blå
- Charlie (accepted) - grön ← **TESTA ÖVERFÖRA DENNA**

### 3. Testa överföringsfunktionen

1. Klicka på Charlie (status = accepted)
2. Scrolla ner till "Överföring till Hunddagis"
3. Ska visa preview med Lisa Johansson + Charlie
4. Klicka "Överför till Hunddagis"
5. Bekräfta i dialogen
6. ✅ Success! Charlie ska nu finnas i hunddagis-listan

### 4. Gå till företagsinformation

```
http://localhost:3000/foretagsinformation
```

Klicka på "Email-inställningar" tab:

- Ska visa: kontakt@belladagis.se
- Ska visa: faktura@belladagis.se
- Du kan ändra dessa

### 5. Gå till priser

```
http://localhost:3000/hunddagis/priser
```

Ska visa 6 priser:

- Heltid: 0-35cm (4500 kr), 36-50cm (5200 kr), 51+cm (5900 kr)
- Deltid 3: 0-35cm (3200 kr), 36-50cm (3700 kr), 51+cm (4200 kr)

---

## 🎯 Sammanfattning

### Gamla systemet (innan):

```
❌ Många små SQL-filer att hålla koll på
❌ Osäkert vilken ordning de ska köras
❌ Lätt att missa något
❌ Olika versioner av testdata
```

### Nya systemet (nu):

```
✅ EN fil: complete_testdata.sql
✅ Kör allt i rätt ordning automatiskt
✅ Inkluderar ALLT: kolumner, tabeller, testdata
✅ Verifierar sig själv i slutet
✅ Visar vad som skapades
```

---

## 🔧 Felsökning

### Problem: "relation does not exist"

**Lösning:** Tabellen finns inte. Kör hela complete_testdata.sql igen.

### Problem: "column does not exist"

**Lösning:** Kolumnen saknas. Kör hela complete_testdata.sql igen.

### Problem: "duplicate key value"

**Lösning:** Data finns redan. SQL:en gör TRUNCATE först, så det ska inte hända.
Kör:

```sql
TRUNCATE public.orgs CASCADE;
```

Sedan kör complete_testdata.sql igen.

### Problem: "permission denied"

**Lösning:** RLS är aktiverad. SQL:en inaktiverar RLS automatiskt.

---

## 📁 Filer att IGNORERA

Dessa filer behövs INTE längre (allt finns i complete_testdata.sql):

- ❌ create-interest-applications.sql (borttagen)
- ❌ add-email-configuration.sql (borttagen)
- ❌ hunddagis_schema_update.sql (integrerat)
- ⚠️ direct_testdata.sql (gammal version)
- ⚠️ simple_testdata.sql (gammal version)

**Du behöver bara:** `complete_testdata.sql` ✅

---

**KLART! Kör complete_testdata.sql och allt fungerar! 🎉**
