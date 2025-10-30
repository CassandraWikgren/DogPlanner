"use client";

import React, { useEffect, useState, useCallback, useMemo } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/app/context/AuthContext";
import {
  calculateRequiredArea,
  calculateAllRoomsOccupancy,
  type RoomOccupancy,
} from "@/lib/roomCalculator";

// 🔔 OBS: Alla originalimports bevarade (och några kompletterande ikoner för ny UI)
import {
  Download,
  Plus,
  Settings2,
  RefreshCcw,
  Calendar as CalIcon,
  CheckSquare,
  Home,
  AlertTriangle,
  CheckCircle,
  Info,
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
  heightcm: number | null; // mankhöjd - används för Jordbruksverket-regler
  height_cm?: number | null; // alias för roomCalculator
  birth: string | null;
  subscription: string | null;
  startdate: string | null;
  enddate: string | null;
  days: string | null; // t.ex. "Mån,Tis,Ons" eller "Måndag,Tisdag,Onsdag"
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
  owner?: Owner | null; // alias för roomCalculator
};

type Room = {
  id: string;
  name: string;
  capacity?: number | null;
  capacity_m2?: number | null; // kvadratmeter för Jordbruksverket-regler
  org_id?: string | null;
  room_type?: "daycare" | "boarding" | "both" | null;
  is_active?: boolean | null;
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
  const [roomOccupancies, setRoomOccupancies] = useState<RoomOccupancy[]>([]); // beläggning per rum
  const [selectedDay, setSelectedDay] = useState<string>("Måndag"); // för dagvis rumsvy

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
   * Rumsbeläggning per dag (Jordbruksverket-regler)
   * =========================== */
  const calculateRoomOccupancyForDay = useCallback(
    (dayName: string) => {
      if (!rooms.length || !dogs.length) return [];

      const occupancies: RoomOccupancy[] = [];

      rooms.forEach((room) => {
        // Hitta hundar som är i detta rum OCH går denna dag
        const dogsInRoomThisDay = dogs
          .filter((dog) => {
            if (dog.room_id !== room.id) return false;

            // Kolla om hunden går denna dag
            const dogDays = dog.days || "";
            const dayVariants = [
              dayName,
              dayName.slice(0, 3), // "Mån" etc
              dayName.toLowerCase(),
            ];
            return dayVariants.some((variant) => dogDays.includes(variant));
          })
          .map((dog) => ({
            ...dog,
            height_cm: dog.heightcm || dog.height_cm || 30,
            owner: dog.owners || dog.owner,
            weight_kg: dog.weight_kg || undefined, // konvertera null till undefined
          })) as any[]; // Cast för att undvika type-konflikt med RoomOccupancy

        // Beräkna erforderlig yta enligt Jordbruksverket
        const required_m2 = calculateRequiredArea(dogsInRoomThisDay as any);
        const total_capacity_m2 = room.capacity_m2 || room.capacity || 0;
        const available_m2 = Math.max(0, total_capacity_m2 - required_m2);
        const occupancy_percentage =
          total_capacity_m2 > 0
            ? Math.round((required_m2 / total_capacity_m2) * 100)
            : 0;

        const is_overcrowded = required_m2 > total_capacity_m2;
        const is_full = available_m2 < 2; // mindre än 2 m² kvar

        let compliance_status: "compliant" | "warning" | "violation" =
          "compliant";
        let compliance_message = "Rummet följer Jordbruksverkets regler";

        if (is_overcrowded) {
          compliance_status = "violation";
          compliance_message = `⚠️ ÖVERBELAGT! Behöver ${required_m2.toFixed(
            1
          )} m², har endast ${total_capacity_m2} m²`;
        } else if (is_full) {
          compliance_status = "warning";
          compliance_message = "Nästan fullt - begränsat utrymme kvar";
        }

        occupancies.push({
          room_id: room.id,
          room_name: room.name,
          total_capacity_m2,
          required_m2,
          available_m2,
          occupancy_percentage,
          is_overcrowded,
          is_full,
          dogs_present: dogsInRoomThisDay as any,
          dogs_count: dogsInRoomThisDay.length,
          max_additional_dogs: 0, // kan beräknas vid behov
          compliance_status,
          compliance_message,
        });
      });

      return occupancies;
    },
    [rooms, dogs]
  );

  // Uppdatera rumsbeläggning när dag, rum eller hundar ändras
  useEffect(() => {
    if (currentView === "rooms") {
      const occupancies = calculateRoomOccupancyForDay(selectedDay);
      setRoomOccupancies(occupancies);
    }
  }, [selectedDay, rooms, dogs, currentView, calculateRoomOccupancyForDay]);

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
  return (
    <>
      {/* ======= STYLES (moderniserad design) ======= */}
      <style jsx>{`
        :root {
          --primary-green: #2c7a4c;
          --light-green: rgba(44, 122, 76, 0.1);
          --success-green: #28a745;
        }
        .dagis-header {
          background: rgba(255, 255, 255, 0.95);
          border: 1px solid rgba(44, 122, 76, 0.2);
          border-radius: 8px;
          padding: 12px 16px;
          margin: 20px 0 16px;
          display: flex;
          align-items: center;
          justify-content: space-between;
        }
        .back-btn {
          color: var(--primary-green);
          text-decoration: none;
          padding: 8px 12px;
          border-radius: 6px;
          border: 1px solid transparent;
          font-weight: 500;
          transition: all 0.2s;
        }
        .back-btn:hover {
          background: var(--light-green);
          border-color: var(--primary-green);
        }

        .dagis-hero {
          text-align: center;
          padding: 80px 20px 110px 20px;
          background: linear-gradient(
              rgba(44, 122, 76, 0.88),
              rgba(44, 122, 76, 0.88)
            ),
            url("/Hero.jpeg") center/cover no-repeat;
          color: #fff;
          margin-bottom: 0;
          position: relative;
          overflow: visible;
        }
        .dagis-hero h1 {
          font-size: 3rem;
          font-weight: 800;
          margin-bottom: 12px;
          letter-spacing: -0.02em;
        }
        .dagis-hero p {
          opacity: 0.95;
          font-size: 1.125rem;
          max-width: 700px;
          margin: 0 auto 32px;
          line-height: 1.6;
        }

        .live-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));
          gap: 16px;
          max-width: 1200px;
          margin: 0 auto;
          position: relative;
          z-index: 10;
        }
        .live-card {
          background: rgba(255, 255, 255, 0.97);
          border: 1px solid rgba(44, 122, 76, 0.1);
          border-radius: 12px;
          padding: 20px 16px;
          min-height: 110px;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          user-select: none;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
        }
        .live-card:hover {
          background: white;
          border-color: #2c7a4c;
          transform: translateY(-4px);
          box-shadow: 0 8px 24px rgba(44, 122, 76, 0.15);
        }
        .live-card:active {
          transform: translateY(-2px);
        }
        .live-value {
          font-size: 2.5rem;
          font-weight: 800;
          color: #2c7a4c;
          line-height: 1;
          margin-bottom: 8px;
        }
        .live-label {
          font-size: 0.875rem;
          font-weight: 500;
          color: #333;
          text-align: center;
          line-height: 1.3;
        }

        .controls {
          background: white;
          border: 1px solid rgba(44, 122, 76, 0.15);
          border-radius: 12px;
          padding: 20px;
          margin-bottom: 20px;
          display: flex;
          gap: 16px;
          justify-content: space-between;
          align-items: center;
          flex-wrap: wrap;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
        }
        .controls .left,
        .controls .right {
          display: flex;
          gap: 12px;
          align-items: center;
          flex-wrap: wrap;
        }
        .input,
        .select {
          padding: 10px 14px;
          border: 2px solid rgba(44, 122, 76, 0.2);
          border-radius: 8px;
          background: #fff;
          min-width: 220px;
          font-size: 0.9375rem;
          transition: all 0.2s;
        }
        .input:focus,
        .select:focus {
          outline: none;
          border-color: #2c7a4c;
          box-shadow: 0 0 0 3px rgba(44, 122, 76, 0.1);
        }
        .btn {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 10px 16px;
          border-radius: 8px;
          font-weight: 600;
          cursor: pointer;
          border: none;
          text-decoration: none;
          transition: all 0.2s;
        }
        .btn-primary {
          background: var(--primary-green);
          color: white;
        }
        .btn-primary:hover {
          background: #236139;
        }
        .btn-secondary {
          background: white;
          color: var(--primary-green);
          border: 2px solid var(--primary-green);
        }
        .btn-secondary:hover {
          background: rgba(44, 122, 76, 0.05);
        }
        .btn-ghost {
          background: #f3f4f6;
          color: #374151;
        }
        .btn-ghost:hover {
          background: #e5e7eb;
        }
        .btn:hover {
          transform: translateY(-1px);
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
        }

        .panel {
          background: white;
          border: 1px solid rgba(44, 122, 76, 0.15);
          border-radius: 12px;
          padding: 16px;
          margin-bottom: 20px;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
        }

        .table-wrap {
          background: white;
          border: 1px solid rgba(44, 122, 76, 0.15);
          border-radius: 12px;
          overflow: hidden;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
        }
        .tbl {
          width: 100%;
          border-collapse: collapse;
        }
        .tbl thead th {
          background: var(--primary-green);
          color: white;
          padding: 14px 16px;
          text-align: left;
          font-weight: 600;
          font-size: 0.9375rem;
        }
        .tbl tbody td {
          padding: 12px 16px;
          border-bottom: 1px solid rgba(0, 0, 0, 0.05);
          font-size: 0.9375rem;
        }
        .tbl tbody tr:nth-child(even) {
          background: rgba(44, 122, 76, 0.02);
        }
        .tbl tbody tr:hover {
          background: rgba(44, 122, 76, 0.05);
          transition: background 0.2s;
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
            grid-template-columns: repeat(3, 1fr);
          }
        }
        @media (max-width: 700px) {
          .dagis-hero {
            padding: 60px 20px 100px 20px;
          }
          .dagis-hero h1 {
            font-size: 2rem;
          }
          .live-grid {
            grid-template-columns: repeat(2, 1fr);
            gap: 12px;
          }
          .live-card {
            min-height: 100px;
            padding: 16px 12px;
          }
          .live-value {
            font-size: 2rem;
          }
          .live-label {
            font-size: 0.75rem;
          }
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
        <div className="min-h-screen bg-gradient-to-br from-green-50 to-white">
          {/* Header */}
          <header className="dagis-header max-w-7xl mx-auto">
            <Link className="back-btn" href="/dashboard">
              ← Tillbaka
            </Link>
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <span>Hunddagis</span>
            </div>
          </header>

          {/* Hero + livekort */}
          <section className="dagis-hero">
            <h1>Hunddagis</h1>
            <p>Sammanställning, statistik och hantering av dagishundar.</p>
          </section>

          {/* Main content with floating live cards */}
          <div className="max-w-7xl mx-auto px-6 -mt-16 relative z-20">
            {/* Live boxes - floating over hero */}
            <div className="live-grid">
              {/* 1. Dagishundar */}
              <div
                className="live-card"
                onClick={() => setCurrentView("all")}
                title="Alla registrerade dagishundar"
              >
                <div className="live-value">{live.dagishundar}</div>
                <div className="live-label">Dagishundar</div>
              </div>

              {/* 2. Promenader (inne idag) */}
              <div
                className="live-card"
                onClick={() => setCurrentView("all")}
                title="Hundar incheckade idag"
              >
                <div className="live-value">{live.promenaderIdag}</div>
                <div className="live-label">Promenader</div>
              </div>

              {/* 3. Intresseanmälningar */}
              <div
                className="live-card cursor-pointer"
                onClick={() =>
                  (window.location.href = "/hunddagis/intresseanmalningar")
                }
                title="Nya intresseanmälningar denna månaden - Klicka för att se lista"
              >
                <div className="live-value">{live.intresseSenasteMån}</div>
                <div className="live-label">Intresseanmälningar</div>
              </div>

              {/* 4. Tjänster (kloklipp/tassklipp/bad) */}
              <div
                className="live-card cursor-pointer"
                onClick={() => setCurrentView("services")}
                title="Tjänster denna månaden - Klicka för att se checklista"
              >
                <div className="live-value">{live.tjänsterDennaMån}</div>
                <div className="live-label">Tjänster</div>
              </div>

              {/* 5. Hundrum */}
              <div
                className="live-card cursor-pointer"
                onClick={() => setCurrentView("rooms")}
                title="Antal rum & beläggning - Klicka för att se detaljer"
              >
                <div className="live-value">{live.hundrum}</div>
                <div className="live-label">Hundrum</div>
              </div>

              {/* 6. Mina priser */}
              <div
                className="live-card cursor-pointer"
                onClick={() => (window.location.href = "/hunddagis/priser")}
                title="Gå till prisinställningar"
              >
                <div className="live-value">€</div>
                <div className="live-label">Mina priser</div>
              </div>
            </div>

            {/* Primära knappar under liveboxarna */}
            <div className="flex flex-wrap gap-4 justify-center mt-6 mb-8">
              <Link
                href="/hunddagis/new"
                className="inline-flex items-center gap-2 px-6 py-3 bg-[#2c7a4c] text-white font-semibold rounded-lg hover:bg-[#236139] transition-all shadow-md hover:shadow-lg"
              >
                <Plus className="h-4 w-4" /> Ny hund
              </Link>
              <button
                onClick={exportPDF}
                className="inline-flex items-center gap-2 px-6 py-3 bg-white text-[#2c7a4c] font-semibold rounded-lg border-2 border-[#2c7a4c] hover:bg-green-50 transition-all shadow-md hover:shadow-lg"
              >
                <Download className="h-4 w-4" /> PDF-export
              </button>
              <button
                onClick={loadDogs}
                className="inline-flex items-center gap-2 px-6 py-3 bg-gray-100 text-gray-700 font-semibold rounded-lg hover:bg-gray-200 transition-all shadow-md"
              >
                <RefreshCcw className="h-4 w-4" /> Ladda om
              </button>
            </div>

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
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h3 className="text-xl font-bold text-[#2c7a4c] mb-1">
                      Tillvalstjänster denna månad
                    </h3>
                    <p className="text-sm text-gray-600">
                      Kloklipp, tassklipp och bad - markera när utfört
                    </p>
                  </div>
                </div>

                <div className="overflow-x-auto bg-white rounded-xl border">
                  <table className="w-full">
                    <thead className="bg-gray-50 border-b">
                      <tr>
                        <th className="text-left px-4 py-3 font-semibold text-gray-700">
                          Hund
                        </th>
                        <th className="text-left px-4 py-3 font-semibold text-gray-700">
                          Ägare
                        </th>
                        <th className="text-left px-4 py-3 font-semibold text-gray-700">
                          Tjänst
                        </th>
                        <th className="text-center px-4 py-3 font-semibold text-gray-700">
                          Status
                        </th>
                        <th className="text-left px-4 py-3 font-semibold text-gray-700">
                          Utförd av
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      {dogs
                        .filter((d) => {
                          // Filtrera hundar som har tillvalstjänster
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
                              .filter((e: any) =>
                                (e?.date || "").startsWith(ym)
                              )
                              .map((e: any) => e?.title || e?.type || "Tjänst");
                          } catch {}

                          const isChecked = !!serviceChecked[key];
                          const staffName = serviceChecked[key]
                            ? user?.user_metadata?.full_name || "Personal"
                            : "-";

                          return (
                            <tr key={d.id} className="hover:bg-gray-50">
                              <td className="px-4 py-3 font-medium">
                                {d.name}
                              </td>
                              <td className="px-4 py-3 text-gray-600">
                                {d.owners?.full_name || "-"}
                              </td>
                              <td className="px-4 py-3">
                                <div className="flex flex-wrap gap-1">
                                  {items.length
                                    ? items.map((item, idx) => (
                                        <span
                                          key={idx}
                                          className="inline-block px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded"
                                        >
                                          {item}
                                        </span>
                                      ))
                                    : "-"}
                                </div>
                              </td>
                              <td className="px-4 py-3 text-center">
                                <label className="inline-flex items-center gap-2 cursor-pointer">
                                  <input
                                    type="checkbox"
                                    className="w-5 h-5 text-green-600 rounded focus:ring-green-500"
                                    checked={isChecked}
                                    onChange={async () => {
                                      const next = !isChecked;
                                      // Uppdatera local state
                                      setServiceChecked((prev) => ({
                                        ...prev,
                                        [key]: next,
                                      }));

                                      // Försök spara i daycare_service_completions
                                      try {
                                        if (next) {
                                          // Markera som utförd
                                          const serviceData = {
                                            org_id:
                                              user?.user_metadata?.org_id ||
                                              null,
                                            dog_id: d.id,
                                            service_type: "kloklipp" as
                                              | "kloklipp"
                                              | "tassklipp"
                                              | "bad",
                                            scheduled_date: `${ym}-01`,
                                            completed_at:
                                              new Date().toISOString(),
                                            completed_by:
                                              user?.user_metadata?.full_name ||
                                              user?.email ||
                                              "Personal",
                                            notes: null,
                                          };

                                          await supabase
                                            .from("daycare_service_completions")
                                            .upsert(serviceData as any);
                                        } else {
                                          // Ta bort markering
                                          await supabase
                                            .from("daycare_service_completions")
                                            .delete()
                                            .eq("dog_id", d.id)
                                            .gte("scheduled_date", `${ym}-01`)
                                            .lt(
                                              "scheduled_date",
                                              `${ym.split("-")[0]}-${String(
                                                parseInt(ym.split("-")[1]) + 1
                                              ).padStart(2, "0")}-01`
                                            );
                                        }
                                      } catch (e) {
                                        console.warn(
                                          "Kunde inte spara i daycare_service_completions:",
                                          e
                                        );
                                      }
                                    }}
                                  />
                                  <span
                                    className={`text-sm font-medium ${
                                      isChecked
                                        ? "text-green-600"
                                        : "text-gray-500"
                                    }`}
                                  >
                                    {isChecked ? "✓ Utfört" : "Ej klart"}
                                  </span>
                                </label>
                              </td>
                              <td className="px-4 py-3 text-sm text-gray-600">
                                {staffName}
                              </td>
                            </tr>
                          );
                        })}
                      {dogs.filter((d) => {
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
                      }).length === 0 && (
                        <tr>
                          <td
                            colSpan={5}
                            className="px-4 py-8 text-center text-gray-500"
                          >
                            <CheckSquare className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                            <p className="font-medium mb-1">
                              Inga planerade tjänster denna månad
                            </p>
                            <p className="text-sm">
                              Tjänster läggs till via hundprofilen under
                              "Tilläggsabonnemang"
                            </p>
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>

                {/* Info */}
                <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                  <h4 className="font-semibold text-blue-800 mb-2">
                    💡 Så fungerar tjänster
                  </h4>
                  <ul className="text-sm text-blue-700 space-y-1">
                    <li>
                      • Tjänster läggs till via EditDogModal under
                      "Tilläggsabonnemang"
                    </li>
                    <li>
                      • Checkboxen sparar vem i personalen som utförde tjänsten
                    </li>
                    <li>
                      • Data sparas i daycare_service_completions tabellen
                    </li>
                  </ul>
                </div>
              </div>
            )}

            {/* Rumsvy med Jordbruksverket-beräkningar */}
            {currentView === "rooms" && (
              <div className="panel">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h3 className="text-xl font-bold text-[#2c7a4c] mb-1">
                      Rumsöversikt & Beläggning
                    </h3>
                    <p className="text-sm text-gray-600">
                      Beräkningar enligt Jordbruksverkets föreskrifter (SJVFS
                      2019:2)
                    </p>
                  </div>
                  <Link
                    href="/rooms"
                    className="inline-flex items-center gap-2 px-4 py-2 bg-[#2c7a4c] text-white rounded-lg hover:bg-[#236139] transition-all text-sm font-medium"
                  >
                    <Settings2 className="h-4 w-4" />
                    Hantera rum
                  </Link>
                </div>

                {/* Dagväljare */}
                <div className="mb-6 flex flex-wrap gap-2">
                  {[
                    "Måndag",
                    "Tisdag",
                    "Onsdag",
                    "Torsdag",
                    "Fredag",
                    "Lördag",
                    "Söndag",
                  ].map((day) => (
                    <button
                      key={day}
                      onClick={() => setSelectedDay(day)}
                      className={`px-4 py-2 rounded-lg font-medium transition-all ${
                        selectedDay === day
                          ? "bg-[#2c7a4c] text-white shadow-md"
                          : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                      }`}
                    >
                      {day}
                    </button>
                  ))}
                </div>

                {/* Rumskort */}
                {!rooms.length ? (
                  <div className="text-center py-12 bg-gray-50 rounded-xl border-2 border-dashed border-gray-300">
                    <Home className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                    <p className="text-gray-600 font-medium mb-2">
                      Inga rum hittades
                    </p>
                    <p className="text-sm text-gray-500 mb-4">
                      Skapa rum för att börja hantera beläggning
                    </p>
                    <Link
                      href="/rooms"
                      className="inline-flex items-center gap-2 px-4 py-2 bg-[#2c7a4c] text-white rounded-lg hover:bg-[#236139] transition-all text-sm font-medium"
                    >
                      <Plus className="h-4 w-4" />
                      Skapa rum
                    </Link>
                  </div>
                ) : (
                  <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {roomOccupancies.map((occ) => (
                      <div
                        key={occ.room_id}
                        className={`bg-white rounded-xl p-5 border-2 transition-all ${
                          occ.compliance_status === "violation"
                            ? "border-red-300 bg-red-50"
                            : occ.compliance_status === "warning"
                            ? "border-yellow-300 bg-yellow-50"
                            : "border-green-200 hover:border-green-300"
                        }`}
                      >
                        {/* Rumshuvud */}
                        <div className="flex items-start justify-between mb-4">
                          <div className="flex-1">
                            <h4 className="font-bold text-lg text-gray-900 mb-1">
                              {occ.room_name}
                            </h4>
                            <div className="flex items-center gap-2 text-sm text-gray-600">
                              <span>{occ.total_capacity_m2} m²</span>
                              <span>•</span>
                              <span>{occ.dogs_count} hundar</span>
                            </div>
                          </div>
                          {occ.compliance_status === "violation" ? (
                            <AlertTriangle className="h-6 w-6 text-red-500" />
                          ) : occ.compliance_status === "warning" ? (
                            <AlertTriangle className="h-6 w-6 text-yellow-500" />
                          ) : (
                            <CheckCircle className="h-6 w-6 text-green-500" />
                          )}
                        </div>

                        {/* Beläggningsbar */}
                        <div className="mb-4">
                          <div className="flex items-center justify-between text-sm mb-2">
                            <span className="text-gray-600">Beläggning</span>
                            <span
                              className={`font-bold ${
                                occ.occupancy_percentage > 100
                                  ? "text-red-600"
                                  : occ.occupancy_percentage > 90
                                  ? "text-yellow-600"
                                  : "text-green-600"
                              }`}
                            >
                              {occ.occupancy_percentage}%
                            </span>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
                            <div
                              className={`h-3 rounded-full transition-all ${
                                occ.occupancy_percentage > 100
                                  ? "bg-red-500"
                                  : occ.occupancy_percentage > 90
                                  ? "bg-yellow-500"
                                  : "bg-green-500"
                              }`}
                              style={{
                                width: `${Math.min(
                                  occ.occupancy_percentage,
                                  100
                                )}%`,
                              }}
                            ></div>
                          </div>
                        </div>

                        {/* Yt-information */}
                        <div className="bg-white rounded-lg p-3 mb-4 space-y-2 text-sm">
                          <div className="flex justify-between">
                            <span className="text-gray-600">
                              Erforderlig yta:
                            </span>
                            <span className="font-semibold">
                              {occ.required_m2.toFixed(1)} m²
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-600">
                              Tillgänglig yta:
                            </span>
                            <span
                              className={`font-semibold ${
                                occ.available_m2 < 0
                                  ? "text-red-600"
                                  : occ.available_m2 < 2
                                  ? "text-yellow-600"
                                  : "text-green-600"
                              }`}
                            >
                              {occ.available_m2.toFixed(1)} m²
                            </span>
                          </div>
                        </div>

                        {/* Status-meddelande */}
                        <div
                          className={`text-xs font-medium p-2 rounded-lg mb-4 ${
                            occ.compliance_status === "violation"
                              ? "bg-red-100 text-red-800"
                              : occ.compliance_status === "warning"
                              ? "bg-yellow-100 text-yellow-800"
                              : "bg-green-100 text-green-800"
                          }`}
                        >
                          {occ.compliance_message}
                        </div>

                        {/* Hundlista */}
                        <div className="border-t pt-3">
                          <div className="text-xs font-semibold text-gray-500 uppercase mb-2">
                            Hundar {selectedDay}:
                          </div>
                          {occ.dogs_present.length > 0 ? (
                            <ul className="space-y-1">
                              {occ.dogs_present.map((dog) => (
                                <li
                                  key={dog.id}
                                  className="text-sm flex items-center justify-between py-1"
                                >
                                  <span className="font-medium">
                                    {dog.name}
                                  </span>
                                  <span className="text-xs text-gray-500">
                                    {(dog as any).height_cm || "?"}cm
                                  </span>
                                </li>
                              ))}
                            </ul>
                          ) : (
                            <p className="text-sm text-gray-500 italic">
                              Inga hundar denna dag
                            </p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Hjälpinfo */}
                <div className="mt-6 bg-blue-50 border border-blue-200 rounded-xl p-4">
                  <div className="flex gap-3">
                    <Info className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
                    <div className="text-sm text-blue-900">
                      <p className="font-semibold mb-2">
                        Jordbruksverkets regler för inomhusrum:
                      </p>
                      <ul className="space-y-1 text-xs">
                        <li>
                          • Grundyta för största hunden + tillägg per
                          ytterligare hund
                        </li>
                        <li>• Mindre än 25 cm: 2 m² + 1 m² per extra hund</li>
                        <li>• 25-35 cm: 2 m² + 1,5 m² per extra hund</li>
                        <li>• 36-45 cm: 2,5 m² + 1,5 m² per extra hund</li>
                        <li>• 46-55 cm: 3,5 m² + 2 m² per extra hund</li>
                        <li>• 56-65 cm: 4,5 m² + 2,5 m² per extra hund</li>
                        <li>• Över 65 cm: 5,5 m² + 3 m² per extra hund</li>
                      </ul>
                    </div>
                  </div>
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
                  Denna sektion försöker läsa från <code>applications</code>{" "}
                  eller <code>interests</code>. Om den databasen inte finns än
                  visas endast totalen i livekorten. {live.intresseSenasteMån}{" "}
                  st den här månaden.
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
                        headerCell(
                          "subscription",
                          COLUMN_LABELS["subscription"]
                        )}
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
                          className={`border-t hover:bg-green-50 ${rowColor(
                            d
                          )}`}
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
                                ? new Date(d.enddate).toLocaleDateString(
                                    "sv-SE"
                                  )
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
        </div>
      )}
    </>
  );
}
