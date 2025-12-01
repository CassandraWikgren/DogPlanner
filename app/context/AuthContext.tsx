"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

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

  // Safety timeout för loading (kortare för bättre UX)
  useEffect(() => {
    const timeout = setTimeout(() => {
      console.warn("AuthContext: Loading timeout reached, forcing false");
      setLoading(false);
    }, 1500); // 1.5 sekunder max för snabbare sida

    return () => clearTimeout(timeout);
  }, []);

  useEffect(() => {
    init();

    const supabase = createClient();
    const { data: listener } = supabase.auth.onAuthStateChange(
      async (_event: any, session: any) => {
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
          // Endast kör API-anrop för business users (med org_id eller role)
          // Kundportal-användare och offentliga besökare behöver inte onboarding/subscription
          const hasBusinessRole = metaOrg || (u as any)?.app_metadata?.role;

          if (hasBusinessRole) {
            // Kör queries i bakgrunden UTAN att blockera rendering
            // Använd setTimeout för att släppa igenom första render
            setTimeout(() => {
              // Försök auto-onboarding i bakgrunden
              safeAutoOnboarding(session.access_token)
                .then(() => refreshProfile(u.id))
                .catch((err) =>
                  console.error("Background onboarding failed:", err)
                );

              refreshSubscription(session.access_token).catch((err) =>
                console.error("Background subscription check failed:", err)
              );
            }, 100); // 100ms delay för att släppa igenom initial render
          } else {
            // Kundportal-användare: Läs profil i bakgrunden med delay
            setTimeout(() => {
              refreshProfile(u.id).catch((err) =>
                console.error("Profile refresh failed:", err)
              );
            }, 100);
          }
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

      // Skapa supabase client för session check
      const supabase = createClient();
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
        // Men hoppa över för publika användare (om de inte har org_id i metadata)
        if (metaOrg || (u as any)?.app_metadata?.role) {
          safeAutoOnboarding(session.access_token)
            .then(() => refreshProfile(u.id))
            .then(() => refreshSubscription(session.access_token));
        }
      }
    } catch (error) {
      console.error("AuthContext: Unexpected error in init:", error);
      setLoading(false);
    }
  }

  async function refreshProfile(userId: string) {
    try {
      // Skapa supabase client
      const supabase = createClient();

      // Optimerad: Gör EN query istället för 2-3
      const { data: profileData, error } = await supabase
        .from("profiles")
        .select("id, org_id, role, full_name, email, phone")
        .eq("id", userId)
        .single();

      if (error) {
        console.error("Error fetching profile:", error);
        return;
      }

      if (!profileData) {
        console.warn("No profile found for user:", userId);
        return;
      }

      // 🔧 LAGER 3: Automatisk healing om org_id saknas
      if (!profileData.org_id) {
        console.warn(
          "⚠️ AuthContext: Användare saknar org_id, försöker heala..."
        );
        const healed = await healMissingOrg(userId);
        if (healed) {
          // Läs om profilen efter healing (rekursivt, men bara EN gång)
          return refreshProfile(userId);
        }
      }

      if (profileData.org_id) {
        const merged: UserProfile = {
          id: profileData.id,
          org_id: profileData.org_id,
          role: profileData.role || "admin",
          full_name: profileData.full_name || undefined,
          email: profileData.email || undefined,
          phone: profileData.phone || undefined,
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
    } catch (error) {
      console.error("Error in refreshProfile:", error);
    }
  }

  async function healMissingOrg(userId: string): Promise<boolean> {
    try {
      console.log("🔧 Försöker heala användare med saknad org_id...");

      // Skapa supabase client
      const supabase = createClient();

      // Anropa healing-funktionen i databasen
      // VIKTIGT: Parametern heter p_user_id, inte user_id (se PERMANENT_FIX_org_assignment.sql)
      const { data, error } = await supabase.rpc("heal_user_missing_org", {
        p_user_id: userId,
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
    const supabase = createClient();
    try {
      // Försök global sign-out (v2 API)
      // @ts-ignore – tolerera olika SDK-versioner
      await supabase.auth.signOut({ scope: "global" });
    } catch (e) {
      console.warn("signOut global scope unsupported, falling back", e);
      await supabase.auth.signOut();
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
      const supabase = createClient();
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
