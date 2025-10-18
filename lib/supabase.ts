import { createClient } from "@supabase/supabase-js";
import { Database } from "@/types/database";

// 🔐 Dessa värden hämtas automatiskt från Vercel eller .env.local
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

// Skapa klienten med typning - men fallback till null om miljövariablerna saknas
// Under build-tid loggar vi bara varningen utan att kasta fel
if (!supabaseUrl || !supabaseAnonKey) {
  if (typeof window !== "undefined" || process.env.NODE_ENV !== "production") {
    console.warn(
      "⚠️ Supabase miljövariabler saknas! Kontrollera att NEXT_PUBLIC_SUPABASE_URL och NEXT_PUBLIC_SUPABASE_ANON_KEY är konfigurerade."
    );
  }
}

export const supabase =
  supabaseUrl && supabaseAnonKey
    ? createClient<Database>(supabaseUrl, supabaseAnonKey)
    : null;
