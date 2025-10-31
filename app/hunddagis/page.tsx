"use client";

import React, { useEffect, useState, useCallback, useMemo } from "react";
import Link from "next/link";
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
  "name",
  "breed",
  "owner",
  "phone",
  "subscription",
  "room_id",
  "days",
];

const ALL_COLUMNS = [
  "name",
  "breed",
  "heightcm",
  "birth",
  "days",
  "subscription",
  "room_id",
  "owner",
  "phone",
  "email",
  "address",
  "startdate",
  "enddate",
  "vaccdhp",
  "vaccpi",
  "notes",
];

const COLUMN_LABELS: Record<string, string> = {
  name: "Hund",
  breed: "Ras",
  heightcm: "Mankhöjd",
  birth: "Födelsedatum",
  subscription: "Abonnemang",
  room_id: "Rum",
  owner: "Ägare",
  phone: "Telefon",
  email: "E-post",
  address: "Adress",
  startdate: "Startdatum",
  enddate: "Slutdatum",
  days: "Veckodagar",
  vaccdhp: "Vaccination DHP",
  vaccpi: "Vaccination Pi",
  notes: "Anteckningar",
};

export default function HunddagisPage() {
  const { user } = useAuth();
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
  const [currentView, setCurrentView] = useState<"hunddagis" | "vantelista">(
    "hunddagis"
  );

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
    if (!user?.org_id) return;

    try {
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
            address
          )
        `
        )
        .eq("org_id", user.org_id)
        .order("name");

      if (dogsError) {
        logDebug(
          "error",
          `${ERROR_CODES.DATABASE_CONNECTION} Fel vid hämtning av hundar`,
          dogsError
        );
        setError(`Fel vid hämtning av hundar: ${dogsError.message}`);
        return;
      }

      setDogs(dogsData || []);
      logDebug("success", `Hämtade ${dogsData?.length || 0} hundar`);
    } catch (err: any) {
      logDebug(
        "error",
        `${ERROR_CODES.DATABASE_CONNECTION} Oväntat fel vid hämtning av hundar`,
        err
      );
      setError("Ett oväntat fel inträffade vid hämtning av hundar");
    }
  }, [user?.org_id, logDebug]);

  const fetchRooms = useCallback(async () => {
    if (!user?.org_id) return;

    try {
      const { data: roomsData, error: roomsError } = await supabase
        .from("rooms")
        .select("*")
        .eq("org_id", user.org_id)
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

      setRooms(roomsData || []);
      logDebug("success", `Hämtade ${roomsData?.length || 0} rum`);
    } catch (err: any) {
      logDebug(
        "error",
        `${ERROR_CODES.DATABASE_CONNECTION} Oväntat fel vid hämtning av rum`,
        err
      );
    }
  }, [user?.org_id, logDebug]);

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

      const matchesSubscription =
        filterSubscription === "all" || dog.subscription === filterSubscription;

      const matchesMonth =
        filterMonth === "all" ||
        (() => {
          if (!dog.startdate) return false;
          const startMonth = new Date(dog.startdate).getMonth();
          return startMonth.toString() === filterMonth;
        })();

      return matchesSearch && matchesSubscription && matchesMonth;
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
    if (!user?.org_id) {
      const timer = setTimeout(() => {
        setLoading(false);
        if (!user) {
          setError("Ingen användare inloggad");
        } else if (!user.org_id) {
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
  }, [user?.org_id, fetchDogs, fetchRooms]);

  // Real-time subscriptions
  useEffect(() => {
    if (!user?.org_id) return;

    const dogsSubscription = supabase
      .channel("dogs_changes")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "dogs",
          filter: `org_id=eq.${user.org_id}`,
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
          filter: `org_id=eq.${user.org_id}`,
        },
        () => {
          logDebug("info", "Rum uppdaterade via realtime");
          fetchRooms();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(dogsSubscription);
      supabase.removeChannel(roomsSubscription);
    };
  }, [user?.org_id, fetchDogs, fetchRooms, logDebug]);

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
    if (!days) return "-";

    const dayMap: Record<string, string> = {
      Måndag: "M",
      Tisdag: "T",
      Onsdag: "O",
      Torsdag: "T",
      Fredag: "F",
      Monday: "M",
      Tuesday: "T",
      Wednesday: "O",
      Thursday: "T",
      Friday: "F",
    };

    return days
      .split(",")
      .map((day) => {
        const trimmed = day.trim();
        return dayMap[trimmed] || trimmed.charAt(0);
      })
      .join("");
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
          {user && !user.org_id && (
            <p className="text-red-600 mt-2">Ingen organisation tilldelad</p>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Standard DogPlanner Header */}
      <div className="bg-[#2c7a4c] shadow-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-4">
              {/* DogPlanner Logo - klickbar för att gå till dashboard */}
              <Link
                href="/dashboard"
                className="flex items-center space-x-2 hover:opacity-80 transition-opacity"
              >
                <span className="text-2xl">🐕</span>
                <span className="text-xl font-bold text-white">DogPlanner</span>
              </Link>
              <div className="h-6 w-px bg-green-400"></div>
              <h1 className="text-xl font-bold text-white">
                Hunddagis – Dagens sammanställning
              </h1>
            </div>

            {/* Navigation Tabs - mer diskreta som originalet */}
            <div className="flex items-center space-x-1">
              <button
                onClick={() => setCurrentView("hunddagis")}
                className={`px-4 py-2 text-sm font-medium rounded transition-colors ${
                  currentView === "hunddagis"
                    ? "bg-white text-[#2c7a4c]"
                    : "text-green-100 hover:text-white hover:bg-[#236139]"
                }`}
              >
                Antagna hundar
              </button>
              <button
                onClick={() => setCurrentView("vantelista")}
                className={`px-4 py-2 text-sm font-medium rounded transition-colors ${
                  currentView === "vantelista"
                    ? "bg-white text-[#2c7a4c]"
                    : "text-green-100 hover:text-white hover:bg-[#236139]"
                }`}
              >
                Väntelista
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Subtitle - enklare stil */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        <p className="text-gray-600">
          Sök, filtrera, exportera och lägg till nya hundar.
        </p>
      </div>

      {/* Error Display */}
      {error && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-4">
          <div className="bg-red-50 border border-red-200 rounded-md p-4">
            <div className="flex">
              <AlertTriangle className="h-5 w-5 text-red-400" />
              <div className="ml-3">
                <p className="text-sm text-red-800">{error}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Main Content Area */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-6">
        {/* Current View Content */}
        {currentView === "hunddagis" && (
          <>
            {/* Action Buttons Row - standard DogPlanner styling */}
            <div className="flex justify-between items-center mb-6">
              <div className="flex items-center space-x-3">
                <Link
                  href="/hunddagis/new"
                  className="inline-flex items-center px-4 py-2 border border-transparent rounded-md text-sm font-medium text-white bg-[#2c7a4c] hover:bg-[#236139] focus:outline-none focus:ring-2 focus:ring-[#2c7a4c]"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Ny hund
                </Link>
                <button
                  onClick={exportToPDF}
                  className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-[#2c7a4c]"
                >
                  <Download className="h-4 w-4 mr-2" />
                  PDF-export
                </button>
                <button
                  onClick={() => setShowColumnSettings(!showColumnSettings)}
                  className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-green-500"
                >
                  <Settings2 className="h-4 w-4 mr-2" />
                  Kolumner
                </button>
                <button
                  onClick={() => {
                    fetchDogs();
                    fetchRooms();
                  }}
                  className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-green-500"
                >
                  <RefreshCcw className="h-4 w-4 mr-2" />
                  Ladda om
                </button>
              </div>
            </div>

            {/* Search and Filter Row */}
            <div className="bg-white rounded-lg border border-gray-200 p-4 mb-6">
              <div className="flex flex-col lg:flex-row space-y-3 lg:space-y-0 lg:space-x-4">
                {/* Sökruta - större och tydligare */}
                <div className="flex-1 lg:min-w-[400px]">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                    <input
                      type="text"
                      placeholder="Sök på hundnamn, ägarnamn, telefon, ras..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-full pl-10 pr-4 py-2.5 text-base border border-gray-300 rounded-md focus:ring-2 focus:ring-[#2c7a4c] focus:border-[#2c7a4c]"
                    />
                  </div>
                </div>

                {/* Filter dropdowns */}
                <div className="flex space-x-3">
                  <select
                    value={filterSubscription}
                    onChange={(e) => setFilterSubscription(e.target.value)}
                    className="px-3 py-2.5 border border-gray-300 rounded-md focus:ring-2 focus:ring-[#2c7a4c] focus:border-[#2c7a4c] text-sm"
                  >
                    <option value="all">Alla abonnemang</option>
                    <option value="Heltid">Heltid</option>
                    <option value="Deltid 2">Deltid 2</option>
                    <option value="Deltid 3">Deltid 3</option>
                    <option value="Dagshund">Dagshund</option>
                  </select>

                  <select
                    value={filterMonth}
                    onChange={(e) => setFilterMonth(e.target.value)}
                    className="px-3 py-2.5 border border-gray-300 rounded-md focus:ring-2 focus:ring-[#2c7a4c] focus:border-[#2c7a4c] text-sm"
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
                </div>
              </div>

              {/* Column Settings */}
              {showColumnSettings && (
                <div className="mt-4 pt-4 border-t border-gray-200">
                  <p className="text-sm font-medium text-gray-700 mb-3">
                    Dölj/visa kolumner:
                  </p>
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                    {ALL_COLUMNS.map((key) => (
                      <label
                        key={key}
                        className="flex items-center space-x-3 cursor-pointer group"
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
              )}
            </div>

            {/* Dogs Table */}
            <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
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
                    <Link
                      href="/hunddagis/new"
                      className="inline-flex items-center px-4 py-2 border border-transparent rounded-md text-sm font-medium text-white bg-[#2c7a4c] hover:bg-[#236139]"
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Lägg till hund
                    </Link>
                  )}
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full">
                    <thead className="bg-[#2c7a4c] text-white">
                      <tr>
                        {columns.includes("name") && (
                          <th
                            scope="col"
                            className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider cursor-pointer hover:bg-green-700"
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
                            className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider cursor-pointer hover:bg-green-700"
                            onClick={() => handleSort("breed")}
                          >
                            Ras{" "}
                            {sortKey === "breed" &&
                              (sortOrder === "asc" ? "▲" : "▼")}
                          </th>
                        )}
                        {columns.includes("owner") && (
                          <th
                            scope="col"
                            className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider cursor-pointer hover:bg-green-700"
                            onClick={() => handleSort("owner")}
                          >
                            Ägare{" "}
                            {sortKey === "owner" &&
                              (sortOrder === "asc" ? "▲" : "▼")}
                          </th>
                        )}
                        {columns.includes("phone") && (
                          <th
                            scope="col"
                            className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider"
                          >
                            Telefon
                          </th>
                        )}
                        {columns.includes("subscription") && (
                          <th
                            scope="col"
                            className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider cursor-pointer hover:bg-green-700"
                            onClick={() => handleSort("subscription")}
                          >
                            Abonnemang{" "}
                            {sortKey === "subscription" &&
                              (sortOrder === "asc" ? "▲" : "▼")}
                          </th>
                        )}
                        {columns.includes("room_id") && (
                          <th
                            scope="col"
                            className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider"
                          >
                            Rum
                          </th>
                        )}
                        {columns.includes("days") && (
                          <th
                            scope="col"
                            className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider"
                          >
                            Veckodagar
                          </th>
                        )}
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {filteredAndSortedDogs.map((dog, index) => (
                        <tr
                          key={dog.id}
                          className={
                            index % 2 === 0 ? "bg-white" : "bg-gray-50"
                          }
                        >
                          {columns.includes("name") && (
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="flex items-center">
                                <div className="flex-shrink-0 h-8 w-8">
                                  {dog.photo_url ? (
                                    <img
                                      className="h-8 w-8 rounded-full object-cover"
                                      src={dog.photo_url}
                                      alt={dog.name}
                                    />
                                  ) : (
                                    <div className="h-8 w-8 rounded-full bg-green-100 flex items-center justify-center">
                                      <span className="text-[#2c7a4c] font-medium text-xs">
                                        {dog.name.charAt(0).toUpperCase()}
                                      </span>
                                    </div>
                                  )}
                                </div>
                                <div className="ml-3">
                                  <button
                                    onClick={() => setSelectedDog(dog)}
                                    className="text-sm font-medium text-[#2c7a4c] hover:text-[#236139] hover:underline"
                                  >
                                    {dog.name}
                                  </button>
                                </div>
                              </div>
                            </td>
                          )}
                          {columns.includes("breed") && (
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              {dog.breed || "-"}
                            </td>
                          )}
                          {columns.includes("owner") && (
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              {dog.owners?.full_name || "-"}
                            </td>
                          )}
                          {columns.includes("phone") && (
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              {dog.owners?.phone || "-"}
                            </td>
                          )}
                          {columns.includes("subscription") && (
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              {dog.subscription || "Ej valt"}
                            </td>
                          )}
                          {columns.includes("room_id") && (
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              {getRoomName(dog.room_id)}
                            </td>
                          )}
                          {columns.includes("days") && (
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              {formatDays(dog.days)}
                            </td>
                          )}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </>
        )}

        {/* Väntelista View */}
        {currentView === "vantelista" && (
          <div className="bg-white rounded-lg border border-gray-200 p-8 text-center">
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              Väntelista
            </h3>
            <p className="text-gray-500">
              Hantera intresseanmälningar från potentiella kunder
            </p>
            <Link
              href="/hunddagis/intresseanmalningar"
              className="mt-4 inline-flex items-center px-4 py-2 border border-transparent rounded-md text-sm font-medium text-white bg-[#2c7a4c] hover:bg-[#236139]"
            >
              Gå till väntelista
            </Link>
          </div>
        )}
      </div>

      {/* Edit Dog Modal */}
      {selectedDog && (
        <EditDogModal
          initialDog={selectedDog}
          open={!!selectedDog}
          onCloseAction={() => setSelectedDog(null)}
          onSavedAction={() => {
            setSelectedDog(null);
            fetchDogs();
          }}
        />
      )}
    </div>
  );
}
