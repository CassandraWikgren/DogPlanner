"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/context/AuthContext";

const PRIMARY_GREEN = "#2c7a4c";

interface Dog {
  id: string;
  name: string;
  breed: string;
  birth: string;
  height_cm?: number;
  subscription?: string;
  days?: string[];
  addons?: { type: string; times: number }[];
  vacc_dhp?: string;
  vacc_pi?: string;
  owner_name?: string;
  room_id?: string;
  start_date?: string;
  end_date?: string;
}

interface Room {
  id: string;
  name: string;
}

export default function HunddagisPage() {
  const { user } = useAuth();
  const [dogs, setDogs] = useState<Dog[]>([]);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [search, setSearch] = useState("");
  const [visibleCols, setVisibleCols] = useState<Record<string, boolean>>({});
  const [sortKey, setSortKey] = useState<string>("name");
  const [sortAsc, setSortAsc] = useState(true);
  const [showColumns, setShowColumns] = useState(false);

  // 🗓️ månader
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
  const [selectedMonthId, setSelectedMonthId] = useState(months[0]?.id || "");

  // 🐶 Hämta hundar & rum från Supabase
  useEffect(() => {
    if (!user) return;

    async function loadData() {
      const [{ data: dogsData }, { data: roomsData }] = await Promise.all([
        supabase.from("dogs").select("*").eq("user_id", user.id),
        supabase.from("rooms").select("*").eq("user_id", user.id),
      ]);

      setDogs(dogsData || []);
      setRooms(roomsData || []);
    }

    loadData();

    const defaults: Record<string, boolean> = {
      room_id: true,
      name: true,
      breed: true,
      birth: true,
      height_cm: true,
      subscription: true,
      days: true,
      addons: true,
      vacc_dhp: true,
      vacc_pi: true,
      owner_name: true,
    };
    setVisibleCols(defaults);
  }, [user]);

  // 📅 Filtrering & sortering
  const filteredDogs = useMemo(() => {
    const s = search.trim().toLowerCase();
    return dogs.filter(
      (d) =>
        !s ||
        d.name?.toLowerCase().includes(s) ||
        d.breed?.toLowerCase().includes(s) ||
        d.owner_name?.toLowerCase().includes(s)
    );
  }, [dogs, search]);

  const sortedDogs = useMemo(() => {
    const copy = [...filteredDogs];
    copy.sort((a, b) => {
      const A = (a[sortKey as keyof Dog] ?? "").toString().toLowerCase();
      const B = (b[sortKey as keyof Dog] ?? "").toString().toLowerCase();
      if (A < B) return sortAsc ? -1 : 1;
      if (A > B) return sortAsc ? 1 : -1;
      return 0;
    });
    return copy;
  }, [filteredDogs, sortKey, sortAsc]);

  const toggleCol = (key: string) =>
    setVisibleCols((prev) => ({ ...prev, [key]: !prev[key] }));

  // 📄 Exportera PDF
  function exportPDF() {
    const doc = new jsPDF();
    doc.text(`Hunddagis – ${selectedMonthId}`, 14, 20);
    const body = sortedDogs.map((d) => [
      rooms.find((r) => r.id === d.room_id)?.name ?? "—",
      d.name,
      d.breed,
      d.birth,
      `${d.height_cm ?? ""} cm`,
      d.subscription ?? "—",
      (d.days ?? []).join(", "),
      d.addons?.map((a) => `${a.type} x${a.times}`).join(", ") ?? "—",
      d.vacc_dhp ?? "—",
      d.vacc_pi ?? "—",
      d.owner_name ?? "—",
    ]);
    autoTable(doc, {
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
        ],
      ],
      body: body as any,
      styles: { fontSize: 9 },
      headStyles: { fillColor: [44, 122, 76], textColor: 255 },
    });
    doc.save(`hunddagis-${selectedMonthId}.pdf`);
  }

  const columns = [
    { key: "room_id", label: "Rum" },
    { key: "name", label: "Namn" },
    { key: "breed", label: "Ras" },
    { key: "birth", label: "Födelsedatum" },
    { key: "height_cm", label: "Mankhöjd" },
    { key: "subscription", label: "Abonnemang" },
    { key: "days", label: "Veckodagar" },
    { key: "addons", label: "Tillägg" },
    { key: "vacc_dhp", label: "Vacc DHP" },
    { key: "vacc_pi", label: "Vacc PI" },
    { key: "owner_name", label: "Ägare" },
  ];

  return (
    <main className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
          <h1 className="text-3xl font-bold text-[#2c7a4c]">
            🐾 Mitt hunddagis
          </h1>
          <div className="flex flex-wrap gap-3 items-center">
            <select
              value={selectedMonthId}
              onChange={(e) => setSelectedMonthId(e.target.value)}
              className="border rounded px-3 py-2 text-sm"
            >
              {months.map((m) => (
                <option key={m.id}>{m.id}</option>
              ))}
            </select>
            <input
              type="text"
              placeholder="🔍 Sök hund, ras, ägare..."
              className="border rounded px-3 py-2 text-sm w-56"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
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
                        if (sortKey === c.key) setSortAsc(!sortAsc);
                        else {
                          setSortKey(c.key);
                          setSortAsc(true);
                        }
                      }}
                      className="px-4 py-3 text-left cursor-pointer select-none"
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
                    colSpan={columns.length}
                    className="text-center text-gray-500 py-6"
                  >
                    Inga hundar hittades.
                  </td>
                </tr>
              ) : (
                sortedDogs.map((d) => (
                  <tr
                    key={d.id}
                    className="border-t hover:bg-gray-50 transition"
                  >
                    {columns
                      .filter((c) => visibleCols[c.key])
                      .map((c) => (
                        <td key={c.key} className="px-4 py-3">
                          {c.key === "room_id"
                            ? rooms.find((r) => r.id === d.room_id)?.name ?? "—"
                            : // @ts-ignore
                              d[c.key] ?? "—"}
                        </td>
                      ))}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </main>
  );
}
