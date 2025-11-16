"use client";

import React, {
  useEffect,
  useState,
  useCallback,
  useMemo,
  useRef,
} from "react";
import Link from "next/link";
import Image from "next/image";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/app/context/AuthContext";

import {
  Download,
  Plus,
  Settings2,
  RefreshCcw,
  Home,
  AlertTriangle,
  Search,
} from "lucide-react";

import EditDogModal from "@/components/EditDogModal";
import TjansterView from "@/components/TjansterView";
import HundrumView from "@/components/HundrumView";

/* ===========================
 * Types & Constants
 * =========================== */
const ERROR_CODES = {
  DATABASE_CONNECTION: "[ERR-1001]",
  PDF_EXPORT: "[ERR-2001]",
  REALTIME: "[ERR-3001]",
  VALIDATION: "[ERR-4001]",
} as const;

type Owner = {
  id: string;
  full_name: string | null;
  phone: string | null;
  email: string | null;
  address: string | null;
  postal_code: string | null;
  city: string | null;
  customer_number: number | null;
  contact_person_2: string | null;
  contact_phone_2: string | null;
  personnummer: string | null;
  notes: string | null;
  gdpr_consent: boolean | null;
  marketing_consent: boolean | null;
  photo_consent: boolean | null;
  org_id: string;
  created_at: string;
  updated_at: string;
};

type Dog = {
  id: string;
  name: string;
  breed: string | null;
  heightcm: number | null;
  birth: string | null;
  gender: "hane" | "tik" | null;
  subscription: string | null;
  startdate: string | null;
  enddate: string | null;
  days: string | null;
  room_id: string | null;
  owner_id: string | null;
  org_id: string | null;
  vaccdhp: string | null;
  vaccpi: string | null;
  photo_url: string | null;
  insurance_company: string | null;
  insurance_number: string | null;
  allergies: string | null;
  medications: string | null;
  special_needs: string | null;
  behavior_notes: string | null;
  food_info: string | null;
  is_castrated: boolean | null;
  is_house_trained: boolean | null;
  is_escape_artist: boolean | null;
  destroys_things: boolean | null;
  can_be_with_other_dogs: boolean | null;
  in_heat: boolean | null;
  heat_start_date: string | null;
  checked_in: boolean | null;
  checkin_date: string | null;
  checkout_date: string | null;
  notes: string | null;
  waitlist: boolean | null;
  events: any | null;
  created_at: string | null;
  updated_at: string | null;
  owners?: Owner | null;
  owner?: Owner | null;
};

type Room = {
  id: string;
  name: string;
  capacity_m2: number | null;
  room_type: "daycare" | "boarding" | "both" | null;
  max_dogs: number | null;
  notes: string | null;
  is_active: boolean | null;
  org_id: string | null;
  created_at: string | null;
  updated_at: string | null;
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

const DEFAULT_COLUMNS = [
  "photo",
  "name",
  "breed",
  "owner",
  "phone",
  "subscription",
  "days",
  "room_id",
  "vaccdhp",
  "vaccpi",
];

const ALL_COLUMNS = [
  "photo",
  "name",
  "breed",
  "gender",
  "heightcm",
  "birth",
  "owner",
  "customer_number",
  "personnummer",
  "phone",
  "email",
  "address",
  "contact_person_2",
  "contact_phone_2",
  "subscription",
  "days",
  "startdate",
  "enddate",
  "room_id",
  "insurance_company",
  "insurance_number",
  "vaccdhp",
  "vaccpi",
  "is_castrated",
  "destroys_things",
  "is_house_trained",
  "food_info",
  "notes",
  "waitlist",
];

const COLUMN_LABELS: Record<string, string> = {
  photo: "Foto",
  name: "Hund ▲",
  breed: "Ras",
  gender: "Kön",
  heightcm: "Mankhöjd (cm)",
  birth: "Födelsedatum",
  owner: "Ägare",
  customer_number: "Kundnummer",
  personnummer: "Personnummer",
  phone: "Telefon",
  email: "E-post",
  address: "Adress",
  contact_person_2: "Kontaktperson 2",
  contact_phone_2: "Kontakt 2 telefon",
  subscription: "Abonnemang",
  days: "Veckodagar",
  startdate: "Startdatum",
  enddate: "Slutdatum",
  room_id: "Rum",
  insurance_company: "Försäkringsbolag",
  insurance_number: "Försäkringsnummer",
  vaccdhp: "Vacc. DHP",
  vaccpi: "Vacc. Pi",
  is_castrated: "Kasterad/Steriliserad",
  destroys_things: "Biter på saker",
  is_house_trained: "Rumsren",
  food_info: "Foder",
  notes: "Anteckningar",
  waitlist: "Väntelista",
};

export default function HunddagisPage() {
  const { user, currentOrgId, ensureOrg } = useAuth();
  // Fallback: använd org från user_metadata om AuthContext inte hunnit sätta currentOrgId ännu
  const effectiveOrgId =
    currentOrgId || (user as any)?.user_metadata?.org_id || null;
  const [dogs, setDogs] = useState<Dog[]>([]);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterMonth, setFilterMonth] = useState("all");
  const [filterSubscription, setFilterSubscription] = useState("all");
  const [sortKey, setSortKey] = useState<SortKey>("name");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");
  const [columns, setColumns] = useState<string[]>(DEFAULT_COLUMNS);
  const [selectedDog, setSelectedDog] = useState<Dog | null>(null);
  const [showColumnSettings, setShowColumnSettings] = useState(false);
  const [showAddDogModal, setShowAddDogModal] = useState(false);

  // Ref för kolumninställningar dropdown
  const columnSettingsRef = useRef<HTMLDivElement>(null);

  // Debug logging function
  const logDebug = useCallback((level: string, message: string, data?: any) => {
    const timestamp = new Date().toISOString();
    console.log(
      `[${timestamp}] [${level.toUpperCase()}] ${message}`,
      data || ""
    );
  }, []);

  // Fetch data functions
  const fetchDogs = useCallback(async () => {
    if (!effectiveOrgId) {
      console.warn("⚠️ fetchDogs: currentOrgId is null/undefined");
      return;
    }

    try {
      console.log("🔍 fetchDogs: Fetching with orgId:", effectiveOrgId);
      logDebug("info", "Hämtar hundar från Supabase...");

      const { data: dogsData, error: dogsError } = await supabase
        .from("dogs")
        .select(
          `
          *,
          owners (
            id,
            full_name,
            phone,
            email,
            customer_number,
            personnummer,
            address,
            postal_code,
            city,
            contact_person_2,
            contact_phone_2
          )
        `
        )
        .eq("org_id", effectiveOrgId)
        .order("name");

      const firstDog = dogsData?.[0] as any;
      console.log("📊 fetchDogs: Query result:", {
        count: dogsData?.length || 0,
        error: dogsError,
        currentOrgId: effectiveOrgId,
        sample: firstDog
          ? {
              id: firstDog.id,
              name: firstDog.name,
              org_id: firstDog.org_id,
            }
          : null,
      });

      if (dogsError) {
        logDebug(
          "error",
          `${ERROR_CODES.DATABASE_CONNECTION} Fel vid hämtning av hundar`,
          dogsError
        );
        setError(`Fel vid hämtning av hundar: ${dogsError.message}`);
        return;
      }

      // ✅ KRITISK FIX: Djup kopia av hela objektet för att förhindra delad referens
      // När flera hundar har samma owner_id skulle de dela owner-objektet i minnet
      const dogsWithUniqueOwners = (dogsData || []).map((dog: any) =>
        JSON.parse(JSON.stringify(dog))
      );

      setDogs(dogsWithUniqueOwners);
      logDebug("success", `Hämtade ${dogsWithUniqueOwners.length} hundar`);
    } catch (err: any) {
      logDebug(
        "error",
        `${ERROR_CODES.DATABASE_CONNECTION} Oväntat fel vid hämtning av hundar`,
        err
      );
      setError("Ett oväntat fel inträffade vid hämtning av hundar");
    }
  }, [effectiveOrgId, logDebug]);

  const fetchRooms = useCallback(async () => {
    if (!effectiveOrgId) return;

    try {
      const { data: roomsData, error: roomsError } = await supabase
        .from("rooms")
        .select("*")
        .eq("org_id", effectiveOrgId)
        .eq("is_active", true)
        .order("name");

      if (roomsError) {
        logDebug(
          "error",
          `${ERROR_CODES.DATABASE_CONNECTION} Fel vid hämtning av rum`,
          roomsError
        );
        return;
      }

      setRooms((roomsData as any as Room[]) || []);
      logDebug("success", `Hämtade ${roomsData?.length || 0} rum`);
    } catch (err: any) {
      logDebug(
        "error",
        `${ERROR_CODES.DATABASE_CONNECTION} Oväntat fel vid hämtning av rum`,
        err
      );
    }
  }, [effectiveOrgId, logDebug]);

  // Filter and sort functions
  const filteredAndSortedDogs = useMemo(() => {
    let filtered = dogs.filter((dog) => {
      const matchesSearch =
        dog.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        dog.breed?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        dog.owners?.full_name
          ?.toLowerCase()
          .includes(searchTerm.toLowerCase()) ||
        dog.owners?.phone?.includes(searchTerm) ||
        dog.subscription?.toLowerCase().includes(searchTerm.toLowerCase());

      // Ny filterlogik för Våra hundar / Tjänster / Väntelistan
      const matchesView =
        filterSubscription === "all" ||
        (filterSubscription === "services" && dog.subscription) ||
        (filterSubscription === "vantelista" && !dog.subscription);

      const matchesMonth =
        filterMonth === "all" ||
        (() => {
          if (!dog.startdate) return false;
          const startMonth = new Date(dog.startdate).getMonth();
          return startMonth.toString() === filterMonth;
        })();

      return matchesSearch && matchesView && matchesMonth;
    });

    // Sort
    filtered.sort((a, b) => {
      let aValue: any = a[sortKey as keyof Dog];
      let bValue: any = b[sortKey as keyof Dog];

      if (sortKey === "owner") {
        aValue = a.owners?.full_name || "";
        bValue = b.owners?.full_name || "";
      } else if (sortKey === "phone") {
        aValue = a.owners?.phone || "";
        bValue = b.owners?.phone || "";
      }

      if (typeof aValue === "string" && typeof bValue === "string") {
        return sortOrder === "asc"
          ? aValue.localeCompare(bValue)
          : bValue.localeCompare(aValue);
      }

      if (aValue < bValue) return sortOrder === "asc" ? -1 : 1;
      if (aValue > bValue) return sortOrder === "asc" ? 1 : -1;
      return 0;
    });

    return filtered;
  }, [dogs, searchTerm, filterSubscription, filterMonth, sortKey, sortOrder]);

  // Setup subscriptions and fetch data
  useEffect(() => {
    if (!effectiveOrgId) {
      const timer = setTimeout(() => {
        setLoading(false);
        if (!user) {
          setError("Ingen användare inloggad");
        } else if (!effectiveOrgId) {
          setError("Ingen organisation tilldelad användaren");
        }
      }, 3000);

      return () => clearTimeout(timer);
    }

    const loadData = async () => {
      setLoading(true);
      setError(null);
      await Promise.all([fetchDogs(), fetchRooms()]);
      setLoading(false);
    };

    loadData();
  }, [effectiveOrgId, fetchDogs, fetchRooms]);

  // Real-time subscriptions
  useEffect(() => {
    if (!effectiveOrgId) return;

    const dogsSubscription = supabase
      .channel("dogs_changes")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "dogs",
          filter: `org_id=eq.${effectiveOrgId}`,
        },
        () => {
          logDebug("info", "Hundar uppdaterade via realtime");
          fetchDogs();
        }
      )
      .subscribe();

    const roomsSubscription = supabase
      .channel("rooms_changes")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "rooms",
          filter: `org_id=eq.${effectiveOrgId}`,
        },
        () => {
          logDebug("info", "Rum uppdaterade via realtime");
          fetchRooms();
        }
      )
      .subscribe();

    // ✅ KRITISK FIX: Lyssna också på owners-tabellen
    // När ägarinfo ändras måste hundlistan uppdateras för att visa rätt owner
    const ownersSubscription = supabase
      .channel("owners_changes")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "owners",
          filter: `org_id=eq.${effectiveOrgId}`,
        },
        () => {
          logDebug("info", "Ägare uppdaterade via realtime - refreshar hundar");
          fetchDogs(); // Hämta hundar igen för att få nya owner-relationer
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(dogsSubscription);
      supabase.removeChannel(roomsSubscription);
      supabase.removeChannel(ownersSubscription);
    };
  }, [effectiveOrgId, fetchDogs, fetchRooms, logDebug]);

  // Stäng kolumninställningar när man klickar utanför
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        columnSettingsRef.current &&
        !columnSettingsRef.current.contains(event.target as Node)
      ) {
        setShowColumnSettings(false);
      }
    }

    // Lägg till event listener när menyn är öppen
    if (showColumnSettings) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    // Cleanup
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [showColumnSettings]);

  const handleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortKey(key);
      setSortOrder("asc");
    }
  };

  const exportToPDF = async () => {
    try {
      logDebug("info", "Exporterar till PDF...");

      const response = await fetch("/api/pdf", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "dagishundar",
          data: filteredAndSortedDogs,
          columns,
        }),
      });

      if (!response.ok) {
        throw new Error("PDF-export misslyckades");
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `dagishundar-${new Date().toISOString().split("T")[0]}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);

      logDebug("success", "PDF exporterad framgångsrikt");
    } catch (err: any) {
      logDebug(
        "error",
        `${ERROR_CODES.PDF_EXPORT} PDF-export misslyckades`,
        err
      );
      setError("PDF-export misslyckades");
    }
  };

  const getRoomName = (roomId: string | null) => {
    if (!roomId) return "Ej tilldelad";
    const room = rooms.find((r) => r.id === roomId);
    return room?.name || "Okänt rum";
  };

  const formatDays = (days: string | null) => {
    const allDays = ["Måndag", "Tisdag", "Onsdag", "Torsdag", "Fredag"];
    const dayLabels = ["M", "T", "O", "T", "F"];

    if (!days) {
      // Visa alla dagar i ljusgrått när inga dagar är valda
      return (
        <div className="flex gap-1">
          {dayLabels.map((label, idx) => (
            <span key={idx} className="text-gray-300 font-medium">
              {label}
            </span>
          ))}
        </div>
      );
    }

    // Normalisera dagsnamn (hantera både svenska och engelska)
    const dayMap: Record<string, string> = {
      Måndag: "Måndag",
      Tisdag: "Tisdag",
      Onsdag: "Onsdag",
      Torsdag: "Torsdag",
      Fredag: "Fredag",
      Monday: "Måndag",
      Tuesday: "Tisdag",
      Wednesday: "Onsdag",
      Thursday: "Torsdag",
      Friday: "Fredag",
    };

    const activeDays = days
      .split(",")
      .map((day) => dayMap[day.trim()])
      .filter(Boolean);

    return (
      <div className="flex gap-1">
        {allDays.map((day, idx) => {
          const isActive = activeDays.includes(day);
          return (
            <span
              key={idx}
              className={`font-medium ${
                isActive ? "text-[#2c7a4c]" : "text-gray-300"
              }`}
            >
              {dayLabels[idx]}
            </span>
          );
        })}
      </div>
    );
  };

  // Render all weekdays with active ones highlighted
  const renderWeekdays = (dogDays: string | null) => {
    const allDays = ["M", "T", "O", "T", "F"];
    const activeDays = dogDays
      ? dogDays.split(",").map((d) => {
          const trimmed = d.trim();
          // Map to single letter
          if (trimmed === "Måndag" || trimmed === "Monday") return "M";
          if (trimmed === "Tisdag" || trimmed === "Tuesday") return "T";
          if (trimmed === "Onsdag" || trimmed === "Wednesday") return "O";
          if (trimmed === "Torsdag" || trimmed === "Thursday") return "T";
          if (trimmed === "Fredag" || trimmed === "Friday") return "F";
          return trimmed.charAt(0);
        })
      : [];

    return (
      <div className="flex items-center gap-2">
        {allDays.map((day, index) => {
          const isActive = activeDays.includes(day);
          // For duplicate "T", check both Tuesday and Thursday
          const isDuplicateT = day === "T";
          const isTuesday =
            index === 1 &&
            activeDays.some(
              (d, i) => d === "T" && dogDays?.split(",")[i]?.includes("isdag")
            );
          const isThursday =
            index === 3 &&
            activeDays.some(
              (d, i) => d === "T" && dogDays?.split(",")[i]?.includes("orsdag")
            );

          const shouldHighlight = isDuplicateT
            ? (index === 1 && isTuesday) || (index === 3 && isThursday)
            : isActive;

          return (
            <span
              key={`${day}-${index}`}
              className={`text-sm font-medium ${
                shouldHighlight ? "text-[#2c7a4c]" : "text-gray-300"
              }`}
            >
              {day}
            </span>
          );
        })}
      </div>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#2c7a4c] mx-auto mb-4"></div>
          <p className="text-gray-600">Laddar hunddagis...</p>
          {!user && (
            <p className="text-red-600 mt-2">Ingen användare inloggad</p>
          )}
          {user && !currentOrgId && (
            <p className="text-red-600 mt-2">Ingen organisation tilldelad</p>
          )}
        </div>
      </div>
    );
  }

  // Om användaren saknar organisation efter att loading är klart
  if (user && !effectiveOrgId) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="text-center max-w-md">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-[#2c7a4c] mx-auto mb-4"></div>
          <p className="text-gray-700 font-medium">
            Ingen organisation kopplad till ditt konto än.
          </p>
          <p className="text-gray-500 text-sm mt-1">
            Klicka nedan för att skapa/fästa en organisation till ditt konto.
            Detta sker automatiskt nästa gång också.
          </p>
          <button
            onClick={async () => {
              try {
                await ensureOrg();
                window.location.reload();
              } catch {}
            }}
            className="mt-4 inline-flex items-center px-4 py-2 rounded-md text-sm font-medium text-white bg-[#2c7a4c] hover:bg-[#236139]"
          >
            Skapa organisation nu
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header med titel och statistik - KOMPAKT som bild 2 */}
      <div className="border-b border-gray-200 bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <h1 className="text-[32px] font-bold text-[#2c7a4c] leading-tight">
                Hunddagis
              </h1>
              <p className="mt-1 text-base text-gray-600">
                Dagens sammanställning – Sök, filtrera och hantera dina hundar
              </p>
            </div>

            {/* Statistik inline höger - Små kompakta boxar */}
            <div className="flex items-center gap-4 ml-8">
              <div className="text-center bg-white rounded-lg px-4 py-2 border border-gray-200 shadow-sm">
                <p className="text-2xl font-bold text-[#2c7a4c]">
                  {dogs.filter((d) => d.subscription).length}
                </p>
                <p className="text-xs text-gray-600 mt-0.5">Antagna hundar</p>
              </div>
              <div className="text-center bg-white rounded-lg px-4 py-2 border border-gray-200 shadow-sm">
                <p className="text-2xl font-bold text-orange-600">
                  {dogs.filter((d) => !d.subscription).length}
                </p>
                <p className="text-xs text-gray-600 mt-0.5">Väntelista</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content Area - KOMPAKT padding */}
      <div className="max-w-7xl mx-auto px-6 py-6">
        {/* Action Buttons Row - ENLIGT STILGUIDE: rounded-md, shadow-sm */}
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center space-x-3">
            <button
              onClick={() => setShowAddDogModal(true)}
              className="inline-flex items-center px-4 py-2.5 rounded-md text-[15px] font-semibold text-white bg-[#2c7a4c] hover:bg-[#236139] shadow-sm transition-colors focus:outline-none focus:ring-2 focus:ring-[#2c7a4c] focus:ring-offset-2"
            >
              <Plus className="h-4 w-4 mr-2" />
              Ny hund
            </button>
            <button
              onClick={exportToPDF}
              className="inline-flex items-center px-4 py-2.5 rounded-md text-[15px] font-semibold text-white bg-gray-500 hover:bg-gray-600 shadow-sm transition-colors focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
            >
              <Download className="h-4 w-4 mr-2" />
              PDF-export
            </button>
            <button
              onClick={() => {
                fetchDogs();
                fetchRooms();
              }}
              className="inline-flex items-center px-4 py-2.5 rounded-md text-[15px] font-semibold bg-white text-[#2c7a4c] border border-[#2c7a4c] hover:bg-[#E6F4EA] shadow-sm transition-colors focus:outline-none focus:ring-2 focus:ring-[#2c7a4c] focus:ring-offset-2"
            >
              <RefreshCcw className="h-4 w-4 mr-2" />
              Ladda om
            </button>
          </div>
        </div>

        {/* Search and Filter Row - ENLIGT STILGUIDE */}
        <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-4 mb-6">
          <div className="flex flex-row items-center space-x-4">
            {/* Sökruta - stilguide: h-10, rounded-md */}
            <div className="flex-1 min-w-[400px]">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Sök på hundnamn, ägarnamn, telefon, ras..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full h-10 pl-10 pr-4 text-base border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#2c7a4c] focus:border-transparent"
                />
              </div>
            </div>

            {/* Filter dropdowns - stilguide: h-10, rounded-md */}
            <div className="flex space-x-3 items-center">
              <select
                value={filterSubscription}
                onChange={(e) => setFilterSubscription(e.target.value)}
                className="h-10 px-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#2c7a4c] focus:border-transparent text-base whitespace-nowrap"
              >
                <option value="all">Våra hundar</option>
                <option value="services">Tjänster</option>
                <option value="hundrum">Hundrum</option>
                <option value="vantelista">Väntelistan</option>
              </select>

              <select
                value={filterMonth}
                onChange={(e) => setFilterMonth(e.target.value)}
                className="h-10 px-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#2c7a4c] focus:border-transparent text-base whitespace-nowrap"
              >
                <option value="all">Alla månader</option>
                <option value="0">Januari</option>
                <option value="1">Februari</option>
                <option value="2">Mars</option>
                <option value="3">April</option>
                <option value="4">Maj</option>
                <option value="5">Juni</option>
                <option value="6">Juli</option>
                <option value="7">Augusti</option>
                <option value="8">September</option>
                <option value="9">Oktober</option>
                <option value="10">November</option>
                <option value="11">December</option>
              </select>

              {/* Kolumner knapp - stilguide: outline variant */}
              <div className="relative" ref={columnSettingsRef}>
                <button
                  onClick={() => setShowColumnSettings(!showColumnSettings)}
                  className="inline-flex items-center h-10 px-4 rounded-md text-[15px] font-semibold bg-white text-[#2c7a4c] border border-[#2c7a4c] hover:bg-[#E6F4EA] shadow-sm transition-colors focus:outline-none focus:ring-2 focus:ring-[#2c7a4c] focus:ring-offset-2"
                >
                  <Settings2 className="h-4 w-4 mr-2" />
                  Kolumner
                </button>

                {/* Dropdown meny för kolumner */}
                {showColumnSettings && (
                  <div className="absolute right-0 mt-2 w-80 bg-white rounded-lg shadow-xl border border-gray-200 z-50 max-h-[500px] overflow-y-auto">
                    <div className="p-4">
                      <div className="flex items-center justify-between mb-3 pb-2 border-b">
                        <p className="text-sm font-semibold text-gray-900">
                          Dölj/visa kolumner
                        </p>
                        <button
                          onClick={() => setShowColumnSettings(false)}
                          className="text-gray-400 hover:text-gray-600"
                        >
                          ✕
                        </button>
                      </div>
                      <div className="space-y-2">
                        {ALL_COLUMNS.map((key) => (
                          <label
                            key={key}
                            className="flex items-center space-x-3 cursor-pointer group py-1 hover:bg-gray-50 rounded px-2"
                          >
                            <div className="relative">
                              <input
                                type="checkbox"
                                checked={columns.includes(key)}
                                onChange={(e) => {
                                  if (e.target.checked) {
                                    setColumns([...columns, key]);
                                  } else {
                                    setColumns(
                                      columns.filter((col) => col !== key)
                                    );
                                  }
                                }}
                                className="sr-only"
                              />
                              <div
                                className={`
                                  w-5 h-5 rounded border-2 flex items-center justify-center transition-all duration-200
                                  ${
                                    columns.includes(key)
                                      ? "bg-[#2c7a4c] border-[#2c7a4c]"
                                      : "bg-white border-gray-300 group-hover:border-[#2c7a4c]"
                                  }
                                `}
                              >
                                {columns.includes(key) && (
                                  <svg
                                    className="w-3 h-3 text-white"
                                    fill="currentColor"
                                    viewBox="0 0 20 20"
                                  >
                                    <path
                                      fillRule="evenodd"
                                      d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                                      clipRule="evenodd"
                                    />
                                  </svg>
                                )}
                              </div>
                            </div>
                            <span className="text-sm text-gray-700 select-none">
                              {COLUMN_LABELS[key]}
                            </span>
                          </label>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Ta bort den gamla column settings sectionen */}
        </div>

        {/* Conditional rendering: Show different views based on selection */}
        {filterSubscription === "services" ? (
          <TjansterView />
        ) : filterSubscription === "hundrum" ? (
          <HundrumView />
        ) : (
          /* Dogs Table - ENLIGT STILGUIDE: rounded-lg, shadow-sm */
          <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
            {filteredAndSortedDogs.length === 0 ? (
              <div className="text-center py-12">
                <Search className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  Inga hundar matchar dina filter.
                </h3>
                <p className="text-gray-500 mb-4">
                  {dogs.length === 0
                    ? "Lägg till din första hunddagishund"
                    : "Prova att ändra sökfilter"}
                </p>
                {dogs.length === 0 && (
                  <button
                    onClick={() => setShowAddDogModal(true)}
                    className="inline-flex items-center px-4 py-2.5 rounded-md text-[15px] font-semibold text-white bg-[#2c7a4c] hover:bg-[#236139] shadow-sm transition-colors focus:outline-none focus:ring-2 focus:ring-[#2c7a4c] focus:ring-offset-2"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Lägg till hund
                  </button>
                )}
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full">
                  <thead className="bg-[#2c7a4c] text-white">
                    <tr>
                      {columns.includes("photo") && (
                        <th
                          scope="col"
                          className="px-4 py-3 text-left text-sm font-semibold"
                        >
                          Foto
                        </th>
                      )}
                      {columns.includes("name") && (
                        <th
                          scope="col"
                          className="px-4 py-3 text-left text-sm font-semibold cursor-pointer hover:bg-[#236139]"
                          onClick={() => handleSort("name")}
                        >
                          <div className="flex items-center space-x-1">
                            <span>
                              Hund{" "}
                              {sortKey === "name" &&
                                (sortOrder === "asc" ? "▲" : "▼")}
                            </span>
                          </div>
                        </th>
                      )}
                      {columns.includes("breed") && (
                        <th
                          scope="col"
                          className="px-4 py-3 text-left text-sm font-semibold cursor-pointer hover:bg-[#236139]"
                          onClick={() => handleSort("breed")}
                        >
                          Ras{" "}
                          {sortKey === "breed" &&
                            (sortOrder === "asc" ? "▲" : "▼")}
                        </th>
                      )}
                      {columns.includes("gender") && (
                        <th
                          scope="col"
                          className="px-4 py-3 text-left text-sm font-semibold"
                        >
                          Kön
                        </th>
                      )}
                      {columns.includes("heightcm") && (
                        <th
                          scope="col"
                          className="px-4 py-3 text-left text-sm font-semibold"
                        >
                          Mankhöjd
                        </th>
                      )}
                      {columns.includes("birth") && (
                        <th
                          scope="col"
                          className="px-4 py-3 text-left text-sm font-semibold"
                        >
                          Födelsedatum
                        </th>
                      )}
                      {columns.includes("owner") && (
                        <th
                          scope="col"
                          className="px-4 py-3 text-left text-sm font-semibold cursor-pointer hover:bg-[#236139]"
                          onClick={() => handleSort("owner")}
                        >
                          Ägare{" "}
                          {sortKey === "owner" &&
                            (sortOrder === "asc" ? "▲" : "▼")}
                        </th>
                      )}
                      {columns.includes("customer_number") && (
                        <th
                          scope="col"
                          className="px-4 py-3 text-left text-sm font-semibold"
                        >
                          Kundnr
                        </th>
                      )}
                      {columns.includes("personnummer") && (
                        <th
                          scope="col"
                          className="px-4 py-3 text-left text-sm font-semibold"
                        >
                          Personnr
                        </th>
                      )}
                      {columns.includes("phone") && (
                        <th
                          scope="col"
                          className="px-4 py-3 text-left text-sm font-semibold"
                        >
                          Telefon
                        </th>
                      )}
                      {columns.includes("email") && (
                        <th
                          scope="col"
                          className="px-4 py-3 text-left text-sm font-semibold"
                        >
                          E-post
                        </th>
                      )}
                      {columns.includes("address") && (
                        <th
                          scope="col"
                          className="px-4 py-3 text-left text-sm font-semibold"
                        >
                          Adress
                        </th>
                      )}
                      {columns.includes("contact_person_2") && (
                        <th
                          scope="col"
                          className="px-4 py-3 text-left text-sm font-semibold"
                        >
                          Kontaktperson 2
                        </th>
                      )}
                      {columns.includes("contact_phone_2") && (
                        <th
                          scope="col"
                          className="px-4 py-3 text-left text-sm font-semibold"
                        >
                          Tel. kontakt 2
                        </th>
                      )}
                      {columns.includes("subscription") && (
                        <th
                          scope="col"
                          className="px-4 py-3 text-left text-sm font-semibold cursor-pointer hover:bg-[#236139]"
                          onClick={() => handleSort("subscription")}
                        >
                          Abonnemang{" "}
                          {sortKey === "subscription" &&
                            (sortOrder === "asc" ? "▲" : "▼")}
                        </th>
                      )}
                      {columns.includes("days") && (
                        <th
                          scope="col"
                          className="px-4 py-3 text-left text-sm font-semibold"
                        >
                          Veckodagar
                        </th>
                      )}
                      {columns.includes("startdate") && (
                        <th
                          scope="col"
                          className="px-4 py-3 text-left text-sm font-semibold"
                        >
                          Startdatum
                        </th>
                      )}
                      {columns.includes("enddate") && (
                        <th
                          scope="col"
                          className="px-4 py-3 text-left text-sm font-semibold"
                        >
                          Slutdatum
                        </th>
                      )}
                      {columns.includes("room_id") && (
                        <th
                          scope="col"
                          className="px-4 py-3 text-left text-sm font-semibold"
                        >
                          Rum
                        </th>
                      )}
                      {columns.includes("insurance_company") && (
                        <th
                          scope="col"
                          className="px-4 py-3 text-left text-sm font-semibold"
                        >
                          Försäkringsbolag
                        </th>
                      )}
                      {columns.includes("insurance_number") && (
                        <th
                          scope="col"
                          className="px-4 py-3 text-left text-sm font-semibold"
                        >
                          Försäkringsnr
                        </th>
                      )}
                      {columns.includes("vaccdhp") && (
                        <th
                          scope="col"
                          className="px-4 py-3 text-left text-sm font-semibold"
                        >
                          Vacc. DHP
                        </th>
                      )}
                      {columns.includes("vaccpi") && (
                        <th
                          scope="col"
                          className="px-4 py-3 text-left text-sm font-semibold"
                        >
                          Vacc. Pi
                        </th>
                      )}
                      {columns.includes("is_castrated") && (
                        <th
                          scope="col"
                          className="px-4 py-3 text-left text-sm font-semibold"
                        >
                          Kasterad
                        </th>
                      )}
                      {columns.includes("destroys_things") && (
                        <th
                          scope="col"
                          className="px-4 py-3 text-left text-sm font-semibold"
                        ></th>
                      )}
                      {columns.includes("is_house_trained") && (
                        <th
                          scope="col"
                          className="px-4 py-3 text-left text-sm font-semibold"
                        >
                          Rumsren
                        </th>
                      )}
                      {columns.includes("food_info") && (
                        <th
                          scope="col"
                          className="px-4 py-3 text-left text-sm font-semibold"
                        >
                          Foder
                        </th>
                      )}
                      {columns.includes("notes") && (
                        <th
                          scope="col"
                          className="px-4 py-3 text-left text-sm font-semibold"
                        >
                          Anteckningar
                        </th>
                      )}
                      {columns.includes("waitlist") && (
                        <th
                          scope="col"
                          className="px-4 py-3 text-left text-sm font-semibold"
                        >
                          Väntelista
                        </th>
                      )}
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {filteredAndSortedDogs.map((dog, index) => (
                      <tr
                        key={dog.id}
                        className={`cursor-pointer transition-colors ${index % 2 === 0 ? "bg-white hover:bg-gray-100" : "bg-gray-50 hover:bg-gray-100"}`}
                        onClick={() => {
                          // ✅ KRITISK FIX: Skapa djup kopia för att förhindra mutation av shared owner objects
                          const dogCopy = JSON.parse(JSON.stringify(dog));
                          setSelectedDog(dogCopy);
                        }}
                      >
                        {columns.includes("photo") && (
                          <td className="px-4 py-2.5 whitespace-nowrap">
                            {dog.photo_url ? (
                              <img
                                src={dog.photo_url}
                                alt={dog.name}
                                className="w-10 h-10 rounded-full object-cover border border-gray-300"
                              />
                            ) : (
                              <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center text-gray-500 text-xs border border-gray-300">
                                🐕
                              </div>
                            )}
                          </td>
                        )}
                        {columns.includes("name") && (
                          <td className="px-4 py-2.5 whitespace-nowrap text-sm text-[#333333]">
                            <div className="flex items-center gap-2">
                              {dog.name}
                              {dog.waitlist && (
                                <span className="px-2 py-0.5 bg-orange-100 text-orange-700 text-xs rounded-full font-medium">
                                  Väntelista
                                </span>
                              )}
                            </div>
                          </td>
                        )}
                        {columns.includes("breed") && (
                          <td className="px-4 py-2.5 whitespace-nowrap text-sm text-[#333333]">
                            {dog.breed || "-"}
                          </td>
                        )}
                        {columns.includes("gender") && (
                          <td className="px-4 py-2.5 whitespace-nowrap text-sm text-[#333333]">
                            {dog.gender || "-"}
                          </td>
                        )}
                        {columns.includes("heightcm") && (
                          <td className="px-4 py-2.5 whitespace-nowrap text-sm text-[#333333]">
                            {dog.heightcm ? `${dog.heightcm} cm` : "-"}
                          </td>
                        )}
                        {columns.includes("birth") && (
                          <td className="px-4 py-2.5 whitespace-nowrap text-sm text-[#333333]">
                            {dog.birth
                              ? new Date(dog.birth).toLocaleDateString("sv-SE")
                              : "-"}
                          </td>
                        )}
                        {columns.includes("owner") && (
                          <td className="px-4 py-2.5 whitespace-nowrap text-sm text-[#333333]">
                            {dog.owners?.full_name || "-"}
                          </td>
                        )}
                        {columns.includes("customer_number") && (
                          <td className="px-4 py-2.5 whitespace-nowrap text-sm text-[#333333]">
                            {dog.owners?.customer_number || "-"}
                          </td>
                        )}
                        {columns.includes("personnummer") && (
                          <td className="px-4 py-2.5 whitespace-nowrap text-sm text-[#333333]">
                            {dog.owners?.personnummer || "-"}
                          </td>
                        )}
                        {columns.includes("phone") && (
                          <td className="px-4 py-2.5 whitespace-nowrap text-sm text-[#333333]">
                            {dog.owners?.phone || "-"}
                          </td>
                        )}
                        {columns.includes("email") && (
                          <td className="px-4 py-2.5 whitespace-nowrap text-sm text-[#333333]">
                            {dog.owners?.email || "-"}
                          </td>
                        )}
                        {columns.includes("address") && (
                          <td className="px-4 py-2.5 whitespace-nowrap text-sm text-[#333333]">
                            {dog.owners?.address || "-"}
                          </td>
                        )}
                        {columns.includes("contact_person_2") && (
                          <td className="px-4 py-2.5 whitespace-nowrap text-sm text-[#333333]">
                            {dog.owners?.contact_person_2 || "-"}
                          </td>
                        )}
                        {columns.includes("contact_phone_2") && (
                          <td className="px-4 py-2.5 whitespace-nowrap text-sm text-[#333333]">
                            {dog.owners?.contact_phone_2 || "-"}
                          </td>
                        )}
                        {columns.includes("subscription") && (
                          <td className="px-4 py-2.5 whitespace-nowrap text-sm text-[#333333]">
                            {dog.subscription || "Ej valt"}
                          </td>
                        )}
                        {columns.includes("days") && (
                          <td className="px-4 py-2.5 whitespace-nowrap">
                            {renderWeekdays(dog.days)}
                          </td>
                        )}
                        {columns.includes("startdate") && (
                          <td className="px-4 py-2.5 whitespace-nowrap text-sm text-[#333333]">
                            {dog.startdate
                              ? new Date(dog.startdate).toLocaleDateString(
                                  "sv-SE"
                                )
                              : "-"}
                          </td>
                        )}
                        {columns.includes("enddate") && (
                          <td className="px-4 py-2.5 whitespace-nowrap text-sm text-[#333333]">
                            {dog.enddate
                              ? new Date(dog.enddate).toLocaleDateString(
                                  "sv-SE"
                                )
                              : "-"}
                          </td>
                        )}
                        {columns.includes("room_id") && (
                          <td className="px-4 py-2.5 whitespace-nowrap text-sm text-[#333333]">
                            {getRoomName(dog.room_id)}
                          </td>
                        )}
                        {columns.includes("insurance_company") && (
                          <td className="px-4 py-2.5 whitespace-nowrap text-sm text-[#333333]">
                            {dog.insurance_company || "-"}
                          </td>
                        )}
                        {columns.includes("insurance_number") && (
                          <td className="px-4 py-2.5 whitespace-nowrap text-sm text-[#333333]">
                            {dog.insurance_number || "-"}
                          </td>
                        )}
                        {columns.includes("vaccdhp") && (
                          <td className="px-4 py-2.5 whitespace-nowrap text-sm text-[#333333]">
                            {dog.vaccdhp
                              ? new Date(dog.vaccdhp).toLocaleDateString(
                                  "sv-SE"
                                )
                              : "-"}
                          </td>
                        )}
                        {columns.includes("vaccpi") && (
                          <td className="px-4 py-2.5 whitespace-nowrap text-sm text-[#333333]">
                            {dog.vaccpi
                              ? new Date(dog.vaccpi).toLocaleDateString("sv-SE")
                              : "-"}
                          </td>
                        )}
                        {columns.includes("is_castrated") && (
                          <td className="px-4 py-2.5 whitespace-nowrap text-sm text-[#333333]">
                            {dog.is_castrated ? "Ja" : "Nej"}
                          </td>
                        )}
                        {columns.includes("destroys_things") && (
                          <td className="px-4 py-2.5 whitespace-nowrap text-sm text-[#333333]">
                            {dog.destroys_things ? "Ja" : "Nej"}
                          </td>
                        )}
                        {columns.includes("is_house_trained") && (
                          <td className="px-4 py-2.5 whitespace-nowrap text-sm text-[#333333]">
                            {dog.is_house_trained ? "Ja" : "Nej"}
                          </td>
                        )}
                        {columns.includes("food_info") && (
                          <td className="px-4 py-2.5 whitespace-nowrap text-sm text-[#333333]">
                            {dog.food_info || "-"}
                          </td>
                        )}
                        {columns.includes("notes") && (
                          <td className="px-4 py-2.5 whitespace-nowrap text-sm text-[#333333]">
                            {dog.notes || "-"}
                          </td>
                        )}
                        {columns.includes("waitlist") && (
                          <td className="px-4 py-2.5 whitespace-nowrap text-sm">
                            {dog.waitlist ? (
                              <span className="px-3 py-1 bg-orange-100 text-orange-700 text-xs rounded-full font-medium">
                                På väntelista
                              </span>
                            ) : (
                              <span className="text-gray-400">-</span>
                            )}
                          </td>
                        )}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Edit Dog Modal */}
      {selectedDog && (
        <EditDogModal
          key={selectedDog.id} // ✅ Unik key per hund - tvingar React att skapa ny instans vid hundebyte
          initialDog={selectedDog}
          open={!!selectedDog}
          onCloseAction={() => setSelectedDog(null)}
          onSavedAction={async () => {
            // ✅ Stäng modalen FÖRST för att cleara state
            setSelectedDog(null);
            // Vänta lite för att säkerställa state är clearad
            await new Promise((resolve) => setTimeout(resolve, 100));
            // Hämta fresh data från databasen
            await fetchDogs();
          }}
          roomTypeFilter={["daycare", "both"]} // Visa bara dagis-rum
        />
      )}

      {/* Add New Dog Modal */}
      {showAddDogModal && (
        <EditDogModal
          initialDog={null}
          open={showAddDogModal}
          onCloseAction={() => setShowAddDogModal(false)}
          onSavedAction={() => {
            setShowAddDogModal(false);
            fetchDogs();
          }}
          roomTypeFilter={["daycare", "both"]} // Visa bara dagis-rum
        />
      )}
    </div>
  );
}
