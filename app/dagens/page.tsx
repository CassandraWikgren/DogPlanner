"use client";

import * as React from "react";
import { supabase } from "@/lib/supabase";
import EditDogModal from "@/components/EditDogModal";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import html2canvas from "html2canvas";

/* =========================
 * Typer
 * ========================= */
type Owner = {
  id: string;
  full_name: string | null;
  phone: string | null;
  email: string | null;
  customer_number?: number | null;
};

type Room = { id: string; name: string | null };

type Dog = {
  id: string;
  name: string | null;
  breed: string | null;
  subscription: string | null;
  days: string | null; // "Måndag,Tisdag,Onsdag"
  startdate: string | null;
  enddate: string | null;

  checked_in?: boolean | null; // dagens incheckning (valfritt schemafält)
  checkin_date?: string | null; // planerad in
  checkout_date?: string | null; // planerad ut

  notes?: string | null; // schemafält
  note?: string | null; // bakåtkompatibelt (läser men sparar till notes)

  room_id: string | null;
  owner_id: string | null;

  vaccdhp?: string | null;
  vaccpi?: string | null;

  owners?: Owner | null; // från select
  rooms?: Room | null; // från select

  owner?: Owner | null; // mappat i loadDogs
  room?: Room | null; // mappat i loadDogs
};

/* =========================
 * Konstanter & helpers
 * ========================= */
const PRIMARY = "#2c7a4c";

const SUB_OPTIONS = [
  "Alla",
  "Heltid",
  "Deltid 3",
  "Deltid 2",
  "Dagshund",
] as const;
const DAY_OPTIONS = [
  "Alla",
  "Måndag",
  "Tisdag",
  "Onsdag",
  "Torsdag",
  "Fredag",
] as const;

type ColumnKey =
  | "name"
  | "room"
  | "subscription"
  | "owner_name"
  | "days"
  | "status"
  | "notes"
  | "next_inout";

type Column = { key: ColumnKey; label: string; visible: boolean };

const INITIAL_COLS: Column[] = [
  { key: "name", label: "Hund", visible: true },
  { key: "room", label: "Rum", visible: true },
  { key: "subscription", label: "Abonnemang", visible: true },
  { key: "owner_name", label: "Ägare", visible: true },
  { key: "days", label: "Dagar", visible: true },
  { key: "status", label: "Status", visible: true },
  { key: "notes", label: "Anteckning", visible: true },
  { key: "next_inout", label: "Nästa in/ut", visible: true },
];

function getSubscriptionBadge(type?: string | null) {
  if (!type) return "bg-gray-100 text-gray-700";
  const t = type.toLowerCase();
  if (t.includes("heltid")) return "bg-green-100 text-green-800";
  if (t.includes("deltid 3")) return "bg-blue-100 text-blue-800";
  if (t.includes("deltid 2")) return "bg-blue-100 text-blue-800";
  if (t.includes("dag")) return "bg-yellow-100 text-yellow-800";
  return "bg-gray-100 text-gray-700";
}

function svWeekday(date = new Date()) {
  return [
    "Söndag",
    "Måndag",
    "Tisdag",
    "Onsdag",
    "Torsdag",
    "Fredag",
    "Lördag",
  ][date.getDay()];
}

function isToday(dateStr?: string | null) {
  if (!dateStr) return false;
  const d = new Date(dateStr);
  const t = new Date();
  return (
    d.getFullYear() === t.getFullYear() &&
    d.getMonth() === t.getMonth() &&
    d.getDate() === t.getDate()
  );
}

function isTomorrow(dateStr?: string | null) {
  if (!dateStr) return false;
  const d = new Date(dateStr);
  const t = new Date();
  const tmw = new Date(t.getFullYear(), t.getMonth(), t.getDate() + 1);
  return (
    d.getFullYear() === tmw.getFullYear() &&
    d.getMonth() === tmw.getMonth() &&
    d.getDate() === tmw.getDate()
  );
}

function monthRange(ym: string) {
  // ym format "YYYY-MM"
  const [y, m] = ym.split("-").map(Number);
  const start = new Date(y, (m || 1) - 1, 1);
  const end = new Date(y, m || 1, 0); // sista dagen i månaden
  return { start, end };
}

/* =========================
 * Komponent
 * ========================= */
export default function DagensPage() {
  const [dogs, setDogs] = React.useState<Dog[]>([]);
  const [rooms, setRooms] = React.useState<Room[]>([]);
  const [loading, setLoading] = React.useState(true);

  // Filter & UI
  const [search, setSearch] = React.useState("");
  const [filterRoom, setFilterRoom] = React.useState<string>("Alla");
  const [filterSub, setFilterSub] =
    React.useState<(typeof SUB_OPTIONS)[number]>("Alla");
  const [filterDay, setFilterDay] =
    React.useState<(typeof DAY_OPTIONS)[number]>("Alla");
  const [monthFilter, setMonthFilter] = React.useState<string>(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
  });

  const [columns, setColumns] = React.useState<Column[]>(() => {
    if (typeof window !== "undefined") {
      try {
        const saved = localStorage.getItem("dagens_columns_v1");
        if (!saved) return INITIAL_COLS;

        const parsed = JSON.parse(saved);
        return Array.isArray(parsed) ? parsed : INITIAL_COLS;
      } catch (error) {
        console.warn(
          "[ERR-3007] Korrupt kolumndata för dagens, återställer:",
          error
        );
        return INITIAL_COLS;
      }
    }
    return INITIAL_COLS;
  });

  const [sortKey, setSortKey] = React.useState<ColumnKey>("name");
  const [sortAsc, setSortAsc] = React.useState(true);

  const [showModal, setShowModal] = React.useState(false);

  /* ===== Init / Realtime ===== */
  React.useEffect(() => {
    loadAll();

    // realtime uppdatering
    const ch = supabase
      .channel("dogs-realtime")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "dogs" },
        () => loadDogs()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(ch);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* ===== Ladda data ===== */
  async function loadAll() {
    await Promise.all([loadDogs(), loadRooms()]);
  }

  async function loadDogs() {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("dogs")
        .select(
          "*, owners(full_name, phone, email, customer_number), rooms(name)"
        )
        .order("name", { ascending: true });
      if (error) throw error;

      const list = (data ?? []).map((d: any) => ({
        ...d,
        owner: d.owners ?? null,
        room: d.rooms ?? null,
      })) as Dog[];

      setDogs(list);
    } catch (e) {
      console.error("❌ loadDogs error:", e);
    } finally {
      setLoading(false);
    }
  }

  async function loadRooms() {
    const { data, error } = await supabase
      .from("rooms")
      .select("id, name")
      .order("name");
    if (error) console.warn("rooms error:", error);
    setRooms(data ?? []);
  }

  /* ===== Händelser: in/utcheckning & anteckning ===== */
  async function toggleCheckIn(dog: Dog) {
    try {
      const { error } = await (supabase.from("dogs") as any)
        .update({ checked_in: !dog.checked_in })
        .eq("id", dog.id);
      if (error) throw error;
      await loadDogs();
    } catch (e) {
      console.error("toggleCheckIn error:", e);
    }
  }

  async function updateNote(dog: Dog, note: string) {
    try {
      const { error } = await (supabase.from("dogs") as any)
        .update({ notes: note })
        .eq("id", dog.id);
      if (error) throw error;
    } catch (e) {
      console.error("updateNote error:", e);
    }
  }

  /* ===== Kolumner ===== */
  function toggleColumn(key: ColumnKey) {
    const next = columns.map((c) =>
      c.key === key ? { ...c, visible: !c.visible } : c
    );
    setColumns(next);
    if (typeof window !== "undefined") {
      try {
        localStorage.setItem("dagens_columns_v1", JSON.stringify(next));
      } catch (error) {
        console.warn("[ERR-3008] Kunde inte spara kolumnval:", error);
      }
    }
  }

  /* ===== Sök, filter, sort ===== */
  const filtered = React.useMemo(() => {
    // 1) Aktiv under vald månad
    const { start, end } = monthRange(monthFilter);
    const byMonth = dogs.filter((d) => {
      const starts = d.startdate ? new Date(d.startdate) : null;
      const ends = d.enddate ? new Date(d.enddate) : null;
      const active = (!starts || starts <= end) && (!ends || ends >= start);
      return active;
    });

    // 2) Rum/Sub/Dag
    const todays = svWeekday();
    const byBasic = byMonth.filter((d) => {
      if (
        filterRoom !== "Alla" &&
        (d.room?.name ?? "Ej tilldelad") !== filterRoom
      )
        return false;

      if (filterSub !== "Alla") {
        const s = (d.subscription ?? "").toLowerCase();
        if (!s.includes(filterSub.toLowerCase())) return false;
      }

      if (filterDay !== "Alla") {
        const days = (d.days ?? "").split(",").map((x) => x.trim());
        if (!days.includes(filterDay)) return false;
      }

      return true;
    });

    // 3) Sök
    const q = search.trim().toLowerCase();
    const bySearch = !q
      ? byBasic
      : byBasic.filter((d) => {
          return (
            (d.name ?? "").toLowerCase().includes(q) ||
            (d.breed ?? "").toLowerCase().includes(q) ||
            (d.subscription ?? "").toLowerCase().includes(q) ||
            (d.owner?.full_name ?? "").toLowerCase().includes(q)
          );
        });

    // 4) Markera “planerad idag” utifrån schemadagar om inga checkin/checkout-datum
    //    (visas senare via statusCell)
    return bySearch;
  }, [dogs, monthFilter, filterRoom, filterSub, filterDay, search]);

  const sorted = React.useMemo(() => {
    const arr = [...filtered];
    arr.sort((a, b) => {
      const val = (d: Dog, k: ColumnKey) => {
        switch (k) {
          case "owner_name":
            return d.owner?.full_name ?? "";
          case "room":
            return d.room?.name ?? "";
          case "subscription":
            return d.subscription ?? "";
          case "days":
            return d.days ?? "";
          case "status":
            return (d.checked_in ? "A" : "B") + (d.name ?? "");
          case "notes":
            return d.notes ?? d.note ?? "";
          case "next_inout":
            return (d.checkout_date ?? d.checkin_date ?? "") + (d.name ?? "");
          default:
            return d.name ?? "";
        }
      };
      const A = String(val(a, sortKey)).toLowerCase();
      const B = String(val(b, sortKey)).toLowerCase();
      if (A < B) return sortAsc ? -1 : 1;
      if (A > B) return sortAsc ? 1 : -1;
      return 0;
    });
    return arr;
  }, [filtered, sortKey, sortAsc]);

  /* ===== Export ===== */
  async function exportPDF() {
    if (!sorted.length) return alert("Ingen data att exportera ännu.");

    const doc = new jsPDF();
    const today = new Date();
    const title = `Dagens lista – ${today.toLocaleDateString("sv-SE", {
      year: "numeric",
      month: "long",
      day: "numeric",
    })}`;

    doc.setFontSize(14);
    doc.text(title, 14, 16);
    doc.setFontSize(10);
    doc.text(
      `Utskriven: ${new Date().toLocaleTimeString("sv-SE")}`,
      200 - 14,
      16,
      { align: "right" }
    );

    autoTable(doc, {
      startY: 24,
      head: [columns.filter((c) => c.visible).map((c) => c.label)],
      body: sorted.map((d) =>
        columns
          .filter((c) => c.visible)
          .map((c) => {
            switch (c.key) {
              case "room":
                return d.room?.name ?? "—";
              case "owner_name":
                return d.owner?.full_name ?? "—";
              case "subscription":
                return d.subscription ?? "—";
              case "days":
                return d.days ? d.days.split(",").join(" ") : "—";
              case "status":
                return d.checked_in
                  ? "✅ Incheckad"
                  : isToday(d.checkin_date)
                  ? "🕓 Planerad in"
                  : d.checkout_date &&
                    (isToday(d.checkout_date) || isTomorrow(d.checkout_date))
                  ? "🚗 Planerad ut"
                  : scheduleSuggestToday(d)
                  ? "🗓 Schema idag"
                  : "—";
              case "notes":
                return d.notes ?? d.note ?? "—";
              case "next_inout":
                return d.checkout_date
                  ? new Date(d.checkout_date).toLocaleDateString("sv-SE")
                  : d.checkin_date
                  ? new Date(d.checkin_date).toLocaleDateString("sv-SE")
                  : "—";
              default:
                return (d as any)[c.key] ?? "—";
            }
          })
      ),
      styles: { fontSize: 9 },
      headStyles: { fillColor: [46, 125, 50] }, // grön
    });

    // liten summering
    const endY = (doc as any).lastAutoTable.finalY + 8;
    const total = sorted.length;
    const inCount = sorted.filter((d) => d.checked_in).length;
    const plannedIn = sorted.filter(
      (d) => isToday(d.checkin_date) || scheduleSuggestToday(d)
    ).length;
    const plannedOut = sorted.filter(
      (d) =>
        d.checkout_date &&
        (isToday(d.checkout_date) || isTomorrow(d.checkout_date))
    ).length;

    doc.setFontSize(11);
    doc.text(`Totalt: ${total}`, 14, endY);
    doc.text(`Incheckade: ${inCount}`, 14, endY + 6);
    doc.text(`Planerade in: ${plannedIn}`, 14, endY + 12);
    doc.text(`Planerade ut (idag/imorgon): ${plannedOut}`, 14, endY + 18);

    doc.save(`dagens-${today.toISOString().slice(0, 10)}.pdf`);
  }

  async function exportJPG() {
    const container = document.getElementById("dagens-table");
    if (!container) return alert("Ingen tabell hittad.");
    const canvas = await html2canvas(container, {
      scale: 2,
      backgroundColor: "#fff",
    });
    const link = document.createElement("a");
    link.href = canvas.toDataURL("image/jpeg", 1.0);
    link.download = `dagens-${new Date().toISOString().slice(0, 10)}.jpg`;
    link.click();
  }

  /* ===== UI helpers ===== */
  function statusCell(d: Dog) {
    if (d.checked_in)
      return (
        <span className="px-2 py-1 rounded-full text-xs bg-green-600 text-white">
          Incheckad
        </span>
      );
    if (isToday(d.checkin_date))
      return (
        <span className="px-2 py-1 rounded-full text-xs bg-yellow-500 text-white">
          Planerad in
        </span>
      );
    if (
      d.checkout_date &&
      (isToday(d.checkout_date) || isTomorrow(d.checkout_date))
    )
      return (
        <span className="px-2 py-1 rounded-full text-xs bg-blue-600 text-white">
          Planerad ut
        </span>
      );
    if (scheduleSuggestToday(d))
      return (
        <span className="px-2 py-1 rounded-full text-xs bg-emerald-100 text-emerald-700">
          Schema idag
        </span>
      );
    return (
      <span className="px-2 py-1 rounded-full text-xs bg-gray-200 text-gray-700">
        —
      </span>
    );
  }

  function scheduleSuggestToday(d: Dog) {
    const wd = svWeekday();
    const days = (d.days ?? "").split(",").map((x) => x.trim());
    return days.includes(wd);
  }

  /* =========================
   * Render
   * ========================= */
  return (
    <main className="max-w-7xl mx-auto px-4 md:px-6 py-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-3 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-[#2c7a4c]">Dagens översikt</h1>
          <p className="text-sm text-gray-600">
            Se dagens hundar, planerade in-/utcheckningar och anteckningar.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => setShowModal(true)}
            className="bg-[#2c7a4c] hover:bg-green-700 text-white px-4 py-2 rounded-lg text-sm"
          >
            + Ny hund
          </button>
          <button
            onClick={exportPDF}
            className="border px-3 py-2 rounded-lg text-sm hover:bg-gray-50"
          >
            📄 PDF
          </button>
          <button
            onClick={exportJPG}
            className="border px-3 py-2 rounded-lg text-sm hover:bg-gray-50"
          >
            🖼 JPG
          </button>
        </div>
      </div>

      {/* Filterrad */}
      <div className="bg-white border rounded-xl p-3 md:p-4 shadow-sm mb-4">
        <div className="flex flex-wrap items-center gap-2">
          <input
            placeholder="Sök namn, ras, ägare, abonnemang…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="border rounded-lg px-3 py-2 w-full md:w-72"
          />

          <div className="flex items-center gap-2">
            <label className="text-sm text-gray-600">Månad:</label>
            <input
              type="month"
              value={monthFilter}
              onChange={(e) => setMonthFilter(e.target.value)}
              className="border rounded-lg px-2 py-1"
            />
          </div>

          <select
            value={filterSub}
            onChange={(e) => setFilterSub(e.target.value as any)}
            className="border rounded-lg px-3 py-2 text-sm bg-white"
          >
            {SUB_OPTIONS.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>

          <select
            value={filterRoom}
            onChange={(e) => setFilterRoom(e.target.value)}
            className="border rounded-lg px-3 py-2 text-sm bg-white"
          >
            <option>Alla</option>
            {rooms.map((r) => (
              <option key={r.id} value={r.name ?? "Ej tilldelad"}>
                {r.name ?? "Ej tilldelad"}
              </option>
            ))}
          </select>

          <select
            value={filterDay}
            onChange={(e) => setFilterDay(e.target.value as any)}
            className="border rounded-lg px-3 py-2 text-sm bg-white"
          >
            {DAY_OPTIONS.map((d) => (
              <option key={d} value={d}>
                {d}
              </option>
            ))}
          </select>

          {/* Kolumnmeny */}
          <details className="ml-auto">
            <summary className="cursor-pointer select-none text-sm border rounded-lg px-3 py-1.5 bg-gray-50 hover:bg-gray-100">
              ⚙ Kolumner
            </summary>
            <div className="absolute z-10 mt-2 w-64 bg-white border rounded-lg shadow-lg p-2 text-sm max-h-64 overflow-y-auto">
              {columns.map((c) => (
                <label key={c.key} className="flex items-center gap-2 py-0.5">
                  <input
                    type="checkbox"
                    checked={c.visible}
                    onChange={() => toggleColumn(c.key)}
                  />
                  {c.label}
                </label>
              ))}
            </div>
          </details>
        </div>
      </div>

      {/* Tabell */}
      <div
        id="dagens-table"
        className="overflow-x-auto bg-white rounded-xl shadow-sm border"
      >
        <table className="min-w-full text-sm">
          <thead style={{ background: PRIMARY, color: "#fff" }}>
            <tr>
              {columns
                .filter((c) => c.visible)
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
                    className="text-left px-3 py-2 font-semibold cursor-pointer select-none"
                  >
                    {c.label} {sortKey === c.key ? (sortAsc ? "▲" : "▼") : ""}
                  </th>
                ))}
              <th className="px-3 py-2 text-left font-semibold">Åtgärd</th>
            </tr>
          </thead>

          <tbody>
            {loading ? (
              <tr>
                <td
                  colSpan={columns.filter((c) => c.visible).length + 1}
                  className="p-5 text-center text-gray-500"
                >
                  Hämtar hundar…
                </td>
              </tr>
            ) : sorted.length === 0 ? (
              <tr>
                <td
                  colSpan={columns.filter((c) => c.visible).length + 1}
                  className="p-5 text-center text-gray-500"
                >
                  Inga hundar hittades.
                </td>
              </tr>
            ) : (
              sorted.map((d) => {
                const rowClass = d.checked_in
                  ? "bg-green-50 hover:bg-green-100"
                  : isToday(d.checkin_date)
                  ? "bg-yellow-50 hover:bg-yellow-100"
                  : d.checkout_date &&
                    (isToday(d.checkout_date) || isTomorrow(d.checkout_date))
                  ? "bg-blue-50 hover:bg-blue-100"
                  : scheduleSuggestToday(d)
                  ? "bg-emerald-50 hover:bg-emerald-100"
                  : "hover:bg-gray-50";

                return (
                  <tr key={d.id} className={`border-t ${rowClass}`}>
                    {columns
                      .filter((c) => c.visible)
                      .map((c) => {
                        let value: React.ReactNode = "—";
                        switch (c.key) {
                          case "name":
                            value = (
                              <span className="font-medium text-[#2c7a4c]">
                                {d.name ?? "—"}
                              </span>
                            );
                            break;
                          case "room":
                            value = d.room?.name ?? "Ej tilldelad";
                            break;
                          case "subscription":
                            value = (
                              <span
                                className={`px-2 py-1 rounded-full text-xs font-semibold ${getSubscriptionBadge(
                                  d.subscription
                                )}`}
                              >
                                {d.subscription ?? "—"}
                              </span>
                            );
                            break;
                          case "owner_name":
                            value = d.owner?.full_name ?? "—";
                            break;
                          case "days":
                            value = d.days
                              ? d.days.split(",").map((x) => (
                                  <span
                                    key={x}
                                    className="inline-block bg-gray-100 text-gray-700 rounded-full px-2 py-0.5 mr-1 text-xs"
                                  >
                                    {x.slice(0, 2).toUpperCase()}
                                  </span>
                                ))
                              : "—";
                            break;
                          case "status":
                            value = statusCell(d);
                            break;
                          case "notes":
                            value = (
                              <input
                                type="text"
                                defaultValue={d.note ?? d.notes ?? ""}
                                onBlur={(e) => updateNote(d, e.target.value)}
                                className="border rounded px-2 py-1 w-56"
                                placeholder="Anteckning…"
                              />
                            );
                            break;
                          case "next_inout":
                            value = d.checkout_date
                              ? new Date(d.checkout_date).toLocaleDateString(
                                  "sv-SE"
                                )
                              : d.checkin_date
                              ? new Date(d.checkin_date).toLocaleDateString(
                                  "sv-SE"
                                )
                              : "—";
                            break;
                          default:
                            value = "—";
                        }
                        return (
                          <td key={c.key} className="px-3 py-2 align-top">
                            {value}
                          </td>
                        );
                      })}
                    <td className="px-3 py-2">
                      <button
                        onClick={() => toggleCheckIn(d)}
                        className={`px-3 py-1 rounded text-sm font-semibold ${
                          d.checked_in
                            ? "bg-green-600 text-white hover:bg-green-700"
                            : "bg-gray-300 text-gray-800 hover:bg-gray-400"
                        }`}
                      >
                        {d.checked_in ? "Incheckad" : "Utcheckad"}
                      </button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Modal: ny hund */}
      {showModal && (
        <EditDogModal
          open={showModal}
          onCloseAction={() => setShowModal(false)}
          onSavedAction={async () => {
            await loadDogs();
            setShowModal(false);
          }}
        />
      )}
    </main>
  );
}
