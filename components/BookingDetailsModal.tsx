"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import {
  X,
  Dog,
  User,
  Calendar,
  Phone,
  Mail,
  FileText,
  AlertCircle,
  Pill,
  Heart,
  Home,
  Clock,
  Utensils,
  Pencil,
} from "lucide-react";
import { format } from "date-fns";
import { sv } from "date-fns/locale";
import EditBookingModal from "./EditBookingModal";

interface JournalEntry {
  id: string;
  content: string;
  created_at: string | null;
  created_by?: string;
}

interface BookingData {
  id: string;
  start_date: string;
  end_date: string;
  status: string;
  total_price: number | null;
  discount_amount: number | null;
  notes: string | null;
  belongings: string | null;
  bed_location: string | null;
  room_id?: string | null;
  org_id?: string;
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
    can_share_room: boolean | null;
    can_be_with_other_dogs: boolean | null;
    vaccdhp: string | null;
    vaccpi: string | null;
    owners?: {
      id: string;
      full_name: string;
      phone: string | null;
      email: string | null;
      address: string | null;
      city: string | null;
      postalcode: string | null;
      contact_person2_name: string | null;
      contact_person2_phone: string | null;
    } | null;
  } | null;
  rooms?: {
    name: string | null;
  } | null;
}

interface BookingDetailsModalProps {
  booking: BookingData;
  onClose: () => void;
  onRefresh?: () => void;
}

// Calculate age from birth date
function calculateAge(birthDate: string | null): string {
  if (!birthDate) return "Okänd ålder";

  const birth = new Date(birthDate);
  const today = new Date();

  let years = today.getFullYear() - birth.getFullYear();
  let months = today.getMonth() - birth.getMonth();

  if (months < 0) {
    years--;
    months += 12;
  }

  if (years === 0) {
    return `${months} mån`;
  } else if (years < 2) {
    return `${years} år${months > 0 ? ` ${months} mån` : ""}`;
  } else {
    return `${years} år`;
  }
}

export default function BookingDetailsModal({
  booking,
  onClose,
  onRefresh,
}: BookingDetailsModalProps) {
  const supabase = createClient();
  const [journal, setJournal] = useState<JournalEntry[]>([]);
  const [loadingJournal, setLoadingJournal] = useState(true);
  const [activeTab, setActiveTab] = useState<"dog" | "owner" | "journal">(
    "dog"
  );
  const [showEditModal, setShowEditModal] = useState(false);

  const dog = booking.dogs;
  const owner = dog?.owners;

  // Check if booking can be edited
  const canEdit = !["checked_out", "cancelled", "completed"].includes(
    booking.status
  );

  // Function to fetch journal entries
  const loadJournal = async () => {
    if (!dog?.id) {
      setLoadingJournal(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from("dog_journal")
        .select("id, content, created_at")
        .eq("dog_id", dog.id)
        .order("created_at", { ascending: false })
        .limit(20);

      if (error) {
        console.warn("Could not fetch journal:", error);
      } else {
        setJournal(data || []);
      }
    } catch (err) {
      console.warn("Error fetching journal:", err);
    } finally {
      setLoadingJournal(false);
    }
  };

  // Fetch journal entries for this dog
  useEffect(() => {
    loadJournal();
  }, [dog?.id]);

  // Status badge
  function getStatusBadge(status: string) {
    const statusConfig: Record<
      string,
      { bg: string; text: string; label: string }
    > = {
      confirmed: {
        bg: "bg-emerald-100",
        text: "text-emerald-700",
        label: "Bekräftad",
      },
      pending: { bg: "bg-amber-100", text: "text-amber-700", label: "Väntar" },
      checked_in: {
        bg: "bg-blue-100",
        text: "text-blue-700",
        label: "Incheckad",
      },
      checked_out: {
        bg: "bg-gray-100",
        text: "text-gray-700",
        label: "Utcheckad",
      },
      cancelled: { bg: "bg-red-100", text: "text-red-700", label: "Avbokad" },
      completed: {
        bg: "bg-gray-100",
        text: "text-gray-600",
        label: "Slutförd",
      },
    };

    const config = statusConfig[status] || {
      bg: "bg-gray-100",
      text: "text-gray-700",
      label: status,
    };

    return (
      <span
        className={`px-2 py-0.5 rounded-full text-xs font-medium ${config.bg} ${config.text}`}
      >
        {config.label}
      </span>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg max-h-[85vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="bg-gradient-to-r from-[#2c7a4c] to-[#3d9960] px-4 py-3 flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-3 text-white">
            {dog?.photo_url ? (
              <img
                src={dog.photo_url}
                alt={dog.name}
                className="w-10 h-10 rounded-full object-cover border-2 border-white/30"
              />
            ) : (
              <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center">
                <Dog className="w-5 h-5 text-white" />
              </div>
            )}
            <div>
              <h2 className="text-base font-semibold">
                {dog?.name || "Okänd hund"}
              </h2>
              <p className="text-xs text-white/80">
                {dog?.breed || "Okänd ras"} •{" "}
                {calculateAge(dog?.birth_date || null)}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {getStatusBadge(booking.status)}
            {booking.status !== "checked_out" && (
              <button
                onClick={() => setShowEditModal(true)}
                className="flex items-center gap-1 px-2 py-1 bg-white/20 hover:bg-white/30 text-white rounded-md text-xs font-medium transition-colors"
              >
                <Pencil className="w-3.5 h-3.5" />
                Redigera
              </button>
            )}
            <button
              onClick={onClose}
              className="text-white/80 hover:text-white transition-colors p-1"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Booking summary bar */}
        <div className="bg-gray-50 px-4 py-2 border-b border-gray-200 flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-4 text-xs">
            <div className="flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-gray-500" />
              <span>
                {format(new Date(booking.start_date), "d MMM", { locale: sv })}{" "}
                –{" "}
                {format(new Date(booking.end_date), "d MMM yyyy", {
                  locale: sv,
                })}
              </span>
            </div>
            {booking.rooms?.name && (
              <div className="flex items-center gap-1.5">
                <Home className="w-3.5 h-3.5 text-gray-500" />
                <span>{booking.rooms.name}</span>
              </div>
            )}
            {booking.total_price && (
              <div className="font-medium text-[#2c7a4c]">
                {Number(booking.total_price).toLocaleString()} kr
              </div>
            )}
          </div>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-gray-200 flex-shrink-0">
          <button
            onClick={() => setActiveTab("dog")}
            className={`flex-1 px-3 py-2 text-xs font-medium transition-colors flex items-center justify-center gap-1.5 ${
              activeTab === "dog"
                ? "text-[#2c7a4c] border-b-2 border-[#2c7a4c] bg-[#f0fdf4]"
                : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"
            }`}
          >
            <Dog className="w-3.5 h-3.5" />
            Hundinfo
          </button>
          <button
            onClick={() => setActiveTab("owner")}
            className={`flex-1 px-3 py-2 text-xs font-medium transition-colors flex items-center justify-center gap-1.5 ${
              activeTab === "owner"
                ? "text-[#2c7a4c] border-b-2 border-[#2c7a4c] bg-[#f0fdf4]"
                : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"
            }`}
          >
            <User className="w-3.5 h-3.5" />
            Ägare
          </button>
          <button
            onClick={() => setActiveTab("journal")}
            className={`flex-1 px-3 py-2 text-xs font-medium transition-colors flex items-center justify-center gap-1.5 ${
              activeTab === "journal"
                ? "text-[#2c7a4c] border-b-2 border-[#2c7a4c] bg-[#f0fdf4]"
                : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            Journal
            {journal.length > 0 && (
              <span className="bg-gray-200 text-gray-700 text-[10px] px-1.5 py-0.5 rounded-full">
                {journal.length}
              </span>
            )}
          </button>
        </div>

        {/* Tab content */}
        <div className="flex-1 overflow-y-auto p-4">
          {/* Dog info tab */}
          {activeTab === "dog" && (
            <div className="space-y-3">
              {/* Basic info */}
              <div className="grid grid-cols-2 gap-2">
                <div className="bg-gray-50 rounded-md p-2.5">
                  <p className="text-[10px] text-gray-500 uppercase tracking-wide mb-0.5">
                    Ras
                  </p>
                  <p className="text-sm font-medium">{dog?.breed || "—"}</p>
                </div>
                <div className="bg-gray-50 rounded-md p-2.5">
                  <p className="text-[10px] text-gray-500 uppercase tracking-wide mb-0.5">
                    Ålder
                  </p>
                  <p className="text-sm font-medium">
                    {calculateAge(dog?.birth_date || null)}
                  </p>
                </div>
                <div className="bg-gray-50 rounded-md p-2.5">
                  <p className="text-[10px] text-gray-500 uppercase tracking-wide mb-0.5">
                    Kön
                  </p>
                  <p className="text-sm font-medium">
                    {dog?.gender === "hane" || dog?.gender === "male"
                      ? "Hane"
                      : dog?.gender === "tik" || dog?.gender === "female"
                        ? "Tik"
                        : dog?.gender
                          ? dog.gender.charAt(0).toUpperCase() +
                            dog.gender.slice(1)
                          : "—"}
                  </p>
                </div>
                <div className="bg-gray-50 rounded-md p-2.5">
                  <p className="text-[10px] text-gray-500 uppercase tracking-wide mb-0.5">
                    Storlek
                  </p>
                  <p className="text-sm font-medium">
                    {dog?.heightcm ? `${dog.heightcm} cm` : "—"}
                    {dog?.weightkg ? ` • ${dog.weightkg} kg` : ""}
                  </p>
                </div>
              </div>

              {/* Can be with other dogs - using can_be_with_other_dogs (what customer sets) */}
              <div
                className={`rounded-md p-2.5 flex items-center gap-2 text-sm ${
                  dog?.can_be_with_other_dogs
                    ? "bg-green-50 border border-green-200"
                    : "bg-red-50 border border-red-200"
                }`}
              >
                <div
                  className={`w-6 h-6 rounded-full flex items-center justify-center text-xs ${
                    dog?.can_be_with_other_dogs ? "bg-green-200" : "bg-red-200"
                  }`}
                >
                  {dog?.can_be_with_other_dogs ? "✓" : "✗"}
                </div>
                <p className="font-medium text-sm">
                  {dog?.can_be_with_other_dogs
                    ? "Får leka med andra hundar"
                    : "Får EJ leka med andra hundar"}
                </p>
              </div>

              {/* Health info */}
              <div className="space-y-2">
                <h3 className="font-medium text-sm text-gray-900 flex items-center gap-1.5">
                  <Heart className="w-4 h-4 text-red-500" />
                  Hälsa & Beteende
                </h3>

                {dog?.allergies && (
                  <div className="bg-amber-50 border border-amber-200 rounded-md p-2.5">
                    <div className="flex items-center gap-1.5 text-amber-700 mb-0.5">
                      <AlertCircle className="w-3.5 h-3.5" />
                      <p className="font-medium text-xs">Allergier</p>
                    </div>
                    <p className="text-xs">{dog.allergies}</p>
                  </div>
                )}

                {dog?.medications && (
                  <div className="bg-purple-50 border border-purple-200 rounded-md p-2.5">
                    <div className="flex items-center gap-1.5 text-purple-700 mb-0.5">
                      <Pill className="w-3.5 h-3.5" />
                      <p className="font-medium text-xs">Mediciner</p>
                    </div>
                    <p className="text-xs">{dog.medications}</p>
                  </div>
                )}

                {dog?.special_needs && (
                  <div className="bg-blue-50 border border-blue-200 rounded-md p-2.5">
                    <p className="font-medium text-xs text-blue-700 mb-0.5">
                      Särskilda behov
                    </p>
                    <p className="text-xs">{dog.special_needs}</p>
                  </div>
                )}

                {dog?.behavior_notes && (
                  <div className="bg-gray-50 border border-gray-200 rounded-md p-2.5">
                    <p className="font-medium text-xs text-gray-700 mb-0.5">
                      Beteende
                    </p>
                    <p className="text-xs">{dog.behavior_notes}</p>
                  </div>
                )}

                {!dog?.allergies &&
                  !dog?.medications &&
                  !dog?.special_needs &&
                  !dog?.behavior_notes && (
                    <p className="text-xs text-gray-500 italic">
                      Ingen hälso- eller beteendeinformation registrerad.
                    </p>
                  )}
              </div>

              {/* Food info */}
              <div className="space-y-2">
                <h3 className="font-medium text-sm text-gray-900 flex items-center gap-1.5">
                  <Utensils className="w-4 h-4 text-orange-500" />
                  Matinformation
                </h3>
                {dog?.food_type ||
                dog?.food_brand ||
                dog?.food_amount ||
                dog?.food_times ? (
                  <div className="bg-orange-50 border border-orange-200 rounded-md p-2.5 space-y-1">
                    {dog.food_type && (
                      <div className="flex justify-between text-xs">
                        <span className="text-gray-600">Typ:</span>
                        <span className="font-medium">
                          {dog.food_type === "own"
                            ? "Eget foder"
                            : dog.food_type === "pensionat"
                              ? "Pensionatets foder"
                              : dog.food_type}
                        </span>
                      </div>
                    )}
                    {dog.food_brand && (
                      <div className="flex justify-between text-xs">
                        <span className="text-gray-600">Märke:</span>
                        <span className="font-medium">{dog.food_brand}</span>
                      </div>
                    )}
                    {dog.food_amount && (
                      <div className="flex justify-between text-xs">
                        <span className="text-gray-600">Mängd:</span>
                        <span className="font-medium">{dog.food_amount}</span>
                      </div>
                    )}
                    {dog.food_times && (
                      <div className="flex justify-between text-xs">
                        <span className="text-gray-600">Antal mål:</span>
                        <span className="font-medium">
                          {dog.food_times} mål/dag
                        </span>
                      </div>
                    )}
                  </div>
                ) : (
                  <p className="text-xs text-gray-500 italic">
                    Ingen matinformation registrerad.
                  </p>
                )}
              </div>

              {/* Vaccinations */}
              <div className="space-y-2">
                <h3 className="font-medium text-sm text-gray-900">
                  Vaccinationer
                </h3>
                <div className="grid grid-cols-2 gap-2">
                  <div className="bg-gray-50 rounded-md p-2.5">
                    <p className="text-[10px] text-gray-500 uppercase tracking-wide mb-0.5">
                      DHP-vaccination
                    </p>
                    <p className="text-sm font-medium">
                      {dog?.vaccdhp
                        ? format(new Date(dog.vaccdhp), "d MMM yyyy", {
                            locale: sv,
                          })
                        : "Ej registrerad"}
                    </p>
                  </div>
                  <div className="bg-gray-50 rounded-md p-2.5">
                    <p className="text-[10px] text-gray-500 uppercase tracking-wide mb-0.5">
                      Pi-vaccination
                    </p>
                    <p className="text-sm font-medium">
                      {dog?.vaccpi
                        ? format(new Date(dog.vaccpi), "d MMM yyyy", {
                            locale: sv,
                          })
                        : "Ej registrerad"}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Owner tab */}
          {activeTab === "owner" && (
            <div className="space-y-4">
              {/* Owner name */}
              <div className="text-center pb-3 border-b border-gray-200">
                <div className="w-12 h-12 bg-[#2c7a4c] rounded-full flex items-center justify-center mx-auto mb-2">
                  <User className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-base font-semibold text-gray-900">
                  {owner?.full_name || "Okänd ägare"}
                </h3>
              </div>

              {/* Contact info */}
              <div className="space-y-2">
                <h4 className="font-medium text-sm text-gray-900">
                  Kontaktuppgifter
                </h4>

                {owner?.phone && (
                  <a
                    href={`tel:${owner.phone}`}
                    className="flex items-center gap-2.5 p-2.5 bg-blue-50 rounded-md hover:bg-blue-100 transition-colors"
                  >
                    <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
                      <Phone className="w-4 h-4 text-white" />
                    </div>
                    <div>
                      <p className="text-[10px] text-gray-500">Telefon</p>
                      <p className="text-sm font-medium text-blue-700">
                        {owner.phone}
                      </p>
                    </div>
                  </a>
                )}

                {owner?.email && (
                  <a
                    href={`mailto:${owner.email}`}
                    className="flex items-center gap-2.5 p-2.5 bg-green-50 rounded-md hover:bg-green-100 transition-colors"
                  >
                    <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center">
                      <Mail className="w-4 h-4 text-white" />
                    </div>
                    <div>
                      <p className="text-[10px] text-gray-500">E-post</p>
                      <p className="text-sm font-medium text-green-700">
                        {owner.email}
                      </p>
                    </div>
                  </a>
                )}
              </div>

              {/* Address */}
              {(owner?.address || owner?.city) && (
                <div className="space-y-2">
                  <h4 className="font-medium text-sm text-gray-900">Adress</h4>
                  <div className="bg-gray-50 rounded-md p-2.5 text-sm">
                    {owner?.address && <p>{owner.address}</p>}
                    {(owner?.postalcode || owner?.city) && (
                      <p>
                        {owner?.postalcode} {owner?.city}
                      </p>
                    )}
                  </div>
                </div>
              )}

              {/* Emergency contact */}
              {owner?.contact_person2_name && (
                <div className="space-y-2">
                  <h4 className="font-medium text-sm text-gray-900">
                    Kontaktperson 2
                  </h4>
                  <div className="bg-amber-50 border border-amber-200 rounded-md p-2.5">
                    <p className="text-sm font-medium">
                      {owner.contact_person2_name}
                    </p>
                    {owner.contact_person2_phone && (
                      <a
                        href={`tel:${owner.contact_person2_phone}`}
                        className="text-xs text-amber-700 hover:underline flex items-center gap-1.5 mt-1"
                      >
                        <Phone className="w-3.5 h-3.5" />
                        {owner.contact_person2_phone}
                      </a>
                    )}
                  </div>
                </div>
              )}

              {!owner && (
                <p className="text-center text-gray-500 italic text-sm py-6">
                  Ingen ägarinformation tillgänglig.
                </p>
              )}
            </div>
          )}

          {/* Journal tab */}
          {activeTab === "journal" && (
            <div className="space-y-3">
              {loadingJournal ? (
                <div className="flex items-center justify-center py-8">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-[#2c7a4c]"></div>
                </div>
              ) : journal.length === 0 ? (
                <div className="text-center py-8">
                  <FileText className="w-10 h-10 text-gray-300 mx-auto mb-2" />
                  <p className="text-gray-500 text-sm">
                    Inga journalanteckningar för denna hund.
                  </p>
                </div>
              ) : (
                <div className="space-y-2">
                  {journal.map((entry) => (
                    <div
                      key={entry.id}
                      className="bg-gray-50 rounded-md p-3 border-l-3 border-[#2c7a4c]"
                    >
                      <div className="flex items-center gap-1.5 text-[10px] text-gray-500 mb-1">
                        <Clock className="w-3 h-3" />
                        {entry.created_at
                          ? format(
                              new Date(entry.created_at),
                              "d MMM yyyy HH:mm",
                              {
                                locale: sv,
                              }
                            )
                          : "Okänt datum"}
                      </div>
                      <p className="text-xs whitespace-pre-wrap">
                        {entry.content}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Booking notes footer */}
        {(booking.notes || booking.belongings || booking.bed_location) && (
          <div className="border-t border-gray-200 px-4 py-3 bg-gray-50 flex-shrink-0">
            <h4 className="font-medium text-xs text-gray-700 mb-1.5">
              Bokningsanteckningar
            </h4>
            <div className="text-xs text-gray-600 space-y-0.5">
              {booking.notes && <p>📝 {booking.notes}</p>}
              {booking.belongings && (
                <p>🎒 Tillhörigheter: {booking.belongings}</p>
              )}
              {booking.bed_location && (
                <p>🛏️ Sängplacering: {booking.bed_location}</p>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Edit Modal */}
      {showEditModal && booking.org_id && (
        <EditBookingModal
          booking={{
            id: booking.id,
            org_id: booking.org_id,
            room_id: booking.room_id || null,
            start_date: booking.start_date,
            end_date: booking.end_date,
            notes: booking.notes || null,
            belongings: booking.belongings || null,
            bed_location: booking.bed_location || null,
            status: booking.status,
            total_price: booking.total_price,
            discount_amount: booking.discount_amount,
            dogs: booking.dogs
              ? {
                  id: booking.dogs.id,
                  name: booking.dogs.name,
                  breed: booking.dogs.breed,
                }
              : null,
            rooms: booking.rooms ? { name: booking.rooms.name } : null,
          }}
          onClose={() => setShowEditModal(false)}
          onSave={() => {
            setShowEditModal(false);
            loadJournal();
            onRefresh?.();
          }}
        />
      )}
    </div>
  );
}
