"use client";

import React, { useEffect, useState, useCallback, useMemo } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/app/context/AuthContext";

// 🔔 OBS: Alla originalimports bevarade (och några kompletterande ikoner för ny UI)
import {
  Download,
  Plus,
  Settings2,
  RefreshCcw,
  Calendar as CalIcon,
  CheckSquare,
} from "lucide-react";

import EditDogModal from "@/components/EditDogModal";
import { DagisStats } from "@/components/DagisStats"; // (bevarad import även om ej använd här)

import {
  Accordion,
  AccordionItem,
  AccordionTrigger,
  AccordionContent,
} from "@/components/ui/accordion";

/* ===========================
 * Felkoder (oförändrat system)
 * =========================== */
const ERROR_CODES = {
  DATABASE_CONNECTION: "[ERR-1001]",
  PDF_EXPORT: "[ERR-2001]",
  REALTIME: "[ERR-3001]",
  VALIDATION: "[ERR-4001]",
} as const;

/* ===========================
 * Typer (Supabase-små bokstäver)
 * =========================== */
type Owner = {
  id: string;
  full_name: string | null;
  phone: string | null;
  email: string | null;
  customer_number: string | null;
  address?: string | null;
  notes?: string | null;
  org_id: string;
  created_at: string;
};

type Dog = {
  id: string;
  name: string;
  breed: string | null;
  heightcm: number | null;
  birth: string | null;
  subscription: string | null;
  startdate: string | null;
  enddate: string | null;
  days: string | null; // t.ex. "Mån,Tis,Ons"
  room_id: string | null;
  owner_id: string | null; // ✅ korrekt relation: dogs.owner_id → owners.id
  org_id: string | null;
  vaccdhp: string | null;
  vaccpi: string | null;
  photo_url: string | null;
  events: any | null;
  checked_in?: boolean | null;
  notes?: string | null;
  weight_kg?: number | null;
  created_at?: string | null;
  owners?: Owner | null; // join
};

type Room = {
  id: string;
  name: string;
  capacity?: number | null;
  org_id?: string | null;
};

type SortKey =
  | "name"
  | "breed"
  | "subscription"
  | "room_id"
  | "owner"
  | "startdate"
  | "enddate"
  | "phone"
  | "days";

/* ===========================
 * Tabellkolumner (bevarat)
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
 * Komponent
 * =========================== */
export default function HunddagisPage() {
  const { user, loading: authLoading } = useAuth();

  // === State (ALLT bevarat + kompletterat för nya vyer) ===
  const [dogs, setDogs] = useState<Dog[]>([]);
  const [rooms, setRooms] = useState<Room[]>([]); // nytt för rumsvy

  const [loading, setLoading] = useState(true);
  const [errMsg, setErrMsg] = useState<string | null>(null);

  const [showModal, setShowModal] = useState(false);

  // Filter/sort (bevarat)
  const [q, setQ] = useState("");
  const [subFilter, setSubFilter] = useState("");
  const [month, setMonth] = useState("alla");
  const [sortKey, setSortKey] = useState<SortKey>("name");
  const [sortAsc, setSortAsc] = useState(true);

  // Kolumnval (bevarat)
  const [columns, setColumns] = useState<string[]>(DEFAULT_COLUMNS);
  const [showColsMenu, setShowColsMenu] = useState(false);

  // Statistik/vy (ny huvudvy + bevarade principer)
  const [currentView, setCurrentView] = useState<
    "all" | "services" | "rooms" | "applications" | "calendar"
  >("all");

  // Livesiffror för hero-korten
  const [live, setLive] = useState({
    dagishundar: 0, // hur många registrerade
    promenaderIdag: 0, // inne idag (enkel logik baserat på dagar)
    intresseSenasteMån: 0, // från applications/interests
    tjänsterDennaMån: 0, // via events
    hundrum: 0, // antal rum
  });

  // Services checkbox (klarmarkering per hund per månad)
  const [serviceChecked, setServiceChecked] = useState<Record<string, boolean>>(
    {}
  );

  // Debug (bevarat + robust)
  const [debugLogs, setDebugLogs] = useState<any[]>([]);
  const [mounted, setMounted] = useState(false);

  // Timeout för authLoading om den fastnar (bevarat)
  const [authTimeout, setAuthTimeout] = useState(false);
  useEffect(() => {
    const timer = setTimeout(() => {
      if (authLoading) {
        console.warn("Auth loading timeout - forcing continue");
        setAuthTimeout(true);
      }
    }, 5000);
    return () => clearTimeout(timer);
  }, [authLoading]);

  /* ===========================
   * Debuglogg (bevarad)
   * =========================== */
  function logDebug(
    type: "info" | "success" | "error",
    message: string,
    details?: any
  ) {
    console.log(`[Hunddagis] ${message}`, details || "");
    const newLog = { time: new Date().toISOString(), type, message, details };

    if (!mounted) {
      setDebugLogs((prev) => [newLog, ...prev].slice(0, 100));
      return;
    }

    try {
      const raw = localStorage.getItem("debugLogs");
      let existing: any[] = [];
      if (raw) {
        try {
          existing = JSON.parse(raw);
          if (!Array.isArray(existing)) existing = [];
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
      try {
        localStorage.setItem("debugLogs", JSON.stringify([newLog]));
        setDebugLogs([newLog]);
      } catch (fallbackError) {
        console.error("[ERR-3003] Kritiskt localStorage-fel:", fallbackError);
        setDebugLogs([newLog]);
      }
    }
  }

  /* ===========================
   * Hydration-säker init (bevarad)
   * =========================== */
  useEffect(() => {
    setMounted(true);
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
    try {
      const rawSrv = localStorage.getItem(
        "dogplanner:hunddagis:servicesChecked"
      );
      if (rawSrv) {
        const parsed = JSON.parse(rawSrv);
        if (parsed && typeof parsed === "object") setServiceChecked(parsed);
      }
    } catch {
      /* noop */
    }
  }, []);

  useEffect(() => {
    if (mounted) {
      localStorage.setItem(
        "dogplanner:hunddagis:columns",
        JSON.stringify(columns)
      );
    }
  }, [columns, mounted]);

  useEffect(() => {
    if (mounted) {
      localStorage.setItem(
        "dogplanner:hunddagis:servicesChecked",
        JSON.stringify(serviceChecked)
      );
    }
  }, [serviceChecked, mounted]);

  /* ===========================
   * Datahämtning (Supabase) — bevarat & utökat
   * =========================== */
  const loadDogs = useCallback(async () => {
    if (!user) return;

    if (!supabase) {
      setErrMsg("❌ Databas-anslutning saknas. Kontrollera miljövariabler.");
      setLoading(false);
      return;
    }

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

  const loadRooms = useCallback(async () => {
    if (!user || !supabase) return;
    try {
      const orgId = user.user_metadata?.org_id || user.id;
      const { data, error } = await (supabase as any)
        .from("rooms")
        .select("*")
        .eq("org_id", orgId)
        .order("name", { ascending: true });
      if (error) throw error;
      setRooms(data || []);
    } catch (e) {
      console.warn(
        `${ERROR_CODES.DATABASE_CONNECTION} Kunde inte hämta rooms`,
        e
      );
      setRooms([]);
    }
  }, [user]);

  // Realtidsuppdatering (bevarat mönster)
  useEffect(() => {
    if (!user || authLoading || !supabase) return;
    loadDogs();
    loadRooms();

    const handleVisibilityChange = () => {
      if (!document.hidden) {
        loadDogs();
        loadRooms();
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
            loadDogs();
          }
        }
      )
      .subscribe();

    logDebug("info", "Realtidslyssning aktiv för hundar");

    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      if (supabase) {
        supabase.removeChannel(channel);
      }
    };
  }, [user, authLoading, loadDogs, loadRooms]);

  /* ===========================
   * Livesiffror (nytt, robust)
   * =========================== */
  const todayIso = new Date().toISOString().slice(0, 10);
  const weekDayShort = ["Sön", "Mån", "Tis", "Ons", "Tor", "Fre", "Lör"][
    new Date().getDay()
  ];

  function isWithinInterval(d: Dog) {
    const start = d.startdate || d.created_at || todayIso;
    const end = d.enddate || "9999-12-31";
    return start <= todayIso && todayIso <= end;
  }

  function isScheduledToday(d: Dog) {
    if (!d.days) return false;
    const parts = d.days.split(",").map((s) => s.trim());
    return parts.includes(weekDayShort) && isWithinInterval(d);
  }

  const loadApplicationsCount = useCallback(async () => {
    if (!user || !supabase) return 0;
    try {
      const orgId = user.user_metadata?.org_id || user.id;
      const firstOfMonth = new Date();
      firstOfMonth.setDate(1);
      const since = firstOfMonth.toISOString();

      // Försök 1: applications
      let { count, error } = await (supabase as any)
        .from("applications")
        .select("*", { count: "exact", head: true })
        .eq("org_id", orgId)
        .gte("created_at", since)
        .eq("type", "dagis");

      if (!error) return count || 0;

      // Försök 2: interests
      const try2 = await (supabase as any)
        .from("interests")
        .select("*", { count: "exact", head: true })
        .eq("org_id", orgId)
        .gte("created_at", since)
        .eq("category", "dagis");

      if (!try2.error) return try2.count || 0;

      return 0;
    } catch {
      return 0;
    }
  }, [user]);

  const calcServicesThisMonth = useCallback((list: Dog[]) => {
    const ym = new Date().toISOString().slice(0, 7);
    const KEYWORDS = ["kloklipp", "tassklipp", "bad"];
    let n = 0;
    list.forEach((d) => {
      try {
        const ev = d.events;
        if (!ev) return;
        const arr = Array.isArray(ev)
          ? ev
          : typeof ev === "string"
          ? JSON.parse(ev)
          : [];
        const hasService = (arr || []).some((e: any) => {
          const when: string = e?.date || e?.datum || "";
          const txt = `${e?.type || ""} ${e?.title || ""} ${
            e?.name || ""
          }`.toLowerCase();
          return when.startsWith(ym) && KEYWORDS.some((k) => txt.includes(k));
        });
        if (hasService) n++;
      } catch {
        // ignore parse error
      }
    });
    return n;
  }, []);

  const refreshLive = useCallback(
    async (list: Dog[]) => {
      const applications = await loadApplicationsCount();
      const promenader = list.filter((d) => isScheduledToday(d)).length;
      const tjänster = calcServicesThisMonth(list);
      setLive({
        dagishundar: list.length,
        promenaderIdag: promenader,
        intresseSenasteMån: applications,
        tjänsterDennaMån: tjänster,
        hundrum: rooms.length,
      });
    },
    [rooms.length, loadApplicationsCount, calcServicesThisMonth]
  );

  useEffect(() => {
    refreshLive(dogs);
  }, [dogs, rooms, refreshLive]);

  /* ===========================
   * Filter & sort (bevarat)
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
      if (currentView === "services") return true;
      if (month === "alla") return true;
      const dateStr = d.startdate || d.created_at || "";
      if (!dateStr) return true;
      const mm = dateStr.slice(0, 7);
      return mm === month;
    },
    [month, currentView]
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

  const baseDogs = useMemo(() => {
    let list = dogs.filter(passSearch).filter(passSubFilter).filter(passMonth);
    return list; // vyer hanteras i render
  }, [dogs, passSearch, passSubFilter, passMonth]);

  const viewDogs = useMemo(() => {
    return [...baseDogs].sort(sortDogs);
  }, [baseDogs, sortDogs]);

  /* ===========================
   * PDF-export (bevarad)
   * =========================== */
  async function exportPDF() {
    try {
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
    } catch (e: any) {
      console.error(`${ERROR_CODES.PDF_EXPORT} PDF-export`, e);
      alert(
        `${ERROR_CODES.PDF_EXPORT} Kunde inte skapa PDF. ${
          e?.message ?? "Okänt fel"
        }`
      );
    }
  }

  /* ===========================
   * UI-hjälpare (bevarat)
   * =========================== */
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

  // 🔒 Bevarade DEMO-hjälpare från original
  async function loadTestData() {
    console.log("🚀 LOADTESTDATA STARTAR!");

    if (!supabase) {
      alert("Databaskoppling saknas!");
      return;
    }

    try {
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
        await loadDogs();
      }
    } catch (err: any) {
      logDebug("error", "Oväntat fel vid testdata-laddning", err);
    }
  }

  async function demoLogin() {
    if (!supabase) {
      alert("Databaskoppling saknas!");
      return;
    }

    try {
      logDebug("info", "Försöker demo-inloggning...");

      const demoEmail = "test@dogplanner.se";
      const demoPassword = "demo123456";

      let { data: loginData, error: loginError } =
        await supabase.auth.signInWithPassword({
          email: demoEmail,
          password: demoPassword,
        });

      if (loginError && loginError.message === "Invalid login credentials") {
        logDebug("info", "Demo-användare finns inte, skapar ny...");

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

      setTimeout(() => {
        window.location.reload();
      }, 1000);
    } catch (err: any) {
      logDebug("error", "Oväntat fel vid demo-inloggning", err);
    }
  }

  // === Fortsättning i DEL 2/3: styles, hero + livekort, kontroller, vyer & tabell ===
  return (
    <>
      {/* ======= STYLES (matchar pensionat-look) ======= */}
      <style jsx>{`
        :root {
          --primary-green: #2c7a4c;
          --light-green: rgba(44, 122, 76, 0.1);
          --success-green: #28a745;
        }
        .dagis-container {
          min-height: 100vh;
          background: linear-gradient(
            135deg,
            rgba(44, 122, 76, 0.08) 0%,
            rgba(76, 175, 80, 0.05) 100%
          );
          padding: 20px;
        }
        .dagis-header {
          background: rgba(255, 255, 255, 0.95);
          border: 1px solid rgba(44, 122, 76, 0.2);
          border-radius: 8px;
          padding: 12px 16px;
          margin-bottom: 16px;
          display: flex;
          align-items: center;
          justify-content: space-between;
        }
        .back-btn {
          color: var(--primary-green);
          text-decoration: none;
          padding: 6px 10px;
          border-radius: 6px;
          border: 1px solid transparent;
        }
        .back-btn:hover {
          background: var(--light-green);
          border-color: var(--primary-green);
        }

        .dagis-hero {
          text-align: center;
          padding: 56px 20px 32px 20px;
          background: linear-gradient(
              rgba(44, 122, 76, 0.85),
              rgba(44, 122, 76, 0.85)
            ),
            url("/Hero.jpeg") center/cover no-repeat;
          color: #fff;
          border-radius: 12px;
          margin-bottom: 24px;
        }
        .dagis-hero h1 {
          font-size: 2.4rem;
          font-weight: 800;
          margin-bottom: 8px;
        }
        .dagis-hero p {
          opacity: 0.95;
          max-width: 680px;
          margin: 0 auto 18px;
        }

        .live-grid {
          display: grid;
          grid-template-columns: repeat(7, 1fr);
          gap: 12px;
          max-width: 1200px;
          margin: 0 auto;
        }
        .live-card {
          background: rgba(255, 255, 255, 0.15);
          border: 1px solid rgba(255, 255, 255, 0.25);
          border-radius: 10px;
          padding: 12px 10px;
          min-height: 90px;
          display: flex;
          flex-direction: column;
          justify-content: center;
          cursor: pointer;
          transition: all 0.2s ease;
          user-select: none;
        }
        .live-card:hover {
          background: rgba(255, 255, 255, 0.25);
          transform: translateY(-1px);
        }
        .live-value {
          font-size: 22px;
          font-weight: 800;
          color: white;
          line-height: 1;
          margin-bottom: 6px;
        }
        .live-label {
          font-size: 11px;
          color: white;
          opacity: 0.95;
        }

        .controls {
          background: rgba(255, 255, 255, 0.95);
          border: 1px solid rgba(44, 122, 76, 0.2);
          border-radius: 8px;
          padding: 16px;
          margin-bottom: 16px;
          display: flex;
          gap: 12px;
          justify-content: space-between;
          align-items: center;
          flex-wrap: wrap;
        }
        .controls .left,
        .controls .right {
          display: flex;
          gap: 10px;
          align-items: center;
          flex-wrap: wrap;
        }
        .input,
        .select {
          padding: 8px 10px;
          border: 1px solid rgba(44, 122, 76, 0.3);
          border-radius: 6px;
          background: #fff;
          min-width: 200px;
        }
        .btn {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 8px 12px;
          border-radius: 6px;
          font-weight: 600;
          cursor: pointer;
          border: none;
          text-decoration: none;
        }
        .btn-primary {
          background: var(--primary-green);
          color: white;
        }
        .btn-secondary {
          background: #6c757d;
          color: white;
        }
        .btn-ghost {
          background: #f2f4f5;
          color: #111;
        }
        .btn:hover {
          transform: translateY(-1px);
        }

        .panel {
          background: rgba(255, 255, 255, 0.95);
          border: 1px solid rgba(44, 122, 76, 0.2);
          border-radius: 8px;
          padding: 12px;
          margin-bottom: 16px;
        }

        .table-wrap {
          background: rgba(255, 255, 255, 0.96);
          border: 1px solid rgba(44, 122, 76, 0.2);
          border-radius: 8px;
          overflow: hidden;
        }
        .tbl {
          width: 100%;
          border-collapse: collapse;
        }
        .tbl thead th {
          background: var(--primary-green);
          color: white;
          padding: 12px 14px;
          text-align: left;
        }
        .tbl tbody td {
          padding: 10px 14px;
          border-bottom: 1px solid rgba(0, 0, 0, 0.06);
        }
        .tbl tbody tr:nth-child(even) {
          background: var(--light-green);
        }

        .error {
          background: #f8d7da;
          border: 1px solid #f5c6cb;
          color: #721c24;
          padding: 10px 12px;
          border-radius: 6px;
          margin-bottom: 12px;
        }

        @media (max-width: 1100px) {
          .live-grid {
            grid-template-columns: repeat(4, 1fr);
          }
        }
        @media (max-width: 700px) {
          .live-grid {
            grid-template-columns: repeat(2, 1fr);
          }
          .dagis-hero h1 {
            font-size: 1.6rem;
          }
        }
      `}</style>

      {/* === AUTH LOAD === */}
      {authLoading && !authTimeout ? (
        <div className="p-4 md:p-6 max-w-7xl mx-auto">
          <div className="flex items-center justify-center min-h-64">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600 mr-4"></div>
            <p className="text-gray-600">
              Laddar hunddagis... (authLoading: {String(authLoading)})
            </p>
            {/* Bevarad “fortsätt ändå”-knapp */}
            <button
              onClick={() => setAuthTimeout(true)}
              className="ml-4 px-3 py-1 bg-blue-500 text-white rounded text-sm"
            >
              Fortsätt ändå
            </button>
          </div>
        </div>
      ) : (
        <div className="dagis-container">
          {/* Hero + livekort */}
          <section className="dagis-hero">
            <h1>Hunddagis</h1>
            <p>Sammanställning, statistik och hantering av dagishundar.</p>

            <div className="live-grid">
              <div
                className="live-card"
                onClick={() => setCurrentView("all")}
                title="Alla dagishundar"
              >
                <div className="live-value">{live.dagishundar}</div>
                <div className="live-label">Dagishundar</div>
              </div>

              <div
                className="live-card"
                onClick={() => setCurrentView("all")}
                title="Hundar inne idag"
              >
                <div className="live-value">{live.promenaderIdag}</div>
                <div className="live-label">Promenader (inne idag)</div>
              </div>

              <div
                className="live-card"
                onClick={() => setCurrentView("applications")}
                title="Intresseanmälningar (senaste månaden)"
              >
                <div className="live-value">{live.intresseSenasteMån}</div>
                <div className="live-label">Intresseanmälningar</div>
              </div>

              <div
                className="live-card"
                onClick={() => setCurrentView("services")}
                title="Tilläggstjänster denna månaden"
              >
                <div className="live-value">{live.tjänsterDennaMån}</div>
                <div className="live-label">
                  Tjänster (kloklipp/tassklipp/bad)
                </div>
              </div>

              <div
                className="live-card"
                onClick={() => setCurrentView("rooms")}
                title="Rum & beläggning"
              >
                <div className="live-value">{live.hundrum}</div>
                <div className="live-label">Hundrum</div>
              </div>

              <div
                className="live-card"
                onClick={() => (window.location.href = "/mina-priser")}
                title="Mina priser"
              >
                <div className="live-value">›</div>
                <div className="live-label">Mina priser</div>
              </div>

              <div
                className="live-card"
                onClick={() => setCurrentView("calendar")}
                title="Kalender"
              >
                <div className="live-value">
                  <CalIcon size={18} />
                </div>
                <div className="live-label">Kalender</div>
              </div>
            </div>

            {/* Primära knappar under liveboxarna */}
            <div className="flex flex-wrap gap-8 justify-center mt-5">
              <Link href="/hunddagis/new" className="btn btn-primary">
                <Plus className="h-4 w-4" /> Ny hund
              </Link>
              <button onClick={exportPDF} className="btn btn-secondary">
                <Download className="h-4 w-4" /> PDF-export
              </button>
              <button onClick={loadDogs} className="btn btn-ghost">
                <RefreshCcw className="h-4 w-4" /> Ladda om
              </button>
            </div>
          </section>

          {/* Kontroller */}
          <div className="controls">
            <div className="left">
              <input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="🔍 Sök… (hund, ägare, telefon, rum…)"
                className="input"
              />
              <select
                value={subFilter}
                onChange={(e) => setSubFilter(e.target.value)}
                className="select"
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
                className="select"
                title="Filtrerar på startmånad (eller skapad om start saknas)"
              />
            </div>

            <div className="right">
              <div className="relative">
                <button
                  onClick={() => setShowColsMenu((s) => !s)}
                  className="btn btn-ghost"
                  title="Kolumnval"
                >
                  <Settings2 className="h-4 w-4" /> Kolumner
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
                          onChange={() =>
                            setColumns((prev) =>
                              prev.includes(c)
                                ? prev.filter((x) => x !== c)
                                : [...prev, c]
                            )
                          }
                        />
                        {COLUMN_LABELS[c]}
                      </label>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Felvisning */}
          {errMsg && <div className="error">{errMsg}</div>}
          {/* === VYER === */}

          {/* Tjänster (checklista) */}
          {currentView === "services" && (
            <div className="panel">
              <div className="flex items-center gap-2 mb-2">
                <CheckSquare size={18} />
                <h3 className="font-semibold">
                  Tjänster denna månad (checka när utfört)
                </h3>
              </div>
              <div className="overflow-x-auto">
                <table className="tbl">
                  <thead>
                    <tr>
                      <th>Hund</th>
                      <th>Ägare</th>
                      <th>Planerade tjänster</th>
                      <th>Klarmarkera</th>
                    </tr>
                  </thead>
                  <tbody>
                    {dogs
                      .filter((d) => {
                        const KEYWORDS = ["kloklipp", "tassklipp", "bad"];
                        const ym = new Date().toISOString().slice(0, 7);
                        try {
                          const arr = Array.isArray(d.events)
                            ? d.events
                            : d.events
                            ? JSON.parse(d.events)
                            : [];
                          return (arr || []).some((e: any) => {
                            const when: string = e?.date || e?.datum || "";
                            const txt = `${e?.type || ""} ${
                              e?.title || ""
                            }`.toLowerCase();
                            return (
                              when.startsWith(ym) &&
                              KEYWORDS.some((k) => txt.includes(k))
                            );
                          });
                        } catch {
                          return false;
                        }
                      })
                      .map((d) => {
                        const ym = new Date().toISOString().slice(0, 7);
                        const key = `${ym}:${d.id}`;
                        let items: string[] = [];
                        try {
                          const arr = Array.isArray(d.events)
                            ? d.events
                            : d.events
                            ? JSON.parse(d.events)
                            : [];
                          items = (arr || [])
                            .filter((e: any) => (e?.date || "").startsWith(ym))
                            .map((e: any) => e?.title || e?.type || "Tjänst");
                        } catch {}
                        return (
                          <tr key={d.id}>
                            <td className="py-2 px-3">{d.name}</td>
                            <td className="py-2 px-3">
                              {d.owners?.full_name || "-"}
                            </td>
                            <td className="py-2 px-3">
                              {items.length ? items.join(", ") : "-"}
                            </td>
                            <td className="py-2 px-3">
                              <label className="inline-flex items-center gap-2">
                                <input
                                  type="checkbox"
                                  checked={!!serviceChecked[key]}
                                  onChange={async () => {
                                    const next = !serviceChecked[key];
                                    // uppdatera local state + localStorage (hanteras i useEffect)
                                    setServiceChecked((prev) => ({
                                      ...prev,
                                      [key]: next,
                                    }));
                                    // försök persistera i Supabase (om service_logs finns)
                                    try {
                                      const { error } = await (supabase as any)
                                        .from("service_logs")
                                        .upsert(
                                          {
                                            dog_id: d.id,
                                            ym,
                                            done: next,
                                            user_id: user?.id || null,
                                            org_id:
                                              user?.user_metadata?.org_id ||
                                              null,
                                            updated_at:
                                              new Date().toISOString(),
                                          },
                                          { onConflict: "dog_id,ym" }
                                        );
                                      if (error) {
                                        console.warn(
                                          `${ERROR_CODES.DATABASE_CONNECTION} service_logs`,
                                          error
                                        );
                                      }
                                    } catch (e) {
                                      console.warn(
                                        `${ERROR_CODES.DATABASE_CONNECTION} service_logs saknas`,
                                        e
                                      );
                                    }
                                  }}
                                />
                                {serviceChecked[key] ? "Utfört" : "Ej klart"}
                              </label>
                            </td>
                          </tr>
                        );
                      })}
                    {dogs.length === 0 && (
                      <tr>
                        <td colSpan={4} className="py-3 px-3 text-gray-600">
                          Inga hundar att visa.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Rumsvy */}
          {currentView === "rooms" && (
            <div className="panel">
              <h3 className="font-semibold mb-2">Rumsöversikt</h3>
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-3">
                {rooms.map((r) => {
                  const dogsInRoom = dogs.filter((d) => d.room_id === r.id);
                  const cap = r.capacity || null;
                  return (
                    <div key={r.id} className="border rounded-md p-3">
                      <div className="font-semibold">
                        {r.name}{" "}
                        {cap ? (
                          <span className="text-sm text-gray-500">
                            ({dogsInRoom.length}/{cap})
                          </span>
                        ) : null}
                      </div>
                      <ul className="mt-2 text-sm">
                        {dogsInRoom.length ? (
                          dogsInRoom.map((d) => <li key={d.id}>• {d.name}</li>)
                        ) : (
                          <li className="text-gray-500">Inga hundar</li>
                        )}
                      </ul>
                    </div>
                  );
                })}
                {!rooms.length && (
                  <div className="text-sm text-gray-600">
                    Inga rum hittades.
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Intresselista – placeholder (robust mot saknad tabell) */}
          {currentView === "applications" && (
            <div className="panel">
              <h3 className="font-semibold mb-2">
                Intresselista (senaste månaden)
              </h3>
              <p className="text-sm text-gray-600">
                Denna sektion försöker läsa från <code>applications</code> eller{" "}
                <code>interests</code>. Om den databasen inte finns än visas
                endast totalen i livekorten. {live.intresseSenasteMån} st den
                här månaden.
              </p>
            </div>
          )}

          {/* Kalender – länk ut */}
          {currentView === "calendar" && (
            <div className="panel">
              <h3 className="font-semibold mb-2">Kalender</h3>
              <p className="text-sm text-gray-600">
                Gå till kalendern för hunddagis{" "}
                <Link
                  className="text-green-700 underline"
                  href="/hunddagis/kalender"
                >
                  här
                </Link>
                .
              </p>
            </div>
          )}

          {/* Standardtabell (visas när vy inte ersätter tabellen) */}
          {currentView !== "services" && currentView !== "rooms" && (
            <div className="table-wrap">
              <table className="tbl">
                <thead>
                  <tr>
                    {columns.includes("name") &&
                      headerCell("name", COLUMN_LABELS["name"])}
                    {columns.includes("breed") &&
                      headerCell("breed", COLUMN_LABELS["breed"])}
                    {columns.includes("owner") &&
                      headerCell("owner", COLUMN_LABELS["owner"])}
                    {columns.includes("phone") &&
                      headerCell("phone", "Telefon")}
                    {columns.includes("subscription") &&
                      headerCell("subscription", COLUMN_LABELS["subscription"])}
                    {columns.includes("room_id") &&
                      headerCell("room_id", COLUMN_LABELS["room_id"])}
                    {columns.includes("days") &&
                      headerCell("days", COLUMN_LABELS["days"])}
                    {columns.includes("startdate") &&
                      headerCell("startdate", COLUMN_LABELS["startdate"])}
                    {columns.includes("enddate") &&
                      headerCell("enddate", COLUMN_LABELS["enddate"])}
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr>
                      <td
                        className="py-4 px-3 text-gray-500"
                        colSpan={columns.length}
                      >
                        Laddar hundar…
                      </td>
                    </tr>
                  ) : viewDogs.length === 0 ? (
                    <tr>
                      <td
                        className="py-4 px-3 text-gray-500"
                        colSpan={columns.length}
                      >
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
                          <td className="py-2 px-3">
                            {d.owners?.full_name || "-"}
                          </td>
                        )}
                        {columns.includes("phone") && (
                          <td className="py-2 px-3">
                            {d.owners?.phone || "-"}
                          </td>
                        )}
                        {columns.includes("subscription") && (
                          <td className="py-2 px-3">
                            <span
                              className={`px-2 py-1 rounded font-semibold ${
                                d.subscription === "Heltid"
                                  ? "bg-green-100 text-green-800"
                                  : d.subscription?.startsWith("Deltid")
                                  ? "bg-blue-100 text-blue-800"
                                  : d.subscription === "Dagshund"
                                  ? "bg-yellow-100 text-yellow-800"
                                  : "bg-gray-100 text-gray-800"
                              }`}
                            >
                              {d.subscription || "-"}
                            </span>
                          </td>
                        )}
                        {columns.includes("room_id") && (
                          <td className="py-2 px-3">{d.room_id || "-"}</td>
                        )}
                        {columns.includes("days") && (
                          <td className="py-2 px-3">
                            {d.days
                              ? d.days.split(",").map((day, i) => (
                                  <span
                                    key={i}
                                    className="inline-block px-1 py-0.5 rounded bg-gray-100 text-gray-700 mr-1"
                                  >
                                    {day.slice(0, 3)}
                                  </span>
                                ))
                              : "-"}
                          </td>
                        )}
                        {columns.includes("startdate") && (
                          <td className="py-2 px-3">
                            {d.startdate
                              ? new Date(d.startdate).toLocaleDateString(
                                  "sv-SE"
                                )
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
          )}

          {/* Modal (bevarad) */}
          {showModal && (
            <EditDogModal
              open={showModal}
              onCloseAction={() => setShowModal(false)}
              onSavedAction={handleSaved}
            />
          )}
        </div>
      )}
    </>
  );
}
