"use client";

import { useEffect, useState, Suspense } from "react";
import { createClient } from "@/lib/supabase/client";
import { useAuth } from "@/app/context/AuthContext";
import { useSearchParams } from "next/navigation";
import {
  Calendar,
  Dog,
  ArrowLeft,
  Search,
  Printer,
  CheckCircle,
  Clock,
  AlertCircle,
} from "lucide-react";
import Link from "next/link";
import DogRoomCard from "@/components/DogRoomCard";
import { format } from "date-fns";
import { sv } from "date-fns/locale";

interface Booking {
  id: string;
  start_date: string;
  end_date: string;
  status: string;
  rooms: {
    name: string | null;
  } | null;
  dogs: {
    id: string;
    name: string;
    breed: string | null;
    birth_date: string | null;
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
    heightcm: number | null;
    gender: string | null;
    owners: {
      full_name: string | null;
      phone: string | null;
      email: string | null;
      contact_person2_name: string | null;
      contact_person2_phone: string | null;
    } | null;
  } | null;
}

// Wrapper component to handle Suspense for useSearchParams
function RumskortContent() {
  const supabase = createClient();
  const { user, currentOrgId, loading: authLoading } = useAuth();
  const searchParams = useSearchParams();
  const bookingIdFromUrl = searchParams.get("booking");

  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  useEffect(() => {
    if (currentOrgId && !authLoading) {
      loadBookings();
    } else if (!authLoading && !currentOrgId) {
      setLoading(false);
    }
  }, [currentOrgId, authLoading]);

  // If booking ID is in URL, auto-open that booking
  useEffect(() => {
    if (bookingIdFromUrl && bookings.length > 0) {
      const booking = bookings.find((b) => b.id === bookingIdFromUrl);
      if (booking) {
        setSelectedBooking(booking);
      }
    }
  }, [bookingIdFromUrl, bookings]);

  async function loadBookings() {
    if (!currentOrgId) return;

    try {
      setLoading(true);

      // Get today and 7 days ago
      const today = new Date();
      const oneWeekAgo = new Date();
      oneWeekAgo.setDate(today.getDate() - 7);
      const oneMonthAhead = new Date();
      oneMonthAhead.setMonth(today.getMonth() + 1);

      const { data, error } = await supabase
        .from("bookings")
        .select(
          `
          id,
          start_date,
          end_date,
          status,
          rooms (name),
          dogs (
            id,
            name,
            breed,
            birth_date,
            photo_url,
            allergies,
            medications,
            special_needs,
            behavior_notes,
            food_type,
            food_amount,
            food_times,
            food_brand,
            can_share_room,
            can_be_with_other_dogs,
            heightcm,
            gender,
            owners (
              full_name,
              phone,
              email,
              contact_person2_name,
              contact_person2_phone
            )
          )
        `
        )
        .eq("org_id", currentOrgId)
        .in("status", ["confirmed", "checked_in", "pending"])
        .gte("start_date", oneWeekAgo.toISOString().split("T")[0])
        .lte("start_date", oneMonthAhead.toISOString().split("T")[0])
        .order("start_date", { ascending: true });

      if (error) {
        console.error("Error loading bookings:", error);
        throw error;
      }

      setBookings((data as any) || []);
    } catch (err) {
      console.error("Failed to load bookings:", err);
    } finally {
      setLoading(false);
    }
  }

  // Filter bookings
  const filteredBookings = bookings.filter((booking) => {
    // Status filter
    if (statusFilter !== "all" && booking.status !== statusFilter) {
      return false;
    }

    // Search filter
    if (searchTerm) {
      const search = searchTerm.toLowerCase();
      const dogName = booking.dogs?.name?.toLowerCase() || "";
      const ownerName = booking.dogs?.owners?.full_name?.toLowerCase() || "";
      const roomName = booking.rooms?.name?.toLowerCase() || "";

      return (
        dogName.includes(search) ||
        ownerName.includes(search) ||
        roomName.includes(search)
      );
    }

    return true;
  });

  // Status badge colors
  function getStatusBadge(status: string) {
    switch (status) {
      case "checked_in":
        return (
          <span className="inline-flex items-center gap-1 px-2 py-1 bg-green-100 text-green-700 rounded-full text-xs font-medium">
            <CheckCircle className="w-3 h-3" /> Incheckad
          </span>
        );
      case "confirmed":
        return (
          <span className="inline-flex items-center gap-1 px-2 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-medium">
            <Clock className="w-3 h-3" /> Bekräftad
          </span>
        );
      case "pending":
        return (
          <span className="inline-flex items-center gap-1 px-2 py-1 bg-amber-100 text-amber-700 rounded-full text-xs font-medium">
            <AlertCircle className="w-3 h-3" /> Väntar
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2 py-1 bg-gray-100 text-gray-700 rounded-full text-xs font-medium">
            {status}
          </span>
        );
    }
  }

  if (loading || authLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#2c7a4c] mx-auto mb-4"></div>
          <p className="text-gray-600">Laddar bokningar...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-[#2c7a4c] to-[#3d9960] text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex items-center gap-4 mb-4">
            <Link
              href="/hundpensionat"
              className="text-white/80 hover:text-white transition-colors"
            >
              <ArrowLeft className="w-6 h-6" />
            </Link>
            <div>
              <h1 className="text-2xl font-bold flex items-center gap-3">
                <Printer className="w-8 h-8" />
                Rumskort för utskrift
              </h1>
              <p className="text-white/80 mt-1">
                Välj en bokning för att skriva ut dörrskylten
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 mb-6">
          <div className="flex flex-col sm:flex-row gap-4">
            {/* Search */}
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Sök hund, ägare eller rum..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#2c7a4c] focus:border-[#2c7a4c]"
              />
            </div>

            {/* Status filter */}
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#2c7a4c] focus:border-[#2c7a4c]"
            >
              <option value="all">Alla statusar</option>
              <option value="checked_in">Incheckade</option>
              <option value="confirmed">Bekräftade</option>
              <option value="pending">Väntande</option>
            </select>
          </div>
        </div>

        {/* Bookings list */}
        {filteredBookings.length === 0 ? (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
            <Dog className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              Inga bokningar hittades
            </h3>
            <p className="text-gray-500">
              {searchTerm
                ? "Prova med en annan sökterm"
                : "Det finns inga kommande eller aktiva bokningar"}
            </p>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {filteredBookings.map((booking) => (
              <div
                key={booking.id}
                className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-shadow"
              >
                <div className="p-4">
                  {/* Dog info */}
                  <div className="flex items-start gap-3 mb-3">
                    <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center flex-shrink-0 overflow-hidden">
                      {booking.dogs?.photo_url ? (
                        <img
                          src={booking.dogs.photo_url}
                          alt={booking.dogs.name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <Dog className="w-6 h-6 text-gray-400" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-gray-900 truncate">
                        {booking.dogs?.name || "Okänd hund"}
                      </h3>
                      <p className="text-sm text-gray-500 truncate">
                        {booking.dogs?.breed || "Okänd ras"}
                      </p>
                    </div>
                    {getStatusBadge(booking.status)}
                  </div>

                  {/* Dates */}
                  <div className="flex items-center gap-2 text-sm text-gray-600 mb-3">
                    <Calendar className="w-4 h-4" />
                    <span>
                      {format(new Date(booking.start_date), "d MMM", {
                        locale: sv,
                      })}{" "}
                      –{" "}
                      {format(new Date(booking.end_date), "d MMM yyyy", {
                        locale: sv,
                      })}
                    </span>
                  </div>

                  {/* Room */}
                  {booking.rooms?.name && (
                    <div className="text-sm text-gray-600 mb-3">
                      🏠 Rum:{" "}
                      <span className="font-medium">{booking.rooms.name}</span>
                    </div>
                  )}

                  {/* Owner */}
                  <div className="text-sm text-gray-600 mb-4">
                    👤 {booking.dogs?.owners?.full_name || "Okänd ägare"}
                  </div>

                  {/* Print button */}
                  <button
                    onClick={() => setSelectedBooking(booking)}
                    className="w-full flex items-center justify-center gap-2 bg-[#2c7a4c] text-white px-4 py-2 rounded-lg font-medium hover:bg-[#245e3c] transition-colors"
                  >
                    <Printer className="w-4 h-4" />
                    Skriv ut rumskort
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Room Card Modal */}
      {selectedBooking && (
        <DogRoomCard
          booking={selectedBooking}
          onClose={() => setSelectedBooking(null)}
        />
      )}
    </div>
  );
}

// Main export with Suspense boundary
export default function RumskortPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#2c7a4c] mx-auto mb-4"></div>
            <p className="text-gray-600">Laddar...</p>
          </div>
        </div>
      }
    >
      <RumskortContent />
    </Suspense>
  );
}
