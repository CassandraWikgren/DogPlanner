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
} from "lucide-react";
import type { Database } from "@/types/database";

// Felkoder enligt systemet
const ERROR_CODES = {
  DATABASE_CONNECTION: "[ERR-1001]",
  PDF_EXPORT: "[ERR-2001]",
  REALTIME: "[ERR-3001]",
  VALIDATION: "[ERR-4001]",
} as const;

const PRIMARY_BLUE = "#2563eb"; // Pensionatfärg (blå ton)

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

  // Live-statistik för pensionat
  const [liveStats, setLiveStats] = useState({
    hundarIdag: 0,
    incheckIdag: 0,
    utcheckIdag: 0,
    tjänsterImorgon: 0,
  });

  // 🗓️ senaste 24 månader
  const months = useMemo(() => {
    const now = new Date();
    return Array.from({ length: 24 }).map((_, i) => {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      return {
        id: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`,
        start: d,
      };
    });
  }, []);

  useEffect(() => {
    if (months.length > 0) setSelectedMonthId(months[0].id);
  }, [months]);

  // 🔄 Ladda live-statistik
  const loadLiveStats = async () => {
    if (!user) return;

    try {
      const today = new Date().toISOString().split("T")[0];
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      const tomorrowStr = tomorrow.toISOString().split("T")[0];

      // Hundar idag (incheckade och inte utcheckade än)
      const { data: hundarIdag } = await (supabase as any)
        .from("bookings")
        .select("id", { count: "exact" })
        .eq("org_id", user.org_id)
        .lte("start_date", today)
        .gte("end_date", today)
        .eq("status", "confirmed");

      // Incheckningar idag
      const { data: incheckIdag } = await (supabase as any)
        .from("bookings")
        .select("id", { count: "exact" })
        .eq("org_id", user.org_id)
        .eq("start_date", today)
        .eq("status", "confirmed");

      // Utcheckningar idag
      const { data: utcheckIdag } = await (supabase as any)
        .from("bookings")
        .select("id", { count: "exact" })
        .eq("org_id", user.org_id)
        .eq("end_date", today)
        .eq("status", "confirmed");

      // Tjänster imorgon (för hundar som checkar ut dagen efter imorgon)
      const dayAfterTomorrow = new Date();
      dayAfterTomorrow.setDate(dayAfterTomorrow.getDate() + 2);
      const dayAfterTomorrowStr = dayAfterTomorrow.toISOString().split("T")[0];

      const { data: tjänsterImorgon } = await (supabase as any)
        .from("bookings")
        .select("id", { count: "exact" })
        .eq("org_id", user.org_id)
        .eq("end_date", dayAfterTomorrowStr)
        .eq("status", "confirmed");

      setLiveStats({
        hundarIdag: hundarIdag?.count || 0,
        incheckIdag: incheckIdag?.count || 0,
        utcheckIdag: utcheckIdag?.count || 0,
        tjänsterImorgon: tjänsterImorgon?.count || 0,
      });
    } catch (error) {
      console.error(
        `${ERROR_CODES.DATABASE_CONNECTION} Fel vid hämtning av live-statistik:`,
        error
      );
    }
  };

  // 🔄 Hämta data med relationer (RLS hanterar org_id)
  useEffect(() => {
    if (!user || loading) return;
    async function loadData() {
      try {
        const { data, error } = await (supabase as any)
          .from("bookings")
          .select(
            `
            id,
            start_date,
            end_date,
            status,
            total_price,
            discount_amount,
            notes,
            dogs (
              id,
              name,
              breed,
              heightcm,
              owner_id,
              owners (
                id,
                full_name,
                phone,
                email
              )
            ),
            rooms (
              id,
              name,
              capacity_m2
            )
          `
          )
          .order("start_date", { ascending: false });

        if (error) {
          console.error(
            `${ERROR_CODES.DATABASE_CONNECTION} Fel vid hämtning av bokningar:`,
            error
          );
          return;
        }

        console.log(`[Pensionat] Laddade ${data?.length || 0} bokningar`);
        setBookings(data || []);

        // Ladda även live-statistik
        loadLiveStats();
      } catch (err: any) {
        console.error(`${ERROR_CODES.DATABASE_CONNECTION} Oväntat fel:`, err);
      }
    }

    loadData();
  }, [user, loading]);

  // 🔍 Filtrering
  const filtered = useMemo(() => {
    const s = search.trim().toLowerCase();
    return bookings.filter((b) => {
      const dog = b.dogs;
      const owner = dog?.owners?.full_name?.toLowerCase() ?? "";
      const name = dog?.name?.toLowerCase() ?? "";
      const breed = dog?.breed?.toLowerCase() ?? "";
      return !s || name.includes(s) || breed.includes(s) || owner.includes(s);
    });
  }, [bookings, search]);

  // ↕️ Sortering
  const sorted = useMemo(() => {
    const copy = [...filtered];
    copy.sort((a: any, b: any) => {
      const A = (a[sortKey] ?? "").toString().toLowerCase();
      const B = (b[sortKey] ?? "").toString().toLowerCase();
      if (A < B) return sortAsc ? -1 : 1;
      if (A > B) return sortAsc ? 1 : -1;
      return 0;
    });
    return copy;
  }, [filtered, sortKey, sortAsc]);

  // 📄 PDF-export
  function exportPDF() {
    const doc = new jsPDF();
    doc.text(`Hundpensionat – ${selectedMonthId}`, 14, 20);

    const body = sorted.map((b) => [
      b.rooms?.name ?? "—",
      b.dogs?.name ?? "—",
      b.dogs?.breed ?? "—",
      `${b.dogs?.heightcm ?? "—"} cm`,
      b.dogs?.owners?.full_name ?? "—",
      b.start_date,
      b.end_date,
      b.status,
      `${b.total_price ?? "—"} kr`,
      b.discount_amount ? `${b.discount_amount} kr rabatt` : "Ingen rabatt",
    ]);

    autoTable(doc, {
      head: [
        [
          "Rum",
          "Hund",
          "Ras",
          "Mankhöjd",
          "Ägare",
          "Incheckning",
          "Utcheckning",
          "Status",
          "Pris",
          "Rabatt",
        ],
      ],
      body,
      styles: { fontSize: 9 },
      headStyles: { fillColor: [37, 99, 235], textColor: 255 },
    });
    doc.save(`hundpensionat-${selectedMonthId}.pdf`);
  }

  const columns = [
    { key: "room", label: "Rum" },
    { key: "dog", label: "Hund" },
    { key: "owner", label: "Ägare" },
    { key: "start_date", label: "Incheckning" },
    { key: "end_date", label: "Utcheckning" },
    { key: "status", label: "Status" },
    { key: "total_price", label: "Pris (kr)" },
    { key: "discount_amount", label: "Rabatt (kr)" },
  ];

  return (
    <div
      className="min-h-screen"
      style={{
        background: "#fdfdfd",
        color: "#333",
        fontFamily: '"Segoe UI", Tahoma, Geneva, Verdana, sans-serif',
      }}
    >
      {/* Hero Section - Med bakgrundsbild från HTML */}
      <section
        className="text-center text-white relative"
        style={{
          padding: "100px 20px",
          background:
            'linear-gradient(rgba(44, 122, 76, 0.85), rgba(44, 122, 76, 0.85)), url("https://images.unsplash.com/photo-1558788353-f76d92427f16?ixlib=rb-4.0.3&auto=format&fit=crop&w=1600&q=80") center/cover no-repeat',
        }}
      >
        <h1 className="text-4xl font-bold mb-4">🏨 Hundpensionat</h1>
        <p className="text-xl mb-8 leading-relaxed opacity-95">
          Hantera pensionshundar och bokningar med full översikt
        </p>

        {/* Live-statistik på hero som overlay */}
        <div className="max-w-6xl mx-auto mt-12">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-7 gap-4">
            {/* Hundar idag */}
            <div className="bg-white bg-opacity-20 backdrop-blur-sm text-white p-4 rounded-lg border border-white border-opacity-30">
              <p className="text-sm font-medium uppercase tracking-wide opacity-90">
                Hundar idag
              </p>
              <p className="text-2xl font-bold mt-1">{liveStats.hundarIdag}</p>
            </div>
            {/* Incheck idag */}
            <div className="bg-white bg-opacity-20 backdrop-blur-sm text-white p-4 rounded-lg border border-white border-opacity-30">
              <p className="text-sm font-medium uppercase tracking-wide opacity-90">
                Incheck idag
              </p>
              <p className="text-2xl font-bold mt-1">{liveStats.incheckIdag}</p>
            </div>
            {/* Utcheck idag */}
            <div className="bg-white bg-opacity-20 backdrop-blur-sm text-white p-4 rounded-lg border border-white border-opacity-30">
              <p className="text-sm font-medium uppercase tracking-wide opacity-90">
                Utcheck idag
              </p>
              <p className="text-2xl font-bold mt-1">{liveStats.utcheckIdag}</p>
            </div>
            {/* Tjänster imorgon */}
            <div className="bg-white bg-opacity-20 backdrop-blur-sm text-white p-4 rounded-lg border border-white border-opacity-30">
              <p className="text-sm font-medium uppercase tracking-wide opacity-90">
                Tjänster imorgon
              </p>
              <p className="text-2xl font-bold mt-1">
                {liveStats.tjänsterImorgon}
              </p>
            </div>
            {/* Skapa bokning - knapp */}
            <Link
              href="/hundpensionat/nybokning"
              className="bg-blue-600 bg-opacity-80 hover:bg-opacity-100 text-white p-4 rounded-lg border border-white border-opacity-30 transition-all"
            >
              <p className="text-sm font-medium uppercase tracking-wide opacity-90">
                Skapa bokning
              </p>
              <p className="text-lg font-bold mt-1">➕ Ny bokning</p>
            </Link>
            {/* Kalender - knapp */}
            <Link
              href="/hundpensionat/kalender"
              className="bg-gray-600 bg-opacity-80 hover:bg-opacity-100 text-white p-4 rounded-lg border border-white border-opacity-30 transition-all"
            >
              <p className="text-sm font-medium uppercase tracking-wide opacity-90">
                Kalender
              </p>
              <p className="text-lg font-bold mt-1">📅 Visa kalender</p>
            </Link>
            {/* Hundrum - knapp */}
            <Link
              href="/rooms"
              className="bg-green-600 bg-opacity-80 hover:bg-opacity-100 text-white p-4 rounded-lg border border-white border-opacity-30 transition-all"
            >
              <p className="text-sm font-medium uppercase tracking-wide opacity-90">
                Hundrum
              </p>
              <p className="text-lg font-bold mt-1">🏠 Hantera rum</p>
            </Link>
          </div>
        </div>
      </section>

      {/* Main Container - HTML-inspirerat utseende */}
      <main className="max-w-5xl mx-auto px-5" style={{ margin: "60px auto" }}>
        {/* Funktioner som vackra kort */}
        <div
          className="grid gap-8 mb-12"
          style={{
            gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
          }}
        >
          {/* Sök och Filter */}
          <div
            className="bg-white text-center transition-transform duration-300 hover:-translate-y-1"
            style={{
              padding: "40px 25px",
              borderRadius: "12px",
              boxShadow: "0 4px 12px rgba(0, 0, 0, 0.06)",
            }}
          >
            <h2 className="mt-0 mb-4" style={{ color: "#2c7a4c" }}>
              🔍 Sök & Filtrera
            </h2>
            <div className="space-y-4">
              <select
                value={selectedMonthId}
                onChange={(e) => setSelectedMonthId(e.target.value)}
                className="w-full border rounded px-3 py-2 text-sm"
                style={{ borderColor: "#2c7a4c" }}
              >
                {months.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.id}
                  </option>
                ))}
              </select>
              <input
                type="text"
                placeholder="🔍 Sök hund, ras, ägare…"
                className="w-full border rounded px-3 py-2 text-sm"
                style={{ borderColor: "#2c7a4c" }}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
          </div>

          {/* PDF Export */}
          <div
            className="bg-white text-center transition-transform duration-300 hover:-translate-y-1"
            style={{
              padding: "40px 25px",
              borderRadius: "12px",
              boxShadow: "0 4px 12px rgba(0, 0, 0, 0.06)",
            }}
          >
            <h2 className="mt-0 mb-4" style={{ color: "#2c7a4c" }}>
              📄 Export
            </h2>
            <p
              className="mb-6 text-base leading-relaxed"
              style={{ color: "#333" }}
            >
              Exportera bokningar som PDF-rapport
            </p>
            <button
              onClick={exportPDF}
              className="inline-block text-white font-bold no-underline transition-colors duration-300 hover:bg-opacity-80"
              style={{
                padding: "12px 24px",
                background: "#2c7a4c",
                borderRadius: "8px",
                border: "none",
              }}
            >
              📄 Exportera PDF
            </button>
          </div>

          {/* Sortering */}
          <div
            className="bg-white text-center transition-transform duration-300 hover:-translate-y-1"
            style={{
              padding: "40px 25px",
              borderRadius: "12px",
              boxShadow: "0 4px 12px rgba(0, 0, 0, 0.06)",
            }}
          >
            <h2 className="mt-0 mb-4" style={{ color: "#2c7a4c" }}>
              ↕️ Sortering
            </h2>
            <div className="space-y-4">
              <select
                value={sortKey}
                onChange={(e) => setSortKey(e.target.value)}
                className="w-full border rounded px-3 py-2 text-sm"
                style={{ borderColor: "#2c7a4c" }}
              >
                {columns.map((c) => (
                  <option key={c.key} value={c.key}>
                    {c.label}
                  </option>
                ))}
              </select>
              <button
                onClick={() => setSortAsc(!sortAsc)}
                className="inline-block text-white font-bold no-underline transition-colors duration-300 hover:bg-opacity-80"
                style={{
                  padding: "8px 16px",
                  background: "#2c7a4c",
                  borderRadius: "6px",
                  border: "none",
                }}
              >
                {sortAsc ? "↑ Stigande" : "↓ Fallande"}
              </button>
            </div>
          </div>
        </div>

        {/* Bokningar Tabell */}
        <div
          className="bg-white transition-transform duration-300 hover:-translate-y-1"
          style={{
            padding: "40px 25px",
            borderRadius: "12px",
            boxShadow: "0 4px 12px rgba(0, 0, 0, 0.06)",
          }}
        >
          <h2 className="mt-0 mb-6 text-center" style={{ color: "#2c7a4c" }}>
            📋 Alla Bokningar ({sorted.length})
          </h2>

          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead style={{ backgroundColor: "#2c7a4c", color: "white" }}>
                <tr>
                  {columns.map((c) => {
                    return (
                      <th
                        key={c.key}
                        className="px-4 py-3 text-left font-medium cursor-pointer hover:bg-opacity-80"
                        onClick={() => {
                          if (sortKey === c.key) {
                            setSortAsc(!sortAsc);
                          } else {
                            setSortKey(c.key);
                            setSortAsc(true);
                          }
                        }}
                      >
                        {c.label}
                        {sortKey === c.key ? (
                          <span className="ml-1">{sortAsc ? "↑" : "↓"}</span>
                        ) : null}
                      </th>
                    );
                  })}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {sorted.map((booking) => (
                  <tr key={booking.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3">
                      {booking.rooms?.name || "Okänt rum"}
                    </td>
                    <td className="px-4 py-3">
                      {booking.dogs?.name || "Okänd hund"}
                    </td>
                    <td className="px-4 py-3">
                      {booking.dogs?.owners?.full_name || "Okänd ägare"}
                    </td>
                    <td className="px-4 py-3">{booking.start_date}</td>
                    <td className="px-4 py-3">{booking.end_date}</td>
                    <td className="px-4 py-3">
                      <span
                        className={`px-2 py-1 rounded text-xs font-medium ${
                          booking.status === "confirmed"
                            ? "bg-green-100 text-green-800"
                            : booking.status === "pending"
                            ? "bg-yellow-100 text-yellow-800"
                            : "bg-gray-100 text-gray-800"
                        }`}
                      >
                        {booking.status}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      {booking.total_price?.toLocaleString()} kr
                    </td>
                    <td className="px-4 py-3">
                      {booking.discount_amount?.toLocaleString()} kr
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </div>
  );
}
