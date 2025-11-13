"use client";

export const dynamic = "force-dynamic";

import React, { useState, useEffect } from "react";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import { useAuth } from "@/app/context/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  ArrowLeft,
  Save,
  AlertCircle,
  CheckCircle,
  Calendar,
  Plus,
  Trash2,
  TrendingUp,
  Dog,
  Sparkles,
} from "lucide-react";
import Link from "next/link";

/**
 * PRISSYSTEM FÖR HUNDPENSIONAT
 * 
 * 3-LAGERS ARKITEKTUR:
 * 1. Grundpriser (boarding_prices) - base_price + weekend_surcharge per hundstorlek
 * 2. Specialdatum (special_dates) - röda dagar, högtider, event med individual price_surcharge
 * 3. Säsonger (boarding_seasons) - sommar, vinter, sportlov med price_multiplier
 * 
 * PRISBERÄKNING:
 * final_price = (base_price + (special_date_surcharge || weekend_surcharge)) × season_multiplier
 */

// ===========================
// TYPES & INTERFACES
// ===========================

interface BoardingPrice {
  id: string;
  org_id: string;
  dog_size: "small" | "medium" | "large";
  base_price: number;
  weekend_surcharge: number;
  is_active: boolean;
  created_at?: string;
  updated_at?: string;
}

interface SpecialDate {
  id: string;
  org_id: string;
  date: string;
  name: string;
  category: "red_day" | "holiday" | "event" | "custom";
  price_surcharge: number;
  is_active: boolean;
  created_at?: string;
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
  created_at?: string;
}

interface ExtraService {
  id: string;
  org_id: string;
  label: string;
  price: number;
  unit: "per dag" | "per gång" | "fast pris";
  service_type: "boarding" | "daycare" | "both";
  is_active: boolean;
}

type TabType = "grundpriser" | "specialdatum" | "säsonger" | "tillval";

// ===========================
// MAIN COMPONENT
// ===========================

export default function PensionatPriserPage() {
  const supabase = createClientComponentClient();
  const { currentOrgId } = useAuth();

  // State
  const [activeTab, setActiveTab] = useState<TabType>("grundpriser");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Data state
  const [boardingPrices, setBoardingPrices] = useState<BoardingPrice[]>([]);
  const [specialDates, setSpecialDates] = useState<SpecialDate[]>([]);
  const [seasons, setSeasons] = useState<BoardingSeason[]>([]);
  const [extraServices, setExtraServices] = useState<ExtraService[]>([]);

  // Form state for new entries
  const [newSpecialDate, setNewSpecialDate] = useState({
    date: "",
    name: "",
    category: "custom" as "red_day" | "holiday" | "event" | "custom",
    price_surcharge: 0,
  });

  const [newSeason, setNewSeason] = useState({
    name: "",
    start_date: "",
    end_date: "",
    price_multiplier: 1.0,
    priority: 50,
  });

  const [newService, setNewService] = useState({
    label: "",
    price: 0,
    unit: "per gång" as "per dag" | "per gång" | "fast pris",
  });

  // ===========================
  // LOAD DATA
  // ===========================

  useEffect(() => {
    if (currentOrgId) {
      loadAllData();
    }
  }, [currentOrgId]);

  const loadAllData = async () => {
    setLoading(true);
    await Promise.all([
      loadBoardingPrices(),
      loadSpecialDates(),
      loadSeasons(),
      loadExtraServices(),
    ]);
    setLoading(false);
  };

  const loadBoardingPrices = async () => {
    if (!currentOrgId) return;

    try {
      const { data, error } = await supabase
        .from("boarding_prices")
        .select("*")
        .eq("org_id", currentOrgId)
        .eq("is_active", true)
        .order("dog_size");

      if (error) throw error;

      // Ensure all 3 sizes exist
      const sizes: ("small" | "medium" | "large")[] = ["small", "medium", "large"];
      const existingSizes = new Set(data?.map((p) => p.dog_size) || []);
      
      const missingPrices = sizes
        .filter((size) => !existingSizes.has(size))
        .map((size) => ({
          id: `temp-${size}`,
          org_id: currentOrgId,
          dog_size: size,
          base_price: size === "small" ? 400 : size === "medium" ? 450 : 500,
          weekend_surcharge: 100,
          is_active: true,
        }));

      setBoardingPrices([...(data || []), ...missingPrices]);
    } catch (err: any) {
      console.error("Error loading boarding prices:", err);
      setError("Kunde inte ladda grundpriser");
    }
  };

  const loadSpecialDates = async () => {
    if (!currentOrgId) return;

    try {
      const { data, error } = await supabase
        .from("special_dates")
        .select("*")
        .eq("org_id", currentOrgId)
        .eq("is_active", true)
        .order("date");

      if (error) throw error;
      setSpecialDates(data || []);
    } catch (err: any) {
      console.error("Error loading special dates:", err);
    }
  };

  const loadSeasons = async () => {
    if (!currentOrgId) return;

    try {
      const { data, error } = await supabase
        .from("boarding_seasons")
        .select("*")
        .eq("org_id", currentOrgId)
        .eq("is_active", true)
        .order("start_date");

      if (error) throw error;
      setSeasons(data || []);
    } catch (err: any) {
      console.error("Error loading seasons:", err);
    }
  };

  const loadExtraServices = async () => {
    if (!currentOrgId) return;

    try {
      const { data, error } = await supabase
        .from("extra_services")
        .select("*")
        .eq("org_id", currentOrgId)
        .in("service_type", ["boarding", "both"])
        .eq("is_active", true);

      if (error) throw error;
      setExtraServices(data || []);
    } catch (err: any) {
      console.error("Error loading extra services:", err);
    }
  };

  // ===========================
  // GRUNDPRISER - SAVE/UPDATE
  // ===========================

  const handleUpdateBasePrice = async (
    size: "small" | "medium" | "large",
    field: "base_price" | "weekend_surcharge",
    value: number
  ) => {
    if (!currentOrgId) return;

    try {
      const existingPrice = boardingPrices.find((p) => p.dog_size === size);

      if (existingPrice && !existingPrice.id.startsWith("temp-")) {
        // Update existing
        const { error } = await supabase
          .from("boarding_prices")
          .update({ [field]: value, updated_at: new Date().toISOString() })
          .eq("id", existingPrice.id);

        if (error) throw error;
      } else {
        // Insert new
        const { data, error } = await supabase
          .from("boarding_prices")
          .insert([
            {
              org_id: currentOrgId,
              dog_size: size,
              base_price: field === "base_price" ? value : existingPrice?.base_price || 400,
              weekend_surcharge: field === "weekend_surcharge" ? value : existingPrice?.weekend_surcharge || 100,
              is_active: true,
            },
          ])
          .select()
          .single();

        if (error) throw error;

        // Replace temp with real data
        setBoardingPrices((prev) =>
          prev.map((p) => (p.dog_size === size ? data : p))
        );
      }

      setSuccess(`✅ ${field === "base_price" ? "Grundpris" : "Helgtillägg"} uppdaterat!`);
      setTimeout(() => setSuccess(null), 2000);
    } catch (err: any) {
      console.error("Error updating price:", err);
      setError("Kunde inte uppdatera pris");
    }
  };

  // ===========================
  // SPECIALDATUM - ADD/DELETE
  // ===========================

  const handleAddSpecialDate = async () => {
    if (!currentOrgId || !newSpecialDate.date || !newSpecialDate.name) {
      setError("Fyll i datum och namn");
      return;
    }

    try {
      const { data, error } = await supabase
        .from("special_dates")
        .insert([
          {
            org_id: currentOrgId,
            ...newSpecialDate,
          },
        ])
        .select()
        .single();

      if (error) throw error;

      setSpecialDates([...specialDates, data]);
      setNewSpecialDate({ date: "", name: "", category: "custom", price_surcharge: 0 });
      setSuccess("✅ Specialdatum tillagt!");
      setTimeout(() => setSuccess(null), 2000);
    } catch (err: any) {
      console.error("Error adding special date:", err);
      setError("Kunde inte lägga till specialdatum");
    }
  };

  const handleDeleteSpecialDate = async (id: string) => {
    try {
      const { error } = await supabase
        .from("special_dates")
        .update({ is_active: false })
        .eq("id", id);

      if (error) throw error;

      setSpecialDates(specialDates.filter((sd) => sd.id !== id));
      setSuccess("✅ Specialdatum borttaget!");
      setTimeout(() => setSuccess(null), 2000);
    } catch (err: any) {
      console.error("Error deleting special date:", err);
      setError("Kunde inte ta bort specialdatum");
    }
  };

  // ===========================
  // SÄSONGER - ADD/DELETE
  // ===========================

  const handleAddSeason = async () => {
    if (!currentOrgId || !newSeason.name || !newSeason.start_date || !newSeason.end_date) {
      setError("Fyll i namn, start- och slutdatum");
      return;
    }

    try {
      const { data, error } = await supabase
        .from("boarding_seasons")
        .insert([
          {
            org_id: currentOrgId,
            ...newSeason,
          },
        ])
        .select()
        .single();

      if (error) throw error;

      setSeasons([...seasons, data]);
      setNewSeason({ name: "", start_date: "", end_date: "", price_multiplier: 1.0, priority: 50 });
      setSuccess("✅ Säsong tillagd!");
      setTimeout(() => setSuccess(null), 2000);
    } catch (err: any) {
      console.error("Error adding season:", err);
      setError("Kunde inte lägga till säsong");
    }
  };

  const handleDeleteSeason = async (id: string) => {
    try {
      const { error } = await supabase
        .from("boarding_seasons")
        .update({ is_active: false })
        .eq("id", id);

      if (error) throw error;

      setSeasons(seasons.filter((s) => s.id !== id));
      setSuccess("✅ Säsong borttagen!");
      setTimeout(() => setSuccess(null), 2000);
    } catch (err: any) {
      console.error("Error deleting season:", err);
      setError("Kunde inte ta bort säsong");
    }
  };

  // ===========================
  // TILLVAL - ADD/DELETE
  // ===========================

  const handleAddService = async () => {
    if (!currentOrgId || !newService.label || newService.price <= 0) {
      setError("Fyll i tjänstens namn och pris");
      return;
    }

    try {
      const { data, error } = await supabase
        .from("extra_services")
        .insert([
          {
            org_id: currentOrgId,
            ...newService,
            service_type: "boarding",
          },
        ])
        .select()
        .single();

      if (error) throw error;

      setExtraServices([...extraServices, data]);
      setNewService({ label: "", price: 0, unit: "per gång" });
      setSuccess("✅ Tillvalstjänst tillagd!");
      setTimeout(() => setSuccess(null), 2000);
    } catch (err: any) {
      console.error("Error adding service:", err);
      setError("Kunde inte lägga till tjänst");
    }
  };

  const handleDeleteService = async (id: string) => {
    try {
      const { error } = await supabase
        .from("extra_services")
        .update({ is_active: false })
        .eq("id", id);

      if (error) throw error;

      setExtraServices(extraServices.filter((s) => s.id !== id));
      setSuccess("✅ Tjänst borttagen!");
      setTimeout(() => setSuccess(null), 2000);
    } catch (err: any) {
      console.error("Error deleting service:", err);
      setError("Kunde inte ta bort tjänst");
    }
  };

  // ===========================
  // RENDER HELPERS
  // ===========================

  const getCategoryBadge = (category: string) => {
    const styles = {
      red_day: "bg-red-100 text-red-700",
      holiday: "bg-purple-100 text-purple-700",
      event: "bg-blue-100 text-blue-700",
      custom: "bg-gray-100 text-gray-700",
    };
    return styles[category as keyof typeof styles] || styles.custom;
  };

  const getCategoryLabel = (category: string) => {
    const labels = {
      red_day: "Röd dag",
      holiday: "Högtid",
      event: "Event",
      custom: "Anpassat",
    };
    return labels[category as keyof typeof labels] || "Anpassat";
  };

  // ===========================
  // RENDER
  // ===========================

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#2c7a4c] mx-auto mb-4"></div>
          <p className="text-gray-600">Laddar priser...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-[1600px] mx-auto px-6 py-6">
          <Link
            href="/admin"
            className="inline-flex items-center text-[#2c7a4c] hover:underline mb-3"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Tillbaka till Admin
          </Link>
          <div className="flex items-center gap-3">
            <div className="text-4xl">🏨</div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                Priser - Hundpensionat
              </h1>
              <p className="text-gray-600 mt-1">
                3-lagers prissystem: Grundpriser → Specialdatum → Säsonger
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-[1600px] mx-auto px-6">
          <div className="flex gap-6">
            <button
              onClick={() => setActiveTab("grundpriser")}
              className={`pb-4 pt-2 border-b-2 font-medium transition-colors ${
                activeTab === "grundpriser"
                  ? "border-[#2c7a4c] text-[#2c7a4c]"
                  : "border-transparent text-gray-600 hover:text-gray-900"
              }`}
            >
              <Dog className="w-4 h-4 inline mr-2" />
              Grundpriser
            </button>
            <button
              onClick={() => setActiveTab("specialdatum")}
              className={`pb-4 pt-2 border-b-2 font-medium transition-colors ${
                activeTab === "specialdatum"
                  ? "border-[#2c7a4c] text-[#2c7a4c]"
                  : "border-transparent text-gray-600 hover:text-gray-900"
              }`}
            >
              <Calendar className="w-4 h-4 inline mr-2" />
              Specialdatum ({specialDates.length})
            </button>
            <button
              onClick={() => setActiveTab("säsonger")}
              className={`pb-4 pt-2 border-b-2 font-medium transition-colors ${
                activeTab === "säsonger"
                  ? "border-[#2c7a4c] text-[#2c7a4c]"
                  : "border-transparent text-gray-600 hover:text-gray-900"
              }`}
            >
              <TrendingUp className="w-4 h-4 inline mr-2" />
              Säsonger ({seasons.length})
            </button>
            <button
              onClick={() => setActiveTab("tillval")}
              className={`pb-4 pt-2 border-b-2 font-medium transition-colors ${
                activeTab === "tillval"
                  ? "border-[#2c7a4c] text-[#2c7a4c]"
                  : "border-transparent text-gray-600 hover:text-gray-900"
              }`}
            >
              <Sparkles className="w-4 h-4 inline mr-2" />
              Tillval ({extraServices.length})
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <main className="max-w-[1600px] mx-auto px-6 py-8">
        {/* Messages */}
        {success && (
          <div className="mb-6 rounded-lg border border-green-300 bg-green-50 px-4 py-3 flex items-center gap-3">
            <CheckCircle className="w-5 h-5 text-green-600" />
            <span className="text-green-800">{success}</span>
          </div>
        )}
        {error && (
          <div className="mb-6 rounded-lg border border-red-300 bg-red-50 px-4 py-3 flex items-center gap-3">
            <AlertCircle className="w-5 h-5 text-red-600" />
            <span className="text-red-700">{error}</span>
          </div>
        )}

        {/* TAB 1: GRUNDPRISER */}
        {activeTab === "grundpriser" && (
          <Card>
            <CardHeader>
              <CardTitle>Grundpriser per hundstorlek</CardTitle>
              <p className="text-sm text-gray-600 mt-2">
                Pris per natt baserat på hundens mankhöjd. Helgtillägg gäller fredag, lördag, söndag.
              </p>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-3 px-4 font-semibold">Hundstorlek</th>
                      <th className="text-left py-3 px-4 font-semibold">Höjd (mankhöjd)</th>
                      <th className="text-left py-3 px-4 font-semibold">Grundpris/natt</th>
                      <th className="text-left py-3 px-4 font-semibold">Helgtillägg</th>
                    </tr>
                  </thead>
                  <tbody>
                    {boardingPrices.map((price) => (
                      <tr key={price.dog_size} className="border-b hover:bg-gray-50">
                        <td className="py-4 px-4 font-medium">
                          {price.dog_size === "small" && "🐕 Liten"}
                          {price.dog_size === "medium" && "🐕 Mellan"}
                          {price.dog_size === "large" && "🐕 Stor"}
                        </td>
                        <td className="py-4 px-4 text-gray-600">
                          {price.dog_size === "small" && "< 35 cm"}
                          {price.dog_size === "medium" && "35-54 cm"}
                          {price.dog_size === "large" && "> 54 cm"}
                        </td>
                        <td className="py-4 px-4">
                          <div className="flex items-center gap-2">
                            <Input
                              type="number"
                              value={price.base_price}
                              onChange={(e) => {
                                const val = parseFloat(e.target.value) || 0;
                                setBoardingPrices((prev) =>
                                  prev.map((p) =>
                                    p.dog_size === price.dog_size
                                      ? { ...p, base_price: val }
                                      : p
                                  )
                                );
                              }}
                              onBlur={(e) => {
                                const val = parseFloat(e.target.value) || 0;
                                handleUpdateBasePrice(price.dog_size, "base_price", val);
                              }}
                              className="w-32"
                            />
                            <span className="text-gray-600">kr</span>
                          </div>
                        </td>
                        <td className="py-4 px-4">
                          <div className="flex items-center gap-2">
                            <Input
                              type="number"
                              value={price.weekend_surcharge}
                              onChange={(e) => {
                                const val = parseFloat(e.target.value) || 0;
                                setBoardingPrices((prev) =>
                                  prev.map((p) =>
                                    p.dog_size === price.dog_size
                                      ? { ...p, weekend_surcharge: val }
                                      : p
                                  )
                                );
                              }}
                              onBlur={(e) => {
                                const val = parseFloat(e.target.value) || 0;
                                handleUpdateBasePrice(price.dog_size, "weekend_surcharge", val);
                              }}
                              className="w-32"
                            />
                            <span className="text-gray-600">kr</span>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
                <h4 className="font-semibold text-blue-900 mb-2">💡 Så fungerar prisberäkningen</h4>
                <ul className="text-sm text-blue-800 space-y-1">
                  <li>• Grundpris appliceras per påbörjad kalenderdag (incheckning tors → utcheckning fre = 2 dagar)</li>
                  <li>• Specialdatum (se flik 2) har högsta prioritet och ersätter helgtillägg</li>
                  <li>• Säsonger (se flik 3) multiplicerar slutpriset (t.ex. ×1.3 för sommar)</li>
                  <li>• Exempel: 450 kr + 100 kr (helg) = 550 kr × 1.3 (sommar) = 715 kr/natt</li>
                </ul>
              </div>
            </CardContent>
          </Card>
        )}

        {/* TAB 2: SPECIALDATUM */}
        {activeTab === "specialdatum" && (
          <div className="space-y-6">
            {/* Existing special dates */}
            <Card>
              <CardHeader>
                <CardTitle>Specialdatum & Röda dagar</CardTitle>
                <p className="text-sm text-gray-600 mt-2">
                  Enskilda datum med eget pristillägg. Ersätter helgtillägg om datum matchar.
                </p>
              </CardHeader>
              <CardContent>
                {specialDates.length === 0 ? (
                  <p className="text-gray-500 text-center py-8">Inga specialdatum ännu. Lägg till nedan!</p>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b">
                          <th className="text-left py-3 px-4 font-semibold">Datum</th>
                          <th className="text-left py-3 px-4 font-semibold">Namn</th>
                          <th className="text-left py-3 px-4 font-semibold">Kategori</th>
                          <th className="text-left py-3 px-4 font-semibold">Pristillägg</th>
                          <th className="text-right py-3 px-4 font-semibold">Åtgärd</th>
                        </tr>
                      </thead>
                      <tbody>
                        {specialDates.map((sd) => (
                          <tr key={sd.id} className="border-b hover:bg-gray-50">
                            <td className="py-3 px-4 font-medium">{sd.date}</td>
                            <td className="py-3 px-4">{sd.name}</td>
                            <td className="py-3 px-4">
                              <span
                                className={`px-2 py-1 rounded-full text-xs font-medium ${getCategoryBadge(
                                  sd.category
                                )}`}
                              >
                                {getCategoryLabel(sd.category)}
                              </span>
                            </td>
                            <td className="py-3 px-4 font-semibold text-green-700">
                              +{sd.price_surcharge} kr
                            </td>
                            <td className="py-3 px-4 text-right">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleDeleteSpecialDate(sd.id)}
                                className="text-red-600 hover:text-red-700 hover:bg-red-50"
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Add new special date */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Plus className="w-5 h-5 text-[#2c7a4c]" />
                  Lägg till nytt specialdatum
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                  <div>
                    <Label htmlFor="sd-date">Datum</Label>
                    <Input
                      id="sd-date"
                      type="date"
                      value={newSpecialDate.date}
                      onChange={(e) =>
                        setNewSpecialDate({ ...newSpecialDate, date: e.target.value })
                      }
                    />
                  </div>
                  <div>
                    <Label htmlFor="sd-name">Namn</Label>
                    <Input
                      id="sd-name"
                      placeholder="t.ex. Midsommarafton"
                      value={newSpecialDate.name}
                      onChange={(e) =>
                        setNewSpecialDate({ ...newSpecialDate, name: e.target.value })
                      }
                    />
                  </div>
                  <div>
                    <Label htmlFor="sd-category">Kategori</Label>
                    <select
                      id="sd-category"
                      className="w-full border border-gray-300 rounded-md px-3 py-2"
                      value={newSpecialDate.category}
                      onChange={(e) =>
                        setNewSpecialDate({
                          ...newSpecialDate,
                          category: e.target.value as "red_day" | "holiday" | "event" | "custom",
                        })
                      }
                    >
                      <option value="red_day">Röd dag</option>
                      <option value="holiday">Högtid</option>
                      <option value="event">Event</option>
                      <option value="custom">Anpassat</option>
                    </select>
                  </div>
                  <div>
                    <Label htmlFor="sd-surcharge">Pristillägg (kr)</Label>
                    <Input
                      id="sd-surcharge"
                      type="number"
                      placeholder="0"
                      value={newSpecialDate.price_surcharge || ""}
                      onChange={(e) =>
                        setNewSpecialDate({
                          ...newSpecialDate,
                          price_surcharge: parseFloat(e.target.value) || 0,
                        })
                      }
                    />
                  </div>
                  <div className="flex items-end">
                    <Button
                      onClick={handleAddSpecialDate}
                      className="w-full bg-[#2c7a4c] hover:bg-[#236139]"
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      Lägg till
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* TAB 3: SÄSONGER */}
        {activeTab === "säsonger" && (
          <div className="space-y-6">
            {/* Existing seasons */}
            <Card>
              <CardHeader>
                <CardTitle>Säsonger & Prisperioder</CardTitle>
                <p className="text-sm text-gray-600 mt-2">
                  Säsonger multiplicerar slutpriset. Vid överlapp används säsongen med högst prioritet.
                </p>
              </CardHeader>
              <CardContent>
                {seasons.length === 0 ? (
                  <p className="text-gray-500 text-center py-8">Inga säsonger ännu. Lägg till nedan!</p>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b">
                          <th className="text-left py-3 px-4 font-semibold">Namn</th>
                          <th className="text-left py-3 px-4 font-semibold">Startdatum</th>
                          <th className="text-left py-3 px-4 font-semibold">Slutdatum</th>
                          <th className="text-left py-3 px-4 font-semibold">Multiplikator</th>
                          <th className="text-left py-3 px-4 font-semibold">Prioritet</th>
                          <th className="text-right py-3 px-4 font-semibold">Åtgärd</th>
                        </tr>
                      </thead>
                      <tbody>
                        {seasons.map((season) => (
                          <tr key={season.id} className="border-b hover:bg-gray-50">
                            <td className="py-3 px-4 font-medium">{season.name}</td>
                            <td className="py-3 px-4">{season.start_date}</td>
                            <td className="py-3 px-4">{season.end_date}</td>
                            <td className="py-3 px-4 font-semibold text-orange-700">
                              ×{season.price_multiplier}
                            </td>
                            <td className="py-3 px-4">{season.priority}</td>
                            <td className="py-3 px-4 text-right">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleDeleteSeason(season.id)}
                                className="text-red-600 hover:text-red-700 hover:bg-red-50"
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Add new season */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Plus className="w-5 h-5 text-[#2c7a4c]" />
                  Lägg till ny säsong
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4">
                  <div>
                    <Label htmlFor="season-name">Namn</Label>
                    <Input
                      id="season-name"
                      placeholder="t.ex. Sommar"
                      value={newSeason.name}
                      onChange={(e) =>
                        setNewSeason({ ...newSeason, name: e.target.value })
                      }
                    />
                  </div>
                  <div>
                    <Label htmlFor="season-start">Startdatum</Label>
                    <Input
                      id="season-start"
                      type="date"
                      value={newSeason.start_date}
                      onChange={(e) =>
                        setNewSeason({ ...newSeason, start_date: e.target.value })
                      }
                    />
                  </div>
                  <div>
                    <Label htmlFor="season-end">Slutdatum</Label>
                    <Input
                      id="season-end"
                      type="date"
                      value={newSeason.end_date}
                      onChange={(e) =>
                        setNewSeason({ ...newSeason, end_date: e.target.value })
                      }
                    />
                  </div>
                  <div>
                    <Label htmlFor="season-mult">Multiplikator</Label>
                    <Input
                      id="season-mult"
                      type="number"
                      step="0.1"
                      placeholder="1.0"
                      value={newSeason.price_multiplier || ""}
                      onChange={(e) =>
                        setNewSeason({
                          ...newSeason,
                          price_multiplier: parseFloat(e.target.value) || 1.0,
                        })
                      }
                    />
                  </div>
                  <div>
                    <Label htmlFor="season-priority">Prioritet</Label>
                    <Input
                      id="season-priority"
                      type="number"
                      placeholder="50"
                      value={newSeason.priority || ""}
                      onChange={(e) =>
                        setNewSeason({
                          ...newSeason,
                          priority: parseInt(e.target.value) || 50,
                        })
                      }
                    />
                  </div>
                  <div className="flex items-end">
                    <Button
                      onClick={handleAddSeason}
                      className="w-full bg-[#2c7a4c] hover:bg-[#236139]"
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      Lägg till
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* TAB 4: TILLVAL */}
        {activeTab === "tillval" && (
          <div className="space-y-6">
            {/* Existing services */}
            <Card>
              <CardHeader>
                <CardTitle>Tillvalstjänster</CardTitle>
                <p className="text-sm text-gray-600 mt-2">
                  Extra tjänster som kan köpas till pensionatsvistelsen.
                </p>
              </CardHeader>
              <CardContent>
                {extraServices.length === 0 ? (
                  <p className="text-gray-500 text-center py-8">Inga tillvalstjänster ännu. Lägg till nedan!</p>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {extraServices.map((service) => (
                      <div
                        key={service.id}
                        className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
                      >
                        <div className="flex items-start justify-between mb-2">
                          <h4 className="font-semibold text-gray-900">{service.label}</h4>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeleteService(service.id)}
                            className="text-red-600 hover:text-red-700 hover:bg-red-50 -mt-2 -mr-2"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                        <div className="text-lg font-bold text-green-700">
                          {service.price} kr
                        </div>
                        <div className="text-sm text-gray-600">{service.unit}</div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Add new service */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Plus className="w-5 h-5 text-[#2c7a4c]" />
                  Lägg till ny tillvalstjänst
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div className="md:col-span-2">
                    <Label htmlFor="service-label">Tjänst</Label>
                    <Input
                      id="service-label"
                      placeholder="t.ex. Matning av egen mat"
                      value={newService.label}
                      onChange={(e) =>
                        setNewService({ ...newService, label: e.target.value })
                      }
                    />
                  </div>
                  <div>
                    <Label htmlFor="service-price">Pris (kr)</Label>
                    <Input
                      id="service-price"
                      type="number"
                      placeholder="0"
                      value={newService.price || ""}
                      onChange={(e) =>
                        setNewService({
                          ...newService,
                          price: parseFloat(e.target.value) || 0,
                        })
                      }
                    />
                  </div>
                  <div>
                    <Label htmlFor="service-unit">Enhet</Label>
                    <select
                      id="service-unit"
                      className="w-full border border-gray-300 rounded-md px-3 py-2"
                      value={newService.unit}
                      onChange={(e) =>
                        setNewService({
                          ...newService,
                          unit: e.target.value as "per dag" | "per gång" | "fast pris",
                        })
                      }
                    >
                      <option value="per dag">per dag</option>
                      <option value="per gång">per gång</option>
                      <option value="fast pris">fast pris</option>
                    </select>
                  </div>
                </div>
                <Button
                  onClick={handleAddService}
                  className="mt-4 bg-[#2c7a4c] hover:bg-[#236139]"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Lägg till tjänst
                </Button>
              </CardContent>
            </Card>
          </div>
        )}
      </main>
    </div>
  );
}
