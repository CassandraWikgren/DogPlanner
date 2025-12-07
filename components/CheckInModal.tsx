"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import {
  X,
  Save,
  Dog,
  Calendar,
  Heart,
  Syringe,
  Backpack,
  FileText,
  AlertTriangle,
  Printer,
} from "lucide-react";
import DogRoomCard from "./DogRoomCard";
import type { Database } from "@/types/database";

type Booking = Database["public"]["Tables"]["bookings"]["Row"] & {
  dogs?:
    | (Database["public"]["Tables"]["dogs"]["Row"] & {
        owners?: Database["public"]["Tables"]["owners"]["Row"] | null;
      })
    | null;
  rooms?: Database["public"]["Tables"]["rooms"]["Row"] | null;
  belongings?: string | null;
  bed_location?: string | null;
};

type DogHealth = {
  allergies: string;
  medications: string;
  special_needs: string;
  behavior_notes: string;
  is_castrated: boolean;
  vaccdhp: string;
  vaccpi: string;
};

interface CheckInModalProps {
  booking: Booking;
  onClose: () => void;
  onCheckInComplete: (bookingId: string) => void;
}

export default function CheckInModal({
  booking,
  onClose,
  onCheckInComplete,
}: CheckInModalProps) {
  const supabase = createClient();
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showRoomCard, setShowRoomCard] = useState(false);
  const [activeTab, setActiveTab] = useState<
    "info" | "health" | "belongings" | "journal"
  >("info");

  // Booking dates (editable)
  const [startDate, setStartDate] = useState(booking.start_date);
  const [endDate, setEndDate] = useState(booking.end_date);
  const [dateWarning, setDateWarning] = useState<string | null>(null);

  // Dog health info
  const [dogHealth, setDogHealth] = useState<DogHealth>({
    allergies: booking.dogs?.allergies || "",
    medications: booking.dogs?.medications || "",
    special_needs: booking.dogs?.special_needs || "",
    behavior_notes: booking.dogs?.behavior_notes || "",
    is_castrated: booking.dogs?.is_castrated || false,
    vaccdhp: booking.dogs?.vaccdhp || "",
    vaccpi: booking.dogs?.vaccpi || "",
  });

  // Belongings
  const [belongings, setBelongings] = useState(booking.belongings || "");
  const [bedLocation, setBedLocation] = useState(booking.bed_location || "");

  // Journal entry
  const [journalEntry, setJournalEntry] = useState("");

  // Check for vaccination warnings
  const vaccinationWarnings = [];
  if (dogHealth.vaccdhp) {
    const dhpDate = new Date(dogHealth.vaccdhp);
    const oneYearAgo = new Date();
    oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);
    if (dhpDate < oneYearAgo) {
      vaccinationWarnings.push("⚠️ DHP-vaccination är äldre än 1 år!");
    }
  } else {
    vaccinationWarnings.push("⚠️ Ingen DHP-vaccination registrerad");
  }
  if (dogHealth.vaccpi) {
    const piDate = new Date(dogHealth.vaccpi);
    const oneYearAgo = new Date();
    oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);
    if (piDate < oneYearAgo) {
      vaccinationWarnings.push("⚠️ Pi-vaccination är äldre än 1 år!");
    }
  } else {
    vaccinationWarnings.push("⚠️ Ingen Pi-vaccination registrerad");
  }

  // Handle date changes and check availability
  async function handleDateChange(type: "start" | "end", value: string) {
    if (type === "start") {
      setStartDate(value);
      if (new Date(value) > new Date(endDate)) {
        setDateWarning("Startdatum kan inte vara efter slutdatum");
      } else {
        setDateWarning(null);
      }
    } else {
      setEndDate(value);
      if (new Date(startDate) > new Date(value)) {
        setDateWarning("Slutdatum kan inte vara före startdatum");
      } else {
        setDateWarning(null);
      }
    }
  }

  // Save all changes and check in
  async function handleCheckIn() {
    if (dateWarning) {
      setError("Vänligen korrigera datumfel först");
      return;
    }

    setSaving(true);
    setError(null);

    try {
      // 1. Update dog health info if we have a dog
      if (booking.dogs?.id) {
        const { error: dogError } = await supabase
          .from("dogs")
          .update({
            allergies: dogHealth.allergies || null,
            medications: dogHealth.medications || null,
            special_needs: dogHealth.special_needs || null,
            behavior_notes: dogHealth.behavior_notes || null,
            is_castrated: dogHealth.is_castrated,
            vaccdhp: dogHealth.vaccdhp || null,
            vaccpi: dogHealth.vaccpi || null,
            updated_at: new Date().toISOString(),
          })
          .eq("id", booking.dogs.id);

        if (dogError) {
          console.error("Error updating dog:", dogError);
          throw new Error(
            `Kunde inte uppdatera hundinformation: ${dogError.message}`
          );
        }
      }

      // 2. Update booking with dates and belongings
      const { error: bookingError } = await supabase
        .from("bookings")
        .update({
          start_date: startDate,
          end_date: endDate,
          belongings: belongings || null,
          bed_location: bedLocation || null,
          status: "checked_in" as const,
          updated_at: new Date().toISOString(),
        } as any)
        .eq("id", booking.id);

      if (bookingError) {
        console.error("Error updating booking:", bookingError);
        throw new Error(
          `Kunde inte uppdatera bokning: ${bookingError.message}`
        );
      }

      // 3. Add journal entry if provided
      if (journalEntry.trim() && booking.dogs?.id) {
        const { error: journalError } = await supabase
          .from("dog_journal")
          .insert({
            dog_id: booking.dogs.id,
            content: `📥 INCHECKNING ${new Date().toLocaleDateString("sv-SE")}\n\n${journalEntry}`,
          });

        if (journalError) {
          console.warn("Could not save journal entry:", journalError);
          // Don't throw - journal is optional
        }
      }

      console.log("[CheckIn] Successfully checked in booking:", booking.id);
      onCheckInComplete(booking.id);
      onClose();
    } catch (err: any) {
      console.error("[CheckIn] Error:", err);
      setError(err.message || "Ett fel uppstod vid incheckning");
    } finally {
      setSaving(false);
    }
  }

  const tabs = [
    { id: "info" as const, label: "Bokningsinfo", icon: Calendar },
    { id: "health" as const, label: "Hälsa & Beteende", icon: Heart },
    { id: "belongings" as const, label: "Tillhörigheter", icon: Backpack },
    { id: "journal" as const, label: "Journal", icon: FileText },
  ];

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="bg-gradient-to-r from-[#2c7a4c] to-[#3d9960] px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3 text-white">
            <Dog className="w-6 h-6" />
            <div>
              <h2 className="text-xl font-bold">Incheckning</h2>
              <p className="text-sm text-white/80">
                {booking.dogs?.name || "Okänd hund"} •{" "}
                {booking.dogs?.owners?.full_name || "Okänd ägare"}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-white/80 hover:text-white transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Vaccination warnings */}
        {vaccinationWarnings.length > 0 && (
          <div className="bg-amber-50 border-b border-amber-200 px-6 py-3">
            <div className="flex items-start gap-2 text-amber-800">
              <AlertTriangle className="w-5 h-5 flex-shrink-0 mt-0.5" />
              <div className="text-sm">
                {vaccinationWarnings.map((warning, i) => (
                  <div key={i}>{warning}</div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Tabs */}
        <div className="border-b border-gray-200 px-6">
          <div className="flex gap-1 -mb-px">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`
                  flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors
                  ${
                    activeTab === tab.id
                      ? "border-[#2c7a4c] text-[#2c7a4c]"
                      : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                  }
                `}
              >
                <tab.icon className="w-4 h-4" />
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {/* Tab: Booking Info */}
          {activeTab === "info" && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-6">
                {/* Dog info */}
                <div className="bg-gray-50 rounded-lg p-4">
                  <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                    <Dog className="w-4 h-4" /> Hund
                  </h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Namn:</span>
                      <span className="font-medium">
                        {booking.dogs?.name || "-"}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Ras:</span>
                      <span className="font-medium">
                        {booking.dogs?.breed || "-"}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Storlek:</span>
                      <span className="font-medium">
                        {booking.dogs?.heightcm
                          ? `${booking.dogs.heightcm} cm`
                          : "-"}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Room info */}
                <div className="bg-gray-50 rounded-lg p-4">
                  <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                    🏠 Rum
                  </h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Rum:</span>
                      <span className="font-medium">
                        {booking.rooms?.name || "Ej tilldelat"}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Kapacitet:</span>
                      <span className="font-medium">
                        {booking.rooms?.capacity_m2
                          ? `${booking.rooms.capacity_m2} m²`
                          : "-"}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Dates - editable */}
              <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
                <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                  <Calendar className="w-4 h-4" /> Bokningsdatum
                  <span className="text-xs text-gray-500 font-normal">
                    (kan ändras vid behov)
                  </span>
                </h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm text-gray-600 mb-1">
                      Startdatum
                    </label>
                    <input
                      type="date"
                      value={startDate}
                      onChange={(e) =>
                        handleDateChange("start", e.target.value)
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#2c7a4c] focus:border-[#2c7a4c]"
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-gray-600 mb-1">
                      Slutdatum
                    </label>
                    <input
                      type="date"
                      value={endDate}
                      onChange={(e) => handleDateChange("end", e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#2c7a4c] focus:border-[#2c7a4c]"
                    />
                  </div>
                </div>
                {dateWarning && (
                  <p className="mt-2 text-sm text-red-600 flex items-center gap-1">
                    <AlertTriangle className="w-4 h-4" /> {dateWarning}
                  </p>
                )}
              </div>

              {/* Owner contact info */}
              <div className="bg-gray-50 rounded-lg p-4">
                <h3 className="font-semibold text-gray-900 mb-3">
                  📞 Kontaktuppgifter ägare
                </h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Namn:</span>
                    <span className="font-medium">
                      {booking.dogs?.owners?.full_name || "-"}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Telefon:</span>
                    <span className="font-medium">
                      {booking.dogs?.owners?.phone || "-"}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">E-post:</span>
                    <span className="font-medium">
                      {booking.dogs?.owners?.email || "-"}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Tab: Health & Behavior */}
          {activeTab === "health" && (
            <div className="space-y-6">
              {/* Vaccination status */}
              <div className="bg-purple-50 rounded-lg p-4 border border-purple-200">
                <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                  <Syringe className="w-4 h-4" /> Vaccinationer
                </h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm text-gray-600 mb-1">
                      DHP (senast given)
                    </label>
                    <input
                      type="date"
                      value={dogHealth.vaccdhp}
                      onChange={(e) =>
                        setDogHealth({ ...dogHealth, vaccdhp: e.target.value })
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#2c7a4c] focus:border-[#2c7a4c]"
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-gray-600 mb-1">
                      Pi / Kennelhosta (senast given)
                    </label>
                    <input
                      type="date"
                      value={dogHealth.vaccpi}
                      onChange={(e) =>
                        setDogHealth({ ...dogHealth, vaccpi: e.target.value })
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#2c7a4c] focus:border-[#2c7a4c]"
                    />
                  </div>
                </div>
              </div>

              {/* Castration status */}
              <div className="flex items-center gap-3 bg-gray-50 rounded-lg p-4">
                <input
                  type="checkbox"
                  id="is_castrated"
                  checked={dogHealth.is_castrated}
                  onChange={(e) =>
                    setDogHealth({
                      ...dogHealth,
                      is_castrated: e.target.checked,
                    })
                  }
                  className="w-5 h-5 text-[#2c7a4c] rounded focus:ring-[#2c7a4c]"
                />
                <label
                  htmlFor="is_castrated"
                  className="text-sm font-medium text-gray-700"
                >
                  Hunden är kastrerad/steriliserad
                </label>
              </div>

              {/* Health conditions */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  🚨 Allergier
                </label>
                <textarea
                  value={dogHealth.allergies}
                  onChange={(e) =>
                    setDogHealth({ ...dogHealth, allergies: e.target.value })
                  }
                  placeholder="T.ex. kyckling, spannmål, kvalster..."
                  rows={2}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#2c7a4c] focus:border-[#2c7a4c]"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  💊 Mediciner
                </label>
                <textarea
                  value={dogHealth.medications}
                  onChange={(e) =>
                    setDogHealth({ ...dogHealth, medications: e.target.value })
                  }
                  placeholder="Ange mediciner och dosering..."
                  rows={2}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#2c7a4c] focus:border-[#2c7a4c]"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  ⚡ Särskilda behov
                </label>
                <textarea
                  value={dogHealth.special_needs}
                  onChange={(e) =>
                    setDogHealth({
                      ...dogHealth,
                      special_needs: e.target.value,
                    })
                  }
                  placeholder="T.ex. rädd för åska, behöver extra vila, specialkost..."
                  rows={2}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#2c7a4c] focus:border-[#2c7a4c]"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  🐕 Beteende med andra hundar
                </label>
                <textarea
                  value={dogHealth.behavior_notes}
                  onChange={(e) =>
                    setDogHealth({
                      ...dogHealth,
                      behavior_notes: e.target.value,
                    })
                  }
                  placeholder="Hur fungerar hunden med andra hundar? Något att tänka på?"
                  rows={2}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#2c7a4c] focus:border-[#2c7a4c]"
                />
              </div>
            </div>
          )}

          {/* Tab: Belongings */}
          {activeTab === "belongings" && (
            <div className="space-y-6">
              <div className="bg-amber-50 rounded-lg p-4 border border-amber-200">
                <p className="text-sm text-amber-800">
                  📦 Dokumentera vad hunden har med sig. Detta är viktigt för
                  att kunna lämna tillbaka allt vid utcheckning.
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  🎒 Tillhörigheter
                </label>
                <textarea
                  value={belongings}
                  onChange={(e) => setBelongings(e.target.value)}
                  placeholder="T.ex. blå säng, leksak giraff, koppel med röd handtag, 2 kg mat, skål..."
                  rows={4}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#2c7a4c] focus:border-[#2c7a4c]"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  📍 Säng / sovplats
                </label>
                <input
                  type="text"
                  value={bedLocation}
                  onChange={(e) => setBedLocation(e.target.value)}
                  placeholder="T.ex. plats 3 vid fönstret, egen bur..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#2c7a4c] focus:border-[#2c7a4c]"
                />
              </div>
            </div>
          )}

          {/* Tab: Journal */}
          {activeTab === "journal" && (
            <div className="space-y-6">
              <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
                <p className="text-sm text-blue-800">
                  📝 Skriv anteckningar från incheckningssamtalet. Dessa sparas
                  i hundens journal och kan läsas av alla medarbetare.
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  ✍️ Incheckningsanteckningar
                </label>
                <textarea
                  value={journalEntry}
                  onChange={(e) => setJournalEntry(e.target.value)}
                  placeholder="T.ex. Ägaren berättade att hunden har varit lite ledsen senaste dagarna. Mår bra fysiskt. Gillar att leka med bollar. Vill helst vara med lugna hundar..."
                  rows={8}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#2c7a4c] focus:border-[#2c7a4c]"
                />
              </div>

              {booking.notes && (
                <div className="bg-gray-50 rounded-lg p-4">
                  <h4 className="font-medium text-gray-700 mb-2">
                    📋 Tidigare anteckningar på bokningen
                  </h4>
                  <p className="text-sm text-gray-600 whitespace-pre-wrap">
                    {booking.notes}
                  </p>
                </div>
              )}

              {booking.special_requests && (
                <div className="bg-yellow-50 rounded-lg p-4 border border-yellow-200">
                  <h4 className="font-medium text-yellow-800 mb-2">
                    ⭐ Önskemål från kunden
                  </h4>
                  <p className="text-sm text-yellow-700 whitespace-pre-wrap">
                    {booking.special_requests}
                  </p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="border-t border-gray-200 px-6 py-4 bg-gray-50 flex items-center justify-between">
          {error && (
            <p className="text-sm text-red-600 flex items-center gap-1">
              <AlertTriangle className="w-4 h-4" /> {error}
            </p>
          )}
          <div className="flex-1" />
          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowRoomCard(true)}
              className="btn-secondary px-4 py-2 flex items-center gap-2"
              title="Skriv ut rumskort (A4)"
            >
              <Printer className="w-4 h-4" /> Rumskort
            </button>
            <button
              onClick={onClose}
              disabled={saving}
              className="btn-secondary px-4 py-2"
            >
              Avbryt
            </button>
            <button
              onClick={handleCheckIn}
              disabled={saving || !!dateWarning}
              className="btn-primary px-6 py-2 flex items-center gap-2"
            >
              {saving ? (
                <>
                  <span className="animate-spin">⏳</span> Sparar...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" /> Checka in
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Dog Room Card Modal */}
      {showRoomCard && (
        <DogRoomCard
          booking={booking as any}
          onClose={() => setShowRoomCard(false)}
        />
      )}
    </div>
  );
}
