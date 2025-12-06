"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useAuth } from "@/app/context/AuthContext";
import Link from "next/link";
import { Plus, Edit2, Trash2, Calendar, DollarSign, Save } from "lucide-react";

// === TYPER ===
interface BoardingPrice {
  id: string;
  org_id: string;
  dog_size: "small" | "medium" | "large";
  base_price: number;
  weekend_surcharge: number;
  is_active: boolean;
  created_at: string;
  updated_at?: string;
}

interface SpecialDate {
  id: string;
  org_id: string;
  date: string;
  name: string;
  category: "red_day" | "holiday" | "event" | "custom";
  price_surcharge: number;
  notes?: string;
  is_active: boolean;
  created_at: string;
}

interface BoardingSeason {
  id: string;
  org_id: string;
  name: string;
  start_date: string;
  end_date: string;
  price_multiplier: number;
  priority: number;
  is_active: boolean;
  created_at: string;
}

type SizeCategory = "small" | "medium" | "large";

const SIZE_LABELS: Record<SizeCategory, string> = {
  small: "Liten (<35 cm)",
  medium: "Mellan (35-54 cm)",
  large: "Stor (>54 cm)",
};

const SIZE_RANGES: Record<SizeCategory, string> = {
  small: "<35 cm",
  medium: "35-54 cm",
  large: ">54 cm",
};

export default function PriserPage() {
  const supabase = createClient();
  const { user, currentOrgId, loading: authLoading } = useAuth();
  const [prices, setPrices] = useState<BoardingPrice[]>([]);
  const [seasons, setSeasons] = useState<BoardingSeason[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Edit states
  const [editingPrice, setEditingPrice] = useState<BoardingPrice | null>(null);
  const [editingSeason, setEditingSeason] = useState<BoardingSeason | null>(
    null
  );

  // === LADDA DATA ===
  useEffect(() => {
    if (!authLoading && currentOrgId) {
      loadData();
    }
  }, [authLoading, currentOrgId]);

  async function loadData() {
    if (!currentOrgId) return;

    setLoading(true);
    setError(null);

    try {
      const [pricesRes, seasonsRes] = await Promise.all([
        (supabase as any)
          .from("boarding_prices")
          .select("*")
          .eq("org_id", currentOrgId)
          .order("created_at", { ascending: false }),

        (supabase as any)
          .from("boarding_seasons")
          .select("*")
          .eq("org_id", currentOrgId)
          .order("start_date", { ascending: true }),
      ]);

      if (pricesRes.error) throw pricesRes.error;
      if (seasonsRes.error) throw seasonsRes.error;

      setPrices(pricesRes.data || []);
      setSeasons(seasonsRes.data || []);
    } catch (err: any) {
      console.error("Fel vid laddning:", err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  // === SPARA PRIS ===
  async function savePrice(price: Partial<BoardingPrice>) {
    if (!currentOrgId) return;

    setError(null);
    setSuccess(null);

    try {
      if (price.id) {
        // Uppdatera
        const { error } = await (supabase as any)
          .from("boarding_prices")
          .update({
            dog_size: price.dog_size,
            base_price: price.base_price,
            weekend_surcharge: price.weekend_surcharge,
          })
          .eq("id", price.id);

        if (error) throw error;
        setSuccess("✅ Grundpris uppdaterat!");
      } else {
        // Skapa nytt
        const { error } = await (supabase as any)
          .from("boarding_prices")
          .insert({
            org_id: currentOrgId,
            dog_size: price.dog_size,
            base_price: price.base_price || 300,
            weekend_surcharge: price.weekend_surcharge || 0,
            is_active: true,
          });

        if (error) throw error;
        setSuccess("✅ Grundpris skapat!");
      }

      setEditingPrice(null);
      loadData();
      setTimeout(() => setSuccess(null), 3000);
    } catch (err: any) {
      console.error("Fel vid sparande:", err);
      setError(err.message);
    }
  }

  // === SPARA SÄSONG ===
  async function saveSeason(season: Partial<BoardingSeason>) {
    if (!currentOrgId) return;

    setError(null);
    setSuccess(null);

    try {
      if (season.id) {
        // Uppdatera
        const { error } = await (supabase as any)
          .from("boarding_seasons")
          .update({
            name: season.name,
            start_date: season.start_date,
            end_date: season.end_date,
            price_multiplier: season.price_multiplier,
            priority: season.priority,
          })
          .eq("id", season.id);

        if (error) throw error;
        setSuccess("✅ Säsong uppdaterad!");
      } else {
        // Skapa ny
        const { error } = await (supabase as any)
          .from("boarding_seasons")
          .insert({
            org_id: currentOrgId,
            name: season.name,
            start_date: season.start_date,
            end_date: season.end_date,
            price_multiplier: season.price_multiplier || 1.0,
            priority: season.priority || 50,
            is_active: true,
          });

        if (error) throw error;
        setSuccess("✅ Säsong skapad!");
      }

      setEditingSeason(null);
      loadData();
      setTimeout(() => setSuccess(null), 3000);
    } catch (err: any) {
      console.error("Fel vid sparande:", err);
      setError(err.message);
    }
  }

  // === RADERA ===
  async function deletePrice(id: string) {
    if (!confirm("Är du säker på att du vill radera detta pris?")) return;

    try {
      const { error } = await (supabase as any)
        .from("boarding_prices")
        .delete()
        .eq("id", id);

      if (error) throw error;
      setSuccess("Pris raderat!");
      loadData();
    } catch (err: any) {
      setError(err.message);
    }
  }

  async function deleteSeason(id: string) {
    if (!confirm("Är du säker på att du vill radera denna säsong?")) return;

    try {
      const { error } = await (supabase as any)
        .from("boarding_seasons")
        .delete()
        .eq("id", id);

      if (error) throw error;
      setSuccess("Säsong raderad!");
      loadData();
    } catch (err: any) {
      setError(err.message);
    }
  }

  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#2c7a4c] mr-4"></div>
        <p>Laddar priser...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header - Compact & Professional */}
      <div className="border-b border-gray-200 bg-white shadow-sm">
        <div className="max-w-6xl mx-auto px-6 py-4">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <h1 className="text-[32px] font-bold text-[#2c7a4c] leading-tight">
                Priser & Säsonger
              </h1>
              <p className="mt-1 text-base text-gray-600">
                Hantera grundpriser per storlek och säsongstillägg för
                pensionatet
              </p>
            </div>
            <div className="flex items-center gap-4 ml-8">
              <div className="text-center bg-white rounded-lg px-4 py-2 border border-gray-200 shadow-sm">
                <p className="text-2xl font-bold text-[#2c7a4c]">
                  {prices.length}
                </p>
                <p className="text-xs text-gray-600 mt-0.5">Prismodeller</p>
              </div>
              <div className="text-center bg-white rounded-lg px-4 py-2 border border-gray-200 shadow-sm">
                <p className="text-2xl font-bold text-[#2c7a4c]">
                  {seasons.length}
                </p>
                <p className="text-xs text-gray-600 mt-0.5">Säsonger</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <main className="max-w-6xl mx-auto px-6 py-6">
        {/* Back button */}
        <div className="mb-6">
          <Link
            href="/hundpensionat"
            className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors text-sm"
          >
            ← Tillbaka
          </Link>
        </div>

        {/* INFO-RUTA: Hur prissättningen fungerar - Simplified */}
        <div className="bg-white border border-gray-200 rounded-lg p-5 mb-6 shadow-sm">
          <div className="flex items-start gap-3">
            <div className="text-xl">💡</div>
            <div className="flex-1">
              <h2 className="text-base font-bold text-gray-900 mb-2">
                Hur prissättningen fungerar
              </h2>
              <div className="text-sm text-gray-700 space-y-2">
                <p>
                  <strong>Steg 1:</strong> Lägg till grundpriser för alla tre
                  hundstorlekar (liten/mellan/stor)
                </p>
                <p>
                  <strong>Steg 2:</strong> Skapa säsonger för högsäsong,
                  sportlov etc. (valfritt)
                </p>
                <p className="text-xs text-gray-600 bg-gray-50 p-2 rounded">
                  <strong>Prisberäkning:</strong> SLUTPRIS = Grundpris ×
                  Säsongsmultiplikator
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Status messages */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-lg mb-6 text-sm">
            {error}
          </div>
        )}
        {success && (
          <div className="bg-white border border-gray-300 text-gray-900 px-4 py-3 rounded-lg mb-6 text-sm">
            {success}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* PRISER */}
          <div>
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                  <DollarSign className="text-[#2c7a4c]" size={20} />
                  Grundpriser
                </h2>
                <button
                  onClick={() =>
                    setEditingPrice({
                      dog_size: "medium",
                      base_price: 300,
                      weekend_surcharge: 0,
                    } as BoardingPrice)
                  }
                  className="flex items-center gap-2 px-4 py-2 bg-[#2c7a4c] text-white rounded-md hover:bg-[#236139] transition-colors text-sm"
                >
                  <Plus size={16} />
                  Lägg till grundpris
                </button>
              </div>

              {prices.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <p className="mb-2">Inga grundpriser ännu.</p>
                  <p className="text-sm">
                    ⚠️ Du måste lägga till grundpriser för att kunna ta emot
                    bokningar!
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {prices.map((price) => (
                    <div
                      key={price.id}
                      className="border border-gray-200 rounded-lg p-4 bg-white hover:shadow-md transition-shadow"
                    >
                      <div className="flex justify-between items-start mb-3">
                        <div>
                          <h3 className="font-semibold text-gray-900 text-sm">
                            {SIZE_LABELS[price.dog_size]}
                          </h3>
                          <p className="text-xl font-bold text-[#2c7a4c] mt-1">
                            {price.base_price} kr
                            <span className="text-sm font-normal text-gray-600">
                              /natt
                            </span>
                          </p>
                        </div>
                        <div className="flex gap-1">
                          <button
                            onClick={() => setEditingPrice(price)}
                            className="p-1.5 text-gray-600 hover:bg-gray-100 rounded-md transition-colors"
                          >
                            <Edit2 size={14} />
                          </button>
                          <button
                            onClick={() => deletePrice(price.id)}
                            className="p-1.5 text-gray-600 hover:bg-gray-100 rounded-md transition-colors"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </div>

                      {price.weekend_surcharge > 0 && (
                        <div className="mt-2 pt-2 border-t border-gray-200">
                          <div className="text-xs text-gray-600">
                            Helgtillägg:{" "}
                            <span className="font-semibold text-gray-900">
                              +{price.weekend_surcharge} kr
                            </span>
                          </div>
                          <div className="text-xs text-gray-500 mt-1">
                            = {price.base_price + price.weekend_surcharge} kr på
                            helger
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}

              {/* Edit Form för Grundpris - Simplified */}
              {editingPrice && (
                <div className="mt-6 p-4 bg-gray-50 border border-gray-200 rounded-lg">
                  <h3 className="font-semibold mb-4 text-sm">
                    {editingPrice.id ? "Redigera grundpris" : "Nytt grundpris"}
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium mb-2">
                        Hundstorlek
                      </label>
                      <select
                        value={editingPrice.dog_size || ""}
                        onChange={(e) =>
                          setEditingPrice({
                            ...editingPrice,
                            dog_size: e.target.value as SizeCategory,
                          })
                        }
                        className="w-full px-3 py-2 border rounded-md"
                      >
                        <option value="">Välj storlek</option>
                        {Object.entries(SIZE_LABELS).map(([key, label]) => (
                          <option key={key} value={key}>
                            {label}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-2">
                        Grundpris (kr/natt, vardag)
                      </label>
                      <input
                        type="number"
                        value={editingPrice.base_price || ""}
                        onChange={(e) =>
                          setEditingPrice({
                            ...editingPrice,
                            base_price: parseFloat(e.target.value),
                          })
                        }
                        placeholder="300"
                        className="w-full px-3 py-2 border rounded-md"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-2">
                        Helgtillägg (kr, fredag-söndag)
                      </label>
                      <input
                        type="number"
                        value={editingPrice.weekend_surcharge ?? ""}
                        onChange={(e) =>
                          setEditingPrice({
                            ...editingPrice,
                            weekend_surcharge: parseFloat(e.target.value) || 0,
                          })
                        }
                        placeholder="0"
                        className="w-full px-3 py-2 border rounded-md"
                      />
                    </div>
                  </div>
                  <div className="flex gap-2 mt-4">
                    <button
                      onClick={() => savePrice(editingPrice)}
                      className="px-4 py-2 bg-[#2c7a4c] text-white rounded-md hover:bg-[#236139] font-semibold text-sm flex items-center gap-2"
                    >
                      <Save size={16} />
                      Spara
                    </button>
                    <button
                      onClick={() => setEditingPrice(null)}
                      className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 font-semibold text-sm"
                    >
                      Avbryt
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* SÄSONGER */}
          <div>
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                  <Calendar className="text-[#2c7a4c]" size={20} />
                  Säsonger & Högtider
                </h2>
                <button
                  onClick={() =>
                    setEditingSeason({
                      name: "",
                      start_date: "",
                      end_date: "",
                      price_multiplier: 1.0,
                      priority: 50,
                    } as BoardingSeason)
                  }
                  className="flex items-center gap-2 px-4 py-2 bg-[#2c7a4c] text-white rounded-md hover:bg-[#236139] transition-colors text-sm"
                >
                  <Plus size={16} />
                  Lägg till
                </button>
              </div>

              {seasons.length === 0 ? (
                <p className="text-gray-500 py-8 text-sm">
                  Inga säsonger ännu. Klicka på "Lägg till" för att skapa.
                </p>
              ) : (
                <div className="space-y-3">
                  {seasons.map((season) => (
                    <div
                      key={season.id}
                      className="border border-gray-200 rounded-lg p-4 bg-white hover:shadow-md transition-shadow"
                    >
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <h3 className="font-semibold text-gray-900 text-sm">
                            {season.name}
                          </h3>
                          <p className="text-xs text-gray-600">
                            {new Date(season.start_date).toLocaleDateString(
                              "sv-SE"
                            )}{" "}
                            -{" "}
                            {new Date(season.end_date).toLocaleDateString(
                              "sv-SE"
                            )}
                          </p>
                        </div>
                        <div className="flex gap-1">
                          <button
                            onClick={() => setEditingSeason(season)}
                            className="p-1.5 text-gray-600 hover:bg-gray-100 rounded-md"
                          >
                            <Edit2 size={14} />
                          </button>
                          <button
                            onClick={() => deleteSeason(season.id)}
                            className="p-1.5 text-gray-600 hover:bg-gray-100 rounded-md"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 text-sm">
                        <span className="font-semibold text-gray-900">
                          {season.price_multiplier >= 1.4
                            ? "Högtid"
                            : season.price_multiplier >= 1.2
                              ? "Högsäsong"
                              : "Lågsäsong"}
                        </span>
                        <span className="text-gray-600">
                          ×{season.price_multiplier}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Edit Form - Simplified */}
              {editingSeason && (
                <div className="mt-6 p-4 bg-gray-50 border border-gray-200 rounded-lg">
                  <h3 className="font-semibold mb-4 text-sm">
                    {editingSeason.id ? "Redigera säsong" : "Ny säsong"}
                  </h3>
                  <div className="space-y-3">
                    <div>
                      <label className="block text-sm font-medium mb-1">
                        Namn
                      </label>
                      <input
                        type="text"
                        value={editingSeason.name}
                        onChange={(e) =>
                          setEditingSeason({
                            ...editingSeason,
                            name: e.target.value,
                          })
                        }
                        placeholder="t.ex. Sommar 2025"
                        className="w-full px-3 py-2 border rounded-md text-sm"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="block text-sm font-medium mb-1">
                          Startdatum
                        </label>
                        <input
                          type="date"
                          value={editingSeason.start_date}
                          onChange={(e) =>
                            setEditingSeason({
                              ...editingSeason,
                              start_date: e.target.value,
                            })
                          }
                          className="w-full px-3 py-2 border rounded-md text-sm"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-1">
                          Slutdatum
                        </label>
                        <input
                          type="date"
                          value={editingSeason.end_date}
                          onChange={(e) =>
                            setEditingSeason({
                              ...editingSeason,
                              end_date: e.target.value,
                            })
                          }
                          className="w-full px-3 py-2 border rounded-md text-sm"
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="block text-sm font-medium mb-1">
                          Prismultiplikator
                        </label>
                        <input
                          type="number"
                          step="0.1"
                          min="0.5"
                          max="3.0"
                          value={editingSeason.price_multiplier || 1.0}
                          onChange={(e) =>
                            setEditingSeason({
                              ...editingSeason,
                              price_multiplier:
                                parseFloat(e.target.value) || 1.0,
                            })
                          }
                          className="w-full px-3 py-2 border rounded-md text-sm"
                        />
                        <p className="text-xs text-gray-500 mt-1">
                          1.0 = normalpris, 1.3 = +30%, 0.8 = -20%
                        </p>
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-1">
                          Prioritet
                        </label>
                        <input
                          type="number"
                          min="0"
                          max="100"
                          value={editingSeason.priority || 50}
                          onChange={(e) =>
                            setEditingSeason({
                              ...editingSeason,
                              priority: parseInt(e.target.value) || 50,
                            })
                          }
                          className="w-full px-3 py-2 border rounded-md text-sm"
                        />
                        <p className="text-xs text-gray-500 mt-1">
                          Högre värde = högre prioritet vid överlapp
                        </p>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => saveSeason(editingSeason)}
                        className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-[#2c7a4c] text-white rounded-md hover:bg-[#236139] font-semibold text-sm"
                      >
                        <Save size={16} />
                        Spara
                      </button>
                      <button
                        onClick={() => setEditingSeason(null)}
                        className="px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 font-semibold text-sm"
                      >
                        Avbryt
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Info Box */}
        <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-6">
          <h3 className="font-bold text-blue-900 mb-3 text-sm">
            ℹ️ Hur prisberäkning fungerar
          </h3>
          <div className="space-y-2 text-sm text-blue-800">
            <p>
              <strong>1. Grundpris</strong> baseras på hundens mankhöjd:
            </p>
            <ul className="list-disc ml-6 space-y-1">
              <li>Liten (0-34 cm): 1.0x grundpris</li>
              <li>Mellan (35-49 cm): 1.2x grundpris</li>
              <li>Stor (50+ cm): 1.4x grundpris</li>
            </ul>
            <p className="mt-3">
              <strong>2. Tillägg</strong> läggs till per natt:
            </p>
            <ul className="list-disc ml-6 space-y-1">
              <li>
                <strong>Helg</strong>: Lördagar och söndagar (t.ex. 1.2x = +20%)
              </li>
              <li>
                <strong>Högtid</strong>: Definierade högtider (t.ex. 1.5x =
                +50%)
              </li>
              <li>
                <strong>Högsäsong</strong>: Definierade säsonger (t.ex. 1.3x =
                +30%)
              </li>
            </ul>
            <p className="mt-3">
              <strong>3. Rabatter</strong> dras av från totalsumman och baseras
              på ägarens rabattavtal (position_share).
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}
