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

// 🎨 Färgkodning för beläggning
const OCCUPANCY_COLORS = {
  free: "bg-green-100 border-green-400 text-green-800",
  partial: "bg-yellow-100 border-yellow-400 text-yellow-800",
  full: "bg-red-100 border-red-400 text-red-800",
  checkin: "bg-blue-100 border-blue-400 text-blue-800",
  checkout: "bg-purple-100 border-purple-400 text-purple-800",
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
    if (hasCheckIns && hasCheckOuts) return OCCUPANCY_COLORS.checkin; // Både in och ut
    if (hasCheckIns) return OCCUPANCY_COLORS.checkin;
    if (hasCheckOuts) return OCCUPANCY_COLORS.checkout;
    if (occupancy === 0) return OCCUPANCY_COLORS.free;
    if (occupancy < 80) return OCCUPANCY_COLORS.partial;
    return OCCUPANCY_COLORS.full;
  }

  // === SELECTED DAY DETAILS ===
  const selectedDayData = selectedDate
    ? calendarDays.find((d) => d.dateString === selectedDate)
    : null;

  // === RENDER ===
  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mr-4"></div>
        <p>Laddar kalender...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-6">
        {/* Header */}
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-6">
          <div>
            <h1 className="text-3xl font-bold text-blue-700 flex items-center gap-2">
              📅 Pensionatkalender
            </h1>
            <p className="text-gray-600">
              Översikt av bokningar och beläggning
            </p>
          </div>

          <div className="flex flex-wrap gap-3 items-center">
            {/* Room Filter */}
            <select
              value={roomFilter}
              onChange={(e) => setRoomFilter(e.target.value)}
              className="border rounded-lg px-3 py-2 text-sm bg-white"
            >
              <option value="all">Alla rum</option>
              {rooms.map((room) => (
                <option key={room.id} value={room.id}>
                  {room.name}
                </option>
              ))}
            </select>

            {/* Actions */}
            <Link
              href="/hundpensionat/nybokning"
              className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-semibold"
            >
              <Plus className="h-4 w-4" />
              Ny bokning
            </Link>
          </div>
        </div>

        {error && (
          <div className="mb-6 p-4 rounded-lg bg-red-50 border border-red-200 text-red-700">
            {error}
          </div>
        )}

        <div className="grid grid-cols-1 xl:grid-cols-4 gap-6">
          {/* Kalenderdel */}
          <div className="xl:col-span-3">
            <div className="bg-white rounded-xl shadow-lg border border-gray-200">
              {/* Kalender Header */}
              <div className="flex items-center justify-between p-6 border-b">
                <div className="flex items-center gap-4">
                  <button
                    onClick={() => navigateMonth("prev")}
                    className="p-2 hover:bg-gray-100 rounded-lg"
                  >
                    <ChevronLeft className="h-5 w-5" />
                  </button>

                  <h2 className="text-xl font-semibold">
                    {currentMonth.toLocaleDateString("sv-SE", {
                      month: "long",
                      year: "numeric",
                    })}
                  </h2>

                  <button
                    onClick={() => navigateMonth("next")}
                    className="p-2 hover:bg-gray-100 rounded-lg"
                  >
                    <ChevronRight className="h-5 w-5" />
                  </button>
                </div>

                <button
                  onClick={() => setCurrentMonth(new Date())}
                  className="text-sm text-blue-600 hover:text-blue-800 font-medium"
                >
                  Idag
                </button>
              </div>

              {/* Veckodagar */}
              <div className="grid grid-cols-7 border-b">
                {["Mån", "Tis", "Ons", "Tor", "Fre", "Lör", "Sön"].map(
                  (day) => (
                    <div
                      key={day}
                      className="p-3 text-center text-sm font-semibold text-gray-600 border-r last:border-r-0"
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
                      h-24 p-2 border-r border-b last:border-r-0 hover:bg-gray-50 text-left relative
                      ${!day.isCurrentMonth ? "bg-gray-50 text-gray-400" : ""}
                      ${day.isToday ? "bg-blue-50 border-blue-200" : ""}
                      ${
                        selectedDate === day.dateString
                          ? "ring-2 ring-blue-500"
                          : ""
                      }
                    `}
                  >
                    {/* Datum */}
                    <div
                      className={`text-sm font-medium mb-1 ${
                        day.isToday ? "text-blue-600" : ""
                      }`}
                    >
                      {day.date.getDate()}
                    </div>

                    {/* Status indicators */}
                    <div className="space-y-1">
                      {day.checkIns.length > 0 && (
                        <div className="text-xs px-1 py-0.5 bg-blue-100 text-blue-700 rounded">
                          📥 {day.checkIns.length}
                        </div>
                      )}
                      {day.checkOuts.length > 0 && (
                        <div className="text-xs px-1 py-0.5 bg-purple-100 text-purple-700 rounded">
                          📤 {day.checkOuts.length}
                        </div>
                      )}
                      {day.bookings.length > 0 && (
                        <div
                          className={`text-xs px-1 py-0.5 rounded ${getOccupancyColor(
                            day.occupancy,
                            day.checkIns.length > 0,
                            day.checkOuts.length > 0
                          )}`}
                        >
                          {day.occupancy}% ({day.bookings.length})
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
              <h3 className="text-lg font-semibold mb-4">
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
                  <div className="bg-gray-50 rounded-lg p-3">
                    <div className="text-sm space-y-1">
                      <div className="flex justify-between">
                        <span>Bokningar:</span>
                        <span className="font-medium">
                          {selectedDayData.bookings.length}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span>Incheckning:</span>
                        <span className="font-medium text-blue-600">
                          {selectedDayData.checkIns.length}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span>Utcheckning:</span>
                        <span className="font-medium text-purple-600">
                          {selectedDayData.checkOuts.length}
                        </span>
                      </div>
                      <div className="flex justify-between border-t pt-1">
                        <span>Beläggning:</span>
                        <span className="font-medium">
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
                      {selectedDayData.bookings.map((booking) => (
                        <div
                          key={booking.id}
                          className="border rounded-lg p-3 text-sm"
                        >
                          <div className="font-medium">
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
                            <span className="capitalize">{booking.status}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-gray-500">
                      Inga bokningar denna dag
                    </p>
                  )}

                  {/* Snabb-bokning */}
                  <Link
                    href={`/hundpensionat/nybokning?date=${selectedDayData.dateString}`}
                    className="block w-full text-center bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-lg text-sm font-medium"
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

            {/* Legend */}
            <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6 mt-4">
              <h4 className="font-semibold mb-3">Förklaring</h4>
              <div className="space-y-2 text-sm">
                <div className="flex items-center gap-2">
                  <div
                    className={`w-4 h-4 rounded ${OCCUPANCY_COLORS.free}`}
                  ></div>
                  <span>Ledigt (0%)</span>
                </div>
                <div className="flex items-center gap-2">
                  <div
                    className={`w-4 h-4 rounded ${OCCUPANCY_COLORS.partial}`}
                  ></div>
                  <span>Delvis (1-79%)</span>
                </div>
                <div className="flex items-center gap-2">
                  <div
                    className={`w-4 h-4 rounded ${OCCUPANCY_COLORS.full}`}
                  ></div>
                  <span>Fullbokat (80%+)</span>
                </div>
                <div className="flex items-center gap-2">
                  <div
                    className={`w-4 h-4 rounded ${OCCUPANCY_COLORS.checkin}`}
                  ></div>
                  <span>📥 Incheckning</span>
                </div>
                <div className="flex items-center gap-2">
                  <div
                    className={`w-4 h-4 rounded ${OCCUPANCY_COLORS.checkout}`}
                  ></div>
                  <span>📤 Utcheckning</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
