# 📧 Fixa Email-funktionen på Vercel

## Problem

Emails skickas inte i produktionsmiljön eftersom miljövariabler saknas på Vercel.

## Lösning - Steg för steg

### 1. Gå till Vercel Environment Variables

1. Öppna: https://vercel.com/cassandrawikgrens-projects/dog-planner
2. Klicka på **Settings** (i topp-menyn)
3. Klicka på **Environment Variables** (i vänster-menyn)

### 2. Lägg till dessa 4 variabler

Klicka på **Add New** för varje variabel:

#### Variabel 1: RESEND_API_KEY

```
Name: RESEND_API_KEY
Value: re_FPrUTyPZ_41E1VRXHABCUKAi4z7zkAWd8
Environment: ✅ Production ✅ Preview ✅ Development
```

#### Variabel 2: JWT_SECRET

```
Name: JWT_SECRET
Value: P5lcqbiAzsPpm6DQJAdjzV1k5idERbl8ItA9cpLcM8A
Environment: ✅ Production ✅ Preview ✅ Development
```

#### Variabel 3: NEXT_PUBLIC_JWT_SECRET

```
Name: NEXT_PUBLIC_JWT_SECRET
Value: P5lcqbiAzsPpm6DQJAdjzV1k5idERbl8ItA9cpLcM8A
Environment: ✅ Production ✅ Preview ✅ Development
```

#### Variabel 4: NEXT_PUBLIC_SITE_URL

```
Name: NEXT_PUBLIC_SITE_URL
Value: https://dog-planner.vercel.app
Environment: ✅ Production ✅ Preview ✅ Development
```

### 3. Verifiera att alla variabler är tillagda

Du bör nu se 4 nya environment variables i listan.

### 4. Trigga en ny deploy

**Alternativ A - Automatisk:**

```bash
git commit --allow-empty -m "Trigger redeploy for env vars"
git push
```

**Alternativ B - Manuell:**

1. Gå till **Deployments** tab i Vercel
2. Klicka på de tre prickarna (...) på senaste deployen
3. Välj **Redeploy**
4. Välj **Use existing Build Cache: No**
5. Klicka **Redeploy**

### 5. Testa

1. Gå till https://dog-planner.vercel.app
2. Lägg till en ny kund via "Assisterad registrering"
3. Använd din egen email
4. Kolla din inbox - du bör få bekräftelsemejlet inom 1-2 minuter

## Felsökning

Om email fortfarande inte fungerar:

1. Kontrollera att alla 4 variabler är korrekt stavade (Case-sensitive!)
2. Verifiera att du deployat om efter att ha lagt till variablerna
3. Kolla Runtime Logs i Vercel för felmeddelanden
4. Kontrollera Resend Dashboard: https://resend.com/emails

## Färdigt! ✅

När alla steg är klara ska email-funktionen fungera i produktion.
