import { createClient, SupabaseClient } from "@supabase/supabase-js";
import { Database } from "@/types/database";

/**
 * Supabase-klient som hanterar både runtime och build-time utan att krascha.
 * Under statisk rendering (t.ex. /404) loggas bara en varning.
 */

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

function createSupabaseClient(): SupabaseClient<Database> {
  if (!supabaseUrl || !supabaseAnonKey) {
    // 🛑 Hindra att build kraschar
    if (typeof window === "undefined") {
      console.warn(
        "[WARN] Supabase-nycklar saknas under build-tid. Returnerar mock client."
      );
      // Mock client för build-time som aldrig används
      return createClient<Database>(
        "https://placeholder.supabase.co",
        "placeholder-key"
      );
    }
    throw new Error(
      "Supabase URL och anon key måste vara konfigurerade i miljövariabler"
    );
  }

  return createClient<Database>(supabaseUrl, supabaseAnonKey);
}

export const supabase = createSupabaseClient();
