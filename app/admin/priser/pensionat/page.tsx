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
  HelpCircle,
  Info,
  X,
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
  const [showHelpModal, setShowHelpModal] = useState(false);

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
    } else {
      // If no org ID, stop loading to prevent infinite spinner
      setLoading(false);
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
      const sizes: ("small" | "medium" | "large")[] = [
        "small",
        "medium",
        "large",
      ];
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
              base_price:
                field === "base_price"
                  ? value
                  : existingPrice?.base_price || 400,
              weekend_surcharge:
                field === "weekend_surcharge"
                  ? value
                  : existingPrice?.weekend_surcharge || 100,
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

      setSuccess(
        `✅ ${field === "base_price" ? "Grundpris" : "Helgtillägg"} uppdaterat!`
      );
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
      setNewSpecialDate({
        date: "",
        name: "",
        category: "custom",
        price_surcharge: 0,
      });
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
    if (
      !currentOrgId ||
      !newSeason.name ||
      !newSeason.start_date ||
      !newSeason.end_date
    ) {
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
      setNewSeason({
        name: "",
        start_date: "",
        end_date: "",
        price_multiplier: 1.0,
        priority: 50,
      });
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

  if (!currentOrgId) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-500 text-4xl mb-4">⚠️</div>
          <p className="text-gray-900 font-semibold mb-2">
            Ingen organisation hittades
          </p>
          <p className="text-gray-600">
            Du måste vara inloggad och tillhöra en organisation.
          </p>
          <Link
            href="/login"
            className="mt-4 inline-block text-[#2c7a4c] hover:underline"
          >
            Gå till inloggning →
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header - Kompakt och luftig */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-5xl mx-auto px-8 py-5">
          <Link
            href="/admin"
            className="inline-flex items-center text-sm text-gray-600 hover:text-[#2c7a4c] mb-4 transition-colors"
          >
            <ArrowLeft className="w-4 h-4 mr-1.5" />
            Tillbaka till Admin
          </Link>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="text-2xl">🏨</div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">
                  Priser - Hundpensionat
                </h1>
                <p className="text-sm text-gray-600 mt-0.5">
                  3-lagers prissystem: Grundpriser → Specialdatum → Säsonger
                </p>
              </div>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowHelpModal(true)}
              className="text-sm text-[#2c7a4c] border-[#2c7a4c] hover:bg-[#2c7a4c]/5 transition-colors"
            >
              <HelpCircle className="w-4 h-4 mr-1.5" />
              Hur fungerar prissystemet?
            </Button>
          </div>
        </div>
      </div>

      {/* Tabs - Clean och tydlig */}
      <div className="bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-5xl mx-auto px-8">
          <div className="flex gap-1">
            <button
              onClick={() => setActiveTab("grundpriser")}
              className={`px-4 py-3 text-sm font-medium transition-all ${
                activeTab === "grundpriser"
                  ? "text-[#2c7a4c] border-b-2 border-[#2c7a4c]"
                  : "text-gray-600 hover:text-gray-900 border-b-2 border-transparent"
              }`}
            >
              <Dog className="w-4 h-4 inline mr-1.5" />
              Grundpriser
            </button>
            <button
              onClick={() => setActiveTab("specialdatum")}
              className={`px-4 py-3 text-sm font-medium transition-all ${
                activeTab === "specialdatum"
                  ? "text-[#2c7a4c] border-b-2 border-[#2c7a4c]"
                  : "text-gray-600 hover:text-gray-900 border-b-2 border-transparent"
              }`}
            >
              <Calendar className="w-4 h-4 inline mr-1.5" />
              Specialdatum
              <span className="ml-1.5 px-1.5 py-0.5 bg-gray-100 text-gray-700 text-xs rounded">
                {specialDates.length}
              </span>
            </button>
            <button
              onClick={() => setActiveTab("säsonger")}
              className={`px-4 py-3 text-sm font-medium transition-all ${
                activeTab === "säsonger"
                  ? "text-[#2c7a4c] border-b-2 border-[#2c7a4c]"
                  : "text-gray-600 hover:text-gray-900 border-b-2 border-transparent"
              }`}
            >
              <TrendingUp className="w-4 h-4 inline mr-1.5" />
              Säsonger
              <span className="ml-1.5 px-1.5 py-0.5 bg-gray-100 text-gray-700 text-xs rounded">
                {seasons.length}
              </span>
            </button>
            <button
              onClick={() => setActiveTab("tillval")}
              className={`px-4 py-3 text-sm font-medium transition-all ${
                activeTab === "tillval"
                  ? "text-[#2c7a4c] border-b-2 border-[#2c7a4c]"
                  : "text-gray-600 hover:text-gray-900 border-b-2 border-transparent"
              }`}
            >
              <Sparkles className="w-4 h-4 inline mr-1.5" />
              Tillval
              <span className="ml-1.5 px-1.5 py-0.5 bg-gray-100 text-gray-700 text-xs rounded">
                {extraServices.length}
              </span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Content - Luftig layout med max-w-5xl */}
      <main className="max-w-5xl mx-auto px-8 py-6">
        {/* Messages - Kompakta */}
        {success && (
          <div className="mb-4 rounded-lg border border-green-200 bg-green-50 px-4 py-2.5 flex items-center gap-2">
            <CheckCircle className="w-4 h-4 text-green-700 flex-shrink-0" />
            <span className="text-sm text-green-800">{success}</span>
          </div>
        )}
        {error && (
          <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-2.5 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-red-700 flex-shrink-0" />
            <span className="text-sm text-red-800">{error}</span>
          </div>
        )}

        {/* TAB 1: GRUNDPRISER */}
        {activeTab === "grundpriser" && (
          <Card className="shadow-sm">
            <CardHeader className="pb-4">
              <CardTitle className="text-lg font-semibold text-gray-900">
                Grundpriser per hundstorlek
              </CardTitle>
              <p className="text-sm text-gray-600 mt-1">
                Pris per natt baserat på hundens mankhöjd. Helgtillägg gäller
                fredag, lördag, söndag.
              </p>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50">
                    <tr className="border-b border-gray-200">
                      <th className="text-left py-3 px-4 font-semibold text-gray-700">
                        Hundstorlek
                      </th>
                      <th className="text-left py-3 px-4 font-semibold text-gray-700">
                        Höjd (mankhöjd)
                      </th>
                      <th className="text-left py-3 px-4 font-semibold text-gray-700">
                        Grundpris/natt
                      </th>
                      <th className="text-left py-3 px-4 font-semibold text-gray-700">
                        Helgtillägg
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {boardingPrices.map((price) => (
                      <tr
                        key={price.dog_size}
                        className="hover:bg-gray-50 transition-colors"
                      >
                        <td className="py-3 px-4">
                          <span className="font-medium text-gray-900">
                            {price.dog_size === "small" && "🐕 Liten"}
                            {price.dog_size === "medium" && "🐕 Mellan"}
                            {price.dog_size === "large" && "🐕 Stor"}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-gray-600">
                          {price.dog_size === "small" && "< 35 cm"}
                          {price.dog_size === "medium" && "35-54 cm"}
                          {price.dog_size === "large" && "> 54 cm"}
                        </td>
                        <td className="py-3 px-4">
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
                                handleUpdateBasePrice(
                                  price.dog_size,
                                  "base_price",
                                  val
                                );
                              }}
                              className="w-24 h-9 text-sm"
                            />
                            <span className="text-sm text-gray-600">kr</span>
                          </div>
                        </td>
                        <td className="py-3 px-4">
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
                                handleUpdateBasePrice(
                                  price.dog_size,
                                  "weekend_surcharge",
                                  val
                                );
                              }}
                              className="w-24 h-9 text-sm"
                            />
                            <span className="text-sm text-gray-600">kr</span>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="mt-5 p-3.5 bg-blue-50/50 rounded-lg border border-blue-100">
                <h4 className="text-sm font-semibold text-blue-900 mb-2">
                  💡 Så fungerar prisberäkningen
                </h4>
                <ul className="text-sm text-blue-800 space-y-1 leading-relaxed">
                  <li>
                    • Grundpris appliceras per påbörjad kalenderdag (incheckning
                    tors → utcheckning fre = 2 dagar)
                  </li>
                  <li>
                    • Specialdatum (se flik 2) har högsta prioritet och ersätter
                    helgtillägg
                  </li>
                  <li>
                    • Säsonger (se flik 3) multiplicerar slutpriset (t.ex. ×1.3
                    för sommar)
                  </li>
                  <li>
                    • Exempel: 450 kr + 100 kr (helg) = 550 kr × 1.3 (sommar) =
                    715 kr/natt
                  </li>
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
                  Enskilda datum med eget pristillägg. Ersätter helgtillägg om
                  datum matchar.
                </p>
              </CardHeader>
              <CardContent>
                {specialDates.length === 0 ? (
                  <p className="text-gray-500 text-center py-8">
                    Inga specialdatum ännu. Lägg till nedan!
                  </p>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b">
                          <th className="text-left py-3 px-4 font-semibold">
                            Datum
                          </th>
                          <th className="text-left py-3 px-4 font-semibold">
                            Namn
                          </th>
                          <th className="text-left py-3 px-4 font-semibold">
                            Kategori
                          </th>
                          <th className="text-left py-3 px-4 font-semibold">
                            Pristillägg
                          </th>
                          <th className="text-right py-3 px-4 font-semibold">
                            Åtgärd
                          </th>
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
                        setNewSpecialDate({
                          ...newSpecialDate,
                          date: e.target.value,
                        })
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
                        setNewSpecialDate({
                          ...newSpecialDate,
                          name: e.target.value,
                        })
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
                          category: e.target.value as
                            | "red_day"
                            | "holiday"
                            | "event"
                            | "custom",
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
                  Säsonger multiplicerar slutpriset. Vid överlapp används
                  säsongen med högst prioritet.
                </p>
              </CardHeader>
              <CardContent>
                {seasons.length === 0 ? (
                  <p className="text-gray-500 text-center py-8">
                    Inga säsonger ännu. Lägg till nedan!
                  </p>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b">
                          <th className="text-left py-3 px-4 font-semibold">
                            Namn
                          </th>
                          <th className="text-left py-3 px-4 font-semibold">
                            Startdatum
                          </th>
                          <th className="text-left py-3 px-4 font-semibold">
                            Slutdatum
                          </th>
                          <th className="text-left py-3 px-4 font-semibold">
                            Multiplikator
                          </th>
                          <th className="text-left py-3 px-4 font-semibold">
                            Prioritet
                          </th>
                          <th className="text-right py-3 px-4 font-semibold">
                            Åtgärd
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {seasons.map((season) => (
                          <tr
                            key={season.id}
                            className="border-b hover:bg-gray-50"
                          >
                            <td className="py-3 px-4 font-medium">
                              {season.name}
                            </td>
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
                        setNewSeason({
                          ...newSeason,
                          start_date: e.target.value,
                        })
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
                  <p className="text-gray-500 text-center py-8">
                    Inga tillvalstjänster ännu. Lägg till nedan!
                  </p>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {extraServices.map((service) => (
                      <div
                        key={service.id}
                        className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
                      >
                        <div className="flex items-start justify-between mb-2">
                          <h4 className="font-semibold text-gray-900">
                            {service.label}
                          </h4>
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
                        <div className="text-sm text-gray-600">
                          {service.unit}
                        </div>
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
                          unit: e.target.value as
                            | "per dag"
                            | "per gång"
                            | "fast pris",
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

      {/* Help Modal */}
      {showHelpModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-3xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Info className="w-6 h-6 text-[#2c7a4c]" />
                <h2 className="text-2xl font-bold text-gray-900">
                  Så fungerar prissystemet
                </h2>
              </div>
              <button
                onClick={() => setShowHelpModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="px-6 py-6 space-y-6">
              {/* Overview */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h3 className="font-bold text-blue-900 mb-2 flex items-center gap-2">
                  <span className="text-2xl">🎯</span>
                  Översikt: 3-lagers prissystem
                </h3>
                <p className="text-blue-800 text-sm mb-3">
                  Prissystemet bygger på tre lager som staplas på varandra för
                  att skapa det slutgiltiga priset:
                </p>
                <div className="space-y-2 text-sm">
                  <div className="flex items-start gap-2">
                    <span className="font-bold text-blue-900">1.</span>
                    <div>
                      <span className="font-semibold text-blue-900">
                        Grundpris
                      </span>{" "}
                      - Baserat på hundstorlek (liten, mellan, stor)
                    </div>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="font-bold text-blue-900">2.</span>
                    <div>
                      <span className="font-semibold text-blue-900">
                        Tillägg
                      </span>{" "}
                      - Antingen specialdatum (högsta prio) eller helgtillägg
                    </div>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="font-bold text-blue-900">3.</span>
                    <div>
                      <span className="font-semibold text-blue-900">
                        Säsong
                      </span>{" "}
                      - Multiplicerar slutpriset (t.ex. ×1.3 för sommar)
                    </div>
                  </div>
                </div>
              </div>

              {/* Tab 1: Grundpriser */}
              <div>
                <h3 className="font-bold text-gray-900 mb-2 flex items-center gap-2">
                  <Dog className="w-5 h-5 text-[#2c7a4c]" />
                  Flik 1: Grundpriser
                </h3>
                <div className="bg-gray-50 rounded-lg p-4 space-y-3">
                  <p className="text-sm text-gray-700">
                    <strong>Vad är det?</strong> Grundpriset per natt baserat på
                    hundens storlek (mankhöjd).
                  </p>
                  <div className="space-y-1 text-sm text-gray-700">
                    <p>
                      • <strong>Liten</strong> (&lt; 35 cm): Chihuahua, Tax,
                      Yorkshire Terrier
                    </p>
                    <p>
                      • <strong>Mellan</strong> (35-54 cm): Cocker Spaniel,
                      Beagle, Border Collie
                    </p>
                    <p>
                      • <strong>Stor</strong> (&gt; 54 cm): Golden Retriever,
                      Schäfer, Bernhardiner
                    </p>
                  </div>
                  <p className="text-sm text-gray-700">
                    <strong>Helgtillägg:</strong> Extra belopp som läggs till
                    fredag, lördag, söndag (om inget specialdatum finns).
                  </p>
                  <div className="bg-yellow-50 border border-yellow-200 rounded p-2 text-sm text-yellow-800">
                    💡 <strong>Tips:</strong> Sätt grundpriset till vad du vill
                    ha för en "normal" vardag. Helgtillägg brukar vara 50-150
                    kr.
                  </div>
                </div>
              </div>

              {/* Tab 2: Specialdatum */}
              <div>
                <h3 className="font-bold text-gray-900 mb-2 flex items-center gap-2">
                  <Calendar className="w-5 h-5 text-[#2c7a4c]" />
                  Flik 2: Specialdatum
                </h3>
                <div className="bg-gray-50 rounded-lg p-4 space-y-3">
                  <p className="text-sm text-gray-700">
                    <strong>Vad är det?</strong> Enskilda datum där du vill ha
                    ett specifikt pristillägg (ersätter helgtillägg).
                  </p>
                  <p className="text-sm text-gray-700">
                    <strong>När används det?</strong> Röda dagar, midsommar,
                    jul, påsk, lokala event, eller när du vill ha högre pris.
                  </p>
                  <div className="space-y-1 text-sm text-gray-700">
                    <p>
                      • <strong>Röd dag:</strong> Trettondedag jul, Kristi
                      himmelsfärd (+75-100 kr)
                    </p>
                    <p>
                      • <strong>Högtid:</strong> Påskdagen, Juldagen, Nyårsdagen
                      (+150-200 kr)
                    </p>
                    <p>
                      • <strong>Peak:</strong> Midsommarafton, Julafton,
                      Nyårsafton (+300-400 kr)
                    </p>
                  </div>
                  <div className="bg-yellow-50 border border-yellow-200 rounded p-2 text-sm text-yellow-800">
                    💡 <strong>Tips:</strong> Du har redan 38 svenska helgdagar
                    förifyllda (2025-2026). Redigera priserna efter dina behov!
                  </div>
                </div>
              </div>

              {/* Tab 3: Säsonger */}
              <div>
                <h3 className="font-bold text-gray-900 mb-2 flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-[#2c7a4c]" />
                  Flik 3: Säsonger
                </h3>
                <div className="bg-gray-50 rounded-lg p-4 space-y-3">
                  <p className="text-sm text-gray-700">
                    <strong>Vad är det?</strong> Perioder där du vill
                    multiplicera priset (t.ex. sommar, vinter, sportlov).
                  </p>
                  <p className="text-sm text-gray-700">
                    <strong>Hur fungerar det?</strong> Säsongen multiplicerar
                    (grundpris + tillägg). Exempel: 500 kr × 1.3 = 650 kr.
                  </p>
                  <div className="space-y-1 text-sm text-gray-700">
                    <p>
                      • <strong>Multiplikator 1.0</strong> = Inget påslag
                      (normalpris)
                    </p>
                    <p>
                      • <strong>Multiplikator 1.2</strong> = +20% (t.ex.
                      sportlov)
                    </p>
                    <p>
                      • <strong>Multiplikator 1.3</strong> = +30% (t.ex.
                      sommarsäsong)
                    </p>
                  </div>
                  <p className="text-sm text-gray-700">
                    <strong>Prioritet:</strong> Om två säsonger överlappar,
                    används den med högst prioritet (högre siffra = högre prio).
                  </p>
                  <div className="bg-yellow-50 border border-yellow-200 rounded p-2 text-sm text-yellow-800">
                    💡 <strong>Tips:</strong> Använd säsonger för längre
                    perioder (veckor/månader), inte enskilda dagar.
                  </div>
                </div>
              </div>

              {/* Tab 4: Tillval */}
              <div>
                <h3 className="font-bold text-gray-900 mb-2 flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-[#2c7a4c]" />
                  Flik 4: Tillvalstjänster
                </h3>
                <div className="bg-gray-50 rounded-lg p-4 space-y-3">
                  <p className="text-sm text-gray-700">
                    <strong>Vad är det?</strong> Extra tjänster som kunder kan
                    välja till (påverkar inte grundpriset).
                  </p>
                  <div className="space-y-1 text-sm text-gray-700">
                    <p>
                      • <strong>Per dag:</strong> Matning av egen mat, medicin
                      (t.ex. 50 kr/dag)
                    </p>
                    <p>
                      • <strong>Per gång:</strong> Promenad, dusch, klippning
                      (t.ex. 200 kr/gång)
                    </p>
                    <p>
                      • <strong>Fast pris:</strong> Transportavgift, startpaket
                      (t.ex. 300 kr totalt)
                    </p>
                  </div>
                </div>
              </div>

              {/* Exempel */}
              <div>
                <h3 className="font-bold text-gray-900 mb-2 flex items-center gap-2">
                  <span className="text-2xl">🧮</span>
                  Exempel: Komplett prisberäkning
                </h3>
                <div className="bg-green-50 border border-green-200 rounded-lg p-4 space-y-2">
                  <p className="text-sm text-green-900 font-semibold">
                    Mellan hund, 2 nätter (fredag-lördag), midsommarafton +
                    midsommardagen, sommar:
                  </p>
                  <div className="space-y-1 text-sm text-green-800 ml-4">
                    <p>
                      <strong>Natt 1 (Midsommarafton fredag):</strong>
                    </p>
                    <p className="ml-4">• Grundpris: 450 kr</p>
                    <p className="ml-4">• Specialdatum (midsommar): +400 kr</p>
                    <p className="ml-4">• Summa: 850 kr</p>
                    <p className="ml-4">
                      • Sommar (×1.3): <strong>1105 kr</strong>
                    </p>

                    <p className="mt-2">
                      <strong>Natt 2 (Midsommardagen lördag):</strong>
                    </p>
                    <p className="ml-4">• Grundpris: 450 kr</p>
                    <p className="ml-4">• Specialdatum (midsommar): +300 kr</p>
                    <p className="ml-4">• Summa: 750 kr</p>
                    <p className="ml-4">
                      • Sommar (×1.3): <strong>975 kr</strong>
                    </p>

                    <p className="mt-2 font-bold">
                      = Totalpris: 2080 kr för 2 nätter
                    </p>
                  </div>
                </div>
              </div>

              {/* Viktigt att veta */}
              <div>
                <h3 className="font-bold text-gray-900 mb-2 flex items-center gap-2">
                  <AlertCircle className="w-5 h-5 text-orange-600" />
                  Viktigt att veta
                </h3>
                <div className="bg-orange-50 border border-orange-200 rounded-lg p-4 space-y-2 text-sm text-orange-900">
                  <p>
                    • <strong>Per påbörjad kalenderdag:</strong> Incheckning
                    torsdag + utcheckning fredag = 2 dagar (torsdag + fredag).
                  </p>
                  <p>
                    • <strong>Prioritet för tillägg:</strong> Specialdatum
                    ALLTID före helgtillägg. Om fredag är midsommarafton används
                    specialdatum, inte helgtillägg.
                  </p>
                  <p>
                    • <strong>Säsonger stackar inte:</strong> Endast EN säsong
                    appliceras (den med högst prioritet vid överlapp).
                  </p>
                  <p>
                    • <strong>Alla priser inkl. moms 25%.</strong>
                  </p>
                </div>
              </div>

              {/* Close button */}
              <div className="flex justify-end pt-4 border-t">
                <Button
                  onClick={() => setShowHelpModal(false)}
                  className="bg-[#2c7a4c] hover:bg-[#236139]"
                >
                  Stäng och börja sätt priser
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
