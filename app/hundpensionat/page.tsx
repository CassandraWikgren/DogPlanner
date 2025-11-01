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

  // Live-statistik state - utökat med fler statistik som på dashboard
  const [liveStats, setLiveStats] = useState({
    hundarIdag: 0,
    incheckIdag: 0,
    utcheckIdag: 0,
    tjänsterImorgon: 0,
    totalOwners: 0,
    monthlyRevenue: 0,
    pendingBookings: 0,
  });

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string>("");

  // Ladda live-statistik - temporär version med test-data
  const loadLiveStats = async () => {
    try {
      console.log("🔍 Laddar statistik (test-data)...");

      // Hämta antal pending bookings
      const { count } = await supabase
        .from("bookings")
        .select("id", { count: "exact", head: true })
        .eq("org_id", user?.user_metadata?.org_id)
        .eq("status", "pending");

      // Sätt test-statistik för att visa att UI fungerar
      setLiveStats({
        hundarIdag: 5,
        incheckIdag: 2,
        utcheckIdag: 1,
        tjänsterImorgon: 3,
        totalOwners: 25,
        monthlyRevenue: 28500,
        pendingBookings: count || 0,
      });

      console.log("✅ Test-statistik laddad");
    } catch (error) {
      console.error("Fel vid laddning av statistik:", error);
      setLiveStats({
        hundarIdag: 0,
        incheckIdag: 0,
        utcheckIdag: 0,
        tjänsterImorgon: 0,
        totalOwners: 0,
        monthlyRevenue: 0,
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

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        Du måste vara inloggad
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section - Samma som Dashboard, Hunddagis, Ekonomi (mer kompakt) */}
      <div
        className="relative bg-cover bg-center pt-16 pb-20"
        style={{
          backgroundImage: `linear-gradient(rgba(44, 122, 76, 0.82), rgba(44, 122, 76, 0.7)), url('/Hero.jpeg')`,
        }}
      >
        {/* Subtle overlay to ensure text readability */}
        <div className="absolute inset-0 bg-gradient-to-b from-[#2c7a4c]/90 to-[#2c7a4c]/70" />

        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-3xl md:text-4xl lg:text-5xl font-extrabold text-white mb-2 drop-shadow-md">
            Hundpensionat
          </h1>
          <p className="text-md md:text-lg text-white/90 max-w-2xl mx-auto leading-relaxed">
            Professionell pensionathantering med översikt över bokningar, rum
            och gäster — enkelt att administrera och tryggt för kunder.
          </p>
        </div>
      </div>

      {/* Floating Stats Cards - Moderna kort som överlappar hero */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-8 mb-8">
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          <div className="bg-white rounded-xl shadow p-5 border border-gray-200 hover:shadow-lg transition-shadow">
            <p className="text-sm text-gray-600 mb-1">Antal hundar</p>
            <p className="text-3xl font-bold text-[#2c7a4c]">
              {liveStats.hundarIdag}
            </p>
          </div>

          <div className="bg-white rounded-xl shadow p-5 border border-gray-200 hover:shadow-lg transition-shadow">
            <p className="text-sm text-gray-600 mb-1">Ankomster</p>
            <p className="text-3xl font-bold text-[#2c7a4c]">
              {liveStats.incheckIdag}
            </p>
          </div>

          <div className="bg-white rounded-xl shadow p-5 border border-gray-200 hover:shadow-lg transition-shadow">
            <p className="text-sm text-gray-600 mb-1">Avresor</p>
            <p className="text-3xl font-bold text-orange-600">
              {liveStats.utcheckIdag}
            </p>
          </div>

          <div className="bg-white rounded-xl shadow p-5 border border-gray-200 hover:shadow-lg transition-shadow">
            <p className="text-sm text-gray-600 mb-1">Tjänster imorgon</p>
            <p className="text-3xl font-bold text-[#2c7a4c]">
              {liveStats.tjänsterImorgon}
            </p>
          </div>

          <div className="bg-white rounded-xl shadow p-5 border border-gray-200 hover:shadow-lg transition-shadow">
            <p className="text-sm text-gray-600 mb-1">Kunder</p>
            <p className="text-3xl font-bold text-[#2c7a4c]">
              {liveStats.totalOwners}
            </p>
          </div>

          <div className="bg-white rounded-xl shadow p-5 border border-gray-200 hover:shadow-lg transition-shadow">
            <p className="text-sm text-gray-600 mb-1">Månadsintäkt</p>
            <p className="text-2xl font-bold text-[#2c7a4c]">
              {liveStats.monthlyRevenue.toLocaleString()} kr
            </p>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-12">
        {/* Kontroller */}
        <div className="bg-white rounded-lg shadow-md p-4 mb-4 border border-gray-200">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-3">
            <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
              <select
                value={selectedMonthId}
                onChange={(e) => setSelectedMonthId(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#2c7a4c] focus:border-transparent"
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

              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Sök bokningar..."
                  className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg w-full focus:ring-2 focus:ring-[#2c7a4c] focus:border-transparent"
                />
              </div>
            </div>

            <div className="flex gap-2 w-full md:w-auto">
              <Link
                href="/hundpensionat/ansokningar"
                className="relative flex items-center justify-center gap-2 px-3 py-1.5 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 transition-colors"
              >
                <ClipboardList size={16} />
                <span className="hidden sm:inline">Ansökningar</span>
                {liveStats.pendingBookings > 0 && (
                  <span className="absolute -top-2 -right-2 bg-red-600 text-white text-xs font-bold rounded-full h-6 w-6 flex items-center justify-center">
                    {liveStats.pendingBookings}
                  </span>
                )}
              </Link>
              <Link
                href="/hundpensionat/priser"
                className="flex items-center justify-center gap-2 px-3 py-1.5 bg-[#2c7a4c] text-white rounded-lg hover:bg-[#236139] transition-colors"
              >
                <DollarSign size={16} />
                <span className="hidden sm:inline">Priser</span>
              </Link>
              <Link
                href="/hundpensionat/tillval"
                className="flex items-center justify-center gap-2 px-3 py-1.5 bg-[#2c7a4c] text-white rounded-lg hover:bg-[#236139] transition-colors"
              >
                <Settings size={16} />
                <span className="hidden sm:inline">Tillval</span>
              </Link>
              <Link
                href="/hundpensionat/kalender"
                className="flex items-center justify-center gap-2 px-3 py-1.5 bg-[#2c7a4c] text-white rounded-lg hover:bg-[#236139] transition-colors"
              >
                <Calendar size={16} />
                <span className="hidden sm:inline">Kalender</span>
              </Link>
              <button
                onClick={loadBookings}
                className="flex items-center justify-center gap-2 px-3 py-1.5 bg-[#2c7a4c] text-white rounded-lg hover:bg-[#236139] transition-colors"
              >
                <RefreshCcw size={16} />
                <span className="hidden sm:inline">Uppdatera</span>
              </button>
              <button
                onClick={exportToPDF}
                className="flex items-center justify-center gap-2 px-3 py-1.5 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
              >
                <Download size={16} />
                <span className="hidden sm:inline">PDF</span>
              </button>
              <Link
                href="/hundpensionat/new"
                className="flex items-center justify-center gap-2 px-3 py-1.5 bg-[#2c7a4c] text-white rounded-lg hover:bg-[#236139] transition-colors"
              >
                <Plus size={16} />
                <span className="hidden sm:inline">Ny bokning</span>
              </Link>
            </div>
          </div>
        </div>

        {/* Error display */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-lg mb-6">
            {error}
          </div>
        )}

        {/* Tabell */}
        <div className="bg-white rounded-lg shadow-lg border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-[#2c7a4c]">
                <tr>
                  <th
                    onClick={() => handleSort("room")}
                    className="px-4 py-2 text-left text-xs font-medium text-white uppercase tracking-wider cursor-pointer hover:bg-[#236139]"
                  >
                    Rum {sortKey === "room" && (sortAsc ? "↑" : "↓")}
                  </th>
                  <th
                    onClick={() => handleSort("dog")}
                    className="px-4 py-2 text-left text-xs font-medium text-white uppercase tracking-wider cursor-pointer hover:bg-[#236139]"
                  >
                    Hund {sortKey === "dog" && (sortAsc ? "↑" : "↓")}
                  </th>
                  <th
                    onClick={() => handleSort("owner")}
                    className="px-4 py-2 text-left text-xs font-medium text-white uppercase tracking-wider cursor-pointer hover:bg-[#236139]"
                  >
                    Ägare {sortKey === "owner" && (sortAsc ? "↑" : "↓")}
                  </th>
                  <th
                    onClick={() => handleSort("start_date")}
                    className="px-4 py-2 text-left text-xs font-medium text-white uppercase tracking-wider cursor-pointer hover:bg-[#236139]"
                  >
                    Startdatum{" "}
                    {sortKey === "start_date" && (sortAsc ? "↑" : "↓")}
                  </th>
                  <th
                    onClick={() => handleSort("end_date")}
                    className="px-4 py-2 text-left text-xs font-medium text-white uppercase tracking-wider cursor-pointer hover:bg-[#236139]"
                  >
                    Slutdatum {sortKey === "end_date" && (sortAsc ? "↑" : "↓")}
                  </th>
                  <th
                    onClick={() => handleSort("status")}
                    className="px-4 py-2 text-left text-xs font-medium text-white uppercase tracking-wider cursor-pointer hover:bg-[#236139]"
                  >
                    Status {sortKey === "status" && (sortAsc ? "↑" : "↓")}
                  </th>
                  <th
                    onClick={() => handleSort("total_price")}
                    className="px-4 py-2 text-left text-xs font-medium text-white uppercase tracking-wider cursor-pointer hover:bg-[#236139]"
                  >
                    Totalpris{" "}
                    {sortKey === "total_price" && (sortAsc ? "↑" : "↓")}
                  </th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-white uppercase tracking-wider">
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
                      Laddar bokningar...
                    </td>
                  </tr>
                ) : sorted.length === 0 ? (
                  <tr>
                    <td
                      colSpan={8}
                      className="px-4 py-8 text-center text-gray-500"
                    >
                      {search || selectedMonthId
                        ? "Inga bokningar matchade din sökning"
                        : "Inga bokningar hittades"}
                    </td>
                  </tr>
                ) : (
                  sorted.map((booking, idx) => (
                    <tr
                      key={booking.id}
                      className={`${
                        idx % 2 === 0 ? "bg-white" : "bg-gray-50"
                      } hover:bg-green-50 transition-colors`}
                    >
                      <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-900">
                        {booking.rooms?.name ?? "—"}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                        {booking.dogs?.name ?? "—"}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                        {booking.dogs?.owners?.full_name ?? "—"}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                        {booking.start_date}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                        {booking.end_date}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm">
                        <span
                          className={`px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                            booking.status === "confirmed"
                              ? "bg-green-100 text-green-800"
                              : booking.status === "pending"
                                ? "bg-yellow-100 text-yellow-800"
                                : "bg-red-100 text-red-800"
                          }`}
                        >
                          {booking.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900 font-medium">
                        {booking.total_price
                          ? `${booking.total_price} kr`
                          : "—"}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                        {booking.discount_amount
                          ? `${booking.discount_amount} kr`
                          : "—"}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
