"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

export default function DiagnosticsPage() {
  const [health, setHealth] = useState<any>(null);
  const [healthErr, setHealthErr] = useState<string | null>(null);
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header - EXAKT som Hunddagis */}
      <div className="border-b border-gray-200 bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <h1 className="text-[32px] font-bold text-[#2c7a4c] leading-tight">
            Diagnostik
          </h1>
          <p className="mt-1 text-base text-gray-600">
            Kontrollera systemstatus och miljövariabler
          </p>
        </div>
      </div>

      {/* Main Content - EXAKT som Hunddagis */}
      <div className="max-w-7xl mx-auto px-6 py-6">
        <div className="space-y-6">
          {/* Miljövariabler Status */}
          <div className="bg-white rounded-lg p-6 border border-gray-200 shadow-sm">
            <h2 className="text-lg font-semibold text-[#333333] mb-4">
              Miljövariabler Status
            </h2>
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm">
                <span
                  className={supabaseUrl ? "text-green-600" : "text-red-600"}
                >
                  {supabaseUrl ? "✅" : "❌"}
                </span>
                <span className="text-gray-700">
                  NEXT_PUBLIC_SUPABASE_URL: {supabaseUrl ? "OK" : "SAKNAS"}
                </span>
              </div>

              <div className="flex items-center gap-2 text-sm">
                <span
                  className={
                    supabaseAnonKey ? "text-green-600" : "text-red-600"
                  }
                >
                  {supabaseAnonKey ? "✅" : "❌"}
                </span>
                <span className="text-gray-700">
                  NEXT_PUBLIC_SUPABASE_ANON_KEY:{" "}
                  {supabaseAnonKey ? "OK" : "SAKNAS"}
                </span>
              </div>
            </div>
          </div>

          {/* Nästa steg */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
            <h2 className="text-lg font-semibold text-blue-900 mb-4">
              🚀 Nästa steg
            </h2>
            {supabaseUrl && supabaseAnonKey ? (
              <p className="text-sm text-green-700">
                ✅ Miljövariabler är konfigurerade! Appen borde fungera.
              </p>
            ) : (
              <div className="text-sm text-red-700">
                <p className="mb-2">❌ Miljövariabler saknas i Vercel.</p>
                <p>
                  Gå till Vercel Dashboard → Settings → Environment Variables
                  och lägg till:
                </p>
                <ul className="list-disc ml-6 mt-2 space-y-1">
                  <li>NEXT_PUBLIC_SUPABASE_URL</li>
                  <li>NEXT_PUBLIC_SUPABASE_ANON_KEY</li>
                  <li>SUPABASE_SERVICE_ROLE_KEY</li>
                </ul>
              </div>
            )}
          </div>

          {/* DB Health */}
          <div className="bg-white rounded-lg p-6 border border-gray-200 shadow-sm">
            <h2 className="text-lg font-semibold text-[#333333] mb-4">
              🩺 DB Health (read-only)
            </h2>
            <p className="text-xs text-gray-600 mb-4">
              Kräver att servern har ENABLE_DB_HEALTH=true. Resultatet är
              begränsat till din organisation och läser endast metadata och
              counts.
            </p>
            <button
              onClick={async () => {
                setHealthErr(null);
                setHealth(null);
                try {
                  const { data: sess } = await supabase?.auth.getSession();
                  const token = sess?.session?.access_token;
                  if (!token) {
                    setHealthErr("Ingen session. Logga in först.");
                    return;
                  }
                  const res = await fetch("/api/diagnostics/db-health", {
                    headers: { Authorization: `Bearer ${token}` },
                  });
                  const json = await res.json();
                  if (!res.ok) {
                    setHealthErr(
                      json?.error || `Kunde inte hämta (status ${res.status})`
                    );
                  }
                  setHealth(json);
                } catch (e: any) {
                  setHealthErr(e?.message || "okänt fel");
                }
              }}
              className="px-4 py-2 bg-[#2c7a4c] text-white rounded-md hover:bg-[#236139] font-semibold text-sm"
            >
              Kör DB‑health
            </button>

            {healthErr && (
              <div className="text-red-700 bg-red-50 border border-red-200 rounded-lg p-3 text-xs mt-3">
                {healthErr}
              </div>
            )}
            <pre className="bg-gray-50 p-3 rounded-lg mt-3 overflow-auto text-xs min-h-[120px] border border-gray-200">
              {health
                ? JSON.stringify(health, null, 2)
                : "<inget resultat ännu>"}
            </pre>
          </div>

          {/* System Info */}
          <div className="bg-white rounded-lg p-6 border border-gray-200 shadow-sm">
            <h2 className="text-lg font-semibold text-[#333333] mb-4">
              System Information
            </h2>
            <div className="text-xs text-gray-600 space-y-1">
              <p>Build-tid: {new Date().toISOString()}</p>
              <p>Environment: {process.env.NODE_ENV}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
