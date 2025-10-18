# 🐶 DogPlanner

DogPlanner är en webbaserad plattform byggd för att förenkla och digitalisera driften av **hunddagis, hundpensionat och hundfrisörverksamheter**.  
Systemet ger verksamhetsägare full överblick över hundar, ägare, bokningar, ekonomi och personal – allt samlat i en och samma plattform.

---

## 🚀 Övergripande syfte

DogPlanner effektiviserar administrationen och frigör tid för personalen att fokusera på hundarna.  
Plattformen samlar alla planeringsmoment på ett ställe – scheman, bokningar, journaler, fakturor och påminnelser – vilket sparar tid och minskar dubbelarbete.

---

## 🧩 Teknikstack

| Del               | Teknologi                                                          |
| ----------------- | ------------------------------------------------------------------ |
| **Frontend**      | [Next.js](https://nextjs.org/) + React + TypeScript                |
| **Design**        | [Tailwind CSS](https://tailwindcss.com/) + egna globala stilmallar |
| **Databas**       | [Supabase](https://supabase.com/) (PostgreSQL)                     |
| **Autentisering** | Supabase Auth                                                      |
| **PDF-export**    | jsPDF + jsPDF-AutoTable                                            |
| **Drift**         | [Vercel](https://vercel.com/)                                      |
| **Språk**         | TypeScript                                                         |

---

## 🏗️ Arkitektur

DogPlanner följer Next.js **App Router**-arkitektur.  
Varje huvuddel av verksamheten har en egen modul:

---

## 🐕 Funktioner

### Hunddagis

- Månadsöversikt med alla hundar och deras scheman
- Sök, sortering och kolumnfilter
- Export till PDF
- Direktlänk till hundens profil
- Realtidsuppdateringar via Supabase

### Hundpensionat

- Bokningsflöde med in-/utcheckning
- Automatisk prisberäkning (storlek, säsong, helg/högtid)
- Tilläggstjänster (t.ex. kloklipp, bad, extra matning)
- Journal för vistelser
- Beläggningskalender med färgkodad status

### Ekonomi & fakturor

- Automatisk fakturagenerering utifrån dagis/pensionatsdata
- Prislistor kopplade till varje företag
- PDF-export av fakturor
- Betalningsstatus och påminnelser

### Roller & behörigheter

- **Administratör** – full åtkomst till allt
- **Personal** – hantera hundar och scheman
- **Frisör** – tillgång till frisörjournaler
- **Hundägare** – kan se sin egen hund, schema och fakturor

---

## 🎨 Design

- Enhetligt, responsivt gränssnitt optimerat för surfplatta/mobil
- Färgkodning för olika moduler:
  - Grönt = Dagis, pensionat och frisör
  - Grått/Rött = Ekonomi
- Tydliga tabeller och kortkomponenter
- Fokus på användarvänlighet för personalen i vardagen

---

## 💾 Databasstruktur (Supabase)

- **dogs** – hundinformation, ägare, abonnemang, schema
- **rooms** – rum/platser (kopplas till hundar via `roomid`)
- **subscriptions** – kontons abonnemangsstatus (active/locked)
- **invoices** – fakturor kopplade till hundar och ägare
- **price_lists** – prisstrukturer per företag
- **users** – hanteras av Supabase Auth

Row Level Security (RLS) är aktiverat så att varje användare bara ser sin egen data.

---

## 🧾 Prislogik (Pensionat)

- Grundpris per natt beroende på storlek (liten/mellan/stor)
- Tillägg för högsäsong, helg, högtider
- Rabatter (t.ex. flerhundsrabatt, stamkundsrabatt)
- Egna tillval: öronrengöring, bad, hämtning, osv.
- Automatisk fakturaberäkning vid bokning eller månadsslut

---

## 🧠 Historik & rapporter

- Månadsvis historik sparas upp till 2 år bakåt
- Journaler, bokningar och fakturor kan granskas i efterhand
- Export till PDF/CSV för revision eller rapportering

---

## 🧰 Installation & utveckling

### Klona projektet

```bash
git clone https://github.com/<ditt-repo>/dogplanner.git
cd dogplanner
```
