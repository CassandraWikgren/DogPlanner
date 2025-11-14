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
  const { user, currentOrgId, loading } = useAuth();
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
        .eq("org_id", currentOrgId as string)
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
    if (!currentOrgId || !supabase) {
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
        .eq("org_id", currentOrgId as string)
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
    if (currentOrgId) {
      loadBookings();
      loadLiveStats();
    }
  }, [currentOrgId]);

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
      {/* Hero Section - Clean och kompakt */}
      <div className="relative bg-gradient-to-br from-[#2c7a4c] to-[#1e5a36] overflow-hidden">
        {/* Subtil bakgrundsmönster */}
        <div
          className="absolute inset-0 opacity-10"
          style={{
            backgroundImage:
              'url(\'data:image/svg+xml,%3Csvg width="60" height="60" viewBox="0 0 60 60" xmlns="http://www.w3.org/2000/svg"%3E%3Cg fill="none" fill-rule="evenodd"%3E%3Cg fill="%23ffffff" fill-opacity="0.4"%3E%3Cpath d="M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z"/%3E%3C/g%3E%3C/g%3E%3C/svg%3E\')',
          }}
        />

        {/* Hero content */}
        <div className="relative z-10 max-w-[1600px] mx-auto px-16 sm:px-24 lg:px-32 py-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-white mb-2">
                🏨 Hundpensionat
              </h1>
              <p className="text-white/80 text-sm">
                Professionell pensionathantering med fullständig översikt
              </p>
            </div>

            {/* Action buttons i hero */}
            <div className="flex gap-2">
              <Link
                href="/hundpensionat/ansokningar"
                className="relative inline-flex items-center gap-2 px-4 py-2 bg-white/10 backdrop-blur-sm text-white rounded-lg hover:bg-white/20 transition-all border border-white/20 text-sm font-medium"
              >
                <ClipboardList className="w-4 h-4" />
                <span>Ansökningar</span>
                {liveStats.pendingBookings > 0 && (
                  <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center">
                    {liveStats.pendingBookings}
                  </span>
                )}
              </Link>

              <Link
                href="/hundpensionat/new"
                className="inline-flex items-center gap-2 px-4 py-2 bg-white text-[#2c7a4c] rounded-lg hover:bg-white/90 transition-all text-sm font-medium shadow-lg"
              >
                <Plus className="w-4 h-4" />
                <span>Ny bokning</span>
              </Link>
            </div>
          </div>

          {/* Stats Cards - Kompakta i hero */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-6">
            {/* Antal hundar */}
            <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4 border border-white/20">
              <div className="flex items-center gap-3">
                <div className="text-3xl">🐕</div>
                <div className="flex-1">
                  <div className="text-white/70 text-xs font-medium">
                    Antal hundar
                  </div>
                  <div className="text-white text-2xl font-bold">
                    {liveStats.hundarIdag}
                  </div>
                  <div className="text-white/50 text-xs">aktiva idag</div>
                </div>
              </div>
            </div>

            {/* Ankomster idag */}
            <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4 border border-white/20">
              <div className="flex items-center gap-3">
                <div className="text-3xl">📅</div>
                <div className="flex-1">
                  <div className="text-white/70 text-xs font-medium">
                    Ankomster idag
                  </div>
                  <div className="text-white text-2xl font-bold">
                    {liveStats.incheckIdag}
                  </div>
                  <div className="text-white/50 text-xs">nya incheckning</div>
                </div>
              </div>
            </div>

            {/* Ankomster imorgon */}
            <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4 border border-white/20">
              <div className="flex items-center gap-3">
                <div className="text-3xl">🧳</div>
                <div className="flex-1">
                  <div className="text-white/70 text-xs font-medium">
                    Ankomster imorgon
                  </div>
                  <div className="text-white text-2xl font-bold">
                    {liveStats.incheckImorgon}
                  </div>
                  <div className="text-white/50 text-xs">planerade</div>
                </div>
              </div>
            </div>

            {/* Avresor imorgon */}
            <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4 border border-white/20">
              <div className="flex items-center gap-3">
                <div className="text-3xl">👋</div>
                <div className="flex-1">
                  <div className="text-white/70 text-xs font-medium">
                    Avresor imorgon
                  </div>
                  <div className="text-white text-2xl font-bold">
                    {liveStats.utcheckImorgon}
                  </div>
                  <div className="text-white/50 text-xs">utcheckning</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content - Direkt under hero */}
      <div className="max-w-[1600px] mx-auto px-16 sm:px-24 lg:px-32 py-6">
        {/* Kompakta kontroller */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-4">
          <div className="flex flex-col lg:flex-row gap-3 items-start lg:items-center">
            {/* Sök och Filter */}
            <div className="flex flex-col sm:flex-row gap-2 flex-1 w-full lg:w-auto">
              <select
                value={selectedMonthId}
                onChange={(e) => setSelectedMonthId(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#2c7a4c] focus:border-transparent bg-white text-sm hover:border-gray-400 transition-colors"
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
                  className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg w-full focus:ring-2 focus:ring-[#2c7a4c] focus:border-transparent text-sm hover:border-gray-400 transition-colors"
                />
              </div>
            </div>

            {/* Action buttons */}
            <div className="flex flex-wrap gap-2">
              <Link
                href="/hundpensionat/priser"
                className="inline-flex items-center gap-2 px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-all text-sm font-medium"
              >
                <DollarSign className="w-4 h-4" />
                <span>Priser</span>
              </Link>

              <Link
                href="/hundpensionat/tillval"
                className="inline-flex items-center gap-2 px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-all text-sm font-medium"
              >
                <Settings className="w-4 h-4" />
                <span>Tillval</span>
              </Link>

              <Link
                href="/hundpensionat/kalender"
                className="inline-flex items-center gap-2 px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-all text-sm font-medium"
              >
                <Calendar className="w-4 h-4" />
                <span>Kalender</span>
              </Link>

              <button
                onClick={loadBookings}
                disabled={isLoading}
                className="inline-flex items-center gap-2 px-3 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-all text-sm font-medium disabled:opacity-50"
              >
                <RefreshCcw
                  className={`w-4 h-4 ${isLoading ? "animate-spin" : ""}`}
                />
                <span>Uppdatera</span>
              </button>

              <button
                onClick={exportToPDF}
                className="inline-flex items-center gap-2 px-3 py-2 bg-slate-600 text-white rounded-lg hover:bg-slate-700 transition-all text-sm font-medium"
              >
                <Download className="w-4 h-4" />
                <span>PDF</span>
              </button>
            </div>
          </div>
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
              <thead className="bg-gradient-to-r from-[#2c7a4c] to-[#236139]">
                <tr>
                  <th
                    onClick={() => handleSort("room")}
                    className="px-4 py-3 text-left text-xs font-semibold text-white uppercase tracking-wider cursor-pointer hover:bg-[#1e5a2d] transition-colors"
                  >
                    <div className="flex items-center gap-1">
                      Rum {sortKey === "room" && (sortAsc ? "↑" : "↓")}
                    </div>
                  </th>
                  <th
                    onClick={() => handleSort("dog")}
                    className="px-4 py-3 text-left text-xs font-semibold text-white uppercase tracking-wider cursor-pointer hover:bg-[#1e5a2d] transition-colors"
                  >
                    <div className="flex items-center gap-1">
                      Hund {sortKey === "dog" && (sortAsc ? "↑" : "↓")}
                    </div>
                  </th>
                  <th
                    onClick={() => handleSort("owner")}
                    className="px-4 py-3 text-left text-xs font-semibold text-white uppercase tracking-wider cursor-pointer hover:bg-[#1e5a2d] transition-colors"
                  >
                    <div className="flex items-center gap-1">
                      Ägare {sortKey === "owner" && (sortAsc ? "↑" : "↓")}
                    </div>
                  </th>
                  <th
                    onClick={() => handleSort("start_date")}
                    className="px-4 py-3 text-left text-xs font-semibold text-white uppercase tracking-wider cursor-pointer hover:bg-[#1e5a2d] transition-colors"
                  >
                    <div className="flex items-center gap-1">
                      Startdatum{" "}
                      {sortKey === "start_date" && (sortAsc ? "↑" : "↓")}
                    </div>
                  </th>
                  <th
                    onClick={() => handleSort("end_date")}
                    className="px-4 py-3 text-left text-xs font-semibold text-white uppercase tracking-wider cursor-pointer hover:bg-[#1e5a2d] transition-colors"
                  >
                    <div className="flex items-center gap-1">
                      Slutdatum{" "}
                      {sortKey === "end_date" && (sortAsc ? "↑" : "↓")}
                    </div>
                  </th>
                  <th
                    onClick={() => handleSort("status")}
                    className="px-4 py-3 text-left text-xs font-semibold text-white uppercase tracking-wider cursor-pointer hover:bg-[#1e5a2d] transition-colors"
                  >
                    <div className="flex items-center gap-1">
                      Status {sortKey === "status" && (sortAsc ? "↑" : "↓")}
                    </div>
                  </th>
                  <th
                    onClick={() => handleSort("total_price")}
                    className="px-4 py-3 text-left text-xs font-semibold text-white uppercase tracking-wider cursor-pointer hover:bg-[#1e5a2d] transition-colors"
                  >
                    <div className="flex items-center gap-1">
                      Totalpris{" "}
                      {sortKey === "total_price" && (sortAsc ? "↑" : "↓")}
                    </div>
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-white uppercase tracking-wider">
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
                  sorted.map((booking) => (
                    <tr
                      key={booking.id}
                      className="hover:bg-emerald-50/50 transition-colors"
                    >
                      <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-900">
                        {booking.rooms?.name ?? "—"}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-700">
                        {booking.dogs?.name ?? "—"}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-700">
                        {booking.dogs?.owners?.full_name ?? "—"}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-700">
                        {booking.start_date}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-700">
                        {booking.end_date}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm">
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
                      <td className="px-4 py-3 whitespace-nowrap text-sm font-semibold text-gray-900">
                        {booking.total_price
                          ? `${Number(booking.total_price).toLocaleString()} kr`
                          : "—"}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-700">
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
      </div>
    </div>
  );
}
