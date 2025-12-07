# SQL-filer Guide

> Uppdaterad: 2025-12-08

## 📁 Aktiva filer (används i produktion)

### supabase/migrations/ - Migrationer

| Fil                                                    | Syfte                            | Status    |
| ------------------------------------------------------ | -------------------------------- | --------- |
| `20251208_MASTER_RLS_POLICY_V3.sql`                    | **HUVUDFIL** - Alla RLS policies | ✅ Aktiv  |
| `20251207_customer_login_rpc.sql`                      | verify_customer_account() RPC    | ✅ Aktiv  |
| `20251207_fix_handle_new_user_skip_customers.sql`      | handle_new_user() trigger        | ✅ Aktiv  |
| `20251207_prevent_duplicate_orgs.sql`                  | Förhindra dubbletter             | ✅ Aktiv  |
| `20251207_duplicate_prevention_constraints.sql`        | Constraint-regler                | ✅ Aktiv  |
| `20251207_dogs_complete_structure.sql`                 | Dogs-tabellstruktur              | ✅ Aktiv  |
| `20251206_org_accepting_applications.sql`              | Org kan ta emot ansökningar      | ✅ Aktiv  |
| `20251205_approve_application_rpc.sql`                 | approve/reject_application() RPC | ✅ Aktiv  |
| `20251205_booking_status.sql`                          | Bokningsstatus                   | ✅ Aktiv  |
| `20251205_booking_status_rollback.sql`                 | Rollback för ovan                | 📦 Backup |
| `20251203_forbattringar_spårbarhet_och_optimering.sql` | Spårbarhet                       | ✅ Aktiv  |
| `20251202_fix_invoice_items_relation.sql`              | Invoice items relation           | ✅ Aktiv  |
| `20251202120000_fix_invoice_triggers.sql`              | Invoice triggers                 | ✅ Aktiv  |
| `20251202120200_fix_pensionat_columns.sql`             | Pensionat-kolumner               | ✅ Aktiv  |
| `20251202140000_migrate_subscription_values.sql`       | Subscription-migration           | ✅ Aktiv  |
| `ADD_TRIAL_ABUSE_PROTECTION.sql`                       | Trial abuse prevention           | ✅ Aktiv  |
| `ADD_YEARLY_SUBSCRIPTIONS.sql`                         | Årsprenumerationer               | ✅ Aktiv  |
| `ADD_ENABLED_SERVICES.sql`                             | enabled_services kolumn          | ✅ Aktiv  |
| `UPDATE_TRIGGER_ENABLED_SERVICES.sql`                  | Trigger för enabled_services     | ✅ Aktiv  |

### supabase/monitoring/ - Övervakningsscript

| Fil                           | Syfte               |
| ----------------------------- | ------------------- |
| `check_system_health.sql`     | Systemhälsokontroll |
| `setup_trigger_logging.sql`   | Trigger-loggning    |
| `PRODUCTION_HEALTH_CHECK.sql` | Produktionshälsa    |

### supabase/ - Verifiering

| Fil                 | Syfte            |
| ------------------- | ---------------- |
| `VERIFY_RLS_V3.sql` | Verifiera RLS V3 |

---

## 📦 Arkiverade filer

Alla gamla/obsoleta SQL-filer finns i:

```
archive/sql_obsolete_2025-12-08/
archive/sql_old/
archive_gamla_schema_disabled/
```

**Dessa ska INTE köras** - de är bara för referens.

---

## 🚀 Vid ny installation

Kör endast:

1. `20251208_MASTER_RLS_POLICY_V3.sql` (RLS policies)
2. RPC-funktionerna om de inte redan finns

Övriga migrationer har redan körts i produktion.
