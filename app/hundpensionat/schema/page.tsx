"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useAuth } from "@/app/context/AuthContext";
import { ChevronLeft, ChevronRight, Calendar, List } from "lucide-react";
import Link from "next/link";
import type { Database } from "@/types/database";
import { calculateMaxDogsCapacity } from "@/lib/roomCalculator";

type Booking = Database["public"]["Tables"]["bookings"]["Row"] & {
  dogs?:
    | (Database["public"]["Tables"]["dogs"]["Row"] & {
        owners?: Database["public"]["Tables"]["owners"]["Row"] | null;
      })
    | null;
};

type Room = Database["public"]["Tables"]["rooms"]["Row"];

export default function PensionatSchemaPage() {
  const supabase = createClient();
  const { currentOrgId } = useAuth();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [loading, setLoading] = useState(true);
  const [startDate, setStartDate] = useState(new Date());

  // Antal dagar att visa framåt (14 dagar = 2 veckor)
  const daysToShow = 14;

  useEffect(() => {
    if (currentOrgId) {
      loadData();
    } else {
      // ✅ FIX: Stoppa loading spinner om currentOrgId saknas
      setLoading(false);
    }
  }, [currentOrgId, startDate]);

  const loadData = async () => {
    try {
      setLoading(true);

      // Hämta rum
      const { data: roomsData, error: roomsError } = await supabase
        .from("rooms")
        .select("*")
        .eq("org_id", currentOrgId as string)
        .order("name");

      if (roomsError) throw roomsError;
      setRooms(roomsData || []);

      // Hämta bokningar för tidsperioden
      const endDate = new Date(startDate);
      endDate.setDate(endDate.getDate() + daysToShow);

      const { data: bookingsData, error: bookingsError } = await supabase
        .from("bookings")
        .select(
          `
          *,
          dogs (
            *,
            owners (*)
          )
        `
        )
        .eq("org_id", currentOrgId as string)
        .in("status", ["confirmed", "checked_in"]) // ✅ Visa bekräftade OCH incheckade bokningar
        .lte("start_date", endDate.toISOString().split("T")[0])
        .gte("end_date", startDate.toISOString().split("T")[0]);

      if (bookingsError) throw bookingsError;
      setBookings((bookingsData as any) || []);
    } catch (error) {
      console.error("Fel vid laddning av data:", error);
    } finally {
      setLoading(false);
    }
  };

  // Generera datumarray för kolumnerna
  const dates = Array.from({ length: daysToShow }, (_, i) => {
    const date = new Date(startDate);
    date.setDate(date.getDate() + i);
    return date;
  });

  // Beräkna max antal hundar enligt Jordbruksverket för ett rum
  const getMaxDogsForRoom = (room: Room): string => {
    const capacity = room.capacity_m2 || 0;
    if (capacity === 0) return "Ej angivet";

    const calc = calculateMaxDogsCapacity(capacity);
    // Visa olika scenarier: små → stora hundar
    // Vi visar "X-Y hundar" där X = stora hundar, Y = små hundar
    const minDogs = calc.max_large_dogs; // Stora hundar behöver mest yta
    const maxDogs = calc.max_small_dogs; // Små hundar behöver minst yta

    if (minDogs === maxDogs) {
      return `${minDogs} hundar`;
    }
    return `${minDogs}-${maxDogs} hundar`;
  };

  // Hjälpfunktion för att hämta ALLA bokningar för ett rum och datum (kan vara flera hundar)
  const getBookingsForRoomAndDate = (roomId: string, date: Date): Booking[] => {
    const dateStr = date.toISOString().split("T")[0];

    return bookings.filter((booking) => {
      if (booking.room_id !== roomId) return false;

      const start = new Date(booking.start_date || "");
      const end = new Date(booking.end_date || "");
      const current = new Date(dateStr);

      start.setHours(0, 0, 0, 0);
      end.setHours(0, 0, 0, 0);
      current.setHours(0, 0, 0, 0);

      return current >= start && current <= end;
    });
  };

  // Hjälpfunktion för att kolla om ett rum är bokat ett visst datum (första bokning)
  const getBookingForRoomAndDate = (roomId: string, date: Date) => {
    const dateStr = date.toISOString().split("T")[0];

    return bookings.find((booking) => {
      // Kolla om bokningen har rätt room
      if (booking.room_id !== roomId) return false;

      // Kolla om datumet är inom bokningens period
      const start = new Date(booking.start_date || "");
      const end = new Date(booking.end_date || "");
      const current = new Date(dateStr);

      start.setHours(0, 0, 0, 0);
      end.setHours(0, 0, 0, 0);
      current.setHours(0, 0, 0, 0);

      return current >= start && current <= end;
    });
  };

  // Bestäm cell-färg baserat på status
  const getCellColor = (booking: Booking | undefined, date: Date) => {
    if (!booking) return "bg-white hover:bg-gray-50";

    const dateStr = date.toISOString().split("T")[0];
    const startDate = booking.start_date;
    const endDate = booking.end_date;

    // Checkin idag (gul)
    if (dateStr === startDate) {
      return "bg-yellow-100 hover:bg-yellow-200 border-l-4 border-l-yellow-500";
    }

    // Checkout idag (röd)
    if (dateStr === endDate) {
      return "bg-red-100 hover:bg-red-200 border-l-4 border-l-red-500";
    }

    // Inne (blå)
    return "bg-blue-100 hover:bg-blue-200 border-l-4 border-l-blue-500";
  };

  // Navigation
  const goToPrevWeek = () => {
    const newDate = new Date(startDate);
    newDate.setDate(newDate.getDate() - 7);
    setStartDate(newDate);
  };

  const goToNextWeek = () => {
    const newDate = new Date(startDate);
    newDate.setDate(newDate.getDate() + 7);
    setStartDate(newDate);
  };

  const goToToday = () => {
    setStartDate(new Date());
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#2c7a4c] mx-auto mb-4"></div>
          <p className="text-gray-600">Laddar schema...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="border-b border-gray-200 bg-white shadow-sm">
        <div className="max-w-full mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-[32px] font-bold text-[#2c7a4c] leading-tight">
                Rumsschema
              </h1>
              <p className="mt-1 text-base text-gray-600">
                Översikt rum × datum (grid-vy som hotell)
              </p>
            </div>

            {/* Navigation mellan vyer */}
            <div className="flex items-center gap-2">
              <Link
                href="/hundpensionat"
                className="inline-flex items-center px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
              >
                <List className="h-4 w-4 mr-2" />
                Listvy
              </Link>
              <Link
                href="/hundpensionat/kalender"
                className="inline-flex items-center px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
              >
                <Calendar className="h-4 w-4 mr-2" />
                Kalender
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-full mx-auto px-6 py-6">
        {/* Controls */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-6">
          <div className="flex items-center justify-between">
            <button
              onClick={goToPrevWeek}
              className="inline-flex items-center px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
            >
              <ChevronLeft className="h-4 w-4" />
              Föregående vecka
            </button>

            <button
              onClick={goToToday}
              className="inline-flex items-center px-4 py-2 text-sm font-semibold text-white bg-[#2c7a4c] rounded-md hover:bg-[#236139]"
            >
              Idag
            </button>

            <button
              onClick={goToNextWeek}
              className="inline-flex items-center px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
            >
              Nästa vecka
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Legend */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-6">
          <div className="flex items-center gap-6">
            <span className="text-sm font-medium text-gray-700">
              Färgkoder:
            </span>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-yellow-100 border-l-4 border-l-yellow-500"></div>
              <span className="text-sm text-gray-600">Anländer idag</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-blue-100 border-l-4 border-l-blue-500"></div>
              <span className="text-sm text-gray-600">Inne</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-red-100 border-l-4 border-l-red-500"></div>
              <span className="text-sm text-gray-600">Checkar ut idag</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-white border border-gray-300"></div>
              <span className="text-sm text-gray-600">Ledigt</span>
            </div>
          </div>
        </div>

        {/* Grid Table */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200">
                  <th className="sticky left-0 z-10 bg-gray-50 px-4 py-3 text-left text-sm font-semibold text-gray-700 border-r border-gray-200 min-w-[150px]">
                    Rum
                  </th>
                  {dates.map((date, i) => {
                    const isToday =
                      date.toISOString().split("T")[0] ===
                      new Date().toISOString().split("T")[0];
                    const isWeekend =
                      date.getDay() === 0 || date.getDay() === 6;

                    return (
                      <th
                        key={i}
                        className={`px-3 py-3 text-center text-xs font-medium min-w-[120px] border-r border-gray-200 ${
                          isToday
                            ? "bg-[#2c7a4c] text-white"
                            : isWeekend
                              ? "bg-gray-100 text-gray-700"
                              : "text-gray-700"
                        }`}
                      >
                        <div className="flex flex-col">
                          <span className="font-semibold">
                            {date.toLocaleDateString("sv-SE", {
                              weekday: "short",
                            })}
                          </span>
                          <span className={isToday ? "font-bold" : ""}>
                            {date.toLocaleDateString("sv-SE", {
                              day: "numeric",
                              month: "short",
                            })}
                          </span>
                        </div>
                      </th>
                    );
                  })}
                </tr>
              </thead>
              <tbody>
                {rooms.map((room) => (
                  <tr
                    key={room.id}
                    className="border-b border-gray-200 hover:bg-gray-50"
                  >
                    <td className="sticky left-0 z-10 bg-white px-4 py-3 text-sm font-medium text-gray-900 border-r border-gray-200">
                      <div>
                        <div className="font-semibold">{room.name}</div>
                        <div className="text-xs text-gray-500">
                          {room.capacity_m2} m² • {getMaxDogsForRoom(room)}
                        </div>
                      </div>
                    </td>
                    {dates.map((date, i) => {
                      const roomBookings = getBookingsForRoomAndDate(
                        room.id,
                        date
                      );
                      const firstBooking = roomBookings[0];
                      const cellColor = getCellColor(firstBooking, date);

                      return (
                        <td
                          key={i}
                          className={`px-2 py-2 text-xs border-r border-gray-200 ${cellColor} transition-colors`}
                        >
                          {roomBookings.length > 0 ? (
                            <div className="space-y-1">
                              {roomBookings.map((booking, idx) => (
                                <div
                                  key={booking.id}
                                  className={
                                    idx > 0
                                      ? "border-t border-gray-300 pt-1"
                                      : ""
                                  }
                                >
                                  <div className="font-semibold text-gray-900 truncate">
                                    {booking.dogs?.name || "Okänd hund"}
                                  </div>
                                  {booking.dogs?.owners && (
                                    <div className="text-gray-600 truncate text-[10px]">
                                      {booking.dogs.owners.full_name}
                                    </div>
                                  )}
                                </div>
                              ))}
                            </div>
                          ) : (
                            <div className="text-center text-gray-400 text-xs">
                              —
                            </div>
                          )}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Empty state */}
        {rooms.length === 0 && (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 text-center">
            <p className="text-gray-500 mb-4">Inga rum hittades</p>
            <Link
              href="/rooms"
              className="inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-[#2c7a4c] rounded-md hover:bg-[#236139]"
            >
              Skapa rum
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
