"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useAuth } from "@/app/context/AuthContext";
import { useRouter } from "next/navigation";
import { Calendar, Dog, Plus, ArrowRight, ArrowLeft } from "lucide-react";
import { calculatePrice, SelectedExtraService } from "@/lib/pricing";
import type { Database } from "@/types/database";

type DogProfile = Database["public"]["Tables"]["dogs"]["Row"];
type ExtraService = Database["public"]["Tables"]["extra_services"]["Row"];

export default function NyBokningPage() {
  const supabase = createClient();
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();

  // Step management
  const [step, setStep] = useState(1);

  // Data
  const [dogs, setDogs] = useState<DogProfile[]>([]);
  const [extraServices, setExtraServices] = useState<ExtraService[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Booking form
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

  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/kundportal/login?redirect=/kundportal/ny-bokning");
      return;
    }

    if (user) {
      loadData();
    }
  }, [user, authLoading, router]);

  async function loadData() {
    setLoading(true);
    setError(null);

    try {
      const ownerId = user?.id;
      const orgId = user?.user_metadata?.org_id || user?.id;

      // Ladda hundar
      const { data: dogsData, error: dogsError } = await (supabase as any)
        .from("dogs")
        .select("*")
        .eq("owner_id", ownerId)
        .order("name");

      if (dogsError) throw new Error(`Hundar: ${dogsError.message}`);

      // Ladda tillvalstjänster
      const { data: servicesData, error: servicesError } = await (
        supabase as any
      )
        .from("extra_services")
        .select("*")
        .eq("org_id", orgId)
        .in("service_type", ["boarding", "both"])
        .order("label");

      if (servicesError) throw new Error(`Tjänster: ${servicesError.message}`);

      setDogs(dogsData || []);
      setExtraServices(servicesData || []);
    } catch (err: any) {
      console.error("[Ny bokning] Fel vid laddning:", err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function calculateBookingPrice() {
    if (!selectedDogId || !checkInDate || !checkOutDate) return;

    setCalculatingPrice(true);

    try {
      const selectedDog = dogs.find((d) => d.id === selectedDogId);
      if (!selectedDog) throw new Error("Hund inte hittad");

      const orgId = user?.user_metadata?.org_id || user?.id;

      // Hämta org-info
      const { data: orgData, error: orgError } = await (supabase as any)
        .from("orgs")
        .select("id, vat_included, vat_rate")
        .eq("id", orgId)
        .single();

      if (orgError) throw orgError;

      const result = await calculatePrice({
        supabase: supabase as any,
        dog: {
          id: selectedDog.id,
          owner_id: selectedDog.owner_id,
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
    if (step === 3 && selectedDogId && checkInDate && checkOutDate) {
      calculateBookingPrice();
    }
  }, [step, selectedDogId, checkInDate, checkOutDate, selectedServices]);

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
      const orgId = user?.user_metadata?.org_id || user?.id;
      const selectedDog = dogs.find((d) => d.id === selectedDogId);

      if (!selectedDog || !priceCalculation) {
        throw new Error("Saknar information");
      }

      // Skapa bokning
      const { data: bookingData, error: bookingError } = await (supabase as any)
        .from("bookings")
        .insert({
          org_id: orgId,
          dog_id: selectedDogId,
          owner_id: selectedDog.owner_id,
          room_id: null, // Admin tilldelar rum senare
          start_date: checkInDate,
          end_date: checkOutDate,
          status: "pending",
          total_price: priceCalculation.total_incl_vat,
          discount_amount: 0,
          extra_service_ids: selectedServices.map((s) => s.service_id),
        })
        .select()
        .single();

      if (bookingError) throw bookingError;

      alert("✅ Bokning skickad! Väntar på godkännande från pensionatet.");
      router.push("/kundportal/dashboard");
    } catch (err: any) {
      console.error("[Bokning] Fel vid skapande:", err);
      alert(`❌ Kunde inte skapa bokning: ${err.message}`);
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
      {/* Hero Section */}
      <div
        className="relative bg-cover bg-center pt-20 pb-28"
        style={{
          backgroundImage: `linear-gradient(rgba(44, 122, 76, 0.88), rgba(44, 122, 76, 0.88)), url('/Hero.jpeg')`,
        }}
      >
        <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-4xl md:text-5xl font-extrabold text-white mb-4">
            📅 Ny bokning
          </h1>
          <p className="text-xl text-white/90">
            Boka pensionatvistelse för din hund
          </p>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 -mt-16">
        {error && (
          <div className="mb-6 bg-red-50 border border-red-300 rounded-lg p-4">
            <p className="text-red-800">{error}</p>
          </div>
        )}

        {/* Progress Steps */}
        <div className="mb-8 bg-white rounded-xl shadow-lg border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            {[
              { num: 1, label: "Välj hund" },
              { num: 2, label: "Datum & tillval" },
              { num: 3, label: "Bekräfta" },
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
                  className={`ml-3 font-medium ${
                    step >= s.num ? "text-[#2c7a4c]" : "text-gray-500"
                  }`}
                >
                  {s.label}
                </span>
                {idx < 2 && (
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

        {/* Step 1: Välj hund */}
        {step === 1 && (
          <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6">
            <h2 className="text-2xl font-bold text-gray-800 mb-4">
              Välj hund för bokningen
            </h2>

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
                      setStep(2);
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
          </div>
        )}

        {/* Step 2: Datum & Tillval */}
        {step === 2 && (
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
                onClick={() => setStep(1)}
                className="flex items-center gap-2 px-6 py-3 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 transition-colors font-medium"
              >
                <ArrowLeft className="w-5 h-5" />
                Tillbaka
              </button>
              <button
                onClick={() => setStep(3)}
                disabled={!checkInDate || !checkOutDate}
                className="flex items-center gap-2 px-6 py-3 bg-[#2c7a4c] text-white rounded-lg hover:bg-[#235d3a] transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Nästa
                <ArrowRight className="w-5 h-5" />
              </button>
            </div>
          </div>
        )}

        {/* Step 3: Bekräfta */}
        {step === 3 && (
          <div className="space-y-6">
            <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6">
              <h2 className="text-2xl font-bold text-gray-800 mb-4">
                Bekräfta bokning
              </h2>

              {/* Sammanfattning */}
              <div className="space-y-4 mb-6">
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
                  </div>
                </div>
              ) : (
                <p className="text-red-600">Kunde inte beräkna pris</p>
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
                onClick={handleSubmitBooking}
                disabled={!priceCalculation}
                className="flex items-center gap-2 px-6 py-3 bg-[#2c7a4c] text-white rounded-lg hover:bg-[#235d3a] transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Skicka bokning
                <ArrowRight className="w-5 h-5" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
