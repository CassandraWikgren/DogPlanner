"use client";

// Förhindra prerendering för att undvika build-fel
export const dynamic = "force-dynamic";

import React, { useEffect, useState } from "react";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import { useAuth } from "@/app/context/AuthContext";

import Link from "next/link";
import { ArrowLeft, Plus, Trash2, Save, AlertCircle } from "lucide-react";

type SubscriptionType = {
  id: string;
  org_id: string;
  subscription_type: "Heltid" | "Deltid 2" | "Deltid 3" | "Dagshund";
  height_min: number;
  height_max: number;
  price: number;
  description: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
};

export default function HunddagisPriserPage() {
  const { currentOrgId } = useAuth();
  const supabase = createClientComponentClient();

  const [prices, setPrices] = useState<SubscriptionType[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Formulär för ny prissättning
  const [showAddForm, setShowAddForm] = useState(false);
  const [formData, setFormData] = useState({
    subscription_type: "Heltid" as
      | "Heltid"
      | "Deltid 2"
      | "Deltid 3"
      | "Dagshund",
    height_min: 0,
    height_max: 45,
    price: 0,
    description: "",
  });

  useEffect(() => {
    if (currentOrgId) {
      loadPrices();
    }
  }, [currentOrgId]);

  const loadPrices = async () => {
    if (!currentOrgId) return;

    setLoading(true);
    setError(null);

    try {
      const { data, error: fetchError } = await supabase
        .from("subscription_types")
        .select("*")
        .eq("org_id", currentOrgId)
        .order("subscription_type")
        .order("height_min");

      if (fetchError) throw fetchError;

      setPrices(data || []);
    } catch (err: any) {
      console.error("Error loading prices:", err);
      setError(err.message || "Kunde inte ladda priser");
    } finally {
      setLoading(false);
    }
  };

  const handleAddPrice = async () => {
    if (!currentOrgId) return;

    setSaving(true);
    setError(null);
    setSuccess(null);

    try {
      // Validering
      if (formData.height_min < 0 || formData.height_max < 0) {
        throw new Error("Mankhöjd måste vara positiv");
      }
      if (formData.height_min >= formData.height_max) {
        throw new Error("Min-höjd måste vara mindre än max-höjd");
      }
      if (formData.price <= 0) {
        throw new Error("Pris måste vara större än 0");
      }

      const { error: insertError } = await supabase
        .from("subscription_types")
        .insert([
          {
            org_id: currentOrgId,
            ...formData,
          },
        ]);

      if (insertError) throw insertError;

      setSuccess("Pris tillagt!");
      setShowAddForm(false);
      setFormData({
        subscription_type: "Heltid",
        height_min: 0,
        height_max: 45,
        price: 0,
        description: "",
      });
      await loadPrices();
    } catch (err: any) {
      console.error("Error adding price:", err);
      setError(err.message || "Kunde inte lägga till pris");
    } finally {
      setSaving(false);
    }
  };

  const handleDeletePrice = async (id: string) => {
    if (!confirm("Är du säker på att du vill ta bort denna prissättning?"))
      return;

    setSaving(true);
    setError(null);

    try {
      const { error: deleteError } = await supabase
        .from("subscription_types")
        .delete()
        .eq("id", id);

      if (deleteError) throw deleteError;

      setSuccess("Pris borttaget!");
      await loadPrices();
    } catch (err: any) {
      console.error("Error deleting price:", err);
      setError(err.message || "Kunde inte ta bort pris");
    } finally {
      setSaving(false);
    }
  };

  const handleUpdatePrice = async (
    id: string,
    field: keyof SubscriptionType,
    value: any
  ) => {
    setSaving(true);
    setError(null);

    try {
      const { error: updateError } = await supabase
        .from("subscription_types")
        .update({ [field]: value })
        .eq("id", id);

      if (updateError) throw updateError;

      // Uppdatera lokalt state
      setPrices((prev) =>
        prev.map((p) => (p.id === id ? { ...p, [field]: value } : p))
      );
      setSuccess("Pris uppdaterat!");
    } catch (err: any) {
      console.error("Error updating price:", err);
      setError(err.message || "Kunde inte uppdatera pris");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="text-center py-12">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-green-600 border-r-transparent"></div>
          <p className="mt-4 text-gray-600">Laddar priser...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 max-w-6xl">
      {/* Header */}
      <div className="mb-6">
        <Link
          href="/hunddagis"
          className="inline-flex items-center gap-2 text-green-700 hover:text-green-800 mb-4"
        >
          <ArrowLeft className="h-4 w-4" />
          Tillbaka till Hunddagis
        </Link>
        <h1 className="text-3xl font-bold text-gray-800">
          Prissättning Hunddagis
        </h1>
        <p className="text-gray-600 mt-2">
          Hantera priser baserat på mankhöjd och abonnemangstyp
        </p>
      </div>

      {/* Messages */}
      {error && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
          <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold text-red-800">Fel</p>
            <p className="text-red-700">{error}</p>
          </div>
        </div>
      )}

      {success && (
        <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-lg">
          <p className="text-green-800">✓ {success}</p>
        </div>
      )}

      {/* Add New Price Button */}
      {!showAddForm && (
        <button
          onClick={() => setShowAddForm(true)}
          className="mb-6 inline-flex items-center gap-2 px-4 py-2 bg-green-600 text-white font-semibold rounded-lg hover:bg-green-700 transition"
        >
          <Plus className="h-4 w-4" />
          Lägg till nytt pris
        </button>
      )}

      {/* Add Price Form */}
      {showAddForm && (
        <div className="mb-6 p-6 bg-white border rounded-lg shadow-sm">
          <h3 className="text-lg font-semibold mb-4">Lägg till nytt pris</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Abonnemangstyp
              </label>
              <select
                className="w-full border rounded-lg px-3 py-2"
                value={formData.subscription_type}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    subscription_type: e.target.value as any,
                  })
                }
              >
                <option value="Heltid">Heltid (5 dagar/vecka)</option>
                <option value="Deltid 3">Deltid 3 (3 dagar/vecka)</option>
                <option value="Deltid 2">Deltid 2 (2 dagar/vecka)</option>
                <option value="Dagshund">Dagshund (per dag)</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Pris (SEK/månad eller per dag för Dagshund)
              </label>
              <input
                type="number"
                className="w-full border rounded-lg px-3 py-2"
                value={formData.price}
                onChange={(e) =>
                  setFormData({ ...formData, price: Number(e.target.value) })
                }
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Mankhöjd från (cm)
              </label>
              <input
                type="number"
                className="w-full border rounded-lg px-3 py-2"
                value={formData.height_min}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    height_min: Number(e.target.value),
                  })
                }
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Mankhöjd till (cm)
              </label>
              <input
                type="number"
                className="w-full border rounded-lg px-3 py-2"
                value={formData.height_max}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    height_max: Number(e.target.value),
                  })
                }
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Beskrivning (valfritt)
              </label>
              <input
                type="text"
                className="w-full border rounded-lg px-3 py-2"
                value={formData.description}
                onChange={(e) =>
                  setFormData({ ...formData, description: e.target.value })
                }
                placeholder="T.ex. 'Liten hund'"
              />
            </div>
          </div>

          <div className="flex gap-3 mt-4">
            <button
              onClick={handleAddPrice}
              disabled={saving}
              className="inline-flex items-center gap-2 px-4 py-2 bg-green-600 text-white font-semibold rounded-lg hover:bg-green-700 transition disabled:opacity-50"
            >
              <Save className="h-4 w-4" />
              {saving ? "Sparar..." : "Spara"}
            </button>
            <button
              onClick={() => setShowAddForm(false)}
              className="px-4 py-2 bg-gray-200 text-gray-700 font-semibold rounded-lg hover:bg-gray-300 transition"
            >
              Avbryt
            </button>
          </div>
        </div>
      )}

      {/* Prices Table */}
      <div className="bg-white border rounded-lg shadow-sm overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50 border-b">
            <tr>
              <th className="text-left px-4 py-3 font-semibold text-gray-700">
                Abonnemang
              </th>
              <th className="text-left px-4 py-3 font-semibold text-gray-700">
                Mankhöjd (cm)
              </th>
              <th className="text-left px-4 py-3 font-semibold text-gray-700">
                Pris (SEK)
              </th>
              <th className="text-left px-4 py-3 font-semibold text-gray-700">
                Beskrivning
              </th>
              <th className="text-center px-4 py-3 font-semibold text-gray-700">
                Åtgärder
              </th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {prices.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-gray-500">
                  Inga priser ännu. Klicka på "Lägg till nytt pris" för att
                  komma igång.
                </td>
              </tr>
            ) : (
              prices.map((price) => (
                <tr key={price.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3">{price.subscription_type}</td>
                  <td className="px-4 py-3">
                    {price.height_min} - {price.height_max} cm
                  </td>
                  <td className="px-4 py-3">
                    <input
                      type="number"
                      className="w-24 border rounded px-2 py-1"
                      value={price.price}
                      onChange={(e) =>
                        handleUpdatePrice(
                          price.id,
                          "price",
                          Number(e.target.value)
                        )
                      }
                    />
                    kr
                  </td>
                  <td className="px-4 py-3">
                    <input
                      type="text"
                      className="w-full border rounded px-2 py-1"
                      value={price.description || ""}
                      onChange={(e) =>
                        handleUpdatePrice(
                          price.id,
                          "description",
                          e.target.value
                        )
                      }
                      placeholder="Beskrivning..."
                    />
                  </td>
                  <td className="px-4 py-3 text-center">
                    <button
                      onClick={() => handleDeletePrice(price.id)}
                      className="inline-flex items-center gap-1 px-3 py-1.5 text-red-600 hover:bg-red-50 border border-gray-300 hover:border-red-500 rounded transition"
                      title="Ta bort"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Info Box */}
      <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
        <h4 className="font-semibold text-blue-800 mb-2">
          💡 Tips för prissättning
        </h4>
        <ul className="text-sm text-blue-700 space-y-1">
          <li>
            • <strong>Heltid/Deltid:</strong> Ange pris per månad
          </li>
          <li>
            • <strong>Dagshund:</strong> Ange pris per dag
          </li>
          <li>
            • Mankhöjden på hunden används för att automatiskt välja rätt pris
          </li>
          <li>• Du kan redigera pris och beskrivning direkt i tabellen</li>
        </ul>
      </div>
    </div>
  );
}
