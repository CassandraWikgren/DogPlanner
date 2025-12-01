"use client";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { createClient } from "@/lib/supabase/client";

interface Props {
  accessToken?: string;
}

export default function SupabaseListener({ accessToken }: Props) {
  const supabase = createClient();
  const router = useRouter();

  useEffect(() => {
    if (!supabase) return;

    const { data: authListener } = supabase.auth.onAuthStateChange(
      (event, session) => {
        if (session?.access_token !== accessToken) {
          // Sessionen har ändrats (in- eller utloggning) – uppdatera sidan
          router.refresh();
        }
      }
    );

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, [accessToken, router]);

  return null;
}
