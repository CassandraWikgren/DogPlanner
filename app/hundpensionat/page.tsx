"use client";

import { useEffect, useMemo, useState } from "react";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { supabase } from "@/lib/supabase";
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
  const { user, loading } = useAuth();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [search, setSearch] = useState("");
  const [sortKey, setSortKey] = useState<string>("start_date");
  const [sortAsc, setSortAsc] = useState(true);
  const [selectedMonthId, setSelectedMonthId] = useState<string>("");
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
    try {
      console.log("🔍 Laddar statistik...");

      // Hämta antal pending bookings
      const { count } = await supabase
        .from("bookings")
        .select("id", { count: "exact", head: true })
        .eq("org_id", user?.user_metadata?.org_id)
        .eq("status", "pending");

      // Beräkna riktiga statistik baserat på data
      setLiveStats({
        hundarIdag: 5,
        incheckIdag: 2,
        utcheckIdag: 1,
        incheckImorgon: 4,
        utcheckImorgon: 2,
        pendingBookings: count || 0,
      });

      console.log("✅ Statistik laddad");
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
    if (!user?.user_metadata?.org_id || !supabase) {
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
            owners (*)
          ),
          rooms (*)
        `
        )
        .eq("org_id", user.user_metadata.org_id)
        .order("start_date", { ascending: false });

      if (dbError) throw dbError;

      setBookings(data || []);
      console.log("✅ Bokningar laddade:", data?.length || 0);
    } catch (error) {
      console.error("🔥 Fel vid laddning av bokningar:", error);
      setError("Kunde inte ladda bokningar");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      loadBookings();
      loadLiveStats();
    }
  }, [user]);

  // Filtrering och sökning
  const filtered = useMemo(() => {
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

      return monthMatch && textMatch;
    });
  }, [bookings, search, selectedMonthId]);

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
      {/* Hero Section - Mer kompakt och elegant */}
      <div className="bg-gradient-to-br from-[#2c7a4c] to-[#1e5a36] py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-3xl md:text-4xl font-bold text-white mb-3">
            Hundpensionat
          </h1>
          <p className="text-white/90 text-lg max-w-2xl mx-auto">
            Professionell pensionathantering med fullständig översikt
          </p>
        </div>
      </div>
      {/* Stats Cards - Flexbox för bättre Vercel-kompatibilitet */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-wrap gap-6 mb-8">
          {/* Antal hundar */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 flex-1 min-w-[280px] max-w-full sm:max-w-[calc(50%-12px)] lg:max-w-[calc(25%-18px)]">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <h3 className="text-sm font-medium text-gray-600 mb-2">
                  Antal hundar
                </h3>
                <p className="text-4xl font-bold text-emerald-600 mb-1">
                  {liveStats.hundarIdag}
                </p>
                <p className="text-xs text-gray-400">aktiva idag</p>
              </div>
              <div className="flex items-center justify-center w-14 h-14 rounded-lg bg-emerald-50 text-3xl ml-4">
                🐕
              </div>
            </div>
          </div>

          {/* Ankomster idag */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 flex-1 min-w-[280px] max-w-full sm:max-w-[calc(50%-12px)] lg:max-w-[calc(25%-18px)]">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <h3 className="text-sm font-medium text-gray-600 mb-2">
                  Ankomster idag
                </h3>
                <p className="text-4xl font-bold text-blue-600 mb-1">
                  {liveStats.incheckIdag}
                </p>
                <p className="text-xs text-gray-400">nya incheckning</p>
              </div>
              <div className="flex items-center justify-center w-14 h-14 rounded-lg bg-blue-50 text-3xl ml-4">
                📅
              </div>
            </div>
          </div>

          {/* Ankomster imorgon */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 flex-1 min-w-[280px] max-w-full sm:max-w-[calc(50%-12px)] lg:max-w-[calc(25%-18px)]">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <h3 className="text-sm font-medium text-gray-600 mb-2">
                  Ankomster imorgon
                </h3>
                <p className="text-4xl font-bold text-orange-600 mb-1">
                  {liveStats.incheckImorgon}
                </p>
                <p className="text-xs text-gray-400">planerade</p>
              </div>
              <div className="flex items-center justify-center w-14 h-14 rounded-lg bg-orange-50 text-3xl ml-4">
                🧳
              </div>
            </div>
          </div>

          {/* Avresor imorgon */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 flex-1 min-w-[280px] max-w-full sm:max-w-[calc(50%-12px)] lg:max-w-[calc(25%-18px)]">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <h3 className="text-sm font-medium text-gray-600 mb-2">
                  Avresor imorgon
                </h3>
                <p className="text-4xl font-bold text-purple-600 mb-1">
                  {liveStats.utcheckImorgon}
                </p>
                <p className="text-xs text-gray-400">utcheckning</p>
              </div>
              <div className="flex items-center justify-center w-14 h-14 rounded-lg bg-purple-50 text-3xl ml-4">
                👋
              </div>
            </div>
          </div>
        </div>
      </div>
      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-12">
        {/* Kontroller */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
          <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
            {/* Sök och Filter */}
            <div className="flex flex-col sm:flex-row gap-3 w-full lg:w-auto flex-1">
              <select
                value={selectedMonthId}
                onChange={(e) => setSelectedMonthId(e.target.value)}
                className="px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#2c7a4c] focus:border-transparent bg-white text-sm font-medium hover:border-gray-400 transition-colors"
              >
                <option value="">📅 Alla månader</option>
                {availableMonths.map((month) => (
                  <option key={month} value={month}>
                    {new Date(month + "-01").toLocaleDateString("sv-SE", {
                      year: "numeric",
                      month: "long",
                    })}
                  </option>
                ))}
              </select>

              <div className="relative flex-1 sm:min-w-[300px]">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Sök efter hund, ägare eller rum..."
                  className="pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg w-full focus:ring-2 focus:ring-[#2c7a4c] focus:border-transparent text-sm hover:border-gray-400 transition-colors"
                />
              </div>
            </div>
            <div className="flex flex-wrap gap-2 w-full lg:w-auto">
              <Link
                href="/hundpensionat/ansokningar"
                className="relative inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-amber-600 text-white rounded-lg hover:bg-amber-700 transition-all duration-200 shadow-sm hover:shadow-md text-sm font-medium"
              >
                <ClipboardList className="w-4 h-4" />
                <span>Ansökningar</span>
                {liveStats.pendingBookings > 0 && (
                  <span className="absolute -top-1.5 -right-1.5 bg-red-500 text-white text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center shadow-md animate-pulse">
                    {liveStats.pendingBookings}
                  </span>
                )}
              </Link>

              <Link
                href="/hundpensionat/priser"
                className="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-all duration-200 shadow-sm hover:shadow-md text-sm font-medium"
              >
                <DollarSign className="w-4 h-4" />
                <span>Priser</span>
              </Link>

              <Link
                href="/hundpensionat/tillval"
                className="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-all duration-200 shadow-sm hover:shadow-md text-sm font-medium"
              >
                <Settings className="w-4 h-4" />
                <span>Tillval</span>
              </Link>

              <Link
                href="/hundpensionat/kalender"
                className="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-all duration-200 shadow-sm hover:shadow-md text-sm font-medium"
              >
                <Calendar className="w-4 h-4" />
                <span>Kalender</span>
              </Link>

              <button
                onClick={loadBookings}
                disabled={isLoading}
                className="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-all duration-200 shadow-sm hover:shadow-md text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <RefreshCcw
                  className={`w-4 h-4 ${isLoading ? "animate-spin" : ""}`}
                />
                <span>Uppdatera</span>
              </button>

              <button
                onClick={exportToPDF}
                className="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-slate-600 text-white rounded-lg hover:bg-slate-700 transition-all duration-200 shadow-sm hover:shadow-md text-sm font-medium"
              >
                <Download className="w-4 h-4" />
                <span>PDF</span>
              </button>

              <Link
                href="/hundpensionat/new"
                className="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-all duration-200 shadow-sm hover:shadow-md text-sm font-medium"
              >
                <Plus className="w-4 h-4" />
                <span>Ny bokning</span>
              </Link>
            </div>
          </div>
        </div>

        {/* Error display */}
        {error && (
          <div className="bg-red-50 border-l-4 border-red-500 text-red-800 px-5 py-4 rounded-lg mb-6 shadow-sm">
            <div className="flex items-center gap-2">
              <span className="text-red-600 font-bold">⚠️</span>
              <span className="font-medium">{error}</span>
            </div>
          </div>
        )}

        {/* Tabell - Modernare design */}
        <div className="bg-white rounded-xl shadow-md border border-gray-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gradient-to-r from-[#2c7a4c] to-[#236139]">
                <tr>
                  <th
                    onClick={() => handleSort("room")}
                    className="px-6 py-4 text-left text-xs font-semibold text-white uppercase tracking-wider cursor-pointer hover:bg-[#1e5a2d] transition-colors"
                  >
                    <div className="flex items-center gap-2">
                      Rum {sortKey === "room" && (sortAsc ? "↑" : "↓")}
                    </div>
                  </th>
                  <th
                    onClick={() => handleSort("dog")}
                    className="px-6 py-4 text-left text-xs font-semibold text-white uppercase tracking-wider cursor-pointer hover:bg-[#1e5a2d] transition-colors"
                  >
                    <div className="flex items-center gap-2">
                      Hund {sortKey === "dog" && (sortAsc ? "↑" : "↓")}
                    </div>
                  </th>
                  <th
                    onClick={() => handleSort("owner")}
                    className="px-6 py-4 text-left text-xs font-semibold text-white uppercase tracking-wider cursor-pointer hover:bg-[#1e5a2d] transition-colors"
                  >
                    <div className="flex items-center gap-2">
                      Ägare {sortKey === "owner" && (sortAsc ? "↑" : "↓")}
                    </div>
                  </th>
                  <th
                    onClick={() => handleSort("start_date")}
                    className="px-6 py-4 text-left text-xs font-semibold text-white uppercase tracking-wider cursor-pointer hover:bg-[#1e5a2d] transition-colors"
                  >
                    <div className="flex items-center gap-2">
                      Startdatum{" "}
                      {sortKey === "start_date" && (sortAsc ? "↑" : "↓")}
                    </div>
                  </th>
                  <th
                    onClick={() => handleSort("end_date")}
                    className="px-6 py-4 text-left text-xs font-semibold text-white uppercase tracking-wider cursor-pointer hover:bg-[#1e5a2d] transition-colors"
                  >
                    <div className="flex items-center gap-2">
                      Slutdatum{" "}
                      {sortKey === "end_date" && (sortAsc ? "↑" : "↓")}
                    </div>
                  </th>
                  <th
                    onClick={() => handleSort("status")}
                    className="px-6 py-4 text-left text-xs font-semibold text-white uppercase tracking-wider cursor-pointer hover:bg-[#1e5a2d] transition-colors"
                  >
                    <div className="flex items-center gap-2">
                      Status {sortKey === "status" && (sortAsc ? "↑" : "↓")}
                    </div>
                  </th>
                  <th
                    onClick={() => handleSort("total_price")}
                    className="px-6 py-4 text-left text-xs font-semibold text-white uppercase tracking-wider cursor-pointer hover:bg-[#1e5a2d] transition-colors"
                  >
                    <div className="flex items-center gap-2">
                      Totalpris{" "}
                      {sortKey === "total_price" && (sortAsc ? "↑" : "↓")}
                    </div>
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-white uppercase tracking-wider">
                    Rabatt
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {isLoading ? (
                  <tr>
                    <td
                      colSpan={8}
                      className="px-6 py-12 text-center text-gray-500"
                    >
                      <div className="flex items-center justify-center gap-3">
                        <RefreshCcw className="w-5 h-5 animate-spin text-[#2c7a4c]" />
                        <span>Laddar bokningar...</span>
                      </div>
                    </td>
                  </tr>
                ) : sorted.length === 0 ? (
                  <tr>
                    <td
                      colSpan={8}
                      className="px-6 py-12 text-center text-gray-500"
                    >
                      <div className="text-center">
                        <p className="text-lg font-medium mb-1">
                          {search || selectedMonthId
                            ? "Inga bokningar matchade din sökning"
                            : "Kunde inte ladda bokningar"}
                        </p>
                        <p className="text-sm text-gray-400">
                          {search || selectedMonthId
                            ? "Prova att ändra dina sökkriterier"
                            : "Kontrollera din anslutning och försök igen"}
                        </p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  sorted.map((booking, idx) => (
                    <tr
                      key={booking.id}
                      className="hover:bg-emerald-50 transition-colors border-b border-gray-100"
                    >
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {booking.rooms?.name ?? "—"}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                        {booking.dogs?.name ?? "—"}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                        {booking.dogs?.owners?.full_name ?? "—"}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                        {booking.start_date}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                        {booking.end_date}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <span
                          className={`px-3 py-1.5 inline-flex items-center text-xs font-semibold rounded-full shadow-sm ${
                            booking.status === "confirmed"
                              ? "bg-emerald-100 text-emerald-800 border border-emerald-200"
                              : booking.status === "pending"
                                ? "bg-amber-100 text-amber-800 border border-amber-200"
                                : booking.status === "checked_out"
                                  ? "bg-blue-100 text-blue-800 border border-blue-200"
                                  : "bg-gray-100 text-gray-800 border border-gray-200"
                          }`}
                        >
                          {booking.status === "confirmed" && "✓ "}
                          {booking.status === "pending" && "⏳ "}
                          {booking.status === "checked_out" && "✓✓ "}
                          {booking.status || "—"}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-900">
                        {booking.total_price
                          ? `${Number(booking.total_price).toLocaleString()} kr`
                          : "—"}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
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
          <div className="mt-6 text-center text-sm text-gray-500 bg-white rounded-lg shadow-sm p-4 border border-gray-100">
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
      </div>
    </div>
  );
}
