"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import { Calculator, Save, Plus } from "lucide-react";
import PageContainer from "@/components/PageContainer";

interface Dog {
  id: string;
  name: string;
  breed?: string;
  birth_date?: string;
  heightcm?: number;
  weightkg?: number;
  owner_id: string;
  owners?: { full_name: string };
}

interface Owner {
  id: string;
  full_name: string;
  phone: string;
  email?: string;
  address?: string;
  zipcode?: string;
  city?: string;
}

interface Room {
  id: string;
  name: string;
  capacity_m2: number;
  max_height_cm?: number;
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

export default function NewPensionatBooking() {
  const [dogs, setDogs] = useState<Dog[]>([]);
  const [owners, setOwners] = useState<Owner[]>([]);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [extraServices, setExtraServices] = useState<ExtraService[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [selectedDog, setSelectedDog] = useState("");
  const [customOwnerId, setCustomOwnerId] = useState("");
  const [startDate, setStartDate] = useState("");
  const [startTime, setStartTime] = useState("09:00");
  const [endDate, setEndDate] = useState("");
  const [endTime, setEndTime] = useState("17:00");
  const [selectedRoom, setSelectedRoom] = useState("");
  const [selectedExtras, setSelectedExtras] = useState<string[]>([]);
  const [discountAmount, setDiscountAmount] = useState(0);
  const [priceCalc, setPriceCalc] = useState<PriceCalculation | null>(null);

  const [ownerData, setOwnerData] = useState({
    firstName: "",
    lastName: "",
    phone: "",
    email: "",
    address: "",
    zipcode: "",
    city: "",
    customerNumber: "",
  });

  const [contact2Data, setContact2Data] = useState({
    firstName: "",
    lastName: "",
    phone: "",
    email: "",
    relation: "",
  });

  const [dogData, setDogData] = useState({
    name: "",
    breed: "",
    birthDate: "",
    heightcm: "",
    weightkg: "",
    chipNumber: "",
    regNumber: "",
    sex: "",
    neutered: false,
    personality: "",
    training: "",
    walkingHabits: "",
  });

  const [healthData, setHealthData] = useState({
    insuranceCompany: "",
    insuranceNumber: "",
    vaccinationDHP: "",
    vaccinationPI: "",
    careAndMedicine: "",
  });

  const [bookingNotes, setBookingNotes] = useState({
    journalNotes: "",
    ownerComments: "",
    feedingInstructions: "",
    belongings: "",
    bedLocation: "",
  });

  const [showNewDogModal, setShowNewDogModal] = useState(false);
  const [newDogData, setNewDogData] = useState({
    name: "",
    breed: "",
    birth_date: "",
    heightcm: "",
    weightkg: "",
    owner_id: "",
  });

  useEffect(() => {
    const generateCustomerNumber = () => {
      const prefix = "KU";
      const timestamp = Date.now().toString().slice(-6);
      const random = Math.floor(Math.random() * 100)
        .toString()
        .padStart(2, "0");
      return `${prefix}${timestamp}${random}`;
    };

    setOwnerData((prev) => ({
      ...prev,
      customerNumber: generateCustomerNumber(),
    }));
  }, []);

  useEffect(() => {
    loadInitialData();
  }, []);

  const loadInitialData = async () => {
    try {
      setLoading(true);

      const [dogsRes, ownersRes, roomsRes, servicesRes] = await Promise.all([
        (supabase as any).from("dogs").select("*, owners(full_name)"),
        (supabase as any).from("owners").select("*").order("full_name"),
        (supabase as any).from("rooms").select("*").order("name"),
        (supabase as any).from("extra_services").select("*").order("label"),
      ]);

      if (dogsRes.error) throw dogsRes.error;
      if (ownersRes.error) throw ownersRes.error;
      if (roomsRes.error) throw roomsRes.error;
      if (servicesRes.error) throw servicesRes.error;

      setDogs(dogsRes.data || []);
      setOwners(ownersRes.data || []);
      setRooms(roomsRes.data || []);
      setExtraServices(servicesRes.data || []);
    } catch (error) {
      console.error("[ERR-4001] Failed to load data:", error);
      alert("Kunde inte ladda data. Vänligen försök igen.");
    } finally {
      setLoading(false);
    }
  };

  const selectedDogData = useMemo(() => {
    return dogs.find((dog) => dog.id === selectedDog);
  }, [dogs, selectedDog]);

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

  const createNewDog = async () => {
    if (!newDogData.name || !newDogData.owner_id) {
      alert("Vänligen fyll i hundnamn och välj ägare.");
      return;
    }

    try {
      setSaving(true);

      const dogPayload = {
        name: newDogData.name,
        breed: newDogData.breed || null,
        birth_date: newDogData.birth_date || null,
        heightcm: newDogData.heightcm ? parseInt(newDogData.heightcm) : null,
        weightkg: newDogData.weightkg ? parseFloat(newDogData.weightkg) : null,
        owner_id: newDogData.owner_id,
      };

      const { data, error } = await (supabase as any)
        .from("dogs")
        .insert([dogPayload])
        .select("*, owners(full_name)")
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
        owner_id: "",
      });

      alert("Hund skapad framgångsrikt!");
    } catch (error) {
      console.error("[ERR-2001] Failed to create dog:", error);
      alert("Kunde inte skapa hund. Vänligen försök igen.");
    } finally {
      setSaving(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedDog || !selectedRoom || !startDate || !endDate || !priceCalc) {
      alert(
        "Vänligen fyll i alla obligatoriska fält och beräkna priset först."
      );
      return;
    }

    try {
      setSaving(true);

      const ownerId = customOwnerId || selectedDogData?.owner_id;
      if (!ownerId) {
        alert("[ERR-3001] Kunde inte hitta ägare för bokningen.");
        return;
      }

      // Skapa bokning med korrekt Supabase-struktur (små bokstäver)
      const bookingData = {
        dog_id: selectedDog,
        owner_id: ownerId,
        room_id: selectedRoom,
        start_date: startDate,
        start_time: startTime,
        end_date: endDate,
        end_time: endTime,
        total_price: priceCalc.total,
        discount_amount: discountAmount,
        notes: bookingNotes.journalNotes,
        belongings: bookingNotes.belongings || null,
        bed_location: bookingNotes.bedLocation || null,
        status: "confirmed",
        created_at: new Date().toISOString(),
      };

      const { error: bookingError } = await (supabase as any)
        .from("bookings")
        .insert([bookingData]);

      if (bookingError) throw bookingError;

      // Spara extratjänster om det finns några valda
      if (selectedExtras.length > 0) {
        const extraBookings = selectedExtras.map((extraId) => ({
          booking_id: bookingData.created_at, // Använd timestamp som temp ID
          extra_service_id: extraId,
        }));

        const { error: extrasError } = await (supabase as any)
          .from("booking_extras")
          .insert(extraBookings);

        if (extrasError) {
          console.error(
            "[ERR-3002] Failed to save extra services:",
            extrasError
          );
          // Fortsätt ändå - extratjänster är inte kritiska
        }
      }

      alert("Bokning sparad framgångsrikt!");

      // Återställ formulär
      setSelectedDog("");
      setCustomOwnerId("");
      setStartDate("");
      setEndDate("");
      setSelectedRoom("");
      setSelectedExtras([]);
      setDiscountAmount(0);
      setPriceCalc(null);

      // Återställ alla formulärdata
      setOwnerData({
        firstName: "",
        lastName: "",
        phone: "",
        email: "",
        address: "",
        zipcode: "",
        city: "",
        customerNumber: "",
      });

      setContact2Data({
        firstName: "",
        lastName: "",
        phone: "",
        email: "",
        relation: "",
      });

      setDogData({
        name: "",
        breed: "",
        birthDate: "",
        heightcm: "",
        weightkg: "",
        chipNumber: "",
        regNumber: "",
        sex: "",
        neutered: false,
        personality: "",
        training: "",
        walkingHabits: "",
      });

      setHealthData({
        insuranceCompany: "",
        insuranceNumber: "",
        vaccinationDHP: "",
        vaccinationPI: "",
        careAndMedicine: "",
      });

      setBookingNotes({
        journalNotes: "",
        ownerComments: "",
        feedingInstructions: "",
        belongings: "",
        bedLocation: "",
      });

      // Generera nytt kundnummer för nästa bokning
      const generateCustomerNumber = () => {
        const prefix = "KU";
        const timestamp = Date.now().toString().slice(-6);
        const random = Math.floor(Math.random() * 100)
          .toString()
          .padStart(2, "0");
        return `${prefix}${timestamp}${random}`;
      };

      setOwnerData((prev) => ({
        ...prev,
        customerNumber: generateCustomerNumber(),
      }));
    } catch (error) {
      console.error("[ERR-3001] Failed to save booking:", error);
      alert("Kunde inte spara bokning. Vänligen försök igen.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header med Hunddagis-struktur */}
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
          <form onSubmit={handleSubmit} className="space-y-12">
            <div>
              <h2 className="text-xl font-semibold text-gray-900 mb-6 pb-2 border-b border-gray-200">
                Ägare
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-x-6 gap-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Kundnummer
                  </label>
                  <input
                    type="text"
                    value={ownerData.customerNumber}
                    onChange={(e) =>
                      setOwnerData({
                        ...ownerData,
                        customerNumber: e.target.value,
                      })
                    }
                    className="w-full border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Genereras automatiskt"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Förnamn *
                  </label>
                  <input
                    type="text"
                    value={ownerData.firstName}
                    onChange={(e) =>
                      setOwnerData({ ...ownerData, firstName: e.target.value })
                    }
                    className="w-full border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Efternamn *
                  </label>
                  <input
                    type="text"
                    value={ownerData.lastName}
                    onChange={(e) =>
                      setOwnerData({ ...ownerData, lastName: e.target.value })
                    }
                    className="w-full border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Telefon *
                  </label>
                  <input
                    type="tel"
                    value={ownerData.phone}
                    onChange={(e) =>
                      setOwnerData({ ...ownerData, phone: e.target.value })
                    }
                    className="w-full border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    E-post
                  </label>
                  <input
                    type="email"
                    value={ownerData.email}
                    onChange={(e) =>
                      setOwnerData({ ...ownerData, email: e.target.value })
                    }
                    className="w-full border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Adress
                  </label>
                  <input
                    type="text"
                    value={ownerData.address}
                    onChange={(e) =>
                      setOwnerData({ ...ownerData, address: e.target.value })
                    }
                    className="w-full border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Postnummer
                  </label>
                  <input
                    type="text"
                    value={ownerData.zipcode}
                    onChange={(e) =>
                      setOwnerData({ ...ownerData, zipcode: e.target.value })
                    }
                    className="w-full border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Ort
                  </label>
                  <input
                    type="text"
                    value={ownerData.city}
                    onChange={(e) =>
                      setOwnerData({ ...ownerData, city: e.target.value })
                    }
                    className="w-full border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              </div>
            </div>

            {/* KONTAKT 2 SEKTION */}
            <div>
              <h2 className="text-lg font-semibold text-gray-900 mb-6 pb-2 border-b border-gray-200">
                Kontakt 2 (valfritt)
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-x-6 gap-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Förnamn
                  </label>
                  <input
                    type="text"
                    value={contact2Data.firstName}
                    onChange={(e) =>
                      setContact2Data({
                        ...contact2Data,
                        firstName: e.target.value,
                      })
                    }
                    className="w-full border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Efternamn
                  </label>
                  <input
                    type="text"
                    value={contact2Data.lastName}
                    onChange={(e) =>
                      setContact2Data({
                        ...contact2Data,
                        lastName: e.target.value,
                      })
                    }
                    className="w-full border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Telefon
                  </label>
                  <input
                    type="tel"
                    value={contact2Data.phone}
                    onChange={(e) =>
                      setContact2Data({
                        ...contact2Data,
                        phone: e.target.value,
                      })
                    }
                    className="w-full border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    E-post
                  </label>
                  <input
                    type="email"
                    value={contact2Data.email}
                    onChange={(e) =>
                      setContact2Data({
                        ...contact2Data,
                        email: e.target.value,
                      })
                    }
                    className="w-full border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Relation
                  </label>
                  <input
                    type="text"
                    value={contact2Data.relation}
                    onChange={(e) =>
                      setContact2Data({
                        ...contact2Data,
                        relation: e.target.value,
                      })
                    }
                    className="w-full border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="t.ex. Make/maka, barn"
                  />
                </div>
              </div>
            </div>

            {/* HUND SEKTION */}
            <div>
              <div className="flex items-center justify-between mb-6 pb-2 border-b border-gray-200">
                <h2 className="text-lg font-semibold text-gray-900">Hund</h2>
                <button
                  type="button"
                  onClick={() => setShowNewDogModal(true)}
                  className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-3 py-2 text-sm font-medium border border-blue-600"
                >
                  <Plus className="h-4 w-4" />
                  Ny hund
                </button>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Välj hund *
                </label>
                <select
                  value={selectedDog}
                  onChange={(e) => setSelectedDog(e.target.value)}
                  className="w-full border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                  required
                >
                  <option value="">Välj hund...</option>
                  {dogs.map((dog) => (
                    <option key={dog.id} value={dog.id}>
                      {dog.name} ({dog.breed || "Okänd ras"}) - Ägare:{" "}
                      {dog.owners?.full_name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Annan ägare (valfritt)
                </label>
                <select
                  value={customOwnerId}
                  onChange={(e) => setCustomOwnerId(e.target.value)}
                  className="w-full border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">Använd hundens ägare...</option>
                  {owners.map((owner) => (
                    <option key={owner.id} value={owner.id}>
                      {owner.full_name} ({owner.phone})
                    </option>
                  ))}
                </select>
              </div>

              {/* Detaljerade hunddata */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-x-6 gap-y-4 mb-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Hundnamn
                  </label>
                  <input
                    type="text"
                    value={dogData.name}
                    onChange={(e) =>
                      setDogData({ ...dogData, name: e.target.value })
                    }
                    className="w-full border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Ras
                  </label>
                  <input
                    type="text"
                    value={dogData.breed}
                    onChange={(e) =>
                      setDogData({ ...dogData, breed: e.target.value })
                    }
                    className="w-full border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Födelsedatum
                  </label>
                  <input
                    type="date"
                    value={dogData.birthDate}
                    onChange={(e) =>
                      setDogData({ ...dogData, birthDate: e.target.value })
                    }
                    className="w-full border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Kön
                  </label>
                  <select
                    value={dogData.sex}
                    onChange={(e) =>
                      setDogData({ ...dogData, sex: e.target.value })
                    }
                    className="w-full border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="">Välj kön...</option>
                    <option value="male">Hane</option>
                    <option value="female">Tik</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Höjd (cm)
                  </label>
                  <input
                    type="number"
                    value={dogData.heightcm}
                    onChange={(e) =>
                      setDogData({ ...dogData, heightcm: e.target.value })
                    }
                    className="w-full border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Vikt (kg)
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    value={dogData.weightkg}
                    onChange={(e) =>
                      setDogData({ ...dogData, weightkg: e.target.value })
                    }
                    className="w-full border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Chipnummer
                  </label>
                  <input
                    type="text"
                    value={dogData.chipNumber}
                    onChange={(e) =>
                      setDogData({ ...dogData, chipNumber: e.target.value })
                    }
                    className="w-full border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Reg.nummer
                  </label>
                  <input
                    type="text"
                    value={dogData.regNumber}
                    onChange={(e) =>
                      setDogData({ ...dogData, regNumber: e.target.value })
                    }
                    className="w-full border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              </div>

              <div className="mb-4">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={dogData.neutered}
                    onChange={(e) =>
                      setDogData({ ...dogData, neutered: e.target.checked })
                    }
                    className="mr-2 h-4 w-4 text-blue-600"
                  />
                  <span className="text-sm text-gray-700">
                    Kastrerad/steriliserad
                  </span>
                </label>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-x-6 gap-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Personlighet
                  </label>
                  <textarea
                    rows={3}
                    value={dogData.personality}
                    onChange={(e) =>
                      setDogData({ ...dogData, personality: e.target.value })
                    }
                    className="w-full border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Beskriv hundens personlighet..."
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Utbildning
                  </label>
                  <textarea
                    rows={3}
                    value={dogData.training}
                    onChange={(e) =>
                      setDogData({ ...dogData, training: e.target.value })
                    }
                    className="w-full border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Kommando, utbildning, beteende..."
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Rastningsvanor
                  </label>
                  <textarea
                    rows={3}
                    value={dogData.walkingHabits}
                    onChange={(e) =>
                      setDogData({ ...dogData, walkingHabits: e.target.value })
                    }
                    className="w-full border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Hur ofta, hur långt, särskilda behov..."
                  />
                </div>
              </div>
            </div>

            {/* HÄLSA SEKTION */}
            <div>
              <h2 className="text-lg font-semibold text-gray-900 mb-6 pb-2 border-b border-gray-200">
                Hälsa
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4 mb-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Försäkringsbolag
                  </label>
                  <input
                    type="text"
                    value={healthData.insuranceCompany}
                    onChange={(e) =>
                      setHealthData({
                        ...healthData,
                        insuranceCompany: e.target.value,
                      })
                    }
                    className="w-full border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="t.ex. Agria, If, Folksam"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Försäkringsnummer
                  </label>
                  <input
                    type="text"
                    value={healthData.insuranceNumber}
                    onChange={(e) =>
                      setHealthData({
                        ...healthData,
                        insuranceNumber: e.target.value,
                      })
                    }
                    className="w-full border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Vaccination DHP (giltig 3 år)
                  </label>
                  <input
                    type="date"
                    value={healthData.vaccinationDHP}
                    onChange={(e) =>
                      setHealthData({
                        ...healthData,
                        vaccinationDHP: e.target.value,
                      })
                    }
                    className="w-full border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Vaccination Pi (giltig ett år)
                  </label>
                  <input
                    type="date"
                    value={healthData.vaccinationPI}
                    onChange={(e) =>
                      setHealthData({
                        ...healthData,
                        vaccinationPI: e.target.value,
                      })
                    }
                    className="w-full border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Vård / Medicin
                </label>
                <textarea
                  rows={3}
                  value={healthData.careAndMedicine}
                  onChange={(e) =>
                    setHealthData({
                      ...healthData,
                      careAndMedicine: e.target.value,
                    })
                  }
                  className="w-full border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Beskriv eventuell medicin, allergier, särskilda behov..."
                />
              </div>
            </div>

            {/* BOKNING SEKTION */}
            <div>
              <h2 className="text-lg font-semibold text-gray-900 mb-6 pb-2 border-b border-gray-200">
                Bokning
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-x-6 gap-y-4 mb-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Startdatum *
                  </label>
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="w-full border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Starttid
                  </label>
                  <input
                    type="time"
                    value={startTime}
                    onChange={(e) => setStartTime(e.target.value)}
                    className="w-full border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Slutdatum *
                  </label>
                  <input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="w-full border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Sluttid
                  </label>
                  <input
                    type="time"
                    value={endTime}
                    onChange={(e) => setEndTime(e.target.value)}
                    className="w-full border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              </div>

              {/* Rum och extratjänster */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Rum *
                </label>
                <select
                  value={selectedRoom}
                  onChange={(e) => setSelectedRoom(e.target.value)}
                  className="w-full border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                  required
                >
                  <option value="">Välj rum...</option>
                  {rooms.map((room) => (
                    <option key={room.id} value={room.id}>
                      {room.name} (Kapacitet: {room.capacity_m2})
                    </option>
                  ))}
                </select>
              </div>

              {extraServices.length > 0 && (
                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 mb-3">
                    Extratjänster
                  </label>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {extraServices.map((service) => (
                      <label
                        key={service.id}
                        className="flex items-center p-3 border border-gray-200 hover:bg-gray-50 cursor-pointer"
                      >
                        <input
                          type="checkbox"
                          checked={selectedExtras.includes(service.id)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedExtras((prev) => [
                                ...prev,
                                service.id,
                              ]);
                            } else {
                              setSelectedExtras((prev) =>
                                prev.filter((id) => id !== service.id)
                              );
                            }
                          }}
                          className="mr-3 h-4 w-4 text-blue-600"
                        />
                        <div className="flex-1">
                          <div className="font-medium text-sm">
                            {service.label}
                          </div>
                          <div className="text-xs text-gray-500">
                            {service.price} kr
                            {service.unit && ` / ${service.unit}`}
                          </div>
                        </div>
                      </label>
                    ))}
                  </div>
                </div>
              )}

              {/* Anteckningar */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-x-6 gap-y-4 mb-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Journalanteckningar
                  </label>
                  <textarea
                    rows={4}
                    value={bookingNotes.journalNotes}
                    onChange={(e) =>
                      setBookingNotes({
                        ...bookingNotes,
                        journalNotes: e.target.value,
                      })
                    }
                    className="w-full border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Anteckningar för personalen..."
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Kommentarer ägare
                  </label>
                  <textarea
                    rows={4}
                    value={bookingNotes.ownerComments}
                    onChange={(e) =>
                      setBookingNotes({
                        ...bookingNotes,
                        ownerComments: e.target.value,
                      })
                    }
                    className="w-full border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Särskilda önskemål eller information från ägaren..."
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Foder
                  </label>
                  <textarea
                    rows={4}
                    value={bookingNotes.feedingInstructions}
                    onChange={(e) =>
                      setBookingNotes({
                        ...bookingNotes,
                        feedingInstructions: e.target.value,
                      })
                    }
                    className="w-full border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Foderinstruktioner, allergier, specialkost..."
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Medtagna tillhörigheter
                  </label>
                  <textarea
                    rows={3}
                    value={bookingNotes.belongings}
                    onChange={(e) =>
                      setBookingNotes({
                        ...bookingNotes,
                        belongings: e.target.value,
                      })
                    }
                    className="w-full border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="T.ex. egen säng, leksaker, filt, mat..."
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
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
                    className="w-full border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="T.ex. Rum 3, Säng A, Bur 2..."
                  />
                </div>
              </div>
            </div>

            {/* RABATT SEKTION */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4 pb-2 border-b border-gray-200">
                Rabatt
              </h3>
              <div className="max-w-xs">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Rabatt (kr)
                </label>
                <input
                  type="number"
                  value={discountAmount}
                  onChange={(e) =>
                    setDiscountAmount(
                      Math.max(0, parseFloat(e.target.value) || 0)
                    )
                  }
                  className="w-full border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                  min="0"
                  step="0.01"
                  placeholder="0"
                />
              </div>
            </div>

            {/* PRISBERÄKNING */}
            <div className="border-t pt-8">
              <div className="flex flex-col md:flex-row gap-6 items-start">
                <button
                  type="button"
                  onClick={calculatePrice}
                  className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 text-sm font-medium border border-blue-600"
                >
                  <Calculator className="h-4 w-4" />
                  Beräkna pris
                </button>

                {priceCalc && (
                  <div className="bg-gray-50 border border-gray-200 p-4 flex-1">
                    <h3 className="font-medium text-gray-900 mb-3">
                      Prisberäkning
                    </h3>
                    <div className="space-y-1 text-sm">
                      <div className="flex justify-between">
                        <span>
                          Grundpris ({priceCalc.baseDays} dagar á 500 kr):
                        </span>
                        <span>{priceCalc.basePrice} kr</span>
                      </div>
                      {priceCalc.extraServices.map((extra, i) => (
                        <div key={i} className="flex justify-between">
                          <span>{extra.name}:</span>
                          <span>{extra.price} kr</span>
                        </div>
                      ))}
                      <div className="flex justify-between border-t pt-1">
                        <span>Subtotal:</span>
                        <span>{priceCalc.subtotal} kr</span>
                      </div>
                      {priceCalc.discount > 0 && (
                        <div className="flex justify-between text-red-600">
                          <span>Rabatt:</span>
                          <span>-{priceCalc.discount} kr</span>
                        </div>
                      )}
                      <div className="flex justify-between font-medium text-base border-t pt-1">
                        <span>Totalt:</span>
                        <span>{priceCalc.total} kr</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="flex justify-end pt-8 border-t">
              <button
                type="submit"
                disabled={saving || !priceCalc}
                className="inline-flex items-center gap-2 bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white px-6 py-3 text-sm font-medium border border-green-600"
              >
                {saving ? (
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                ) : (
                  <Save className="h-4 w-4" />
                )}
                {saving ? "Sparar..." : "Spara bokning"}
              </button>
            </div>
          </form>
        </div>

        {showNewDogModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white max-w-md w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-gray-900">
                    Lägg till ny hund
                  </h3>
                  <button
                    onClick={() => setShowNewDogModal(false)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    ✕
                  </button>
                </div>

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
                      className="w-full border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                      required
                      placeholder="T.ex. Bella"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Ägare *
                    </label>
                    <select
                      value={newDogData.owner_id}
                      onChange={(e) =>
                        setNewDogData({
                          ...newDogData,
                          owner_id: e.target.value,
                        })
                      }
                      className="w-full border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                      required
                    >
                      <option value="">Välj ägare...</option>
                      {owners.map((owner) => (
                        <option key={owner.id} value={owner.id}>
                          {owner.full_name} ({owner.phone})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="flex gap-3 pt-4">
                    <button
                      type="button"
                      onClick={() => setShowNewDogModal(false)}
                      className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 hover:bg-gray-50"
                    >
                      Avbryt
                    </button>
                    <button
                      type="button"
                      onClick={createNewDog}
                      disabled={
                        saving || !newDogData.name || !newDogData.owner_id
                      }
                      className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-400 font-semibold text-sm"
                    >
                      {saving ? "Sparar..." : "Skapa hund"}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
