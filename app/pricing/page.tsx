"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import PageContainer from "@/components/PageContainer";

const PRIMARY_GREEN = "#2c7a4c";

type PriceItems = {
  heltid?: number;
  deltid2?: number;
  deltid3?: number;
  kloklipp?: number;
  tasstrim?: number;
  hundbad?: number;
  tandvard?: number;
  oronrengoring?: number;
  valptillagg?: number;
  extra?: number;
};

type PriceListRecord = {
  id: string;
  org_id: string;
  effective_from: string;
  items: PriceItems;
  created_at: string;
  updated_at?: string;
};

export default function MinaPriserPage() {
  const [prices, setPrices] = useState<PriceItems>({});
  const [lastUpdated, setLastUpdated] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [history, setHistory] = useState<PriceListRecord[]>([]);

  // === Hämta senaste prislistan & historik ===
  useEffect(() => {
    (async () => {
      if (!supabase) return;

      const { data, error } = await supabase
        .from("price_lists")
        .select("*")
        .order("effective_from", { ascending: false });

      if (!error && data) {
        const typedData = data as PriceListRecord[];
        setHistory(typedData);
        const latest = typedData[0];
        if (latest) {
          setPrices(latest.items || {});
          if (latest.updated_at) {
            const d = new Date(latest.updated_at);
            setLastUpdated(
              d.toLocaleDateString("sv-SE", {
                year: "numeric",
                month: "2-digit",
                day: "2-digit",
              })
            );
          }
        }
      }
    })();
  }, []);

  // === Spara nya priser ===
  async function savePrices() {
    if (!supabase) {
      setMessage("❌ Databaskoppling saknas");
      return;
    }

    setSaving(true);

    const today = new Date().toISOString().split("T")[0];
    const { error } = await (supabase as any).from("price_lists").insert([
      {
        org_id: (await supabase.auth.getUser()).data.user?.id,
        effective_from: today,
        items: prices,
      },
    ]);

    setSaving(false);
    if (error) {
      console.error(error);
      setMessage("❌ Ett fel uppstod när priserna skulle sparas.");
    } else {
      setMessage("✅ Priserna har sparats!");
      setLastUpdated(new Date().toLocaleDateString("sv-SE"));
      fetchHistory(); // Uppdatera historiken direkt
      setTimeout(() => setMessage(null), 3000);
    }
  }

  // === Hämta historik separat ===
  async function fetchHistory() {
    if (!supabase) return;

    const { data, error } = await supabase
      .from("price_lists")
      .select("*")
      .order("effective_from", { ascending: false });
    if (!error && data) setHistory(data);
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Kompakt header */}
      <div className="bg-white border-b shadow-sm">
        <div className="max-w-3xl mx-auto px-6 py-4">
          <div className="flex items-center gap-4">
            <a
              href="/dashboard"
              className="text-gray-600 hover:text-[#2C7A4C] transition-colors"
            >
              ← Tillbaka
            </a>
            <h1 className="text-2xl font-bold text-[#2C7A4C] leading-tight">
              Mina priser
            </h1>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="max-w-3xl mx-auto px-6 py-6">
        {message && (
          <div className="mb-4 rounded-md bg-emerald-50 border border-emerald-200 text-emerald-800 p-3 text-sm">
            {message}
          </div>
        )}

        <p className="text-sm text-gray-600 mb-6">
          Här kan du ange vilka priser som gäller för ditt företag. Dessa
          används automatiskt vid fakturering och tilläggstjänster.
        </p>

        {/* Dagispriser */}
        <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6 mb-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            Dagisabonnemang
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <PriceField
              label="Heltid (kr/mån)"
              value={prices.heltid}
              onChange={(v) => setPrices({ ...prices, heltid: v })}
            />
            <PriceField
              label="Deltid 2 (kr/mån)"
              value={prices.deltid2}
              onChange={(v) => setPrices({ ...prices, deltid2: v })}
            />
            <PriceField
              label="Deltid 3 (kr/mån)"
              value={prices.deltid3}
              onChange={(v) => setPrices({ ...prices, deltid3: v })}
            />
          </div>
        </div>

        {/* Tilläggstjänster */}
        <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6 mb-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            Tilläggstjänster
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <PriceField
              label="Kloklipp (kr)"
              value={prices.kloklipp}
              onChange={(v) => setPrices({ ...prices, kloklipp: v })}
            />
            <PriceField
              label="Tasstrim (kr)"
              value={prices.tasstrim}
              onChange={(v) => setPrices({ ...prices, tasstrim: v })}
            />
            <PriceField
              label="Hundbad (kr)"
              value={prices.hundbad}
              onChange={(v) => setPrices({ ...prices, hundbad: v })}
            />
            <PriceField
              label="Tandvård (kr)"
              value={prices.tandvard}
              onChange={(v) => setPrices({ ...prices, tandvard: v })}
            />
            <PriceField
              label="Öronrengöring (kr)"
              value={prices.oronrengoring}
              onChange={(v) => setPrices({ ...prices, oronrengoring: v })}
            />
            <PriceField
              label="Valptillägg (kr)"
              value={prices.valptillagg}
              onChange={(v) => setPrices({ ...prices, valptillagg: v })}
            />
            <PriceField
              label="Extra (kr)"
              value={prices.extra}
              onChange={(v) => setPrices({ ...prices, extra: v })}
            />
          </div>
        </div>

        <div className="flex justify-between items-center mb-6">
          <button
            onClick={savePrices}
            disabled={saving}
            className="px-6 py-2 bg-[#2C7A4C] text-white rounded-md hover:bg-[#236139] font-semibold transition disabled:opacity-50 text-sm"
          >
            {saving ? "💾 Sparar…" : "Spara priser"}
          </button>

          {lastUpdated && (
            <p className="text-xs text-gray-500">
              Senast ändrad: {lastUpdated}
            </p>
          )}
        </div>

        {/* Historikvy */}
        {history.length > 1 && (
          <section className="bg-white rounded-lg border border-gray-200 shadow-sm p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              📜 Tidigare prisändringar
            </h2>
            <div className="divide-y">
              {history.map((h, i) => (
                <div
                  key={h.id}
                  className="flex justify-between items-center py-3 text-sm"
                >
                  <span className="text-gray-900">
                    <b>
                      {i === 0 ? "Aktuell prislista" : "Tidigare prislista"}
                    </b>{" "}
                    från{" "}
                    {new Date(h.effective_from).toLocaleDateString("sv-SE", {
                      year: "numeric",
                      month: "2-digit",
                      day: "2-digit",
                    })}
                  </span>
                  <span className="text-gray-500 text-xs">
                    Uppdaterad:{" "}
                    {h.updated_at
                      ? new Date(h.updated_at).toLocaleDateString("sv-SE")
                      : "–"}
                  </span>
                </div>
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  );
}

/* Komponent för varje prisfält */
function PriceField({
  label,
  value,
  onChange,
}: {
  label: string;
  value?: number;
  onChange: (v: number) => void;
}) {
  return (
    <div>
      <label className="block text-sm font-semibold text-[#2C7A4C] mb-2">
        {label}
      </label>
      <Input
        type="number"
        value={value ?? ""}
        onChange={(e) => onChange(Number(e.target.value))}
        className="h-10"
      />
    </div>
  );
}
