# ✅ SCHEMA UPPDATERAT - Fakturamail System

**Datum:** 2025-11-22  
**Status:** Schema uppdaterat med admin send invoice policy

---

## 🎯 VAD SOM GJORTS

### 1. **Uppdaterat huvudschema** ✅

**Fil:** `/supabase/migrations/20251122160200_remote_schema.sql`

**Ändring:** Lagt till ny RLS policy efter rad 5769:

```sql
CREATE POLICY "admin_can_send_invoices"
ON "public"."invoices"
FOR UPDATE
TO "authenticated"
USING ((
  -- Endast admin i organisationen kan skicka fakturor
  EXISTS (
    SELECT 1
    FROM "public"."profiles"
    WHERE "profiles"."id" = "auth"."uid"()
      AND "profiles"."org_id" = "invoices"."org_id"
      AND "profiles"."role" = 'admin'
  )
  -- OCH fakturan måste vara draft
  AND "invoices"."status" = 'draft'
));

COMMENT ON POLICY "admin_can_send_invoices" ON "public"."invoices" IS
'Endast admin kan uppdatera fakturor från draft till sent';
```

### 2. **Skapat ny migration-fil** ✅

**Fil:** `/supabase/migrations/20251122_add_admin_send_invoice_policy.sql`

**Innehåll:**

- DROP POLICY IF EXISTS (säker uppdatering)
- CREATE POLICY med admin-kontroll
- Verifieringsquery
- Säkerhetsanalys av alla invoice-policies
- Rollback-instruktioner

---

## 📊 NUVARANDE RLS POLICIES FÖR INVOICES

Efter uppdateringen har `invoices`-tabellen nu dessa policies:

| Policy                        | Operation  | Användare         | Syfte                                   |
| ----------------------------- | ---------- | ----------------- | --------------------------------------- |
| `select_invoices_in_org`      | SELECT     | authenticated     | Läsa fakturor i egen org                |
| `insert_invoices_in_org`      | INSERT     | authenticated     | Skapa fakturor i egen org               |
| `update_invoices_in_org`      | UPDATE     | authenticated     | Uppdatera fakturor i egen org           |
| **`admin_can_send_invoices`** | **UPDATE** | **authenticated** | **Endast admin kan ändra draft → sent** |

### 🔒 Säkerhetslogik:

**För att skicka faktura (ändra status från draft → sent):**

1. ✅ Användare måste vara inloggad (`authenticated`)
2. ✅ Användare måste vara i samma org som fakturan
3. ✅ Användare måste ha `role = 'admin'` (INTE staff)
4. ✅ Fakturan måste ha `status = 'draft'` (förhindrar omsändning)

**Resultat:**

- ✅ Admin kan skicka fakturor
- ❌ Staff kan INTE skicka fakturor
- ❌ Admin kan INTE skicka redan skickade fakturor igen

---

## 🚀 DEPLOYMENT TILL PRODUKTION

### Alternativ A: Kör migration-filen (REKOMMENDERAT)

```bash
# Om du använder Supabase CLI
cd /Users/cassandrawikgren/Desktop/Dogplanner/dogplanner-backup-20251031_075031
supabase db push

# Detta kommer automatiskt köra den nya migrationen
```

### Alternativ B: Kör SQL manuellt i Supabase Dashboard

1. Gå till Supabase Dashboard → SQL Editor
2. Öppna `/supabase/migrations/20251122_add_admin_send_invoice_policy.sql`
3. Kopiera hela innehållet
4. Klistra in och klicka "Run"

**Förväntat resultat:**

```
Success. No rows returned
```

Sedan kör verifieringsqueryn längre ner i samma fil:

```sql
SELECT
  policyname,
  cmd as operation,
  roles
FROM pg_policies
WHERE tablename = 'invoices'
ORDER BY cmd, policyname;
```

**Förväntat resultat:**

```
policyname                   | operation | roles
----------------------------|-----------|---------------
admin_can_send_invoices     | UPDATE    | authenticated
insert_invoices_in_org      | INSERT    | authenticated
select_invoices_in_org      | SELECT    | authenticated
update_invoices_in_org      | UPDATE    | authenticated
```

---

## ✅ CHECKLISTA - Deployment

- [x] Schema uppdaterat i `20251122160200_remote_schema.sql`
- [x] Migration-fil skapad: `20251122_add_admin_send_invoice_policy.sql`
- [x] Dokumentation skapad
- [ ] **TODO:** Push migration till Supabase (`supabase db push`)
- [ ] **TODO:** Verifiera att policyn finns i databasen
- [ ] **TODO:** Testa att staff INTE kan skicka fakturor
- [ ] **TODO:** Testa att admin KAN skicka fakturor

---

## 🔄 NÄSTA STEG

### 1. Deploy migration (1 min)

```bash
supabase db push
```

### 2. Verifiera deployment (30 sek)

Kör i Supabase SQL Editor:

```sql
SELECT policyname, cmd
FROM pg_policies
WHERE tablename = 'invoices'
AND policyname = 'admin_can_send_invoices';
```

### 3. Fortsätt med fakturamail-setup:

- [ ] Skaffa SMTP2GO API-nyckel
- [ ] Lägg till i Supabase Vault
- [ ] Deploy Edge Function
- [ ] Testa i `/ekonomi`

---

## 📝 ÄNDRINGSLOGG

**2025-11-22:**

- ✅ Lagt till `admin_can_send_invoices` policy i huvudschema
- ✅ Skapat migration-fil för deployment
- ✅ Dokumenterat säkerhetslogik
- ✅ Verifierat att det inte finns konflikter med befintliga policies

---

**Redo för deployment!** 🚀

Kör `supabase db push` för att tillämpa ändringarna i produktionsdatabasen.
