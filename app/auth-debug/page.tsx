"use client";

import { useEffect, useMemo, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { createClient } from "@/lib/supabase/client";

export default function AuthDebug() {
  const { user, profile, loading, currentOrgId, role, signOut } = useAuth();
  const supabase = createClient();

  const [sessionDump, setSessionDump] = useState<any>(null);
  const [sessionErr, setSessionErr] = useState<string | null>(null);
  const [cookiesStr, setCookiesStr] = useState<string>("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loginResult, setLoginResult] = useState<any>(null);
  const [loginErr, setLoginErr] = useState<string | null>(null);
  const [onboardRes, setOnboardRes] = useState<any>(null);
  const [onboardErr, setOnboardErr] = useState<string | null>(null);
  const [subStatus, setSubStatus] = useState<any>(null);
  const [subErr, setSubErr] = useState<string | null>(null);

  const supabaseUrl = useMemo(
    () => process.env.NEXT_PUBLIC_SUPABASE_URL || "<not-set>",
    []
  );
  const anonKey = useMemo(
    () =>
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? "<present>" : "<not-set>",
    []
  );

  useEffect(() => {
    // snapshot cookies on mount
    setCookiesStr(document.cookie || "<no cookies>");
  }, []);

  async function refreshSession() {
    setSessionErr(null);
    setSessionDump(null);
    try {
      if (!supabase) {
        setSessionErr("Supabase client is null (env saknas?)");
        return;
      }
      const { data, error } = await supabase.auth.getSession();
      if (error) setSessionErr(error.message);
      setSessionDump(data);
    } catch (e: any) {
      setSessionErr(e?.message || "okänt fel");
    }
  }

  function clearDemoCookies() {
    // Remove demo cookies specifically
    document.cookie =
      "demoUser=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT;";
    document.cookie =
      "demoOrg=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT;";
    setCookiesStr(document.cookie || "<no cookies>");
  }

  async function debugLogin(e: React.FormEvent) {
    e.preventDefault();
    setLoginErr(null);
    setLoginResult(null);
    try {
      if (!supabase) {
        setLoginErr("Supabase saknas");
        return;
      }
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (error) setLoginErr(error.message);
      setLoginResult(data);
    } catch (e: any) {
      setLoginErr(e?.message || "okänt fel");
    }
  }

  async function runAutoOnboarding() {
    setOnboardErr(null);
    setOnboardRes(null);
    try {
      if (!supabase) {
        setOnboardErr("Supabase saknas");
        return;
      }
      const { data: sess } = await supabase.auth.getSession();
      const token = sess.session?.access_token;
      if (!token) {
        setOnboardErr("Ingen session/token");
        return;
      }
      const res = await fetch("/api/onboarding/auto", {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });
      const json = await res.json();
      if (!res.ok) setOnboardErr(json?.error || res.statusText);
      setOnboardRes(json);
    } catch (e: any) {
      setOnboardErr(e?.message || "okänt fel");
    }
  }

  async function checkSubscription() {
    setSubErr(null);
    setSubStatus(null);
    try {
      const { data: sess } = await supabase.auth.getSession();
      const token = sess.session?.access_token;
      if (!token) {
        setSubErr("Ingen session/token");
        return;
      }
      const res = await fetch("/api/subscription/status", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const json = await res.json();
      if (!res.ok) setSubErr(json?.error || res.statusText);
      setSubStatus(json);
    } catch (e: any) {
      setSubErr(e?.message || "okänt fel");
    }
  }

  return (
    <div className="p-8 space-y-6">
      <h1 className="text-2xl font-bold">Auth Debug</h1>

      <div className="space-y-2">
        <div>
          <strong>Loading:</strong> {loading ? "Yes" : "No"}
        </div>
        <div>
          <strong>User:</strong>
          <pre className="bg-gray-100 p-2 mt-2 rounded overflow-auto">
            {JSON.stringify(user, null, 2)}
          </pre>
        </div>
        <div>
          <strong>Profile:</strong>
          <pre className="bg-gray-100 p-2 mt-2 rounded overflow-auto">
            {JSON.stringify(profile, null, 2)}
          </pre>
        </div>
        <div>
          <strong>Current Org ID:</strong> {currentOrgId || "Not set"}
        </div>
        <div>
          <strong>Role:</strong> {role || "Not set"}
        </div>
      </div>

      <div className="space-y-2">
        <h2 className="text-xl font-semibold">Client env</h2>
        <div className="text-sm">
          SUPABASE_URL: <code>{supabaseUrl}</code>
        </div>
        <div className="text-sm">ANON_KEY: {anonKey}</div>
      </div>

      <div className="space-y-2">
        <h2 className="text-xl font-semibold">Cookies</h2>
        <pre className="bg-gray-100 p-2 rounded overflow-auto">
          {cookiesStr}
        </pre>
        <div className="flex gap-2">
          <button
            onClick={clearDemoCookies}
            className="px-3 py-2 rounded bg-gray-200 hover:bg-gray-300"
          >
            Rensa demo-cookies
          </button>
          <button
            onClick={async () => {
              await signOut();
            }}
            className="px-3 py-2 rounded bg-red-600 text-white hover:bg-red-700"
          >
            Logga ut (Supabase + cookies)
          </button>
        </div>
      </div>

      <div className="space-y-2">
        <h2 className="text-xl font-semibold">Session check</h2>
        <div className="flex gap-2">
          <button
            onClick={refreshSession}
            className="px-3 py-2 rounded bg-blue-600 text-white hover:bg-blue-700"
          >
            Hämta supabase.auth.getSession()
          </button>
          <a
            className="px-3 py-2 rounded bg-emerald-600 text-white hover:bg-emerald-700"
            href="/api/demo-login"
          >
            Demo-login (sätt cookies)
          </a>
          <button
            onClick={runAutoOnboarding}
            className="px-3 py-2 rounded bg-purple-600 text-white hover:bg-purple-700"
          >
            Kör auto-onboarding nu
          </button>
        </div>
        {sessionErr && (
          <div className="text-red-700 bg-red-50 border border-red-200 rounded p-2 text-sm">
            {sessionErr}
          </div>
        )}
        <pre className="bg-gray-100 p-2 rounded overflow-auto min-h-[80px]">
          {sessionDump
            ? JSON.stringify(sessionDump, null, 2)
            : "<no session dump>"}
        </pre>
        {(onboardErr || onboardRes) && (
          <div className="space-y-2">
            <h3 className="font-medium">Auto-onboarding svar</h3>
            {onboardErr && (
              <div className="text-red-700 bg-red-50 border border-red-200 rounded p-2 text-sm">
                {onboardErr}
              </div>
            )}
            <pre className="bg-gray-100 p-2 rounded overflow-auto min-h-[60px]">
              {onboardRes
                ? JSON.stringify(onboardRes, null, 2)
                : "<no response>"}
            </pre>
          </div>
        )}
      </div>

      <div className="space-y-2">
        <h2 className="text-xl font-semibold">Snabb inloggning (felsökning)</h2>
        <form onSubmit={debugLogin} className="flex flex-col gap-2 max-w-md">
          <input
            type="email"
            placeholder="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="border p-2 rounded"
            required
          />
          <input
            type="password"
            placeholder="lösenord"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="border p-2 rounded"
            required
          />
          <button
            type="submit"
            className="px-3 py-2 rounded bg-black text-white hover:opacity-90"
          >
            Logga in (utan redirect)
          </button>
        </form>
        {loginErr && (
          <div className="text-red-700 bg-red-50 border border-red-200 rounded p-2 text-sm">
            {loginErr}
          </div>
        )}
        <pre className="bg-gray-100 p-2 rounded overflow-auto min-h-[80px]">
          {loginResult
            ? JSON.stringify(loginResult, null, 2)
            : "<no login result>"}
        </pre>
      </div>

      <div className="space-y-2">
        <h2 className="text-xl font-semibold">Subscription status</h2>
        <button
          onClick={checkSubscription}
          className="px-3 py-2 rounded bg-indigo-600 text-white hover:bg-indigo-700"
        >
          Kontrollera /api/subscription/status
        </button>
        {subErr && (
          <div className="text-red-700 bg-red-50 border border-red-200 rounded p-2 text-sm">
            {subErr}
          </div>
        )}
        <pre className="bg-gray-100 p-2 rounded overflow-auto min-h-[60px]">
          {subStatus ? JSON.stringify(subStatus, null, 2) : "<no response>"}
        </pre>
      </div>
    </div>
  );
}
