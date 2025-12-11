"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useAuth } from "@/app/context/AuthContext";
import {
  Calendar,
  Clock,
  Dog,
  User,
  MapPin,
  LogOut,
  Phone,
  AlertCircle,
  ArrowLeft,
  RefreshCw,
} from "lucide-react";
import Link from "next/link";
import { format } from "date-fns";
import { sv } from "date-fns/locale";
import QuickCheckinModal from "@/components/QuickCheckinModal";
import type { Database } from "@/types/database";

interface ActiveGuest {
  id: string;
  start_date: string;
  end_date: string;
  checkin_time: string | null;
  checkout_time: string | null;
  status: string;
  bed_location: string | null;
  belongings: string | null;
  total_price: number;
  base_price: number;
  dogs: {
    id: string;
    name: string;
    breed: string | null;
    birth_date: string | null;
    heightcm: number | null;
    weightkg: number | null;
    medical_conditions: string | null;
    allergies: string | null;
    owners: {
      id: string;
      full_name: string;
      phone: string | null;
      email: string | null;
    } | null;
  } | null;
}

interface ExtraService {
  id: string;
  label: string;
  price: number;
  unit: string;
}

export default function AktivaGasterPage() {
  const supabase = createClient();
  const { user, currentOrgId, loading: authLoading } = useAuth();

  const [guests, setGuests] = useState<ActiveGuest[]>([]);
  const [confirmedBookings, setConfirmedBookings] = useState<ActiveGuest[]>([]);
  const [extraServices, setExtraServices] = useState<ExtraService[]>([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState<string | null>(null);

  // Checkout modal
  const [showCheckoutModal, setShowCheckoutModal] = useState(false);
  const [selectedBooking, setSelectedBooking] = useState<ActiveGuest | null>(
    null
  );
  const [selectedServices, setSelectedServices] = useState<
    { id: string; quantity: number }[]
  >([]);
  const [checkoutNotes, setCheckoutNotes] = useState("");

  // Checkin modal
  const [showCheckinModal, setShowCheckinModal] = useState(false);
  const [selectedCheckinBooking, setSelectedCheckinBooking] = useState<
    any | null
  >(null);

  useEffect(() => {
    if (currentOrgId && !authLoading) {
      loadData();
    } else if (!authLoading && !currentOrgId) {
      setLoading(false);
    }
  }, [currentOrgId, authLoading]);

  const loadData = async () => {
    if (!currentOrgId) return;

    try {
      setLoading(true);

      // Ladda aktiva gäster (checked_in)
      const { data: activeData, error: activeError } = await (supabase as any)
        .from("bookings")
        .select(
          `
          id,
          start_date,
          end_date,
          checkin_time,
          checkout_time,
          status,
          bed_location,
          belongings,
          total_price,
          base_price,
          dogs (
            id,
            name,
            breed,
            birth_date,
            heightcm,
            weightkg,
            medical_conditions,
            allergies,
            owners (
              id,
              full_name,
              phone,
              email
            )
          )
        `
        )
        .eq("org_id", currentOrgId)
        .eq("status", "checked_in")
        .order("start_date", { ascending: true });

      if (activeError) {
        console.error("Fel vid hämtning av aktiva gäster:", activeError);
      } else {
        setGuests(activeData || []);
      }

      // Ladda bekräftade bokningar som väntar på incheckning (status=confirmed + start_date = idag eller tidigare)
      // ✅ FIX: Använd lokal tid istället för UTC
      const now = new Date();
      const today = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
      const { data: confirmedData, error: confirmedError } = await (
        supabase as any
      )
        .from("bookings")
        .select(
          `
          id,
          org_id,
          start_date,
          end_date,
          checkin_time,
          checkout_time,
          status,
          bed_location,
          belongings,
          notes,
          total_price,
          base_price,
          room_id,
          rooms (
            id,
            name,
            capacity_m2
          ),
          dogs (
            id,
            name,
            breed,
            birth_date,
            heightcm,
            weightkg,
            gender,
            is_castrated,
            photo_url,
            allergies,
            medications,
            special_needs,
            behavior_notes,
            food_type,
            food_amount,
            food_times,
            food_brand,
            vaccdhp,
            vaccpi,
            medical_conditions,
            can_be_with_other_dogs,
            can_share_room,
            owners (
              id,
              full_name,
              phone,
              email,
              address
            )
          )
        `
        )
        .eq("org_id", currentOrgId)
        .in("status", ["confirmed", "pending", "approved"])
        .lte("start_date", today)
        .gte("end_date", today) // ✅ FIX: Visa bara bokningar som pågår (inte avslutade)
        .order("start_date", { ascending: true });

      if (confirmedError) {
        console.error(
          "Fel vid hämtning av bekräftade bokningar:",
          confirmedError
        );
      } else {
        setConfirmedBookings(confirmedData || []);
      }

      // Ladda extra tjänster
      const { data: servicesData, error: servicesError } = await (
        supabase as any
      )
        .from("extra_services")
        .select("id, label, price, unit")
        .eq("org_id", currentOrgId)
        .eq("is_active", true)
        .in("service_type", ["boarding", "both", "all"]);

      if (servicesError) {
        console.error("Fel vid hämtning av extra tjänster:", servicesError);
      } else {
        setExtraServices(servicesData || []);
      }
    } catch (err) {
      console.error("Oväntat fel:", err);
    } finally {
      setLoading(false);
    }
  };

  // Öppna incheckning modal
  const handleOpenCheckinModal = (booking: any) => {
    setSelectedCheckinBooking(booking);
    setShowCheckinModal(true);
  };

  // Stäng incheckning modal och uppdatera data
  const handleCheckinComplete = () => {
    setShowCheckinModal(false);
    setSelectedCheckinBooking(null);
    loadData();
  };

  const handleCheckoutClick = (booking: ActiveGuest) => {
    setSelectedBooking(booking);
    setSelectedServices([]);
    setCheckoutNotes("");
    setShowCheckoutModal(true);
  };

  const handleCheckoutConfirm = async () => {
    if (!selectedBooking) return;

    setProcessing(selectedBooking.id);

    try {
      const now = new Date();
      const currentTime = now.toTimeString().split(" ")[0];

      // Beräkna extra tjänster
      let extraServicesCost = 0;
      selectedServices.forEach((service) => {
        const serviceData = extraServices.find((s) => s.id === service.id);
        if (serviceData) {
          extraServicesCost += serviceData.price * service.quantity;
        }
      });

      const finalTotalPrice = selectedBooking.base_price + extraServicesCost;

      // Uppdatera bokning
      const { error: updateError } = await (supabase as any)
        .from("bookings")
        .update({
          status: "checked_out" as const,
          checkout_time: currentTime,
          total_price: finalTotalPrice,
          notes:
            checkoutNotes || selectedBooking.dogs?.name + " har checkat ut",
        })
        .eq("id", selectedBooking.id);

      if (updateError) {
        console.error("Fel vid utcheckning:", updateError);
        alert("Kunde inte checka ut gästen");
        return;
      }

      // TODO: Skapa efterskottsfaktura här
      // await createAfterPaymentInvoice(selectedBooking.id, finalTotalPrice);

      alert(
        `Utcheckning klar!\n\nSlutpris: ${finalTotalPrice} kr\nEfterbetalning: ${finalTotalPrice - selectedBooking.base_price * 0.5} kr`
      );

      setShowCheckoutModal(false);
      setSelectedBooking(null);
      loadData();
    } catch (err) {
      console.error("Oväntat fel:", err);
      alert("Ett oväntat fel uppstod");
    } finally {
      setProcessing(null);
    }
  };

  const toggleService = (serviceId: string) => {
    const existing = selectedServices.find((s) => s.id === serviceId);
    if (existing) {
      setSelectedServices(selectedServices.filter((s) => s.id !== serviceId));
    } else {
      setSelectedServices([
        ...selectedServices,
        { id: serviceId, quantity: 1 },
      ]);
    }
  };

  const updateServiceQuantity = (serviceId: string, quantity: number) => {
    if (quantity < 1) {
      setSelectedServices(selectedServices.filter((s) => s.id !== serviceId));
    } else {
      setSelectedServices(
        selectedServices.map((s) =>
          s.id === serviceId ? { ...s, quantity } : s
        )
      );
    }
  };

  const calculateCheckoutTotal = () => {
    if (!selectedBooking) return 0;

    let extraCost = 0;
    selectedServices.forEach((service) => {
      const serviceData = extraServices.find((s) => s.id === service.id);
      if (serviceData) {
        extraCost += serviceData.price * service.quantity;
      }
    });

    return selectedBooking.base_price + extraCost;
  };

  if (authLoading || loading) {
    return (
      <div className="page-wrapper flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#2c7a4c] mx-auto"></div>
          <p className="mt-4 text-gray-600">Laddar aktiva gäster...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="page-wrapper">
      {/* Header */}
      <div className="page-header">
        <div className="page-header-content">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="page-title">Aktiva gäster</h1>
              <p className="page-subtitle">In- och utcheckning</p>
            </div>
            <div className="flex items-center gap-3">
              <div className="stats-box">
                <p className="stats-number">{guests.length}</p>
                <p className="stats-label">Incheckade</p>
              </div>
              <div className="stats-box">
                <p className="stats-number">{confirmedBookings.length}</p>
                <p className="stats-label">Väntar</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <main className="page-main">
        {/* Action bar */}
        <div className="mb-6 flex items-center justify-between">
          <Link href="/hundpensionat" className="btn-outline">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Tillbaka
          </Link>
          <button
            onClick={loadData}
            disabled={loading}
            className="btn-secondary"
          >
            <RefreshCw
              className={`w-4 h-4 mr-2 ${loading ? "animate-spin" : ""}`}
            />
            Uppdatera
          </button>
        </div>

        {/* Väntar på incheckning */}
        {confirmedBookings.length > 0 && (
          <div className="mb-8">
            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <Clock className="w-5 h-5 text-amber-500" />
              Väntar på incheckning
              <span className="text-sm font-normal text-gray-500">
                ({confirmedBookings.length})
              </span>
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {confirmedBookings.map((booking) => (
                <div
                  key={booking.id}
                  onClick={() => handleOpenCheckinModal(booking)}
                  className="bg-white rounded-xl border border-gray-200 p-5 hover:shadow-md hover:border-emerald-300 transition-all cursor-pointer group"
                >
                  {/* Header */}
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-amber-100 rounded-full flex items-center justify-center group-hover:bg-emerald-100 transition-colors">
                        <Dog className="w-5 h-5 text-amber-600 group-hover:text-emerald-600" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-gray-900">
                          {booking.dogs?.name}
                        </h3>
                        <p className="text-sm text-gray-500">
                          {booking.dogs?.breed || "Okänd ras"}
                        </p>
                      </div>
                    </div>
                    <span className="px-2.5 py-1 bg-amber-50 text-amber-700 text-xs font-medium rounded-full">
                      Väntar
                    </span>
                  </div>

                  {/* Datum */}
                  <div className="flex items-center gap-4 text-sm text-gray-600 mb-3">
                    <div className="flex items-center gap-1.5">
                      <Calendar className="w-4 h-4 text-gray-400" />
                      <span>
                        {format(new Date(booking.start_date), "d MMM", {
                          locale: sv,
                        })}
                      </span>
                    </div>
                    <span className="text-gray-300">→</span>
                    <span>
                      {format(new Date(booking.end_date), "d MMM", {
                        locale: sv,
                      })}
                    </span>
                    {(booking as any).rooms?.name && (
                      <>
                        <span className="text-gray-300">•</span>
                        <span className="font-medium">
                          {(booking as any).rooms.name}
                        </span>
                      </>
                    )}
                  </div>

                  {/* Ägare */}
                  {booking.dogs?.owners && (
                    <div className="flex items-center gap-2 text-sm text-gray-600 pt-3 border-t border-gray-100">
                      <User className="w-4 h-4 text-gray-400" />
                      <span>{booking.dogs.owners.full_name}</span>
                      {booking.dogs.owners.phone && (
                        <>
                          <span className="text-gray-300">•</span>
                          <span>{booking.dogs.owners.phone}</span>
                        </>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Aktiva gäster */}
        <div>
          <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <Dog className="w-5 h-5 text-blue-600" />
            Incheckade
            <span className="text-sm font-normal text-gray-500">
              ({guests.length})
            </span>
          </h2>

          {guests.length === 0 ? (
            <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
              <Dog className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <h3 className="text-lg font-medium text-gray-700 mb-1">
                Inga incheckade gäster
              </h3>
              <p className="text-sm text-gray-500">
                Checka in gäster från listan ovan
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {guests.map((guest) => (
                <div
                  key={guest.id}
                  className="bg-white rounded-xl border border-gray-200 p-5 hover:shadow-md transition-shadow"
                >
                  {/* Header */}
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                        <Dog className="w-5 h-5 text-blue-600" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-gray-900">
                          {guest.dogs?.name}
                        </h3>
                        <p className="text-sm text-gray-500">
                          {guest.dogs?.breed || "Okänd ras"}
                        </p>
                      </div>
                    </div>
                    <span className="px-2.5 py-1 bg-blue-50 text-blue-700 text-xs font-medium rounded-full">
                      Incheckad
                    </span>
                  </div>

                  {/* Info */}
                  <div className="flex items-center gap-4 text-sm text-gray-600 mb-3">
                    {guest.bed_location && (
                      <>
                        <div className="flex items-center gap-1.5">
                          <MapPin className="w-4 h-4 text-gray-400" />
                          <span>{guest.bed_location}</span>
                        </div>
                        <span className="text-gray-300">•</span>
                      </>
                    )}
                    <span>
                      Ut:{" "}
                      {format(new Date(guest.end_date), "d MMM", {
                        locale: sv,
                      })}
                    </span>
                  </div>

                  {/* Medicinsk varning */}
                  {guest.dogs?.medical_conditions && (
                    <div className="flex items-start gap-2 p-2.5 bg-amber-50 border border-amber-200 rounded-lg mb-3 text-sm">
                      <AlertCircle className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
                      <p className="text-amber-800">
                        {guest.dogs.medical_conditions}
                      </p>
                    </div>
                  )}

                  {/* Ägare */}
                  {guest.dogs?.owners && (
                    <div className="flex items-center justify-between pt-3 border-t border-gray-100">
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <User className="w-4 h-4 text-gray-400" />
                        <span>{guest.dogs.owners.full_name}</span>
                      </div>
                      {guest.dogs.owners.phone && (
                        <a
                          href={`tel:${guest.dogs.owners.phone}`}
                          className="flex items-center gap-1.5 text-sm text-blue-600 hover:text-blue-800"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <Phone className="w-4 h-4" />
                          Ring
                        </a>
                      )}
                    </div>
                  )}

                  {/* Checkout button */}
                  <button
                    onClick={() => handleCheckoutClick(guest)}
                    disabled={!!processing}
                    className="w-full mt-4 bg-blue-600 text-white px-4 py-2.5 rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 transition-colors"
                  >
                    <LogOut className="w-4 h-4" />
                    Checka ut
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>

      {/* Checkout Modal */}
      {showCheckoutModal && selectedBooking && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <h3 className="text-2xl font-bold text-gray-900 mb-4">
                Checka ut {selectedBooking.dogs?.name}
              </h3>

              {/* Booking info */}
              <div className="bg-gray-50 p-4 rounded-md mb-6">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-gray-600">Ägare:</p>
                    <p className="font-medium">
                      {selectedBooking.dogs?.owners?.full_name}
                    </p>
                  </div>
                  <div>
                    <p className="text-gray-600">Telefon:</p>
                    <p className="font-medium">
                      {selectedBooking.dogs?.owners?.phone || "-"}
                    </p>
                  </div>
                  <div>
                    <p className="text-gray-600">Incheckning:</p>
                    <p className="font-medium">
                      {format(
                        new Date(selectedBooking.start_date),
                        "dd MMM yyyy",
                        { locale: sv }
                      )}
                    </p>
                  </div>
                  <div>
                    <p className="text-gray-600">Utcheckning:</p>
                    <p className="font-medium">
                      {format(
                        new Date(selectedBooking.end_date),
                        "dd MMM yyyy",
                        { locale: sv }
                      )}
                    </p>
                  </div>
                </div>
              </div>

              {/* Extra services */}
              <div className="mb-6">
                <h4 className="text-lg font-semibold text-gray-900 mb-3">
                  Extra tjänster
                </h4>
                {extraServices.length === 0 ? (
                  <p className="text-sm text-gray-600">
                    Inga extra tjänster tillgängliga
                  </p>
                ) : (
                  <div className="space-y-2">
                    {extraServices.map((service) => {
                      const selected = selectedServices.find(
                        (s) => s.id === service.id
                      );
                      return (
                        <div
                          key={service.id}
                          className="flex items-center justify-between p-3 border border-gray-200 rounded-md"
                        >
                          <div className="flex items-center space-x-3">
                            <input
                              type="checkbox"
                              checked={!!selected}
                              onChange={() => toggleService(service.id)}
                              className="w-5 h-5 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
                            />
                            <div>
                              <p className="font-medium text-gray-900">
                                {service.label}
                              </p>
                              <p className="text-sm text-gray-600">
                                {service.price} kr / {service.unit}
                              </p>
                            </div>
                          </div>
                          {selected && (
                            <div className="flex items-center space-x-2">
                              <button
                                onClick={() =>
                                  updateServiceQuantity(
                                    service.id,
                                    selected.quantity - 1
                                  )
                                }
                                className="w-8 h-8 bg-gray-200 rounded hover:bg-gray-300"
                              >
                                -
                              </button>
                              <span className="w-8 text-center font-medium">
                                {selected.quantity}
                              </span>
                              <button
                                onClick={() =>
                                  updateServiceQuantity(
                                    service.id,
                                    selected.quantity + 1
                                  )
                                }
                                className="w-8 h-8 bg-gray-200 rounded hover:bg-gray-300"
                              >
                                +
                              </button>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Price summary */}
              <div className="bg-blue-50 p-4 rounded-md mb-6">
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-700">Baspris:</span>
                    <span className="font-medium">
                      {selectedBooking.base_price} kr
                    </span>
                  </div>
                  {selectedServices.map((selected) => {
                    const service = extraServices.find(
                      (s) => s.id === selected.id
                    );
                    if (!service) return null;
                    return (
                      <div
                        key={selected.id}
                        className="flex justify-between text-sm"
                      >
                        <span className="text-gray-700">
                          {service.label} (×{selected.quantity}):
                        </span>
                        <span className="font-medium">
                          {service.price * selected.quantity} kr
                        </span>
                      </div>
                    );
                  })}
                  <div className="border-t pt-2 mt-2">
                    <div className="flex justify-between text-lg font-bold">
                      <span>Totalt:</span>
                      <span className="text-blue-600">
                        {calculateCheckoutTotal()} kr
                      </span>
                    </div>
                  </div>
                  <p className="text-xs text-gray-600 mt-2">
                    * Efterskottsfaktura skapas automatiskt
                  </p>
                </div>
              </div>

              {/* Notes */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Utchecknings-anteckningar (frivilligt)
                </label>
                <textarea
                  value={checkoutNotes}
                  onChange={(e) => setCheckoutNotes(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  rows={3}
                  placeholder="T.ex. hunden var glad och pigg, åt bra, inga problem..."
                />
              </div>

              {/* Actions */}
              <div className="flex space-x-3">
                <button
                  onClick={() => {
                    setShowCheckoutModal(false);
                    setSelectedBooking(null);
                  }}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                  disabled={!!processing}
                >
                  Avbryt
                </button>
                <button
                  onClick={handleCheckoutConfirm}
                  disabled={!!processing}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {processing
                    ? "Checkar ut..."
                    : `Bekräfta utcheckning (${calculateCheckoutTotal()} kr)`}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Quick Checkin Modal - enkel och snabb */}
      {showCheckinModal && selectedCheckinBooking && (
        <QuickCheckinModal
          booking={selectedCheckinBooking}
          onClose={() => {
            setShowCheckinModal(false);
            setSelectedCheckinBooking(null);
          }}
          onCheckedIn={handleCheckinComplete}
        />
      )}
    </div>
  );
}
