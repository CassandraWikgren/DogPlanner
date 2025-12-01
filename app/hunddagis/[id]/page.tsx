"use client";

/**
 * Hundprofil-sida (Hunddagis/[id])
 * - Hämtar hundens data med fulla relationer från Supabase
 * - Realtid för journal & extra_service
 * - PDF / JPG export
 * - Felsökningssystem (logDebug) med färgkodade etiketter & felkoder
 * - Accordion längst ned för felsökningslogg
 * - Layouten identisk med tidigare version (flikar: Översikt, Ägare, Hälsa, Tjänster, Journal)
 */

import React, { useEffect, useState, useCallback } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import html2canvas from "html2canvas";
import {
  Accordion,
  AccordionItem,
  AccordionTrigger,
  AccordionContent,
} from "@/components/ui/accordion";

/* ======================================================
 * TYPER
 * ====================================================== */

type Owner = {
  id: string;
  full_name: string | null;
  phone: string | null;
  email: string | null;
  customer_number?: number | null;
  contact_person_2?: string | null;
  contact_phone_2?: string | null;
};

type Room = { id: string; name: string | null };

type ExtraService = {
  id: string;
  dogs_id: string;
  service_type: string | null;
  quantity: number | null;
  price: number | null;
  notes: string | null;
  performed_at_date: string | null;
};

type Journal = { id: string; text: string; created_at: string };

type Dog = {
  id: string;
  name: string | null;
  breed: string | null;
  birth: string | null;
  heightcm: number | null;
  subscription: string | null;
  startdate: string | null;
  enddate: string | null;
  days: string | null;
  room_id: string | null;
  owner_id: string | null;
  vaccdhp: string | null;
  vaccpi: string | null;
  photo_url: string | null;
  events: any;
  owners?: Owner | null;
  rooms?: Room | null;
  orgs?: { id: string; name: string | null } | null;
  extra_service?: ExtraService[];
  dog_journal?: Journal[];
};

/* ======================================================
 * FÄRGPALETT & FELKODER
 * ====================================================== */

const PRIMARY_GREEN = "#2c7a4c";
const ERROR_CODES = {
  DB_FETCH: "[ERR-1001]",
  REALTIME: "[ERR-3001]",
  PDF_EXPORT: "[ERR-2001]",
  JPG_EXPORT: "[ERR-2002]",
  UPDATE: "[ERR-4001]",
  UNKNOWN: "[ERR-5001]",
};

/* ======================================================
 * logDebug() – FELHANTERING & LOGGNING
 * ====================================================== */

/**
 * logDebug sparar både i localStorage och i state,
 * och visar färgkodad typ (🟢, 🟠, 🔴).
 */
function useDebugLog() {
  const [logs, setLogs] = useState<any[]>([]);

  function logDebug(
    type: "info" | "success" | "error",
    message: string,
    details?: any,
    code?: string
  ) {
    const time = new Date().toLocaleTimeString("sv-SE");
    const symbol = type === "success" ? "🟢" : type === "error" ? "🔴" : "🟠";
    const full = `${symbol} ${code ?? ""} ${message}`;
    console[type === "error" ? "error" : "log"](full, details || "");
    const entry = { time, type, message: full, details };

    try {
      const raw = localStorage.getItem("debugLogs");
      let existing: any[] = [];

      if (raw) {
        try {
          existing = JSON.parse(raw);
          if (!Array.isArray(existing)) existing = [];
        } catch (parseError) {
          console.warn(
            "[ERR-3005] Korrupt debugLogs, återställer:",
            parseError
          );
          existing = [];
        }
      }

      const updated = [entry, ...existing].slice(0, 100);
      localStorage.setItem("debugLogs", JSON.stringify(updated));
      setLogs(updated);
    } catch (error) {
      console.error("[ERR-3006] localStorage fel:", error);
      setLogs([entry]); // Endast i minnet
    }
  }

  return { logs, logDebug };
}

/* ======================================================
 * HUVUDFUNKTION
 * ====================================================== */

export default function DogProfilePage() {
  const supabase = createClient();

  const { id } = useParams();

  // State
  const [dog, setDog] = useState<Dog | null>(null);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState<string | null>(null);
  const [tab, setTab] = useState("overview");
  const { logs, logDebug } = useDebugLog();

  /* ======================================================
   * LADDA HUNDENS DATA (Supabase)
   * ====================================================== */
  const loadDog = useCallback(async () => {
    try {
      setLoading(true);
      logDebug("info", "Hämtar hundprofil från Supabase...");

      const { data, error } = await supabase
        .from("dogs")
        .select(
          `
        id, name, breed, birth, heightcm, subscription, startdate, enddate,
        days, room_id, owner_id, vaccdhp, vaccpi, photo_url, events,
        owners(id, full_name, phone, email, customer_number, contact_person_2, contact_phone_2),
        rooms(id, name),
        orgs(id, name),
        extra_service(id, dogs_id, service_type, quantity, price, notes, performed_at_date),
        dog_journal(id, text, created_at)
      `
        )
        .eq("id", id)
        .maybeSingle();

      if (error) throw error;

      if (!data) {
        logDebug(
          "error",
          "Ingen hund hittades i databasen.",
          null,
          ERROR_CODES.DB_FETCH
        );
        setMessage("❌ Kunde inte hitta hunden.");
        return;
      }

      // 🔹 Normalisera relationer
      const normalized = {
        ...data,
        owners: Array.isArray((data as any).owners)
          ? (data as any).owners[0]
          : (data as any).owners,
        rooms: Array.isArray((data as any).rooms)
          ? (data as any).rooms[0]
          : (data as any).rooms,
        orgs: Array.isArray((data as any).orgs)
          ? (data as any).orgs[0]
          : (data as any).orgs,
      };

      setDog(normalized as Dog);
      logDebug("success", "Hundprofil laddad.", normalized);
    } catch (err) {
      logDebug(
        "error",
        "Fel vid hämtning av hundprofil.",
        err,
        ERROR_CODES.DB_FETCH
      );
      setMessage("⚠️ Fel vid laddning av hundprofil.");
    } finally {
      setLoading(false);
    }
  }, [supabase, id, logDebug]);

  /* ======================================================
   * REALTID – dog_journal & extra_service
   * ====================================================== */
  useEffect(() => {
    loadDog();

    // Realtid för journal
    const journalChannel = supabase
      .channel("dog_journal_changes")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "dog_journal",
          filter: `dog_id=eq.${id}`,
        },
        () => {
          logDebug(
            "info",
            "Realtid: journal uppdaterad.",
            null,
            ERROR_CODES.REALTIME
          );
          loadDog();
        }
      )
      .subscribe();

    // Realtid för extra tjänster
    const serviceChannel = supabase
      .channel("extra_service_changes")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "extra_service",
          filter: `dogs_id=eq.${id}`,
        },
        () => {
          logDebug(
            "info",
            "Realtid: extra tjänst uppdaterad.",
            null,
            ERROR_CODES.REALTIME
          );
          loadDog();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(journalChannel);
      supabase.removeChannel(serviceChannel);
    };
  }, [id, supabase, loadDog, logDebug]);
  /* ======================================================
   * FEEDBACK-HJÄLPFUNKTION
   * ====================================================== */
  function feedback(ok: boolean, text?: string) {
    setMessage(
      (ok ? "✅ " : "❌ ") + (text || (ok ? "Sparat" : "Ett fel uppstod"))
    );
    setTimeout(() => setMessage(null), 3000);
  }

  /* ======================================================
   * EXPORTER – PDF & JPG
   * ====================================================== */
  async function exportPDF() {
    try {
      if (!dog) return;
      logDebug("info", "Genererar PDF...", null, ERROR_CODES.PDF_EXPORT);

      const doc = new jsPDF();
      doc.setFontSize(16);
      doc.text(`Hundprofil – ${dog.name}`, 14, 18);

      // Om hunden har bild i Supabase Storage
      if (dog.photo_url) {
        try {
          const img = await fetch(dog.photo_url)
            .then((r) => r.blob())
            .then(
              (b) =>
                new Promise((resolve) => {
                  const reader = new FileReader();
                  reader.onload = () => resolve(reader.result as string);
                  reader.readAsDataURL(b);
                })
            );
          doc.addImage(img as string, "JPEG", 150, 10, 40, 40);
        } catch (e) {
          logDebug(
            "error",
            "Kunde inte hämta bild till PDF.",
            e,
            ERROR_CODES.PDF_EXPORT
          );
        }
      }

      // Tabell med hunddata
      autoTable(doc, {
        startY: 55,
        head: [["Fält", "Värde"]],
        body: [
          ["Namn", dog.name ?? "—"],
          ["Ras", dog.breed ?? "—"],
          ["Födelsedatum", dog.birth ?? "—"],
          ["Mankhöjd", dog.heightcm ? `${dog.heightcm} cm` : "—"],
          ["Abonnemang", dog.subscription ?? "—"],
          ["Rum", dog.rooms?.name ?? "—"],
          ["Ägare", dog.owners?.full_name ?? "—"],
          ["Telefon", dog.owners?.phone ?? "—"],
          ["E-post", dog.owners?.email ?? "—"],
        ],
      });

      doc.save(`${dog.name}_profil.pdf`);
      logDebug(
        "success",
        "PDF genererad och sparad.",
        null,
        ERROR_CODES.PDF_EXPORT
      );
    } catch (e) {
      logDebug("error", "Fel vid PDF-export.", e, ERROR_CODES.PDF_EXPORT);
      feedback(false, `[${ERROR_CODES.PDF_EXPORT}] Kunde inte skapa PDF.`);
    }
  }

  async function exportJPG() {
    try {
      const container = document.getElementById("profile-content");
      if (!container) return;
      logDebug("info", "Skapar JPG-export...", null, ERROR_CODES.JPG_EXPORT);
      const canvas = await html2canvas(container, {
        scale: 2,
        backgroundColor: "#fff",
      });
      const link = document.createElement("a");
      link.href = canvas.toDataURL("image/jpeg", 1.0);
      link.download = `${dog?.name ?? "hund"}_profil.jpg`;
      link.click();
      logDebug("success", "JPG-bild exporterad.", null, ERROR_CODES.JPG_EXPORT);
    } catch (e) {
      logDebug("error", "Fel vid JPG-export.", e, ERROR_CODES.JPG_EXPORT);
      feedback(false, `[${ERROR_CODES.JPG_EXPORT}] Kunde inte skapa JPG.`);
    }
  }

  /* ======================================================
   * LAYOUT
   * ====================================================== */

  if (loading)
    return (
      <div className="p-8 text-center text-gray-500">
        ⏳ Laddar hundens profil...
      </div>
    );

  if (!dog)
    return (
      <div className="p-8 text-center text-gray-500">
        ❌ Kunde inte hitta hunden.
      </div>
    );

  return (
    <main className="max-w-6xl mx-auto px-4 py-6" id="profile-content">
      {/* HEADER */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          {dog.photo_url ? (
            <img
              src={dog.photo_url}
              alt="Hundfoto"
              className="h-24 w-24 rounded-full object-cover border"
            />
          ) : (
            <div className="h-24 w-24 rounded-full border flex items-center justify-center text-gray-400">
              Ingen bild
            </div>
          )}
          <div>
            <h1 className="text-3xl font-bold text-[#2c7a4c]">
              {dog.name ?? "Hund"}
            </h1>
            <p className="text-sm text-gray-600">
              {dog.breed ?? "Ras saknas"} •{" "}
              {dog.subscription ?? "Abonnemang saknas"}
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <Link
            href="/hunddagis"
            className="border px-3 py-2 rounded-lg text-sm hover:bg-gray-50"
          >
            ← Tillbaka
          </Link>
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

      {/* FEEDBACK */}
      {message && (
        <div
          className={`mb-4 rounded-lg px-4 py-2 ${
            message.startsWith("✅")
              ? "bg-green-50 text-green-700 border border-green-200"
              : "bg-red-50 text-red-700 border border-red-200"
          }`}
        >
          {message}
        </div>
      )}

      {/* FLIKAR */}
      <div className="flex flex-wrap gap-2 mb-6 border-b pb-2">
        {[
          ["overview", "Översikt"],
          ["owner", "Ägare"],
          ["health", "Hälsa"],
          ["services", "Tjänster"],
          ["journal", "Journal"],
        ].map(([key, label]) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            className={`px-4 py-2 rounded-t-lg ${
              tab === key
                ? "bg-[#2c7a4c] text-white"
                : "bg-gray-100 hover:bg-gray-200"
            }`}
          >
            {label}
          </button>
        ))}
      </div>
      {/* =======================
          FLIK-INNEHÅLL
      ======================= */}

      {/* ÖVERSIKT */}
      {tab === "overview" && (
        <div className="bg-white p-6 rounded-xl shadow-sm border">
          <h2 className="text-lg font-semibold text-[#2c7a4c] mb-4">
            Översikt
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <p>
              <strong>Ras:</strong> {dog.breed ?? "—"}
            </p>
            <p>
              <strong>Födelsedatum:</strong>{" "}
              {dog.birth
                ? new Date(dog.birth).toLocaleDateString("sv-SE")
                : "—"}
            </p>
            <p>
              <strong>Mankhöjd:</strong> {dog.heightcm ?? "—"} cm
            </p>
            <p>
              <strong>Abonnemang:</strong>{" "}
              <span
                className={`px-2 py-1 rounded text-xs ${getColorForSubscription(
                  dog.subscription
                )}`}
              >
                {dog.subscription ?? "—"}
              </span>
            </p>
            <p>
              <strong>Rum:</strong> {dog.rooms?.name ?? "—"}
            </p>
            <p>
              <strong>Veckodagar:</strong>{" "}
              {dog.days ? dog.days.split(",").join(", ") : "—"}
            </p>
            <p>
              <strong>Startdatum:</strong>{" "}
              {dog.startdate
                ? new Date(dog.startdate).toLocaleDateString("sv-SE")
                : "—"}
            </p>
            <p>
              <strong>Slutdatum:</strong>{" "}
              {dog.enddate
                ? new Date(dog.enddate).toLocaleDateString("sv-SE")
                : "—"}
            </p>
          </div>

          {/* Personalanteckning */}
          <div className="mt-6">
            <label className="text-sm text-[#2c7a4c] font-semibold">
              Anteckning (personal)
            </label>
            <textarea
              className="w-full border rounded-lg px-3 py-2 mt-1 min-h-[80px]"
              placeholder="t.ex. Luna har lite ont i tassen idag"
              value={dog.events?.staff_note || ""}
              onChange={(e) =>
                setDog((prev) =>
                  prev
                    ? {
                        ...prev,
                        events: { ...prev.events, staff_note: e.target.value },
                      }
                    : prev
                )
              }
            />
            <button
              onClick={async () => {
                try {
                  const { error } = await supabase
                    .from("dogs")
                    .update({ events: dog.events })
                    .eq("id", dog.id);
                  if (error) throw error;
                  logDebug(
                    "success",
                    "Anteckning sparad.",
                    null,
                    ERROR_CODES.UPDATE
                  );
                  feedback(true, "Anteckning sparad.");
                } catch (err) {
                  logDebug(
                    "error",
                    "Fel vid sparning av anteckning.",
                    err,
                    ERROR_CODES.UPDATE
                  );
                  feedback(false, "Fel vid sparning av anteckning.");
                }
              }}
              className="mt-2 bg-[#2c7a4c] text-white px-4 py-2 rounded hover:bg-green-700 text-sm"
            >
              💾 Spara anteckning
            </button>
          </div>
        </div>
      )}

      {/* ÄGARE */}
      {tab === "owner" && dog.owners && (
        <div className="bg-white p-6 rounded-xl shadow-sm border grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
          <h2 className="col-span-2 text-lg font-semibold text-[#2c7a4c] mb-2">
            Ägare
          </h2>
          <p>
            <strong>Namn:</strong> {dog.owners.full_name ?? "—"}
          </p>
          <p>
            <strong>Telefon:</strong> {dog.owners.phone ?? "—"}
          </p>
          <p>
            <strong>E-post:</strong> {dog.owners.email ?? "—"}
          </p>
          <p>
            <strong>Kundnummer:</strong> {dog.owners.customer_number ?? "—"}
          </p>
          {dog.owners.contact_person_2 && (
            <>
              <p className="col-span-2 mt-4 text-[#2c7a4c] font-semibold">
                Kontaktperson 2
              </p>
              <p>{dog.owners.contact_person_2}</p>
              <p>{dog.owners.contact_phone_2 ?? "—"}</p>
            </>
          )}
        </div>
      )}

      {/* HÄLSA */}
      {tab === "health" && (
        <div className="bg-white p-6 rounded-xl shadow-sm border text-sm">
          <h2 className="text-lg font-semibold text-[#2c7a4c] mb-4">Hälsa</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <p>
              <strong>Vaccination DHP:</strong>{" "}
              {dog.vaccdhp
                ? new Date(dog.vaccdhp).toLocaleDateString("sv-SE")
                : "—"}
            </p>
            <p>
              <strong>Vaccination PI:</strong>{" "}
              {dog.vaccpi
                ? new Date(dog.vaccpi).toLocaleDateString("sv-SE")
                : "—"}
            </p>
            <p>
              <strong>Försäkringsbolag:</strong>{" "}
              {dog.events?.insurance_company ?? "—"}
            </p>
            <p>
              <strong>Försäkringsnummer:</strong>{" "}
              {dog.events?.insurance_number ?? "—"}
            </p>
          </div>
          <div className="mt-4">
            <strong>Vård / Medicin:</strong>
            <p className="whitespace-pre-wrap">
              {dog.events?.care_notes ?? "—"}
            </p>
          </div>
        </div>
      )}

      {/* TJÄNSTER */}
      {tab === "services" && (
        <div className="bg-white p-6 rounded-xl shadow-sm border text-sm">
          <h2 className="text-lg font-semibold text-[#2c7a4c] mb-4">
            Tilläggstjänster / Abonnemang
          </h2>
          {!dog.extra_service || dog.extra_service.length === 0 ? (
            <p>Inga registrerade tilläggstjänster.</p>
          ) : (
            <table className="min-w-full border text-sm">
              <thead className="bg-gray-100 text-gray-700">
                <tr>
                  <th className="px-3 py-1 text-left">Typ</th>
                  <th className="px-3 py-1 text-left">Antal</th>
                  <th className="px-3 py-1 text-left">Datum</th>
                  <th className="px-3 py-1 text-left">Notering</th>
                </tr>
              </thead>
              <tbody>
                {dog.extra_service.map((s) => (
                  <tr key={s.id} className="border-t">
                    <td className="px-3 py-1">{s.service_type ?? "—"}</td>
                    <td className="px-3 py-1">{s.quantity ?? "—"}</td>
                    <td className="px-3 py-1">
                      {s.performed_at_date
                        ? new Date(s.performed_at_date).toLocaleDateString(
                            "sv-SE"
                          )
                        : "—"}
                    </td>
                    <td className="px-3 py-1">{s.notes ?? "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {/* JOURNAL */}
      {tab === "journal" && (
        <div className="bg-white p-6 rounded-xl shadow-sm border text-sm">
          <h2 className="text-lg font-semibold text-[#2c7a4c] mb-4">
            Journal / Kommentarer
          </h2>
          <JournalSection
            dogId={dog.id}
            initial={dog.dog_journal ?? []}
            supabase={supabase}
            logDebug={logDebug}
          />
        </div>
      )}

      {/* FEL-OCH FELSÖKNINGSLOGG */}
      <div className="mt-10">
        <Accordion type="single" collapsible>
          <AccordionItem value="debug">
            <AccordionTrigger>🧰 Visa felsökningslogg</AccordionTrigger>
            <AccordionContent>
              {logs.length === 0 && (
                <p className="text-sm text-gray-500">Inga loggar ännu.</p>
              )}
              <div className="space-y-1 text-xs font-mono">
                {logs.map((l, i) => (
                  <div key={i} className="border-b pb-1">
                    <span className="text-gray-400">[{l.time}]</span>{" "}
                    {l.message}
                  </div>
                ))}
              </div>
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      </div>
    </main>
  );
}

/* ======================================================
 * DELKOMPONENT – Journal
 * ====================================================== */
function JournalSection({
  dogId,
  initial,
  supabase,
  logDebug,
}: {
  dogId: string;
  initial: Journal[];
  supabase: any;
  logDebug: Function;
}) {
  const [entries, setEntries] = useState(initial);
  const [text, setText] = useState("");
  const [saving, setSaving] = useState(false);

  async function addEntry() {
    if (!text.trim()) return;
    try {
      setSaving(true);
      const { error } = await supabase
        .from("dog_journal")
        .insert([{ dog_id: dogId, text }]);
      if (error) throw error;
      const { data } = await supabase
        .from("dog_journal")
        .select("*")
        .eq("dog_id", dogId)
        .order("created_at", { ascending: false });
      setEntries(data ?? []);
      setText("");
      logDebug("success", "Journalpost tillagd.", null, "[OK-JOURNAL]");
    } catch (e) {
      logDebug("error", "Fel vid tillägg i journal.", e, ERROR_CODES.UPDATE);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div>
      <textarea
        placeholder="Skriv anteckning..."
        className="w-full border rounded-lg px-3 py-2 mb-2 min-h-[80px]"
        value={text}
        onChange={(e) => setText(e.target.value)}
      />
      <button
        onClick={addEntry}
        disabled={saving}
        className="bg-[#2c7a4c] text-white px-4 py-2 rounded hover:bg-green-700 text-sm disabled:opacity-50"
      >
        💬 {saving ? "Sparar..." : "Lägg till anteckning"}
      </button>

      <ul className="mt-4 space-y-2">
        {entries.map((j) => (
          <li
            key={j.id}
            className="border rounded-lg p-2 bg-gray-50 text-gray-800"
          >
            <p className="text-xs text-gray-500 mb-1">
              {new Date(j.created_at).toLocaleString("sv-SE")}
            </p>
            <p>{j.text}</p>
          </li>
        ))}
      </ul>
    </div>
  );
}

/* ======================================================
 * HJÄLPFUNKTIONER
 * ====================================================== */
function getColorForSubscription(type?: string | null) {
  if (!type) return "bg-gray-100 text-gray-700";
  const t = type.toLowerCase();
  if (t.includes("heltid")) return "bg-green-100 text-green-800";
  if (t.includes("deltid")) return "bg-blue-100 text-blue-800";
  if (t.includes("dag")) return "bg-yellow-100 text-yellow-800";
  return "bg-gray-100 text-gray-700";
}
