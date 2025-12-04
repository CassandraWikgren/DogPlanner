"use client";

import { useEffect, useMemo, useState } from "react";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { createClient } from "@/lib/supabase/client";
import { useAuth } from "@/app/context/AuthContext";
import Link from "next/link";
import {
  Calendar,
  Plus,
  Download,
  RefreshCcw,
  Filter,
  Search,
  DollarSign,
  Settings,
  ClipboardList,
  Grid3x3,
} from "lucide-react";
import type { Database } from "@/types/database";

// Felkoder enligt systemet
const ERROR_CODES = {
  DATABASE_CONNECTION: "[ERR-1001]",
  PDF_EXPORT: "[ERR-2001]",
  REALTIME: "[ERR-3001]",
  VALIDATION: "[ERR-4001]",
} as const;

// === TYPER MED SUPABASE-STRUKTUR ===
type Booking = Database["public"]["Tables"]["bookings"]["Row"] & {
  dogs?:
    | (Database["public"]["Tables"]["dogs"]["Row"] & {
        owners?: Database["public"]["Tables"]["owners"]["Row"] | null;
      })
    | null;
  rooms?: Database["public"]["Tables"]["rooms"]["Row"] | null;
};

type Room = Database["public"]["Tables"]["rooms"]["Row"];
type Dog = Database["public"]["Tables"]["dogs"]["Row"];
type Owner = Database["public"]["Tables"]["owners"]["Row"];

export default function HundpensionatPage() {
  const supabase = createClient();
  const { user, currentOrgId, loading } = useAuth();
  // ✅ FIX: Fallback till metadata om AuthContext inte hunnit sätta currentOrgId
  const effectiveOrgId =
    currentOrgId || (user as any)?.user_metadata?.org_id || null;
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [search, setSearch] = useState("");
  const [sortKey, setSortKey] = useState<string>("start_date");
  const [sortAsc, setSortAsc] = useState(true);
  const [selectedMonthId, setSelectedMonthId] = useState<string>("");
  const [quickFilter, setQuickFilter] = useState<string>("all"); // ny state för snabbfilter
  const [visibleColumns, setVisibleColumns] = useState<Record<string, boolean>>(
    {
      room: true,
      dog: true,
      owner: true,
      start_date: true,
      end_date: true,
      status: true,
      price: true,
      discount: true,
    }
  );

  // Live-statistik state - anpassad för personal (ej admin)
  const [liveStats, setLiveStats] = useState({
    hundarIdag: 0,
    incheckIdag: 0,
    utcheckIdag: 0,
    incheckImorgon: 0, // Ny för planering
    utcheckImorgon: 0, // Ny för planering
    pendingBookings: 0,
  });

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string>("");

  // Ladda live-statistik
  const loadLiveStats = async () => {
    if (!effectiveOrgId) return;

    try {
      console.log("🔍 Laddar statistik...");

      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const todayStr = today.toISOString().split("T")[0];

      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);
      const tomorrowStr = tomorrow.toISOString().split("T")[0];

      // Hämta ALLA confirmed bookings för beräkningar
      const { data: allBookings } = await supabase
        .from("bookings")
        .select("start_date, end_date, status")
        .eq("org_id", effectiveOrgId)
        .eq("status", "confirmed");

      // Hundar som är här IDAG (startdatum <= idag OCH slutdatum >= idag)
      const hundarIdag = (allBookings || []).filter((b) => {
        return b.start_date <= todayStr && b.end_date >= todayStr;
      }).length;

      // Incheckning IDAG (startdatum === idag)
      const incheckIdag = (allBookings || []).filter((b) => {
        return b.start_date === todayStr;
      }).length;

      // Utcheckning IDAG (slutdatum === idag)
      const utcheckIdag = (allBookings || []).filter((b) => {
        return b.end_date === todayStr;
      }).length;

      // Incheckning IMORGON (startdatum === imorgon)
      const incheckImorgon = (allBookings || []).filter((b) => {
        return b.start_date === tomorrowStr;
      }).length;

      // Utcheckning IMORGON (slutdatum === imorgon)
      const utcheckImorgon = (allBookings || []).filter((b) => {
        return b.end_date === tomorrowStr;
      }).length;

      // Hämta antal pending bookings
      const { count: pendingCount } = await supabase
        .from("bookings")
        .select("id", { count: "exact", head: true })
        .eq("org_id", effectiveOrgId)
        .eq("status", "pending");

      setLiveStats({
        hundarIdag,
        incheckIdag,
        utcheckIdag,
        incheckImorgon,
        utcheckImorgon,
        pendingBookings: pendingCount || 0,
      });

      console.log("✅ Statistik laddad:", {
        hundarIdag,
        incheckIdag,
        utcheckIdag,
        incheckImorgon,
        utcheckImorgon,
        pendingBookings: pendingCount || 0,
      });
    } catch (error) {
      console.error("Fel vid laddning av statistik:", error);
      setLiveStats({
        hundarIdag: 0,
        incheckIdag: 0,
        utcheckIdag: 0,
        incheckImorgon: 0,
        utcheckImorgon: 0,
        pendingBookings: 0,
      });
    }
  };

  // Ladda bokningar från Supabase
  const loadBookings = async () => {
    if (!effectiveOrgId || !supabase) {
      console.log(
        "Ingen organisation hittad för användaren eller ingen databaskoppling"
      );
      return;
    }

    setIsLoading(true);
    setError("");

    try {
      const { data, error: dbError } = await supabase
        .from("bookings")
        .select(
          `
          *,
          dogs (
            *,
            owners (*),
            rooms (*)
          )
        `
        )
        .eq("org_id", effectiveOrgId)
        .order("start_date", { ascending: false });

      if (dbError) throw dbError;

      setBookings((data as any) || []);
      console.log("✅ Bokningar laddade:", data?.length || 0);
    } catch (error) {
      console.error("🔥 Fel vid laddning av bokningar:", error);
      setError("Kunde inte ladda bokningar");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (effectiveOrgId) {
      loadBookings();
      loadLiveStats();
    } else {
      // ✅ FIX: Sätt loading state korrekt medan vi väntar på org_id
      setIsLoading(true);
      const timer = setTimeout(() => {
        if (!effectiveOrgId) {
          setError("Ingen organisation tilldelad");
          setIsLoading(false);
        }
      }, 5000); // Vänta 5 sekunder innan error
      return () => clearTimeout(timer);
    }
  }, [effectiveOrgId]);

  // Filtrering och sökning
  const filtered = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const weekEnd = new Date(today);
    weekEnd.setDate(weekEnd.getDate() + 7);

    const nextWeekEnd = new Date(today);
    nextWeekEnd.setDate(nextWeekEnd.getDate() + 14);

    return bookings.filter((booking) => {
      const searchTerm = search.toLowerCase();
      const monthMatch = selectedMonthId
        ? booking.start_date?.startsWith(selectedMonthId)
        : true;

      const textMatch =
        !search ||
        booking.dogs?.name?.toLowerCase().includes(searchTerm) ||
        booking.dogs?.owners?.full_name?.toLowerCase().includes(searchTerm) ||
        booking.rooms?.name?.toLowerCase().includes(searchTerm) ||
        booking.status?.toLowerCase().includes(searchTerm);

      // Snabbfilter baserat på datum
      let quickFilterMatch = true;
      if (quickFilter !== "all") {
        const startDate = new Date(booking.start_date || "");
        const endDate = new Date(booking.end_date || "");

        startDate.setHours(0, 0, 0, 0);
        endDate.setHours(0, 0, 0, 0);

        switch (quickFilter) {
          case "today":
            // Hundar som är här idag (checkat in och inte checkat ut)
            quickFilterMatch = startDate <= today && endDate >= today;
            break;
          case "this-week":
            // Bokningar som startar eller pågår denna vecka
            quickFilterMatch =
              startDate < weekEnd || (startDate <= weekEnd && endDate >= today);
            break;
          case "next-week":
            // Bokningar som startar nästa vecka
            quickFilterMatch = startDate >= weekEnd && startDate < nextWeekEnd;
            break;
          default:
            quickFilterMatch = true;
        }
      }

      return monthMatch && textMatch && quickFilterMatch;
    });
  }, [bookings, search, selectedMonthId, quickFilter]);

  // Sortering
  const sorted = useMemo(() => {
    return [...filtered].sort((a, b) => {
      let aVal: any = a[sortKey as keyof Booking];
      let bVal: any = b[sortKey as keyof Booking];

      // Särskild hantering för relaterade tabeller
      if (sortKey === "dog") {
        aVal = a.dogs?.name || "";
        bVal = b.dogs?.name || "";
      } else if (sortKey === "owner") {
        aVal = a.dogs?.owners?.full_name || "";
        bVal = b.dogs?.owners?.full_name || "";
      } else if (sortKey === "room") {
        aVal = a.rooms?.name || "";
        bVal = b.rooms?.name || "";
      }

      if (aVal < bVal) return sortAsc ? -1 : 1;
      if (aVal > bVal) return sortAsc ? 1 : -1;
      return 0;
    });
  }, [filtered, sortKey, sortAsc]);

  // Hantera sortering
  const handleSort = (key: string) => {
    if (sortKey === key) {
      setSortAsc(!sortAsc);
    } else {
      setSortKey(key);
      setSortAsc(true);
    }
  };

  // Hämta månader för filtering
  const availableMonths = useMemo(() => {
    const months = new Set<string>();
    bookings.forEach((booking) => {
      if (booking.start_date) {
        const month = booking.start_date.substring(0, 7);
        months.add(month);
      }
    });
    return Array.from(months).sort().reverse();
  }, [bookings]);

  // PDF Export
  const exportToPDF = () => {
    try {
      const doc = new jsPDF();

      doc.setFontSize(20);
      doc.text("Hundpensionat - Bokningar", 14, 22);

      doc.setFontSize(12);
      doc.text(`Genererad: ${new Date().toLocaleDateString("sv-SE")}`, 14, 32);

      if (search || selectedMonthId) {
        let filterText = "Filter: ";
        if (search) filterText += `Sökning: "${search}" `;
        if (selectedMonthId) {
          const monthName = new Date(
            selectedMonthId + "-01"
          ).toLocaleDateString("sv-SE", {
            year: "numeric",
            month: "long",
          });
          filterText += `Månad: ${monthName}`;
        }
        doc.text(filterText, 14, 40);
      }

      const tableData = sorted.map((booking) => [
        booking.rooms?.name || "—",
        booking.dogs?.name || "—",
        booking.dogs?.owners?.full_name || "—",
        booking.start_date || "—",
        booking.end_date || "—",
        booking.status || "—",
        booking.total_price ? `${booking.total_price} kr` : "—",
        booking.discount_amount ? `${booking.discount_amount} kr` : "—",
      ]);

      autoTable(doc, {
        head: [
          [
            "Rum",
            "Hund",
            "Ägare",
            "Startdatum",
            "Slutdatum",
            "Status",
            "Totalpris",
            "Rabatt",
          ],
        ],
        body: tableData,
        startY: search || selectedMonthId ? 50 : 42,
        styles: { fontSize: 8 },
        headStyles: { fillColor: [44, 122, 76] },
      });

      doc.save(
        `hundpensionat-bokningar-${new Date().toISOString().split("T")[0]}.pdf`
      );
      console.log("✅ PDF exporterad");
    } catch (error) {
      console.error(`${ERROR_CODES.PDF_EXPORT} Fel vid PDF-export:`, error);
      setError("Kunde inte exportera PDF");
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        Laddar...
      </div>
    );
  }

  // Tillfälligt inaktiverat för localhost-utveckling
  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        Du måste vara inloggad
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header - enligt DESIGN_STANDARD_IMPLEMENTATION.md */}
      <div className="border-b border-gray-200 bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <h1 className="text-[32px] font-bold text-[#2c7a4c] leading-tight">
                Hundpensionat
              </h1>
              <p className="mt-1 text-base text-gray-600">
                Professionell pensionathantering med fullständig översikt
              </p>
            </div>

            {/* Statistik inline höger - Kompakta boxar */}
            <div className="flex items-center gap-4 ml-8">
              <div className="text-center bg-white rounded-lg px-4 py-2 border border-gray-200 shadow-sm">
                <p className="text-2xl font-bold text-[#2c7a4c]">
                  {liveStats.hundarIdag}
                </p>
                <p className="text-xs text-gray-600 mt-0.5">Aktiva idag</p>
              </div>
              <div className="text-center bg-white rounded-lg px-4 py-2 border border-gray-200 shadow-sm">
                <p className="text-2xl font-bold text-blue-600">
                  {liveStats.incheckIdag}
                </p>
                <p className="text-xs text-gray-600 mt-0.5">Ankomster</p>
              </div>
              <div className="text-center bg-white rounded-lg px-4 py-2 border border-gray-200 shadow-sm">
                <p className="text-2xl font-bold text-orange-600">
                  {liveStats.utcheckIdag}
                </p>
                <p className="text-xs text-gray-600 mt-0.5">Avresor</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content - enligt DESIGN_STANDARD_IMPLEMENTATION.md */}
      <main className="max-w-7xl mx-auto px-6 py-6">
        {/* Action buttons row */}
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center gap-3">
            <Link
              href="/hundpensionat/nybokning"
              className="inline-flex items-center px-4 py-2.5 rounded-md text-[15px] font-semibold text-white bg-[#2c7a4c] hover:bg-[#236139] shadow-sm transition-colors focus:outline-none focus:ring-2 focus:ring-[#2c7a4c] focus:ring-offset-2"
            >
              <Plus className="h-4 w-4 mr-2" />
              Ny bokning
            </Link>
            <Link
              href="/hundpensionat/ansokningar"
              className="relative inline-flex items-center px-4 py-2.5 rounded-md text-[15px] font-semibold text-white bg-gray-500 hover:bg-gray-600 shadow-sm transition-colors focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
            >
              <ClipboardList className="h-4 w-4 mr-2" />
              Ansökningar
              {liveStats.pendingBookings > 0 && (
                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center">
                  {liveStats.pendingBookings}
                </span>
              )}
            </Link>
            <button
              onClick={loadBookings}
              disabled={isLoading}
              className="inline-flex items-center px-4 py-2.5 rounded-md text-[15px] font-semibold bg-white text-[#2c7a4c] border border-[#2c7a4c] hover:bg-[#E6F4EA] shadow-sm transition-colors focus:outline-none focus:ring-2 focus:ring-[#2c7a4c] focus:ring-offset-2 disabled:opacity-50"
            >
              <RefreshCcw
                className={`h-4 w-4 mr-2 ${isLoading ? "animate-spin" : ""}`}
              />
              Ladda om
            </button>
          </div>
          <div className="flex items-center gap-2">
            <Link
              href="/hundpensionat/priser"
              className="inline-flex items-center px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
            >
              <DollarSign className="h-4 w-4 mr-1" />
              Priser
            </Link>
            <Link
              href="/hundpensionat/tillval"
              className="inline-flex items-center px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
            >
              <Settings className="h-4 w-4 mr-1" />
              Tillval
            </Link>
            <Link
              href="/hundpensionat/schema"
              className="inline-flex items-center px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
            >
              <Grid3x3 className="h-4 w-4 mr-1" />
              Schema
            </Link>
            <Link
              href="/hundpensionat/kalender"
              className="inline-flex items-center px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
            >
              <Calendar className="h-4 w-4 mr-1" />
              Kalender
            </Link>
            <button
              onClick={exportToPDF}
              className="inline-flex items-center px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
            >
              <Download className="h-4 w-4 mr-1" />
              PDF
            </button>
          </div>
        </div>

        {/* Sök och filter */}
        <div className="flex items-center gap-4 mb-4">
          <select
            value={selectedMonthId}
            onChange={(e) => setSelectedMonthId(e.target.value)}
            className="h-10 px-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#2c7a4c] focus:border-transparent text-base bg-white"
          >
            <option value="">Alla månader</option>
            {availableMonths.map((month) => (
              <option key={month} value={month}>
                {new Date(month + "-01").toLocaleDateString("sv-SE", {
                  year: "numeric",
                  month: "long",
                })}
              </option>
            ))}
          </select>

          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Sök på hundnamn, ägarnamn, telefon, ras..."
              className="w-full h-10 pl-10 pr-4 text-base border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#2c7a4c] focus:border-transparent bg-white"
            />
          </div>
        </div>

        {/* Snabbfilterknappar */}
        <div className="flex items-center gap-2 py-3 border-b border-gray-200">
          <span className="text-sm font-medium text-gray-700 mr-2">
            Snabbfilter:
          </span>
          <button
            onClick={() => setQuickFilter("all")}
            className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all ${
              quickFilter === "all"
                ? "bg-[#2c7a4c] text-white shadow-sm"
                : "bg-gray-100 text-gray-700 hover:bg-gray-200"
            }`}
          >
            Alla
            <span className="ml-1.5 text-xs opacity-80">{bookings.length}</span>
          </button>
          <button
            onClick={() => setQuickFilter("today")}
            className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all ${
              quickFilter === "today"
                ? "bg-[#2c7a4c] text-white shadow-sm"
                : "bg-gray-100 text-gray-700 hover:bg-gray-200"
            }`}
          >
            Idag
            <span className="ml-1.5 text-xs opacity-80">
              {
                bookings.filter((b) => {
                  const today = new Date();
                  today.setHours(0, 0, 0, 0);
                  const start = new Date(b.start_date || "");
                  const end = new Date(b.end_date || "");
                  start.setHours(0, 0, 0, 0);
                  end.setHours(0, 0, 0, 0);
                  return start <= today && end >= today;
                }).length
              }
            </span>
          </button>
          <button
            onClick={() => setQuickFilter("this-week")}
            className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all ${
              quickFilter === "this-week"
                ? "bg-[#2c7a4c] text-white shadow-sm"
                : "bg-gray-100 text-gray-700 hover:bg-gray-200"
            }`}
          >
            Denna vecka
            <span className="ml-1.5 text-xs opacity-80">
              {
                bookings.filter((b) => {
                  const today = new Date();
                  today.setHours(0, 0, 0, 0);
                  const weekEnd = new Date(today);
                  weekEnd.setDate(weekEnd.getDate() + 7);
                  const start = new Date(b.start_date || "");
                  start.setHours(0, 0, 0, 0);
                  return start < weekEnd;
                }).length
              }
            </span>
          </button>
          <button
            onClick={() => setQuickFilter("next-week")}
            className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all ${
              quickFilter === "next-week"
                ? "bg-[#2c7a4c] text-white shadow-sm"
                : "bg-gray-100 text-gray-700 hover:bg-gray-200"
            }`}
          >
            Nästa vecka
            <span className="ml-1.5 text-xs opacity-80">
              {
                bookings.filter((b) => {
                  const today = new Date();
                  today.setHours(0, 0, 0, 0);
                  const weekEnd = new Date(today);
                  weekEnd.setDate(weekEnd.getDate() + 7);
                  const nextWeekEnd = new Date(today);
                  nextWeekEnd.setDate(nextWeekEnd.getDate() + 14);
                  const start = new Date(b.start_date || "");
                  start.setHours(0, 0, 0, 0);
                  return start >= weekEnd && start < nextWeekEnd;
                }).length
              }
            </span>
          </button>
        </div>

        {/* Error display */}
        {error && (
          <div className="bg-red-50 border-l-4 border-red-500 text-red-800 px-4 py-3 rounded-lg mb-4">
            <div className="flex items-center gap-2">
              <span className="text-red-600 font-bold">⚠️</span>
              <span className="font-medium text-sm">{error}</span>
            </div>
          </div>
        )}

        {/* Tabell - Kompakt design */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-[#2c7a4c] text-white">
                <tr>
                  <th
                    onClick={() => handleSort("room")}
                    className="px-4 py-3 text-left text-sm font-semibold cursor-pointer hover:bg-[#236139] transition-colors"
                  >
                    <div className="flex items-center gap-1">
                      Rum {sortKey === "room" && (sortAsc ? "↑" : "↓")}
                    </div>
                  </th>
                  <th
                    onClick={() => handleSort("dog")}
                    className="px-4 py-3 text-left text-sm font-semibold cursor-pointer hover:bg-[#236139] transition-colors"
                  >
                    <div className="flex items-center gap-1">
                      Hund {sortKey === "dog" && (sortAsc ? "↑" : "↓")}
                    </div>
                  </th>
                  <th
                    onClick={() => handleSort("owner")}
                    className="px-4 py-3 text-left text-sm font-semibold cursor-pointer hover:bg-[#236139] transition-colors"
                  >
                    <div className="flex items-center gap-1">
                      Ägare {sortKey === "owner" && (sortAsc ? "↑" : "↓")}
                    </div>
                  </th>
                  <th
                    onClick={() => handleSort("start_date")}
                    className="px-4 py-3 text-left text-sm font-semibold cursor-pointer hover:bg-[#236139] transition-colors"
                  >
                    <div className="flex items-center gap-1">
                      Startdatum{" "}
                      {sortKey === "start_date" && (sortAsc ? "↑" : "↓")}
                    </div>
                  </th>
                  <th
                    onClick={() => handleSort("end_date")}
                    className="px-4 py-3 text-left text-sm font-semibold cursor-pointer hover:bg-[#236139] transition-colors"
                  >
                    <div className="flex items-center gap-1">
                      Slutdatum{" "}
                      {sortKey === "end_date" && (sortAsc ? "↑" : "↓")}
                    </div>
                  </th>
                  <th
                    onClick={() => handleSort("status")}
                    className="px-4 py-3 text-left text-sm font-semibold cursor-pointer hover:bg-[#236139] transition-colors"
                  >
                    <div className="flex items-center gap-1">
                      Status {sortKey === "status" && (sortAsc ? "↑" : "↓")}
                    </div>
                  </th>
                  <th
                    onClick={() => handleSort("total_price")}
                    className="px-4 py-3 text-left text-sm font-semibold cursor-pointer hover:bg-[#236139] transition-colors"
                  >
                    <div className="flex items-center gap-1">
                      Totalpris{" "}
                      {sortKey === "total_price" && (sortAsc ? "↑" : "↓")}
                    </div>
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-semibold">
                    Rabatt
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {isLoading ? (
                  <tr>
                    <td
                      colSpan={8}
                      className="px-4 py-8 text-center text-gray-500"
                    >
                      <div className="flex items-center justify-center gap-2">
                        <RefreshCcw className="w-4 h-4 animate-spin text-[#2c7a4c]" />
                        <span className="text-sm">Laddar bokningar...</span>
                      </div>
                    </td>
                  </tr>
                ) : sorted.length === 0 ? (
                  <tr>
                    <td
                      colSpan={8}
                      className="px-4 py-8 text-center text-gray-500"
                    >
                      <div className="text-center">
                        <p className="text-sm font-medium mb-1">
                          {search || selectedMonthId
                            ? "Inga bokningar matchade din sökning"
                            : "Kunde inte ladda bokningar"}
                        </p>
                        <p className="text-xs text-gray-400">
                          {search || selectedMonthId
                            ? "Prova att ändra dina sökkriterier"
                            : "Kontrollera din anslutning och försök igen"}
                        </p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  sorted.map((booking, index) => (
                    <tr
                      key={booking.id}
                      className={`cursor-pointer transition-colors ${index % 2 === 0 ? "bg-white hover:bg-gray-100" : "bg-gray-50 hover:bg-gray-100"}`}
                    >
                      <td className="px-4 py-2.5 whitespace-nowrap text-sm text-[#333333]">
                        {booking.rooms?.name ?? "—"}
                      </td>
                      <td className="px-4 py-2.5 whitespace-nowrap text-sm text-[#333333]">
                        {booking.dogs?.name ?? "—"}
                      </td>
                      <td className="px-4 py-2.5 whitespace-nowrap text-sm text-[#333333]">
                        {booking.dogs?.owners?.full_name ?? "—"}
                      </td>
                      <td className="px-4 py-2.5 whitespace-nowrap text-sm text-[#333333]">
                        {booking.start_date}
                      </td>
                      <td className="px-4 py-2.5 whitespace-nowrap text-sm text-[#333333]">
                        {booking.end_date}
                      </td>
                      <td className="px-4 py-2.5 whitespace-nowrap text-sm">
                        <span
                          className={`px-2 py-1 inline-flex items-center text-xs font-medium rounded-full ${
                            booking.status === "confirmed"
                              ? "bg-emerald-100 text-emerald-700"
                              : booking.status === "pending"
                                ? "bg-amber-100 text-amber-700"
                                : booking.status === "checked_out"
                                  ? "bg-blue-100 text-blue-700"
                                  : "bg-gray-100 text-gray-700"
                          }`}
                        >
                          {booking.status === "confirmed" && "✓ "}
                          {booking.status === "pending" && "⏳ "}
                          {booking.status === "checked_out" && "✓✓ "}
                          {booking.status || "—"}
                        </span>
                      </td>
                      <td className="px-4 py-2.5 whitespace-nowrap text-sm text-[#333333]">
                        {booking.total_price
                          ? `${Number(booking.total_price).toLocaleString()} kr`
                          : "—"}
                      </td>
                      <td className="px-4 py-2.5 whitespace-nowrap text-sm text-[#333333]">
                        {booking.discount_amount
                          ? `${Number(booking.discount_amount).toLocaleString()} kr`
                          : "—"}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Footer info */}
        {sorted.length > 0 && (
          <div className="mt-4 text-center text-xs text-gray-500 bg-white rounded-lg p-3 border border-gray-200">
            <p>
              Visar{" "}
              <span className="font-semibold text-gray-700">
                {sorted.length}
              </span>{" "}
              bokningar
              {bookings.length !== sorted.length && (
                <span>
                  {" "}
                  av totalt{" "}
                  <span className="font-semibold text-gray-700">
                    {bookings.length}
                  </span>
                </span>
              )}
            </p>
          </div>
        )}
      </main>
    </div>
  );
}
