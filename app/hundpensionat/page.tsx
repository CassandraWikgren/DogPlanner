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
  });

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string>("");

  // Ladda live-statistik - temporär version med test-data
  const loadLiveStats = async () => {
    try {
      console.log("🔍 Laddar statistik (test-data)...");

      // Sätt test-statistik för att visa att UI fungerar
      setLiveStats({
        hundarIdag: 5,
        incheckIdag: 2,
        utcheckIdag: 1,
        tjänsterImorgon: 3,
        totalOwners: 25,
        monthlyRevenue: 28500,
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
    <>
      <style jsx>{`
        :root {
          --primary-green: #2c7a4c;
          --light-green: rgba(44, 122, 76, 0.1);
          --success-green: #28a745;
          --warning-yellow: #ffc107;
          --danger-red: #dc3545;
        }

        .pensionat-container {
          min-height: 100vh;
          background: linear-gradient(
            135deg,
            rgba(44, 122, 76, 0.1) 0%,
            rgba(76, 175, 80, 0.05) 100%
          );
          padding: 20px;
        }

        .pensionat-header {
          background: rgba(255, 255, 255, 0.95);
          backdrop-filter: blur(10px);
          border: 1px solid rgba(44, 122, 76, 0.2);
          border-radius: 8px;
          padding: 20px 30px;
          margin-bottom: 20px;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
        }

        .pensionat-back-btn {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          color: var(--primary-green);
          text-decoration: none;
          font-weight: 500;
          padding: 8px 16px;
          border-radius: 6px;
          transition: all 0.2s ease;
          border: 1px solid transparent;
        }

        .pensionat-back-btn:hover {
          background: var(--light-green);
          border-color: var(--primary-green);
        }

        .pensionat-hero {
          text-align: center;
          padding: 60px 20px;
          background: linear-gradient(
              rgba(44, 122, 76, 0.85),
              rgba(44, 122, 76, 0.85)
            ),
            url("/Hero.jpeg") center/cover no-repeat;
          color: #fff;
          border-radius: 12px;
          margin-bottom: 30px;
          position: relative;
          overflow: hidden;
        }

        .pensionat-hero::before {
          content: "";
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: url('data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1000 100"><path d="M0,0 C150,100 350,0 500,50 C650,100 850,0 1000,50 L1000,100 L0,100 Z" fill="rgba(255,255,255,0.1)"/></svg>');
          background-size: cover;
          opacity: 0.2;
        }

        .pensionat-hero h1 {
          font-size: 2.5rem;
          font-weight: 700;
          margin-bottom: 16px;
          position: relative;
          z-index: 1;
        }

        .pensionat-hero p {
          font-size: 1.1rem;
          line-height: 1.6;
          max-width: 600px;
          margin: 0 auto;
          opacity: 0.95;
          position: relative;
          z-index: 1;
        }

        .pensionat-stats {
          display: grid;
          grid-template-columns: repeat(6, 1fr);
          gap: 20px;
          max-width: 1200px;
          margin: 0 auto;
          position: relative;
          z-index: 1;
        }

        .pensionat-stat-card {
          background: rgba(255, 255, 255, 0.15);
          backdrop-filter: blur(10px);
          border: 1px solid rgba(255, 255, 255, 0.2);
          border-radius: 8px;
          padding: 16px 12px;
          text-align: center;
          transition: all 0.3s ease;
          min-height: 100px;
          max-height: 100px;
          display: flex;
          flex-direction: column;
          justify-content: center;
        }

        .pensionat-stat-card:hover {
          background: rgba(255, 255, 255, 0.25);
          transform: translateY(-2px);
        }

        .pensionat-stat-value {
          font-size: 24px;
          font-weight: 700;
          color: white;
          margin-bottom: 4px;
        }

        .pensionat-stat-label {
          font-size: 11px;
          opacity: 0.9;
          color: white;
          font-weight: 500;
        }

        .pensionat-controls {
          background: rgba(255, 255, 255, 0.95);
          backdrop-filter: blur(10px);
          border: 1px solid rgba(44, 122, 76, 0.2);
          border-radius: 8px;
          padding: 20px;
          margin-bottom: 20px;
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 20px;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
        }

        .pensionat-controls-left {
          display: flex;
          gap: 12px;
          align-items: center;
        }

        .pensionat-controls-right {
          display: flex;
          gap: 8px;
          align-items: center;
        }

        .pensionat-select,
        .pensionat-input {
          padding: 8px 12px;
          border: 1px solid rgba(44, 122, 76, 0.3);
          border-radius: 6px;
          font-size: 14px;
          background: white;
          transition: all 0.2s ease;
        }

        .pensionat-select:focus,
        .pensionat-input:focus {
          outline: none;
          border-color: var(--primary-green);
          box-shadow: 0 0 0 2px rgba(44, 122, 76, 0.1);
        }

        .pensionat-btn {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 8px 16px;
          border-radius: 6px;
          font-size: 14px;
          font-weight: 500;
          text-decoration: none;
          border: none;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .pensionat-btn-primary {
          background: var(--primary-green);
          color: white;
        }

        .pensionat-btn-primary:hover {
          background: #245a3a;
          transform: translateY(-1px);
        }

        .pensionat-btn-secondary {
          background: #6c757d;
          color: white;
        }

        .pensionat-btn-secondary:hover {
          background: #5a6268;
          transform: translateY(-1px);
        }

        .pensionat-btn-accent {
          background: var(--success-green);
          color: white;
        }

        .pensionat-btn-accent:hover {
          background: #218838;
          transform: translateY(-1px);
        }

        .pensionat-table-wrapper {
          background: rgba(255, 255, 255, 0.95);
          backdrop-filter: blur(10px);
          border: 1px solid rgba(44, 122, 76, 0.2);
          border-radius: 8px;
          overflow: hidden;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
        }

        .pensionat-table {
          width: 100%;
          border-collapse: collapse;
        }

        .pensionat-table th {
          background: var(--primary-green);
          color: white;
          padding: 12px 16px;
          text-align: left;
          font-weight: 600;
          cursor: pointer;
          user-select: none;
        }

        .pensionat-table th:hover {
          background: rgba(255, 255, 255, 0.1);
        }

        .pensionat-table tbody tr:nth-child(even) {
          background: var(--light-green);
        }

        .pensionat-table tbody tr:hover {
          background: #f0f8f0;
        }

        .pensionat-table td {
          padding: 12px 16px;
          border-bottom: 1px solid rgba(0, 0, 0, 0.1);
        }

        .pensionat-status {
          padding: 4px 8px;
          border-radius: 3px;
          font-size: 12px;
          font-weight: 500;
          text-align: center;
          min-width: 70px;
          display: inline-block;
        }

        .pensionat-status-confirmed {
          background: #d4edda;
          color: #155724;
          border: 1px solid #c3e6cb;
        }

        .pensionat-status-pending {
          background: #fff3cd;
          color: #856404;
          border: 1px solid #ffeaa7;
        }

        .pensionat-status-cancelled {
          background: #f8d7da;
          color: #721c24;
          border: 1px solid #f5c6cb;
        }

        .pensionat-error {
          background: #f8d7da;
          border: 1px solid #f5c6cb;
          color: #721c24;
          padding: 12px;
          border-radius: 4px;
          margin-bottom: 16px;
        }

        .pensionat-loading,
        .pensionat-empty {
          text-align: center;
          padding: 40px;
          color: #666;
        }

        @media (max-width: 1200px) {
          .pensionat-stats {
            grid-template-columns: repeat(6, 1fr);
            max-width: 1000px;
            gap: 15px;
          }

          .pensionat-stat-card {
            min-height: 85px;
            max-height: 85px;
            padding: 12px 8px;
          }

          .pensionat-stat-value {
            font-size: 20px;
          }

          .pensionat-stat-label {
            font-size: 10px;
          }
        }

        @media (max-width: 900px) {
          .pensionat-stats {
            grid-template-columns: repeat(6, 1fr);
            gap: 12px;
            max-width: 700px;
          }

          .pensionat-stat-card {
            min-height: 75px;
            max-height: 75px;
            padding: 10px 6px;
          }

          .pensionat-stat-value {
            font-size: 18px;
          }

          .pensionat-stat-label {
            font-size: 9px;
          }

          .pensionat-controls {
            flex-direction: column;
            align-items: stretch;
          }

          .pensionat-controls-left,
          .pensionat-controls-right {
            width: 100%;
            justify-content: center;
          }

          .pensionat-hero h1 {
            font-size: 1.5rem;
          }

          .pensionat-table-wrapper {
            overflow-x: auto;
          }

          .pensionat-header {
            padding: 15px 20px;
          }
        }

        @media (max-width: 600px) {
          .pensionat-stats {
            grid-template-columns: repeat(6, 1fr);
            gap: 8px;
            max-width: 500px;
          }

          .pensionat-stat-card {
            min-height: 65px;
            max-height: 65px;
            padding: 8px 4px;
          }

          .pensionat-stat-value {
            font-size: 16px;
          }

          .pensionat-stat-label {
            font-size: 8px;
          }
        }

        @media (max-width: 420px) {
          .pensionat-stats {
            grid-template-columns: repeat(6, 1fr);
            max-width: 350px;
            gap: 6px;
          }

          .pensionat-stat-card {
            min-height: 55px;
            max-height: 55px;
            padding: 6px 2px;
          }

          .pensionat-stat-value {
            font-size: 14px;
          }

          .pensionat-stat-label {
            font-size: 7px;
          }
        }
      `}</style>

      <div className="pensionat-container">
        {/* Header */}
        <header className="pensionat-header">
          <Link href="/dashboard" className="pensionat-back-btn">
            ← Tillbaka
          </Link>
        </header>

        {/* Hero Section */}
        <section className="pensionat-hero">
          <h1>Hundpensionat</h1>
          <p>
            Professionell pensionathantering med fullständig översikt över
            bokningar, rum och gäster. Skapa trygghet för både hundar och ägare.
          </p>

          {/* Live-statistik kort som overlay på hero - precis som på dashboard */}
          <div className="max-w-6xl mx-auto mt-12">
            <div className="pensionat-stats">
              <div className="pensionat-stat-card">
                <p className="pensionat-stat-label">Idag</p>
                <p className="pensionat-stat-value">{liveStats.hundarIdag}</p>
              </div>

              <div className="pensionat-stat-card">
                <p className="pensionat-stat-label">Ankomster</p>
                <p className="pensionat-stat-value">{liveStats.incheckIdag}</p>
              </div>

              <div className="pensionat-stat-card">
                <p className="pensionat-stat-label">Avresor</p>
                <p className="pensionat-stat-value">{liveStats.utcheckIdag}</p>
              </div>

              <div className="pensionat-stat-card">
                <p className="pensionat-stat-label">Imorgon</p>
                <p className="pensionat-stat-value">
                  {liveStats.tjänsterImorgon}
                </p>
              </div>

              <div className="pensionat-stat-card">
                <p className="pensionat-stat-label">Kunder</p>
                <p className="pensionat-stat-value">{liveStats.totalOwners}</p>
              </div>

              <div className="pensionat-stat-card">
                <p className="pensionat-stat-label">Intäkt</p>
                <p className="pensionat-stat-value">
                  {liveStats.monthlyRevenue.toLocaleString()} kr
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Main Content */}
        <main>
          {/* Kontroller */}
          <div className="pensionat-controls">
            <div className="pensionat-controls-left">
              <select
                value={selectedMonthId}
                onChange={(e) => setSelectedMonthId(e.target.value)}
                className="pensionat-select"
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

              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="🔍 Sök bokningar..."
                className="pensionat-input"
                style={{ minWidth: "200px" }}
              />
            </div>

            <div className="pensionat-controls-right">
              <button
                onClick={loadBookings}
                className="pensionat-btn pensionat-btn-primary"
              >
                <RefreshCcw size={16} />
                Uppdatera
              </button>
              <button
                onClick={exportToPDF}
                className="pensionat-btn pensionat-btn-secondary"
              >
                <Download size={16} />
                Exportera PDF
              </button>
              <Link
                href="/hundpensionat/new"
                className="pensionat-btn pensionat-btn-accent"
              >
                <Plus size={16} />
                Ny bokning
              </Link>
            </div>
          </div>

          {/* Error display */}
          {error && <div className="pensionat-error">{error}</div>}

          {/* Tabell */}
          <div className="pensionat-table-wrapper">
            <table className="pensionat-table">
              <thead>
                <tr>
                  <th onClick={() => handleSort("room")}>
                    Rum {sortKey === "room" && (sortAsc ? "↑" : "↓")}
                  </th>
                  <th onClick={() => handleSort("dog")}>
                    Hund {sortKey === "dog" && (sortAsc ? "↑" : "↓")}
                  </th>
                  <th onClick={() => handleSort("owner")}>
                    Ägare {sortKey === "owner" && (sortAsc ? "↑" : "↓")}
                  </th>
                  <th onClick={() => handleSort("start_date")}>
                    Startdatum{" "}
                    {sortKey === "start_date" && (sortAsc ? "↑" : "↓")}
                  </th>
                  <th onClick={() => handleSort("end_date")}>
                    Slutdatum {sortKey === "end_date" && (sortAsc ? "↑" : "↓")}
                  </th>
                  <th onClick={() => handleSort("status")}>
                    Status {sortKey === "status" && (sortAsc ? "↑" : "↓")}
                  </th>
                  <th onClick={() => handleSort("total_price")}>
                    Totalpris{" "}
                    {sortKey === "total_price" && (sortAsc ? "↑" : "↓")}
                  </th>
                  <th>Rabatt</th>
                </tr>
              </thead>
              <tbody>
                {isLoading ? (
                  <tr>
                    <td colSpan={8} className="pensionat-loading">
                      Laddar bokningar...
                    </td>
                  </tr>
                ) : sorted.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="pensionat-empty">
                      {search || selectedMonthId
                        ? "Inga bokningar matchade din sökning"
                        : "Inga bokningar hittades"}
                    </td>
                  </tr>
                ) : (
                  sorted.map((booking) => (
                    <tr key={booking.id}>
                      <td>{booking.rooms?.name ?? "—"}</td>
                      <td>{booking.dogs?.name ?? "—"}</td>
                      <td>{booking.dogs?.owners?.full_name ?? "—"}</td>
                      <td>{booking.start_date}</td>
                      <td>{booking.end_date}</td>
                      <td>
                        <span
                          className={`pensionat-status ${
                            booking.status === "confirmed"
                              ? "pensionat-status-confirmed"
                              : booking.status === "pending"
                              ? "pensionat-status-pending"
                              : "pensionat-status-cancelled"
                          }`}
                        >
                          {booking.status}
                        </span>
                      </td>
                      <td>
                        {booking.total_price
                          ? `${booking.total_price} kr`
                          : "—"}
                      </td>
                      <td>
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
        </main>
      </div>
    </>
  );
}
