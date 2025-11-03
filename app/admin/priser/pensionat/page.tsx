"use client";

// Förhindra prerendering för att undvika build-fel
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
  DollarSign,
  Plus,
  Trash2,
  TrendingUp,
} from "lucide-react";
import Link from "next/link";

interface BoardingPricing {
  id?: string;
  org_id: string;
  size_category: string | null;
  base_price: number; // Grundpris per natt
  weekend_multiplier: number; // 1.2 = +20%
  holiday_multiplier: number; // 1.5 = +50%
  high_season_multiplier: number; // 1.3 = +30%
}

interface ExtraService {
  id?: string;
  org_id: string;
  label: string;
  price: number;
  unit: "per dag" | "per gång" | "fast pris";
  service_type: "boarding" | "daycare" | "both";
}

export default function PensionatPriserPage() {
  const supabase = createClientComponentClient();
  const { currentOrgId } = useAuth();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const [pricing, setPricing] = useState<BoardingPricing>({
    org_id: currentOrgId || "",
    size_category: "standard",
    base_price: 350,
    weekend_multiplier: 1.2,
    holiday_multiplier: 1.5,
    high_season_multiplier: 1.3,
  });

  const [extraServices, setExtraServices] = useState<ExtraService[]>([]);
  const [newService, setNewService] = useState<ExtraService>({
    org_id: currentOrgId || "",
    label: "",
    price: 0,
    unit: "per gång",
    service_type: "boarding",
  });

  useEffect(() => {
    if (currentOrgId) {
      loadPricing();
      loadExtraServices();
    }
  }, [currentOrgId]);

  const loadPricing = async () => {
    if (!currentOrgId) return;

    try {
      setLoading(true);
      setError(null);

      const { data, error } = await supabase
        .from("boarding_prices")
        .select("*")
        .eq("org_id", currentOrgId)
        .maybeSingle();

      if (error && error.code !== "PGRST116") {
        throw error;
      }

      if (data) {
        setPricing(data);
      }
    } catch (err: any) {
      console.error("Error loading pricing:", err);
      setError(err.message || "Kunde inte ladda priser");
    } finally {
      setLoading(false);
    }
  };

  const loadExtraServices = async () => {
    if (!currentOrgId) return;

    try {
      const { data, error } = await supabase
        .from("extra_services")
        .select("*")
        .eq("org_id", currentOrgId)
        .eq("service_type", "boarding");

      if (error) throw error;
      if (data) setExtraServices(data);
    } catch (err: any) {
      console.error("Error loading extra services:", err);
    }
  };

  const handleSave = async () => {
    if (!currentOrgId) return;

    try {
      setSaving(true);
      setError(null);
      setSuccess(null);

      const dataToSave = {
        org_id: currentOrgId,
        size_category: pricing.size_category,
        base_price: pricing.base_price,
        weekend_multiplier: pricing.weekend_multiplier,
        holiday_multiplier: pricing.holiday_multiplier,
        high_season_multiplier: pricing.high_season_multiplier,
      };

      const { error: upsertError } = await supabase
        .from("boarding_prices")
        .upsert(dataToSave, {
          onConflict: "org_id",
        });

      if (upsertError) throw upsertError;

      setSuccess("✅ Priser har sparats!");
      setTimeout(() => setSuccess(null), 3000);
    } catch (err: any) {
      console.error("Error saving pricing:", err);
      setError(err.message || "Kunde inte spara priser");
    } finally {
      setSaving(false);
    }
  };

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
            label: newService.label,
            price: newService.price,
            unit: newService.unit,
            service_type: "boarding",
          },
        ])
        .select()
        .single();

      if (error) throw error;

      setExtraServices([...extraServices, data]);
      setNewService({
        org_id: currentOrgId,
        label: "",
        price: 0,
        unit: "per gång",
        service_type: "boarding",
      });
      setSuccess("✅ Tillvalstjänst tillagd!");
      setTimeout(() => setSuccess(null), 3000);
    } catch (err: any) {
      console.error("Error adding service:", err);
      setError(err.message || "Kunde inte lägga till tjänst");
    }
  };

  const handleDeleteService = async (serviceId: string) => {
    try {
      const { error } = await supabase
        .from("extra_services")
        .delete()
        .eq("id", serviceId);

      if (error) throw error;

      setExtraServices(extraServices.filter((s) => s.id !== serviceId));
      setSuccess("✅ Tjänst borttagen!");
      setTimeout(() => setSuccess(null), 3000);
    } catch (err: any) {
      console.error("Error deleting service:", err);
      setError(err.message || "Kunde inte ta bort tjänst");
    }
  };

  const handleChange = (
    field: keyof BoardingPricing,
    value: number | string
  ) => {
    setPricing((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

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
                Hantera grundpriser, tillägg och tillvalstjänster
              </p>
            </div>
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

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Grundpriser */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <DollarSign className="w-5 h-5 text-[#2c7a4c]" />
                Grundpriser
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="base">Grundpris per natt</Label>
                <div className="flex items-center gap-2">
                  <Input
                    id="base"
                    type="number"
                    value={pricing.base_price}
                    onChange={(e) =>
                      handleChange("base_price", parseFloat(e.target.value))
                    }
                    className="flex-1"
                  />
                  <span className="text-gray-600">kr/natt</span>
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  Justeras automatiskt efter hundens storlek (mankhöjd)
                </p>
              </div>

              <div className="bg-gray-50 p-3 rounded-md">
                <h4 className="font-semibold text-sm text-gray-900 mb-2">
                  Storleksmultiplikatorer:
                </h4>
                <ul className="text-xs text-gray-700 space-y-1">
                  <li>• ≤34 cm (mini): 1.0x = {pricing.base_price} kr</li>
                  <li>
                    • 35-49 cm (liten): 1.2x ={" "}
                    {Math.round(pricing.base_price * 1.2)} kr
                  </li>
                  <li>
                    • 50-65 cm (medel): 1.4x ={" "}
                    {Math.round(pricing.base_price * 1.4)} kr
                  </li>
                  <li>
                    • &gt;65 cm (stor): 1.6x ={" "}
                    {Math.round(pricing.base_price * 1.6)} kr
                  </li>
                </ul>
              </div>
            </CardContent>
          </Card>

          {/* Tillägg */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-[#2c7a4c]" />
                Tillägg
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="weekend">Helgtillägg</Label>
                <div className="flex items-center gap-2">
                  <Input
                    id="weekend"
                    type="number"
                    step="0.1"
                    value={pricing.weekend_multiplier}
                    onChange={(e) =>
                      handleChange(
                        "weekend_multiplier",
                        parseFloat(e.target.value)
                      )
                    }
                    className="flex-1"
                  />
                  <span className="text-gray-600">x</span>
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  {pricing.weekend_multiplier === 1
                    ? "Ingen helgpåslag"
                    : `+${Math.round(
                        (pricing.weekend_multiplier - 1) * 100
                      )}% lördag & söndag`}
                </p>
              </div>

              <div>
                <Label htmlFor="holiday">Högtidstillägg</Label>
                <div className="flex items-center gap-2">
                  <Input
                    id="holiday"
                    type="number"
                    step="0.1"
                    value={pricing.holiday_multiplier}
                    onChange={(e) =>
                      handleChange(
                        "holiday_multiplier",
                        parseFloat(e.target.value)
                      )
                    }
                    className="flex-1"
                  />
                  <span className="text-gray-600">x</span>
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  {pricing.holiday_multiplier === 1
                    ? "Ingen högtidspåslag"
                    : `+${Math.round(
                        (pricing.holiday_multiplier - 1) * 100
                      )}% jul, påsk, midsommar osv`}
                </p>
              </div>

              <div>
                <Label htmlFor="season">Högsäsongstillägg</Label>
                <div className="flex items-center gap-2">
                  <Input
                    id="season"
                    type="number"
                    step="0.1"
                    value={pricing.high_season_multiplier}
                    onChange={(e) =>
                      handleChange(
                        "high_season_multiplier",
                        parseFloat(e.target.value)
                      )
                    }
                    className="flex-1"
                  />
                  <span className="text-gray-600">x</span>
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  {pricing.high_season_multiplier === 1
                    ? "Ingen säsongspåslag"
                    : `+${Math.round(
                        (pricing.high_season_multiplier - 1) * 100
                      )}% sommarsäsong`}
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Tillvalstjänster */}
        <Card className="mt-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Plus className="w-5 h-5 text-[#2c7a4c]" />
              Tillvalstjänster
            </CardTitle>
          </CardHeader>
          <CardContent>
            {/* Befintliga tjänster */}
            {extraServices.length > 0 && (
              <div className="mb-6 space-y-2">
                {extraServices.map((service) => (
                  <div
                    key={service.id}
                    className="flex items-center justify-between border border-gray-200 rounded-lg p-3"
                  >
                    <div>
                      <div className="font-medium text-gray-900">
                        {service.label}
                      </div>
                      <div className="text-sm text-gray-600">
                        {service.price} kr / {service.unit}
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() =>
                        service.id && handleDeleteService(service.id)
                      }
                      className="text-red-600 hover:text-red-700 hover:bg-red-50"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                ))}
              </div>
            )}

            {/* Lägg till ny tjänst */}
            <div className="border-t pt-4">
              <h4 className="font-semibold text-gray-900 mb-3">
                Lägg till ny tjänst
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div>
                  <Label htmlFor="serviceName">Tjänst</Label>
                  <Input
                    id="serviceName"
                    placeholder="t.ex. Matning av egen mat"
                    value={newService.label}
                    onChange={(e) =>
                      setNewService({ ...newService, label: e.target.value })
                    }
                  />
                </div>
                <div>
                  <Label htmlFor="servicePrice">Pris</Label>
                  <Input
                    id="servicePrice"
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
                  <Label htmlFor="serviceUnit">Enhet</Label>
                  <select
                    id="serviceUnit"
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
                className="mt-3 bg-[#2c7a4c] hover:bg-[#236139]"
              >
                <Plus className="w-4 h-4 mr-2" />
                Lägg till tjänst
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Info Box */}
        <Card className="mt-6 bg-blue-50 border-blue-200">
          <CardContent className="pt-6">
            <div className="flex items-start gap-3">
              <TrendingUp className="w-5 h-5 text-blue-600 mt-0.5" />
              <div>
                <h3 className="font-semibold text-blue-900 mb-2">
                  💡 Så fungerar prisberäkningen
                </h3>
                <ul className="text-sm text-blue-800 space-y-1.5">
                  <li>
                    • Grundpris justeras automatiskt baserat på hundens mankhöjd
                  </li>
                  <li>
                    • Helg-, högtids- och säsongstillägg läggs på per natt
                  </li>
                  <li>• Tillvalstjänster kan väljas vid bokning</li>
                  <li>• Rabatter kan läggas till per hundägare</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Save Button */}
        <div className="mt-8 flex justify-end">
          <Button
            onClick={handleSave}
            disabled={saving}
            className="bg-[#2c7a4c] hover:bg-[#236139] text-white px-8 py-3"
          >
            <Save className="w-4 h-4 mr-2" />
            {saving ? "Sparar..." : "Spara grundpriser"}
          </Button>
        </div>
      </main>
    </div>
  );
}
