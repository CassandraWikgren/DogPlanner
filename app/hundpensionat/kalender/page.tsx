"use client";

import { useEffect, useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/client";
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
  belongings?: string | null;
  bed_location?: string | null;
};
type Room = Database["public"]["Tables"]["rooms"]["Row"];

type SpecialDate = {
  id: string;
  date: string;
  name: string;
  category: "red_day" | "holiday" | "event" | "custom";
  price_surcharge: number;
  is_active: boolean;
};

// 🎨 Färgkodning för beläggning enligt specifikation
const OCCUPANCY_COLORS = {
  inne: "bg-green-100 border-green-400 text-green-800", // Grön = inne
  checkOut: "bg-red-100 border-red-400 text-red-800", // Röd = checkar ut idag
  checkIn: "bg-yellow-100 border-yellow-400 text-yellow-800", // Gul = anländer idag
  free: "bg-gray-100 border-gray-300 text-gray-600", // Ledigt
} as const;

// 🎯 Färgkodning för pristillägg
const PRICE_INDICATOR_COLORS = {
  red_day: "bg-red-500", // Röd = röda dagar
  holiday: "bg-purple-500", // Lila = lov/semester
  event: "bg-blue-500", // Blå = events
  custom: "bg-pink-500", // Rosa = anpassade
  weekend: "bg-orange-400", // Orange = helg
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
  specialDate?: SpecialDate; // Pristillägg för detta datum
  isWeekend: boolean;
}

export default function KalenderPage() {
  const supabase = createClient();
  const { user, currentOrgId, loading: authLoading } = useAuth();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [specialDates, setSpecialDates] = useState<SpecialDate[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [roomFilter, setRoomFilter] = useState<string>("all");
  const [viewMode, setViewMode] = useState<"month" | "week" | "day">("month");
  const [notification, setNotification] = useState<{
    message: string;
    type: "success" | "error";
  } | null>(null);

  // Kalendermånad navigation
  const [currentMonth, setCurrentMonth] = useState(() => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), 1);
  });

  // === LADDA DATA ===
  useEffect(() => {
    if (!currentOrgId || authLoading) return;
    loadCalendarData();
  }, [currentOrgId, authLoading, currentMonth]);

  async function loadCalendarData() {
    if (!currentOrgId) return;

    setLoading(true);
    setError(null);

    try {
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

      const [roomsRes, bookingsRes, specialDatesRes] = await Promise.all([
        (supabase as any)
          .from("rooms")
          .select("id, name, capacity_m2, room_type")
          .eq("org_id", currentOrgId)
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
          .eq("org_id", currentOrgId)
          .eq("status", "confirmed") // ✅ Visa ENDAST bekräftade bokningar i kalendern
          .gte("start_date", startOfMonth.toISOString())
          .lte("end_date", endOfMonth.toISOString())
          .order("start_date"),

        // Hämta special_dates (pristillägg) för månaden
        (supabase as any)
          .from("special_dates")
          .select("id, date, name, category, price_surcharge, is_active")
          .eq("org_id", currentOrgId)
          .eq("is_active", true)
          .gte("date", startOfMonth.toISOString().split("T")[0])
          .lte("date", endOfMonth.toISOString().split("T")[0]),
      ]);

      if (roomsRes.error) throw new Error(`Rooms: ${roomsRes.error.message}`);
      if (bookingsRes.error)
        throw new Error(`Bookings: ${bookingsRes.error.message}`);
      if (specialDatesRes.error)
        console.warn("Special dates error:", specialDatesRes.error);

      setRooms(roomsRes.data || []);
      setBookings(bookingsRes.data || []);
      setSpecialDates(specialDatesRes.data || []);

      console.log(
        `[Kalender] Laddad: ${roomsRes.data?.length} rum, ${bookingsRes.data?.length} bokningar, ${specialDatesRes.data?.length} pristillägg`
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

  // === CHECK IN/OUT FUNKTIONER ===
  async function handleCheckIn(bookingId: string) {
    try {
      console.log(`[CheckIn] Checking in booking: ${bookingId}`);

      const { error } = await (supabase as any)
        .from("bookings")
        .update({ status: "checked_in" })
        .eq("id", bookingId);

      if (error) throw error;

      // Uppdatera lokal state
      setBookings((prev) =>
        prev.map((b) =>
          b.id === bookingId ? { ...b, status: "checked_in" as any } : b
        )
      );

      setNotification({
        message: "✅ Incheckning genomförd!",
        type: "success",
      });
      setTimeout(() => setNotification(null), 3000);

      console.log(`[CheckIn] Framgång för booking ${bookingId}`);
    } catch (err: any) {
      console.error(`${ERROR_CODES.DATABASE_CONNECTION} Check-in fel:`, err);
      setNotification({
        message: `❌ Kunde inte checka in: ${err.message}`,
        type: "error",
      });
      setTimeout(() => setNotification(null), 5000);
    }
  }

  async function handleCheckOut(bookingId: string) {
    try {
      console.log(`[CheckOut] Checking out booking: ${bookingId}`);

      const { error } = await (supabase as any)
        .from("bookings")
        .update({ status: "checked_out" })
        .eq("id", bookingId);

      if (error) throw error;

      // Uppdatera lokal state
      setBookings((prev) =>
        prev.map((b) =>
          b.id === bookingId ? { ...b, status: "checked_out" as any } : b
        )
      );

      setNotification({
        message: "✅ Utcheckning genomförd!",
        type: "success",
      });
      setTimeout(() => setNotification(null), 3000);

      console.log(`[CheckOut] Framgång för booking ${bookingId}`);
    } catch (err: any) {
      console.error(`${ERROR_CODES.DATABASE_CONNECTION} Check-out fel:`, err);
      setNotification({
        message: `❌ Kunde inte checka ut: ${err.message}`,
        type: "error",
      });
      setTimeout(() => setNotification(null), 5000);
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
          ? rooms.reduce((sum, r) => sum + (r.capacity_m2 || 0), 0)
          : rooms.find((r) => r.id === roomFilter)?.capacity_m2 || 1;

      const usedCapacity = filteredBookings.reduce((sum, b) => {
        const dogSize = b.dogs?.heightcm || 30; // Default storlek
        return sum + (dogSize > 50 ? 12 : 8); // Stora vs små hundar
      }, 0);

      const occupancy = Math.min(
        100,
        Math.round((usedCapacity / totalCapacity) * 100)
      );

      // Kolla om datum har pristillägg
      const specialDate = specialDates.find((sd) => sd.date === dateString);

      // Kolla om det är helg (fredag-söndag)
      const dayOfWeek = currentDate.getDay();
      const isWeekend = dayOfWeek === 5 || dayOfWeek === 6 || dayOfWeek === 0;

      days.push({
        date: new Date(currentDate),
        dateString,
        bookings: filteredBookings,
        checkIns,
        checkOuts,
        occupancy,
        isToday: dateString === today.toISOString().split("T")[0],
        isCurrentMonth: currentDate.getMonth() === month,
        specialDate,
        isWeekend,
      });

      currentDate.setDate(currentDate.getDate() + 1);
    }

    return days;
  }, [currentMonth, bookings, rooms, roomFilter, specialDates]);

  // === NAVIGATION ===
  function navigateMonth(direction: "prev" | "next") {
    const newMonth = new Date(currentMonth);
    newMonth.setMonth(newMonth.getMonth() + (direction === "next" ? 1 : -1));
    setCurrentMonth(newMonth);
  }

  // === VECKO/DAG DATA ===
  const weekDays = useMemo(() => {
    const today = new Date();
    const startOfWeek = new Date(today);
    startOfWeek.setDate(today.getDate() - ((today.getDay() + 6) % 7)); // Månd start

    const days: DayData[] = [];
    for (let i = 0; i < 7; i++) {
      const date = new Date(startOfWeek);
      date.setDate(startOfWeek.getDate() + i);
      const dayData = calendarDays.find(
        (d) => d.dateString === date.toISOString().split("T")[0]
      );
      if (dayData) days.push(dayData);
    }
    return days;
  }, [calendarDays]);

  const todayData = useMemo(() => {
    const today = new Date().toISOString().split("T")[0];
    return calendarDays.find((d) => d.dateString === today);
  }, [calendarDays]);

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
      {/* Notification Toast */}
      {notification && (
        <div className="fixed top-20 right-4 z-50 animate-slide-in-right">
          <div
            className={`px-6 py-4 rounded-lg shadow-lg border-2 ${
              notification.type === "success"
                ? "bg-green-50 border-green-400 text-green-800"
                : "bg-red-50 border-red-400 text-red-800"
            }`}
          >
            <p className="font-medium text-sm">{notification.message}</p>
          </div>
        </div>
      )}

      {/* Header med Hunddagis-struktur */}
      <div className="border-b border-gray-200 bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex justify-between items-start">
            <div className="flex-1">
              <h1 className="text-[32px] font-bold text-[#2c7a4c] leading-tight flex items-center gap-2">
                📅 Pensionatkalender
              </h1>
              <p className="mt-1 text-base text-gray-600">
                Översikt av bokningar och beläggning med färgkoder för
                in/utcheckning
              </p>
            </div>
            <div className="flex gap-3 ml-4">
              <div className="bg-white rounded-lg px-4 py-2 border border-gray-200 shadow-sm">
                <div className="text-xs text-gray-600">Hundar inne</div>
                <div className="text-xl font-bold text-[#2c7a4c]">
                  {stats.hundarInne}
                </div>
              </div>
              <div className="bg-white rounded-lg px-4 py-2 border border-gray-200 shadow-sm">
                <div className="text-xs text-gray-600">Ankomster</div>
                <div className="text-xl font-bold text-[#2c7a4c]">
                  {stats.ankomsterIdag}
                </div>
              </div>
              <div className="bg-white rounded-lg px-4 py-2 border border-gray-200 shadow-sm">
                <div className="text-xs text-gray-600">Avresor</div>
                <div className="text-xl font-bold text-[#2c7a4c]">
                  {stats.avresorIdag}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="max-w-7xl mx-auto px-6 py-6">
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-6">
          <div className="bg-white rounded-lg p-6 border border-gray-200 shadow-sm text-center">
            <p className="text-sm font-semibold text-gray-600 mb-1">
              Totala bokningar
            </p>
            <p className="text-2xl font-bold text-[#2c7a4c]">
              {stats.totalaBokningar}
            </p>
          </div>

          <div className="bg-white rounded-lg p-6 border border-gray-200 shadow-sm text-center">
            <p className="text-sm font-semibold text-gray-600 mb-1">
              Aktiva rum
            </p>
            <p className="text-2xl font-bold text-[#2c7a4c]">
              {stats.aktuellaRum}
            </p>
          </div>

          <div className="bg-white rounded-lg p-6 border border-gray-200 shadow-sm text-center">
            <p className="text-sm font-semibold text-gray-600 mb-1">
              Ø Beläggning
            </p>
            <p className="text-2xl font-bold text-[#2c7a4c]">
              {stats.genomsnittBelaggning}%
            </p>
          </div>
        </div>

        {/* Kontroller */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6 border border-gray-200">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
              {/* View Mode Selector */}
              <div className="flex gap-1 bg-gray-100 p-1 rounded-lg">
                <button
                  onClick={() => setViewMode("month")}
                  className={`px-4 py-2 rounded-md text-sm font-semibold transition-colors ${
                    viewMode === "month"
                      ? "bg-[#2c7a4c] text-white"
                      : "text-gray-600 hover:bg-gray-200"
                  }`}
                >
                  Månad
                </button>
                <button
                  onClick={() => setViewMode("week")}
                  className={`px-4 py-2 rounded-md text-sm font-semibold transition-colors ${
                    viewMode === "week"
                      ? "bg-[#2c7a4c] text-white"
                      : "text-gray-600 hover:bg-gray-200"
                  }`}
                >
                  Vecka
                </button>
                <button
                  onClick={() => setViewMode("day")}
                  className={`px-4 py-2 rounded-md text-sm font-semibold transition-colors ${
                    viewMode === "day"
                      ? "bg-[#2c7a4c] text-white"
                      : "text-gray-600 hover:bg-gray-200"
                  }`}
                >
                  Dag
                </button>
              </div>

              {/* Room Filter */}
              <select
                value={roomFilter}
                onChange={(e) => setRoomFilter(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#2c7a4c] focus:border-transparent text-sm"
              >
                <option value="all">Alla rum</option>
                {rooms.map((room) => (
                  <option key={room.id} value={room.id}>
                    {room.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Pristillägg-legend */}
            <div className="flex flex-wrap items-center gap-4 text-xs text-gray-600">
              <span className="font-semibold">Pristillägg:</span>
              <div className="flex items-center gap-1.5">
                <div
                  className={`w-2.5 h-2.5 rounded-full ${PRICE_INDICATOR_COLORS.red_day}`}
                />
                <span>Röd dag</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div
                  className={`w-2.5 h-2.5 rounded-full ${PRICE_INDICATOR_COLORS.holiday}`}
                />
                <span>Lov/Semester</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div
                  className={`w-2.5 h-2.5 rounded-full ${PRICE_INDICATOR_COLORS.event}`}
                />
                <span>Event</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div
                  className={`w-2.5 h-2.5 rounded-full ${PRICE_INDICATOR_COLORS.weekend}`}
                />
                <span>Helg</span>
              </div>
            </div>

            <div className="flex gap-2 w-full md:w-auto">
              <Link
                href="/hundpensionat"
                className="flex items-center justify-center gap-2 px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors font-semibold text-sm"
              >
                Tillbaka
              </Link>
              <Link
                href="/hundpensionat/nybokning"
                className="flex items-center justify-center gap-2 px-4 py-2 bg-[#2c7a4c] text-white rounded-md hover:bg-[#236139] transition-colors font-semibold text-sm"
              >
                <Plus size={16} />
                <span className="hidden sm:inline">Ny bokning</span>
              </Link>
            </div>
          </div>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-lg mb-6 text-sm">
            {error}
          </div>
        )}

        <div className="grid grid-cols-1 xl:grid-cols-4 gap-6">
          {/* Kalenderdel */}
          <div className="xl:col-span-3">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200">
              {/* Kalender Header */}
              <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
                <div className="flex items-center gap-4">
                  <button
                    onClick={() => navigateMonth("prev")}
                    className="p-2 hover:bg-gray-100 rounded-md transition-colors"
                  >
                    <ChevronLeft className="h-5 w-5 text-gray-600" />
                  </button>

                  <h2 className="text-xl font-bold text-gray-800">
                    {currentMonth.toLocaleDateString("sv-SE", {
                      month: "long",
                      year: "numeric",
                    })}
                  </h2>

                  <button
                    onClick={() => navigateMonth("next")}
                    className="p-2 hover:bg-gray-100 rounded-md transition-colors"
                  >
                    <ChevronRight className="h-5 w-5 text-gray-600" />
                  </button>
                </div>

                <button
                  onClick={() => setCurrentMonth(new Date())}
                  className="px-4 py-2 text-sm bg-white border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 font-semibold transition-colors"
                >
                  Idag
                </button>
              </div>

              {/* Veckodagar */}
              {viewMode === "month" && (
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
              )}

              {/* MÅNADSVY */}
              {viewMode === "month" && (
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
                      <div className="flex items-center gap-1 mb-1">
                        <div
                          className={`text-sm font-medium ${
                            day.isToday
                              ? "text-blue-600 font-bold"
                              : "text-gray-700"
                          }`}
                        >
                          {day.date.getDate()}
                        </div>

                        {/* Pristillägg-indikator */}
                        {day.specialDate && (
                          <div
                            className={`w-2 h-2 rounded-full ${
                              PRICE_INDICATOR_COLORS[day.specialDate.category]
                            }`}
                            title={`${day.specialDate.name}: +${day.specialDate.price_surcharge} kr`}
                          />
                        )}

                        {/* Helg-indikator (endast om inte special_date finns) */}
                        {!day.specialDate && day.isWeekend && (
                          <div
                            className={`w-2 h-2 rounded-full ${PRICE_INDICATOR_COLORS.weekend}`}
                            title="Helgpåslag"
                          />
                        )}
                      </div>

                      {/* Status indicators med spec-färger */}
                      <div className="space-y-1">
                        {day.checkIns.length > 0 && (
                          <div className="text-xs px-1.5 py-0.5 bg-yellow-100 text-yellow-900 rounded border border-yellow-400 font-medium">
                            📥 {day.checkIns.length}
                          </div>
                        )}
                        {day.checkOuts.length > 0 && (
                          <div className="text-xs px-1.5 py-0.5 bg-red-100 text-red-900 rounded border border-red-400 font-medium">
                            📤 {day.checkOuts.length}
                          </div>
                        )}
                        {day.bookings.length > 0 &&
                          !day.checkIns.length &&
                          !day.checkOuts.length && (
                            <div className="text-xs px-1.5 py-0.5 bg-blue-100 text-blue-900 rounded border border-blue-400 font-medium">
                              {day.bookings.length} inne
                            </div>
                          )}
                      </div>
                    </button>
                  ))}
                </div>
              )}

              {/* VECKOVISNING */}
              {viewMode === "week" && (
                <div className="grid grid-cols-7 gap-4 p-4">
                  {weekDays.map((day) => (
                    <div
                      key={day.dateString}
                      onClick={() => setSelectedDate(day.dateString)}
                      className={`
                        cursor-pointer rounded-lg border-2 p-4 min-h-[220px] hover:shadow-md transition-all
                        ${day.isToday ? "ring-2 ring-blue-500" : ""}
                        ${
                          selectedDate === day.dateString
                            ? "ring-2 ring-[#2c7a4c]"
                            : ""
                        }
                        ${
                          day.checkIns.length > 0
                            ? "bg-yellow-50 border-yellow-400"
                            : day.checkOuts.length > 0
                              ? "bg-red-50 border-red-400"
                              : day.bookings.length > 0
                                ? "bg-blue-50 border-blue-400"
                                : "bg-white border-gray-300"
                        }
                      `}
                    >
                      <div className="text-left mb-3">
                        <div className="text-xs text-gray-600 uppercase font-semibold">
                          {day.date.toLocaleDateString("sv-SE", {
                            weekday: "short",
                          })}
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="text-2xl font-bold text-gray-900">
                            {day.date.getDate()}
                          </div>
                          {/* Pristillägg-indikator i veckovisning */}
                          {day.specialDate && (
                            <div
                              className={`w-3 h-3 rounded-full ${
                                PRICE_INDICATOR_COLORS[day.specialDate.category]
                              }`}
                              title={`${day.specialDate.name}: +${day.specialDate.price_surcharge} kr`}
                            />
                          )}
                          {!day.specialDate && day.isWeekend && (
                            <div
                              className={`w-3 h-3 rounded-full ${PRICE_INDICATOR_COLORS.weekend}`}
                              title="Helgpåslag"
                            />
                          )}
                        </div>
                        <div className="text-xs text-gray-500">
                          {day.date.toLocaleDateString("sv-SE", {
                            month: "short",
                          })}
                        </div>
                      </div>
                      <div className="space-y-2">
                        {day.checkIns.length > 0 && (
                          <div className="text-sm px-2 py-1 bg-yellow-100 text-yellow-900 rounded border border-yellow-400 font-medium">
                            📥 {day.checkIns.length} in
                          </div>
                        )}
                        {day.checkOuts.length > 0 && (
                          <div className="text-sm px-2 py-1 bg-red-100 text-red-900 rounded border border-red-400 font-medium">
                            📤 {day.checkOuts.length} ut
                          </div>
                        )}
                        {day.bookings.length > 0 && (
                          <div className="text-sm px-2 py-1 bg-blue-100 text-blue-900 rounded border border-blue-400 font-medium">
                            🐕 {day.bookings.length} inne
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* DAGVISNING */}
              {viewMode === "day" && todayData && (
                <div className="p-6">
                  <div className="mb-6">
                    <h3 className="text-xl font-bold text-gray-900">
                      {todayData.date.toLocaleDateString("sv-SE", {
                        weekday: "long",
                        day: "numeric",
                        month: "long",
                        year: "numeric",
                      })}
                    </h3>
                  </div>

                  <div className="space-y-6">
                    {/* Incheckningar */}
                    {todayData.checkIns.length > 0 && (
                      <div>
                        <h4 className="text-base font-bold text-gray-900 mb-3 flex items-center gap-2">
                          📥 Incheckningar ({todayData.checkIns.length})
                        </h4>
                        <div className="space-y-2">
                          {todayData.checkIns.map((booking) => (
                            <div
                              key={booking.id}
                              className="p-4 bg-yellow-50 border border-yellow-300 rounded-lg"
                            >
                              <div className="flex justify-between items-start">
                                <div>
                                  <div className="font-semibold text-gray-900 text-sm">
                                    🐕{" "}
                                    {booking.dogs?.name ||
                                      `Hund ID: ${booking.dog_id}`}
                                  </div>
                                  <div className="text-sm text-gray-600">
                                    👤{" "}
                                    {booking.dogs?.owners?.full_name ||
                                      `Ägare ID: ${booking.owner_id}`}
                                  </div>
                                  {booking.dogs?.breed && (
                                    <div className="text-xs text-gray-500">
                                      Ras: {booking.dogs.breed}
                                    </div>
                                  )}
                                  <div className="text-xs text-gray-500 mt-1">
                                    📅 {booking.start_date} → {booking.end_date}
                                  </div>
                                </div>
                                <button
                                  onClick={() => handleCheckIn(booking.id)}
                                  className="px-4 py-2 bg-yellow-600 text-white rounded-md hover:bg-yellow-700 transition-colors text-sm font-semibold"
                                >
                                  Checka in
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Utcheckningar */}
                    {todayData.checkOuts.length > 0 && (
                      <div>
                        <h4 className="text-base font-bold text-gray-900 mb-3 flex items-center gap-2">
                          📤 Utcheckningar ({todayData.checkOuts.length})
                        </h4>
                        <div className="space-y-2">
                          {todayData.checkOuts.map((booking) => (
                            <div
                              key={booking.id}
                              className="p-4 bg-red-50 border border-red-300 rounded-lg"
                            >
                              <div className="flex justify-between items-start">
                                <div>
                                  <div className="font-semibold text-gray-900 text-sm">
                                    🐕{" "}
                                    {booking.dogs?.name ||
                                      `Hund ID: ${booking.dog_id}`}
                                  </div>
                                  <div className="text-sm text-gray-600">
                                    👤{" "}
                                    {booking.dogs?.owners?.full_name ||
                                      `Ägare ID: ${booking.owner_id}`}
                                  </div>
                                  {booking.dogs?.breed && (
                                    <div className="text-xs text-gray-500">
                                      Ras: {booking.dogs.breed}
                                    </div>
                                  )}
                                  <div className="text-xs text-gray-500 mt-1">
                                    📅 {booking.start_date} → {booking.end_date}
                                  </div>
                                </div>
                                <button
                                  onClick={() => handleCheckOut(booking.id)}
                                  className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors text-sm font-semibold"
                                >
                                  Checka ut
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Hundar inne */}
                    {todayData.bookings.length > 0 && (
                      <div>
                        <h4 className="text-base font-bold text-gray-900 mb-3 flex items-center gap-2">
                          🐕 Hundar inne ({todayData.bookings.length})
                        </h4>
                        <div className="space-y-2">
                          {todayData.bookings.map((booking) => (
                            <div
                              key={booking.id}
                              className="p-4 bg-blue-50 border border-blue-300 rounded-lg"
                            >
                              <div className="font-semibold text-gray-900 text-sm">
                                🐕{" "}
                                {booking.dogs?.name ||
                                  `Hund ID: ${booking.dog_id}`}
                              </div>
                              <div className="text-sm text-gray-600">
                                👤{" "}
                                {booking.dogs?.owners?.full_name ||
                                  `Ägare ID: ${booking.owner_id}`}
                              </div>
                              {booking.dogs?.breed && (
                                <div className="text-xs text-gray-500">
                                  Ras: {booking.dogs.breed}
                                </div>
                              )}
                              <div className="text-xs text-gray-500 mt-1">
                                📅 {booking.start_date} → {booking.end_date}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {todayData.bookings.length === 0 &&
                      todayData.checkIns.length === 0 &&
                      todayData.checkOuts.length === 0 && (
                        <div className="text-center py-12 text-gray-500">
                          Inga bokningar denna dag
                        </div>
                      )}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Detaljpanel */}
          <div className="xl:col-span-1">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-bold mb-4 text-gray-900">
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
                  {/* Pristillägg-info */}
                  {(selectedDayData.specialDate ||
                    selectedDayData.isWeekend) && (
                    <div className="bg-gradient-to-r from-purple-50 to-blue-50 rounded-lg p-4 border border-purple-200">
                      <div className="flex items-start gap-2">
                        <div
                          className={`w-4 h-4 rounded-full mt-0.5 flex-shrink-0 ${
                            selectedDayData.specialDate
                              ? PRICE_INDICATOR_COLORS[
                                  selectedDayData.specialDate.category
                                ]
                              : PRICE_INDICATOR_COLORS.weekend
                          }`}
                        />
                        <div>
                          <div className="font-semibold text-sm text-gray-900">
                            {selectedDayData.specialDate
                              ? selectedDayData.specialDate.name
                              : "Helgpåslag"}
                          </div>
                          <div className="text-xs text-gray-600 mt-1">
                            {selectedDayData.specialDate ? (
                              <>
                                +{selectedDayData.specialDate.price_surcharge}{" "}
                                kr pristillägg
                                {selectedDayData.specialDate.category ===
                                  "red_day" && " (Röd dag)"}
                                {selectedDayData.specialDate.category ===
                                  "holiday" && " (Lov/Semester)"}
                                {selectedDayData.specialDate.category ===
                                  "event" && " (Event)"}
                              </>
                            ) : (
                              "Helgpris tillämpas (fredag-söndag)"
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

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
                            {booking.bed_location && (
                              <div className="text-xs text-gray-500 mt-1">
                                📍 Säng:{" "}
                                <span className="font-medium">
                                  {booking.bed_location}
                                </span>
                              </div>
                            )}
                            {booking.belongings && (
                              <div className="text-xs text-gray-500 mt-1">
                                🎒 Tillhörigheter:{" "}
                                <span className="font-medium">
                                  {booking.belongings}
                                </span>
                              </div>
                            )}
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
                    className="block w-full text-center bg-[#2c7a4c] hover:bg-[#236139] text-white py-2 px-4 rounded-md text-sm font-semibold transition-colors"
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
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mt-4">
              <h4 className="font-bold mb-3 text-gray-900 text-sm">
                Färgkoder
              </h4>
              <div className="space-y-2 text-sm">
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded bg-yellow-100 border border-yellow-400"></div>
                  <span>🟡 Gul = Anländer idag</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded bg-red-100 border border-red-400"></div>
                  <span>🔴 Röd = Checkar ut idag</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded bg-blue-100 border border-blue-400"></div>
                  <span>🔵 Blå = Inne</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded bg-gray-100 border border-gray-300"></div>
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
