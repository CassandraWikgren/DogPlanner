"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import { useAuth } from "@/app/context/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  ArrowLeft,
  Calendar,
  ChevronLeft,
  ChevronRight,
  Clock,
  User,
  Scissors,
  AlertCircle,
  CheckCircle2,
  XCircle,
} from "lucide-react";

// Error codes
const ERROR_CODES = {
  DATABASE_CONNECTION: "[ERR-1001]",
} as const;

interface GroomingBooking {
  id: string;
  appointment_date: string;
  appointment_time: string;
  service_type: string;
  estimated_price: number;
  status: "confirmed" | "completed" | "cancelled" | "no-show";
  notes: string | null;
  clip_length: string | null;
  shampoo_type: string | null;
  dog_id: string | null;
  external_customer_name: string | null;
  external_dog_name: string | null;
  external_dog_breed: string | null;
  dogs?: {
    id: string;
    name: string;
    breed: string | null;
    owners: {
      full_name: string;
      phone: string | null;
    } | null;
  } | null;
}

const DAYS = ["Mån", "Tis", "Ons", "Tor", "Fre", "Lör", "Sön"];
const MONTHS = [
  "Januari",
  "Februari",
  "Mars",
  "April",
  "Maj",
  "Juni",
  "Juli",
  "Augusti",
  "September",
  "Oktober",
  "November",
  "December",
];

const getStatusColor = (status: string) => {
  switch (status) {
    case "confirmed":
      return "bg-blue-100 text-blue-800 border-blue-300";
    case "completed":
      return "bg-green-100 text-green-800 border-green-300";
    case "cancelled":
      return "bg-red-100 text-red-800 border-red-300";
    case "no-show":
      return "bg-gray-100 text-gray-800 border-gray-300";
    default:
      return "bg-gray-100 text-gray-800 border-gray-300";
  }
};

const getStatusIcon = (status: string) => {
  switch (status) {
    case "confirmed":
      return <Clock className="h-3 w-3" />;
    case "completed":
      return <CheckCircle2 className="h-3 w-3" />;
    case "cancelled":
      return <XCircle className="h-3 w-3" />;
    case "no-show":
      return <AlertCircle className="h-3 w-3" />;
    default:
      return null;
  }
};

export default function GroomingCalendar() {
  const router = useRouter();
  const { currentOrgId, loading: authLoading } = useAuth();
  const supabase = createClientComponentClient();

  const [currentDate, setCurrentDate] = useState(new Date());
  const [bookings, setBookings] = useState<GroomingBooking[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedBooking, setSelectedBooking] =
    useState<GroomingBooking | null>(null);

  useEffect(() => {
    if (currentOrgId && !authLoading) {
      loadBookingsForWeek();
    }
  }, [currentOrgId, authLoading, currentDate]);

  const getWeekDates = (date: Date) => {
    const d = new Date(date);
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1); // Adjust for Sunday
    const monday = new Date(d.setDate(diff));

    const week = [];
    for (let i = 0; i < 7; i++) {
      const weekDate = new Date(monday);
      weekDate.setDate(monday.getDate() + i);
      week.push(weekDate);
    }
    return week;
  };

  const loadBookingsForWeek = async () => {
    if (!currentOrgId) return;

    setLoading(true);
    setError(null);

    try {
      const weekDates = getWeekDates(currentDate);
      const startDate = weekDates[0].toISOString().split("T")[0];
      const endDate = weekDates[6].toISOString().split("T")[0];

      const { data, error: dbError } = await supabase
        .from("grooming_bookings")
        .select(
          `
          *,
          dogs:dog_id(
            id,
            name,
            breed,
            owners:owner_id(
              full_name,
              phone
            )
          )
        `
        )
        .eq("org_id", currentOrgId)
        .gte("appointment_date", startDate)
        .lte("appointment_date", endDate)
        .order("appointment_date")
        .order("appointment_time");

      if (dbError) throw dbError;

      const processedBookings = (data || []).map((booking: any) => ({
        ...booking,
        dogs: Array.isArray(booking.dogs) ? booking.dogs[0] : booking.dogs,
      }));

      setBookings(processedBookings);
    } catch (err: any) {
      console.error(
        `${ERROR_CODES.DATABASE_CONNECTION} Fel vid laddning av bokningar:`,
        err
      );
      setError(`Kunde inte ladda bokningar: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const getBookingsForDate = (date: Date) => {
    const dateStr = date.toISOString().split("T")[0];
    return bookings.filter((b) => b.appointment_date === dateStr);
  };

  const goToPreviousWeek = () => {
    const newDate = new Date(currentDate);
    newDate.setDate(newDate.getDate() - 7);
    setCurrentDate(newDate);
  };

  const goToNextWeek = () => {
    const newDate = new Date(currentDate);
    newDate.setDate(newDate.getDate() + 7);
    setCurrentDate(newDate);
  };

  const goToToday = () => {
    setCurrentDate(new Date());
  };

  const isToday = (date: Date) => {
    const today = new Date();
    return (
      date.getDate() === today.getDate() &&
      date.getMonth() === today.getMonth() &&
      date.getFullYear() === today.getFullYear()
    );
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-[1800px] mx-auto">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-64 mb-6"></div>
            <div className="bg-white rounded-lg p-8">
              <div className="grid grid-cols-7 gap-4">
                {[...Array(7)].map((_, i) => (
                  <div key={i} className="h-64 bg-gray-200 rounded"></div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const weekDates = getWeekDates(currentDate);
  const weekStart = weekDates[0];
  const weekEnd = weekDates[6];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-gray-50 pt-6 px-6">
        <div className="max-w-[1800px] mx-auto">
          <Link href="/frisor">
            <Button variant="outline" className="mb-4">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Tillbaka till frisör
            </Button>
          </Link>
        </div>
      </div>

      {/* Hero */}
      <div className="relative bg-gradient-to-br from-orange-600 to-orange-700 text-white overflow-hidden">
        <div className="absolute inset-0 bg-black/10"></div>
        <div className="relative max-w-[1800px] mx-auto px-6 py-12">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-3 mb-3">
                <Calendar className="h-10 w-10" />
                <h1 className="text-3xl font-bold">Frisörkalender</h1>
              </div>
              <p className="text-white/90 text-lg">
                Veckoöversikt av alla bokningar
              </p>
            </div>
            <Link href="/frisor/ny-bokning">
              <Button
                size="lg"
                className="bg-white text-orange-600 hover:bg-gray-100"
              >
                <Scissors className="h-5 w-5 mr-2" />
                Ny Bokning
              </Button>
            </Link>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-[1800px] mx-auto px-6 py-6">
        {error && (
          <Card className="mb-6 border-red-200 bg-red-50">
            <CardContent className="p-4">
              <div className="flex items-start gap-3">
                <AlertCircle className="h-5 w-5 text-red-600 mt-0.5" />
                <div>
                  <p className="text-red-800 font-medium">Fel</p>
                  <p className="text-red-700 text-sm">{error}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Week Navigation */}
        <Card className="mb-6">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <Button onClick={goToPreviousWeek} variant="outline">
                <ChevronLeft className="h-5 w-5" />
              </Button>

              <div className="text-center">
                <h2 className="text-2xl font-bold text-gray-900">
                  Vecka{" "}
                  {Math.ceil(
                    (weekStart.getTime() -
                      new Date(weekStart.getFullYear(), 0, 1).getTime()) /
                      (7 * 24 * 60 * 60 * 1000)
                  )}
                </h2>
                <p className="text-gray-600">
                  {weekStart.getDate()} {MONTHS[weekStart.getMonth()]} -{" "}
                  {weekEnd.getDate()} {MONTHS[weekEnd.getMonth()]}{" "}
                  {weekEnd.getFullYear()}
                </p>
              </div>

              <div className="flex gap-2">
                <Button onClick={goToToday} variant="outline">
                  Idag
                </Button>
                <Button onClick={goToNextWeek} variant="outline">
                  <ChevronRight className="h-5 w-5" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Week Grid */}
        <div className="grid grid-cols-7 gap-4">
          {weekDates.map((date, index) => {
            const dayBookings = getBookingsForDate(date);
            const today = isToday(date);

            return (
              <Card
                key={index}
                className={`${
                  today ? "border-orange-500 border-2 bg-orange-50/30" : ""
                }`}
              >
                <CardHeader className="pb-3">
                  <div className="text-center">
                    <p className="text-sm font-semibold text-gray-600">
                      {DAYS[index]}
                    </p>
                    <p
                      className={`text-2xl font-bold ${
                        today ? "text-orange-600" : "text-gray-900"
                      }`}
                    >
                      {date.getDate()}
                    </p>
                    {today && (
                      <Badge className="mt-1 bg-orange-600 text-white text-xs">
                        Idag
                      </Badge>
                    )}
                  </div>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="space-y-2 min-h-[300px]">
                    {dayBookings.length === 0 ? (
                      <p className="text-center text-gray-400 text-sm mt-4">
                        Inga bokningar
                      </p>
                    ) : (
                      dayBookings.map((booking) => (
                        <button
                          key={booking.id}
                          onClick={() => setSelectedBooking(booking)}
                          className={`w-full p-3 rounded-lg border-2 text-left transition-all hover:shadow-md ${getStatusColor(
                            booking.status
                          )}`}
                        >
                          <div className="flex items-center gap-2 mb-1">
                            <Clock className="h-3 w-3" />
                            <span className="text-xs font-bold">
                              {booking.appointment_time}
                            </span>
                            <div className="ml-auto">
                              {getStatusIcon(booking.status)}
                            </div>
                          </div>
                          <p className="text-sm font-semibold truncate">
                            {booking.dogs?.name || booking.external_dog_name}
                          </p>
                          <p className="text-xs truncate opacity-75">
                            {booking.dogs?.owners?.full_name ||
                              booking.external_customer_name}
                          </p>
                          <p className="text-xs font-medium mt-1">
                            {booking.estimated_price} kr
                          </p>
                        </button>
                      ))
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Stats Summary */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-6">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center">
                  <Clock className="h-6 w-6 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-600">Bekräftade</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {bookings.filter((b) => b.status === "confirmed").length}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center">
                  <CheckCircle2 className="h-6 w-6 text-green-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-600">Slutförda</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {bookings.filter((b) => b.status === "completed").length}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center">
                  <XCircle className="h-6 w-6 text-red-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-600">Avbokade</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {bookings.filter((b) => b.status === "cancelled").length}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-emerald-100 flex items-center justify-center">
                  <span className="text-xl font-bold text-emerald-600">kr</span>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Intäkter (vecka)</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {bookings
                      .filter((b) => b.status === "completed")
                      .reduce((sum, b) => sum + b.estimated_price, 0)}{" "}
                    kr
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Booking Detail Modal */}
      {selectedBooking && (
        <div
          className="fixed inset-0 bg-black/50 flex items-center justify-center p-6 z-50"
          onClick={() => setSelectedBooking(null)}
        >
          <div
            className="max-w-md w-full"
            onClick={(e: React.MouseEvent) => e.stopPropagation()}
          >
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>Bokningsdetaljer</span>
                  <Badge className={getStatusColor(selectedBooking.status)}>
                    {selectedBooking.status}
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div>
                    <p className="text-sm text-gray-600">Hund</p>
                    <p className="font-semibold text-gray-900">
                      {selectedBooking.dogs?.name ||
                        selectedBooking.external_dog_name}
                    </p>
                    {(selectedBooking.dogs?.breed ||
                      selectedBooking.external_dog_breed) && (
                      <p className="text-sm text-gray-600">
                        {selectedBooking.dogs?.breed ||
                          selectedBooking.external_dog_breed}
                      </p>
                    )}
                  </div>

                  <div>
                    <p className="text-sm text-gray-600">Ägare</p>
                    <p className="font-semibold text-gray-900">
                      {selectedBooking.dogs?.owners?.full_name ||
                        selectedBooking.external_customer_name}
                    </p>
                    {selectedBooking.dogs?.owners?.phone && (
                      <p className="text-sm text-gray-600">
                        {selectedBooking.dogs.owners.phone}
                      </p>
                    )}
                  </div>

                  <div>
                    <p className="text-sm text-gray-600">Datum & Tid</p>
                    <p className="font-semibold text-gray-900">
                      {new Date(
                        selectedBooking.appointment_date
                      ).toLocaleDateString("sv-SE")}{" "}
                      kl {selectedBooking.appointment_time}
                    </p>
                  </div>

                  <div>
                    <p className="text-sm text-gray-600">Behandling</p>
                    <p className="font-semibold text-gray-900">
                      {selectedBooking.service_type}
                    </p>
                  </div>

                  {selectedBooking.clip_length && (
                    <div>
                      <p className="text-sm text-gray-600">Klipplängd</p>
                      <p className="font-semibold text-gray-900">
                        {selectedBooking.clip_length}
                      </p>
                    </div>
                  )}

                  {selectedBooking.shampoo_type && (
                    <div>
                      <p className="text-sm text-gray-600">Schampo</p>
                      <p className="font-semibold text-gray-900">
                        {selectedBooking.shampoo_type}
                      </p>
                    </div>
                  )}

                  {selectedBooking.notes && (
                    <div>
                      <p className="text-sm text-gray-600">Anteckningar</p>
                      <p className="text-sm text-gray-900">
                        {selectedBooking.notes}
                      </p>
                    </div>
                  )}

                  <div>
                    <p className="text-sm text-gray-600">Pris</p>
                    <p className="text-xl font-bold text-gray-900">
                      {selectedBooking.estimated_price} kr
                    </p>
                  </div>
                </div>

                <div className="flex gap-2 mt-6">
                  <Button
                    onClick={() => setSelectedBooking(null)}
                    variant="outline"
                    className="flex-1"
                  >
                    Stäng
                  </Button>
                  <Button
                    onClick={() => {
                      if (selectedBooking.dogs?.id) {
                        router.push(`/frisor/${selectedBooking.dogs.id}`);
                      }
                    }}
                    className="flex-1 bg-orange-600 hover:bg-orange-700"
                    disabled={!selectedBooking.dogs?.id}
                  >
                    Visa Journal
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      )}
    </div>
  );
}
