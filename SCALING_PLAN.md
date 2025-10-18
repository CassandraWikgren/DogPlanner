# 🐾 DogPlanner - Skalnings- och Funktionsplan

## 🎯 VISION

Bli den självklara SaaS-plattformen för ALLA hundföretag i Norden:

- **Hunddagis** ✅ (Färdig grund)
- **Hundpensionat** ✅ (Färdig grund)
- **Hundfrisör** 🔄 (Planerad)
- **Hundrehabiliteríng** 🔄 (Planerad)

---

## 🏗️ ARKITEKTUR FÖR SKALNING

### **Multi-Service Database Design**

```sql
-- Tjänstekategorier per organisation
CREATE TABLE service_types (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid REFERENCES orgs(id),
  service_type TEXT CHECK (service_type IN ('daycare', 'boarding', 'grooming', 'rehab')),
  is_active BOOLEAN DEFAULT true,
  settings JSONB DEFAULT '{}' -- Service-specifika inställningar
);

-- Universell bokningstabell
CREATE TABLE appointments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid REFERENCES orgs(id),
  dog_id uuid REFERENCES dogs(id),
  service_type TEXT NOT NULL,
  staff_id uuid REFERENCES auth.users(id),
  start_datetime TIMESTAMPTZ NOT NULL,
  end_datetime TIMESTAMPTZ NOT NULL,
  status TEXT DEFAULT 'scheduled',
  price NUMERIC,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);
```

### **Modulär Frontend-struktur**

```
app/
├── dashboard/          # Unified dashboard
├── hunddagis/         # ✅ Dagis-modul
├── hundpensionat/     # ✅ Pensionat-modul
├── hundfrisor/        # 🔄 Frisör-modul
├── hundrehab/         # 🔄 Rehab-modul
├── shared/            # Delade komponenter
└── settings/          # Org settings & service activation
```

---

## 📋 IMPLEMENTATIONSPLAN

### **SPRINT 1: Core Infrastructure (Denna vecka)**

- [x] Fix grundläggande CRUD (hundar, pensionat, rum)
- [x] Bilduppladdning
- [ ] **Service-selection på onboarding**
- [ ] **Unified navigation som visar bara aktiva tjänster**

### **SPRINT 2: Hundfrisör-modul (Vecka 2)**

- [ ] Bokningskalender med tidsluckor
- [ ] Frisörtjänster (klippning, bad, naglar)
- [ ] Före/efter-foton
- [ ] Recurring appointments (ex. var 6:e vecka)

### **SPRINT 3: Rehab-modul (Vecka 3)**

- [ ] Behandlingsplaner
- [ ] Progression tracking
- [ ] Veterinär-integration
- [ ] Behandlingshistorik

### **SPRINT 4: Avancerade features (Vecka 4)**

- [ ] Multi-staff scheduling
- [ ] SMS/email notifications
- [ ] Stripe-integration för betalningar
- [ ] Rapporter och analytics

---

## 🎨 UX/UI FÖRBÄTTRINGAR

### **Professional Onboarding Flow**

1. **Välj tjänster** - Checkbox för dagis/pensionat/frisör/rehab
2. **Setup wizard** - Guidad konfiguration per tjänst
3. **Import data** - Excel/CSV import av befintliga kunder
4. **Team invitation** - Bjud in personal

### **Unified Dashboard**

```typescript
interface DashboardStats {
  daycare: { checkedIn: number; totalDogs: number };
  boarding: { currentGuests: number; checkoutsToday: number };
  grooming: { appointmentsToday: number; nextAvailable: string };
  rehab: { activePatients: number; treatmentsToday: number };
}
```

### **Smart Navigation**

- Dynamisk meny baserat på aktiva tjänster
- "Idag"-sida som samlar alla tjänster
- Quick actions för vanliga tasks

---

## 🚀 TEKNISK SKALNING

### **Performance Optimizations**

- [ ] React Query för caching
- [ ] Pagination för stora listor
- [ ] Image optimization med Next.js
- [ ] Database indexing för stora datasets

### **Multi-tenancy Säkerhet**

- [ ] Row Level Security (RLS) på alla tabeller
- [ ] Organization-based data isolation
- [ ] API rate limiting
- [ ] Audit logging

### **Business Features**

- [ ] Subscription management (trial → paid)
- [ ] Usage-based billing
- [ ] White-label options för större kunder
- [ ] API för integrationer (Fortnox, Visma)

---

## 💰 BUSINESS MODEL

### **Pricing Tiers**

```
🥉 STARTER (299kr/mån)
- 1 tjänst, upp till 50 hundar
- Grundfunktioner

🥈 PROFESSIONAL (699kr/mån)
- Alla tjänster, upp till 200 hundar
- SMS-notiser, rapporter

🥇 ENTERPRISE (1299kr/mån)
- Unlimited, multi-location
- Custom integrations, prioriterad support
```

### **Success Metrics**

- **Användarengagemang**: Dagliga inloggningar
- **Feature adoption**: % som använder >1 tjänst
- **Churn rate**: <5% per månad
- **NPS Score**: >50

---

## 🎯 KONKURRENSFÖRDELAR

1. **All-in-one**: Ingen konkurrent har alla 4 tjänsterna
2. **Svensk fokus**: Jordbruksverket-compliance, svenska regler
3. **Modern tech**: Real-time, mobile-first, snabb
4. **Pricing**: Enklare och billigare än befintliga lösningar

---

## 📞 NÄSTA ACTIONS

### **För Dig (Cassandra):**

1. **Testa de fixade funktionerna** (lägg till hund, bokning)
2. **Beslut om prioritering** - Vilken tjänst ska vi bygga härnäst?
3. **Business feedback** - Vad är viktigast för försäljning?

### **För Utveckling:**

1. **Database cleanup** - Fixa triggers och RLS
2. **Service selection** - Lägg till tjänsteval i onboarding
3. **Börja på frisör-modulen** om du vill fokusera där

**Är du redo att ta detta till nästa nivå? Vilken del vill du att vi fokuserar på härnäst?** 🚀
