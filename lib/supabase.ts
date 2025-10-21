import { createClient } from "@supabase/supabase-js";
import { Database } from "@/types/database";

/**
 * Supabase-klient som hanterar både runtime och build-time utan att krascha.
 * Under statisk rendering (t.ex. /404) loggas bara en varning.
 */

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

let supabaseClient: ReturnType<typeof createClient<Database>> | null = null;

if (supabaseUrl && supabaseAnonKey) {
  supabaseClient = createClient<Database>(supabaseUrl, supabaseAnonKey);
} else {
  // 🛑 Hindra att build kraschar
  if (process.env.NODE_ENV === "production") {
    console.warn(
      "[WARN] Supabase-nycklar saknas under build-tid (t.ex. vid prerendering av /not-found). Skapar ingen klient."
    );
  }
}

export const supabase = supabaseClient as ReturnType<
  typeof createClient<Database>
>;
