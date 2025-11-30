"use client";

import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import PageContainer from "@/components/PageContainer";
import { ArrowLeft, Check, AlertCircle, Settings, Loader2 } from "lucide-react";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import { useAuth } from "@/app/context/AuthContext";
import {
  useEnabledServices,
  ServiceType,
} from "@/lib/hooks/useEnabledServices";

const AVAILABLE_SERVICES = [
  {
    id: "grooming" as ServiceType,
    name: "Hundfrisör",
    icon: "✂️",
    description: "Klippning, trimning, bad och pälsvård",
    price: "199 kr/mån",
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
    price: "399 kr/mån",
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
    price: "399 kr/mån",
    features: [
      "Rumshantering",
      "Säsongspriser",
      "Tillvalstjänster",
      "Bokningskalender",
      "Fakturering per natt",
    ],
  },
];

export default function TjansterPage() {
  const { currentOrgId, loading: authLoading } = useAuth();
  const { services, refresh } = useEnabledServices();
  const supabase = createClientComponentClient();

  const [selectedServices, setSelectedServices] = useState<ServiceType[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    if (!authLoading) {
      setSelectedServices(services);
      setLoading(false);
    }
  }, [services, authLoading]);

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

    setSaving(true);
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

      await refresh();
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
      setSaving(false);
    }
  };

  const calculatePrice = () => {
    const count = selectedServices.length;
    if (count === 0) return "0 kr/mån";
    if (count === 1) {
      const service = AVAILABLE_SERVICES.find(
        (s) => s.id === selectedServices[0]
      );
      return service?.price || "199 kr/mån";
    }
    if (count === 2) return "599 kr/mån";
    return "799 kr/mån"; // Alla tre
  };

  if (authLoading || loading) {
    return (
      <PageContainer>
        <div className="flex items-center justify-center min-h-[400px]">
          <Loader2 className="h-12 w-12 animate-spin text-[#2c7a4c]" />
        </div>
      </PageContainer>
    );
  }

  if (!currentOrgId) {
    return (
      <PageContainer>
        <Card className="max-w-2xl mx-auto mt-8">
          <CardContent className="pt-6 text-center">
            <AlertCircle className="h-12 w-12 text-orange-600 mx-auto mb-4" />
            <p className="text-gray-600">Ingen organisation tilldelad.</p>
          </CardContent>
        </Card>
      </PageContainer>
    );
  }

  return (
    <PageContainer>
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <Link
            href="/admin"
            className="inline-flex items-center text-[#2c7a4c] hover:text-[#236139] mb-4"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Tillbaka till Admin
          </Link>
          <div>
            <h1 className="text-3xl font-bold text-[#2c7a4c] flex items-center gap-3">
              <Settings className="h-8 w-8" />
              Tjänsteinställningar
            </h1>
            <p className="text-gray-600 mt-1">
              Välj vilka tjänster ditt företag erbjuder. Endast valda moduler
              visas i menyer och dashboards.
            </p>
          </div>
        </div>

        {/* Success Message */}
        {success && (
          <Card className="mb-4 border-green-200 bg-green-50">
            <CardContent className="pt-4 pb-4">
              <div className="flex items-start gap-2">
                <Check className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                <p className="text-green-700 text-sm">{success}</p>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Error Message */}
        {error && (
          <Card className="mb-4 border-orange-200 bg-orange-50">
            <CardContent className="pt-4 pb-4">
              <div className="flex items-start gap-2">
                <AlertCircle className="h-4 w-4 text-orange-600 mt-0.5 flex-shrink-0" />
                <p className="text-orange-700 text-sm">{error}</p>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Service Selection */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {AVAILABLE_SERVICES.map((service) => {
            const isSelected = selectedServices.includes(service.id);
            return (
              <div
                key={service.id}
                onClick={() => toggleService(service.id)}
                className={`cursor-pointer rounded-lg border-2 p-6 transition-all ${
                  isSelected
                    ? "border-[#2c7a4c] bg-[#e6f4ea] shadow-md"
                    : "border-gray-200 bg-white hover:border-[#2c7a4c]/50"
                }`}
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="text-4xl">{service.icon}</div>
                  {isSelected && (
                    <div className="w-6 h-6 bg-[#2c7a4c] rounded-full flex items-center justify-center">
                      <Check className="h-4 w-4 text-white" />
                    </div>
                  )}
                </div>
                <h3 className="text-xl font-bold text-[#2c7a4c] mb-2">
                  {service.name}
                </h3>
                <p className="text-sm text-gray-600 mb-3">
                  {service.description}
                </p>
                <p className="text-lg font-bold text-[#2c7a4c] mb-4">
                  {service.price}
                </p>
                <ul className="space-y-2">
                  {service.features.map((feature, index) => (
                    <li
                      key={index}
                      className="flex items-start gap-2 text-sm text-gray-700"
                    >
                      <Check className="h-4 w-4 text-[#2c7a4c] flex-shrink-0 mt-0.5" />
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>
              </div>
            );
          })}
        </div>

        {/* Pricing Summary */}
        <Card className="mb-6 border-[#2c7a4c]">
          <CardHeader className="bg-[#e6f4ea]">
            <CardTitle className="text-lg text-[#2c7a4c]">
              Prissättning
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 mb-1">
                  Du har valt <strong>{selectedServices.length}</strong>{" "}
                  tjänst(er)
                </p>
                <p className="text-2xl font-bold text-[#2c7a4c]">
                  {calculatePrice()}
                </p>
              </div>
              <Button
                onClick={saveServices}
                disabled={saving || selectedServices.length === 0}
                className="bg-[#2c7a4c] hover:bg-[#236139] text-white"
              >
                {saving ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Sparar...
                  </>
                ) : (
                  <>
                    <Check className="h-4 w-4 mr-2" />
                    Spara ändringar
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Info Box */}
        <Card className="border-blue-200 bg-blue-50">
          <CardContent className="pt-4">
            <div className="flex items-start gap-3">
              <AlertCircle className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
              <div className="text-sm text-blue-900">
                <p className="font-medium mb-2">Viktigt att veta:</p>
                <ul className="list-disc list-inside space-y-1 text-blue-800">
                  <li>Endast valda tjänster visas i menyer och dashboards</li>
                  <li>Befintlig data påverkas inte när du ändrar tjänster</li>
                  <li>Kombinationserbjudanden ger bättre pris</li>
                  <li>Du kan ändra dina tjänster när som helst</li>
                  <li>Ändringar träder i kraft omedelbart efter sparning</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </PageContainer>
  );
}
