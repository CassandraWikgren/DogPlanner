"use client";

import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/app/context/AuthContext";
import { ChevronLeft, ChevronRight, Plus } from "lucide-react";
import Link from "next/link";
import type { Database } from "@/types/database";

// Felkoder enligt systemet
const ERROR_CODES = {
  DATABASE_CONNECTION: "[ERR-1001]",
  PDF_EXPORT: "[ERR-2001]",
  REALTIME: "[ERR-3001]",
  VALIDATION: "[ERR-4001]",
} as const;

// === TYPER ===
type Booking = Database["public"]["Tables"]["bookings"]["Row"] & {
  dogs?:
    | (Database["public"]["Tables"]["dogs"]["Row"] & {
        owners?: Database["public"]["Tables"]["owners"]["Row"] | null;
      })
    | null;
  rooms?: Database["public"]["Tables"]["rooms"]["Row"] | null;
};
type Room = Database["public"]["Tables"]["rooms"]["Row"];

// 🎨 Färgkodning för beläggning enligt specifikation
const OCCUPANCY_COLORS = {
  inne: "bg-green-100 border-green-400 text-green-800", // Grön = inne
  checkOut: "bg-red-100 border-red-400 text-red-800", // Röd = checkar ut idag
  checkIn: "bg-yellow-100 border-yellow-400 text-yellow-800", // Gul = anländer idag
  free: "bg-gray-100 border-gray-300 text-gray-600", // Ledigt
} as const;

interface DayData {
  date: Date;
  dateString: string;
  bookings: Booking[];
  checkIns: Booking[];
  checkOuts: Booking[];
  occupancy: number; // 0-100%
  isToday: boolean;
  isCurrentMonth: boolean;
}

export default function KalenderPage() {
  const { user, loading: authLoading } = useAuth();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [roomFilter, setRoomFilter] = useState<string>("all");

  // Kalendermånad navigation
  const [currentMonth, setCurrentMonth] = useState(() => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), 1);
  });

  // === LADDA DATA ===
  useEffect(() => {
    if (!user || authLoading) return;
    loadCalendarData();
  }, [user, authLoading, currentMonth]);

  async function loadCalendarData() {
    setLoading(true);
    setError(null);

    try {
      const orgId = user?.user_metadata?.org_id || user?.id;

      // Datum-range för månaden +/- 1 vecka
      const startOfMonth = new Date(currentMonth);
      startOfMonth.setDate(startOfMonth.getDate() - 7);
      const endOfMonth = new Date(
        currentMonth.getFullYear(),
        currentMonth.getMonth() + 1,
        0
      );
      endOfMonth.setDate(endOfMonth.getDate() + 7);

      console.log(
        `[Kalender] Laddar data för: ${startOfMonth.toISOString()} - ${endOfMonth.toISOString()}`
      );

      const [roomsRes, bookingsRes] = await Promise.all([
        (supabase as any)
          .from("rooms")
          .select("id, name, capacity_m2, room_type")
          .eq("org_id", orgId)
          .in("room_type", ["boarding", "both"])
          .order("name"),

        (supabase as any)
          .from("bookings")
          .select(
            `
            id, start_date, end_date, status, dog_id, room_id,
            dogs(id, name, breed, heightcm, owners(id, full_name, phone)),
            rooms(id, name, capacity_m2)
          `
          )
          .eq("org_id", orgId)
          .gte("start_date", startOfMonth.toISOString())
          .lte("end_date", endOfMonth.toISOString())
          .order("start_date"),
      ]);

      if (roomsRes.error) throw new Error(`Rooms: ${roomsRes.error.message}`);
      if (bookingsRes.error)
        throw new Error(`Bookings: ${bookingsRes.error.message}`);

      setRooms(roomsRes.data || []);
      setBookings(bookingsRes.data || []);

      console.log(
        `[Kalender] Laddad: ${roomsRes.data?.length} rum, ${bookingsRes.data?.length} bokningar`
      );
    } catch (err: any) {
      console.error(
        `${ERROR_CODES.DATABASE_CONNECTION} Fel vid kalender-laddning:`,
        err
      );
      setError(`${ERROR_CODES.DATABASE_CONNECTION} ${err.message}`);
    } finally {
      setLoading(false);
    }
  }

  // === KALENDER-LOGIC ===
  const calendarDays = useMemo(() => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const today = new Date();

    // Börja från måndag före första dagen
    const startDate = new Date(firstDay);
    startDate.setDate(startDate.getDate() - ((firstDay.getDay() + 6) % 7));

    // Avsluta på söndag efter sista dagen
    const endDate = new Date(lastDay);
    endDate.setDate(endDate.getDate() + ((7 - lastDay.getDay()) % 7));

    const days: DayData[] = [];
    const currentDate = new Date(startDate);

    while (currentDate <= endDate) {
      const dateString = currentDate.toISOString().split("T")[0];

      // Hitta bokningar för detta datum
      const dayBookings = bookings.filter((booking) => {
        const start = new Date(booking.start_date).toISOString().split("T")[0];
        const end = new Date(booking.end_date).toISOString().split("T")[0];
        return dateString >= start && dateString <= end;
      });

      // Filter per rum om valt
      const filteredBookings =
        roomFilter === "all"
          ? dayBookings
          : dayBookings.filter((b) => b.room_id === roomFilter);

      // Check-ins och check-outs
      const checkIns = filteredBookings.filter(
        (b) => new Date(b.start_date).toISOString().split("T")[0] === dateString
      );
      const checkOuts = filteredBookings.filter(
        (b) => new Date(b.end_date).toISOString().split("T")[0] === dateString
      );

      // Beräkna beläggning (approximation)
      const totalCapacity =
        roomFilter === "all"
          ? rooms.reduce((sum, r) => sum + r.capacity_m2, 0)
          : rooms.find((r) => r.id === roomFilter)?.capacity_m2 || 1;

      const usedCapacity = filteredBookings.reduce((sum, b) => {
        const dogSize = b.dogs?.heightcm || 30; // Default storlek
        return sum + (dogSize > 50 ? 12 : 8); // Stora vs små hundar
      }, 0);

      const occupancy = Math.min(
        100,
        Math.round((usedCapacity / totalCapacity) * 100)
      );

      days.push({
        date: new Date(currentDate),
        dateString,
        bookings: filteredBookings,
        checkIns,
        checkOuts,
        occupancy,
        isToday: dateString === today.toISOString().split("T")[0],
        isCurrentMonth: currentDate.getMonth() === month,
      });

      currentDate.setDate(currentDate.getDate() + 1);
    }

    return days;
  }, [currentMonth, bookings, rooms, roomFilter]);

  // === NAVIGATION ===
  function navigateMonth(direction: "prev" | "next") {
    const newMonth = new Date(currentMonth);
    newMonth.setMonth(newMonth.getMonth() + (direction === "next" ? 1 : -1));
    setCurrentMonth(newMonth);
  }

  function getOccupancyColor(
    occupancy: number,
    hasCheckIns: boolean,
    hasCheckOuts: boolean
  ) {
    // Prioritera enligt spec: Röd (ut), Gul (in), Grön (inne)
    if (hasCheckOuts) return OCCUPANCY_COLORS.checkOut; // Röd = checkar ut idag
    if (hasCheckIns) return OCCUPANCY_COLORS.checkIn; // Gul = anländer idag
    if (occupancy > 0) return OCCUPANCY_COLORS.inne; // Grön = inne
    return OCCUPANCY_COLORS.free; // Grå = ledigt
  }

  // === SELECTED DAY DETAILS ===
  const selectedDayData = selectedDate
    ? calendarDays.find((d) => d.dateString === selectedDate)
    : null;

  // === LIVE STATS ===
  const stats = useMemo(() => {
    const today = new Date().toISOString().split("T")[0];
    const todayBookings = bookings.filter((b) => {
      const start = new Date(b.start_date).toISOString().split("T")[0];
      const end = new Date(b.end_date).toISOString().split("T")[0];
      return today >= start && today <= end;
    });

    const todayCheckIns = bookings.filter(
      (b) => new Date(b.start_date).toISOString().split("T")[0] === today
    );

    const todayCheckOuts = bookings.filter(
      (b) => new Date(b.end_date).toISOString().split("T")[0] === today
    );

    return {
      hundarInne: todayBookings.length,
      ankomsterIdag: todayCheckIns.length,
      avresorIdag: todayCheckOuts.length,
      totalaBokningar: bookings.length,
      aktuellaRum: rooms.length,
      genomsnittBelaggning: Math.round(
        calendarDays.reduce((sum, day) => sum + day.occupancy, 0) /
          (calendarDays.length || 1)
      ),
    };
  }, [bookings, rooms, calendarDays]);

  // === RENDER ===
  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#2c7a4c] mr-4"></div>
        <p>Laddar kalender...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section - Samma som Dashboard, Hunddagis, Ekonomi, Hundpensionat */}
      <div
        className="relative bg-cover bg-center pt-20 pb-28"
        style={{
          backgroundImage: `linear-gradient(rgba(44, 122, 76, 0.88), rgba(44, 122, 76, 0.88)), url('/Hero.jpeg')`,
        }}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
            📅 Pensionatkalender
          </h1>
          <p className="text-lg text-white/90 max-w-2xl mx-auto">
            Översikt av bokningar och beläggning med färgkoder för
            in/utcheckning
          </p>
        </div>
      </div>

      {/* Floating Stats Cards - Moderna kort som överlappar hero */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-12 mb-8">
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          <div className="bg-white rounded-xl shadow-lg p-6 border border-green-200 hover:shadow-xl transition-shadow">
            <p className="text-sm text-gray-600 mb-1">Hundar inne</p>
            <p className="text-3xl font-bold text-green-600">
              {stats.hundarInne}
            </p>
          </div>

          <div className="bg-white rounded-xl shadow-lg p-6 border border-yellow-200 hover:shadow-xl transition-shadow">
            <p className="text-sm text-gray-600 mb-1">Ankomster idag</p>
            <p className="text-3xl font-bold text-yellow-600">
              {stats.ankomsterIdag}
            </p>
          </div>

          <div className="bg-white rounded-xl shadow-lg p-6 border border-red-200 hover:shadow-xl transition-shadow">
            <p className="text-sm text-gray-600 mb-1">Avresor idag</p>
            <p className="text-3xl font-bold text-red-600">
              {stats.avresorIdag}
            </p>
          </div>

          <div className="bg-white rounded-xl shadow-lg p-6 border border-blue-200 hover:shadow-xl transition-shadow">
            <p className="text-sm text-gray-600 mb-1">Totala bokningar</p>
            <p className="text-3xl font-bold text-blue-600">
              {stats.totalaBokningar}
            </p>
          </div>

          <div className="bg-white rounded-xl shadow-lg p-6 border border-purple-200 hover:shadow-xl transition-shadow">
            <p className="text-sm text-gray-600 mb-1">Aktiva rum</p>
            <p className="text-3xl font-bold text-purple-600">
              {stats.aktuellaRum}
            </p>
          </div>

          <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-200 hover:shadow-xl transition-shadow">
            <p className="text-sm text-gray-600 mb-1">Ø Beläggning</p>
            <p className="text-3xl font-bold text-[#2c7a4c]">
              {stats.genomsnittBelaggning}%
            </p>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-12">
        {/* Kontroller */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6 border border-gray-200">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
              {/* Room Filter */}
              <select
                value={roomFilter}
                onChange={(e) => setRoomFilter(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#2c7a4c] focus:border-transparent"
              >
                <option value="all">Alla rum</option>
                {rooms.map((room) => (
                  <option key={room.id} value={room.id}>
                    {room.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex gap-2 w-full md:w-auto">
              <Link
                href="/hundpensionat"
                className="flex items-center justify-center gap-2 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
              >
                Tillbaka
              </Link>
              <Link
                href="/hundpensionat/nybokning"
                className="flex items-center justify-center gap-2 px-4 py-2 bg-[#2c7a4c] text-white rounded-lg hover:bg-[#236139] transition-colors"
              >
                <Plus size={16} />
                <span className="hidden sm:inline">Ny bokning</span>
              </Link>
            </div>
          </div>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-lg mb-6">
            {error}
          </div>
        )}

        <div className="grid grid-cols-1 xl:grid-cols-4 gap-6">
          {/* Kalenderdel */}
          <div className="xl:col-span-3">
            <div className="bg-white rounded-xl shadow-lg border border-gray-200">
              {/* Kalender Header */}
              <div className="flex items-center justify-between p-6 border-b border-gray-200">
                <div className="flex items-center gap-4">
                  <button
                    onClick={() => navigateMonth("prev")}
                    className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                  >
                    <ChevronLeft className="h-5 w-5 text-gray-600" />
                  </button>

                  <h2 className="text-xl font-semibold text-gray-800">
                    {currentMonth.toLocaleDateString("sv-SE", {
                      month: "long",
                      year: "numeric",
                    })}
                  </h2>

                  <button
                    onClick={() => navigateMonth("next")}
                    className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                  >
                    <ChevronRight className="h-5 w-5 text-gray-600" />
                  </button>
                </div>

                <button
                  onClick={() => setCurrentMonth(new Date())}
                  className="text-sm text-[#2c7a4c] hover:text-[#236139] font-medium transition-colors"
                >
                  Idag
                </button>
              </div>

              {/* Veckodagar */}
              <div className="grid grid-cols-7 border-b border-gray-200 bg-gray-50">
                {["Mån", "Tis", "Ons", "Tor", "Fre", "Lör", "Sön"].map(
                  (day) => (
                    <div
                      key={day}
                      className="p-3 text-center text-sm font-semibold text-gray-700 border-r border-gray-200 last:border-r-0"
                    >
                      {day}
                    </div>
                  )
                )}
              </div>

              {/* Kalenderdagar */}
              <div className="grid grid-cols-7">
                {calendarDays.map((day) => (
                  <button
                    key={day.dateString}
                    onClick={() => setSelectedDate(day.dateString)}
                    className={`
                      h-24 p-2 border-r border-b border-gray-200 last:border-r-0 hover:bg-gray-50 text-left relative transition-colors
                      ${
                        !day.isCurrentMonth
                          ? "bg-gray-50 text-gray-400"
                          : "bg-white"
                      }
                      ${
                        day.isToday
                          ? "bg-blue-50 border-blue-300 ring-1 ring-blue-300"
                          : ""
                      }
                      ${
                        selectedDate === day.dateString
                          ? "ring-2 ring-[#2c7a4c] z-10"
                          : ""
                      }
                    `}
                  >
                    {/* Datum */}
                    <div
                      className={`text-sm font-medium mb-1 ${
                        day.isToday
                          ? "text-blue-600 font-bold"
                          : "text-gray-700"
                      }`}
                    >
                      {day.date.getDate()}
                    </div>

                    {/* Status indicators med spec-färger */}
                    <div className="space-y-1">
                      {day.checkIns.length > 0 && (
                        <div className="text-xs px-1 py-0.5 bg-yellow-100 text-yellow-800 rounded border border-yellow-400">
                          📥 {day.checkIns.length}
                        </div>
                      )}
                      {day.checkOuts.length > 0 && (
                        <div className="text-xs px-1 py-0.5 bg-red-100 text-red-800 rounded border border-red-400">
                          📤 {day.checkOuts.length}
                        </div>
                      )}
                      {day.bookings.length > 0 &&
                        !day.checkIns.length &&
                        !day.checkOuts.length && (
                          <div className="text-xs px-1 py-0.5 bg-green-100 text-green-800 rounded border border-green-400">
                            {day.bookings.length} inne
                          </div>
                        )}
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Detaljpanel */}
          <div className="xl:col-span-1">
            <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6">
              <h3 className="text-lg font-semibold mb-4 text-gray-800">
                {selectedDayData
                  ? `${selectedDayData.date.toLocaleDateString("sv-SE", {
                      weekday: "long",
                      day: "numeric",
                      month: "long",
                    })}`
                  : "Välj en dag"}
              </h3>

              {selectedDayData ? (
                <div className="space-y-4">
                  {/* Sammanfattning */}
                  <div className="bg-gray-50 rounded-lg p-3 border border-gray-200">
                    <div className="text-sm space-y-2">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Bokningar:</span>
                        <span className="font-semibold text-gray-900">
                          {selectedDayData.bookings.length}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Incheckning:</span>
                        <span className="font-semibold text-yellow-700">
                          {selectedDayData.checkIns.length}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Utcheckning:</span>
                        <span className="font-semibold text-red-700">
                          {selectedDayData.checkOuts.length}
                        </span>
                      </div>
                      <div className="flex justify-between border-t border-gray-300 pt-2">
                        <span className="text-gray-600">Beläggning:</span>
                        <span className="font-semibold text-[#2c7a4c]">
                          {selectedDayData.occupancy}%
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Bokningar */}
                  {selectedDayData.bookings.length > 0 ? (
                    <div className="space-y-2">
                      <h4 className="font-medium text-sm text-gray-700">
                        Bokningar
                      </h4>
                      <div className="max-h-64 overflow-y-auto space-y-2">
                        {selectedDayData.bookings.map((booking) => (
                          <div
                            key={booking.id}
                            className="border border-gray-200 rounded-lg p-3 text-sm hover:bg-gray-50 transition-colors"
                          >
                            <div className="font-medium text-gray-900">
                              {booking.dogs?.name || "Okänd hund"}
                            </div>
                            <div className="text-gray-600">
                              {booking.dogs?.owners?.full_name || "Okänd ägare"}
                            </div>
                            <div className="text-xs text-gray-500 mt-1">
                              Rum: {booking.rooms?.name || "Okänt rum"}
                            </div>
                            <div className="text-xs text-gray-500">
                              Status:{" "}
                              <span className="capitalize">
                                {booking.status}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <p className="text-sm text-gray-500">
                      Inga bokningar denna dag
                    </p>
                  )}

                  {/* Snabb-bokning */}
                  <Link
                    href={`/hundpensionat/nybokning?date=${selectedDayData.dateString}`}
                    className="block w-full text-center bg-[#2c7a4c] hover:bg-[#236139] text-white py-2 px-4 rounded-lg text-sm font-medium transition-colors"
                  >
                    Boka denna dag
                  </Link>
                </div>
              ) : (
                <p className="text-sm text-gray-500">
                  Klicka på en dag i kalendern för att se detaljer om bokningar
                  och beläggning.
                </p>
              )}
            </div>

            {/* Legend - Uppdaterad enligt spec */}
            <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6 mt-4">
              <h4 className="font-semibold mb-3 text-gray-800">Färgkoder</h4>
              <div className="space-y-2 text-sm">
                <div className="flex items-center gap-2">
                  <div
                    className={`w-4 h-4 rounded ${OCCUPANCY_COLORS.checkIn}`}
                  ></div>
                  <span>🟡 Gul = Anländer idag</span>
                </div>
                <div className="flex items-center gap-2">
                  <div
                    className={`w-4 h-4 rounded ${OCCUPANCY_COLORS.checkOut}`}
                  ></div>
                  <span>🔴 Röd = Checkar ut idag</span>
                </div>
                <div className="flex items-center gap-2">
                  <div
                    className={`w-4 h-4 rounded ${OCCUPANCY_COLORS.inne}`}
                  ></div>
                  <span>� Grön = Inne</span>
                </div>
                <div className="flex items-center gap-2">
                  <div
                    className={`w-4 h-4 rounded ${OCCUPANCY_COLORS.free}`}
                  ></div>
                  <span>⚪️ Grå = Ledigt</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
