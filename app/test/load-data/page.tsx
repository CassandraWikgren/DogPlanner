"use client";

import React, { useState } from "react";
import { createBrowserClient } from "@supabase/ssr";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle, AlertTriangle, Play, Upload } from "lucide-react";

interface LoadStep {
  step: string;
  status: "pending" | "loading" | "success" | "error";
  message: string;
  count?: number;
}

export default function LoadTestDataPage() {
  const [steps, setSteps] = useState<LoadStep[]>([]);
  const [currentStep, setCurrentStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  const updateStep = (index: number, updates: Partial<LoadStep>) => {
    setSteps((prev) =>
      prev.map((step, i) => (i === index ? { ...step, ...updates } : step))
    );
  };

  const loadTestData = async () => {
    setLoading(true);
    setCurrentStep(0);

    const initialSteps: LoadStep[] = [
      { step: "Organisationer", status: "pending", message: "Väntar..." },
      { step: "Ägare", status: "pending", message: "Väntar..." },
      { step: "Hundar", status: "pending", message: "Väntar..." },
      { step: "Rum", status: "pending", message: "Väntar..." },
      { step: "Bokningar", status: "pending", message: "Väntar..." },
      { step: "Intresseanmälningar", status: "pending", message: "Väntar..." },
      { step: "Priser", status: "pending", message: "Väntar..." },
    ];

    setSteps(initialSteps);

    try {
      // Steg 1: Organisationer
      setCurrentStep(0);
      updateStep(0, { status: "loading", message: "Laddar organisationer..." });

      const orgData = [
        {
          id: "550e8400-e29b-41d4-a716-446655440000",
          name: "Malmö Hunddagis AB",
        },
      ];

      const { error: orgError } = await supabase
        .from("orgs")
        .upsert(orgData, { onConflict: "id" });

      if (orgError) throw new Error(`Org-fel: ${orgError.message}`);

      updateStep(0, {
        status: "success",
        message: `✅ ${orgData.length} organisationer laddade`,
        count: orgData.length,
      });

      // Steg 2: Ägare
      setCurrentStep(1);
      updateStep(1, { status: "loading", message: "Laddar ägare..." });

      const ownerData = [
        {
          id: "660e8400-e29b-41d4-a716-446655440001",
          org_id: "550e8400-e29b-41d4-a716-446655440000",
          full_name: "Anna Andersson",
          email: "anna.andersson@email.se",
          phone: "070-1234567",
          address: "Möllevångsgatan 12",
          postal_code: "214 20",
          city: "Malmö",
        },
        {
          id: "660e8400-e29b-41d4-a716-446655440002",
          org_id: "550e8400-e29b-41d4-a716-446655440000",
          full_name: "Erik Eriksson",
          email: "erik.eriksson@email.se",
          phone: "070-2345678",
          address: "Södergatan 25",
          postal_code: "211 40",
          city: "Malmö",
        },
        {
          id: "660e8400-e29b-41d4-a716-446655440003",
          org_id: "550e8400-e29b-41d4-a716-446655440000",
          full_name: "Maria Johansson",
          email: "maria.johansson@email.se",
          phone: "070-3456789",
          address: "Västergatan 8",
          postal_code: "211 21",
          city: "Malmö",
        },
      ];

      const { error: ownerError } = await supabase
        .from("owners")
        .upsert(ownerData, { onConflict: "id" });

      if (ownerError) throw new Error(`Ägare-fel: ${ownerError.message}`);

      updateStep(1, {
        status: "success",
        message: `✅ ${ownerData.length} ägare laddade`,
        count: ownerData.length,
      });

      // Steg 3: Hundar
      setCurrentStep(2);
      updateStep(2, { status: "loading", message: "Laddar hundar..." });

      const dogData = [
        {
          id: "770e8400-e29b-41d4-a716-446655440001",
          org_id: "550e8400-e29b-41d4-a716-446655440000",
          owner_id: "660e8400-e29b-41d4-a716-446655440001",
          name: "Bella",
          breed: "Golden Retriever",
          age: 3,
          weight: 28.5,
          color: "Guldfärgad",
          gender: "female",
          insurance_company: "Agria",
          insurance_number: "AGR123456789",
          microchip_number: "752098765432100",
          vaccination_date: "2024-01-15",
          veterinarian: "Malmö Djurklinik",
          emergency_contact: "Erik Andersson - 070-9876543",
          notes: "Mycket social och lekfull. Älskar vatten.",
          allergies: "Inga kända allergier",
          medications: "Inga mediciner",
          feeding_instructions: "2 gånger dagligen, 200g torrfoder",
          status: "active",
        },
        {
          id: "770e8400-e29b-41d4-a716-446655440002",
          org_id: "550e8400-e29b-41d4-a716-446655440000",
          owner_id: "660e8400-e29b-41d4-a716-446655440002",
          name: "Charlie",
          breed: "Labrador",
          age: 5,
          weight: 32.0,
          color: "Svart",
          gender: "male",
          insurance_company: "Folksam",
          insurance_number: "FOL987654321",
          microchip_number: "752098765432101",
          vaccination_date: "2024-02-10",
          veterinarian: "Citydjur Malmö",
          emergency_contact: "Lisa Eriksson - 070-1111222",
          notes: "Lugn och snäll, bra med barn",
          allergies: "Kyckling",
          medications: "Inga mediciner",
          feeding_instructions: "2 gånger dagligen, specialfoder utan kyckling",
          status: "active",
        },
        {
          id: "770e8400-e29b-41d4-a716-446655440003",
          org_id: "550e8400-e29b-41d4-a716-446655440000",
          owner_id: "660e8400-e29b-41d4-a716-446655440003",
          name: "Luna",
          breed: "Border Collie",
          age: 2,
          weight: 18.0,
          color: "Svart och vit",
          gender: "female",
          insurance_company: "Agria",
          insurance_number: "AGR111222333",
          microchip_number: "752098765432102",
          vaccination_date: "2024-03-05",
          veterinarian: "Malmö Djurklinik",
          emergency_contact: "Per Johansson - 070-5555666",
          notes: "Mycket intelligent och energisk",
          allergies: "Inga kända allergier",
          medications: "Inga mediciner",
          feeding_instructions: "2 gånger dagligen, 150g högkvalitativt foder",
          status: "active",
        },
      ];

      const { error: dogError } = await supabase
        .from("dogs")
        .upsert(dogData, { onConflict: "id" });

      if (dogError) throw new Error(`Hund-fel: ${dogError.message}`);

      updateStep(2, {
        status: "success",
        message: `✅ ${dogData.length} hundar laddade`,
        count: dogData.length,
      });

      // Steg 4: Rum
      setCurrentStep(3);
      updateStep(3, { status: "loading", message: "Laddar rum..." });

      const roomData = [
        {
          id: "880e8400-e29b-41d4-a716-446655440001",
          org_id: "550e8400-e29b-41d4-a716-446655440000",
          name: "Deluxe Svit A1",
          room_type: "deluxe",
          size: 12.5,
          max_capacity: 1,
          amenities: ["Uppvärmd golv", "Egen utegård", "Komfortbädd"],
          daily_rate: 450,
          description: "Vår mest lyxiga svit med egen utegård",
          is_available: true,
        },
        {
          id: "880e8400-e29b-41d4-a716-446655440002",
          org_id: "550e8400-e29b-41d4-a716-446655440000",
          name: "Standard Rum B2",
          room_type: "standard",
          size: 8.0,
          max_capacity: 1,
          amenities: ["Komfortbädd", "Leksaker"],
          daily_rate: 280,
          description: "Bekvämt standardrum för medelstora hundar",
          is_available: true,
        },
        {
          id: "880e8400-e29b-41d4-a716-446655440003",
          org_id: "550e8400-e29b-41d4-a716-446655440000",
          name: "Familjerum C1",
          room_type: "family",
          size: 15.0,
          max_capacity: 2,
          amenities: ["Dubbel utrymme", "Gemensam utegård", "Extra leksaker"],
          daily_rate: 380,
          description: "Perfekt för två hundar från samma familj",
          is_available: true,
        },
      ];

      const { error: roomError } = await supabase
        .from("rooms")
        .upsert(roomData, { onConflict: "id" });

      if (roomError) throw new Error(`Rum-fel: ${roomError.message}`);

      updateStep(3, {
        status: "success",
        message: `✅ ${roomData.length} rum laddade`,
        count: roomData.length,
      });

      // Steg 5: Bokningar
      setCurrentStep(4);
      updateStep(4, { status: "loading", message: "Laddar bokningar..." });

      const bookingData = [
        {
          id: "990e8400-e29b-41d4-a716-446655440001",
          org_id: "550e8400-e29b-41d4-a716-446655440000",
          dog_id: "770e8400-e29b-41d4-a716-446655440001",
          owner_id: "660e8400-e29b-41d4-a716-446655440001",
          room_id: "880e8400-e29b-41d4-a716-446655440001",
          check_in_date: "2024-12-20",
          check_out_date: "2024-12-23",
          total_price: 1350,
          status: "confirmed",
          special_requests: "Extra promenader, Bella älskar att springa",
          emergency_contact: "Erik Andersson - 070-9876543",
        },
        {
          id: "990e8400-e29b-41d4-a716-446655440002",
          org_id: "550e8400-e29b-41d4-a716-446655440000",
          dog_id: "770e8400-e29b-41d4-a716-446655440002",
          owner_id: "660e8400-e29b-41d4-a716-446655440002",
          room_id: "880e8400-e29b-41d4-a716-446655440002",
          check_in_date: "2024-12-25",
          check_out_date: "2024-12-30",
          total_price: 1400,
          status: "confirmed",
          special_requests: "Specialfoder utan kyckling medföljer",
          emergency_contact: "Lisa Eriksson - 070-1111222",
        },
      ];

      const { error: bookingError } = await supabase
        .from("bookings")
        .upsert(bookingData, { onConflict: "id" });

      if (bookingError)
        throw new Error(`Boknings-fel: ${bookingError.message}`);

      updateStep(4, {
        status: "success",
        message: `✅ ${bookingData.length} bokningar laddade`,
        count: bookingData.length,
      });

      // Steg 6: Intresseanmälningar
      setCurrentStep(5);
      updateStep(5, {
        status: "loading",
        message: "Laddar intresseanmälningar...",
      });

      const applicationData = [
        {
          id: "aa0e8400-e29b-41d4-a716-446655440001",
          org_id: "550e8400-e29b-41d4-a716-446655440000",
          owner_name: "Karin Svensson",
          email: "karin.svensson@email.se",
          phone: "070-4567890",
          dog_name: "Max",
          dog_breed: "Tysk Schäfer",
          dog_age: 4,
          preferred_start_date: "2025-01-15",
          status: "pending",
          notes:
            "Karin vill starta i januari. Max är väluppfostrad och social.",
          created_at: "2024-12-01T10:00:00Z",
        },
        {
          id: "aa0e8400-e29b-41d4-a716-446655440002",
          org_id: "550e8400-e29b-41d4-a716-446655440000",
          owner_name: "David Lindqvist",
          email: "david.lindqvist@email.se",
          phone: "070-6789012",
          dog_name: "Stella",
          dog_breed: "Cocker Spaniel",
          dog_age: 1,
          preferred_start_date: "2025-02-01",
          status: "approved",
          notes: "Ung valp som behöver socialisering. Familjen har erfarenhet.",
          created_at: "2024-11-28T14:30:00Z",
        },
      ];

      const { error: appError } = await supabase
        .from("interest_applications")
        .upsert(applicationData, { onConflict: "id" });

      if (appError) throw new Error(`Ansökan-fel: ${appError.message}`);

      updateStep(5, {
        status: "success",
        message: `✅ ${applicationData.length} ansökningar laddade`,
        count: applicationData.length,
      });

      // Steg 7: Priser
      setCurrentStep(6);
      updateStep(6, { status: "loading", message: "Laddar priser..." });

      const pricingData = [
        {
          id: "cc0e8400-e29b-41d4-a716-446655440001",
          org_id: "550e8400-e29b-41d4-a716-446655440000",
          service_type: "hunddagis",
          price_per_day: 320,
          price_per_hour: 45,
          description: "Hunddagis heldag",
        },
        {
          id: "cc0e8400-e29b-41d4-a716-446655440002",
          org_id: "550e8400-e29b-41d4-a716-446655440000",
          service_type: "hundpensionat",
          price_per_day: 280,
          description: "Hundpensionat per natt (standardrum)",
        },
        {
          id: "cc0e8400-e29b-41d4-a716-446655440003",
          org_id: "550e8400-e29b-41d4-a716-446655440000",
          service_type: "trim",
          price_per_hour: 650,
          description: "Hundfrisering och trimning",
        },
      ];

      const { error: pricingError } = await supabase
        .from("pricing")
        .upsert(pricingData, { onConflict: "id" });

      if (pricingError) throw new Error(`Pris-fel: ${pricingError.message}`);

      updateStep(6, {
        status: "success",
        message: `✅ ${pricingData.length} priser laddade`,
        count: pricingData.length,
      });
    } catch (error: any) {
      updateStep(currentStep, {
        status: "error",
        message: `❌ ${error.message}`,
      });
    }

    setLoading(false);
  };

  const progress =
    steps.length > 0 ? ((currentStep + 1) / steps.length) * 100 : 0;

  return (
    <div className="container mx-auto p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-blue-700 mb-2">
          📦 Ladda testdata
        </h1>
        <p className="text-gray-600">
          Ladda upp komplett testdata för att testa alla funktioner
        </p>
      </div>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Ladda testdata</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Button onClick={loadTestData} disabled={loading} className="w-full">
            {loading ? (
              <>
                <Upload className="mr-2 h-4 w-4 animate-spin" />
                Laddar data...
              </>
            ) : (
              <>
                <Play className="mr-2 h-4 w-4" />
                🚀 Ladda all testdata
              </>
            )}
          </Button>

          {loading && (
            <div className="w-full bg-gray-200 rounded-full h-2.5">
              <div
                className="bg-blue-600 h-2.5 rounded-full transition-all duration-300"
                style={{ width: `${progress}%` }}
              ></div>
            </div>
          )}
        </CardContent>
      </Card>

      {steps.length > 0 && (
        <div className="space-y-3">
          <h2 className="text-xl font-semibold">Progress</h2>

          {steps.map((step, index) => (
            <Card key={index}>
              <CardContent className="pt-4">
                <div className="flex items-center gap-3">
                  {step.status === "success" && (
                    <CheckCircle className="h-5 w-5 text-green-600" />
                  )}
                  {step.status === "error" && (
                    <AlertTriangle className="h-5 w-5 text-red-600" />
                  )}
                  {step.status === "loading" && (
                    <div className="h-5 w-5 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
                  )}
                  {step.status === "pending" && (
                    <div className="h-5 w-5 border-2 border-gray-300 rounded-full" />
                  )}

                  <div className="flex-1">
                    <h3 className="font-semibold">{step.step}</h3>
                    <p className="text-sm text-gray-600">{step.message}</p>
                  </div>

                  {step.count !== undefined && (
                    <div className="text-sm font-medium text-blue-600">
                      {step.count} st
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {steps.length > 0 && steps.every((s) => s.status === "success") && (
        <Card className="mt-6 border-green-200 bg-green-50">
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <p className="text-green-800 font-medium">
                🎉 All testdata har laddats framgångsrikt! Nu kan du testa alla
                funktioner i systemet.
              </p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
