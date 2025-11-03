"use client";

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
  Calendar,
  TrendingUp,
} from "lucide-react";
import Link from "next/link";

interface DagisPricing {
  id?: string;
  org_id: string;
  // Abonnemangspriser (per månad)
  subscription_1day: number;
  subscription_2days: number;
  subscription_3days: number;
  subscription_4days: number;
  subscription_5days: number;
  // Enstaka dagar
  single_day_price: number;
  // Rabatter
  sibling_discount_percent: number;
  trial_day_price: number;
  updated_at?: string;
}

export default function DagisPriserPage() {
  const supabase = createClientComponentClient();
  const { currentOrgId } = useAuth();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const [pricing, setPricing] = useState<DagisPricing>({
    org_id: currentOrgId || "",
    subscription_1day: 1500,
    subscription_2days: 2500,
    subscription_3days: 3300,
    subscription_4days: 4000,
    subscription_5days: 4500,
    single_day_price: 350,
    sibling_discount_percent: 10,
    trial_day_price: 200,
  });

  useEffect(() => {
    if (currentOrgId) {
      loadPricing();
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
        subscription_1day: pricing.subscription_1day,
        subscription_2days: pricing.subscription_2days,
        subscription_3days: pricing.subscription_3days,
        subscription_4days: pricing.subscription_4days,
        subscription_5days: pricing.subscription_5days,
        single_day_price: pricing.single_day_price,
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
            <div className="text-4xl">🐕</div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                Priser - Hunddagis
              </h1>
              <p className="text-gray-600 mt-1">
                Hantera priser för dagisabonnemang och enstaka dagar
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
          {/* Abonnemangspriser */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="w-5 h-5 text-[#2c7a4c]" />
                Abonnemangspriser (per månad)
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="sub1">1 dag/vecka</Label>
                <div className="flex items-center gap-2">
                  <Input
                    id="sub1"
                    type="number"
                    value={pricing.subscription_1day}
                    onChange={(e) =>
                      handleChange(
                        "subscription_1day",
                        parseFloat(e.target.value)
                      )
                    }
                    className="flex-1"
                  />
                  <span className="text-gray-600">kr/mån</span>
                </div>
              </div>

              <div>
                <Label htmlFor="sub2">2 dagar/vecka</Label>
                <div className="flex items-center gap-2">
                  <Input
                    id="sub2"
                    type="number"
                    value={pricing.subscription_2days}
                    onChange={(e) =>
                      handleChange(
                        "subscription_2days",
                        parseFloat(e.target.value)
                      )
                    }
                    className="flex-1"
                  />
                  <span className="text-gray-600">kr/mån</span>
                </div>
              </div>

              <div>
                <Label htmlFor="sub3">3 dagar/vecka</Label>
                <div className="flex items-center gap-2">
                  <Input
                    id="sub3"
                    type="number"
                    value={pricing.subscription_3days}
                    onChange={(e) =>
                      handleChange(
                        "subscription_3days",
                        parseFloat(e.target.value)
                      )
                    }
                    className="flex-1"
                  />
                  <span className="text-gray-600">kr/mån</span>
                </div>
              </div>

              <div>
                <Label htmlFor="sub4">4 dagar/vecka</Label>
                <div className="flex items-center gap-2">
                  <Input
                    id="sub4"
                    type="number"
                    value={pricing.subscription_4days}
                    onChange={(e) =>
                      handleChange(
                        "subscription_4days",
                        parseFloat(e.target.value)
                      )
                    }
                    className="flex-1"
                  />
                  <span className="text-gray-600">kr/mån</span>
                </div>
              </div>

              <div>
                <Label htmlFor="sub5">5 dagar/vecka (heltid)</Label>
                <div className="flex items-center gap-2">
                  <Input
                    id="sub5"
                    type="number"
                    value={pricing.subscription_5days}
                    onChange={(e) =>
                      handleChange(
                        "subscription_5days",
                        parseFloat(e.target.value)
                      )
                    }
                    className="flex-1"
                  />
                  <span className="text-gray-600">kr/mån</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Övriga priser */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <DollarSign className="w-5 h-5 text-[#2c7a4c]" />
                Övriga priser
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="single">Enstaka dag (drop-in)</Label>
                <div className="flex items-center gap-2">
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
                    className="flex-1"
                  />
                  <span className="text-gray-600">kr/dag</span>
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  För kunder utan abonnemang
                </p>
              </div>

              <div>
                <Label htmlFor="trial">Provdag</Label>
                <div className="flex items-center gap-2">
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
                    className="flex-1"
                  />
                  <span className="text-gray-600">kr/dag</span>
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  Första gången en hund testar dagiset
                </p>
              </div>

              <div>
                <Label htmlFor="sibling">Syskonrabatt</Label>
                <div className="flex items-center gap-2">
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
                    className="flex-1"
                  />
                  <span className="text-gray-600">%</span>
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  Rabatt på andra hunden från samma ägare
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Info Box */}
        <Card className="mt-6 bg-blue-50 border-blue-200">
          <CardContent className="pt-6">
            <div className="flex items-start gap-3">
              <TrendingUp className="w-5 h-5 text-blue-600 mt-0.5" />
              <div>
                <h3 className="font-semibold text-blue-900 mb-2">
                  💡 Tips för prissättning
                </h3>
                <ul className="text-sm text-blue-800 space-y-1.5">
                  <li>
                    • Helabonnemang (5 dagar) ger bäst pris per dag för kunden
                  </li>
                  <li>
                    • Enstaka dagar bör kosta mer än abonnemang för att motivera
                    fast plats
                  </li>
                  <li>• Provdagar kan sättas lägre för att locka nya kunder</li>
                  <li>
                    • Syskonrabatt uppmuntrar till fler hundar från samma familj
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
