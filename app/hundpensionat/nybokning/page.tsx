"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import { Calculator, Save, Plus, User, Calendar, Home } from "lucide-react";
import { useAuth } from "@/app/context/AuthContext";
import { DogBreedSelect } from "@/components/DogBreedSelect";

// ============================================================================
// TYPES
// ============================================================================

interface Dog {
  id: string;
  name: string;
  breed?: string | null;
  birth_date?: string | null;
  heightcm?: number | null;
  weightkg?: number | null;
  owner_id: string;
  owners?: {
    id: string;
    full_name: string;
    phone?: string | null;
    email?: string | null;
    address?: string | null;
  };
}

interface Room {
  id: string;
  name: string;
  capacity_m2: number | null;
  max_height_cm?: number | null;
}

interface ExtraService {
  id: string;
  label: string;
  price: number;
  unit?: string;
}

interface PriceCalculation {
  baseDays: number;
  basePrice: number;
  extraServices: { name: string; price: number }[];
  subtotal: number;
  discount: number;
  total: number;
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export default function NewPensionatBooking() {
  const { currentOrgId } = useAuth();

  // Data state
  const [dogs, setDogs] = useState<Dog[]>([]);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [extraServices, setExtraServices] = useState<ExtraService[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Selection state
  const [selectedDog, setSelectedDog] = useState("");
  const [dogSearchQuery, setDogSearchQuery] = useState("");
  const [startDate, setStartDate] = useState("");
  const [startTime, setStartTime] = useState("09:00");
  const [endDate, setEndDate] = useState("");
  const [endTime, setEndTime] = useState("17:00");
  const [selectedRoom, setSelectedRoom] = useState("");
  const [selectedExtras, setSelectedExtras] = useState<string[]>([]);
  const [discountAmount, setDiscountAmount] = useState(0);
  const [priceCalc, setPriceCalc] = useState<PriceCalculation | null>(null);

  // Booking notes (FAS 2 - belongings & bed location)
  const [bookingNotes, setBookingNotes] = useState({
    journalNotes: "",
    belongings: "",
    bedLocation: "",
  });

  // Modal state
  const [showNewDogModal, setShowNewDogModal] = useState(false);
  const [newDogData, setNewDogData] = useState({
    name: "",
    breed: "",
    birth_date: "",
    heightcm: "",
    weightkg: "",
  });

  // ============================================================================
  // DATA LOADING
  // ============================================================================

  useEffect(() => {
    if (currentOrgId) {
      loadInitialData();
    } else {
      setLoading(false);
    }
  }, [currentOrgId]);

  const loadInitialData = async () => {
    if (!currentOrgId) {
      console.error("[ERR-4000] No organization ID available");
      return;
    }

    try {
      setLoading(true);

      const [dogsRes, roomsRes, servicesRes] = await Promise.all([
        supabase
          .from("dogs")
          .select("*, owners(id, full_name, phone, email, address)")
          .eq("org_id", currentOrgId)
          .order("name"),
        supabase
          .from("rooms")
          .select("*")
          .eq("org_id", currentOrgId)
          .order("name"),
        supabase
          .from("extra_services")
          .select("*")
          .eq("org_id", currentOrgId)
          .order("label"),
      ]);

      if (dogsRes.error) throw dogsRes.error;
      if (roomsRes.error) throw roomsRes.error;
      if (servicesRes.error) throw servicesRes.error;

      setDogs(dogsRes.data || []);
      setRooms(roomsRes.data || []);
      setExtraServices(servicesRes.data || []);
    } catch (error) {
      console.error("[ERR-4001] Failed to load data:", error);
      alert("Kunde inte ladda data. Vänligen försök igen.");
    } finally {
      setLoading(false);
    }
  };

  // ============================================================================
  // COMPUTED DATA
  // ============================================================================

  const selectedDogData = useMemo(() => {
    return dogs.find((dog) => dog.id === selectedDog);
  }, [dogs, selectedDog]);

  const filteredDogs = useMemo(() => {
    if (!dogSearchQuery.trim()) return dogs;

    const query = dogSearchQuery.toLowerCase();
    return dogs.filter((dog) => {
      const dogName = dog.name?.toLowerCase() || "";
      const dogBreed = dog.breed?.toLowerCase() || "";
      const ownerName = dog.owners?.full_name?.toLowerCase() || "";

      return (
        dogName.includes(query) ||
        dogBreed.includes(query) ||
        ownerName.includes(query)
      );
    });
  }, [dogs, dogSearchQuery]);

  // ============================================================================
  // PRICE CALCULATION
  // ============================================================================

  const calculatePrice = useCallback(() => {
    if (!startDate || !endDate) {
      alert("Vänligen ange start- och slutdatum först.");
      return;
    }

    const start = new Date(startDate);
    const end = new Date(endDate);
    const diffTime = Math.abs(end.getTime() - start.getTime());
    const diffDays = Math.max(1, Math.ceil(diffTime / (1000 * 60 * 60 * 24)));

    const basePrice = diffDays * 500;
    const extraServicesPrices = selectedExtras.map((extraId) => {
      const service = extraServices.find((s) => s.id === extraId);
      return {
        name: service?.label || "Okänd tjänst",
        price: service?.price || 0,
      };
    });

    const extraTotal = extraServicesPrices.reduce(
      (sum, extra) => sum + extra.price,
      0
    );
    const subtotal = basePrice + extraTotal;
    const total = Math.max(0, subtotal - discountAmount);

    setPriceCalc({
      baseDays: diffDays,
      basePrice,
      extraServices: extraServicesPrices,
      subtotal,
      discount: discountAmount,
      total,
    });
  }, [startDate, endDate, selectedExtras, extraServices, discountAmount]);

  // ============================================================================
  // CREATE NEW DOG (for existing owner)
  // ============================================================================

  const createNewDog = async () => {
    if (!newDogData.name || !selectedDogData?.owner_id || !currentOrgId) {
      alert("Vänligen fyll i hundnamn.");
      return;
    }

    try {
      setSaving(true);

      const dogPayload = {
        name: newDogData.name,
        breed: newDogData.breed || null,
        birth: newDogData.birth_date || null,
        heightcm: newDogData.heightcm ? parseInt(newDogData.heightcm) : null,
        owner_id: selectedDogData.owner_id,
        org_id: currentOrgId,
      };

      const { data, error } = await supabase
        .from("dogs")
        .insert([dogPayload])
        .select("*, owners(id, full_name, phone, email, address)")
        .single();

      if (error) throw error;

      setDogs((prev) => [...prev, data]);
      setSelectedDog(data.id);
      setShowNewDogModal(false);
      setNewDogData({
        name: "",
        breed: "",
        birth_date: "",
        heightcm: "",
        weightkg: "",
      });

      alert("✅ Hund skapad och vald!");
    } catch (error) {
      console.error("[ERR-2001] Failed to create dog:", error);
      alert("Kunde inte skapa hund. Vänligen försök igen.");
    } finally {
      setSaving(false);
    }
  };

  // ============================================================================
  // SUBMIT BOOKING
  // ============================================================================

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedDog || !startDate || !endDate || !priceCalc || !currentOrgId) {
      alert("Vänligen välj hund, ange datum och beräkna priset först.");
      return;
    }

    if (!selectedDogData?.owner_id) {
      alert("[ERR-3001] Kunde inte hitta ägare för bokningen.");
      return;
    }

    try {
      setSaving(true);

      const bookingData = {
        dog_id: selectedDog,
        owner_id: selectedDogData.owner_id,
        room_id: selectedRoom || null,
        start_date: startDate,
        checkin_time: startTime,
        end_date: endDate,
        checkout_time: endTime,
        total_price: priceCalc.total,
        discount_amount: discountAmount,
        notes: bookingNotes.journalNotes || null,
        belongings: bookingNotes.belongings || null,
        bed_location: bookingNotes.bedLocation || null,
        status: "confirmed",
        org_id: currentOrgId,
      };

      const { error: bookingError } = await supabase
        .from("bookings")
        .insert([bookingData]);

      if (bookingError) throw bookingError;

      alert("✅ Bokning sparad framgångsrikt!");

      // Reset form
      setSelectedDog("");
      setStartDate("");
      setEndDate("");
      setSelectedRoom("");
      setSelectedExtras([]);
      setDiscountAmount(0);
      setPriceCalc(null);
      setBookingNotes({
        journalNotes: "",
        belongings: "",
        bedLocation: "",
      });
    } catch (error) {
      console.error("[ERR-3002] Failed to save booking:", error);
      alert("Kunde inte spara bokning. Vänligen försök igen.");
    } finally {
      setSaving(false);
    }
  };

  // ============================================================================
  // RENDER: LOADING
  // ============================================================================

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#2c7a4c] mx-auto mb-4"></div>
          <p className="text-gray-600">Laddar...</p>
        </div>
      </div>
    );
  }

  // ============================================================================
  // RENDER: MAIN UI
  // ============================================================================

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="border-b border-gray-200 bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <h1 className="text-[32px] font-bold text-[#2c7a4c] leading-tight">
            Ny pensionatsbokning
          </h1>
          <p className="mt-1 text-base text-gray-600">
            Skapa en ny bokning för hundpensionat
          </p>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-6 py-6">
        <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
          {/* STEG 1: VÄLJ KUNDTYP (endast om ingen hund är vald) */}
          {!selectedDog && (
            <div className="mb-8">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">
                Steg 1: Välj kundtyp
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Befintlig kund */}
                <button
                  type="button"
                  onClick={() => {
                    // Scrolla ner till hundselektion
                    document
                      .getElementById("dog-selector")
                      ?.scrollIntoView({ behavior: "smooth" });
                  }}
                  className="p-6 border-2 border-[#2c7a4c] bg-green-50 rounded-lg hover:border-[#236139] hover:bg-green-100 transition-all text-left group"
                >
                  <div className="flex items-start gap-4">
                    <div className="p-3 bg-[#2c7a4c] rounded-lg text-white flex-shrink-0">
                      <User className="w-6 h-6" />
                    </div>
                    <div className="flex-1">
                      <h4 className="font-semibold text-gray-900 mb-1 text-lg">
                        Befintlig kund
                      </h4>
                      <p className="text-sm text-gray-600">
                        Kunden finns redan i systemet
                      </p>
                      <p className="text-xs text-green-700 mt-2 font-medium">
                        → Välj hund från listan nedan
                      </p>
                    </div>
                  </div>
                </button>

                {/* Info om nya kunder */}
                <div className="p-6 border-2 border-blue-200 bg-blue-50 rounded-lg">
                  <div className="flex items-start gap-4">
                    <div className="p-3 bg-blue-500 rounded-lg text-white flex-shrink-0">
                      <User className="w-6 h-6" />
                    </div>
                    <div className="flex-1">
                      <h4 className="font-semibold text-gray-900 mb-2 text-lg">
                        💡 Ny kund?
                      </h4>
                      <p className="text-sm text-gray-700 mb-3">
                        Kunder måste först registrera sig via Dogplanners
                        bokningssystem för hundägare innan de kan synas i
                        systemet. Detta säkerställer GDPR-compliance och att all
                        information är korrekt.
                      </p>
                      <p className="text-xs text-blue-700 font-medium">
                        → Hänvisa kunden till ägarregistreringen först
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Hundselektion (befintlig kund) */}
              <div
                id="dog-selector"
                className="mt-6 pt-6 border-t border-gray-200"
              >
                <label className="block text-sm font-semibold text-gray-900 mb-3">
                  Välj hund från befintlig kund:
                </label>

                {/* Sökruta */}
                <div className="mb-3">
                  <input
                    type="text"
                    value={dogSearchQuery}
                    onChange={(e) => setDogSearchQuery(e.target.value)}
                    placeholder="Sök på hundnamn, ras eller ägare..."
                    className="w-full border-2 border-gray-300 px-4 py-2 text-sm rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  />
                  {dogSearchQuery && (
                    <p className="text-xs text-gray-500 mt-1">
                      Visar {filteredDogs.length} av {dogs.length} hundar
                    </p>
                  )}
                </div>

                <select
                  value={selectedDog}
                  onChange={(e) => setSelectedDog(e.target.value)}
                  className="w-full border-2 border-gray-300 px-4 py-3 text-base rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                >
                  <option value="">Välj hund...</option>
                  {filteredDogs.map((dog) => (
                    <option key={dog.id} value={dog.id}>
                      {dog.name} ({dog.breed || "Okänd ras"}) - Ägare:{" "}
                      {dog.owners?.full_name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          )}

          {/* VALD HUND & ÄGARE INFO (readonly) */}
          {selectedDog && selectedDogData && (
            <div className="mb-8">
              <div className="bg-gradient-to-r from-green-50 to-blue-50 border-2 border-green-200 rounded-lg p-6">
                <div className="flex items-start justify-between mb-4">
                  <h2 className="text-xl font-semibold text-gray-900">
                    Vald hund & ägare
                  </h2>
                  <button
                    type="button"
                    onClick={() => setSelectedDog("")}
                    className="text-sm text-gray-600 hover:text-gray-900 underline"
                  >
                    Byt hund
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Hundinfo */}
                  <div>
                    <h3 className="text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                      <span className="text-2xl">🐕</span> Hunduppgifter
                    </h3>
                    <div className="space-y-1 text-sm">
                      <p>
                        <strong>Namn:</strong> {selectedDogData.name}
                      </p>
                      <p>
                        <strong>Ras:</strong>{" "}
                        {selectedDogData.breed || "Ej angiven"}
                      </p>
                      {selectedDogData.heightcm && (
                        <p>
                          <strong>Höjd:</strong> {selectedDogData.heightcm} cm
                        </p>
                      )}
                      {selectedDogData.weightkg && (
                        <p>
                          <strong>Vikt:</strong> {selectedDogData.weightkg} kg
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Ägarinfo */}
                  <div>
                    <h3 className="text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                      <span className="text-2xl">👤</span> Ägaruppgifter
                    </h3>
                    <div className="space-y-1 text-sm">
                      <p>
                        <strong>Namn:</strong>{" "}
                        {selectedDogData.owners?.full_name}
                      </p>
                      {selectedDogData.owners?.phone && (
                        <p>
                          <strong>Telefon:</strong>{" "}
                          {selectedDogData.owners.phone}
                        </p>
                      )}
                      {selectedDogData.owners?.email && (
                        <p>
                          <strong>Email:</strong> {selectedDogData.owners.email}
                        </p>
                      )}
                      {selectedDogData.owners?.address && (
                        <p>
                          <strong>Adress:</strong>{" "}
                          {selectedDogData.owners.address}
                        </p>
                      )}
                    </div>
                  </div>
                </div>

                {/* Lägg till hund-knapp */}
                <div className="mt-6 pt-4 border-t border-green-200">
                  <button
                    type="button"
                    onClick={() => setShowNewDogModal(true)}
                    className="inline-flex items-center gap-2 bg-[#2c7a4c] hover:bg-[#236139] text-white px-4 py-2 text-sm font-medium rounded-md transition-colors"
                  >
                    <Plus className="h-4 w-4" />
                    Lägg till ytterligare hund till denna ägare
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* BOKNINGSFORMULÄR (endast när hund är vald) */}
          {selectedDog && (
            <form onSubmit={handleSubmit} className="space-y-8">
              {/* Datum & Tid */}
              <div>
                <h2 className="text-xl font-semibold text-gray-900 mb-4 pb-2 border-b border-gray-200 flex items-center gap-2">
                  <Calendar className="h-5 w-5 text-green-600" />
                  Steg 2: Datum & Tid
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Startdatum *
                    </label>
                    <input
                      type="date"
                      value={startDate}
                      onChange={(e) => setStartDate(e.target.value)}
                      className="w-full border border-gray-300 px-3 py-2 rounded-md focus:ring-2 focus:ring-green-500 focus:border-transparent"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Starttid
                    </label>
                    <input
                      type="time"
                      value={startTime}
                      onChange={(e) => setStartTime(e.target.value)}
                      className="w-full border border-gray-300 px-3 py-2 rounded-md focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Slutdatum *
                    </label>
                    <input
                      type="date"
                      value={endDate}
                      onChange={(e) => setEndDate(e.target.value)}
                      className="w-full border border-gray-300 px-3 py-2 rounded-md focus:ring-2 focus:ring-green-500 focus:border-transparent"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Sluttid
                    </label>
                    <input
                      type="time"
                      value={endTime}
                      onChange={(e) => setEndTime(e.target.value)}
                      className="w-full border border-gray-300 px-3 py-2 rounded-md focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    />
                  </div>
                </div>
              </div>

              {/* Rum (frivilligt) */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <Home className="h-5 w-5 text-green-600" />
                  Rum (frivilligt)
                </h3>
                <select
                  value={selectedRoom}
                  onChange={(e) => setSelectedRoom(e.target.value)}
                  className="w-full border border-gray-300 px-3 py-2 rounded-md focus:ring-2 focus:ring-green-500 focus:border-transparent"
                >
                  <option value="">Välj rum...</option>
                  {rooms.map((room) => (
                    <option key={room.id} value={room.id}>
                      {room.name} ({room.capacity_m2} m²
                      {room.max_height_cm && `, max ${room.max_height_cm} cm`})
                    </option>
                  ))}
                </select>
              </div>

              {/* Tilläggstjänster */}
              {extraServices.length > 0 && (
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">
                    Tilläggstjänster
                  </h3>
                  <div className="space-y-2">
                    {extraServices.map((service) => (
                      <label
                        key={service.id}
                        className="flex items-center gap-3 p-3 border border-gray-200 rounded-md hover:bg-gray-50 cursor-pointer"
                      >
                        <input
                          type="checkbox"
                          checked={selectedExtras.includes(service.id)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedExtras([
                                ...selectedExtras,
                                service.id,
                              ]);
                            } else {
                              setSelectedExtras(
                                selectedExtras.filter((id) => id !== service.id)
                              );
                            }
                          }}
                          className="w-4 h-4 text-green-600 rounded focus:ring-2 focus:ring-green-500"
                        />
                        <span className="flex-1 text-sm font-medium text-gray-900">
                          {service.label}
                        </span>
                        <span className="text-sm text-gray-600">
                          {service.price} kr{" "}
                          {service.unit && `/ ${service.unit}`}
                        </span>
                      </label>
                    ))}
                  </div>
                </div>
              )}

              {/* Rabatt */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Rabatt (kr)
                </label>
                <input
                  type="number"
                  value={discountAmount}
                  onChange={(e) =>
                    setDiscountAmount(Math.max(0, Number(e.target.value)))
                  }
                  min="0"
                  step="50"
                  className="w-full md:w-64 border border-gray-300 px-3 py-2 rounded-md focus:ring-2 focus:ring-green-500 focus:border-transparent"
                />
              </div>

              {/* Anteckningar (FAS 2) */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  Steg 3: Anteckningar
                </h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Medtagna tillhörigheter
                    </label>
                    <textarea
                      value={bookingNotes.belongings}
                      onChange={(e) =>
                        setBookingNotes({
                          ...bookingNotes,
                          belongings: e.target.value,
                        })
                      }
                      rows={2}
                      placeholder="T.ex. egen säng, leksaker, filt, mat..."
                      className="w-full border border-gray-300 px-3 py-2 rounded-md focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Säng/Rumstilldelning
                    </label>
                    <input
                      type="text"
                      value={bookingNotes.bedLocation}
                      onChange={(e) =>
                        setBookingNotes({
                          ...bookingNotes,
                          bedLocation: e.target.value,
                        })
                      }
                      placeholder="T.ex. Rum 3, Säng A, Bur 2..."
                      className="w-full border border-gray-300 px-3 py-2 rounded-md focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Journalanteckningar
                    </label>
                    <textarea
                      value={bookingNotes.journalNotes}
                      onChange={(e) =>
                        setBookingNotes({
                          ...bookingNotes,
                          journalNotes: e.target.value,
                        })
                      }
                      rows={3}
                      placeholder="Övriga anteckningar för personalen..."
                      className="w-full border border-gray-300 px-3 py-2 rounded-md focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    />
                  </div>
                </div>
              </div>

              {/* Prisberäkning */}
              {priceCalc && (
                <div className="bg-green-50 border-2 border-green-200 rounded-lg p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">
                    Prisberäkning
                  </h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span>
                        Grundpris ({priceCalc.baseDays} dagar × 500 kr):
                      </span>
                      <span className="font-medium">
                        {priceCalc.basePrice} kr
                      </span>
                    </div>
                    {priceCalc.extraServices.map((extra, idx) => (
                      <div key={idx} className="flex justify-between">
                        <span>{extra.name}:</span>
                        <span className="font-medium">{extra.price} kr</span>
                      </div>
                    ))}
                    <div className="flex justify-between pt-2 border-t border-green-300">
                      <span>Delsumma:</span>
                      <span className="font-medium">
                        {priceCalc.subtotal} kr
                      </span>
                    </div>
                    {priceCalc.discount > 0 && (
                      <div className="flex justify-between text-red-600">
                        <span>Rabatt:</span>
                        <span className="font-medium">
                          -{priceCalc.discount} kr
                        </span>
                      </div>
                    )}
                    <div className="flex justify-between pt-2 border-t-2 border-green-400 text-lg font-bold text-green-700">
                      <span>Totalt:</span>
                      <span>{priceCalc.total} kr</span>
                    </div>
                  </div>
                </div>
              )}

              {/* Action buttons */}
              <div className="flex gap-4 pt-6 border-t border-gray-200">
                <button
                  type="button"
                  onClick={calculatePrice}
                  disabled={!startDate || !endDate}
                  className="inline-flex items-center gap-2 px-6 py-3 bg-[#2c7a4c] hover:bg-[#236139] text-white rounded-md font-semibold disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
                >
                  <Calculator className="h-5 w-5" />
                  Beräkna pris
                </button>
                <button
                  type="submit"
                  disabled={saving || !priceCalc}
                  className="inline-flex items-center gap-2 px-6 py-3 bg-[#2c7a4c] hover:bg-[#236139] text-white rounded-md font-semibold disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
                >
                  <Save className="h-5 w-5" />
                  {saving ? "Sparar..." : "Spara bokning"}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>

      {/* MODALS */}

      {/* Lägg till ny hund (för befintlig ägare) */}
      {showNewDogModal && selectedDogData && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <h3 className="text-xl font-bold text-gray-900 mb-4">
              Lägg till hund till {selectedDogData.owners?.full_name}
            </h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Hundnamn *
                </label>
                <input
                  type="text"
                  value={newDogData.name}
                  onChange={(e) =>
                    setNewDogData({ ...newDogData, name: e.target.value })
                  }
                  className="w-full border border-gray-300 px-3 py-2 rounded-md focus:ring-2 focus:ring-green-500"
                  placeholder="T.ex. Bella"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Ras
                </label>
                <DogBreedSelect
                  value={newDogData.breed}
                  onChange={(breed) => setNewDogData({ ...newDogData, breed })}
                  placeholder="Välj hundras..."
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Höjd (cm)
                  </label>
                  <input
                    type="number"
                    value={newDogData.heightcm}
                    onChange={(e) =>
                      setNewDogData({ ...newDogData, heightcm: e.target.value })
                    }
                    className="w-full border border-gray-300 px-3 py-2 rounded-md focus:ring-2 focus:ring-green-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Vikt (kg)
                  </label>
                  <input
                    type="number"
                    value={newDogData.weightkg}
                    onChange={(e) =>
                      setNewDogData({ ...newDogData, weightkg: e.target.value })
                    }
                    className="w-full border border-gray-300 px-3 py-2 rounded-md focus:ring-2 focus:ring-green-500"
                  />
                </div>
              </div>
              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowNewDogModal(false);
                    setNewDogData({
                      name: "",
                      breed: "",
                      birth_date: "",
                      heightcm: "",
                      weightkg: "",
                    });
                  }}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50"
                >
                  Avbryt
                </button>
                <button
                  type="button"
                  onClick={createNewDog}
                  disabled={saving || !newDogData.name}
                  className="flex-1 px-4 py-2 bg-[#2c7a4c] text-white rounded-md hover:bg-[#236139] disabled:bg-gray-400 font-semibold"
                >
                  {saving ? "Sparar..." : "Skapa hund"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
