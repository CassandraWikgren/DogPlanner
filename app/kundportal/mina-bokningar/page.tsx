"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useAuth } from "@/app/context/AuthContext";
import { useRouter } from "next/navigation";
import {
  Calendar,
  Clock,
  DollarSign,
  AlertCircle,
  CheckCircle,
  XCircle,
  MapPin,
  Dog,
  FileText,
  ArrowLeft,
} from "lucide-react";
import Link from "next/link";
import {
  calculateCancellationFee,
  canCustomerCancel,
  formatCancellationInfo,
  CancellationCalculation,
} from "@/lib/cancellationPolicy";
import { format } from "date-fns";
import { sv } from "date-fns/locale";

interface Booking {
  id: string;
  start_date: string;
  end_date: string;
  status: string | null;
  total_price: number | null;
  discount_amount?: number | null;
  bed_location?: string | null;
  notes?: string | null;
  special_requests?: string | null;
  belongings?: string | null;
  created_at: string | null;
  cancelled_at?: string | null;
  cancellation_reason?: string | null;
  dogs: {
    id: string;
    name: string;
    breed: string | null;
  } | null;
  prepayment_invoice?: {
    id: string;
    amount: number;
    status: string;
    due_date: string;
  } | null;
  afterpayment_invoice?: {
    id: string;
    amount: number;
    status: string;
    due_date: string;
  } | null;
}

export default function MinaBokningarPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();

  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [cancelling, setCancelling] = useState<string | null>(null);
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
  const [cancellationCalc, setCancellationCalc] =
    useState<CancellationCalculation | null>(null);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [cancelReason, setCancelReason] = useState("");

  // Filter state
  const [filter, setFilter] = useState<
    "all" | "upcoming" | "past" | "cancelled"
  >("upcoming");

  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/kundportal/login?redirect=/kundportal/mina-bokningar");
      return;
    }

    if (user) {
      loadBookings();
    }
  }, [user, authLoading, router]);

  const loadBookings = async () => {
    if (!user) return;

    try {
      setLoading(true);
      setError(null);

      // Hitta owner_id för inloggad användare
      const { data: ownerData, error: ownerError } = await supabase
        .from("owners")
        .select("id")
        .eq("user_id", user.id)
        .single();

      if (ownerError || !ownerData) {
        setError("Kunde inte hitta din kundprofil");
        setLoading(false);
        return;
      }

      // Hämta alla bokningar för denna owner
      const { data, error: bookingsError } = await supabase
        .from("bookings")
        .select(
          `
          id,
          start_date,
          end_date,
          status,
          total_price,
          discount_amount,
          notes,
          created_at,
          dogs (
            id,
            name,
            breed
          )
        `
        )
        .eq("owner_id", ownerData.id)
        .order("start_date", { ascending: false });

      if (bookingsError) {
        console.error("Fel vid hämtning av bokningar:", bookingsError);
        setError("Kunde inte hämta bokningar");
        return;
      }

      setBookings(data || []);
    } catch (err) {
      console.error("Oväntat fel:", err);
      setError("Ett oväntat fel uppstod");
    } finally {
      setLoading(false);
    }
  };

  const handleCancelClick = (booking: Booking) => {
    setSelectedBooking(booking);

    // Beräkna avbokningsavgift
    const calc = calculateCancellationFee(
      booking.start_date,
      booking.total_price || 0
    );

    setCancellationCalc(calc);
    setShowCancelModal(true);
  };

  const handleCancelConfirm = async () => {
    if (!selectedBooking) return;

    setCancelling(selectedBooking.id);

    try {
      const response = await fetch("/api/bookings/cancel", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          bookingId: selectedBooking.id,
          reason: cancelReason || "Avbokad av kund",
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        alert(data.error || "Kunde inte avboka bokningen");
        return;
      }

      alert(
        `Bokningen har avbokats!\n\n${data.calculation.refundAmount > 0 ? `Återbetalning: ${data.calculation.refundAmount} kr` : "Ingen återbetalning"}`
      );

      // Stäng modal och ladda om bokningar
      setShowCancelModal(false);
      setSelectedBooking(null);
      setCancelReason("");
      loadBookings();
    } catch (err) {
      console.error("Fel vid avbokning:", err);
      alert("Ett oväntat fel uppstod");
    } finally {
      setCancelling(null);
    }
  };

  const getStatusBadge = (status: string | null) => {
    if (!status) return null;

    const styles =
      {
        pending: "bg-yellow-100 text-yellow-800 border-yellow-300",
        confirmed: "bg-blue-100 text-blue-800 border-blue-300",
        checked_in: "bg-green-100 text-green-800 border-green-300",
        checked_out: "bg-gray-100 text-gray-800 border-gray-300",
        cancelled: "bg-red-100 text-red-800 border-red-300",
      }[status] || "bg-gray-100 text-gray-800 border-gray-300";

    const labels = {
      pending: "Väntar på godkännande",
      confirmed: "Bekräftad",
      checked_in: "Aktiv",
      checked_out: "Slutförd",
      cancelled: "Avbokad",
    };

    return (
      <span
        className={`px-3 py-1 rounded-full text-xs font-medium border ${styles}`}
      >
        {labels[status as keyof typeof labels] || status}
      </span>
    );
  };

  const getFilteredBookings = () => {
    const today = new Date().toISOString().split("T")[0];

    return bookings.filter((booking) => {
      if (filter === "upcoming") {
        return booking.status !== "cancelled" && booking.start_date >= today;
      }
      if (filter === "past") {
        return (
          (booking.status === "checked_out" || booking.end_date < today) &&
          booking.status !== "cancelled"
        );
      }
      if (filter === "cancelled") {
        return booking.status === "cancelled";
      }
      return true; // "all"
    });
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Laddar dina bokningar...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-white p-8 rounded-lg shadow-md max-w-md">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-center mb-2">Något gick fel</h2>
          <p className="text-gray-600 text-center mb-4">{error}</p>
          <button
            onClick={() => loadBookings()}
            className="w-full bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
          >
            Försök igen
          </button>
        </div>
      </div>
    );
  }

  const filteredBookings = getFilteredBookings();

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <Link
            href="/kundportal/dashboard"
            className="inline-flex items-center text-blue-600 hover:text-blue-700 mb-4"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Tillbaka till översikt
          </Link>

          <h1 className="text-3xl font-bold text-gray-900">Mina bokningar</h1>
          <p className="mt-2 text-gray-600">
            Se alla dina bokningar och fakturor
          </p>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex space-x-4">
            {[
              {
                key: "upcoming",
                label: "Kommande",
                count: bookings.filter(
                  (b) =>
                    b.status !== "cancelled" &&
                    b.start_date >= new Date().toISOString().split("T")[0]
                ).length,
              },
              {
                key: "past",
                label: "Tidigare",
                count: bookings.filter(
                  (b) =>
                    (b.status === "checked_out" ||
                      b.end_date < new Date().toISOString().split("T")[0]) &&
                    b.status !== "cancelled"
                ).length,
              },
              {
                key: "cancelled",
                label: "Avbokade",
                count: bookings.filter((b) => b.status === "cancelled").length,
              },
              { key: "all", label: "Alla", count: bookings.length },
            ].map((tab) => (
              <button
                key={tab.key}
                onClick={() => setFilter(tab.key as any)}
                className={`px-4 py-3 border-b-2 font-medium text-sm transition-colors ${
                  filter === tab.key
                    ? "border-blue-600 text-blue-600"
                    : "border-transparent text-gray-500 hover:text-gray-700"
                }`}
              >
                {tab.label} ({tab.count})
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Bookings List */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {filteredBookings.length === 0 ? (
          <div className="bg-white rounded-lg shadow-sm p-12 text-center">
            <Calendar className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              Inga bokningar att visa
            </h3>
            <p className="text-gray-600 mb-6">
              {filter === "upcoming" && "Du har inga kommande bokningar"}
              {filter === "past" && "Du har inga tidigare bokningar"}
              {filter === "cancelled" && "Du har inga avbokade bokningar"}
              {filter === "all" && "Du har inga bokningar än"}
            </p>
            <Link
              href="/kundportal/ny-bokning"
              className="inline-block bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700"
            >
              Skapa ny bokning
            </Link>
          </div>
        ) : (
          <div className="space-y-6">
            {filteredBookings.map((booking) => (
              <div
                key={booking.id}
                className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-shadow"
              >
                <div className="p-6">
                  {/* Header */}
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center space-x-3">
                      <div className="bg-blue-100 p-3 rounded-lg">
                        <Dog className="w-6 h-6 text-blue-600" />
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900">
                          {booking.dogs?.name || "Okänd hund"}
                        </h3>
                        <p className="text-sm text-gray-600">
                          {booking.dogs?.breed || "Ingen ras angiven"}
                        </p>
                      </div>
                    </div>
                    {getStatusBadge(booking.status)}
                  </div>

                  {/* Dates */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                    <div className="flex items-center space-x-2 text-gray-700">
                      <Calendar className="w-5 h-5 text-gray-400" />
                      <div>
                        <p className="text-sm font-medium">Incheckning</p>
                        <p className="text-sm">
                          {format(new Date(booking.start_date), "dd MMM yyyy", {
                            locale: sv,
                          })}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2 text-gray-700">
                      <Clock className="w-5 h-5 text-gray-400" />
                      <div>
                        <p className="text-sm font-medium">Utcheckning</p>
                        <p className="text-sm">
                          {format(new Date(booking.end_date), "dd MMM yyyy", {
                            locale: sv,
                          })}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Location & Price */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                    {booking.bed_location && (
                      <div className="flex items-center space-x-2 text-gray-700">
                        <MapPin className="w-5 h-5 text-gray-400" />
                        <div>
                          <p className="text-sm font-medium">Plats</p>
                          <p className="text-sm">{booking.bed_location}</p>
                        </div>
                      </div>
                    )}
                    <div className="flex items-center space-x-2 text-gray-700">
                      <DollarSign className="w-5 h-5 text-gray-400" />
                      <div>
                        <p className="text-sm font-medium">Pris</p>
                        <p className="text-sm font-semibold">
                          {booking.total_price || 0} kr
                          {booking.discount_amount &&
                            booking.discount_amount > 0 && (
                              <span className="text-green-600 ml-2 text-xs">
                                (-{booking.discount_amount} kr rabatt)
                              </span>
                            )}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Notes */}
                  {booking.special_requests && (
                    <div className="mb-4 p-3 bg-gray-50 rounded-md">
                      <p className="text-sm font-medium text-gray-700 mb-1">
                        Specialönskemål:
                      </p>
                      <p className="text-sm text-gray-600">
                        {booking.special_requests}
                      </p>
                    </div>
                  )}

                  {/* Cancellation info */}
                  {booking.status === "cancelled" && booking.cancelled_at && (
                    <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md">
                      <p className="text-sm font-medium text-red-800 mb-1">
                        Avbokad{" "}
                        {format(
                          new Date(booking.cancelled_at),
                          "dd MMM yyyy HH:mm",
                          { locale: sv }
                        )}
                      </p>
                      {booking.cancellation_reason && (
                        <p className="text-sm text-red-700">
                          {booking.cancellation_reason}
                        </p>
                      )}
                    </div>
                  )}

                  {/* Actions */}
                  <div className="flex items-center justify-between pt-4 border-t">
                    <div className="flex items-center space-x-4 text-sm">
                      {booking.prepayment_invoice && (
                        <Link
                          href={`/kundportal/fakturor/${booking.prepayment_invoice.id}`}
                          className="text-blue-600 hover:text-blue-700 flex items-center"
                        >
                          <FileText className="w-4 h-4 mr-1" />
                          Förskottsfaktura
                        </Link>
                      )}
                      {booking.afterpayment_invoice && (
                        <Link
                          href={`/kundportal/fakturor/${booking.afterpayment_invoice.id}`}
                          className="text-blue-600 hover:text-blue-700 flex items-center"
                        >
                          <FileText className="w-4 h-4 mr-1" />
                          Slutfaktura
                        </Link>
                      )}
                    </div>

                    {booking.status &&
                      canCustomerCancel(booking.status, booking.start_date) && (
                        <button
                          onClick={() => handleCancelClick(booking)}
                          className="px-4 py-2 text-sm font-medium text-red-600 border border-red-600 rounded-md hover:bg-red-50 transition-colors"
                        >
                          Avboka bokning
                        </button>
                      )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Cancellation Modal */}
      {showCancelModal && selectedBooking && cancellationCalc && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
            <div className="p-6">
              <h3 className="text-xl font-bold text-gray-900 mb-4">
                Avboka bokning
              </h3>

              <div className="mb-4">
                <p className="text-gray-700 mb-2">
                  <strong>Hund:</strong> {selectedBooking.dogs?.name}
                </p>
                <p className="text-gray-700 mb-2">
                  <strong>Period:</strong>{" "}
                  {format(new Date(selectedBooking.start_date), "dd MMM", {
                    locale: sv,
                  })}{" "}
                  -{" "}
                  {format(new Date(selectedBooking.end_date), "dd MMM yyyy", {
                    locale: sv,
                  })}
                </p>
              </div>

              <div
                className={`p-4 rounded-md mb-4 ${
                  cancellationCalc.cancellationFee === 0
                    ? "bg-green-50 border border-green-200"
                    : "bg-yellow-50 border border-yellow-200"
                }`}
              >
                <p className="text-sm font-medium mb-2">
                  {cancellationCalc.daysUntilStart} dagar kvar till incheckning
                </p>
                <p className="text-sm mb-1">
                  <strong>Avbokningsavgift:</strong>{" "}
                  {cancellationCalc.cancellationFee} kr
                </p>
                <p className="text-sm">
                  <strong>Återbetalning:</strong>{" "}
                  {cancellationCalc.refundAmount} kr
                </p>
                <p className="text-xs text-gray-600 mt-2">
                  {cancellationCalc.policyApplied}
                </p>
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Anledning (frivilligt)
                </label>
                <textarea
                  value={cancelReason}
                  onChange={(e) => setCancelReason(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  rows={3}
                  placeholder="T.ex. ändrade resplaner, hunden är sjuk..."
                />
              </div>

              <div className="flex space-x-3">
                <button
                  onClick={() => {
                    setShowCancelModal(false);
                    setSelectedBooking(null);
                    setCancelReason("");
                  }}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                  disabled={!!cancelling}
                >
                  Avbryt
                </button>
                <button
                  onClick={handleCancelConfirm}
                  disabled={!!cancelling}
                  className="flex-1 px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {cancelling ? "Avbokar..." : "Bekräfta avbokning"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
