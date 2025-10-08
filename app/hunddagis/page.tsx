"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { supabase } from "@/lib/supabase";

const PRIMARY_GREEN = "#2c7a4c";

/* ---------- Typer som matchar din DB ---------- */
type Room = {
  id: string;
  name: string | null;
  notes: string | null;
  capacity: number | null;
};

type Owner = {
  firstName?: string;
  lastName?: string;
  phone?: string;
  email?: string;
  address?: string;
  zipcode?: string;
  city?: string;
  contact2Name?: string;
  contact2Phone?: string;
};

type Addon = { type: string; times?: number };

type Dog = {
  id: string;
  user_id: string | null;
  name: string;
  breed: string | null;
  birth: string | null; // date -> string ISO från supabase-js
  heightcm: number | null;
  subscription: string | null;
  days: string | null; // t.ex "Mån,Ons,Fred" eller "M,T,O,T,F"
  addons: Addon[] | null; // jsonb
  vaccdhp: string | null;
  vaccpi: string | null;
  owner: Owner | null; // jsonb
  roomid: string | null; // FK → rooms.id
  startdate: string | null; // date
  enddate: string | null; // date
  price: number | null;
  events: any | null;
  notes: string | null;
};

/* ---------- Hjälpare ---------- */
// Skapa en lista av månader bakåt i tiden (inkl. nuvarande), med id "YYYY-MM"
function monthRangeBack(n: number) {
  const out: { id: string; start: Date; end: Date }[] = [];
  const now = new Date();
  const y = now.getFullYear();
  const m = now.getMonth(); // 0–11

  for (let i = 0; i < n; i++) {
    const d = new Date(y, m - i, 1);
    const id = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(
      2,
      "0"
    )}`;
    const start = new Date(d.getFullYear(), d.getMonth(), 1);
    const end = new Date(d.getFullYear(), d.getMonth() + 1, 0);
    out.push({ id, start, end });
  }
  return out;
}

const MONTHS = monthRangeBack(24);

// Läsbar dag-badge
function DayPill({ label, active }: { label: string; active: boolean }) {
  return (
    <span
      className={`inline-block text-xs px-2 py-1 rounded border ${
        active
          ? "bg-[#2c7a4c] text-white border-[#2c7a4c]"
          : "bg-gray-100 text-gray-600 border-gray-300"
      }`}
    >
      {label}
    </span>
  );
}

// Abonnemangs-badge
function SubBadge({ type }: { type?: string | null }) {
  const map: Record<string, string> = {
    Heltid: "bg-green-100 text-green-800",
    "Deltid 2": "bg-blue-100 text-blue-700",
    "Deltid 3": "bg-yellow-100 text-yellow-800",
    Dagshund: "bg-amber-100 text-amber-800",
  };
  const cls = type
    ? map[type] ?? "bg-gray-100 text-gray-700"
    : "bg-gray-100 text-gray-700";
  return (
    <span className={`inline-block text-xs px-2 py-1 rounded ${cls}`}>
      {type ?? "—"}
    </span>
  );
}

export default function HunddagisPage() {
  /* ---------- UI-state ---------- */
  const [dogs, setDogs] = useState<Dog[]>([]);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [loading, setLoading] = useState(true);

  const [search, setSearch] = useState("");
  const [showColumns, setShowColumns] = useState(false);

  const [sortKey, setSortKey] = useState<string>("name");
  const [sortAsc, setSortAsc] = useState(true);

  const [selectedMonthId, setSelectedMonthId] = useState(MONTHS[0].id);

  // Visa/dölj kolumner – standardval
  const [visibleCols, setVisibleCols] = useState<Record<string, boolean>>({
    roomid: true,
    name: true,
    breed: true,
    birth: true,
    heightcm: true,
    subscription: true,
    days: true,
    addons: true,
    vaccdhp: true,
    vaccpi: true,
    ownerName: true,
    phone: true,
    email: true,
    startdate: true,
    enddate: true,
    notes: false,
    price: false,
  });

  // Persistens i localStorage (frivilligt men skönt i vardagen)
  useEffect(() => {
    const raw = localStorage.getItem("dogplanner_daycare_visible_cols");
    if (raw) {
      try {
        const parsed = JSON.parse(raw);
        setVisibleCols((prev) => ({ ...prev, ...parsed }));
      } catch {}
    }
  }, []);
  useEffect(() => {
    localStorage.setItem(
      "dogplanner_daycare_visible_cols",
      JSON.stringify(visibleCols)
    );
  }, [visibleCols]);

  /* ---------- Hämta data från Supabase ---------- */
  useEffect(() => {
    const run = async () => {
      setLoading(true);

      const [
        { data: dogsData, error: dogsError },
        { data: roomsData, error: roomsError },
      ] = await Promise.all([
        supabase.from("dogs").select("*"),
        supabase.from("rooms").select("*"),
      ]);

      if (dogsError) console.error("Dogs fetch error:", dogsError);
      if (roomsError) console.error("Rooms fetch error:", roomsError);

      setDogs((dogsData ?? []) as Dog[]);
      setRooms((roomsData ?? []) as Room[]);
      setLoading(false);
    };

    run();
  }, []);

  /* ---------- Härledning: månad, filtrering, sortering ---------- */
  const selectedMonth = useMemo(
    () => MONTHS.find((m) => m.id === selectedMonthId) ?? MONTHS[0],
    [selectedMonthId]
  );

  // Filtrera på månad + sök
  const filteredDogs = useMemo(() => {
    const s = search.trim().toLowerCase();
    const ms = selectedMonth.start;
    const me = selectedMonth.end;

    const byMonth = dogs.filter((d) => {
      const start = d.startdate ? new Date(d.startdate) : new Date(0);
      const end = d.enddate ? new Date(d.enddate) : new Date(9999, 11, 31);
      return start <= me && end >= ms;
    });

    if (!s) return byMonth;

    return byMonth.filter((d) => {
      const ownerName = `${d.owner?.firstName ?? ""} ${
        d.owner?.lastName ?? ""
      }`.toLowerCase();
      return (
        d.name?.toLowerCase().includes(s) ||
        (d.breed ?? "").toLowerCase().includes(s) ||
        ownerName.includes(s)
      );
    });
  }, [dogs, search, selectedMonth]);

  const getSortValue = (d: Dog, key: string) => {
    switch (key) {
      case "roomid": {
        const r = rooms.find((x) => x.id === d.roomid);
        return (r?.name ?? "").toLowerCase();
      }
      case "ownerName":
        return `${d.owner?.firstName ?? ""} ${
          d.owner?.lastName ?? ""
        }`.toLowerCase();
      case "phone":
        return (d.owner?.phone ?? "").toLowerCase();
      case "email":
        return (d.owner?.email ?? "").toLowerCase();
      case "birth":
      case "startdate":
      case "enddate":
        return d[key as keyof Dog]
          ? new Date(String(d[key as keyof Dog])).getTime()
          : 0;
      case "heightcm":
      case "price":
        return Number(d[key as keyof Dog] ?? 0);
      default:
        return String(d[key as keyof Dog] ?? "").toLowerCase();
    }
  };

  const sortedDogs = useMemo(() => {
    const list = [...filteredDogs];
    list.sort((a, b) => {
      const A = getSortValue(a, sortKey);
      const B = getSortValue(b, sortKey);
      if (A < B) return sortAsc ? -1 : 1;
      if (A > B) return sortAsc ? 1 : -1;
      return 0;
    });
    return list;
  }, [filteredDogs, sortKey, sortAsc]);

  /* ---------- Export PDF ---------- */
  function exportPDF() {
    const doc = new jsPDF();
    doc.text(`Hunddagis – ${selectedMonthId}`, 14, 18);

    const rows = sortedDogs.map((d) => {
      const roomName = rooms.find((r) => r.id === d.roomid)?.name ?? "—";
      const ownerName =
        `${d.owner?.firstName ?? ""} ${d.owner?.lastName ?? ""}`.trim() || "—";
      const addonsText =
        (d.addons ?? [])
          .map((a) => `${a.type}${a.times ? ` x${a.times}` : ""}`)
          .join(", ") || "—";

      return [
        roomName,
        d.name ?? "—",
        d.breed ?? "—",
        d.birth ?? "—",
        d.heightcm ? `${d.heightcm} cm` : "—",
        d.subscription ?? "—",
        d.days ?? "—",
        addonsText,
        d.vaccdhp ?? "—",
        d.vaccpi ?? "—",
        ownerName,
        d.owner?.phone ?? "—",
        d.owner?.email ?? "—",
        d.startdate ?? "—",
        d.enddate ?? "—",
      ];
    });

    autoTable(doc, {
      startY: 24,
      head: [
        [
          "Rum",
          "Namn",
          "Ras",
          "Födelsedatum",
          "Mankhöjd",
          "Abonnemang",
          "Veckodagar",
          "Tillägg",
          "Vacc DHP",
          "Vacc PI",
          "Ägare",
          "Telefon",
          "E-post",
          "Start",
          "Slut",
        ],
      ],
      body: rows as any,
      styles: { fontSize: 9 },
      headStyles: { fillColor: [44, 122, 76], textColor: 255 },
    });

    doc.save(`hunddagis-${selectedMonthId}.pdf`);
  }

  /* ---------- Kolumn-definition ---------- */
  const columns: { key: string; label: string }[] = [
    { key: "roomid", label: "Rum" },
    { key: "name", label: "Namn" },
    { key: "breed", label: "Ras" },
    { key: "birth", label: "Födelsedatum" },
    { key: "heightcm", label: "Mankhöjd" },
    { key: "subscription", label: "Abonnemang" },
    { key: "days", label: "Veckodagar" },
    { key: "addons", label: "Tillägg" },
    { key: "vaccdhp", label: "Vacc DHP" },
    { key: "vaccpi", label: "Vacc PI" },
    { key: "ownerName", label: "Ägare" },
    { key: "phone", label: "Telefon" },
    { key: "email", label: "E-post" },
    { key: "startdate", label: "Start" },
    { key: "enddate", label: "Slut" },
    { key: "notes", label: "Kommentarer" },
    { key: "price", label: "Pris" },
  ];

  const toggleCol = (key: string) =>
    setVisibleCols((prev) => ({ ...prev, [key]: !prev[key] }));

  /* ---------- Render ---------- */
  if (loading) {
    return (
      <p className="p-6 text-center text-gray-600">Laddar hundar och rum…</p>
    );
  }

  return (
    <main className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-6">
        {/* Header / actions */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
          <h1 className="text-3xl font-bold" style={{ color: PRIMARY_GREEN }}>
            🐾 Mitt hunddagis
          </h1>

          <div className="flex flex-wrap gap-3 items-center">
            {/* Månadsväljare */}
            <select
              value={selectedMonthId}
              onChange={(e) => setSelectedMonthId(e.target.value)}
              className="border rounded px-3 py-2 text-sm bg-white"
              title="Välj månad (24 månader bakåt)"
            >
              {MONTHS.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.id}
                </option>
              ))}
            </select>

            {/* Sök */}
            <input
              type="text"
              placeholder="🔍 Sök hund, ras eller ägare…"
              className="border rounded px-3 py-2 text-sm w-56 bg-white"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />

            {/* Visa/Dölj kolumner */}
            <div className="relative">
              <button
                onClick={() => setShowColumns((v) => !v)}
                className="bg-gray-200 hover:bg-gray-300 px-4 py-2 rounded text-sm"
              >
                ⚙️ Visa/Dölj kolumner
              </button>
              {showColumns && (
                <div className="absolute right-0 mt-2 w-64 bg-white border border-gray-200 rounded-lg shadow-md p-3 z-10">
                  {columns.map((c) => (
                    <label
                      key={c.key}
                      className="flex items-center gap-2 text-sm mb-1"
                    >
                      <input
                        type="checkbox"
                        checked={!!visibleCols[c.key]}
                        onChange={() => toggleCol(c.key)}
                      />
                      {c.label}
                    </label>
                  ))}
                </div>
              )}
            </div>

            {/* Export + Ny hund + Rum */}
            <button
              onClick={exportPDF}
              className="bg-gray-200 hover:bg-gray-300 px-4 py-2 rounded text-sm"
            >
              📄 Exportera PDF
            </button>

            <Link
              href="/hunddagis/new"
              className="bg-[#2c7a4c] hover:bg-green-700 text-white px-4 py-2 rounded text-sm"
            >
              ➕ Ny hund
            </Link>

            <Link
              href="/rooms"
              className="bg-white border border-[#2c7a4c] text-[#2c7a4c] hover:bg-green-50 px-4 py-2 rounded text-sm"
              title="Gå till Mina hundrum"
            >
              🏠 Mina hundrum
            </Link>
          </div>
        </div>

        {/* Tabell */}
        <div className="overflow-x-auto bg-white shadow-md rounded-xl border border-gray-200">
          <table className="min-w-full text-sm">
            <thead style={{ backgroundColor: PRIMARY_GREEN, color: "white" }}>
              <tr>
                {columns
                  .filter((c) => visibleCols[c.key])
                  .map((c) => (
                    <th
                      key={c.key}
                      onClick={() => {
                        if (sortKey === c.key) setSortAsc((v) => !v);
                        else {
                          setSortKey(c.key);
                          setSortAsc(true);
                        }
                      }}
                      className="px-4 py-3 text-left cursor-pointer select-none"
                      title="Klicka för att sortera"
                    >
                      {c.label} {sortKey === c.key && (sortAsc ? "▲" : "▼")}
                    </th>
                  ))}
              </tr>
            </thead>

            <tbody>
              {sortedDogs.length === 0 ? (
                <tr>
                  <td
                    colSpan={columns.filter((c) => visibleCols[c.key]).length}
                    className="text-center text-gray-500 py-6"
                  >
                    Inga hundar hittades för vald månad.
                  </td>
                </tr>
              ) : (
                sortedDogs.map((d) => {
                  const roomName =
                    rooms.find((r) => r.id === d.roomid)?.name ?? "—";
                  const ownerName = `${d.owner?.firstName ?? ""} ${
                    d.owner?.lastName ?? ""
                  }`.trim();

                  const daysSet = new Set(
                    (d.days ?? "")
                      .split(/[,\s]+/)
                      .map((s) => s.trim())
                      .filter(Boolean)
                  );

                  const addonsText =
                    (d.addons ?? [])
                      .map((a) => `${a.type}${a.times ? ` x${a.times}` : ""}`)
                      .join(", ") || "—";

                  // Cell-render enligt kolumner
                  const renderCell = (key: string) => {
                    switch (key) {
                      case "roomid":
                        return (
                          <span className="text-blue-700">{roomName}</span>
                        );
                      case "name":
                        return (
                          <Link
                            href={`/hunddagis/${d.id}`}
                            className="text-[#2c7a4c] font-semibold hover:underline"
                            title="Öppna hundens profil"
                          >
                            {d.name}
                          </Link>
                        );
                      case "heightcm":
                        return d.heightcm ? `${d.heightcm} cm` : "—";
                      case "subscription":
                        return <SubBadge type={d.subscription} />;
                      case "days":
                        return (
                          <div className="flex flex-wrap gap-1">
                            {["Mån", "Tis", "Ons", "Tor", "Fre"].map(
                              (label) => {
                                // acceptera både svenska och initialer
                                const active =
                                  daysSet.has(label) ||
                                  daysSet.has(label.slice(0, 1)) ||
                                  daysSet.has(label.slice(0, 2));
                                return (
                                  <DayPill
                                    key={label}
                                    label={label}
                                    active={!!active}
                                  />
                                );
                              }
                            )}
                          </div>
                        );
                      case "addons":
                        return addonsText;
                      case "ownerName":
                        return ownerName || "—";
                      case "phone":
                        return d.owner?.phone ?? "—";
                      case "email":
                        return d.owner?.email ?? "—";
                      case "birth":
                      case "startdate":
                      case "enddate":
                        return d[key as keyof Dog] ?? "—";
                      case "notes":
                        return d.notes ?? "—";
                      case "price":
                        return d.price != null ? `${d.price} kr` : "—";
                      default:
                        // breed, vaccdhp, vaccpi m.fl.
                        // @ts-ignore
                        return d[key] ?? "—";
                    }
                  };

                  return (
                    <tr
                      key={d.id}
                      className="border-t hover:bg-gray-50 transition"
                    >
                      {columns
                        .filter((c) => visibleCols[c.key])
                        .map((c) => (
                          <td key={c.key} className="px-4 py-3 align-top">
                            {renderCell(c.key)}
                          </td>
                        ))}
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </main>
  );
}
