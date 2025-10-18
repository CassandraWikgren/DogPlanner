"use client";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { supabase } from "@/lib/supabase";

interface Props {
  accessToken?: string;
}

export default function SupabaseListener({ accessToken }: Props) {
  const router = useRouter();

  useEffect(() => {
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
