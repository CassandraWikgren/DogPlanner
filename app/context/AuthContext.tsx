"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

type SubscriptionState = {
  status?: "trialing" | "active" | "past_due" | "canceled" | string;
  trial_ends_at?: string | null;
  expired: boolean;
};

type UserProfile = {
  id: string;
  org_id: string;
  role: string;
  full_name?: string;
  email?: string;
  phone?: string;
};

type AuthCtx = {
  user: any;
  profile: UserProfile | null;
  currentOrgId: string | null;
  role: string | null;
  loading: boolean;
  subscription: SubscriptionState | null;
  signOut: () => Promise<void>;
  ensureOrg: () => Promise<void>;
};

export const AuthContext = createContext<AuthCtx>({
  user: null,
  profile: null,
  currentOrgId: null,
  role: null,
  loading: true,
  subscription: null,
  signOut: async () => {},
  ensureOrg: async () => {},
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [currentOrgId, setCurrentOrgId] = useState<string | null>(null);
  const [role, setRole] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [subscription, setSubscription] = useState<SubscriptionState | null>(
    null
  );

  // Safety timeout för loading
  useEffect(() => {
    const timeout = setTimeout(() => {
      console.warn("AuthContext: Loading timeout reached, forcing false");
      setLoading(false);
    }, 10000); // 10 sekunder max

    return () => clearTimeout(timeout);
  }, []);

  useEffect(() => {
    init();

    if (!supabase) {
      console.warn("Supabase inte tillgängligt");
      setLoading(false);
      return;
    }

    const { data: listener } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        const u = session?.user || null;

        // Kontrollera om det är demo-cookies aktiva
        const demoUser = document.cookie
          .split("; ")
          .find((row) => row.startsWith("demoUser="))
          ?.split("=")[1];
        const demoOrg = document.cookie
          .split("; ")
          .find((row) => row.startsWith("demoOrg="))
          ?.split("=")[1];

        // Hoppa endast över Supabase-hantering om BÅDA democookies finns
        if (demoUser && demoOrg) {
          console.log(
            "AuthContext: Demo user active (user+org), skipping Supabase session handling"
          );
          return;
        }

        setUser(u);

        // ✅ SNABB FALLBACK: Sätt org_id direkt från user_metadata
        // Detta gör att sidor kan börja ladda data omedelbart
        const metaOrg = (u as any)?.user_metadata?.org_id as string | undefined;
        if (metaOrg) {
          setCurrentOrgId(metaOrg);
          console.log("AuthContext: Quick org_id set from metadata:", metaOrg);
        }

        if (u && session?.access_token) {
          // Försök auto-onboarding först, läs sedan profil
          await safeAutoOnboarding(session.access_token);
          await refreshProfile(u.id);
          // Om profilen fortfarande saknar org, gör en sista retry
          if (!currentOrgId && !metaOrg) {
            console.warn(
              "AuthContext: Ingen org efter första onboarding, försöker igen..."
            );
            await safeAutoOnboarding(session.access_token);
            await refreshProfile(u.id);
          }
          await refreshSubscription(session.access_token);
        } else {
          setProfile(null);
          setCurrentOrgId(null);
          setRole(null);
          setSubscription(null);
        }
      }
    );
    return () => listener.subscription.unsubscribe();
  }, []);

  async function init() {
    try {
      console.log("AuthContext: Starting init...");

      // Kolla först efter demo-cookies
      const demoUser = document.cookie
        .split("; ")
        .find((row) => row.startsWith("demoUser="))
        ?.split("=")[1];

      const demoOrg = document.cookie
        .split("; ")
        .find((row) => row.startsWith("demoOrg="))
        ?.split("=")[1];

      console.log("AuthContext: All cookies:", document.cookie);
      console.log("AuthContext: Demo cookies check:", { demoUser, demoOrg });

      if (demoUser && demoOrg) {
        console.log("AuthContext: Demo user found:", demoUser);
        console.log("AuthContext: Setting demo user state...");

        // Skapa en mock user för demo
        const mockUser = {
          id: "demo-user-id",
          email: demoUser,
          user_metadata: {
            org_id: demoOrg,
            full_name: "Demo Användare",
          },
        };

        console.log("AuthContext: Mock user created:", mockUser);

        setUser(mockUser);
        setProfile({
          id: "demo-user-id",
          org_id: demoOrg,
          role: "admin",
          full_name: "Demo Användare",
          email: demoUser,
        });
        setCurrentOrgId(demoOrg);
        setRole("admin");
        setSubscription({
          status: "active",
          trial_ends_at: null,
          expired: false,
        });
        setLoading(false);
        console.log("AuthContext: Demo state set successfully!");
        return;
      }

      // Säkerhetskontroll för supabase-klient
      if (!supabase) {
        console.error(
          "AuthContext: Supabase client är null - kontrollera miljövariabler"
        );
        setLoading(false);
        return;
      }

      const { data, error } = await supabase.auth.getSession();
      if (error) {
        console.error("AuthContext: Error getting session:", error);
        setLoading(false);
        return;
      }

      const session = data.session;
      const u = session?.user || null;
      console.log("AuthContext: Session loaded, user:", u?.id || "none");
      setUser(u);

      // ✅ KRITISK FIX: Sätt org_id DIREKT från metadata innan profile-uppslag
      const metaOrg = (u as any)?.user_metadata?.org_id as string | undefined;
      if (metaOrg) {
        setCurrentOrgId(metaOrg);
        console.log("AuthContext: Quick org_id set in init:", metaOrg);
      }

      setLoading(false); // ⬆️ Sätt loading=false tidigt så sidor kan börja rendera

      if (u && session?.access_token) {
        // Kör dessa i bakgrunden utan att blockera rendering
        safeAutoOnboarding(session.access_token)
          .then(() => refreshProfile(u.id))
          .then(() => refreshSubscription(session.access_token));
      }
    } catch (error) {
      console.error("AuthContext: Unexpected error in init:", error);
      setLoading(false);
    }
  }

  async function refreshProfile(userId: string) {
    if (!supabase) {
      console.error("AuthContext: Supabase client är null i refreshProfile");
      return;
    }

    // 1) Hämta minsta gemensamma nämnare (id, org_id) för att tåla schema‑skillnader
    const baseRes: any = await supabase
      .from("profiles")
      .select("id, org_id")
      .eq("id", userId)
      .single();

    let base = baseRes.data as { id: string; org_id: string } | null;

    // 2) Försök läsa extra fält, men fall tillbaka om kolumner saknas i DB
    let extra: Partial<UserProfile> = {};
    if (base) {
      const extraRes: any = await supabase
        .from("profiles")
        .select("role, full_name, email, phone")
        .eq("id", userId)
        .single();

      // Ignorera fel här – vissa kolumner kan saknas i en äldre databas
      if (extraRes.data) {
        extra = extraRes.data as Partial<UserProfile>;
      }
    }

    // 🔧 LAGER 3: Automatisk healing om org_id saknas
    if (base && !base.org_id) {
      console.warn(
        "⚠️ AuthContext: Användare saknar org_id, försöker heala..."
      );
      const healed = await healMissingOrg(userId);
      if (healed) {
        // Läs om profilen efter healing
        const healedRes: any = await supabase
          .from("profiles")
          .select("id, org_id, role, full_name, email, phone")
          .eq("id", userId)
          .single();

        if (healedRes.data) {
          base = { id: healedRes.data.id, org_id: healedRes.data.org_id };
          extra = healedRes.data;
          console.log(
            "✅ AuthContext: Användare healad med org_id:",
            base.org_id
          );
        }
      }
    }

    if (base && base.org_id) {
      const merged: UserProfile = {
        id: base.id,
        org_id: base.org_id,
        role: extra.role || "admin", // defaulta försiktigt till admin om roll saknas
        full_name: extra.full_name,
        email: extra.email,
        phone: extra.phone,
      };

      setProfile(merged);
      setCurrentOrgId(merged.org_id);
      setRole(merged.role);
    } else {
      console.error(
        "❌ AuthContext: Kunde inte ladda profil med org_id för användare:",
        userId
      );
      setProfile(null);
      setCurrentOrgId(null);
      setRole(null);
    }
  }

  async function healMissingOrg(userId: string): Promise<boolean> {
    if (!supabase) return false;

    try {
      console.log("🔧 Försöker heala användare med saknad org_id...");

      // Anropa healing-funktionen i databasen
      const { data, error } = await supabase.rpc("heal_user_missing_org", {
        user_id: userId,
      });

      if (error) {
        console.error("❌ Healing misslyckades:", error);
        return false;
      }

      if (data?.success) {
        console.log("✅ Healing lyckades:", data);
        return true;
      }

      return false;
    } catch (e) {
      console.error("❌ Oväntat fel vid healing:", e);
      return false;
    }
  }
  async function safeAutoOnboarding(accessToken: string): Promise<boolean> {
    try {
      await fetch("/api/onboarding/auto", {
        method: "POST",
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      return true;
    } catch (e) {
      console.warn("Auto-onboarding skip/fail:", e);
      return false;
    }
  }

  async function refreshSubscription(accessToken: string) {
    try {
      const res = await fetch("/api/subscription/status", {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      const json = await res.json();
      if (res.ok) {
        setSubscription({
          status: json.status,
          trial_ends_at: json.trial_ends_at ?? null,
          expired: !!json.expired,
        });
      } else {
        setSubscription(null);
      }
    } catch {
      setSubscription(null);
    }
  }

  // 🚪 Logga ut-funktion med null-check
  async function signOut() {
    console.log("🚪 Loggar ut användare...");

    // Rensa ALLA cookies (inte bara demo)
    const cookies = document.cookie.split(";");
    for (let i = 0; i < cookies.length; i++) {
      const cookie = cookies[i];
      const eqPos = cookie.indexOf("=");
      const name = eqPos > -1 ? cookie.substr(0, eqPos).trim() : cookie.trim();
      document.cookie =
        name + "=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT;";
      document.cookie =
        name +
        "=; path=/; domain=" +
        window.location.hostname +
        "; expires=Thu, 01 Jan 1970 00:00:01 GMT;";
    }

    // Logga ut från Supabase
    if (supabase) {
      try {
        // Försök global sign-out (v2 API)
        // @ts-ignore – tolerera olika SDK-versioner
        await supabase.auth.signOut({ scope: "global" });
      } catch (e) {
        console.warn("signOut global scope unsupported, falling back", e);
        await supabase.auth.signOut();
      }
    }

    // Extra säkerhet: rensa Supabase tokens i localStorage (sb-<ref>-auth-token)
    try {
      const toRemove: string[] = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (!key) continue;
        if (key.startsWith("sb-") || key.includes("supabase")) {
          toRemove.push(key);
        }
      }
      toRemove.forEach((k) => localStorage.removeItem(k));
    } catch {}

    try {
      sessionStorage.clear();
    } catch {}

    // Nollställ state
    setUser(null);
    setProfile(null);
    setCurrentOrgId(null);
    setRole(null);
    setSubscription(null);

    console.log("✅ Utloggning klar, redirectar till startsidan...");

    // Redirecta till startsidan efter utloggning
    window.location.assign("/");
  }

  // 🛠 Public funktion för att säkerställa att en org/profil skapas nu
  async function ensureOrg() {
    try {
      if (!supabase) return;
      const { data } = await supabase.auth.getSession();
      const token = data.session?.access_token;
      const uid = data.session?.user?.id;

      if (!token || !uid) return;

      const ok = await safeAutoOnboarding(token);
      if (ok) {
        await refreshProfile(uid);
      }
    } catch (e) {
      console.warn("ensureOrg failed", e);
    }
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        profile,
        currentOrgId,
        role,
        loading,
        subscription,
        signOut,
        ensureOrg,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
