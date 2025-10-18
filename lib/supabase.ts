import { createClient } from "@supabase/supabase-js";
import { Database } from "@/types/database";

// 🔐 Dessa värden hämtas automatiskt från Vercel eller .env.local
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

// Skapa klienten med typning
export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey);
