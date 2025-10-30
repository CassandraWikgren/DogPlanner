"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/app/context/AuthContext";
import Link from "next/link";
import { Plus, Edit2, Trash2, Calendar, DollarSign, Save } from "lucide-react";

// === TYPER ===
interface BoardingPrice {
  id: string;
  org_id: string;
  size_category: "small" | "medium" | "large" | null;
  base_price: number;
  weekend_multiplier: number;
  holiday_multiplier: number;
  high_season_multiplier: number;
  created_at: string;
}

interface BoardingSeason {
  id: string;
  org_id: string;
  name: string;
  start_date: string;
  end_date: string;
  type: "high" | "low" | "holiday";
  created_at: string;
}

type SizeCategory = "small" | "medium" | "large";

const SIZE_LABELS: Record<SizeCategory, string> = {
  small: "Liten (0-34 cm)",
  medium: "Mellan (35-49 cm)",
  large: "Stor (50+ cm)",
};

const SIZE_RANGES: Record<SizeCategory, string> = {
  small: "0-34 cm",
  medium: "35-49 cm",
  large: "50+ cm",
};

export default function PriserPage() {
  const { user, loading: authLoading } = useAuth();
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
    if (!user || authLoading) return;
    loadData();
  }, [user, authLoading]);

  async function loadData() {
    setLoading(true);
    setError(null);

    try {
      const orgId = user?.user_metadata?.org_id || user?.id;

      const [pricesRes, seasonsRes] = await Promise.all([
        (supabase as any)
          .from("boarding_prices")
          .select("*")
          .eq("org_id", orgId)
          .order("created_at", { ascending: false }),

        (supabase as any)
          .from("boarding_seasons")
          .select("*")
          .eq("org_id", orgId)
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
    setError(null);
    setSuccess(null);

    try {
      const orgId = user?.user_metadata?.org_id || user?.id;

      if (price.id) {
        // Uppdatera
        const { error } = await (supabase as any)
          .from("boarding_prices")
          .update({
            size_category: price.size_category,
            base_price: price.base_price,
            weekend_multiplier: price.weekend_multiplier,
            holiday_multiplier: price.holiday_multiplier,
            high_season_multiplier: price.high_season_multiplier,
          })
          .eq("id", price.id);

        if (error) throw error;
        setSuccess("Pris uppdaterat!");
      } else {
        // Skapa nytt
        const { error } = await (supabase as any)
          .from("boarding_prices")
          .insert({
            org_id: orgId,
            size_category: price.size_category,
            base_price: price.base_price || 300,
            weekend_multiplier: price.weekend_multiplier || 1.2,
            holiday_multiplier: price.holiday_multiplier || 1.5,
            high_season_multiplier: price.high_season_multiplier || 1.3,
          });

        if (error) throw error;
        setSuccess("Pris skapat!");
      }

      setEditingPrice(null);
      loadData();
    } catch (err: any) {
      console.error("Fel vid sparande:", err);
      setError(err.message);
    }
  }

  // === SPARA SÄSONG ===
  async function saveSeason(season: Partial<BoardingSeason>) {
    setError(null);
    setSuccess(null);

    try {
      const orgId = user?.user_metadata?.org_id || user?.id;

      if (season.id) {
        // Uppdatera
        const { error } = await (supabase as any)
          .from("boarding_seasons")
          .update({
            name: season.name,
            start_date: season.start_date,
            end_date: season.end_date,
            type: season.type,
          })
          .eq("id", season.id);

        if (error) throw error;
        setSuccess("Säsong uppdaterad!");
      } else {
        // Skapa ny
        const { error } = await (supabase as any)
          .from("boarding_seasons")
          .insert({
            org_id: orgId,
            name: season.name,
            start_date: season.start_date,
            end_date: season.end_date,
            type: season.type || "high",
          });

        if (error) throw error;
        setSuccess("Säsong skapad!");
      }

      setEditingSeason(null);
      loadData();
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
      {/* Hero Section */}
      <div
        className="relative bg-cover bg-center pt-20 pb-28"
        style={{
          backgroundImage: `linear-gradient(rgba(44, 122, 76, 0.88), rgba(44, 122, 76, 0.88)), url('/Hero.jpeg')`,
        }}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
            💰 Priser & Säsonger
          </h1>
          <p className="text-lg text-white/90 max-w-2xl mx-auto">
            Hantera grundpriser per storlek och säsongstillägg för pensionatet
          </p>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-12 pb-12">
        {/* Back button */}
        <div className="mb-6">
          <Link
            href="/hundpensionat"
            className="inline-flex items-center gap-2 px-4 py-2 bg-white text-gray-700 rounded-lg hover:bg-gray-50 transition-colors border border-gray-300"
          >
            ← Tillbaka till Hundpensionat
          </Link>
        </div>

        {/* Status messages */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-lg mb-6">
            {error}
          </div>
        )}
        {success && (
          <div className="bg-green-50 border border-green-200 text-green-800 px-4 py-3 rounded-lg mb-6">
            {success}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* PRISER */}
          <div>
            <div className="bg-white rounded-lg shadow-lg border border-gray-200 p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
                  <DollarSign className="text-[#2c7a4c]" />
                  Grundpriser
                </h2>
                <button
                  onClick={() =>
                    setEditingPrice({
                      id: "",
                      org_id: "",
                      size_category: "medium",
                      base_price: 300,
                      weekend_multiplier: 1.2,
                      holiday_multiplier: 1.5,
                      high_season_multiplier: 1.3,
                      created_at: "",
                    })
                  }
                  className="flex items-center gap-2 px-4 py-2 bg-[#2c7a4c] text-white rounded-lg hover:bg-[#236139] transition-colors"
                >
                  <Plus size={16} />
                  Lägg till
                </button>
              </div>

              {prices.length === 0 ? (
                <p className="text-gray-500 text-center py-8">
                  Inga priser ännu. Klicka på "Lägg till" för att skapa.
                </p>
              ) : (
                <div className="space-y-4">
                  {prices.map((price) => (
                    <div
                      key={price.id}
                      className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors"
                    >
                      <div className="flex justify-between items-start mb-3">
                        <div>
                          <h3 className="font-semibold text-gray-900">
                            {price.size_category
                              ? SIZE_LABELS[price.size_category]
                              : "Allmänt"}
                          </h3>
                          <p className="text-sm text-gray-600">
                            Grundpris: {price.base_price} kr/natt
                          </p>
                        </div>
                        <div className="flex gap-2">
                          <button
                            onClick={() => setEditingPrice(price)}
                            className="p-2 text-blue-600 hover:bg-blue-50 rounded"
                          >
                            <Edit2 size={16} />
                          </button>
                          <button
                            onClick={() => deletePrice(price.id)}
                            className="p-2 text-red-600 hover:bg-red-50 rounded"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </div>
                      <div className="grid grid-cols-3 gap-2 text-sm">
                        <div className="bg-orange-50 px-2 py-1 rounded">
                          <span className="text-gray-600">Helg:</span>{" "}
                          <span className="font-medium">
                            {price.weekend_multiplier}x
                          </span>
                        </div>
                        <div className="bg-red-50 px-2 py-1 rounded">
                          <span className="text-gray-600">Högtid:</span>{" "}
                          <span className="font-medium">
                            {price.holiday_multiplier}x
                          </span>
                        </div>
                        <div className="bg-yellow-50 px-2 py-1 rounded">
                          <span className="text-gray-600">Säsong:</span>{" "}
                          <span className="font-medium">
                            {price.high_season_multiplier}x
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Edit Form */}
              {editingPrice && (
                <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                  <h3 className="font-semibold mb-4">
                    {editingPrice.id ? "Redigera pris" : "Nytt pris"}
                  </h3>
                  <div className="space-y-3">
                    <div>
                      <label className="block text-sm font-medium mb-1">
                        Storlek
                      </label>
                      <select
                        value={editingPrice.size_category || ""}
                        onChange={(e) =>
                          setEditingPrice({
                            ...editingPrice,
                            size_category: e.target.value as SizeCategory,
                          })
                        }
                        className="w-full px-3 py-2 border rounded-lg"
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
                      <label className="block text-sm font-medium mb-1">
                        Grundpris (kr/natt)
                      </label>
                      <input
                        type="number"
                        value={editingPrice.base_price}
                        onChange={(e) =>
                          setEditingPrice({
                            ...editingPrice,
                            base_price: parseFloat(e.target.value),
                          })
                        }
                        className="w-full px-3 py-2 border rounded-lg"
                      />
                    </div>
                    <div className="grid grid-cols-3 gap-2">
                      <div>
                        <label className="block text-sm font-medium mb-1">
                          Helg (x)
                        </label>
                        <input
                          type="number"
                          step="0.1"
                          value={editingPrice.weekend_multiplier}
                          onChange={(e) =>
                            setEditingPrice({
                              ...editingPrice,
                              weekend_multiplier: parseFloat(e.target.value),
                            })
                          }
                          className="w-full px-3 py-2 border rounded-lg"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-1">
                          Högtid (x)
                        </label>
                        <input
                          type="number"
                          step="0.1"
                          value={editingPrice.holiday_multiplier}
                          onChange={(e) =>
                            setEditingPrice({
                              ...editingPrice,
                              holiday_multiplier: parseFloat(e.target.value),
                            })
                          }
                          className="w-full px-3 py-2 border rounded-lg"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-1">
                          Säsong (x)
                        </label>
                        <input
                          type="number"
                          step="0.1"
                          value={editingPrice.high_season_multiplier}
                          onChange={(e) =>
                            setEditingPrice({
                              ...editingPrice,
                              high_season_multiplier: parseFloat(
                                e.target.value
                              ),
                            })
                          }
                          className="w-full px-3 py-2 border rounded-lg"
                        />
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => savePrice(editingPrice)}
                        className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-[#2c7a4c] text-white rounded-lg hover:bg-[#236139]"
                      >
                        <Save size={16} />
                        Spara
                      </button>
                      <button
                        onClick={() => setEditingPrice(null)}
                        className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
                      >
                        Avbryt
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* SÄSONGER */}
          <div>
            <div className="bg-white rounded-lg shadow-lg border border-gray-200 p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
                  <Calendar className="text-[#2c7a4c]" />
                  Säsonger & Högtider
                </h2>
                <button
                  onClick={() =>
                    setEditingSeason({
                      id: "",
                      org_id: "",
                      name: "",
                      start_date: "",
                      end_date: "",
                      type: "high",
                      created_at: "",
                    })
                  }
                  className="flex items-center gap-2 px-4 py-2 bg-[#2c7a4c] text-white rounded-lg hover:bg-[#236139] transition-colors"
                >
                  <Plus size={16} />
                  Lägg till
                </button>
              </div>

              {seasons.length === 0 ? (
                <p className="text-gray-500 text-center py-8">
                  Inga säsonger ännu. Klicka på "Lägg till" för att skapa.
                </p>
              ) : (
                <div className="space-y-4">
                  {seasons.map((season) => (
                    <div
                      key={season.id}
                      className={`border rounded-lg p-4 hover:bg-gray-50 transition-colors ${
                        season.type === "holiday"
                          ? "border-red-200 bg-red-50"
                          : season.type === "high"
                          ? "border-yellow-200 bg-yellow-50"
                          : "border-blue-200 bg-blue-50"
                      }`}
                    >
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <h3 className="font-semibold text-gray-900">
                            {season.name}
                          </h3>
                          <p className="text-sm text-gray-600">
                            {new Date(season.start_date).toLocaleDateString(
                              "sv-SE"
                            )}{" "}
                            -{" "}
                            {new Date(season.end_date).toLocaleDateString(
                              "sv-SE"
                            )}
                          </p>
                        </div>
                        <div className="flex gap-2">
                          <button
                            onClick={() => setEditingSeason(season)}
                            className="p-2 text-blue-600 hover:bg-blue-100 rounded"
                          >
                            <Edit2 size={16} />
                          </button>
                          <button
                            onClick={() => deleteSeason(season.id)}
                            className="p-2 text-red-600 hover:bg-red-100 rounded"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </div>
                      <span
                        className={`inline-block px-3 py-1 rounded-full text-xs font-semibold ${
                          season.type === "holiday"
                            ? "bg-red-200 text-red-800"
                            : season.type === "high"
                            ? "bg-yellow-200 text-yellow-800"
                            : "bg-blue-200 text-blue-800"
                        }`}
                      >
                        {season.type === "holiday"
                          ? "🎉 Högtid"
                          : season.type === "high"
                          ? "☀️ Högsäsong"
                          : "❄️ Lågsäsong"}
                      </span>
                    </div>
                  ))}
                </div>
              )}

              {/* Edit Form */}
              {editingSeason && (
                <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                  <h3 className="font-semibold mb-4">
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
                        className="w-full px-3 py-2 border rounded-lg"
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
                          className="w-full px-3 py-2 border rounded-lg"
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
                          className="w-full px-3 py-2 border rounded-lg"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">
                        Typ
                      </label>
                      <select
                        value={editingSeason.type}
                        onChange={(e) =>
                          setEditingSeason({
                            ...editingSeason,
                            type: e.target.value as "high" | "low" | "holiday",
                          })
                        }
                        className="w-full px-3 py-2 border rounded-lg"
                      >
                        <option value="high">☀️ Högsäsong</option>
                        <option value="low">❄️ Lågsäsong</option>
                        <option value="holiday">🎉 Högtid</option>
                      </select>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => saveSeason(editingSeason)}
                        className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-[#2c7a4c] text-white rounded-lg hover:bg-[#236139]"
                      >
                        <Save size={16} />
                        Spara
                      </button>
                      <button
                        onClick={() => setEditingSeason(null)}
                        className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
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
          <h3 className="font-semibold text-blue-900 mb-3">
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
      </div>
    </div>
  );
}
