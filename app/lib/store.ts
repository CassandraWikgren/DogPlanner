// ========================================
// 📁 app/lib/store.ts
// Hanterar lokal datalogik + typer för Dog
// ========================================

import { supabase } from "@/lib/supabase";

// === Datatyper ===
export type Owner = {
  firstName?: string;
  lastName?: string;
  phone?: string;
  email?: string;
};

export type Addon = {
  type: string;
  times: number;
};

export type Dog = {
  id: string;
  name: string;
  breed?: string;
  birth?: string;
  heightCm?: number;
  subscription?: string;
  days?: string[];
  addons?: Addon[];
  vaccDhp?: string;
  vaccPi?: string;
  owner?: Owner;
  roomId?: string;
  startDate?: string;
  endDate?: string;
  price?: number;
  events?: string[];
  notes?: string;
  branchId?: string; // om du använder avdelningar
};

// === Hämtar alla hundar från Supabase ===
export async function getDB() {
  try {
    const { data, error } = await supabase.from("dogs").select("*");
    if (error) throw error;

    const dogs: Dog[] = (data || []).map((d: any) => ({
      id: d.id,
      name: d.name,
      breed: d.breed,
      birth: d.birth,
      heightCm: d.heightCm,
      subscription: d.subscription,
      days: d.days || [],
      addons: d.addons || [],
      vaccDhp: d.vaccdhp,
      vaccPi: d.vaccpi,
      owner: d.owner,
      roomId: d.roomid,
      startDate: d.startdate,
      endDate: d.enddate,
      price: d.price,
      events: d.events || [],
      notes: d.notes,
      branchId: d.branchid,
    }));

    return { dogs };
  } catch (err) {
    console.error("⚠️ Fel vid hämtning från Supabase:", err);
    return { dogs: [] };
  }
}

// === Uppdaterar en hund i databasen ===
export async function updateDog(id: string, updates: Partial<Dog>) {
  try {
    const { data, error } = await supabase
      .from("dogs")
      .update(updates)
      .eq("id", id)
      .select();

    if (error) throw error;
    console.log("✅ Hund uppdaterad:", data);
    return data;
  } catch (err) {
    console.error("❌ Fel vid uppdatering av hund:", err);
    throw err;
  }
}

// === Lägger till en ny hund i databasen ===
export async function addDog(newDog: Omit<Dog, "id">) {
  try {
    const { data, error } = await supabase
      .from("dogs")
      .insert([newDog])
      .select();
    if (error) throw error;
    console.log("🐾 Ny hund tillagd:", data);
    return data;
  } catch (err) {
    console.error("❌ Fel vid tillägg av hund:", err);
    throw err;
  }
}

// === Genererar de senaste X månaderna ===
export function monthRangeBack(count: number) {
  const months = [];
  const now = new Date();

  for (let i = 0; i < count; i++) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const id = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(
      2,
      "0"
    )}`;
    months.push({
      id,
      start: new Date(d.getFullYear(), d.getMonth(), 1),
      end: new Date(d.getFullYear(), d.getMonth() + 1, 0),
    });
  }

  return months;
}
