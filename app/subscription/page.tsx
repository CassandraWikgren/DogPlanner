"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/app/context/AuthContext";

type SubData = {
  status?: string;
  trial_ends_at?: string | null;
  expired: boolean;
};

export default function SubscriptionPage() {
  const { subscription, loading } = useAuth();
  const [updating, setUpdating] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [subInfo, setSubInfo] = useState<SubData | null>(null);

  useEffect(() => {
    if (subscription) setSubInfo(subscription);
  }, [subscription]);

  async function handleUpgrade() {
    if (!supabase) {
      setError("Databaskoppling saknas");
      return;
    }

    try {
      setUpdating(true);
      setMessage(null);
      setError(null);

      // ✅ Här kan du antingen:
      // 1. Köra Stripe Checkout (rekommenderat)
      // 2. Eller simulera en manuell aktivering (för test)

      // Exempel: Simulerad uppgradering (ingen Stripe än)
      const session = (await supabase.auth.getSession()).data.session;
      const token = session?.access_token;

      const res = await fetch("/api/subscription/upgrade", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      const json = await res.json();

      if (!res.ok)
        throw new Error(
          json?.error || "Kunde inte uppgradera prenumerationen."
        );

      setMessage("🎉 Ditt konto är nu aktiverat!");
      setSubInfo({ ...subInfo, status: "active", expired: false });
    } catch (e: any) {
      setError(e.message);
    } finally {
      setUpdating(false);
    }
  }

  if (loading) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-gray-50 text-gray-600">
        <p>Laddar...</p>
      </main>
    );
  }

  const trialEndDate = subInfo?.trial_ends_at
    ? new Date(subInfo.trial_ends_at).toLocaleDateString("sv-SE")
    : null;

  const expired = subInfo?.expired || false;
  const active = subInfo?.status === "active";

  return (
    <main className="min-h-screen bg-gray-50 flex flex-col items-center justify-center px-4 py-10">
      <div className="w-full max-w-lg bg-white rounded-2xl shadow p-8 text-center">
        <h1 className="text-3xl font-bold text-[#2c7a4c] mb-4">
          Prenumeration
        </h1>

        {message && (
          <div className="mb-4 rounded border border-green-200 bg-green-50 px-4 py-3 text-green-800 text-sm">
            {message}
          </div>
        )}
        {error && (
          <div className="mb-4 rounded border border-red-200 bg-red-50 px-4 py-3 text-red-700 text-sm">
            {error}
          </div>
        )}

        {active ? (
          <>
            <p className="text-gray-700 mb-4">
              ✅ Ditt konto är aktivt. Tack för att du använder DogPlanner!
            </p>
            <p className="text-sm text-gray-600 mb-8">
              Du har full tillgång till alla funktioner.
            </p>
          </>
        ) : (
          <>
            {expired ? (
              <p className="text-gray-700 mb-6">
                Din testperiod har gått ut. Aktivera ditt konto för att
                fortsätta använda DogPlanner.
              </p>
            ) : (
              <p className="text-gray-700 mb-6">
                Du är i din testperiod fram till{" "}
                <b>{trialEndDate || "okänt datum"}</b>.
              </p>
            )}

            <div className="bg-gray-50 border rounded-lg p-6 mb-6 text-left">
              <h2 className="text-xl font-semibold text-[#2c7a4c] mb-2">
                💼 DogPlanner Pro – 99 kr/mån
              </h2>
              <ul className="list-disc list-inside text-gray-700 text-sm space-y-1">
                <li>Obegränsat antal hundar och ägare</li>
                <li>Automatiska fakturor och rapporter</li>
                <li>Frisör- och pensionatsmoduler</li>
                <li>Prioriterad support</li>
              </ul>
            </div>

            <button
              disabled={updating}
              onClick={handleUpgrade}
              className="w-full bg-[#2c7a4c] hover:bg-green-800 text-white font-semibold py-2 rounded-lg transition disabled:opacity-60"
            >
              {updating ? "Bearbetar..." : "Aktivera konto (99 kr/mån)"}
            </button>

            <p className="text-xs text-gray-500 mt-3">
              Ingen bindningstid. Du kan avsluta när som helst.
            </p>
          </>
        )}
      </div>
    </main>
  );
}
