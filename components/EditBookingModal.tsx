"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import {
  X,
  Save,
  Calendar,
  Home,
  FileText,
  Plus,
  Trash2,
  AlertCircle,
  Check,
  Loader2,
} from "lucide-react";
import { format } from "date-fns";
import { sv } from "date-fns/locale";

// ============================================================================
// TYPES
// ============================================================================

interface ExtraService {
  id: string;
  label: string;
  price: number;
  unit: string;
}

interface BookingService {
  id: string;
  service_id: string | null;
  quantity: number | null;
  unit_price: number | null;
  price: number | null;
  staff_notes: string | null;
  service_name?: string;
  booking_id?: string | null;
  created_at?: string | null;
}

interface JournalEntry {
  id: string;
  content: string;
  created_at: string | null;
}

interface Room {
  id: string;
  name: string | null;
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
  room_id: string | null;
  org_id: string;
  dogs?: {
    id: string;
    name: string;
    breed: string | null;
  } | null;
  rooms?: {
    name: string | null;
  } | null;
}

interface EditBookingModalProps {
  booking: BookingData;
  onClose: () => void;
  onSave: () => void;
}

// ============================================================================
// COMPONENT
// ============================================================================

export default function EditBookingModal({
  booking,
  onClose,
  onSave,
}: EditBookingModalProps) {
  const supabase = createClient();

  // Loading states
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Active tab
  const [activeTab, setActiveTab] = useState<
    "booking" | "services" | "journal"
  >("booking");

  // Booking form state
  const [formData, setFormData] = useState({
    start_date: booking.start_date,
    end_date: booking.end_date,
    room_id: booking.room_id || "",
    notes: booking.notes || "",
    belongings: booking.belongings || "",
    bed_location: booking.bed_location || "",
    discount_amount: booking.discount_amount || 0,
  });

  // Data from database
  const [rooms, setRooms] = useState<Room[]>([]);
  const [availableServices, setAvailableServices] = useState<ExtraService[]>(
    []
  );
  const [bookingServices, setBookingServices] = useState<BookingService[]>([]);
  const [journal, setJournal] = useState<JournalEntry[]>([]);

  // New journal entry
  const [newJournalEntry, setNewJournalEntry] = useState("");

  // New service to add
  const [selectedServiceId, setSelectedServiceId] = useState("");
  const [serviceQuantity, setServiceQuantity] = useState(1);
  const [serviceNotes, setServiceNotes] = useState("");

  // ============================================================================
  // LOAD DATA
  // ============================================================================

  useEffect(() => {
    loadAllData();
  }, [booking.id]);

  async function loadAllData() {
    setLoading(true);
    setError(null);

    try {
      // Load rooms - include boarding AND both types
      const { data: roomsData } = await supabase
        .from("rooms")
        .select("id, name")
        .eq("org_id", booking.org_id)
        .in("room_type", ["boarding", "both"])
        .order("name");

      setRooms(roomsData || []);

      // Load available extra services
      const { data: servicesData } = await supabase
        .from("extra_services")
        .select("id, label, price, unit")
        .eq("org_id", booking.org_id)
        .eq("is_active", true)
        .in("service_type", ["boarding", "both", "all"]);

      setAvailableServices(servicesData || []);

      // Load booking services
      const { data: bookingServicesData } = await supabase
        .from("booking_services")
        .select("id, service_id, quantity, unit_price, price, staff_notes")
        .eq("booking_id", booking.id);

      // Map service names
      const servicesWithNames = (bookingServicesData || []).map((bs: any) => {
        const service = (servicesData || []).find(
          (s: ExtraService) => s.id === bs.service_id
        );
        return {
          ...bs,
          service_name: service?.label || "Okänd tjänst",
        };
      });

      setBookingServices(servicesWithNames);

      // Load journal entries
      if (booking.dogs?.id) {
        const { data: journalData } = await supabase
          .from("dog_journal")
          .select("id, content, created_at")
          .eq("dog_id", booking.dogs.id)
          .order("created_at", { ascending: false });

        setJournal(journalData || []);
      }
    } catch (err) {
      console.error("Error loading data:", err);
      setError("Kunde inte ladda data");
    } finally {
      setLoading(false);
    }
  }

  // ============================================================================
  // SAVE FUNCTIONS
  // ============================================================================

  async function saveBooking() {
    setSaving(true);
    setError(null);
    setSuccess(null);

    try {
      const { error: updateError } = await supabase
        .from("bookings")
        .update({
          start_date: formData.start_date,
          end_date: formData.end_date,
          room_id: formData.room_id || null,
          notes: formData.notes || null,
          belongings: formData.belongings || null,
          bed_location: formData.bed_location || null,
          discount_amount: formData.discount_amount || 0,
          updated_at: new Date().toISOString(),
        })
        .eq("id", booking.id);

      if (updateError) throw updateError;

      setSuccess("Bokning uppdaterad!");
      setTimeout(() => setSuccess(null), 3000);
      onSave();
    } catch (err: any) {
      console.error("Error saving booking:", err);
      setError(err.message || "Kunde inte spara bokning");
    } finally {
      setSaving(false);
    }
  }

  async function addService() {
    if (!selectedServiceId) return;

    setSaving(true);
    setError(null);

    try {
      const service = availableServices.find((s) => s.id === selectedServiceId);
      if (!service) throw new Error("Tjänst hittades inte");

      const { data, error: insertError } = await supabase
        .from("booking_services")
        .insert({
          booking_id: booking.id,
          service_id: selectedServiceId,
          quantity: serviceQuantity,
          unit_price: service.price,
          price: service.price * serviceQuantity,
          staff_notes: serviceNotes || null,
        })
        .select()
        .single();

      if (insertError) throw insertError;

      // Add to local state
      setBookingServices([
        ...bookingServices,
        {
          id: data.id,
          service_id: data.service_id,
          booking_id: data.booking_id,
          quantity: data.quantity,
          unit_price: service.price,
          price: data.price,
          staff_notes: serviceNotes || null,
          service_name: service.label,
          created_at: data.created_at,
        },
      ]);

      // Reset form
      setSelectedServiceId("");
      setServiceQuantity(1);
      setServiceNotes("");
      setSuccess("Tilläggstjänst tillagd!");
      setTimeout(() => setSuccess(null), 3000);
      onSave();
    } catch (err: any) {
      console.error("Error adding service:", err);
      setError(err.message || "Kunde inte lägga till tjänst");
    } finally {
      setSaving(false);
    }
  }

  async function removeService(serviceId: string) {
    if (!confirm("Vill du ta bort denna tjänst?")) return;

    setSaving(true);
    setError(null);

    try {
      const { error: deleteError } = await supabase
        .from("booking_services")
        .delete()
        .eq("id", serviceId);

      if (deleteError) throw deleteError;

      setBookingServices(bookingServices.filter((s) => s.id !== serviceId));
      setSuccess("Tjänst borttagen!");
      setTimeout(() => setSuccess(null), 3000);
      onSave();
    } catch (err: any) {
      console.error("Error removing service:", err);
      setError(err.message || "Kunde inte ta bort tjänst");
    } finally {
      setSaving(false);
    }
  }

  async function addJournalEntry() {
    if (!newJournalEntry.trim() || !booking.dogs?.id) return;

    setSaving(true);
    setError(null);

    try {
      const { data, error: insertError } = await supabase
        .from("dog_journal")
        .insert({
          dog_id: booking.dogs.id,
          content: newJournalEntry.trim(),
        })
        .select()
        .single();

      if (insertError) throw insertError;

      setJournal([data, ...journal]);
      setNewJournalEntry("");
      setSuccess("Journalanteckning sparad!");
      setTimeout(() => setSuccess(null), 3000);
    } catch (err: any) {
      console.error("Error adding journal entry:", err);
      setError(err.message || "Kunde inte spara journalanteckning");
    } finally {
      setSaving(false);
    }
  }

  async function deleteJournalEntry(entryId: string) {
    if (!confirm("Vill du ta bort denna anteckning?")) return;

    setSaving(true);
    setError(null);

    try {
      const { error: deleteError } = await supabase
        .from("dog_journal")
        .delete()
        .eq("id", entryId);

      if (deleteError) throw deleteError;

      setJournal(journal.filter((j) => j.id !== entryId));
      setSuccess("Anteckning borttagen!");
      setTimeout(() => setSuccess(null), 3000);
    } catch (err: any) {
      console.error("Error deleting journal entry:", err);
      setError(err.message || "Kunde inte ta bort anteckning");
    } finally {
      setSaving(false);
    }
  }

  // ============================================================================
  // RENDER
  // ============================================================================

  // Check if booking can be edited (not checked_out or cancelled)
  const canEdit = !["checked_out", "cancelled", "completed"].includes(
    booking.status
  );

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
        <div className="bg-white rounded-xl p-8 text-center">
          <Loader2 className="w-8 h-8 animate-spin text-[#2c7a4c] mx-auto mb-4" />
          <p className="text-gray-600">Laddar...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg max-h-[85vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="bg-[#2c7a4c] px-4 py-3 flex items-center justify-between flex-shrink-0">
          <div className="text-white">
            <h2 className="text-base font-semibold">
              {booking.dogs?.name || "Okänd hund"} • {booking.start_date} –{" "}
              {booking.end_date}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="text-white/80 hover:text-white transition-colors p-1"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Status bar */}
        {!canEdit && (
          <div className="bg-amber-50 border-b border-amber-200 px-4 py-2 flex items-center gap-2 text-sm">
            <AlertCircle className="w-4 h-4 text-amber-600" />
            <p className="text-amber-800">
              Bokningen kan inte redigeras (status: {booking.status})
            </p>
          </div>
        )}

        {/* Success/Error messages */}
        {success && (
          <div className="bg-green-50 border-b border-green-200 px-4 py-2 flex items-center gap-2 text-sm">
            <Check className="w-4 h-4 text-green-600" />
            <p className="text-green-800">{success}</p>
          </div>
        )}
        {error && (
          <div className="bg-red-50 border-b border-red-200 px-4 py-2 flex items-center gap-2 text-sm">
            <AlertCircle className="w-4 h-4 text-red-600" />
            <p className="text-red-800">{error}</p>
          </div>
        )}

        {/* Tabs */}
        <div className="flex border-b border-gray-200 flex-shrink-0">
          <button
            onClick={() => setActiveTab("booking")}
            className={`flex-1 px-3 py-2 text-xs font-medium transition-colors flex items-center justify-center gap-1.5 ${
              activeTab === "booking"
                ? "text-[#2c7a4c] border-b-2 border-[#2c7a4c] bg-[#f0fdf4]"
                : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"
            }`}
          >
            <Calendar className="w-3.5 h-3.5" />
            Bokningsinfo
          </button>
          <button
            onClick={() => setActiveTab("services")}
            className={`flex-1 px-3 py-2 text-xs font-medium transition-colors flex items-center justify-center gap-1.5 ${
              activeTab === "services"
                ? "text-[#2c7a4c] border-b-2 border-[#2c7a4c] bg-[#f0fdf4]"
                : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"
            }`}
          >
            <Plus className="w-3.5 h-3.5" />
            Tilläggstjänster
            {bookingServices.length > 0 && (
              <span className="bg-[#2c7a4c] text-white text-[10px] px-1.5 py-0.5 rounded-full">
                {bookingServices.length}
              </span>
            )}
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
          {/* Booking info tab */}
          {activeTab === "booking" && (
            <div className="space-y-3">
              {/* Dates */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    Startdatum
                  </label>
                  <input
                    type="date"
                    value={formData.start_date}
                    onChange={(e) =>
                      setFormData({ ...formData, start_date: e.target.value })
                    }
                    disabled={!canEdit}
                    className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-[#2c7a4c] focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    Slutdatum
                  </label>
                  <input
                    type="date"
                    value={formData.end_date}
                    onChange={(e) =>
                      setFormData({ ...formData, end_date: e.target.value })
                    }
                    disabled={!canEdit}
                    className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-[#2c7a4c] focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed"
                  />
                </div>
              </div>

              {/* Room */}
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Rum
                </label>
                <select
                  value={formData.room_id}
                  onChange={(e) =>
                    setFormData({ ...formData, room_id: e.target.value })
                  }
                  disabled={!canEdit}
                  className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-[#2c7a4c] focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed"
                >
                  <option value="">Inget rum valt</option>
                  {rooms.map((room) => (
                    <option key={room.id} value={room.id}>
                      {room.name || `Rum ${room.id.slice(0, 6)}`}
                    </option>
                  ))}
                </select>
              </div>

              {/* Discount */}
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Rabatt (kr)
                </label>
                <input
                  type="number"
                  value={formData.discount_amount}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      discount_amount: parseFloat(e.target.value) || 0,
                    })
                  }
                  disabled={!canEdit}
                  min="0"
                  className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-[#2c7a4c] focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed"
                />
              </div>

              {/* Notes */}
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Anteckningar
                </label>
                <textarea
                  value={formData.notes}
                  onChange={(e) =>
                    setFormData({ ...formData, notes: e.target.value })
                  }
                  disabled={!canEdit}
                  rows={2}
                  placeholder="Allmänna anteckningar om bokningen..."
                  className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-[#2c7a4c] focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed resize-none"
                />
              </div>

              {/* Belongings */}
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Tillhörigheter
                </label>
                <textarea
                  value={formData.belongings}
                  onChange={(e) =>
                    setFormData({ ...formData, belongings: e.target.value })
                  }
                  disabled={!canEdit}
                  rows={2}
                  placeholder="Vad har hunden med sig?"
                  className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-[#2c7a4c] focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed resize-none"
                />
              </div>

              {/* Bed location */}
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Sängplacering
                </label>
                <input
                  type="text"
                  value={formData.bed_location}
                  onChange={(e) =>
                    setFormData({ ...formData, bed_location: e.target.value })
                  }
                  disabled={!canEdit}
                  placeholder="Var sover hunden?"
                  className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-[#2c7a4c] focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed"
                />
              </div>

              {/* Save button */}
              {canEdit && (
                <div className="pt-3">
                  <button
                    onClick={saveBooking}
                    disabled={saving}
                    className="w-full flex items-center justify-center gap-2 bg-[#2c7a4c] text-white px-3 py-2 rounded-md text-sm font-medium hover:bg-[#236139] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {saving ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Save className="w-4 h-4" />
                    )}
                    Spara ändringar
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Services tab */}
          {activeTab === "services" && (
            <div className="space-y-4">
              {/* Current services */}
              <div>
                <h3 className="font-medium text-sm text-gray-900 mb-2">
                  Tillagda tjänster
                </h3>
                {bookingServices.length === 0 ? (
                  <p className="text-gray-500 text-xs italic py-3 text-center bg-gray-50 rounded-md">
                    Inga tilläggstjänster tillagda
                  </p>
                ) : (
                  <div className="space-y-2">
                    {bookingServices.map((service) => (
                      <div
                        key={service.id}
                        className="flex items-center justify-between p-2 bg-gray-50 rounded-md border border-gray-200"
                      >
                        <div>
                          <p className="font-medium text-sm text-gray-900">
                            {service.service_name}
                          </p>
                          <p className="text-xs text-gray-500">
                            {service.quantity} st × {service.unit_price} kr ={" "}
                            {service.price} kr
                          </p>
                          {service.staff_notes && (
                            <p className="text-xs text-gray-600 mt-0.5 italic">
                              "{service.staff_notes}"
                            </p>
                          )}
                        </div>
                        {canEdit && (
                          <button
                            onClick={() => removeService(service.id)}
                            disabled={saving}
                            className="p-1.5 text-red-500 hover:bg-red-50 rounded-md transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Add new service */}
              {canEdit && (
                <div className="border-t border-gray-200 pt-4">
                  <h3 className="font-medium text-sm text-gray-900 mb-2">
                    Lägg till tjänst
                  </h3>
                  <div className="space-y-2">
                    <select
                      value={selectedServiceId}
                      onChange={(e) => setSelectedServiceId(e.target.value)}
                      className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-[#2c7a4c] focus:border-transparent"
                    >
                      <option value="">Välj tjänst...</option>
                      {availableServices.map((service) => (
                        <option key={service.id} value={service.id}>
                          {service.label} – {service.price} kr/{service.unit}
                        </option>
                      ))}
                    </select>

                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">
                          Antal
                        </label>
                        <input
                          type="number"
                          value={serviceQuantity}
                          onChange={(e) =>
                            setServiceQuantity(parseInt(e.target.value) || 1)
                          }
                          min="1"
                          className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-[#2c7a4c] focus:border-transparent"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">
                          Pris
                        </label>
                        <div className="px-2 py-1.5 bg-gray-100 rounded-md text-sm text-gray-700 font-medium">
                          {selectedServiceId
                            ? `${(availableServices.find((s) => s.id === selectedServiceId)?.price || 0) * serviceQuantity} kr`
                            : "—"}
                        </div>
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">
                        Anteckning (valfritt)
                      </label>
                      <input
                        type="text"
                        value={serviceNotes}
                        onChange={(e) => setServiceNotes(e.target.value)}
                        placeholder="T.ex. 'Extra bad efter lekstund'"
                        className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-[#2c7a4c] focus:border-transparent"
                      />
                    </div>

                    <button
                      onClick={addService}
                      disabled={!selectedServiceId || saving}
                      className="w-full flex items-center justify-center gap-2 bg-[#2c7a4c] text-white px-3 py-2 rounded-md text-sm font-medium hover:bg-[#236139] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {saving ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Plus className="w-4 h-4" />
                      )}
                      Lägg till
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Journal tab */}
          {activeTab === "journal" && (
            <div className="space-y-4">
              {/* Add new entry */}
              <div>
                <h3 className="font-medium text-sm text-gray-900 mb-2">
                  Ny journalanteckning
                </h3>
                <textarea
                  value={newJournalEntry}
                  onChange={(e) => setNewJournalEntry(e.target.value)}
                  rows={3}
                  placeholder="Skriv en ny journalanteckning för denna hund..."
                  className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-[#2c7a4c] focus:border-transparent resize-none"
                />
                <button
                  onClick={addJournalEntry}
                  disabled={!newJournalEntry.trim() || saving}
                  className="mt-2 w-full flex items-center justify-center gap-2 bg-[#2c7a4c] text-white px-3 py-2 rounded-md text-sm font-medium hover:bg-[#236139] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {saving ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Plus className="w-4 h-4" />
                  )}
                  Spara anteckning
                </button>
              </div>

              {/* Existing entries */}
              <div className="border-t border-gray-200 pt-4">
                <h3 className="font-medium text-sm text-gray-900 mb-2">
                  Tidigare anteckningar
                </h3>
                {journal.length === 0 ? (
                  <p className="text-gray-500 text-xs italic py-3 text-center bg-gray-50 rounded-md">
                    Inga journalanteckningar för denna hund
                  </p>
                ) : (
                  <div className="space-y-2">
                    {journal.map((entry) => (
                      <div
                        key={entry.id}
                        className="p-3 bg-gray-50 rounded-md border-l-3 border-[#2c7a4c] group"
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <p className="text-[10px] text-gray-500 mb-1">
                              {entry.created_at
                                ? format(
                                    new Date(entry.created_at),
                                    "d MMM yyyy HH:mm",
                                    {
                                      locale: sv,
                                    }
                                  )
                                : "Okänt datum"}
                            </p>
                            <p className="text-xs whitespace-pre-wrap">
                              {entry.content}
                            </p>
                          </div>
                          <button
                            onClick={() => deleteJournalEntry(entry.id)}
                            disabled={saving}
                            className="ml-2 p-1 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded opacity-0 group-hover:opacity-100 transition-all"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
