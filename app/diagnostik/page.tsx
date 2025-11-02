"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabase";

export default function DiagnosticsPage() {
  const [health, setHealth] = useState<any>(null);
  const [healthErr, setHealthErr] = useState<string | null>(null);
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">🔍 DogPlanner Diagnostik</h1>

      <div className="bg-gray-100 p-6 rounded-lg mb-6">
        <h2 className="text-xl font-semibold mb-4">Miljövariabler Status:</h2>

        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <span className={supabaseUrl ? "text-green-600" : "text-red-600"}>
              {supabaseUrl ? "✅" : "❌"}
            </span>
            <span>
              NEXT_PUBLIC_SUPABASE_URL: {supabaseUrl ? "OK" : "SAKNAS"}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <span
              className={supabaseAnonKey ? "text-green-600" : "text-red-600"}
            >
              {supabaseAnonKey ? "✅" : "❌"}
            </span>
            <span>
              NEXT_PUBLIC_SUPABASE_ANON_KEY: {supabaseAnonKey ? "OK" : "SAKNAS"}
            </span>
          </div>
        </div>
      </div>

      <div className="bg-blue-100 p-6 rounded-lg">
        <h2 className="text-xl font-semibold mb-4">🚀 Nästa steg:</h2>
        {supabaseUrl && supabaseAnonKey ? (
          <p className="text-green-700">
            ✅ Miljövariabler är konfigurerade! Appen borde fungera.
          </p>
        ) : (
          <div className="text-red-700">
            <p className="mb-2">❌ Miljövariabler saknas i Vercel.</p>
            <p>
              Gå till Vercel Dashboard → Settings → Environment Variables och
              lägg till:
            </p>
            <ul className="list-disc ml-6 mt-2">
              <li>NEXT_PUBLIC_SUPABASE_URL</li>
              <li>NEXT_PUBLIC_SUPABASE_ANON_KEY</li>
              <li>SUPABASE_SERVICE_ROLE_KEY</li>
            </ul>
          </div>
        )}
      </div>

      <div className="bg-gray-100 p-6 rounded-lg mt-6">
        <h2 className="text-xl font-semibold mb-4">🩺 DB Health (read-only)</h2>
        <p className="text-sm text-gray-600 mb-2">
          Kräver att servern har ENABLE_DB_HEALTH=true. Resultatet är begränsat
          till din organisation och läser endast metadata och counts.
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
          className="px-3 py-2 rounded bg-black text-white hover:opacity-90"
        >
          Kör DB‑health
        </button>

        {healthErr && (
          <div className="text-red-700 bg-red-50 border border-red-200 rounded p-2 text-sm mt-3">
            {healthErr}
          </div>
        )}
        <pre className="bg-white p-3 rounded mt-3 overflow-auto text-sm min-h-[120px]">
          {health ? JSON.stringify(health, null, 2) : "<inget resultat ännu>"}
        </pre>
      </div>

      <div className="mt-6 text-sm text-gray-600">
        <p>Build-tid: {new Date().toISOString()}</p>
        <p>Environment: {process.env.NODE_ENV}</p>
      </div>
    </div>
  );
}
