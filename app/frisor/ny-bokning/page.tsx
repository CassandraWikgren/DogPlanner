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

interface ServiceOption {
  value: string;
  label: string;
  basePrice: number;
  duration: number; // minutes
  description: string;
}

const SERVICE_OPTIONS: ServiceOption[] = [
  {
    value: "bath",
    label: "Badning",
    basePrice: 300,
    duration: 60,
    description: "Grundläggande badning med hundschampo",
  },
  {
    value: "bath_trim",
    label: "Badning + Trimning",
    basePrice: 500,
    duration: 90,
    description: "Bad och trimning av päls",
  },
  {
    value: "full_groom",
    label: "Fullständig Klippning",
    basePrice: 700,
    duration: 120,
    description: "Komplett pälsvård med klippning",
  },
  {
    value: "nail_trim",
    label: "Klotrimning",
    basePrice: 150,
    duration: 30,
    description: "Trimning av klor",
  },
  {
    value: "ear_cleaning",
    label: "Öronrengöring",
    basePrice: 100,
    duration: 20,
    description: "Professionell öronrengöring",
  },
  {
    value: "teeth_cleaning",
    label: "Tandrengöring",
    basePrice: 400,
    duration: 45,
    description: "Tandvård och rengöring",
  },
  {
    value: "custom",
    label: "Anpassad Behandling",
    basePrice: 0,
    duration: 60,
    description: "Skräddarsydd behandling",
  },
];

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

  const [formData, setFormData] = useState({
    dog_id: "",
    appointment_date: "",
    appointment_time: "",
    service_type: "",
    estimated_price: 0,
    notes: "",
  });

  const [selectedDog, setSelectedDog] = useState<Dog | null>(null);
  const [selectedService, setSelectedService] = useState<ServiceOption | null>(
    null
  );

  useEffect(() => {
    if (currentOrgId && !authLoading) {
      loadDogs();
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

  const handleDogSelect = (dog: Dog) => {
    setSelectedDog(dog);
    setFormData((prev) => ({ ...prev, dog_id: dog.id }));
    setSearchTerm("");
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
    if (!formData.dog_id) return "Du måste välja en hund";
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
      const { error: insertError } = await supabase
        .from("grooming_bookings")
        .insert({
          org_id: currentOrgId,
          dog_id: formData.dog_id,
          appointment_date: formData.appointment_date,
          appointment_time: formData.appointment_time,
          service_type: formData.service_type,
          estimated_price: formData.estimated_price,
          notes: formData.notes || null,
          status: "confirmed",
        });

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
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-4xl mx-auto">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-64 mb-6"></div>
            <div className="bg-white rounded-lg p-8">
              <div className="space-y-4">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="h-16 bg-gray-200 rounded"></div>
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
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
        <Card className="max-w-md w-full">
          <CardContent className="p-8 text-center">
            <div className="mb-6">
              <CheckCircle2 className="h-16 w-16 text-green-600 mx-auto" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-3">
              Bokning skapad!
            </h2>
            <p className="text-gray-600 mb-6">
              Frisörbokningen för <strong>{selectedDog?.name}</strong> har
              sparats.
              <br />
              Du omdirigeras till översikten...
            </p>
            <Button
              onClick={() => router.push("/frisor")}
              className="bg-orange-600 hover:bg-orange-700"
            >
              Gå till frisör
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <Link href="/frisor">
            <Button variant="outline" className="mb-4">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Tillbaka till frisör
            </Button>
          </Link>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
            <Scissors className="h-8 w-8 text-orange-600" />
            Ny Frisörbokning
          </h1>
          <p className="text-gray-600 mt-2">
            Skapa en ny frisörtid för en av dina hundar.
          </p>
        </div>

        {/* Error Display */}
        {error && (
          <Card className="mb-6 border-red-200 bg-red-50">
            <CardContent className="p-4">
              <div className="flex items-start gap-3">
                <AlertCircle className="h-5 w-5 text-red-600 mt-0.5" />
                <div>
                  <p className="text-red-800 font-medium">Fel</p>
                  <p className="text-red-700 text-sm">{error}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Välj Hund */}
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
                          className="flex items-center gap-4 p-4 border rounded-lg hover:border-orange-500 hover:bg-orange-50 transition-colors text-left"
                        >
                          <div className="w-12 h-12 rounded-full bg-orange-100 flex items-center justify-center">
                            <span className="text-orange-600 font-bold text-lg">
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
                <div className="flex items-center gap-4 p-4 bg-orange-50 border border-orange-200 rounded-lg">
                  <div className="w-16 h-16 rounded-full bg-orange-100 flex items-center justify-center">
                    <span className="text-orange-600 font-bold text-2xl">
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
                    }}
                  >
                    Ändra
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Välj Datum och Tid */}
          {selectedDog && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="h-5 w-5" />
                  2. Välj Datum och Tid
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
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
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
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
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-orange-500 focus:border-transparent"
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

          {/* Välj Behandling */}
          {selectedDog &&
            formData.appointment_date &&
            formData.appointment_time && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Scissors className="h-5 w-5" />
                    3. Välj Behandling
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-3">
                    {SERVICE_OPTIONS.map((service) => (
                      <button
                        key={service.value}
                        type="button"
                        onClick={() => handleServiceSelect(service)}
                        className={`flex items-start gap-4 p-4 border rounded-lg transition-all text-left ${
                          selectedService?.value === service.value
                            ? "border-orange-500 bg-orange-50 shadow-sm"
                            : "hover:border-orange-300 hover:bg-orange-50/50"
                        }`}
                      >
                        <div
                          className={`w-10 h-10 rounded-full flex items-center justify-center ${
                            selectedService?.value === service.value
                              ? "bg-orange-500 text-white"
                              : "bg-gray-100 text-gray-600"
                          }`}
                        >
                          <Scissors className="h-5 w-5" />
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center justify-between mb-1">
                            <p className="font-semibold text-gray-900">
                              {service.label}
                            </p>
                            <Badge
                              variant="outline"
                              className="bg-emerald-50 text-emerald-700 border-emerald-200"
                            >
                              {service.basePrice > 0
                                ? `${service.basePrice} kr`
                                : "Anpassat pris"}
                            </Badge>
                          </div>
                          <p className="text-sm text-gray-600 mb-1">
                            {service.description}
                          </p>
                          <p className="text-xs text-gray-500">
                            <Clock className="h-3 w-3 inline mr-1" />
                            {service.duration} minuter
                          </p>
                        </div>
                      </button>
                    ))}
                  </div>

                  {selectedService && selectedService.value === "custom" && (
                    <div className="mt-4">
                      <label className="block text-sm font-medium text-gray-700 mb-2">
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
                          className="pl-10"
                          placeholder="0"
                        />
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

          {/* Anteckningar */}
          {selectedService && (
            <Card>
              <CardHeader>
                <CardTitle>4. Anteckningar (Valfritt)</CardTitle>
              </CardHeader>
              <CardContent>
                <Textarea
                  placeholder="Särskilda önskemål, allergier, beteendenoteringar..."
                  value={formData.notes}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, notes: e.target.value }))
                  }
                  rows={4}
                  className="resize-none"
                />
              </CardContent>
            </Card>
          )}

          {/* Submit */}
          {selectedService && (
            <div className="flex gap-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => router.push("/frisor")}
                className="flex-1"
              >
                Avbryt
              </Button>
              <Button
                type="submit"
                disabled={submitting}
                className="flex-1 bg-orange-600 hover:bg-orange-700"
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
