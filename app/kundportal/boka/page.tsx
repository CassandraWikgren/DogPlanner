"use client";

// Förhindra prerendering för att undvika build-fel
export const dynamic = "force-dynamic";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { useAuth } from "@/app/context/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  PawPrint,
  ArrowLeft,
  Calendar as CalendarIcon,
  MapPin,
  Star,
  Info,
  CheckCircle,
  Plus,
} from "lucide-react";

// Felkoder enligt systemet
const ERROR_CODES = {
  DATABASE: "[ERR-1001]",
  AUTH: "[ERR-5001]",
  VALIDATION: "[ERR-4001]",
} as const;

// TypeScript-typer enligt Supabase schema
interface Dog {
  id: string;
  name: string;
  breed: string | null;
  heightcm: number | null; // Supabase använder heightcm
  owner_id: string;
}

interface Room {
  id: string;
  name: string;
  room_type: "daycare" | "boarding" | "both";
  capacity_m2: number;
  max_dogs: number;
}

interface Pensionat {
  id: string;
  name: string;
  location: string;
  rating: number;
  priceCategory: "budget" | "standard" | "premium";
  features: string[];
  description: string;
  available: boolean;
}

interface PriceCalculation {
  basePrice: number;
  sizeMultiplier: number;
  dateMultiplier: number;
  totalPerNight: number;
  totalCost: number;
  nights: number;
}

function BookingPageContent() {
  const { user } = useAuth();
  const searchParams = useSearchParams();
  const router = useRouter();
  const [selectedDog, setSelectedDog] = useState<string>("");
  const [selectedPensionat, setSelectedPensionat] = useState<string>("");
  const [checkinDate, setCheckinDate] = useState<Date | undefined>();
  const [checkoutDate, setCheckoutDate] = useState<Date | undefined>();
  const [step, setStep] = useState(1);
  const [priceCalculation, setPriceCalculation] =
    useState<PriceCalculation | null>(null);
  const [loading, setLoading] = useState(true);
  const [dogs, setDogs] = useState<Dog[]>([]);
  const [error, setError] = useState<string | null>(null);

  // Hämta hundar från Supabase
  useEffect(() => {
    fetchDogs();
  }, []);

  const fetchDogs = async () => {
    try {
      // Skapa Supabase client
      const supabase = createClient();

      // Kontrollera auth
      const {
        data: { user },
        error: authError,
      } = await supabase.auth.getUser();
      if (authError || !user) {
        router.push("/kundportal/login");
        return;
      }

      // Hämta ägaren
      if (!user.email) {
        throw new Error(`${ERROR_CODES.AUTH} Användare saknar email`);
      }

      const { data: ownerData, error: ownerError } = await supabase
        .from("owners")
        .select("id")
        .eq("email", user.email)
        .single();

      if (ownerError || !ownerData) {
        throw new Error(`${ERROR_CODES.DATABASE} Kunde inte hitta ägare`);
      }

      // Hämta hundar för denna ägare
      const { data: dogsData, error: dogsError } = await supabase
        .from("dogs")
        .select("id, name, breed, heightcm, owner_id")
        .eq("owner_id", ownerData.id);

      if (dogsError) {
        throw new Error(
          `${ERROR_CODES.DATABASE} Kunde inte hämta hundar: ${dogsError.message}`
        );
      }

      setDogs(dogsData || []);
      setLoading(false);
    } catch (err: any) {
      console.error("Fel vid hämtning av hundar:", err);
      setError(err.message || `${ERROR_CODES.DATABASE} Kunde inte ladda data`);
      setLoading(false);
    }
  };

  // Mock pensionat-data (skulle också komma från Supabase i en riktig implementation)
  const pensionat: Pensionat[] = [
    {
      id: "1",
      name: "Glada Tassar Pensionat",
      location: "Stockholm",
      rating: 4.8,
      priceCategory: "premium",
      features: [
        "Stora utomhusområden",
        "Individuell omsorg",
        "Veterinär på plats",
      ],
      description:
        "Ett premiumpensionat med fokus på individuell omsorg och stora utrymmen för hundarna.",
      available: true,
    },
    {
      id: "2",
      name: "Hundparadiset",
      location: "Göteborg",
      rating: 4.5,
      priceCategory: "standard",
      features: ["Lekområden", "Grupplekar", "Dagliga promenader"],
      description:
        "Ett familjevänligt pensionat med fokus på social stimulering och aktiviteter.",
      available: true,
    },
    {
      id: "3",
      name: "Budgetvänliga Hundhotellet",
      location: "Malmö",
      rating: 4.2,
      priceCategory: "budget",
      features: ["Grundläggande omsorg", "Säkra utrymmen", "Erfaren personal"],
      description:
        "Ett prisvärt alternativ som erbjuder trygg och säker vård för din hund.",
      available: true,
    },
  ];

  // Initialize with URL parameter
  useEffect(() => {
    const dogId = searchParams.get("dog");
    if (dogId) {
      setSelectedDog(dogId);
    }
  }, [searchParams]);

  const getDogSizeCategory = (
    heightcm: number | null
  ): "small" | "medium" | "large" => {
    if (!heightcm) return "medium"; // Default to medium if height unknown
    if (heightcm < 35) return "small";
    if (heightcm < 55) return "medium";
    return "large";
  };

  const getDateCategory = (
    date: Date
  ): "vardag" | "helg" | "sasong" | "hogtid" => {
    const day = date.getDay();
    const month = date.getMonth();

    // Helger (lördag = 6, söndag = 0)
    if (day === 0 || day === 6) return "helg";

    // Säsong (juni-augusti)
    if (month >= 5 && month <= 7) return "sasong";

    // Högtider (ungefärliga datum - skulle behöva mer sofistikerad logik)
    if (month === 11 || month === 0) return "hogtid"; // Dec/Jan

    return "vardag";
  };

  const calculatePrice = (
    dogId: string,
    pensionatId: string,
    checkin: Date,
    checkout: Date
  ): PriceCalculation | null => {
    const dog = dogs.find((d) => d.id === dogId);
    const pensionatData = pensionat.find((p) => p.id === pensionatId);

    if (!dog || !pensionatData) return null;

    // Grundpriser per natt
    const basePrices = {
      budget: 200,
      standard: 350,
      premium: 500,
    };

    // Storleksmultiplikatorer
    const sizeMultipliers = {
      small: 1.0,
      medium: 1.3,
      large: 1.6,
    };

    // Datummultiplikatorer
    const dateMultipliers = {
      vardag: 1.0,
      helg: 1.2,
      sasong: 1.4,
      hogtid: 1.6,
    };

    const basePrice = basePrices[pensionatData.priceCategory];
    const sizeCategory = getDogSizeCategory(dog.heightcm);
    const sizeMultiplier = sizeMultipliers[sizeCategory];

    // Beräkna genomsnittlig datummultiplikator för perioden
    const nights = Math.ceil(
      (checkout.getTime() - checkin.getTime()) / (1000 * 60 * 60 * 24)
    );
    let totalDateMultiplier = 0;

    for (let i = 0; i < nights; i++) {
      const currentDate = new Date(checkin);
      currentDate.setDate(currentDate.getDate() + i);
      const dateCategory = getDateCategory(currentDate);
      totalDateMultiplier += dateMultipliers[dateCategory];
    }

    const avgDateMultiplier = totalDateMultiplier / nights;
    const totalPerNight = Math.round(
      basePrice * sizeMultiplier * avgDateMultiplier
    );
    const totalCost = totalPerNight * nights;

    return {
      basePrice,
      sizeMultiplier,
      dateMultiplier: avgDateMultiplier,
      totalPerNight,
      totalCost,
      nights,
    };
  };

  const handleCalculatePrice = () => {
    if (selectedDog && selectedPensionat && checkinDate && checkoutDate) {
      const calculation = calculatePrice(
        selectedDog,
        selectedPensionat,
        checkinDate,
        checkoutDate
      );
      setPriceCalculation(calculation);
    }
  };

  useEffect(() => {
    handleCalculatePrice();
  }, [selectedDog, selectedPensionat, checkinDate, checkoutDate]);

  const handleBooking = async () => {
    if (
      !selectedDog ||
      !selectedPensionat ||
      !checkinDate ||
      !checkoutDate ||
      !priceCalculation
    ) {
      alert("Vänligen fyll i alla obligatoriska fält");
      return;
    }

    try {
      // Skapa Supabase client
      const supabase = createClient();

      // Hämta hundens ägare för bokningen
      const { data: dogData, error: dogError } = await supabase
        .from("dogs")
        .select("owner_id, heightcm")
        .eq("id", selectedDog)
        .single();

      if (dogError || !dogData) {
        console.error("Fel vid hämtning av hund:", dogError);
        alert("Kunde inte hitta hundinformation");
        return;
      }

      // Hämta pensionatets org_id
      const { data: pensionatData, error: pensionatError } = await supabase
        .from("pensionat")
        .select("org_id")
        .eq("id", selectedPensionat)
        .single();

      if (pensionatError || !pensionatData) {
        console.error("Fel vid hämtning av pensionat:", pensionatError);
        alert("Kunde inte hitta pensionat");
        return;
      }

      // Type assertion for pensionatData
      const pensionatSettings = pensionatData as { org_id: string };

      // Beräkna pris med calculateBookingPrice från boardingPriceCalculator
      const { calculateBookingPrice } =
        await import("@/lib/boardingPriceCalculator");
      const priceData = await calculateBookingPrice(
        checkinDate,
        checkoutDate,
        dogData.heightcm || 35,
        pensionatSettings.org_id
      );

      // Skapa bokningen med status "pending" för godkännande
      const { data: bookingData, error: bookingError } = await supabase
        .from("bookings")
        .insert([
          {
            dog_id: selectedDog,
            owner_id: dogData.owner_id,
            org_id: pensionatSettings.org_id,
            start_date: checkinDate.toISOString().split("T")[0],
            end_date: checkoutDate.toISOString().split("T")[0],
            service_type: "hundpensionat",
            status: "pending" as const, // Väntar på godkännande från pensionat
            total_price: priceData.totalPrice,
            discount_amount: 0,
            notes: null,
          },
        ])
        .select()
        .single();

      if (bookingError) {
        console.error("Fel vid skapande av bokning:", bookingError);
        alert("Kunde inte skapa bokning. Vänligen försök igen.");
        return;
      }

      alert(
        "Bokning skickad! Du kommer få en bekräftelse via e-post när pensionatet godkänt din ansökan."
      );
      router.push("/kundportal/dashboard");
    } catch (error) {
      console.error("Oväntat fel vid bokning:", error);
      alert("Ett oväntat fel inträffade. Vänligen försök igen.");
    }
  };

  const selectedDogData = dogs.find((d) => d.id === selectedDog);
  const selectedPensionatData = pensionat.find(
    (p) => p.id === selectedPensionat
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 flex items-center justify-center">
        <div className="text-center">
          <PawPrint className="h-12 w-12 text-[#2c7a4c] mx-auto mb-4 animate-spin" />
          <p className="text-gray-600">Laddar bokningsinformation...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 flex items-center justify-center">
        <Card className="max-w-md">
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-red-600 mb-4">{error}</p>
              <Button onClick={() => window.location.reload()}>
                Försök igen
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center h-16">
            <Link href="/kundportal/dashboard">
              <Button variant="ghost">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Tillbaka till dashboard
              </Button>
            </Link>
            <div className="flex items-center ml-4">
              <PawPrint className="h-6 w-6 text-[#2c7a4c] mr-2" />
              <h1 className="text-xl font-bold text-gray-800">Ny bokning</h1>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Progress Steps */}
        <div className="flex items-center justify-center mb-8">
          <div className="flex items-center space-x-4">
            {[
              { number: 1, label: "Välj hund & pensionat" },
              { number: 2, label: "Välj datum" },
              { number: 3, label: "Bekräfta bokning" },
            ].map(({ number, label }) => (
              <div key={number} className="flex items-center">
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                    step >= number
                      ? "bg-[#2c7a4c] text-white"
                      : "bg-gray-200 text-gray-600"
                  }`}
                >
                  {step > number ? <CheckCircle className="h-4 w-4" /> : number}
                </div>
                <span
                  className={`ml-2 text-sm ${
                    step >= number ? "text-[#2c7a4c]" : "text-gray-500"
                  }`}
                >
                  {label}
                </span>
                {number < 3 && (
                  <div
                    className={`w-8 h-0.5 ml-4 ${
                      step > number ? "bg-[#2c7a4c]" : "bg-gray-200"
                    }`}
                  />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Step 1: Select Dog and Pensionat */}
        {step === 1 && (
          <div className="space-y-6">
            {/* Select Dog */}
            <Card>
              <CardHeader>
                <CardTitle>Välj hund</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {dogs.map((dog) => (
                    <div
                      key={dog.id}
                      onClick={() => setSelectedDog(dog.id)}
                      className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                        selectedDog === dog.id
                          ? "border-[#2c7a4c] bg-green-50"
                          : "border-gray-200 hover:border-gray-300"
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="font-medium">{dog.name}</h3>
                          <p className="text-sm text-gray-600">{dog.breed}</p>
                          <p className="text-sm text-gray-500">
                            {dog.heightcm}cm •{" "}
                            {getDogSizeCategory(dog.heightcm) === "small"
                              ? "Liten"
                              : getDogSizeCategory(dog.heightcm) === "medium"
                                ? "Medel"
                                : "Stor"}{" "}
                            hund
                          </p>
                        </div>
                        <PawPrint
                          className={`h-6 w-6 ${
                            selectedDog === dog.id
                              ? "text-[#2c7a4c]"
                              : "text-gray-400"
                          }`}
                        />
                      </div>
                    </div>
                  ))}
                </div>
                {dogs.length === 0 && (
                  <div className="text-center py-8">
                    <p className="text-gray-600 mb-4">
                      Du har inga hundar registrerade än.
                    </p>
                    <Link href="/kundportal/dashboard">
                      <Button>
                        <Plus className="h-4 w-4 mr-2" />
                        Lägg till hund
                      </Button>
                    </Link>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Select Pensionat */}
            <Card>
              <CardHeader>
                <CardTitle>Välj pensionat</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {pensionat.map((p) => (
                    <div
                      key={p.id}
                      onClick={() => setSelectedPensionat(p.id)}
                      className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                        selectedPensionat === p.id
                          ? "border-[#2c7a4c] bg-green-50"
                          : "border-gray-200 hover:border-gray-300"
                      }`}
                    >
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <div className="flex items-center mb-2">
                            <h3 className="font-medium text-lg">{p.name}</h3>
                            <Badge
                              className={`ml-2 ${
                                p.priceCategory === "premium"
                                  ? "bg-purple-100 text-purple-800"
                                  : p.priceCategory === "standard"
                                    ? "bg-blue-100 text-blue-800"
                                    : "bg-green-100 text-green-800"
                              }`}
                            >
                              {p.priceCategory === "premium"
                                ? "Premium"
                                : p.priceCategory === "standard"
                                  ? "Standard"
                                  : "Budget"}
                            </Badge>
                          </div>

                          <div className="flex items-center text-sm text-gray-600 mb-2">
                            <MapPin className="h-4 w-4 mr-1" />
                            {p.location}
                            <Star className="h-4 w-4 ml-4 mr-1 text-yellow-500" />
                            {p.rating}
                          </div>

                          <p className="text-sm text-gray-700 mb-3">
                            {p.description}
                          </p>

                          <div className="flex flex-wrap gap-2">
                            {p.features.map((feature, index) => (
                              <Badge
                                key={index}
                                variant="outline"
                                className="text-xs"
                              >
                                {feature}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <div className="flex justify-end">
              <Button
                onClick={() => setStep(2)}
                disabled={!selectedDog || !selectedPensionat}
                className="bg-[#2c7a4c] hover:bg-[#245a3e] text-white"
              >
                Nästa: Välj datum
              </Button>
            </div>
          </div>
        )}

        {/* Step 2: Select Dates */}
        {step === 2 && (
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Välj datum</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <div>
                    <h3 className="font-medium mb-3">Incheckning</h3>
                    <input
                      type="date"
                      value={checkinDate?.toISOString().split("T")[0] || ""}
                      onChange={(e) =>
                        setCheckinDate(
                          e.target.value ? new Date(e.target.value) : undefined
                        )
                      }
                      min={new Date().toISOString().split("T")[0]}
                      className="w-full border rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#2c7a4c]"
                    />
                  </div>

                  <div>
                    <h3 className="font-medium mb-3">Utcheckning</h3>
                    <input
                      type="date"
                      value={checkoutDate?.toISOString().split("T")[0] || ""}
                      onChange={(e) =>
                        setCheckoutDate(
                          e.target.value ? new Date(e.target.value) : undefined
                        )
                      }
                      min={
                        checkinDate?.toISOString().split("T")[0] ||
                        new Date().toISOString().split("T")[0]
                      }
                      className="w-full border rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#2c7a4c]"
                    />
                  </div>
                </div>

                {checkinDate && checkoutDate && (
                  <div className="mt-6 p-4 bg-blue-50 rounded-lg">
                    <h4 className="font-medium mb-2">Vald period</h4>
                    <p className="text-sm text-gray-700">
                      <CalendarIcon className="inline h-4 w-4 mr-1" />
                      {checkinDate.toLocaleDateString("sv-SE")} -{" "}
                      {checkoutDate.toLocaleDateString("sv-SE")}(
                      {Math.ceil(
                        (checkoutDate.getTime() - checkinDate.getTime()) /
                          (1000 * 60 * 60 * 24)
                      )}{" "}
                      nätter)
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Price Preview */}
            {priceCalculation && selectedDogData && selectedPensionatData && (
              <Card>
                <CardHeader>
                  <CardTitle>Prisuppskattning</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span>
                        Grundpris ({selectedPensionatData.priceCategory}):
                      </span>
                      <span>{priceCalculation.basePrice} kr/natt</span>
                    </div>
                    <div className="flex justify-between">
                      <span>
                        Hundstorlek (
                        {getDogSizeCategory(selectedDogData.heightcm)} hund):
                      </span>
                      <span>×{priceCalculation.sizeMultiplier}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Datum (genomsnitt):</span>
                      <span>×{priceCalculation.dateMultiplier.toFixed(1)}</span>
                    </div>
                    <hr />
                    <div className="flex justify-between font-medium">
                      <span>Pris per natt:</span>
                      <span>{priceCalculation.totalPerNight} kr</span>
                    </div>
                    <div className="flex justify-between text-lg font-bold">
                      <span>Totalt ({priceCalculation.nights} nätter):</span>
                      <span>
                        {priceCalculation.totalCost.toLocaleString()} kr
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            <div className="flex justify-between">
              <Button variant="outline" onClick={() => setStep(1)}>
                Tillbaka
              </Button>
              <Button
                onClick={() => setStep(3)}
                disabled={!checkinDate || !checkoutDate}
                className="bg-[#2c7a4c] hover:bg-[#245a3e] text-white"
              >
                Nästa: Bekräfta
              </Button>
            </div>
          </div>
        )}

        {/* Step 3: Confirm Booking */}
        {step === 3 &&
          selectedDogData &&
          selectedPensionatData &&
          priceCalculation &&
          checkinDate &&
          checkoutDate && (
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Bekräfta din bokning</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <h4 className="font-medium mb-2">Hund</h4>
                        <p>
                          {selectedDogData.name} ({selectedDogData.breed})
                        </p>
                        <p className="text-sm text-gray-600">
                          {selectedDogData.heightcm}cm
                        </p>
                      </div>

                      <div>
                        <h4 className="font-medium mb-2">Pensionat</h4>
                        <p>{selectedPensionatData.name}</p>
                        <p className="text-sm text-gray-600">
                          {selectedPensionatData.location}
                        </p>
                      </div>
                    </div>

                    <div>
                      <h4 className="font-medium mb-2">Period</h4>
                      <p>
                        {checkinDate.toLocaleDateString("sv-SE")} -{" "}
                        {checkoutDate.toLocaleDateString("sv-SE")}(
                        {priceCalculation.nights} nätter)
                      </p>
                    </div>

                    <div className="bg-gray-50 p-4 rounded-lg">
                      <h4 className="font-medium mb-2">Prissammanfattning</h4>
                      <div className="flex justify-between text-lg font-bold">
                        <span>Totalkostnad:</span>
                        <span>
                          {priceCalculation.totalCost.toLocaleString()} kr
                        </span>
                      </div>
                    </div>

                    <div className="bg-blue-50 p-4 rounded-lg">
                      <div className="flex items-start">
                        <Info className="h-5 w-5 text-blue-500 mr-2 mt-0.5" />
                        <div className="text-sm text-blue-700">
                          <p className="font-medium mb-1">Viktigt att veta:</p>
                          <ul className="list-disc list-inside space-y-1">
                            <li>Du kommer få en bekräftelse via e-post</li>
                            <li>Betalning sker vid incheckning</li>
                            <li>
                              Avbokning kostnadsfritt fram till 48h före
                              incheckning
                            </li>
                            <li>
                              Ta med hundets vaccinationsbevis och favoritleksak
                            </li>
                          </ul>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <div className="flex justify-between">
                <Button variant="outline" onClick={() => setStep(2)}>
                  Tillbaka
                </Button>
                <Button
                  onClick={handleBooking}
                  className="bg-[#2c7a4c] hover:bg-[#245a3e] text-white"
                >
                  Bekräfta bokning
                </Button>
              </div>
            </div>
          )}
      </div>
    </div>
  );
}

export default function BookingPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <BookingPageContent />
    </Suspense>
  );
}
