"use client";

import React, { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
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
  Calendar,
  TrendingUp,
} from "lucide-react";
import Link from "next/link";

interface DagisPricing {
  id?: string;
  org_id: string;
  // Abonnemangspriser (per månad)
  subscription_parttime_2days: number; // Deltid 2 (2 dagar/vecka)
  subscription_parttime_3days: number; // Deltid 3 (3 dagar/vecka)
  subscription_fulltime: number; // Heltid (5 dagar/vecka)
  // Enstaka dagar
  single_day_price: number; // Dagshund (drop-in)
  additional_day_price: number; // Tilläggsdagar för dagishund
  // Rabatter och övrigt
  sibling_discount_percent: number;
  trial_day_price: number;
  updated_at?: string;
}

export default function DagisPriserPage() {
  const { currentOrgId } = useAuth();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const [pricing, setPricing] = useState<DagisPricing>({
    org_id: currentOrgId || "",
    subscription_parttime_2days: 2500,
    subscription_parttime_3days: 3300,
    subscription_fulltime: 4500,
    single_day_price: 350,
    additional_day_price: 300,
    sibling_discount_percent: 10,
    trial_day_price: 200,
  });

  useEffect(() => {
    if (currentOrgId) {
      loadPricing();
    } else {
      // If no org ID, stop loading to prevent infinite spinner
      setLoading(false);
    }
  }, [currentOrgId]);

  const loadPricing = async () => {
    if (!currentOrgId) return;

    try {
      setLoading(true);
      setError(null);

      // Försök hämta befintliga priser
      const { data, error } = await supabase
        .from("daycare_pricing")
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

  const handleSave = async () => {
    if (!currentOrgId) return;

    try {
      setSaving(true);
      setError(null);
      setSuccess(null);

      const dataToSave = {
        org_id: currentOrgId,
        subscription_parttime_2days: pricing.subscription_parttime_2days,
        subscription_parttime_3days: pricing.subscription_parttime_3days,
        subscription_fulltime: pricing.subscription_fulltime,
        single_day_price: pricing.single_day_price,
        additional_day_price: pricing.additional_day_price,
        sibling_discount_percent: pricing.sibling_discount_percent,
        trial_day_price: pricing.trial_day_price,
        updated_at: new Date().toISOString(),
      };

      // Försök uppdatera eller skapa ny
      const { error: upsertError } = await supabase
        .from("daycare_pricing")
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

  const handleChange = (field: keyof DagisPricing, value: number) => {
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
      {/* Header - Symmetrisk layout */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-8 py-4">
          <div className="flex items-center justify-between">
            {/* Vänster: Tillbaka-länk */}
            <Link
              href="/admin"
              className="inline-flex items-center text-sm text-gray-600 hover:text-[#2c7a4c] transition-colors"
            >
              <ArrowLeft className="w-4 h-4 mr-1.5" />
              Tillbaka till Admin
            </Link>

            {/* Center: Rubrik */}
            <div className="flex items-center gap-3 absolute left-1/2 transform -translate-x-1/2">
              <div className="text-2xl">🐕</div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">
                  Priser - Hunddagis
                </h1>
                <p className="text-xs text-gray-600">
                  Hantera priser för dagisabonnemang och enstaka dagar
                </p>
              </div>
            </div>

            {/* Höger: Tom för symmetri */}
            <div className="w-32"></div>
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

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          {/* Abonnemangspriser */}
          <Card className="shadow-sm">
            <CardHeader className="pb-4">
              <CardTitle className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                <Calendar className="w-5 h-5 text-[#2c7a4c]" />
                Abonnemangspriser (per månad)
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 pt-0">
              <div>
                <Label
                  htmlFor="parttime2"
                  className="text-sm font-medium text-gray-700"
                >
                  Deltid 2 (2 dagar/vecka)
                </Label>
                <div className="flex items-center gap-2 mt-1.5">
                  <Input
                    id="parttime2"
                    type="number"
                    value={pricing.subscription_parttime_2days}
                    onChange={(e) =>
                      handleChange(
                        "subscription_parttime_2days",
                        parseFloat(e.target.value)
                      )
                    }
                    className="flex-1 h-9 text-sm"
                  />
                  <span className="text-sm text-gray-600 whitespace-nowrap">
                    kr/mån
                  </span>
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  Två fasta veckodagar
                </p>
              </div>

              <div>
                <Label
                  htmlFor="parttime3"
                  className="text-sm font-medium text-gray-700"
                >
                  Deltid 3 (3 dagar/vecka)
                </Label>
                <div className="flex items-center gap-2 mt-1.5">
                  <Input
                    id="parttime3"
                    type="number"
                    value={pricing.subscription_parttime_3days}
                    onChange={(e) =>
                      handleChange(
                        "subscription_parttime_3days",
                        parseFloat(e.target.value)
                      )
                    }
                    className="flex-1 h-9 text-sm"
                  />
                  <span className="text-sm text-gray-600 whitespace-nowrap">
                    kr/mån
                  </span>
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  Tre fasta veckodagar
                </p>
              </div>

              <div>
                <Label
                  htmlFor="fulltime"
                  className="text-sm font-medium text-gray-700"
                >
                  Heltid (5 dagar/vecka)
                </Label>
                <div className="flex items-center gap-2 mt-1.5">
                  <Input
                    id="fulltime"
                    type="number"
                    value={pricing.subscription_fulltime}
                    onChange={(e) =>
                      handleChange(
                        "subscription_fulltime",
                        parseFloat(e.target.value)
                      )
                    }
                    className="flex-1 h-9 text-sm"
                  />
                  <span className="text-sm text-gray-600 whitespace-nowrap">
                    kr/mån
                  </span>
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  Måndag till fredag, alla veckodagar
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Övriga priser */}
          <Card className="shadow-sm">
            <CardHeader className="pb-4">
              <CardTitle className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                <DollarSign className="w-5 h-5 text-[#2c7a4c]" />
                Övriga priser
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 pt-0">
              <div>
                <Label
                  htmlFor="single"
                  className="text-sm font-medium text-gray-700"
                >
                  Dagshund (enstaka dag)
                </Label>
                <div className="flex items-center gap-2 mt-1.5">
                  <Input
                    id="single"
                    type="number"
                    value={pricing.single_day_price}
                    onChange={(e) =>
                      handleChange(
                        "single_day_price",
                        parseFloat(e.target.value)
                      )
                    }
                    className="flex-1 h-9 text-sm"
                  />
                  <span className="text-sm text-gray-600 whitespace-nowrap">
                    kr/dag
                  </span>
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  För kunder utan abonnemang (drop-in)
                </p>
              </div>

              <div>
                <Label
                  htmlFor="additional"
                  className="text-sm font-medium text-gray-700"
                >
                  Tilläggsdagar för dagishund
                </Label>
                <div className="flex items-center gap-2 mt-1.5">
                  <Input
                    id="additional"
                    type="number"
                    value={pricing.additional_day_price}
                    onChange={(e) =>
                      handleChange(
                        "additional_day_price",
                        parseFloat(e.target.value)
                      )
                    }
                    className="flex-1 h-9 text-sm"
                  />
                  <span className="text-sm text-gray-600 whitespace-nowrap">
                    kr/dag
                  </span>
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  Extra dagar utöver abonnemang
                </p>
              </div>

              <div>
                <Label
                  htmlFor="trial"
                  className="text-sm font-medium text-gray-700"
                >
                  Provdag
                </Label>
                <div className="flex items-center gap-2 mt-1.5">
                  <Input
                    id="trial"
                    type="number"
                    value={pricing.trial_day_price}
                    onChange={(e) =>
                      handleChange(
                        "trial_day_price",
                        parseFloat(e.target.value)
                      )
                    }
                    className="flex-1 h-9 text-sm"
                  />
                  <span className="text-sm text-gray-600 whitespace-nowrap">
                    kr/dag
                  </span>
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  Första gången en hund testar dagiset
                </p>
              </div>

              <div>
                <Label
                  htmlFor="sibling"
                  className="text-sm font-medium text-gray-700"
                >
                  Syskonrabatt
                </Label>
                <div className="flex items-center gap-2 mt-1.5">
                  <Input
                    id="sibling"
                    type="number"
                    value={pricing.sibling_discount_percent}
                    onChange={(e) =>
                      handleChange(
                        "sibling_discount_percent",
                        parseFloat(e.target.value)
                      )
                    }
                    className="flex-1 h-9 text-sm"
                  />
                  <span className="text-sm text-gray-600">%</span>
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  Rabatt på andra hunden från samma ägare
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Info Box */}
        <Card className="mt-5 bg-blue-50/50 border-blue-100 shadow-sm">
          <CardContent className="pt-5">
            <div className="flex items-start gap-3">
              <TrendingUp className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
              <div>
                <h3 className="text-sm font-semibold text-blue-900 mb-2">
                  💡 Tips för prissättning
                </h3>
                <ul className="text-sm text-blue-800 space-y-1 leading-relaxed">
                  <li>
                    • <strong>Deltid 2:</strong> Två fasta veckodagar (t.ex.
                    måndag & onsdag)
                  </li>
                  <li>
                    • <strong>Deltid 3:</strong> Tre fasta veckodagar (t.ex.
                    måndag, onsdag, fredag)
                  </li>
                  <li>
                    • <strong>Heltid:</strong> Alla veckodagar (måndag-fredag) -
                    bäst pris per dag
                  </li>
                  <li>
                    • <strong>Dagshund:</strong> Enstaka dagar utan abonnemang
                    (drop-in)
                  </li>
                  <li>
                    • <strong>Tilläggsdagar:</strong> Extra dagar för befintliga
                    dagishundar
                  </li>
                  <li>
                    • <strong>Provdag:</strong> Rabatterat pris för nya kunder
                  </li>
                  <li>
                    • <strong>Syskonrabatt:</strong> Uppmuntrar fler hundar från
                    samma familj
                  </li>
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
            {saving ? "Sparar..." : "Spara priser"}
          </Button>
        </div>
      </main>
    </div>
  );
}
