// lib/store.ts
import { createClient } from "@/lib/supabase/client";

/* ----------------------------- Typer (UI -> DB) ---------------------------- */
export type OwnerDraft = {
  id?: string | null;
  full_name: string | null; // ← ändra från "string" till "string | null"
  phone?: string | null;
  email?: string | null;
  postal_code?: string | null;
  city?: string | null;
  contact_person_2?: string | null;
  contact_phone_2?: string | null;
  customer_number?: number | null;
};

export type SubscriptionDraft = {
  abon_type?: string | null; // "fulltime" | "parttime2" | "parttime3" | "dagshund"
  plan_name?: string | null; // valfri visningstext
  start_date: string; // "YYYY-MM-DD"
  end_date?: string | null; // "YYYY-MM-DD" | null (pågående)
};

export type DogDraft = {
  id?: string | null;
  name: string;
  breed?: string | null;
  birth?: string | null;
  heightcm?: number | null;
  days?: string[] | null;
  subscription?: string | null; // snabb etikett (”Heltid”, ”Deltid 2”, etc.)
  vaccdhp?: string | null;
  vaccpi?: string | null;
  notes?: string | null;
  startdate?: string | null;
  enddate?: string | null;
  price?: number | null;
  room_id?: string | null;
  owner_id?: string | null;

  // 👇 Lägg till dessa tre nya relationer
  owner?: {
    id: string;
    full_name: string | null;
    phone?: string | null;
    email?: string | null;
    contact_person_2?: string | null;
    contact_phone_2?: string | null;
  } | null;

  subscriptions?: {
    id: string;
    plan_name?: string | null;
    abon_type?: string | null;
    start_date?: string | null;
    end_date?: string | null;
    price_per_month?: number | null;
    status?: string | null;
  }[];

  extras?: {
    id: string;
    service_type?: string | null;
    quantity?: number | null;
    price?: number | null;
  }[];
};

/* --------------------------------- Helpers --------------------------------- */
const asNull = (v: any) => (v === "" || v === undefined ? null : v);

function normalizeDays(days?: string[] | null): string | null {
  if (!days || days.length === 0) return null;
  // lagra som "Mån,Ons,Fre" för enkel filtrering
  return days.join(",");
}

/* --------------------------- ÄGARE: upsert via kundnr ---------------------- */
export async function upsertOwner(d: OwnerDraft) {
  if (!supabase) {
    throw new Error("Supabase client is not available");
  }

  // 1) Om id finns – hoppa över lookup
  if (d.id) {
    console.debug("[owner] using provided id", d.id);
    return { id: d.id };
  }

  // 2) Försök hitta via customer_number i första hand
  if (d.customer_number != null) {
    const { data: foundByCust, error: e1 } = await supabase
      .from("owners")
      .select("id")
      .eq("customer_number", d.customer_number)
      .limit(1)
      .maybeSingle();

    if (e1) console.warn("[owner] lookup by customer_number error:", e1);
    const typedFoundByCust = foundByCust as { id: string } | null;
    if (typedFoundByCust?.id) return { id: typedFoundByCust.id };
  }

  // 3) Annars heuristik: full_name + phone
  if (d.full_name) {
    const q = supabase
      .from("owners")
      .select("id")
      .eq("full_name", d.full_name)
      .limit(1);

    if (d.phone) q.eq("phone", d.phone);

    const { data: foundByName, error: e2 } = await q.maybeSingle();
    if (e2) console.warn("[owner] lookup by name/phone error:", e2);
    const typedFoundByName = foundByName as { id: string } | null;
    if (typedFoundByName?.id) return { id: typedFoundByName.id };
  }

  // 4) Skapa ny ägare (triggers sätter org_id)
  const insertPayload = {
    full_name: d.full_name,
    phone: asNull(d.phone),
    email: asNull(d.email),
    postal_code: asNull(d.postal_code),
    city: asNull(d.city),
    contact_person_2: asNull(d.contact_person_2),
    contact_phone_2: asNull(d.contact_phone_2),
    customer_number: d.customer_number ?? null,
  };

  const { data: ins, error } = await (supabase as any)
    .from("owners")
    .insert(insertPayload)
    .select("id")
    .single();

  if (error) {
    console.error("[owner] insert error:", error);
    throw new Error("Kunde inte spara ägare.");
  }

  const typedIns = ins as { id: string };
  return { id: typedIns.id };
}

/* ------------------------------ HUND: insert/upd --------------------------- */
export async function savedog(d: DogDraft) {
  if (!supabase) {
    throw new Error("Supabase client is not available");
  }

  console.groupCollapsed("🐶 saveDog start");
  console.log("Inkommande DogDraft:", JSON.parse(JSON.stringify(d)));

  // 1) Säkerställ owner_id
  if (!d.owner_id) {
    if (!d.owner || !d.owner.full_name) {
      throw new Error("Ägare saknas (fullständigt namn krävs).");
    }
    const ownerRes = await upsertOwner(d.owner);
    d.owner_id = ownerRes.id;
    console.log("✅ Owner kopplad:", d.owner_id); // 👇 Lägg till detta precis efter raden ovan:
    const { data: ownerRow } = await supabase
      .from("owners")
      .select("id, org_id, full_name")
      .eq("id", d.owner_id)
      .single();

    console.log("🔍 Ägare sparad i databasen:", ownerRow);
  }

  // 2) Mappa UI -> DB-kolumner
  const dogRow = {
    name: d.name,
    breed: asNull(d.breed),
    birth: asNull(d.birth),
    heightcm: d.heightcm ?? null,
    days: normalizeDays(d.days ?? null),
    vaccdhp: asNull(d.vaccdhp),
    vaccpi: asNull(d.vaccpi),
    notes: asNull(d.notes),
    startdate: asNull(d.startdate),
    enddate: asNull(d.enddate),
    price: d.price ?? null,
    room_id: asNull(d.room_id),
    owner_id: d.owner_id!,
  } as any;

  console.log("🧾 DogRow som skickas till Supabase:", dogRow);

  let dogId = d.id ?? null;

  try {
    if (!dogId) {
      const { data, error } = await supabase
        .from("dogs")
        .insert(dogRow)
        .select("id")
        .single();

      console.log("📥 Insert-resultat:", { data, error });

      if (error) {
        console.error("❌ Supabase insert error:", error);
        throw new Error(JSON.stringify(error, null, 2));
      }

      const typedData = data as { id: string } | null;
      dogId = typedData?.id as string;
      console.log("✅ Ny hund skapad:", dogId);
    } else {
      const { data, error } = await (supabase as any)
        .from("dogs")
        .update(dogRow)
        .eq("id", dogId)
        .select("id")
        .single();

      console.log("📝 Update-resultat:", { data, error });

      if (error) {
        console.error("❌ Supabase update error:", error);
        throw new Error(JSON.stringify(error, null, 2));
      }
    }

    // 3) Spara abonnemang
    if (d.subscriptions && d.subscriptions.length > 0) {
      const payload = d.subscriptions
        .filter((s) => s && s.start_date)
        .map((s) => ({
          dog_id: dogId,
          abon_type: asNull(s.abon_type),
          plan_name: asNull(s.plan_name),
          start_date: s.start_date,
          end_date: asNull(s.end_date),
        }));

      console.log("🧾 Subscription payload:", payload);

      if (payload.length > 0) {
        const { data, error } = await (supabase as any)
          .from("subscriptions")
          .insert(payload)
          .select();

        console.log("📦 Subscription insert:", { data, error });
        if (error) {
          console.error("❌ subscriptions insert error:", error);
          throw new Error(JSON.stringify(error, null, 2));
        }
      }
    }

    console.groupEnd();
    return { id: dogId };
  } catch (err) {
    console.groupEnd();
    console.error("💥 saveDog FEL:", err);
    throw err;
  }
}

/* -------------------------------------------------------------------------- */
/* 🔁 Gamla funktioner som krävs av hunddagis/page.tsx                       */
/* -------------------------------------------------------------------------- */

// Skapar ett intervall av månader bakåt i tiden
export function monthRangeBack(months: number) {
  const now = new Date();
  const list = [];
  for (let i = 0; i < months; i++) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const start = new Date(d.getFullYear(), d.getMonth(), 1);
    const end = new Date(d.getFullYear(), d.getMonth() + 1, 0);
    const id = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(
      2,
      "0"
    )}`;
    list.push({ id, start, end });
  }
  return list;
}

// Hämtar alla hundar (används i hunddagis/page.tsx)
export async function getDB() {
  if (!supabase) {
    throw new Error("Supabase client is not available");
  }

  const { data, error } = await supabase
    .from("dogs")
    .select(
      `
      id,
      name,
      breed,
      birth,
      heightcm,
      days,
      subscription,
      vaccdhp,
      vaccpi,
      startdate,
      enddate,
      price,
      notes,
      room_id,
      owner_id,
      owner:owners (
        id,
        full_name,
        phone,
        email,
        contact_person_2,
        contact_phone_2
      ),
      subscriptions:subscriptions (
        id,
        plan_name,
        abon_type,
        start_date,
        end_date,
        price_per_month,
        status
      ),
      extras:extra_service (
        id,
        service_type,
        quantity,
        price
      )
    `
    )
    .order("name", { ascending: true });

  if (error) {
    console.error("❌ Fel vid hämtning från Supabase:", error);
    return { dogs: [] };
  }

  return { dogs: data ?? [] };
}

// ⬇️ Flytta hit, utanför funktionen
export type Dog = DogDraft;
