"use client";

import { useEffect, useState, useMemo } from "react";
import { createClient } from "@/lib/supabase/client";
import { useAuth } from "@/app/context/AuthContext";
import { useRouter } from "next/navigation";
import {
  Calendar,
  Dog,
  Plus,
  ArrowRight,
  ArrowLeft,
  Building2,
  Search,
  MapPin,
} from "lucide-react";
import { calculatePrice, SelectedExtraService } from "@/lib/pricing";
import type { Database } from "@/types/database";

type DogProfile = Database["public"]["Tables"]["dogs"]["Row"];
type ExtraService = Database["public"]["Tables"]["extra_services"]["Row"];
type Org = Database["public"]["Tables"]["orgs"]["Row"];

export default function NyBokningPage() {
  const supabase = createClient();
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();

  // Step management (1: pensionat, 2: hund, 3: datum & tillval, 4: bekräfta)
  const [step, setStep] = useState(1);

  // Data
  const [pensionat, setPensionat] = useState<Org[]>([]);
  const [dogs, setDogs] = useState<DogProfile[]>([]);
  const [extraServices, setExtraServices] = useState<ExtraService[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingServices, setLoadingServices] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Booking form
  const [selectedPensionatId, setSelectedPensionatId] = useState<string>("");
  const [selectedDogId, setSelectedDogId] = useState<string>("");
  const [checkInDate, setCheckInDate] = useState("");
  const [checkOutDate, setCheckOutDate] = useState("");
  const [selectedServices, setSelectedServices] = useState<
    SelectedExtraService[]
  >([]);
  const [serviceQuantities, setServiceQuantities] = useState<{
    [key: string]: number;
  }>({});

  // Price calculation
  const [priceCalculation, setPriceCalculation] = useState<any>(null);
  const [calculatingPrice, setCalculatingPrice] = useState(false);

  // Villkor och bekräftelse
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [successPensionatName, setSuccessPensionatName] = useState("");

  // Sökfilter för pensionat
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCity, setSelectedCity] = useState<string>("");

  // Extrahera unika städer från adresser
  const cities = useMemo(() => {
    const citySet = new Set<string>();
    pensionat.forEach((p) => {
      if (p.address) {
        // Försök extrahera stad från adress (format: "Gatuadress, Postnr Stad")
        const parts = p.address.split(",");
        if (parts.length >= 2) {
          // Ta sista delen efter postnummer
          const lastPart = parts[parts.length - 1].trim();
          // Ta bort postnummer (5 siffror med mellanslag)
          const city = lastPart.replace(/^\d{3}\s?\d{2}\s*/, "").trim();
          if (city) citySet.add(city);
        }
      }
    });
    return Array.from(citySet).sort();
  }, [pensionat]);

  // Filtrerade pensionat
  const filteredPensionat = useMemo(() => {
    return pensionat.filter((p) => {
      // Sökfilter
      const matchesSearch =
        !searchQuery ||
        p.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.address?.toLowerCase().includes(searchQuery.toLowerCase());

      // Stadsfilter
      const matchesCity =
        !selectedCity ||
        (p.address &&
          p.address.toLowerCase().includes(selectedCity.toLowerCase()));

      return matchesSearch && matchesCity;
    });
  }, [pensionat, searchQuery, selectedCity]);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/kundportal/login?redirect=/kundportal/ny-bokning");
      return;
    }

    if (user) {
      loadInitialData();
    }
  }, [user, authLoading, router]);

  // Ladda pensionat och hundar vid start
  async function loadInitialData() {
    setLoading(true);
    setError(null);

    try {
      const ownerId = user?.id;

      // Ladda alla pensionat (organisationer som erbjuder boarding)
      const { data: pensionatData, error: pensionatError } = await (
        supabase as any
      )
        .from("orgs")
        .select("id, name, address, phone, email")
        .contains("enabled_services", ["boarding"])
        .order("name");

      if (pensionatError)
        throw new Error(`Pensionat: ${pensionatError.message}`);

      // Ladda hundar
      const { data: dogsData, error: dogsError } = await (supabase as any)
        .from("dogs")
        .select("*")
        .eq("owner_id", ownerId)
        .order("name");

      if (dogsError) throw new Error(`Hundar: ${dogsError.message}`);

      setPensionat(pensionatData || []);
      setDogs(dogsData || []);
    } catch (err: any) {
      console.error("[Ny bokning] Fel vid laddning:", err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  // Ladda tillvalstjänster när pensionat väljs
  async function loadServicesForPensionat(orgId: string) {
    setLoadingServices(true);
    setError(null);

    try {
      const { data: servicesData, error: servicesError } = await (
        supabase as any
      )
        .from("extra_services")
        .select("*")
        .eq("org_id", orgId)
        .in("service_type", ["boarding", "both"])
        .order("label");

      if (servicesError) throw new Error(`Tjänster: ${servicesError.message}`);

      setExtraServices(servicesData || []);
    } catch (err: any) {
      console.error("[Ny bokning] Fel vid laddning av tjänster:", err);
      setError(err.message);
    } finally {
      setLoadingServices(false);
    }
  }

  async function calculateBookingPrice() {
    if (!selectedDogId || !checkInDate || !checkOutDate || !selectedPensionatId)
      return;

    setCalculatingPrice(true);

    try {
      const selectedDog = dogs.find((d) => d.id === selectedDogId);
      if (!selectedDog) throw new Error("Hund inte hittad");

      // Hämta org-info från valt pensionat
      const { data: orgData, error: orgError } = await (supabase as any)
        .from("orgs")
        .select("id, vat_included, vat_rate")
        .eq("id", selectedPensionatId)
        .single();

      if (orgError) throw orgError;

      const result = await calculatePrice({
        supabase: supabase as any,
        dog: {
          id: selectedDog.id,
          owner_id: selectedDog.owner_id || "", // ✅ Fixed: Fallback till tom sträng om null
          heightcm: selectedDog.heightcm,
        },
        booking: {
          id: "temp",
          start_date: checkInDate,
          end_date: checkOutDate,
        },
        org: orgData,
        extraServices: selectedServices,
      });

      setPriceCalculation(result);
    } catch (err: any) {
      console.error("[Prisberäkning] Fel:", err);
      setError(`Kunde inte beräkna pris: ${err.message}`);
    } finally {
      setCalculatingPrice(false);
    }
  }

  useEffect(() => {
    if (
      step === 4 &&
      selectedDogId &&
      checkInDate &&
      checkOutDate &&
      selectedPensionatId
    ) {
      calculateBookingPrice();
    }
  }, [
    step,
    selectedDogId,
    checkInDate,
    checkOutDate,
    selectedServices,
    selectedPensionatId,
  ]);

  function handleServiceToggle(serviceId: string) {
    const isSelected = selectedServices.some((s) => s.service_id === serviceId);

    if (isSelected) {
      setSelectedServices(
        selectedServices.filter((s) => s.service_id !== serviceId)
      );
      const newQuantities = { ...serviceQuantities };
      delete newQuantities[serviceId];
      setServiceQuantities(newQuantities);
    } else {
      const service = extraServices.find((s) => s.id === serviceId);
      setSelectedServices([
        ...selectedServices,
        {
          service_id: serviceId,
          quantity: service?.unit === "per gång" ? 1 : undefined,
        },
      ]);
      if (service?.unit === "per gång") {
        setServiceQuantities({ ...serviceQuantities, [serviceId]: 1 });
      }
    }
  }

  function handleQuantityChange(serviceId: string, quantity: number) {
    setServiceQuantities({ ...serviceQuantities, [serviceId]: quantity });
    setSelectedServices(
      selectedServices.map((s) =>
        s.service_id === serviceId ? { ...s, quantity } : s
      )
    );
  }

  async function handleSubmitBooking() {
    try {
      const selectedDog = dogs.find((d) => d.id === selectedDogId);

      if (!selectedDog || !priceCalculation || !selectedPensionatId) {
        throw new Error("Saknar information");
      }

      // Skapa bokning - använd valt pensionatets org_id
      const { data: bookingData, error: bookingError } = await (supabase as any)
        .from("bookings")
        .insert({
          org_id: selectedPensionatId,
          dog_id: selectedDogId,
          owner_id: selectedDog.owner_id,
          room_id: null, // Admin tilldelar rum senare
          start_date: checkInDate,
          end_date: checkOutDate,
          status: "pending" as const,
          total_price: priceCalculation.total_incl_vat,
          discount_amount: 0,
          extra_service_ids: selectedServices.map((s) => s.service_id),
        })
        .select()
        .single();

      if (bookingError) throw bookingError;

      const selectedPensionatName =
        pensionat.find((p) => p.id === selectedPensionatId)?.name ||
        "pensionatet";

      // Visa framgångsmodal istället för alert
      setSuccessPensionatName(selectedPensionatName);
      setShowSuccessModal(true);
    } catch (err: any) {
      console.error("[Bokning] Fel vid skapande:", err);
      alert(`Kunde inte skapa bokning: ${err.message}`);
    }
  }

  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#2c7a4c]"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Ny bokning</h1>
              <p className="text-gray-500 mt-1">
                Boka pensionatvistelse för din hund
              </p>
            </div>
            <Calendar className="h-10 w-10 text-[#2c7a4c]" />
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {error && (
          <div className="mb-6 bg-red-50 border border-red-300 rounded-lg p-4">
            <p className="text-red-800">{error}</p>
          </div>
        )}

        {/* Progress Steps */}
        <div className="mb-8 bg-white rounded-xl shadow-lg border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            {[
              { num: 1, label: "Välj pensionat" },
              { num: 2, label: "Välj hund" },
              { num: 3, label: "Datum & tillval" },
              { num: 4, label: "Bekräfta" },
            ].map((s, idx) => (
              <div key={s.num} className="flex items-center flex-1">
                <div
                  className={`flex items-center justify-center w-10 h-10 rounded-full font-bold ${
                    step >= s.num
                      ? "bg-[#2c7a4c] text-white"
                      : "bg-gray-300 text-gray-600"
                  }`}
                >
                  {s.num}
                </div>
                <span
                  className={`ml-3 font-medium hidden sm:block ${
                    step >= s.num ? "text-[#2c7a4c]" : "text-gray-500"
                  }`}
                >
                  {s.label}
                </span>
                {idx < 3 && (
                  <div
                    className={`flex-1 h-1 mx-4 ${
                      step > s.num ? "bg-[#2c7a4c]" : "bg-gray-300"
                    }`}
                  />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Step 1: Välj pensionat */}
        {step === 1 && (
          <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6">
            <h2 className="text-2xl font-bold text-gray-800 mb-4">
              Välj pensionat
            </h2>
            <p className="text-gray-600 mb-6">
              Välj vilket hundpensionat du vill boka hos
            </p>

            {/* Sök- och filter */}
            <div className="mb-6 flex flex-col sm:flex-row gap-4">
              {/* Sökfält */}
              <div className="relative flex-1">
                <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-500 pointer-events-none" />
                <input
                  type="text"
                  placeholder="Sök pensionat..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-12 pr-4 py-3.5 text-base text-gray-900 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#2c7a4c] focus:border-transparent placeholder:text-gray-500 placeholder:font-medium"
                />
              </div>

              {/* Stadsfilter */}
              {cities.length > 0 && (
                <div className="relative sm:min-w-[240px]">
                  <MapPin className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-500 pointer-events-none" />
                  <select
                    value={selectedCity}
                    onChange={(e) => setSelectedCity(e.target.value)}
                    className="w-full pl-12 pr-12 py-3.5 text-base text-gray-900 font-medium border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#2c7a4c] focus:border-transparent appearance-none bg-white cursor-pointer"
                  >
                    <option value="">Alla orter</option>
                    {cities.map((city) => (
                      <option key={city} value={city}>
                        {city}
                      </option>
                    ))}
                  </select>
                  {/* Dropdown-pil */}
                  <div className="absolute right-4 top-1/2 transform -translate-y-1/2 pointer-events-none">
                    <svg
                      className="h-5 w-5 text-gray-500"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M19 9l-7 7-7-7"
                      />
                    </svg>
                  </div>
                </div>
              )}
            </div>

            {pensionat.length === 0 ? (
              <div className="text-center py-8">
                <Building2 className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600">
                  Inga pensionat tillgängliga just nu
                </p>
              </div>
            ) : filteredPensionat.length === 0 ? (
              <div className="text-center py-8">
                <Search className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600">
                  Inga pensionat matchar din sökning
                </p>
                <button
                  onClick={() => {
                    setSearchQuery("");
                    setSelectedCity("");
                  }}
                  className="mt-4 text-[#2c7a4c] hover:underline"
                >
                  Rensa filter
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                {/* Visa antal träffar */}
                <p className="text-sm text-gray-500 mb-2">
                  Visar {filteredPensionat.length} av {pensionat.length}{" "}
                  pensionat
                </p>
                {filteredPensionat.map((p) => (
                  <button
                    key={p.id}
                    onClick={() => {
                      setSelectedPensionatId(p.id);
                      loadServicesForPensionat(p.id);
                      setStep(2);
                    }}
                    className={`w-full p-4 border-2 rounded-lg text-left hover:shadow-lg transition-all ${
                      selectedPensionatId === p.id
                        ? "border-[#2c7a4c] bg-green-50"
                        : "border-gray-300 bg-white"
                    }`}
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-16 h-16 bg-[#2c7a4c] rounded-full flex items-center justify-center">
                        <Building2 className="w-8 h-8 text-white" />
                      </div>
                      <div>
                        <h3 className="text-xl font-bold text-gray-800">
                          {p.name}
                        </h3>
                        {p.address && (
                          <p className="text-sm text-gray-600 flex items-center gap-1">
                            <MapPin className="h-4 w-4" />
                            {p.address}
                          </p>
                        )}
                        {p.phone && (
                          <p className="text-sm text-gray-500">{p.phone}</p>
                        )}
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Step 2: Välj hund */}
        {step === 2 && (
          <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6">
            <h2 className="text-2xl font-bold text-gray-800 mb-4">
              Välj hund för bokningen
            </h2>
            <p className="text-gray-600 mb-6">
              Bokar hos:{" "}
              <span className="font-semibold">
                {pensionat.find((p) => p.id === selectedPensionatId)?.name}
              </span>
            </p>

            {dogs.length === 0 ? (
              <div className="text-center py-8">
                <Dog className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600 mb-4">
                  Du har inga hundar registrerade ännu
                </p>
                <button
                  onClick={() => router.push("/kundportal/mina-hundar")}
                  className="px-6 py-3 bg-[#2c7a4c] text-white rounded-lg hover:bg-[#235d3a] transition-colors font-medium"
                >
                  Lägg till hund
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                {dogs.map((dog) => (
                  <button
                    key={dog.id}
                    onClick={() => {
                      setSelectedDogId(dog.id);
                      setStep(3);
                    }}
                    className={`w-full p-4 border-2 rounded-lg text-left hover:shadow-lg transition-all ${
                      selectedDogId === dog.id
                        ? "border-[#2c7a4c] bg-green-50"
                        : "border-gray-300 bg-white"
                    }`}
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center">
                        {dog.photo_url ? (
                          <img
                            src={dog.photo_url}
                            alt={dog.name}
                            className="w-full h-full rounded-full object-cover"
                          />
                        ) : (
                          <Dog className="w-8 h-8 text-gray-400" />
                        )}
                      </div>
                      <div>
                        <h3 className="text-xl font-bold text-gray-800">
                          {dog.name}
                        </h3>
                        {dog.breed && (
                          <p className="text-sm text-gray-600">{dog.breed}</p>
                        )}
                        {dog.heightcm && (
                          <p className="text-sm text-gray-600">
                            {dog.heightcm} cm mankhöjd
                          </p>
                        )}
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            )}

            {/* Tillbaka-knapp */}
            <div className="mt-6">
              <button
                onClick={() => setStep(1)}
                className="flex items-center gap-2 px-6 py-3 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 transition-colors font-medium"
              >
                <ArrowLeft className="w-5 h-5" />
                Tillbaka
              </button>
            </div>
          </div>
        )}

        {/* Step 3: Datum & Tillval */}
        {step === 3 && (
          <div className="space-y-6">
            <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6">
              <h2 className="text-2xl font-bold text-gray-800 mb-4">
                Välj datum
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Incheckning
                  </label>
                  <input
                    type="date"
                    value={checkInDate}
                    onChange={(e) => setCheckInDate(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#2c7a4c] focus:border-transparent"
                    min={new Date().toISOString().split("T")[0]}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Utcheckning
                  </label>
                  <input
                    type="date"
                    value={checkOutDate}
                    onChange={(e) => setCheckOutDate(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#2c7a4c] focus:border-transparent"
                    min={checkInDate || new Date().toISOString().split("T")[0]}
                  />
                </div>
              </div>
            </div>

            {/* Tillvalstjänster */}
            <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6">
              <h2 className="text-2xl font-bold text-gray-800 mb-4">
                Tillvalstjänster (valfritt)
              </h2>

              {extraServices.length === 0 ? (
                <p className="text-gray-600">
                  Inga tillvalstjänster tillgängliga
                </p>
              ) : (
                <div className="space-y-4">
                  {extraServices.map((service) => {
                    const isSelected = selectedServices.some(
                      (s) => s.service_id === service.id
                    );
                    const quantity = serviceQuantities[service.id] || 1;

                    return (
                      <div
                        key={service.id}
                        className={`p-4 border-2 rounded-lg ${
                          isSelected
                            ? "border-[#2c7a4c] bg-green-50"
                            : "border-gray-300"
                        }`}
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <label className="flex items-center cursor-pointer">
                              <input
                                type="checkbox"
                                checked={isSelected}
                                onChange={() => handleServiceToggle(service.id)}
                                className="mr-3 w-5 h-5"
                              />
                              <div>
                                <h3 className="text-lg font-semibold text-gray-800">
                                  {service.label}
                                </h3>
                                <p className="text-sm text-gray-600">
                                  {service.price} kr {service.unit}
                                </p>
                              </div>
                            </label>

                            {/* Quantity for "per gång" services */}
                            {isSelected && service.unit === "per gång" && (
                              <div className="mt-3 ml-8">
                                <label className="text-sm text-gray-700 mr-2">
                                  Antal:
                                </label>
                                <input
                                  type="number"
                                  min="1"
                                  value={quantity}
                                  onChange={(e) =>
                                    handleQuantityChange(
                                      service.id,
                                      parseInt(e.target.value) || 1
                                    )
                                  }
                                  className="w-20 px-2 py-1 border border-gray-300 rounded"
                                />
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Navigation */}
            <div className="flex justify-between">
              <button
                onClick={() => setStep(2)}
                className="flex items-center gap-2 px-6 py-3 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 transition-colors font-medium"
              >
                <ArrowLeft className="w-5 h-5" />
                Tillbaka
              </button>
              <button
                onClick={() => setStep(4)}
                disabled={!checkInDate || !checkOutDate}
                className="flex items-center gap-2 px-6 py-3 bg-[#2c7a4c] text-white rounded-lg hover:bg-[#235d3a] transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Nästa
                <ArrowRight className="w-5 h-5" />
              </button>
            </div>
          </div>
        )}

        {/* Step 4: Bekräfta */}
        {step === 4 && (
          <div className="space-y-6">
            <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6">
              <h2 className="text-2xl font-bold text-gray-800 mb-4">
                Bekräfta bokning
              </h2>

              {/* Sammanfattning */}
              <div className="space-y-4 mb-6">
                <div>
                  <h3 className="font-semibold text-gray-700">Pensionat</h3>
                  <p className="text-gray-600">
                    {pensionat.find((p) => p.id === selectedPensionatId)?.name}
                  </p>
                </div>

                <div>
                  <h3 className="font-semibold text-gray-700">Hund</h3>
                  <p className="text-gray-600">
                    {dogs.find((d) => d.id === selectedDogId)?.name}
                  </p>
                </div>

                <div>
                  <h3 className="font-semibold text-gray-700">Datum</h3>
                  <p className="text-gray-600">
                    {checkInDate} till {checkOutDate}
                  </p>
                </div>

                {selectedServices.length > 0 && (
                  <div>
                    <h3 className="font-semibold text-gray-700">Tillval</h3>
                    <ul className="text-gray-600">
                      {selectedServices.map((s) => {
                        const service = extraServices.find(
                          (es) => es.id === s.service_id
                        );
                        return (
                          <li key={s.service_id}>
                            • {service?.label}
                            {s.quantity &&
                              s.quantity > 1 &&
                              ` (${s.quantity}x)`}
                          </li>
                        );
                      })}
                    </ul>
                  </div>
                )}
              </div>

              {/* Prisberäkning */}
              {calculatingPrice ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#2c7a4c] mx-auto"></div>
                  <p className="text-gray-600 mt-4">Beräknar pris...</p>
                </div>
              ) : priceCalculation ? (
                <div className="border-t pt-4">
                  <h3 className="font-semibold text-gray-700 mb-3">
                    Prisuppdelning
                  </h3>
                  <div className="space-y-2">
                    {priceCalculation.breakdown.map(
                      (item: any, idx: number) => (
                        <div
                          key={idx}
                          className="flex justify-between text-gray-600"
                        >
                          <span>{item.label}</span>
                          <span>{item.amount.toFixed(2)} kr</span>
                        </div>
                      )
                    )}
                    <div className="border-t pt-2 mt-2 flex justify-between font-bold text-lg">
                      <span>Totalt (inkl. moms)</span>
                      <span className="text-[#2c7a4c]">
                        {priceCalculation.total_incl_vat.toFixed(2)} kr
                      </span>
                    </div>
                    {/* Disclaimer om preliminärt pris */}
                    <div className="mt-4 p-3 bg-amber-50 border border-amber-200 rounded-lg">
                      <p className="text-sm text-amber-800">
                        <strong>Observera:</strong> Detta är ett beräknat pris
                        baserat på nuvarande prislista. Det slutgiltiga priset
                        kan komma att justeras. Hundpensionatet skickar en
                        bekräftelse med det fastställda priset innan bokningen
                        godkänns.
                      </p>
                    </div>
                  </div>
                </div>
              ) : (
                <p className="text-red-600">Kunde inte beräkna pris</p>
              )}

              {/* Villkorsgodkännande */}
              <div className="mt-6 p-4 bg-gray-50 border border-gray-200 rounded-lg">
                <label className="flex items-start gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={acceptedTerms}
                    onChange={(e) => setAcceptedTerms(e.target.checked)}
                    className="mt-1 h-5 w-5 rounded border-gray-300 text-[#2c7a4c] focus:ring-[#2c7a4c]"
                  />
                  <span className="text-sm text-gray-700">
                    Jag har tagit del av pensionatets regler och villkor, och
                    godkänner dessa. Jag förstår att detta är en
                    bokningsförfrågan och att pensionatet återkommer med
                    bekräftelse och slutgiltigt pris.
                  </span>
                </label>
              </div>
            </div>

            {/* Navigation */}
            <div className="flex justify-between">
              <button
                onClick={() => setStep(3)}
                className="flex items-center gap-2 px-6 py-3 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 transition-colors font-medium"
              >
                <ArrowLeft className="w-5 h-5" />
                Tillbaka
              </button>
              <button
                onClick={handleSubmitBooking}
                disabled={!priceCalculation || !acceptedTerms}
                className="flex items-center gap-2 px-6 py-3 bg-[#2c7a4c] text-white rounded-lg hover:bg-[#235d3a] transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Skicka bokningsförfrågan
                <ArrowRight className="w-5 h-5" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Framgångsmodal */}
      {showSuccessModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 sm:p-8">
            <div className="text-center">
              {/* Grön checkikon */}
              <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
                <svg
                  className="w-8 h-8 text-green-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M5 13l4 4L19 7"
                  />
                </svg>
              </div>

              <h2 className="text-xl font-bold text-gray-900 mb-2">
                Tack för din bokningsförfrågan!
              </h2>

              <p className="text-gray-600 mb-4">
                Din förfrågan har skickats till{" "}
                <strong>{successPensionatName}</strong>.
              </p>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6 text-left">
                <p className="text-sm text-blue-800">
                  <strong>Vad händer nu?</strong>
                </p>
                <ul className="text-sm text-blue-700 mt-2 space-y-1">
                  <li>• Pensionatet granskar din förfrågan</li>
                  <li>• Du får en bekräftelse med slutgiltigt pris</li>
                  <li>• Vid frågor - kontakta pensionatet direkt</li>
                </ul>
              </div>

              <button
                onClick={() => router.push("/kundportal/mina-bokningar")}
                className="w-full px-6 py-3 bg-[#2c7a4c] text-white rounded-lg hover:bg-[#235d3a] transition-colors font-medium"
              >
                Se mina bokningar
              </button>

              <button
                onClick={() => router.push("/kundportal/dashboard")}
                className="w-full mt-3 px-6 py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors font-medium"
              >
                Till startsidan
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
