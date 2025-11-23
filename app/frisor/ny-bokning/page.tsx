"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import { useAuth } from "@/app/context/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  ArrowLeft,
  Calendar,
  Clock,
  Scissors,
  DollarSign,
  Search,
  User,
  AlertCircle,
  CheckCircle2,
} from "lucide-react";

// Error codes
const ERROR_CODES = {
  DATABASE_CONNECTION: "[ERR-1001]",
  VALIDATION: "[ERR-4001]",
} as const;

interface Dog {
  id: string;
  name: string;
  breed: string | null;
  heightcm: number | null;
  owners: {
    id: string;
    full_name: string;
    phone: string | null;
    email: string | null;
  } | null;
}

interface GroomingHistory {
  id: string;
  visit_date: string;
  clip_length: string | null;
  shampoo_type: string | null;
  special_treatments: string | null;
  notes: string | null;
  duration_minutes: number | null;
  total_price: number | null;
}

interface ServiceOption {
  value: string;
  label: string;
  basePrice: number;
  duration: number; // minutes
  description: string;
  dog_size?: string | null;
  coat_type?: string | null;
}

// Note: SERVICE_OPTIONS is now loaded from database (grooming_prices table)
// instead of being hardcoded here

// Time slots (9:00 - 17:00, 30 min intervals)
const generateTimeSlots = () => {
  const slots = [];
  for (let hour = 9; hour <= 17; hour++) {
    for (let minute of [0, 30]) {
      if (hour === 17 && minute === 30) break;
      const time = `${hour.toString().padStart(2, "0")}:${minute.toString().padStart(2, "0")}`;
      slots.push(time);
    }
  }
  return slots;
};

const TIME_SLOTS = generateTimeSlots();

export default function NyBokning() {
  const router = useRouter();
  const { currentOrgId, loading: authLoading } = useAuth();
  const supabase = createClientComponentClient();

  const [dogs, setDogs] = useState<Dog[]>([]);
  const [filteredDogs, setFilteredDogs] = useState<Dog[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  // Customer type: 'existing' or 'walkin'
  const [customerType, setCustomerType] = useState<"existing" | "walkin">(
    "existing"
  );

  // External customers (walk-ins from database)
  const [externalCustomers, setExternalCustomers] = useState<any[]>([]);
  const [filteredExternalCustomers, setFilteredExternalCustomers] = useState<
    any[]
  >([]);
  const [externalSearchTerm, setExternalSearchTerm] = useState("");

  // Walk-in customer data
  const [walkinData, setWalkinData] = useState({
    customer_name: "",
    customer_phone: "",
    dog_name: "",
    dog_breed: "",
  });

  // Grooming history for selected dog
  const [groomingHistory, setGroomingHistory] = useState<GroomingHistory[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);

  const [formData, setFormData] = useState({
    dog_id: "",
    appointment_date: "",
    appointment_time: "",
    service_type: "",
    estimated_price: 0,
    notes: "",
    clip_length: "",
    shampoo_type: "",
  });

  const [selectedDog, setSelectedDog] = useState<Dog | null>(null);
  const [selectedService, setSelectedService] = useState<ServiceOption | null>(
    null
  );

  // Service options loaded from database
  const [serviceOptions, setServiceOptions] = useState<ServiceOption[]>([]);
  const [loadingServices, setLoadingServices] = useState(false);

  useEffect(() => {
    if (currentOrgId && !authLoading) {
      loadDogs();
      loadExternalCustomers();
      loadGroomingPrices();
    }
  }, [currentOrgId, authLoading]);

  useEffect(() => {
    if (searchTerm) {
      const filtered = dogs.filter(
        (dog) =>
          dog.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          dog.owners?.full_name
            ?.toLowerCase()
            .includes(searchTerm.toLowerCase()) ||
          dog.breed?.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredDogs(filtered);
    } else {
      setFilteredDogs(dogs);
    }
  }, [searchTerm, dogs]);

  useEffect(() => {
    if (externalSearchTerm) {
      const filtered = externalCustomers.filter(
        (customer) =>
          customer.customer_name
            .toLowerCase()
            .includes(externalSearchTerm.toLowerCase()) ||
          customer.customer_phone.includes(externalSearchTerm) ||
          customer.dog_name
            .toLowerCase()
            .includes(externalSearchTerm.toLowerCase())
      );
      setFilteredExternalCustomers(filtered);
    } else {
      setFilteredExternalCustomers(externalCustomers);
    }
  }, [externalSearchTerm, externalCustomers]);

  const loadDogs = async () => {
    if (!currentOrgId) return;

    try {
      const { data, error: dbError } = await supabase
        .from("dogs")
        .select(
          `
          id,
          name,
          breed,
          heightcm,
          owners!dogs_owner_id_fkey(
            id,
            full_name,
            phone,
            email
          )
        `
        )
        .eq("org_id", currentOrgId)
        .eq("is_active", true)
        .order("name");

      if (dbError) throw dbError;

      const processedDogs = (data || []).map((dog: any) => ({
        ...dog,
        owners: Array.isArray(dog.owners) ? dog.owners[0] : dog.owners,
      }));

      setDogs(processedDogs);
      setFilteredDogs(processedDogs);
    } catch (err: any) {
      console.error(
        `${ERROR_CODES.DATABASE_CONNECTION} Fel vid laddning av hundar:`,
        err
      );
      setError(`Kunde inte ladda hundar: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const loadExternalCustomers = async () => {
    if (!currentOrgId) return;

    try {
      const { data, error: dbError } = await supabase
        .from("external_customers")
        .select("*")
        .eq("org_id", currentOrgId)
        .order("last_visit_date", { ascending: false });

      if (dbError) throw dbError;

      setExternalCustomers(data || []);
      setFilteredExternalCustomers(data || []);
    } catch (err: any) {
      console.error("Fel vid laddning av externa kunder:", err);
      // Don't show error to user, just log it
    }
  };

  const loadGroomingPrices = async () => {
    if (!currentOrgId) return;

    setLoadingServices(true);
    try {
      const { data, error: dbError } = await supabase
        .from("grooming_prices")
        .select("*")
        .eq("org_id", currentOrgId)
        .eq("active", true)
        .order("service_type", { ascending: true });

      if (dbError) {
        console.error("Fel vid laddning av priser:", dbError);
        // Fallback to empty array if no prices exist yet
        setServiceOptions([]);
        return;
      }

      // Transform database prices to ServiceOption format
      const transformed: ServiceOption[] = (data || []).map((price: any) => ({
        value: price.service_type,
        label: price.service_name,
        basePrice: price.price,
        duration: price.duration_minutes,
        description: price.description || "",
        dog_size: price.dog_size,
        coat_type: price.coat_type,
      }));

      setServiceOptions(transformed);
    } catch (err: any) {
      console.error("Fel vid laddning av tjänster:", err);
      setServiceOptions([]);
    } finally {
      setLoadingServices(false);
    }
  };

  const handleDogSelect = async (dog: Dog) => {
    setSelectedDog(dog);
    setFormData((prev) => ({ ...prev, dog_id: dog.id }));
    setSearchTerm("");

    // Load grooming history for this dog
    await loadGroomingHistory(dog.id);
  };

  const loadGroomingHistory = async (dogId: string) => {
    if (!currentOrgId) return;

    setLoadingHistory(true);
    try {
      const { data, error: historyError } = await supabase
        .from("grooming_journal")
        .select("*")
        .eq("org_id", currentOrgId)
        .eq("dog_id", dogId)
        .order("visit_date", { ascending: false })
        .limit(5);

      if (historyError) throw historyError;
      setGroomingHistory(data || []);
    } catch (err: any) {
      console.error("Fel vid laddning av klipphistorik:", err);
    } finally {
      setLoadingHistory(false);
    }
  };

  const copyFromLastVisit = () => {
    if (groomingHistory.length === 0) return;

    const lastVisit = groomingHistory[0];
    setFormData((prev) => ({
      ...prev,
      clip_length: lastVisit.clip_length || "",
      shampoo_type: lastVisit.shampoo_type || "",
      notes: lastVisit.notes || "",
    }));

    // Try to match service type from notes or special treatments
    if (lastVisit.special_treatments && serviceOptions.length > 0) {
      const matchedService = serviceOptions.find((s) =>
        lastVisit.special_treatments?.toLowerCase().includes(s.value)
      );
      if (matchedService) {
        handleServiceSelect(matchedService);
      }
    }
  };

  const handleServiceSelect = (service: ServiceOption) => {
    setSelectedService(service);
    setFormData((prev) => ({
      ...prev,
      service_type: service.value,
      estimated_price: service.basePrice,
    }));
  };

  const validate = (): string | null => {
    if (customerType === "existing") {
      if (!formData.dog_id) return "Du måste välja en hund";
    } else {
      if (!walkinData.customer_name.trim()) return "Kundnamn krävs för walk-in";
      if (!walkinData.customer_phone.trim())
        return "Telefonnummer krävs för walk-in";
      if (!walkinData.dog_name.trim()) return "Hundnamn krävs för walk-in";
      if (!walkinData.dog_breed.trim()) return "Ras krävs för walk-in";
    }

    if (!formData.appointment_date) return "Välj ett datum för bokningen";
    if (!formData.appointment_time) return "Välj en tid för bokningen";
    if (!formData.service_type) return "Välj typ av behandling";

    const bookingDate = new Date(
      `${formData.appointment_date}T${formData.appointment_time}`
    );
    const now = new Date();

    if (bookingDate < now) {
      return "Bokningsdatum måste vara i framtiden";
    }

    return null;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const validationError = validate();
    if (validationError) {
      setError(`${ERROR_CODES.VALIDATION} ${validationError}`);
      return;
    }

    if (!currentOrgId) {
      setError(`${ERROR_CODES.VALIDATION} Organisation saknas`);
      return;
    }

    setSubmitting(true);

    try {
      const bookingData: any = {
        org_id: currentOrgId,
        appointment_date: formData.appointment_date,
        appointment_time: formData.appointment_time,
        service_type: formData.service_type,
        estimated_price: formData.estimated_price,
        notes: formData.notes || null,
        status: "confirmed",
      };

      // Add dog_id for existing customers OR external fields for walk-ins
      if (customerType === "existing") {
        bookingData.dog_id = formData.dog_id;
      } else {
        bookingData.external_customer_name = walkinData.customer_name;
        bookingData.external_customer_phone = walkinData.customer_phone;
        bookingData.external_dog_name = walkinData.dog_name;
        bookingData.external_dog_breed = walkinData.dog_breed;
      }

      const { error: insertError } = await supabase
        .from("grooming_bookings")
        .insert(bookingData);

      if (insertError) throw insertError;

      setSuccess(true);
      setTimeout(() => {
        router.push("/frisor");
      }, 2000);
    } catch (err: any) {
      console.error(
        `${ERROR_CODES.DATABASE_CONNECTION} Fel vid skapande av bokning:`,
        err
      );
      setError(`Kunde inte skapa bokning: ${err.message}`);
    } finally {
      setSubmitting(false);
    }
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-4">
        <div className="max-w-5xl mx-auto">
          <div className="animate-pulse">
            <div className="h-6 bg-gray-200 rounded w-48 mb-4"></div>
            <div className="bg-white rounded-lg p-6">
              <div className="space-y-3">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="h-12 bg-gray-200 rounded"></div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (success) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <Card className="max-w-md w-full">
          <CardContent className="p-6 text-center">
            <div className="mb-4">
              <CheckCircle2 className="h-12 w-12 text-green-600 mx-auto" />
            </div>
            <h2 className="text-xl font-bold text-gray-900 mb-2">
              Bokning skapad!
            </h2>
            <p className="text-gray-600 text-sm mb-4">
              Frisörbokningen för{" "}
              <strong>
                {customerType === "existing"
                  ? selectedDog?.name
                  : walkinData.dog_name}
              </strong>{" "}
              har sparats.
              <br />
              Du omdirigeras till översikten...
            </p>
            <Button
              onClick={() => router.push("/frisor")}
              className="bg-[#2c7a4c] hover:bg-[#245c3a]"
              size="sm"
            >
              Gå till frisör
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header - INGEN HERO enligt Design System V2 */}
      <div className="bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-5xl mx-auto px-6 py-6">
          <Link href="/frisor">
            <Button variant="outline" size="sm" className="mb-3">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Tillbaka till frisör
            </Button>
          </Link>
          <div className="flex items-center gap-3">
            <Scissors className="h-8 w-8 text-[#2c7a4c]" />
            <div>
              <h1 className="text-[32px] font-bold text-[#2c7a4c]">
                Ny Frisörbokning
              </h1>
              <p className="text-base text-gray-600 mt-1">
                Skapa en ny frisörtid för en av dina hundar
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content - kompaktare */}
      <div className="max-w-5xl mx-auto px-6 py-6">
        {/* Error Display */}
        {error && (
          <Card className="mb-4 border-red-200 bg-red-50">
            <CardContent className="p-3">
              <div className="flex items-start gap-2">
                <AlertCircle className="h-4 w-4 text-red-600 mt-0.5 flex-shrink-0" />
                <p className="text-red-700 text-sm">{error}</p>
              </div>
            </CardContent>
          </Card>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Customer Type Selection - Compact */}
          <Card className="border border-gray-200">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-lg text-[#2c7a4c]">
                <User className="h-5 w-5" />
                Välj Kundtyp
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setCustomerType("existing");
                    setSelectedDog(null);
                    setFormData((prev) => ({ ...prev, dog_id: "" }));
                  }}
                  className={`p-3 border-2 rounded-md transition-all ${
                    customerType === "existing"
                      ? "border-[#2c7a4c] bg-[#e6f4ea]"
                      : "border-gray-300 hover:border-[#2c7a4c]/50"
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <div
                      className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                        customerType === "existing"
                          ? "bg-[#2c7a4c] text-white"
                          : "bg-gray-100 text-gray-600"
                      }`}
                    >
                      <User className="h-4 w-4" />
                    </div>
                    <div className="text-left">
                      <p className="font-semibold text-gray-900 text-sm">
                        Befintlig Hund
                      </p>
                      <p className="text-xs text-gray-600">Från registret</p>
                    </div>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setCustomerType("walkin");
                    setSelectedDog(null);
                    setFormData((prev) => ({ ...prev, dog_id: "" }));
                  }}
                  className={`p-3 border-2 rounded-md transition-all ${
                    customerType === "walkin"
                      ? "border-[#2c7a4c] bg-[#e6f4ea]"
                      : "border-gray-300 hover:border-[#2c7a4c]/50"
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <div
                      className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                        customerType === "walkin"
                          ? "bg-[#2c7a4c] text-white"
                          : "bg-gray-100 text-gray-600"
                      }`}
                    >
                      <AlertCircle className="h-4 w-4" />
                    </div>
                    <div className="text-left">
                      <p className="font-semibold text-gray-900 text-sm">
                        Walk-in Kund
                      </p>
                      <p className="text-xs text-gray-600">Ny inringd kund</p>
                    </div>
                  </div>
                </button>
              </div>
            </CardContent>
          </Card>

          {/* Välj Hund (Existing Customer) */}
          {customerType === "existing" && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="h-5 w-5" />
                  1. Välj Hund
                </CardTitle>
              </CardHeader>
              <CardContent>
                {!selectedDog ? (
                  <div className="space-y-4">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                      <Input
                        placeholder="Sök på hundnamn, ägare eller ras..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-10"
                      />
                    </div>

                    <div className="grid gap-2 max-h-96 overflow-y-auto">
                      {filteredDogs.length === 0 ? (
                        <p className="text-center text-gray-500 py-8">
                          {searchTerm
                            ? "Inga hundar matchade din sökning"
                            : "Inga aktiva hundar hittades"}
                        </p>
                      ) : (
                        filteredDogs.map((dog) => (
                          <button
                            key={dog.id}
                            type="button"
                            onClick={() => handleDogSelect(dog)}
                            className="flex items-center gap-4 p-4 bg-white border border-gray-300 rounded-lg hover:border-[#2c7a4c] hover:bg-[#e6f4ea] transition-colors text-left shadow-sm"
                          >
                            <div className="w-12 h-12 rounded-full bg-[#e6f4ea] flex items-center justify-center">
                              <span className="text-[#2c7a4c] font-bold text-lg">
                                {dog.name.charAt(0).toUpperCase()}
                              </span>
                            </div>
                            <div className="flex-1">
                              <p className="font-semibold text-gray-900">
                                {dog.name}
                              </p>
                              <p className="text-sm text-gray-600">
                                {dog.breed || "Blandras"} •{" "}
                                {dog.heightcm
                                  ? `${dog.heightcm} cm`
                                  : "Okänd höjd"}
                              </p>
                              {dog.owners && (
                                <p className="text-sm text-gray-500">
                                  Ägare: {dog.owners.full_name}
                                  {dog.owners.phone && ` • ${dog.owners.phone}`}
                                </p>
                              )}
                            </div>
                          </button>
                        ))
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center gap-4 p-4 bg-[#e6f4ea] border border-[#2c7a4c] rounded-lg">
                    <div className="w-16 h-16 rounded-full bg-[#2c7a4c]/10 flex items-center justify-center">
                      <span className="text-[#2c7a4c] font-bold text-2xl">
                        {selectedDog.name.charAt(0).toUpperCase()}
                      </span>
                    </div>
                    <div className="flex-1">
                      <p className="font-bold text-gray-900 text-lg">
                        {selectedDog.name}
                      </p>
                      <p className="text-sm text-gray-600">
                        {selectedDog.breed || "Blandras"} •{" "}
                        {selectedDog.heightcm
                          ? `${selectedDog.heightcm} cm`
                          : "Okänd höjd"}
                      </p>
                      {selectedDog.owners && (
                        <p className="text-sm text-gray-600">
                          Ägare: {selectedDog.owners.full_name}
                        </p>
                      )}
                    </div>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => {
                        setSelectedDog(null);
                        setFormData((prev) => ({ ...prev, dog_id: "" }));
                        setGroomingHistory([]);
                      }}
                    >
                      Ändra
                    </Button>
                  </div>
                )}

                {/* Grooming History & Copy Feature */}
                {selectedDog && groomingHistory.length > 0 && (
                  <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                    <div className="flex items-center justify-between mb-3">
                      <p className="font-semibold text-gray-900">
                        Tidigare klippningar ({groomingHistory.length})
                      </p>
                      <Button
                        type="button"
                        size="sm"
                        onClick={copyFromLastVisit}
                        className="bg-blue-600 hover:bg-blue-700"
                      >
                        Kopiera från senaste
                      </Button>
                    </div>
                    <div className="bg-white p-3 rounded border border-blue-200">
                      <p className="text-sm text-gray-600 mb-1">
                        <strong>Senaste besök:</strong>{" "}
                        {new Date(
                          groomingHistory[0].visit_date
                        ).toLocaleDateString("sv-SE")}
                      </p>
                      {groomingHistory[0].clip_length && (
                        <p className="text-sm text-gray-600">
                          <strong>Klipplängd:</strong>{" "}
                          {groomingHistory[0].clip_length}
                        </p>
                      )}
                      {groomingHistory[0].shampoo_type && (
                        <p className="text-sm text-gray-600">
                          <strong>Schampo:</strong>{" "}
                          {groomingHistory[0].shampoo_type}
                        </p>
                      )}
                      {groomingHistory[0].duration_minutes && (
                        <p className="text-sm text-gray-600">
                          <strong>Tid:</strong>{" "}
                          {groomingHistory[0].duration_minutes} min
                        </p>
                      )}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Walk-in Customer Form - kompakt */}
          {customerType === "walkin" && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <User className="h-5 w-5" />
                  1. Kunduppgifter
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {/* Search for existing external customers - kompakt */}
                  {externalCustomers.length > 0 && (
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1.5">
                        Sök tidigare kunder
                      </label>
                      <div className="relative mb-3">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                        <Input
                          placeholder="Sök på namn, telefon eller hundnamn..."
                          value={externalSearchTerm}
                          onChange={(e) =>
                            setExternalSearchTerm(e.target.value)
                          }
                          className="pl-10 text-sm h-9"
                        />
                      </div>

                      {externalSearchTerm &&
                        filteredExternalCustomers.length > 0 && (
                          <div className="grid gap-2 max-h-48 overflow-y-auto mb-3">
                            {filteredExternalCustomers.map((customer) => (
                              <button
                                key={customer.id}
                                type="button"
                                onClick={() => {
                                  setWalkinData({
                                    customer_name: customer.customer_name,
                                    customer_phone: customer.customer_phone,
                                    dog_name: customer.dog_name,
                                    dog_breed: customer.dog_breed || "",
                                  });
                                  setExternalSearchTerm("");
                                }}
                                className="flex items-center gap-3 p-3 bg-white border border-gray-300 rounded-lg hover:border-[#2c7a4c] hover:bg-[#e6f4ea] transition-colors text-left"
                              >
                                <div className="w-10 h-10 rounded-full bg-[#e6f4ea] flex items-center justify-center flex-shrink-0">
                                  <span className="text-[#2c7a4c] font-bold text-sm">
                                    {customer.dog_name.charAt(0).toUpperCase()}
                                  </span>
                                </div>
                                <div className="flex-1 min-w-0">
                                  <p className="font-semibold text-gray-900 text-sm truncate">
                                    {customer.dog_name} (
                                    {customer.dog_breed || "Blandras"})
                                  </p>
                                  <p className="text-xs text-gray-600 truncate">
                                    {customer.customer_name} •{" "}
                                    {customer.customer_phone}
                                  </p>
                                  <p className="text-xs text-gray-500">
                                    {customer.total_visits} tidigare besök
                                  </p>
                                </div>
                              </button>
                            ))}
                          </div>
                        )}

                      <div className="flex items-center gap-2 my-3">
                        <div className="flex-1 border-t border-gray-300"></div>
                        <span className="text-xs text-gray-500">
                          eller ange ny kund
                        </span>
                        <div className="flex-1 border-t border-gray-300"></div>
                      </div>
                    </div>
                  )}

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1.5">
                        Kundnamn *
                      </label>
                      <Input
                        placeholder="Anna Andersson"
                        value={walkinData.customer_name}
                        onChange={(e) =>
                          setWalkinData((prev) => ({
                            ...prev,
                            customer_name: e.target.value,
                          }))
                        }
                        required
                        className="text-sm h-9"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1.5">
                        Telefonnummer *
                      </label>
                      <Input
                        placeholder="070-123 45 67"
                        value={walkinData.customer_phone}
                        onChange={(e) =>
                          setWalkinData((prev) => ({
                            ...prev,
                            customer_phone: e.target.value,
                          }))
                        }
                        required
                        className="text-sm h-9"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1.5">
                        Hundnamn *
                      </label>
                      <Input
                        placeholder="Bella"
                        value={walkinData.dog_name}
                        onChange={(e) =>
                          setWalkinData((prev) => ({
                            ...prev,
                            dog_name: e.target.value,
                          }))
                        }
                        required
                        className="text-sm h-9"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1.5">
                        Ras *
                      </label>
                      <Input
                        placeholder="Golden Retriever"
                        value={walkinData.dog_breed}
                        onChange={(e) =>
                          setWalkinData((prev) => ({
                            ...prev,
                            dog_breed: e.target.value,
                          }))
                        }
                        required
                        className="text-sm h-9"
                      />
                    </div>
                  </div>
                  <p className="text-xs text-gray-500 italic">
                    * Inget GDPR-samtycke krävs för walk-in kunder
                  </p>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Välj Datum och Tid - kompakt */}
          {(selectedDog ||
            (customerType === "walkin" &&
              walkinData.customer_name &&
              walkinData.dog_name)) && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Calendar className="h-5 w-5" />
                  2. Välj Datum och Tid
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1.5">
                      Datum
                    </label>
                    <Input
                      type="date"
                      value={formData.appointment_date}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          appointment_date: e.target.value,
                        }))
                      }
                      min={new Date().toISOString().split("T")[0]}
                      required
                      className="text-sm h-9"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1.5">
                      Tid
                    </label>
                    <select
                      value={formData.appointment_time}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          appointment_time: e.target.value,
                        }))
                      }
                      className="w-full px-3 py-2 text-sm h-9 border border-gray-300 rounded-md focus:ring-2 focus:ring-[#2c7a4c] focus:border-transparent"
                      required
                    >
                      <option value="">Välj tid...</option>
                      {TIME_SLOTS.map((time) => (
                        <option key={time} value={time}>
                          {time}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Välj Behandling - kompakt */}
          {(selectedDog ||
            (customerType === "walkin" &&
              walkinData.customer_name &&
              walkinData.dog_name)) &&
            formData.appointment_date &&
            formData.appointment_time && (
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <Scissors className="h-5 w-5" />
                    3. Välj Behandling
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {loadingServices ? (
                    <div className="text-center py-8">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#2c7a4c] mx-auto mb-2"></div>
                      <p className="text-sm text-gray-600">
                        Laddar tjänster...
                      </p>
                    </div>
                  ) : serviceOptions.length === 0 ? (
                    <div className="text-center py-8">
                      <AlertCircle className="h-10 w-10 text-orange-600 mx-auto mb-3" />
                      <p className="text-gray-900 font-medium mb-1">
                        Inga priser inlagda än
                      </p>
                      <p className="text-sm text-gray-600">
                        Gå till Admin → Hundfrisör → Priser för att lägga till
                        tjänster
                      </p>
                    </div>
                  ) : (
                    <div className="grid gap-2">
                      {serviceOptions.map((service) => (
                        <button
                          key={
                            service.value +
                            (service.dog_size || "") +
                            (service.coat_type || "")
                          }
                          type="button"
                          onClick={() => handleServiceSelect(service)}
                          className={`flex items-start gap-3 p-3 border-2 rounded-md transition-all text-left ${
                            selectedService?.value === service.value &&
                            selectedService?.dog_size === service.dog_size &&
                            selectedService?.coat_type === service.coat_type
                              ? "border-[#2c7a4c] bg-white shadow-sm"
                              : "border-gray-200 hover:border-[#2c7a4c]/50 hover:bg-gray-50"
                          }`}
                        >
                          <div
                            className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                              selectedService?.value === service.value &&
                              selectedService?.dog_size === service.dog_size &&
                              selectedService?.coat_type === service.coat_type
                                ? "bg-[#2c7a4c] text-white"
                                : "bg-gray-100 text-gray-600"
                            }`}
                          >
                            <Scissors className="h-4 w-4" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between mb-0.5">
                              <p className="font-semibold text-gray-900 text-sm">
                                {service.label}
                                {service.dog_size && (
                                  <span className="text-xs text-gray-500 ml-2">
                                    ({service.dog_size})
                                  </span>
                                )}
                              </p>
                              <Badge
                                variant="outline"
                                className="bg-white text-[#2c7a4c] border-[#2c7a4c] text-xs font-semibold"
                              >
                                {service.basePrice > 0
                                  ? `${service.basePrice} kr`
                                  : "Anpassat"}
                              </Badge>
                            </div>
                            <p className="text-xs text-gray-600 mb-0.5">
                              {service.description}
                            </p>
                            <p className="text-xs text-gray-500 flex items-center">
                              <Clock className="h-3 w-3 mr-1" />
                              {service.duration} min
                            </p>
                          </div>
                        </button>
                      ))}
                    </div>
                  )}

                  {selectedService && selectedService.value === "custom" && (
                    <div className="mt-3">
                      <label className="block text-xs font-medium text-gray-700 mb-1.5">
                        Ange pris
                      </label>
                      <div className="relative">
                        <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                        <Input
                          type="number"
                          min="0"
                          step="50"
                          value={formData.estimated_price}
                          onChange={(e) =>
                            setFormData((prev) => ({
                              ...prev,
                              estimated_price: Number(e.target.value),
                            }))
                          }
                          className="pl-10 text-sm h-9"
                          placeholder="0"
                        />
                      </div>
                    </div>
                  )}

                  {/* Additional Treatment Details - kompakt */}
                  {selectedService && (
                    <div className="mt-3 p-3 bg-gray-50 rounded-lg space-y-3">
                      <p className="font-medium text-gray-900 text-sm mb-2">
                        Behandlingsdetaljer (Rekommenderas)
                      </p>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <div>
                          <label className="block text-xs font-medium text-gray-700 mb-1.5">
                            Klipplängd
                          </label>
                          <Input
                            placeholder="t.ex. 5mm, kort, lång..."
                            value={formData.clip_length}
                            onChange={(e) =>
                              setFormData((prev) => ({
                                ...prev,
                                clip_length: e.target.value,
                              }))
                            }
                            className="text-sm h-9"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-gray-700 mb-1.5">
                            Schampo
                          </label>
                          <Input
                            placeholder="t.ex. Volym, Allergivänlig..."
                            value={formData.shampoo_type}
                            onChange={(e) =>
                              setFormData((prev) => ({
                                ...prev,
                                shampoo_type: e.target.value,
                              }))
                            }
                            className="text-sm h-9"
                          />
                        </div>
                      </div>
                      <p className="text-xs text-gray-500 italic">
                        Dessa uppgifter sparas i journalen när bokningen är klar
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

          {/* Anteckningar - kompakt */}
          {selectedService && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg">
                  4. Anteckningar (Valfritt)
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Textarea
                  placeholder="Särskilda önskemål, allergier, beteendenoteringar..."
                  value={formData.notes}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, notes: e.target.value }))
                  }
                  rows={3}
                  className="resize-none text-sm"
                />
              </CardContent>
            </Card>
          )}

          {/* Submit - kompakt */}
          {(selectedDog || customerType === "walkin") && (
            <div className="flex gap-3 pb-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => router.push("/frisor")}
                className="flex-1"
                size="sm"
              >
                Avbryt
              </Button>
              <Button
                type="submit"
                disabled={submitting}
                className="flex-1 bg-[#2c7a4c] hover:bg-[#245c3a]"
                size="sm"
              >
                {submitting ? "Sparar..." : "Skapa Bokning"}
              </Button>
            </div>
          )}
        </form>
      </div>
    </div>
  );
}
