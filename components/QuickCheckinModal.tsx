"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import {
  X,
  Dog,
  User,
  Calendar,
  Phone,
  Home,
  AlertTriangle,
  CheckCircle,
  Printer,
  Pencil,
  Loader2,
  Utensils,
  Pill,
  Heart,
  Package,
} from "lucide-react";
import { format, differenceInDays } from "date-fns";
import { sv } from "date-fns/locale";
import DogRoomCard from "./DogRoomCard";

// ============================================================================
// TYPES
// ============================================================================

interface BookingData {
  id: string;
  org_id?: string;
  start_date: string;
  end_date: string;
  status: string | null;
  total_price: number | null;
  base_price: number | null;
  notes: string | null;
  belongings: string | null;
  bed_location: string | null;
  room_id: string | null;
  rooms?: {
    id: string;
    name: string | null;
    capacity_m2?: number | null;
  } | null;
  dogs?: {
    id: string;
    name: string;
    breed: string | null;
    birth_date: string | null;
    gender: string | null;
    heightcm: number | null;
    weightkg: number | null;
    photo_url: string | null;
    allergies: string | null;
    medications: string | null;
    special_needs: string | null;
    behavior_notes: string | null;
    food_type: string | null;
    food_amount: string | null;
    food_times: string | null;
    food_brand: string | null;
    vaccdhp: string | null;
    vaccpi: string | null;
    is_castrated: boolean | null;
    owners?: {
      id: string;
      full_name: string;
      phone: string | null;
      email: string | null;
      address: string | null;
    } | null;
  } | null;
}

interface QuickCheckinModalProps {
  booking: BookingData;
  onClose: () => void;
  onCheckedIn: () => void;
}

// ============================================================================
// COMPONENT
// ============================================================================

export default function QuickCheckinModal({
  booking,
  onClose,
  onCheckedIn,
}: QuickCheckinModalProps) {
  const supabase = createClient();
  const [processing, setProcessing] = useState(false);
  const [showRoomCard, setShowRoomCard] = useState(false);
  const [belongingsInput, setBelongingsInput] = useState(
    booking.belongings || ""
  );

  const dog = booking.dogs;
  const owner = dog?.owners;
  const room = booking.rooms;

  // Calculate stay
  const nights = differenceInDays(
    new Date(booking.end_date),
    new Date(booking.start_date)
  );

  // Check vaccination status
  const checkVaccination = (dateStr: string | null | undefined) => {
    if (!dateStr) return { valid: false, text: "Ej registrerat" };
    const date = new Date(dateStr);
    const oneYearAgo = new Date();
    oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);
    return {
      valid: date > oneYearAgo,
      text: format(date, "d MMM yyyy", { locale: sv }),
    };
  };

  const vaccDHP = checkVaccination(dog?.vaccdhp);
  const vaccPI = checkVaccination(dog?.vaccpi);
  const hasVaccWarning = !vaccDHP.valid || !vaccPI.valid;

  // Has important health info?
  const hasHealthInfo =
    dog?.allergies || dog?.medications || dog?.special_needs;

  // Handle check-in
  async function handleCheckin() {
    setProcessing(true);
    try {
      const now = new Date();
      const currentTime = now.toTimeString().split(" ")[0];

      const { error } = await supabase
        .from("bookings")
        .update({
          status: "checked_in",
          checkin_time: currentTime,
          belongings: belongingsInput || null,
        } as any)
        .eq("id", booking.id);

      if (error) throw error;

      onCheckedIn();
    } catch (err: any) {
      console.error("Fel vid incheckning:", err);
      alert("Kunde inte checka in: " + (err.message || "Okänt fel"));
    } finally {
      setProcessing(false);
    }
  }

  return (
    <>
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
          {/* Header - stor och tydlig */}
          <div className="bg-gradient-to-r from-[#2c7a4c] to-[#3d9960] px-6 py-5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4 text-white">
                {dog?.photo_url ? (
                  <img
                    src={dog.photo_url}
                    alt={dog.name}
                    className="w-16 h-16 rounded-full object-cover border-3 border-white/30"
                  />
                ) : (
                  <div className="w-16 h-16 rounded-full bg-white/20 flex items-center justify-center">
                    <Dog className="w-8 h-8" />
                  </div>
                )}
                <div>
                  <h2 className="text-2xl font-bold">
                    {dog?.name || "Okänd hund"}
                  </h2>
                  <p className="text-white/80 text-lg">
                    {dog?.breed || "Okänd ras"}
                    {dog?.weightkg && ` • ${dog.weightkg} kg`}
                  </p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="text-white/80 hover:text-white p-2"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
          </div>

          {/* Content - allt viktigt på EN vy */}
          <div className="flex-1 overflow-y-auto p-6 space-y-4">
            {/* VARNINGAR överst */}
            {(hasVaccWarning || hasHealthInfo) && (
              <div className="bg-amber-50 border-2 border-amber-300 rounded-lg p-4">
                <h3 className="font-bold text-amber-800 flex items-center gap-2 mb-2">
                  <AlertTriangle className="w-5 h-5" />
                  Viktigt att notera
                </h3>
                <div className="space-y-2 text-sm">
                  {!vaccDHP.valid && (
                    <p className="text-amber-900">
                      <strong>⚠️ DHP-vaccination:</strong> {vaccDHP.text}
                    </p>
                  )}
                  {!vaccPI.valid && (
                    <p className="text-amber-900">
                      <strong>⚠️ Kennelhosta:</strong> {vaccPI.text}
                    </p>
                  )}
                  {dog?.allergies && (
                    <p className="text-amber-900">
                      <strong>🚨 Allergier:</strong> {dog.allergies}
                    </p>
                  )}
                  {dog?.medications && (
                    <p className="text-amber-900">
                      <strong>💊 Mediciner:</strong> {dog.medications}
                    </p>
                  )}
                  {dog?.special_needs && (
                    <p className="text-amber-900">
                      <strong>⚡ Spec. behov:</strong> {dog.special_needs}
                    </p>
                  )}
                </div>
              </div>
            )}

            {/* Snabbinfo i grid */}
            <div className="grid grid-cols-2 gap-4">
              {/* Bokning */}
              <div className="bg-gray-50 rounded-lg p-4">
                <h4 className="font-semibold text-gray-700 mb-3 flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-[#2c7a4c]" />
                  Bokning
                </h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Period:</span>
                    <span className="font-medium">
                      {format(new Date(booking.start_date), "d/M", {
                        locale: sv,
                      })}{" "}
                      –{" "}
                      {format(new Date(booking.end_date), "d/M", {
                        locale: sv,
                      })}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Nätter:</span>
                    <span className="font-medium">{nights}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Rum:</span>
                    <span className="font-medium">
                      {room?.name || "Ej tilldelat"}
                    </span>
                  </div>
                  {booking.total_price && (
                    <div className="flex justify-between pt-2 border-t">
                      <span className="text-gray-600">Totalt:</span>
                      <span className="font-bold text-[#2c7a4c]">
                        {Number(booking.total_price).toLocaleString("sv-SE")} kr
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* Ägare */}
              <div className="bg-gray-50 rounded-lg p-4">
                <h4 className="font-semibold text-gray-700 mb-3 flex items-center gap-2">
                  <User className="w-4 h-4 text-[#2c7a4c]" />
                  Ägare
                </h4>
                <div className="space-y-2">
                  <p className="font-medium text-lg">
                    {owner?.full_name || "Ej angiven"}
                  </p>
                  {owner?.phone && (
                    <a
                      href={`tel:${owner.phone}`}
                      className="flex items-center gap-2 text-[#2c7a4c] hover:underline"
                    >
                      <Phone className="w-4 h-4" />
                      {owner.phone}
                    </a>
                  )}
                </div>
              </div>
            </div>

            {/* Mat - om angiven */}
            {(dog?.food_type || dog?.food_brand || dog?.food_amount) && (
              <div className="bg-orange-50 rounded-lg p-4">
                <h4 className="font-semibold text-gray-700 mb-2 flex items-center gap-2">
                  <Utensils className="w-4 h-4 text-orange-600" />
                  Mat
                </h4>
                <div className="flex flex-wrap gap-4 text-sm">
                  {dog?.food_type && (
                    <span>
                      <strong>Typ:</strong> {dog.food_type}
                    </span>
                  )}
                  {dog?.food_brand && (
                    <span>
                      <strong>Märke:</strong> {dog.food_brand}
                    </span>
                  )}
                  {dog?.food_amount && (
                    <span>
                      <strong>Mängd:</strong> {dog.food_amount}
                    </span>
                  )}
                  {dog?.food_times && (
                    <span>
                      <strong>Tider:</strong> {dog.food_times}
                    </span>
                  )}
                </div>
              </div>
            )}

            {/* Tillhörigheter - snabbinmatning */}
            <div className="bg-blue-50 rounded-lg p-4">
              <h4 className="font-semibold text-gray-700 mb-2 flex items-center gap-2">
                <Package className="w-4 h-4 text-blue-600" />
                Tillhörigheter (vad har hunden med sig?)
              </h4>
              <textarea
                value={belongingsInput}
                onChange={(e) => setBelongingsInput(e.target.value)}
                placeholder="T.ex. blå säng, brun leksak, 1 kg mat..."
                rows={2}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#2c7a4c] focus:border-[#2c7a4c] text-sm"
              />
            </div>

            {/* Beteende om angiven */}
            {dog?.behavior_notes && (
              <div className="bg-purple-50 rounded-lg p-4">
                <h4 className="font-semibold text-gray-700 mb-2 flex items-center gap-2">
                  <Heart className="w-4 h-4 text-purple-600" />
                  Beteende
                </h4>
                <p className="text-sm">{dog.behavior_notes}</p>
              </div>
            )}
          </div>

          {/* Footer - STORA tydliga knappar */}
          <div className="border-t-2 border-gray-100 px-6 py-4 bg-gray-50">
            <div className="flex items-center gap-3">
              <button
                onClick={onClose}
                className="px-4 py-2.5 text-gray-600 hover:text-gray-900 transition-colors"
              >
                Avbryt
              </button>

              <div className="flex-1" />

              <button
                onClick={() => setShowRoomCard(true)}
                className="btn-secondary flex items-center gap-2"
              >
                <Printer className="w-5 h-5" />
                Skriv ut rumskort
              </button>

              <button
                onClick={handleCheckin}
                disabled={processing}
                className="btn-primary flex items-center gap-2 text-lg px-6 py-3"
              >
                {processing ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Checkar in...
                  </>
                ) : (
                  <>
                    <CheckCircle className="w-5 h-5" />
                    Checka in
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Rumskort modal */}
      {showRoomCard && (
        <DogRoomCard
          booking={booking as any}
          onClose={() => setShowRoomCard(false)}
        />
      )}
    </>
  );
}
