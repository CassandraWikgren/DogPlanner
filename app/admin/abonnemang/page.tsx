"use client";

import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import PageContainer from "@/components/PageContainer";
import {
  ArrowLeft,
  Briefcase,
  AlertTriangle,
  CheckCircle,
  CreditCard,
  Settings,
  Check,
  Loader2,
} from "lucide-react";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import { useAuth } from "@/app/context/AuthContext";
import {
  useEnabledServices,
  ServiceType,
} from "@/lib/hooks/useEnabledServices";

interface SubscriptionData {
  id: string;
  org_id: string;
  plan: string;
  status: string;
  trial_starts_at?: string;
  trial_ends_at?: string;
  created_at: string;
}

const AVAILABLE_SERVICES = [
  {
    id: "grooming" as ServiceType,
    name: "Hundfrisör",
    icon: "✂️",
    description: "Klippning, trimning, bad och pälsvård",
    monthlyPrice: 199,
    yearlyPrice: 1788,
    features: [
      "Bokningskalender för frisörtider",
      "Prishantering per behandling",
      "Kundregister med hundprofiler",
      "Journalföring",
      "Fakturering",
    ],
  },
  {
    id: "daycare" as ServiceType,
    name: "Hunddagis",
    icon: "🐕",
    description: "Dagisverksamhet med närvaroregistrering",
    monthlyPrice: 399,
    yearlyPrice: 4188,
    features: [
      "Kapacitetshantering",
      "Närvarokontroll",
      "Abonnemangsfakturering",
      "Väntelista",
      "Aktivitetsloggning",
    ],
  },
  {
    id: "boarding" as ServiceType,
    name: "Hundpensionat",
    icon: "🏨",
    description: "Pensionatbokning med rumshantering",
    monthlyPrice: 399,
    yearlyPrice: 4188,
    features: [
      "Rumshantering",
      "Säsongspriser",
      "Tillvalstjänster",
      "Bokningskalender",
      "Fakturering per natt",
    ],
  },
];

export default function AdminAbonnemangPage() {
  const { currentOrgId, loading: authLoading } = useAuth();
  const { services, refresh: refreshServices } = useEnabledServices();
  const supabase = createClientComponentClient();

  const [subscription, setSubscription] = useState<SubscriptionData | null>(
    null
  );
  const [selectedServices, setSelectedServices] = useState<ServiceType[]>([]);
  const [billingPeriod, setBillingPeriod] = useState<"monthly" | "yearly">(
    "monthly"
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [savingServices, setSavingServices] = useState(false);
  const [creating, setCreating] = useState(false);
  const [checkingOut, setCheckingOut] = useState(false);
  const [canceling, setCanceling] = useState(false);
  const [refundInfo, setRefundInfo] = useState<any>(null);
  const [showCancelDialog, setShowCancelDialog] = useState(false);

  useEffect(() => {
    if (!authLoading) {
      setSelectedServices(services);
    }
  }, [services, authLoading]);

  useEffect(() => {
    if (currentOrgId) {
      loadSubscription();
    } else {
      setLoading(false);
    }
  }, [currentOrgId]);

  const loadSubscription = async () => {
    if (!currentOrgId) return;

    setLoading(true);
    setError(null);

    try {
      const { data, error } = await supabase
        .from("subscriptions")
        .select("*")
        .eq("org_id", currentOrgId)
        .order("created_at", { ascending: false })
        .limit(1)
        .single();

      if (error && error.code !== "PGRST116") {
        throw new Error(`[ERR-1001] Databaskoppling: ${error.message}`);
      }

      setSubscription(data);
    } catch (err: any) {
      console.error("Error loading subscription:", err);
      setError(
        err.message || "[ERR-5001] Okänt fel vid laddning av prenumeration"
      );
    } finally {
      setLoading(false);
    }
  };

  const toggleService = (serviceId: ServiceType) => {
    if (selectedServices.includes(serviceId)) {
      setSelectedServices(selectedServices.filter((s) => s !== serviceId));
    } else {
      setSelectedServices([...selectedServices, serviceId]);
    }
  };

  const saveServices = async () => {
    if (!currentOrgId) {
      setError("Ingen organisation tilldelad");
      return;
    }

    if (selectedServices.length === 0) {
      setError("Du måste välja minst en tjänst");
      return;
    }

    setSavingServices(true);
    setError(null);
    setSuccess(null);

    try {
      // Mappa enabled_services till service_types (för OrganisationSelector)
      const serviceTypesMap: Record<string, string> = {
        daycare: "hunddagis",
        boarding: "hundpensionat",
        grooming: "hundfrisor",
      };
      const serviceTypes = selectedServices.map((s) => serviceTypesMap[s] || s);

      // Uppdatera BÅDA kolumnerna
      const { error: updateError } = await supabase
        .from("orgs")
        .update({
          enabled_services: selectedServices,
          service_types: serviceTypes,
        })
        .eq("id", currentOrgId);

      if (updateError) {
        throw new Error(`Kunde inte uppdatera: ${updateError.message}`);
      }

      await refreshServices();
      setSuccess(
        "✅ Tjänstinställningar sparade! Sidan uppdateras om 2 sekunder..."
      );

      // Reload page efter 2 sekunder för att uppdatera navigation
      setTimeout(() => {
        window.location.reload();
      }, 2000);
    } catch (err: any) {
      console.error("Error saving services:", err);
      setError(err.message || "Okänt fel vid sparning");
    } finally {
      setSavingServices(false);
    }
  };

  const calculatePrice = () => {
    const count = selectedServices.length;
    if (count === 0)
      return billingPeriod === "monthly" ? "0 kr/mån" : "0 kr/år";

    let total = 0;

    if (count === 1) {
      const service = AVAILABLE_SERVICES.find(
        (s) => s.id === selectedServices[0]
      );
      total =
        billingPeriod === "monthly"
          ? service?.monthlyPrice || 199
          : service?.yearlyPrice || 1788;
    } else if (count === 2) {
      total = billingPeriod === "monthly" ? 599 : 6588;
    } else {
      total = billingPeriod === "monthly" ? 799 : 8988; // Alla tre
    }

    return billingPeriod === "monthly"
      ? `${total} kr/mån`
      : `${total.toLocaleString("sv-SE")} kr/år`;
  };

  const handleUpgrade = async () => {
    if (!currentOrgId || selectedServices.length === 0) {
      setError("Välj minst en tjänst innan du uppgraderar");
      return;
    }

    setCheckingOut(true);
    setError(null);

    try {
      const response = await fetch("/api/subscription/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          orgId: currentOrgId,
          services: selectedServices,
          billingPeriod: billingPeriod,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Kunde inte skapa checkout-session");
      }

      const { url } = await response.json();

      if (url) {
        // Redirect to Stripe Checkout
        window.location.href = url;
      } else {
        throw new Error("Ingen checkout URL returnerades");
      }
    } catch (err: any) {
      console.error("Checkout error:", err);
      setError(err.message || "Något gick fel vid uppgradering");
      setCheckingOut(false);
    }
  };

  const handleCancelSubscription = async () => {
    if (!currentOrgId) return;

    // Först: Hämta återbetalningsinformation
    try {
      const response = await fetch(
        `/api/subscription/cancel?orgId=${currentOrgId}`,
        {
          method: "GET",
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(
          errorData.error || "Kunde inte hämta återbetalningsinformation"
        );
      }

      const data = await response.json();
      setRefundInfo(data);
      setShowCancelDialog(true);
    } catch (err: any) {
      console.error("Error fetching refund info:", err);
      setError(err.message || "Kunde inte beräkna återbetalning");
    }
  };

  const confirmCancellation = async () => {
    if (!currentOrgId) return;

    setCanceling(true);
    setError(null);

    try {
      const response = await fetch("/api/subscription/cancel", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orgId: currentOrgId }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Kunde inte avbryta prenumeration");
      }

      const data = await response.json();

      setShowCancelDialog(false);
      setSuccess(
        data.refund?.refund_amount > 0
          ? `✅ Prenumerationen har avbrutits. ${data.refund.refund_amount} kr återbetalas inom 5-10 arbetsdagar.`
          : "✅ Prenumerationen har avbrutits."
      );

      // Reload subscription data
      await loadSubscription();
    } catch (err: any) {
      console.error("Cancellation error:", err);
      setError(err.message || "Något gick fel vid avbokning");
    } finally {
      setCanceling(false);
    }
  };

  const createSubscription = async () => {
    if (!currentOrgId) return;
    setCreating(true);
    setError(null);
    try {
      const { data, error } = await supabase
        .from("subscriptions")
        .insert([
          {
            org_id: currentOrgId,
            plan: "standard",
            status: "active",
            created_at: new Date().toISOString(),
          },
        ])
        .select();

      if (error || !data || data.length === 0) {
        throw new Error(
          `[ERR-4001] Skapa prenumeration: ${error?.message || "No data returned"}`
        );
      }
      await loadSubscription();
      setSuccess("Prenumerationen har skapats!");
    } catch (err: any) {
      console.error("Error creating subscription:", err);
      setError(
        err.message || "[ERR-5001] Okänt fel vid skapande av prenumeration"
      );
    } finally {
      setCreating(false);
    }
  };

  const pauseSubscription = async () => {
    if (!subscription) return;

    setSaving(true);
    try {
      const { error } = await supabase
        .from("subscriptions")
        .update({ status: "paused" })
        .eq("id", subscription.id);

      if (error) {
        throw new Error(`[ERR-4001] Uppdatering: ${error.message}`);
      }

      await loadSubscription();
      setSuccess("Prenumerationen har pausats");
    } catch (err: any) {
      console.error("Error pausing subscription:", err);
      setError(err.message || "[ERR-5001] Okänt fel vid pausning");
    } finally {
      setSaving(false);
    }
  };

  const resumeSubscription = async () => {
    if (!subscription) return;

    setSaving(true);
    try {
      const { error } = await supabase
        .from("subscriptions")
        .update({ status: "active" })
        .eq("id", subscription.id);

      if (error) {
        throw new Error(`[ERR-4001] Uppdatering: ${error.message}`);
      }

      await loadSubscription();
      setSuccess("Prenumerationen har återaktiverats");
    } catch (err: any) {
      console.error("Error resuming subscription:", err);
      setError(err.message || "[ERR-5001] Okänt fel vid återaktivering");
    } finally {
      setSaving(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active":
        return "text-green-700 bg-green-100";
      case "trialing":
        return "text-blue-700 bg-blue-100";
      case "paused":
        return "text-yellow-700 bg-yellow-100";
      case "canceled":
        return "text-red-700 bg-red-100";
      default:
        return "text-gray-700 bg-gray-100";
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case "active":
        return "Aktiv";
      case "trialing":
        return "Gratis period";
      case "paused":
        return "Pausad";
      case "canceled":
        return "Avslutad";
      default:
        return "Okänd";
    }
  };

  if (loading || authLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader2 className="h-12 w-12 animate-spin text-[#2c7a4c]" />
      </div>
    );
  }

  if (!currentOrgId) {
    return (
      <PageContainer maxWidth="4xl">
        <Card className="max-w-2xl mx-auto mt-8">
          <CardContent className="pt-6 text-center">
            <AlertTriangle className="h-12 w-12 text-orange-600 mx-auto mb-4" />
            <p className="text-gray-600">Ingen organisation tilldelad.</p>
          </CardContent>
        </Card>
      </PageContainer>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Kompakt header enligt DESIGN_SYSTEM_V2 */}
      <div className="bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-6 py-6">
          <Link
            href="/admin"
            className="inline-flex items-center text-[#2c7a4c] hover:text-[#236139] mb-4"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Tillbaka till Admin
          </Link>
          <h1 className="text-[32px] font-bold text-[#2c7a4c]">
            Mitt Abonnemang
          </h1>
          <p className="text-base text-gray-600 mt-1">
            Hantera din prenumeration och aktiverade tjänster
          </p>
        </div>
      </div>

      {/* Innehåll */}
      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Success/Error meddelanden */}
        {success && (
          <Card className="mb-6 border-green-200 bg-green-50">
            <CardContent className="pt-4 pb-4">
              <div className="flex items-start gap-2">
                <Check className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                <p className="text-green-700 text-sm">{success}</p>
              </div>
            </CardContent>
          </Card>
        )}

        {error && (
          <Card className="mb-6 border-red-200 bg-red-50">
            <CardContent className="pt-4 pb-4">
              <div className="flex items-center space-x-2 text-red-700">
                <AlertTriangle className="h-5 w-5" />
                <span className="text-sm">{error}</span>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Aktiverade Tjänster - FÖRST */}
        <Card className="mb-6">
          <CardHeader className="bg-[#2c7a4c] text-white rounded-t-lg">
            <CardTitle className="text-lg font-semibold flex items-center gap-2">
              <Settings className="h-5 w-5" />
              Aktiverade Tjänster
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-6">
            <p className="text-sm text-gray-600 mb-6">
              Välj vilka tjänster ditt företag erbjuder. Endast valda moduler
              visas i menyer och dashboards.
            </p>

            {/* Billing Period Toggle */}
            <div className="flex items-center justify-center mb-6">
              <div className="inline-flex items-center bg-gray-100 rounded-lg p-1">
                <button
                  type="button"
                  onClick={() => setBillingPeriod("monthly")}
                  className={`px-6 py-2 rounded-md text-sm font-medium transition-all ${
                    billingPeriod === "monthly"
                      ? "bg-white text-[#2c7a4c] shadow-sm"
                      : "text-gray-600 hover:text-gray-900"
                  }`}
                >
                  Månadsvis
                </button>
                <button
                  type="button"
                  onClick={() => setBillingPeriod("yearly")}
                  className={`px-6 py-2 rounded-md text-sm font-medium transition-all ${
                    billingPeriod === "yearly"
                      ? "bg-white text-[#2c7a4c] shadow-sm"
                      : "text-gray-600 hover:text-gray-900"
                  }`}
                >
                  Årsvis
                  <span className="ml-2 text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full">
                    Spara 600 kr
                  </span>
                </button>
              </div>
            </div>

            {/* Savings Banner (only show when yearly is selected) */}
            {billingPeriod === "yearly" && (
              <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6 text-center">
                <p className="text-green-700 font-semibold text-sm">
                  🎉 Fantastisk besparing! Du sparar 600 kr per år med
                  årsbetalning
                </p>
              </div>
            )}

            {/* Service Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              {AVAILABLE_SERVICES.map((service) => (
                <button
                  key={service.id}
                  type="button"
                  onClick={() => toggleService(service.id)}
                  className={`p-5 border-2 rounded-lg text-left transition-all ${
                    selectedServices.includes(service.id)
                      ? "border-[#2c7a4c] bg-[#e6f4ea]"
                      : "border-gray-200 bg-white hover:border-gray-300"
                  }`}
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="text-3xl">{service.icon}</div>
                    {selectedServices.includes(service.id) && (
                      <div className="w-6 h-6 bg-[#2c7a4c] rounded-full flex items-center justify-center">
                        <Check className="w-4 h-4 text-white" />
                      </div>
                    )}
                  </div>
                  <h3 className="font-semibold text-gray-900 mb-1">
                    {service.name}
                  </h3>
                  <p className="text-sm text-gray-600 mb-2">
                    {service.description}
                  </p>
                  <p className="text-sm font-semibold text-[#2c7a4c]">
                    {billingPeriod === "monthly"
                      ? `${service.monthlyPrice} kr/mån`
                      : `${service.yearlyPrice.toLocaleString("sv-SE")} kr/år`}
                  </p>
                </button>
              ))}
            </div>

            {/* Price summary */}
            {selectedServices.length > 0 && (
              <>
                <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 mb-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600">
                        {selectedServices.length === 1
                          ? "1 tjänst vald"
                          : `${selectedServices.length} tjänster valda`}
                      </p>
                      {selectedServices.length > 1 && (
                        <p className="text-xs text-green-600 mt-1">
                          ✓ Paketrabatt aktiverad!
                        </p>
                      )}
                    </div>
                    <div className="text-right">
                      <p className="text-2xl font-bold text-[#2c7a4c]">
                        {calculatePrice()}
                      </p>
                      <p className="text-xs text-gray-500 mt-1">
                        {billingPeriod === "yearly"
                          ? "Faktureras årligen"
                          : "Faktureras månadsvis"}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Upgrade Button (for trial/free users) */}
                {(!subscription || subscription.status === "trialing") && (
                  <Button
                    onClick={handleUpgrade}
                    disabled={checkingOut}
                    className="w-full bg-gradient-to-r from-[#2c7a4c] to-[#1e5d36] hover:from-[#236139] hover:to-[#1a4d2d] text-white h-12 mb-4 text-base font-semibold shadow-lg"
                  >
                    {checkingOut ? (
                      <>
                        <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                        Öppnar Stripe Checkout...
                      </>
                    ) : (
                      <>
                        <CreditCard className="mr-2 h-5 w-5" />
                        Uppgradera till Betald Plan
                      </>
                    )}
                  </Button>
                )}
              </>
            )}

            {/* Save button */}
            <Button
              onClick={saveServices}
              disabled={savingServices || selectedServices.length === 0}
              className="w-full bg-[#2c7a4c] hover:bg-[#236139] text-white h-10"
            >
              {savingServices ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Sparar...
                </>
              ) : (
                "Spara tjänstinställningar"
              )}
            </Button>
          </CardContent>
        </Card>

        {/* Prenumerationsstatus */}
        <Card className="mb-6">
          <CardHeader className="bg-[#2c7a4c] text-white rounded-t-lg">
            <CardTitle className="text-lg font-semibold flex items-center gap-2">
              <Briefcase className="h-5 w-5" />
              Prenumerationsstatus
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-6">
            {subscription ? (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                  <div>
                    <label className="text-sm font-medium text-gray-600 block mb-1">
                      Plan
                    </label>
                    <p className="text-lg font-semibold capitalize">
                      {subscription.plan}
                    </p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-600 block mb-1">
                      Status
                    </label>
                    <span
                      className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(
                        subscription.status
                      )}`}
                    >
                      {getStatusText(subscription.status)}
                    </span>
                  </div>

                  {subscription.trial_ends_at && (
                    <div>
                      <label className="text-sm font-medium text-gray-600 block mb-1">
                        Gratis period slutar
                      </label>
                      <p className="text-lg">
                        {new Date(
                          subscription.trial_ends_at
                        ).toLocaleDateString("sv-SE")}
                      </p>
                    </div>
                  )}

                  <div>
                    <label className="text-sm font-medium text-gray-600 block mb-1">
                      Prenumeration startad
                    </label>
                    <p className="text-lg">
                      {new Date(subscription.created_at).toLocaleDateString(
                        "sv-SE"
                      )}
                    </p>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-3">
                  {subscription.status === "active" ||
                  subscription.status === "trialing" ? (
                    <Button
                      onClick={pauseSubscription}
                      disabled={saving}
                      variant="outline"
                      className="border-yellow-500 text-yellow-700 hover:bg-yellow-50"
                    >
                      {saving ? "Pausar..." : "Pausa prenumeration"}
                    </Button>
                  ) : subscription.status === "paused" ? (
                    <Button
                      onClick={resumeSubscription}
                      disabled={saving}
                      className="bg-[#2c7a4c] hover:bg-[#236139] text-white"
                    >
                      {saving
                        ? "Återaktiverar..."
                        : "Återaktivera prenumeration"}
                    </Button>
                  ) : null}

                  <Button
                    variant="outline"
                    className="border-red-500 text-red-700 hover:bg-red-50"
                    onClick={handleCancelSubscription}
                  >
                    Avbryt prenumeration
                  </Button>
                </div>
              </>
            ) : (
              <div className="text-center py-8">
                <AlertTriangle className="h-12 w-12 text-yellow-500 mx-auto mb-4" />
                <p className="text-gray-600 mb-4">
                  Ingen aktiv prenumeration hittades
                </p>
                <Button
                  className="bg-[#2c7a4c] hover:bg-[#236139] text-white"
                  onClick={createSubscription}
                  disabled={creating}
                >
                  {creating ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Skapar...
                    </>
                  ) : (
                    "Skapa ny prenumeration"
                  )}
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Faktureringsinformation */}
        <Card>
          <CardHeader className="bg-[#2c7a4c] text-white rounded-t-lg">
            <CardTitle className="text-lg font-semibold flex items-center gap-2">
              <CreditCard className="h-5 w-5" />
              Faktureringsinformation
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
              <div className="flex items-center gap-2 text-blue-700 mb-2">
                <CheckCircle className="h-5 w-5" />
                <span className="font-medium text-sm">Information</span>
              </div>
              <p className="text-blue-600 text-sm">
                Faktureringsinformation och betalningsmetoder hanteras via vår
                betalningspartner. Kontakta support om du behöver ändra
                betalningsuppgifter.
              </p>
            </div>

            <Button variant="outline">Kontakta support</Button>
          </CardContent>
        </Card>

        {/* Cancel Subscription Dialog */}
        {showCancelDialog && refundInfo && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <Card className="max-w-lg w-full">
              <CardHeader className="bg-red-50 border-b border-red-200">
                <CardTitle className="text-lg font-semibold text-red-700 flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5" />
                  Bekräfta avbokning
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-6">
                {refundInfo.eligible ? (
                  <>
                    <p className="text-gray-700 mb-4">
                      Du har använt tjänsten i{" "}
                      <strong>{refundInfo.months_used} månader</strong>.
                    </p>

                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
                      <h4 className="font-semibold text-blue-900 mb-2">
                        Återbetalningsberäkning:
                      </h4>
                      <div className="space-y-1 text-sm text-blue-800">
                        <p>
                          • Betalt:{" "}
                          {refundInfo.yearly_price?.toLocaleString("sv-SE")} kr
                          (årsabonnemang)
                        </p>
                        <p>
                          • Använt: {refundInfo.months_used} mån ×{" "}
                          {refundInfo.monthly_price} kr ={" "}
                          {refundInfo.amount_used?.toLocaleString("sv-SE")} kr
                        </p>
                        <p className="font-bold text-lg mt-2 text-green-700">
                          💰 Återbetalning:{" "}
                          {refundInfo.refund_amount?.toLocaleString("sv-SE")} kr
                        </p>
                      </div>
                    </div>

                    <p className="text-sm text-gray-600 mb-6">
                      Pengarna återbetalas automatiskt till samma betalmetod
                      inom 5-10 arbetsdagar.
                    </p>
                  </>
                ) : (
                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4">
                    <p className="text-yellow-800">
                      {refundInfo.reason ===
                      "Endast årsabonnemang kan återbetalas pro-rata"
                        ? "Månadsabonnemang har ingen återbetalning vid avbrott."
                        : refundInfo.reason}
                    </p>
                  </div>
                )}

                <p className="text-red-600 font-medium mb-6">
                  ⚠️ Detta kan inte ångras. Din prenumeration avslutas
                  omedelbart.
                </p>

                <div className="flex gap-3">
                  <Button
                    variant="outline"
                    onClick={() => setShowCancelDialog(false)}
                    disabled={canceling}
                    className="flex-1"
                  >
                    Avbryt
                  </Button>
                  <Button
                    onClick={confirmCancellation}
                    disabled={canceling}
                    className="flex-1 bg-red-600 hover:bg-red-700 text-white"
                  >
                    {canceling ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Avbryter...
                      </>
                    ) : (
                      "Bekräfta avbokning"
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}
