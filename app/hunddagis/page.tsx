"use client";

import React, { useEffect, useState, useCallback, useMemo } from "react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/app/context/AuthContext";
import { Download, Plus, Settings2, RefreshCcw } from "lucide-react";
import EditDogModal from "@/components/EditDogModal";
import Link from "next/link";
import {
  Accordion,
  AccordionItem,
  AccordionTrigger,
  AccordionContent,
} from "@/components/ui/accordion";

// Felkoder enligt systemet
const ERROR_CODES = {
  DATABASE_CONNECTION: "[ERR-1001]",
  PDF_EXPORT: "[ERR-2001]",
  REALTIME: "[ERR-3001]",
  VALIDATION: "[ERR-4001]",
} as const;

/* ===========================
 * Typer (Uppdaterade för Supabase-struktur med små bokstäver)
 * =========================== */
type Owner = {
  id: string;
  full_name: string | null;
  phone: string | null;
  email: string | null;
  customer_number: string | null; // Ändrat från number till string för konsistens
  address?: string | null;
  notes?: string | null;
  org_id: string;
  created_at: string;
};

type Org = {
  id: string;
  name: string;
  org_number: string | null;
  email: string | null;
  phone: string | null;
  created_at: string;
};

type Dog = {
  id: string;
  name: string;
  breed: string | null;
  heightcm: number | null; // Behåller faktiska databaskolumnnamnet
  birth: string | null; // Behåller faktiska databaskolumnnamnet
  subscription: string | null;
  startdate: string | null; // Behåller faktiska databaskolumnnamnet
  enddate: string | null; // Behåller faktiska databaskolumnnamnet
  days: string | null;
  room_id: string | null;
  owner_id: string | null; // Korrekt relation: dogs.owner_id → owners.id
  org_id: string | null;
  vaccdhp: string | null; // Behåller faktiska databaskolumnnamnet
  vaccpi: string | null; // Behåller faktiska databaskolumnnamnet
  photo_url: string | null;
  events: any | null;
  checked_in?: boolean | null; // Lägg till för incheckning
  notes?: string | null;
  weight_kg?: number | null; // Lägg till för vikt
  created_at?: string | null;
  owners?: Owner | null;
};

type SortKey =
  | "name"
  | "breed"
  | "subscription"
  | "room_id"
  | "owner"
  | "startdate"
  | "enddate";

/* ===========================
 * Konstanter
 * =========================== */
const DEFAULT_COLUMNS = [
  "name",
  "breed",
  "owner",
  "phone",
  "subscription",
  "room_id",
  "days",
];

const COLUMN_LABELS: Record<string, string> = {
  name: "Hund",
  breed: "Ras",
  owner: "Ägare",
  phone: "Telefon",
  subscription: "Abonnemang",
  room_id: "Rum",
  days: "Veckodagar",
  startdate: "Start",
  enddate: "Slut",
};

/* ===========================
 * Sida
 * =========================== */
export default function HunddagisPage() {
  const { user, loading: authLoading } = useAuth();

  // State
  const [dogs, setDogs] = useState<Dog[]>([]);
  const [loading, setLoading] = useState(true);
  const [errMsg, setErrMsg] = useState<string | null>(null);
  const [debugLogs, setDebugLogs] = useState<any[]>([]);
  const [showModal, setShowModal] = useState(false);

  // Filter/sort
  const [q, setQ] = useState("");
  const [subFilter, setSubFilter] = useState("");
  const [month, setMonth] = useState("alla");
  const [sortKey, setSortKey] = useState<SortKey>("name");
  const [sortAsc, setSortAsc] = useState(true);

  // Hydration-säker state
  const [mounted, setMounted] = useState(false);

  // Kolumnval (lokalt sparat)
  const [columns, setColumns] = useState<string[]>(DEFAULT_COLUMNS);
  const [showColsMenu, setShowColsMenu] = useState(false);

  // Timeout för authLoading om den fastnar
  const [authTimeout, setAuthTimeout] = useState(false);
  useEffect(() => {
    const timer = setTimeout(() => {
      if (authLoading) {
        console.warn("Auth loading timeout - forcing continue");
        setAuthTimeout(true);
      }
    }, 5000); // 5 sekunder
    return () => clearTimeout(timer);
  }, [authLoading]);

  /* ===========================
   * Felsökningslogg
   * =========================== */
  function logDebug(
    type: "info" | "success" | "error",
    message: string,
    details?: any
  ) {
    console.log(`[Hunddagis] ${message}`, details || "");
    const newLog = { time: new Date().toISOString(), type, message, details };

    // Bara spara till localStorage efter mount för att undvika hydration error
    if (!mounted) {
      setDebugLogs((prev) => [newLog, ...prev].slice(0, 100));
      return;
    }

    try {
      // Säker läsning av localStorage
      const raw = localStorage.getItem("debugLogs");
      let existing: any[] = [];

      if (raw) {
        try {
          existing = JSON.parse(raw);
          // Kontrollera att det är en array
          if (!Array.isArray(existing)) {
            existing = [];
          }
        } catch (parseError) {
          console.warn(
            "[ERR-3001] Korrupt debug log data, återställer:",
            parseError
          );
          existing = [];
        }
      }

      const updated = [newLog, ...existing].slice(0, 100);
      localStorage.setItem("debugLogs", JSON.stringify(updated));
      setDebugLogs(updated);
    } catch (error) {
      console.error("[ERR-3002] Fel vid sparande av debug logs:", error);
      // Fallback: spara bara den nya loggen
      try {
        localStorage.setItem("debugLogs", JSON.stringify([newLog]));
        setDebugLogs([newLog]);
      } catch (fallbackError) {
        console.error("[ERR-3003] Kritiskt localStorage-fel:", fallbackError);
        setDebugLogs([newLog]); // Endast i minnet
      }
    }
  }

  /* ===========================
   * Hämta data (Supabase)
   * =========================== */
  const loadDogs = useCallback(async () => {
    if (!user) return;

    setLoading(true);
    setErrMsg(null);
    try {
      const orgId = user?.user_metadata?.org_id || user?.id;
      logDebug("info", "Hämtar hundar…");
      const { data, error } = await (supabase as any)
        .from("dogs")
        .select(
          `
          id, name, breed, heightcm, birth, subscription, startdate, enddate,
          days, room_id, owner_id, org_id, vaccdhp, vaccpi, photo_url, events, created_at,
          owners(id, full_name, customer_number, phone, email)
        `
        )
        .eq("org_id", orgId)
        .order("name", { ascending: true });

      if (error) {
        console.error(
          `${ERROR_CODES.DATABASE_CONNECTION} Fel vid hämtning av hundar:`,
          error
        );
        setErrMsg(
          `${ERROR_CODES.DATABASE_CONNECTION} Kunde inte hämta hundar. ${
            error.message ?? "Okänt fel."
          }`
        );
        setDogs([]);
        return;
      }

      logDebug(
        "info",
        `Rå data från Supabase: ${data?.length || 0} poster`,
        data
      );

      const normalized = (data || []).map((d: any) => ({
        ...d,
        owners: Array.isArray(d.owners) ? d.owners[0] : d.owners ?? null,
      })) as Dog[];

      logDebug(
        "success",
        `Hundar laddade: ${normalized.length} st`,
        normalized
      );
      setDogs(normalized);
    } catch (e: any) {
      console.error(
        `${ERROR_CODES.DATABASE_CONNECTION} Oväntat fel vid hämtning:`,
        e
      );
      setErrMsg(
        `${ERROR_CODES.DATABASE_CONNECTION} ${e?.message ?? "Okänt fel"}`
      );
    } finally {
      setLoading(false);
    }
  }, [user]);

  /* ===========================
   * Hydration-säker initialisering
   * =========================== */
  useEffect(() => {
    setMounted(true);
    // Läs localStorage efter mount för att undvika hydration errors
    try {
      const raw = localStorage.getItem("dogplanner:hunddagis:columns");
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) {
          setColumns(parsed);
        }
      }
    } catch (error) {
      console.warn("[ERR-3004] Korrupt kolumndata, använder default:", error);
    }

    // Läs även debugLogs från localStorage
    try {
      const debugRaw = localStorage.getItem("debugLogs");
      if (debugRaw) {
        const parsed = JSON.parse(debugRaw);
        if (Array.isArray(parsed)) {
          setDebugLogs(parsed);
        }
      }
    } catch (error) {
      console.warn("[ERR-3005] Korrupt debug log data:", error);
    }
  }, []);

  /* ===========================
   * Realtidsuppdatering (optimerad)
   * =========================== */
  useEffect(() => {
    if (!user || authLoading) return;
    loadDogs();

    // Bara lyssna på real-time om sidan är aktiv
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        loadDogs(); // Uppdatera när sidan blir aktiv igen
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);

    const channel = supabase
      .channel("dog_changes")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "dogs" },
        () => {
          if (!document.hidden) {
            loadDogs(); // Bara uppdatera om sidan är aktiv
          }
        }
      )
      .subscribe();

    logDebug("info", "Realtidslyssning aktiv för hundar");

    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      supabase.removeChannel(channel);
    };
  }, [user, authLoading, loadDogs]);

  // Spara kolumnval (bara efter mount)
  useEffect(() => {
    if (mounted) {
      localStorage.setItem(
        "dogplanner:hunddagis:columns",
        JSON.stringify(columns)
      );
    }
  }, [columns, mounted]);

  /* ===========================
   * Filter/sort helpers (optimerade med useCallback)
   * =========================== */
  const passSearch = useCallback(
    (d: Dog) => {
      if (!q.trim()) return true;
      const hay = [
        d.name,
        d.breed,
        d.subscription,
        d.room_id,
        d.owners?.full_name,
        d.owners?.phone,
        d.owners?.email,
        d.days,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      return hay.includes(q.toLowerCase());
    },
    [q]
  );

  const passSubFilter = useCallback(
    (d: Dog) => {
      return !subFilter || d.subscription === subFilter;
    },
    [subFilter]
  );

  const passMonth = useCallback(
    (d: Dog) => {
      if (month === "alla") return true;
      const dateStr = d.startdate || d.created_at || "";
      if (!dateStr) return true;
      const mm = dateStr.slice(0, 7);
      return mm === month;
    },
    [month]
  );

  const sortDogs = useCallback(
    (a: Dog, b: Dog) => {
      const dir = sortAsc ? 1 : -1;
      const va =
        sortKey === "owner"
          ? (a.owners?.full_name || "").toLowerCase()
          : ((a as any)[sortKey] || "").toString().toLowerCase();
      const vb =
        sortKey === "owner"
          ? (b.owners?.full_name || "").toLowerCase()
          : ((b as any)[sortKey] || "").toString().toLowerCase();
      return va < vb ? -1 * dir : va > vb ? 1 * dir : 0;
    },
    [sortKey, sortAsc]
  );

  const viewDogs = useMemo(() => {
    return dogs
      .filter(passSearch)
      .filter(passSubFilter)
      .filter(passMonth)
      .sort(sortDogs);
  }, [dogs, q, subFilter, month, sortKey, sortAsc]);

  /* ===========================
   * Export PDF
   * =========================== */
  async function exportPDF() {
    try {
      logDebug("info", "Genererar PDF...");
      const { jsPDF } = await import("jspdf");
      const doc = new jsPDF();
      const title = `Hunddagis – ${new Date().toLocaleDateString("sv-SE")}`;
      doc.text(title, 14, 16);

      const cols = [
        "Hund",
        "Ägare",
        "Telefon",
        "Abonnemang",
        "Rum",
        "Veckodagar",
      ];
      const rows = viewDogs.map((d) => [
        d.name,
        d.owners?.full_name || "",
        d.owners?.phone || "",
        d.subscription || "",
        d.room_id || "",
        d.days || "",
      ]);

      let y = 24;
      doc.setFontSize(10);
      doc.text(cols.join("   |   "), 14, y);
      y += 6;
      rows.forEach((r) => {
        doc.text(r.join("   |   "), 14, y);
        y += 6;
      });

      doc.save("hunddagis.pdf");
      logDebug("success", "PDF skapad och sparad.");
    } catch (e: any) {
      logDebug("error", "Fel vid PDF-export", e);
      alert(`[ERR-4001] Kunde inte skapa PDF. ${e?.message ?? "Okänt fel"}`);
    }
  }

  /* ===========================
   * UI helpers
   * =========================== */
  function toggleColumn(c: string) {
    setColumns((prev) =>
      prev.includes(c) ? prev.filter((x) => x !== c) : [...prev, c]
    );
  }

  function headerCell(key: SortKey, label: string) {
    const active = sortKey === key;
    return (
      <th
        className={`py-2 px-3 text-left select-none ${
          active ? "underline" : ""
        } cursor-pointer`}
        onClick={() => {
          if (active) setSortAsc((s) => !s);
          else {
            setSortKey(key);
            setSortAsc(true);
          }
        }}
      >
        {label}
        {active ? (sortAsc ? " ▲" : " ▼") : ""}
      </th>
    );
  }

  function rowColor(d: Dog) {
    switch (d.subscription) {
      case "Heltid":
        return "bg-emerald-50";
      case "Deltid 3":
      case "Deltid 2":
        return "bg-blue-50";
      case "Dagshund":
        return "bg-orange-50";
      default:
        return "";
    }
  }

  async function handleSaved() {
    await loadDogs();
    setShowModal(false);
  }

  // DEBUG: Funktion för att ladda testdata
  async function loadTestData() {
    console.log("🚀 LOADTESTDATA STARTAR!");

    try {
      // Kolla användarstatus först
      const {
        data: { user },
      } = await supabase.auth.getUser();
      console.log("👤 Användare:", user?.email || "Ingen användare inloggad");

      if (!user) {
        alert("Du måste vara inloggad för att skapa testdata!");
        return;
      }

      alert("Skapar testdata...");
      logDebug("info", "Laddar komplett testdata...");

      // Först - skapa en organisation
      const { data: existingOrg } = await (supabase as any)
        .from("orgs")
        .select("*")
        .limit(1);

      let orgId = (existingOrg as any)?.[0]?.id;

      if (!orgId) {
        logDebug("info", "Skapar organisation...");
        const { data: newOrg, error: orgError } = await (supabase as any)
          .from("orgs")
          .insert({
            name: "Test Hunddagis AB",
            org_number: "556123-4567",
            email: "test@hunddagis.se",
            phone: "040-123456",
          })
          .select()
          .single();

        if (orgError) {
          console.log("❌ FEL vid skapande av organisation:", orgError);
          alert("Fel vid skapande av organisation: " + orgError.message);
          logDebug("error", "Fel vid skapande av organisation", orgError);
          return;
        }
        orgId = (newOrg as any).id;
        console.log("✅ Organisation skapad med ID:", orgId);
      }

      // Sedan - skapa owners
      console.log("🔄 Skapar owners...");
      const { data: existingOwners } = await (supabase as any)
        .from("owners")
        .select("*");
      console.log("Befintliga owners:", existingOwners);

      let owners = existingOwners;

      if (!owners || owners.length === 0) {
        logDebug("info", "Skapar ägare...");
        const testOwners = [
          {
            org_id: orgId,
            full_name: "Anna Andersson",
            email: "anna@example.com",
            phone: "070-1234567",
            customer_number: 1001,
          },
          {
            org_id: orgId,
            full_name: "Bert Berglund",
            email: "bert@example.com",
            phone: "070-2345678",
            customer_number: 1002,
          },
          {
            org_id: orgId,
            full_name: "Cecilia Carlsson",
            email: "cecilia@example.com",
            phone: "070-3456789",
            customer_number: 1003,
          },
        ];

        const { data: newOwners, error: ownersError } = await (supabase as any)
          .from("owners")
          .insert(testOwners)
          .select();

        if (ownersError) {
          logDebug("error", "Fel vid skapande av ägare", ownersError);
          return;
        }
        owners = newOwners;
        logDebug("success", `${owners?.length || 0} ägare skapade!`);
      }

      // Skapa testhundar
      const testDogs = [
        {
          name: "Bella",
          breed: "Golden Retriever",
          subscription: "Heltid",
          owner_id: (owners as any)[0].id,
          startdate: "2025-10-01",
          heightcm: 55,
        },
        {
          name: "Max",
          breed: "Border Collie",
          subscription: "Deltid 3",
          owner_id: (owners as any)[1]?.id || (owners as any)[0].id,
          startdate: "2025-10-01",
          heightcm: 50,
        },
        {
          name: "Charlie",
          breed: "Labrador",
          subscription: "Dagshund",
          owner_id: (owners as any)[2]?.id || (owners as any)[0].id,
          startdate: "2025-10-01",
          heightcm: 60,
        },
      ];

      const { data, error } = await (supabase as any)
        .from("dogs")
        .insert(testDogs)
        .select();

      if (error) {
        logDebug("error", "Fel vid skapande av testhundar", error);
      } else {
        logDebug("success", `${data?.length || 0} testhundar skapade!`);
        await loadDogs(); // Ladda om data
      }
    } catch (err: any) {
      logDebug("error", "Oväntat fel vid testdata-laddning", err);
    }
  }

  // DEMO: Snabb inloggning för testning
  async function demoLogin() {
    try {
      logDebug("info", "Försöker demo-inloggning...");

      // Skapa en demo-användare om den inte finns
      const demoEmail = "test@dogplanner.se";
      const demoPassword = "demo123456";

      // Försök logga in
      let { data: loginData, error: loginError } =
        await supabase.auth.signInWithPassword({
          email: demoEmail,
          password: demoPassword,
        });

      if (loginError && loginError.message === "Invalid login credentials") {
        logDebug("info", "Demo-användare finns inte, skapar ny...");

        // Skapa demo-användare
        const { data: signupData, error: signupError } =
          await supabase.auth.signUp({
            email: demoEmail,
            password: demoPassword,
          });

        if (signupError) {
          logDebug("error", "Kunde inte skapa demo-användare", signupError);
          return;
        }

        logDebug("success", "Demo-användare skapad!");

        // Försök logga in igen
        const { data: retryData, error: retryError } =
          await supabase.auth.signInWithPassword({
            email: demoEmail,
            password: demoPassword,
          });

        if (retryError) {
          logDebug(
            "error",
            "Kunde inte logga in med demo-användare",
            retryError
          );
          return;
        }

        loginData = retryData;
      }

      if (loginError && loginError.message !== "Invalid login credentials") {
        logDebug("error", "Inloggningsfel", loginError);
        return;
      }

      logDebug("success", "Demo-inloggning lyckades!", loginData?.user);

      // Ladda om sidan för att uppdatera auth-status
      setTimeout(() => {
        window.location.reload();
      }, 1000);
    } catch (err: any) {
      logDebug("error", "Oväntat fel vid demo-inloggning", err);
    }
  }

  /* ===========================
   * Render
   * =========================== */

  // Loading state för auth
  if (authLoading && !authTimeout) {
    return (
      <div className="p-4 md:p-6 max-w-7xl mx-auto">
        <div className="flex items-center justify-center min-h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600 mr-4"></div>
          <p className="text-gray-600">
            Laddar hunddagis... (authLoading: {String(authLoading)})
          </p>
          <button
            onClick={() => setAuthTimeout(true)}
            className="ml-4 px-3 py-1 bg-blue-500 text-white rounded text-sm"
          >
            Fortsätt ändå
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 max-w-7xl mx-auto">
      {/* Topbar */}
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between mb-4">
        <div>
          <h1 className="text-2xl font-bold text-[#2c7a4c]">
            Hunddagis – Dagens sammanställning
          </h1>
          <p className="text-sm text-gray-500">
            Sök, filtrera, exportera och lägg till nya hundar.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link
            href="/hunddagis/new"
            className="inline-flex items-center gap-2 bg-[#2c7a4c] text-white px-3 py-2 rounded-md text-sm font-semibold hover:bg-green-700"
          >
            <Plus className="h-4 w-4" />
            Ny hund
          </Link>
          <button
            onClick={exportPDF}
            className="inline-flex items-center gap-2 border px-3 py-2 rounded-md text-sm hover:bg-gray-50"
          >
            <Download className="h-4 w-4" />
            PDF-export
          </button>
          <button
            onClick={loadTestData}
            className="inline-flex items-center gap-2 bg-blue-600 text-white px-3 py-2 rounded-md text-sm hover:bg-blue-700"
          >
            � Skapa allt (org + ägare + hundar)
          </button>
          <div className="relative">
            <button
              onClick={() => setShowColsMenu((s) => !s)}
              className="inline-flex items-center gap-2 border px-3 py-2 rounded-md text-sm hover:bg-gray-50"
            >
              <Settings2 className="h-4 w-4" />
              Kolumner
            </button>
            {showColsMenu && (
              <div className="absolute right-0 mt-2 w-56 rounded-md border bg-white shadow z-10 p-2">
                {Object.keys(COLUMN_LABELS).map((c) => (
                  <label
                    key={c}
                    className="flex items-center gap-2 px-2 py-1 text-sm"
                  >
                    <input
                      type="checkbox"
                      checked={columns.includes(c)}
                      onChange={() => toggleColumn(c)}
                    />
                    {COLUMN_LABELS[c]}
                  </label>
                ))}
              </div>
            )}
          </div>
          <button
            onClick={loadDogs}
            title="Ladda om"
            className="inline-flex items-center gap-2 border px-3 py-2 rounded-md text-sm hover:bg-gray-50"
          >
            <RefreshCcw className="h-4 w-4" />
            Ladda om
          </button>
        </div>
      </div>

      {/* Filterrad */}
      <div className="flex flex-col md:flex-row gap-3 mb-4">
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Sök… (hund, ägare, telefon, rum…) "
          className="border rounded-md px-3 py-2 text-sm w-full md:w-1/2"
        />
        <select
          value={subFilter}
          onChange={(e) => setSubFilter(e.target.value)}
          className="border rounded-md px-3 py-2 text-sm"
        >
          <option value="">Alla abonnemang</option>
          <option value="Heltid">Heltid</option>
          <option value="Deltid 3">Deltid 3</option>
          <option value="Deltid 2">Deltid 2</option>
          <option value="Dagshund">Dagshund</option>
        </select>
        <input
          type="month"
          value={month}
          onChange={(e) => setMonth(e.target.value)}
          className="border rounded-md px-3 py-2 text-sm"
          title="Filtrerar på startmånad (eller skapad om start saknas)"
        />
      </div>

      {/* Fel / status */}
      {errMsg && (
        <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-red-700 text-sm">
          {errMsg}
        </div>
      )}

      {/* Tabell */}
      <div className="overflow-x-auto border rounded-xl bg-white">
        <table className="min-w-full text-sm">
          <thead className="bg-[#2c7a4c] text-white">
            <tr>
              {columns.includes("name") &&
                headerCell("name", COLUMN_LABELS["name"])}
              {columns.includes("breed") &&
                headerCell("breed", COLUMN_LABELS["breed"])}
              {columns.includes("owner") &&
                headerCell("owner", COLUMN_LABELS["owner"])}
              {columns.includes("phone") && (
                <th className="py-2 px-3 text-left">Telefon</th>
              )}
              {columns.includes("subscription") &&
                headerCell("subscription", COLUMN_LABELS["subscription"])}
              {columns.includes("room_id") &&
                headerCell("room_id", COLUMN_LABELS["room_id"])}
              {columns.includes("days") && (
                <th className="py-2 px-3 text-left">{COLUMN_LABELS["days"]}</th>
              )}
              {columns.includes("startdate") &&
                headerCell("startdate", COLUMN_LABELS["startdate"])}
              {columns.includes("enddate") &&
                headerCell("enddate", COLUMN_LABELS["enddate"])}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td className="py-4 px-3 text-gray-500" colSpan={9}>
                  Laddar hundar…
                </td>
              </tr>
            ) : viewDogs.length === 0 ? (
              <tr>
                <td className="py-4 px-3 text-gray-500" colSpan={9}>
                  Inga hundar matchar dina filter.
                </td>
              </tr>
            ) : (
              viewDogs.map((d) => (
                <tr
                  key={d.id}
                  className={`border-t hover:bg-green-50 ${rowColor(d)}`}
                >
                  {columns.includes("name") && (
                    <td className="py-2 px-3">
                      <div className="flex items-center gap-2">
                        {d.photo_url ? (
                          <img
                            src={d.photo_url}
                            alt="hund"
                            className="h-8 w-8 rounded-full object-cover border"
                          />
                        ) : (
                          <div className="h-8 w-8 rounded-full grid place-content-center bg-gray-100 text-gray-500 text-xs">
                            🐶
                          </div>
                        )}
                        <div>
                          <div className="font-semibold">{d.name}</div>
                          {d.breed && (
                            <div className="text-xs text-gray-500">
                              {d.breed}
                            </div>
                          )}
                        </div>
                      </div>
                    </td>
                  )}
                  {columns.includes("breed") && (
                    <td className="py-2 px-3">{d.breed || "-"}</td>
                  )}
                  {columns.includes("owner") && (
                    <td className="py-2 px-3">{d.owners?.full_name || "-"}</td>
                  )}
                  {columns.includes("phone") && (
                    <td className="py-2 px-3">{d.owners?.phone || "-"}</td>
                  )}
                  {columns.includes("subscription") && (
                    <td className="py-2 px-3">{d.subscription || "-"}</td>
                  )}
                  {columns.includes("room_id") && (
                    <td className="py-2 px-3">{d.room_id || "-"}</td>
                  )}
                  {columns.includes("days") && (
                    <td className="py-2 px-3">{d.days || "-"}</td>
                  )}
                  {columns.includes("startdate") && (
                    <td className="py-2 px-3">
                      {d.startdate
                        ? new Date(d.startdate).toLocaleDateString("sv-SE")
                        : "-"}
                    </td>
                  )}
                  {columns.includes("enddate") && (
                    <td className="py-2 px-3">
                      {d.enddate
                        ? new Date(d.enddate).toLocaleDateString("sv-SE")
                        : "-"}
                    </td>
                  )}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Modal */}
      {showModal && (
        <EditDogModal
          open={showModal}
          onCloseAction={() => setShowModal(false)}
          onSavedAction={handleSaved}
        />
      )}
    </div>
  );
}
