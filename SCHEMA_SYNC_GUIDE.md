# 🔄 HÅLL SCHEMA SYNKAT MED SUPABASE

## Problem

Jag (AI) kan inte koppla mig direkt till din Supabase databas. Men vi kan hålla schemat lokalt uppdaterat!

## ✅ Lösning: Automatisk schema-sync

### Setup (EN GÅNG):

1. **Länka projektet till Supabase:**

```bash
cd /Users/cassandrawikgren/Desktop/Dogplanner/dogplanner-backup-20251031_075031
supabase link
```

Du får välja projekt från en lista eller ange project-ref manuellt.

2. **Hitta din project-ref:**

- Öppna Supabase Dashboard
- Settings → General → Reference ID
- T.ex: `abcdefghijklmnop`

---

### Användning (VARJE GÅNG du ändrar något i Supabase):

**Alternativ 1: Använd scriptet** (enklast)

```bash
./update-schema.sh
```

**Alternativ 2: Manuellt**

```bash
supabase db pull
```

---

## 🎯 Workflow framåt:

### När du gör ändringar i Supabase Dashboard:

1. Kör SQL i Supabase SQL Editor
2. Kör `./update-schema.sh` lokalt
3. Jag kan då läsa det uppdaterade schemat från `supabase/schema.sql`

### När du gör ändringar via migrations:

1. Skapa migration: `supabase migration new my_change`
2. Skriv SQL i migrations-filen
3. Deploya: `supabase db push`
4. Schema uppdateras automatiskt

---

## 📋 Vad jag kan se när schemat är synkat:

✅ Alla tabeller och kolumner
✅ Alla indexes och foreign keys  
✅ Alla funktioner och triggers
✅ Alla RLS policies
✅ Alla views

Detta gör att jag kan:

- Ge exakta SQL-queries
- Förstå relationerna mellan tabeller
- Föreslå optimeringar
- Debugga problem

---

## 🚀 Nästa steg:

**När Supabase maintenance är klar:**

1. Kör detta för att länka projektet:

```bash
cd /Users/cassandrawikgren/Desktop/Dogplanner/dogplanner-backup-20251031_075031
supabase link --project-ref [fhdkkkujnhteetllxypg]
```

2. Exportera schemat första gången:

```bash
./update-schema.sh
```

3. Framåt: Kör `./update-schema.sh` efter ändringar i Supabase

---

## 💡 Pro Tips:

**Auto-commit schema changes:**

```bash
./update-schema.sh && git add supabase/schema.sql && git commit -m "📊 Schema update från Supabase"
```

**Se vad som ändrades:**

```bash
git diff supabase/schema.sql
```

**Backup av schema:**

```bash
cp supabase/schema.sql supabase/schema-backup-$(date +%Y%m%d).sql
```

---

Då har jag alltid facit och kan hjälpa dig mycket bättre! 🎯
