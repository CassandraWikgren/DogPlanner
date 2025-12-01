"use client";

import React, { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { useAuth } from "@/app/context/AuthContext";
import {
  Calendar,
  Download,
  TrendingUp,
  DollarSign,
  Users,
  Home,
} from "lucide-react";
import * as XLSX from "xlsx";

// Error codes för robust felhantering
const ERROR_CODES = {
  NO_ORG: "[ERR-4001] Ingen organisation tilldelad",
  FETCH_BOOKINGS: "[ERR-4002] Kunde inte hämta bokningsdata",
  FETCH_INVOICES: "[ERR-4003] Kunde inte hämta fakturadata",
  FETCH_DOGS: "[ERR-4004] Kunde inte hämta hunddata",
  DATE_INVALID: "[ERR-4005] Ogiltigt datumformat",
  EXPORT_FAILED: "[ERR-4006] Excel-export misslyckades",
} as const;

interface ReportStats {
  // Bokningar
  totalBookings: number;
  confirmedBookings: number;
  pendingBookings: number;
  cancelledBookings: number;

  // Ekonomi
  totalRevenue: number;
  paidInvoices: number;
  unpaidInvoices: number;
  overdueInvoices: number;

  // Beläggning
  averageOccupancy: number;
  peakOccupancy: number;
  totalDogs: number;
  activeDogs: number;
}

export default function RapporterPage() {
  const { currentOrgId, loading: authLoading } = useAuth();
  const supabase = createClient();

  const [stats, setStats] = useState<ReportStats>({
    totalBookings: 0,
    confirmedBookings: 0,
    pendingBookings: 0,
    cancelledBookings: 0,
    totalRevenue: 0,
    paidInvoices: 0,
    unpaidInvoices: 0,
    overdueInvoices: 0,
    averageOccupancy: 0,
    peakOccupancy: 0,
    totalDogs: 0,
    activeDogs: 0,
  });

  const [dateRange, setDateRange] = useState({
    start: new Date(new Date().getFullYear(), new Date().getMonth(), 1)
      .toISOString()
      .split("T")[0],
    end: new Date().toISOString().split("T")[0],
  });

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (currentOrgId) {
      fetchReportData();
    } else if (!authLoading) {
      setError(ERROR_CODES.NO_ORG);
      setLoading(false);
    }
  }, [currentOrgId, dateRange, authLoading]);

  const fetchReportData = async () => {
    try {
      setLoading(true);
      setError(null);

      if (!currentOrgId) {
        throw new Error(ERROR_CODES.NO_ORG);
      }

      // Validera datum
      if (!dateRange.start || !dateRange.end) {
        throw new Error(ERROR_CODES.DATE_INVALID);
      }

      // Hämta data parallellt för bättre prestanda
      const [bookingsResult, dogsResult, roomsResult] = await Promise.all([
        // Bokningar inom datumintervall
        supabase
          .from("bookings")
          .select("id, status, start_date, end_date, total_price, room_id")
          .eq("org_id", currentOrgId)
          .gte("start_date", dateRange.start)
          .lte("end_date", dateRange.end),

        // Hundar
        supabase
          .from("dogs")
          .select("id, checked_in")
          .eq("org_id", currentOrgId),

        // Rum för beläggning
        supabase
          .from("rooms")
          .select("id, capacity_m2")
          .eq("org_id", currentOrgId),
      ]);

      // Felhantering med specifika error codes
      if (bookingsResult.error) {
        console.error(ERROR_CODES.FETCH_BOOKINGS, bookingsResult.error);
        throw new Error(ERROR_CODES.FETCH_BOOKINGS);
      }

      if (dogsResult.error) {
        console.error(ERROR_CODES.FETCH_DOGS, dogsResult.error);
        throw new Error(ERROR_CODES.FETCH_DOGS);
      }

      const bookings = bookingsResult.data || [];
      const dogs = dogsResult.data || [];
      const rooms = roomsResult.data || [];

      // Beräkna statistik
      const confirmedBookings = bookings.filter(
        (b) => b.status === "confirmed"
      );
      const pendingBookings = bookings.filter((b) => b.status === "pending");
      const cancelledBookings = bookings.filter(
        (b) => b.status === "cancelled"
      );

      // Intäkter från bekräftade bokningar
      const totalRevenue = confirmedBookings.reduce(
        (sum, b) => sum + (b.total_price || 0),
        0
      );

      // Beläggning: räkna unika rum per dag
      const occupancyMap = new Map<string, Set<string>>();
      confirmedBookings.forEach((booking) => {
        const start = new Date(booking.start_date);
        const end = new Date(booking.end_date);

        for (let d = start; d <= end; d.setDate(d.getDate() + 1)) {
          const dateKey = d.toISOString().split("T")[0];
          if (!occupancyMap.has(dateKey)) {
            occupancyMap.set(dateKey, new Set());
          }
          if (booking.room_id) {
            occupancyMap.get(dateKey)?.add(booking.room_id);
          }
        }
      });

      // Genomsnittlig och max beläggning
      const totalRooms = rooms.length || 1;
      const occupancyRates = Array.from(occupancyMap.values()).map(
        (roomSet) => (roomSet.size / totalRooms) * 100
      );

      const averageOccupancy =
        occupancyRates.length > 0
          ? occupancyRates.reduce((sum, rate) => sum + rate, 0) /
            occupancyRates.length
          : 0;

      const peakOccupancy =
        occupancyRates.length > 0 ? Math.max(...occupancyRates) : 0;

      setStats({
        totalBookings: bookings.length,
        confirmedBookings: confirmedBookings.length,
        pendingBookings: pendingBookings.length,
        cancelledBookings: cancelledBookings.length,
        totalRevenue,
        paidInvoices: confirmedBookings.length, // Approximation
        unpaidInvoices: pendingBookings.length,
        overdueInvoices: 0, // Skulle kräva invoice_logs
        averageOccupancy,
        peakOccupancy,
        totalDogs: dogs.length,
        activeDogs: dogs.filter((d) => d.checked_in).length,
      });
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : ERROR_CODES.FETCH_BOOKINGS;
      console.error("Report fetch error:", errorMessage);
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleExport = async () => {
    try {
      if (!currentOrgId) {
        throw new Error(ERROR_CODES.NO_ORG);
      }

      // Hämta fullständig bokningsdata för export
      const { data: bookings, error: bookingsError } = await supabase
        .from("bookings")
        .select(
          `
          id,
          start_date,
          end_date,
          status,
          total_price,
          special_requests,
          belongings,
          bed_location,
          dogs (
            name,
            breed
          ),
          owners (
            full_name,
            email,
            phone
          ),
          rooms (
            name
          )
        `
        )
        .eq("org_id", currentOrgId)
        .gte("start_date", dateRange.start)
        .lte("end_date", dateRange.end)
        .order("start_date", { ascending: false });

      if (bookingsError) {
        console.error(ERROR_CODES.EXPORT_FAILED, bookingsError);
        throw new Error(ERROR_CODES.EXPORT_FAILED);
      }

      // Formattera data för Excel
      const excelData = bookings.map((booking: any) => ({
        "Boknings-ID": booking.id,
        Incheckning: booking.start_date,
        Utcheckning: booking.end_date,
        Status:
          booking.status === "confirmed"
            ? "Bekräftad"
            : booking.status === "pending"
              ? "Väntande"
              : "Avbokad",
        Hund: booking.dogs?.name || "-",
        Ras: booking.dogs?.breed || "-",
        Ägare: booking.owners?.full_name || "-",
        Email: booking.owners?.email || "-",
        Telefon: booking.owners?.phone || "-",
        Rum: booking.rooms?.name || "-",
        Sängplacering: booking.bed_location || "-",
        Tillhörigheter: booking.belongings || "-",
        "Pris (kr)": booking.total_price || 0,
        "Önskemål/Anmärkningar": booking.special_requests || "-",
      }));

      // Skapa sammanfattningsdata
      const summaryData = [
        {
          Sammanfattning: "Totalt antal bokningar",
          Värde: stats.totalBookings,
        },
        {
          Sammanfattning: "Bekräftade bokningar",
          Värde: stats.confirmedBookings,
        },
        {
          Sammanfattning: "Väntande bokningar",
          Värde: stats.pendingBookings,
        },
        {
          Sammanfattning: "Avbokade bokningar",
          Värde: stats.cancelledBookings,
        },
        { Sammanfattning: "", Värde: "" },
        {
          Sammanfattning: "Totala intäkter (kr)",
          Värde: stats.totalRevenue,
        },
        {
          Sammanfattning: "Genomsnittlig beläggning (%)",
          Värde: stats.averageOccupancy.toFixed(1),
        },
        {
          Sammanfattning: "Max beläggning (%)",
          Värde: stats.peakOccupancy.toFixed(1),
        },
      ];

      // Skapa Excel workbook
      const workbook = XLSX.utils.book_new();

      // Lägg till sammanfattning
      const summarySheet = XLSX.utils.json_to_sheet(summaryData);
      XLSX.utils.book_append_sheet(workbook, summarySheet, "Sammanfattning");

      // Lägg till bokningsdata
      const bookingsSheet = XLSX.utils.json_to_sheet(excelData);
      XLSX.utils.book_append_sheet(workbook, bookingsSheet, "Bokningar");

      // Generera filnamn med datum
      const filename = `DogPlanner_Rapport_${dateRange.start}_till_${dateRange.end}.xlsx`;

      // Spara fil
      XLSX.writeFile(workbook, filename);

      console.log(`✅ Excel-export lyckades: ${filename}`);
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : ERROR_CODES.EXPORT_FAILED;
      console.error("Export error:", errorMessage);
      alert(`Export misslyckades: ${errorMessage}`);
    }
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="border-b border-gray-200 bg-white shadow-sm">
          <div className="max-w-7xl mx-auto px-6 py-4">
            <h1 className="text-[32px] font-bold text-[#2c7a4c] leading-tight">
              Rapporter
            </h1>
            <p className="mt-1 text-base text-gray-600">
              Laddar rapportdata...
            </p>
          </div>
        </div>
        <div className="max-w-7xl mx-auto px-6 py-12 text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#2c7a4c] mx-auto"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="border-b border-gray-200 bg-white shadow-sm">
          <div className="max-w-7xl mx-auto px-6 py-4">
            <h1 className="text-[32px] font-bold text-[#2c7a4c] leading-tight">
              Rapporter
            </h1>
          </div>
        </div>
        <div className="max-w-7xl mx-auto px-6 py-12">
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-8 text-center">
            <div className="text-5xl mb-4">📊</div>
            <p className="text-yellow-800 font-medium text-lg mb-2">
              {error === ERROR_CODES.FETCH_BOOKINGS
                ? "Ingen bokningsdata att visa"
                : error === ERROR_CODES.NO_ORG
                  ? "Ingen organisation tilldelad"
                  : error}
            </p>
            <p className="text-gray-600 mb-6 max-w-md mx-auto">
              {error === ERROR_CODES.FETCH_BOOKINGS
                ? "Det finns inga bokningar för det valda datumintervallet. Skapa din första bokning för att se rapporter här!"
                : "Ett fel uppstod vid hämtning av data. Prova att ladda om sidan."}
            </p>
            <button
              onClick={() => (window.location.href = "/dashboard")}
              className="px-6 py-3 bg-[#2c7a4c] text-white rounded-lg hover:bg-[#236139] transition-colors font-medium"
            >
              Gå till Dashboard
            </button>
          </div>
        </div>
      </div>
    );
  }

  const statCards = [
    {
      title: "Totala bokningar",
      value: stats.totalBookings,
      subtitle: `${stats.confirmedBookings} bekräftade, ${stats.pendingBookings} väntande`,
      icon: Calendar,
      color: "text-blue-600",
      bgColor: "bg-blue-50",
    },
    {
      title: "Intäkter",
      value: `${stats.totalRevenue.toLocaleString("sv-SE")} kr`,
      subtitle: `${stats.confirmedBookings} betalda bokningar`,
      icon: DollarSign,
      color: "text-green-600",
      bgColor: "bg-green-50",
    },
    {
      title: "Beläggning (snitt)",
      value: `${stats.averageOccupancy.toFixed(1)}%`,
      subtitle: `Max: ${stats.peakOccupancy.toFixed(1)}%`,
      icon: Home,
      color: "text-purple-600",
      bgColor: "bg-purple-50",
    },
    {
      title: "Hundar totalt",
      value: stats.totalDogs,
      subtitle: `${stats.activeDogs} aktiva idag`,
      icon: Users,
      color: "text-orange-600",
      bgColor: "bg-orange-50",
    },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header - EXAKT som Hunddagis */}
      <div className="border-b border-gray-200 bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <h1 className="text-[32px] font-bold text-[#2c7a4c] leading-tight">
                Rapporter
              </h1>
              <p className="mt-1 text-base text-gray-600">
                Ekonomi, beläggning och statistik för {dateRange.start} -{" "}
                {dateRange.end}
              </p>
            </div>
            <button
              onClick={handleExport}
              className="flex items-center gap-2 px-4 py-2 bg-[#2c7a4c] text-white rounded-lg hover:bg-[#236139] transition-colors"
            >
              <Download className="w-4 h-4" />
              Exportera till Excel
            </button>
          </div>
        </div>
      </div>

      {/* Main Content - EXAKT som Hunddagis */}
      <div className="max-w-7xl mx-auto px-6 py-6">
        {/* Datumfilter */}
        <div className="bg-white rounded-lg p-6 border border-gray-200 shadow-sm mb-6">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-1 h-6 bg-[#2c7a4c] rounded-full"></div>
            <h2 className="text-xl font-bold text-[#333333]">Välj period</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Startdatum
              </label>
              <input
                type="date"
                value={dateRange.start}
                onChange={(e) =>
                  setDateRange({ ...dateRange, start: e.target.value })
                }
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#2c7a4c] focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Slutdatum
              </label>
              <input
                type="date"
                value={dateRange.end}
                onChange={(e) =>
                  setDateRange({ ...dateRange, end: e.target.value })
                }
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#2c7a4c] focus:border-transparent"
              />
            </div>
          </div>
        </div>

        {/* Statistikkort */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
          {statCards.map((card, index) => (
            <div
              key={index}
              className="bg-white rounded-lg p-6 border border-gray-200 shadow-sm hover:shadow-md transition-all"
            >
              <div className="flex items-center justify-between mb-4">
                <div className={`p-3 rounded-lg ${card.bgColor}`}>
                  <card.icon className={`w-6 h-6 ${card.color}`} />
                </div>
              </div>
              <p className="text-sm font-medium text-gray-500 mb-2 uppercase tracking-wide">
                {card.title}
              </p>
              <p className="text-3xl font-bold text-gray-900 mb-1">
                {card.value}
              </p>
              <p className="text-sm text-gray-500">{card.subtitle}</p>
            </div>
          ))}
        </div>

        {/* Detaljerad statistik */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Bokningar per status */}
          <div className="bg-white rounded-lg p-6 border border-gray-200 shadow-sm">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-1 h-6 bg-[#2c7a4c] rounded-full"></div>
              <h2 className="text-xl font-bold text-[#333333]">
                Bokningar per status
              </h2>
            </div>
            <div className="space-y-4">
              <div className="flex justify-between items-center p-4 bg-green-50 rounded-lg">
                <span className="font-medium text-gray-700">Bekräftade</span>
                <span className="text-2xl font-bold text-green-600">
                  {stats.confirmedBookings}
                </span>
              </div>
              <div className="flex justify-between items-center p-4 bg-yellow-50 rounded-lg">
                <span className="font-medium text-gray-700">Väntande</span>
                <span className="text-2xl font-bold text-yellow-600">
                  {stats.pendingBookings}
                </span>
              </div>
              <div className="flex justify-between items-center p-4 bg-gray-50 rounded-lg">
                <span className="font-medium text-gray-700">Avbokade</span>
                <span className="text-2xl font-bold text-gray-600">
                  {stats.cancelledBookings}
                </span>
              </div>
            </div>
          </div>

          {/* Ekonomisk översikt */}
          <div className="bg-white rounded-lg p-6 border border-gray-200 shadow-sm">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-1 h-6 bg-[#2c7a4c] rounded-full"></div>
              <h2 className="text-xl font-bold text-[#333333]">
                Ekonomisk översikt
              </h2>
            </div>
            <div className="space-y-4">
              <div className="flex justify-between items-center p-4 bg-green-50 rounded-lg">
                <span className="font-medium text-gray-700">
                  Totala intäkter
                </span>
                <span className="text-2xl font-bold text-green-600">
                  {stats.totalRevenue.toLocaleString("sv-SE")} kr
                </span>
              </div>
              <div className="flex justify-between items-center p-4 bg-blue-50 rounded-lg">
                <span className="font-medium text-gray-700">
                  Genomsnitt/bokning
                </span>
                <span className="text-2xl font-bold text-blue-600">
                  {stats.confirmedBookings > 0
                    ? Math.round(
                        stats.totalRevenue / stats.confirmedBookings
                      ).toLocaleString("sv-SE")
                    : 0}{" "}
                  kr
                </span>
              </div>
              <div className="flex justify-between items-center p-4 bg-purple-50 rounded-lg">
                <span className="font-medium text-gray-700">
                  Beläggningsgrad
                </span>
                <span className="text-2xl font-bold text-purple-600">
                  {stats.averageOccupancy.toFixed(1)}%
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
