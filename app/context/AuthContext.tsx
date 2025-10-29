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
};

export const AuthContext = createContext<AuthCtx>({
  user: null,
  profile: null,
  currentOrgId: null,
  role: null,
  loading: true,
  subscription: null,
  signOut: async () => {},
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

        // Om demo-cookies finns, hoppa över Supabase session hantering
        if (demoUser) {
          console.log(
            "AuthContext: Demo user active, skipping Supabase session handling"
          );
          return;
        }

        setUser(u);

        if (u && session?.access_token) {
          await safeAutoOnboarding(session.access_token);
          await refreshProfile(u.id);
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
      setLoading(false);

      if (u && session?.access_token) {
        await safeAutoOnboarding(session.access_token);
        await refreshProfile(u.id);
        await refreshSubscription(session.access_token);
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

    const { data }: { data: UserProfile | null } = await supabase
      .from("profiles")
      .select("id, org_id, role, full_name, email, phone")
      .eq("id", userId)
      .single();

    if (data) {
      setProfile(data);
      setCurrentOrgId(data.org_id);
      setRole(data.role);
    } else {
      setProfile(null);
      setCurrentOrgId(null);
      setRole(null);
    }
  }

  async function safeAutoOnboarding(accessToken: string) {
    try {
      await fetch("/api/onboarding/auto", {
        method: "POST",
        headers: { Authorization: `Bearer ${accessToken}` },
      });
    } catch (e) {
      console.warn("Auto-onboarding skip/fail:", e);
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
    // Rensa demo-cookies
    document.cookie =
      "demoUser=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT;";
    document.cookie =
      "demoOrg=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT;";

    if (supabase) {
      await supabase.auth.signOut();
    }

    setUser(null);
    setProfile(null);
    setCurrentOrgId(null);
    setRole(null);
    setSubscription(null);
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
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
