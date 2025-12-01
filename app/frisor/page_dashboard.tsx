"use client";

export const dynamic = "force-dynamic";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { useAuth } from "@/app/context/AuthContext";
import {
  Scissors,
  Plus,
  Settings2,
  RefreshCcw,
  Search,
  Calendar,
  Clock,
  AlertTriangle,
  BookOpen,
  ChevronRight,
  User,
  Phone,
} from "lucide-react";

/* ===========================
 * Types
 * =========================== */
type Owner = {
  id: string;
  full_name: string | null;
  phone: string | null;
  customer_number: number | null;
};

type Dog = {
  id: string;
  name: string;
  breed: string | null;
  heightcm: number | null;
  owner_id: string | null;
  owner?: Owner | null;
};

type TodaysBooking = {
  id: string;
  dog_id: string | null;
  appointment_time: string | null;
  service_type: string;
  status: string;
  dog?: Dog | null;
  external_customer_name: string | null;
  external_dog_name: string | null;
};

type JournalEntry = {
  id: string;
  dog_id: string | null;
  appointment_date: string;
  service_type: string;
  clip_length: string | null;
  dog?: Dog | null;
  external_customer_name: string | null;
  external_dog_name: string | null;
};

const SERVICE_LABELS: Record<string, string> = {
  bath: "Badning",
  bath_trim: "Bad + Trimning",
  full_groom: "Fullständig klippning",
  nail_trim: "Klotrimning",
  ear_cleaning: "Öronrengöring",
  teeth_cleaning: "Tandrengöring",
  custom: "Anpassad",
};

/* ===========================
 * Main Component
 * =========================== */
export default function FrisorDashboard() {
  const supabase = createClient();
  const router = useRouter();
  const { user, currentOrgId } = useAuth();
  const effectiveOrgId = currentOrgId || user?.user_metadata?.org_id || null;

  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [todaysBookings, setTodaysBookings] = useState<TodaysBooking[]>([]);
  const [recentJournals, setRecentJournals] = useState<JournalEntry[]>([]);
  const [searchResults, setSearchResults] = useState<JournalEntry[]>([]);

  useEffect(() => {
    if (effectiveOrgId) {
      loadData();
    }
  }, [effectiveOrgId]);

  useEffect(() => {
    if (searchTerm.length >= 2) {
      performSearch();
    } else {
      setSearchResults([]);
    }
  }, [searchTerm]);

  const loadData = async () => {
    if (!effectiveOrgId) return;

    try {
      const today = new Date().toISOString().split("T")[0];

      // Dagens bokningar
      const { data: bookings } = await supabase
        .from("grooming_bookings")
        .select(
          `
          *,
          dog:dogs(
            id,
            name,
            breed,
            heightcm,
            owner_id,
            owner:owners(id, full_name, phone, customer_number)
          )
        `
        )
        .eq("org_id", effectiveOrgId)
        .eq("appointment_date", today)
        .in("status", ["confirmed", "completed"])
        .order("appointment_time");

      // Senaste journalposter (30 senaste)
      const { data: journals } = await supabase
        .from("grooming_journal")
        .select(
          `
          *,
          dog:dogs(
            id,
            name,
            breed,
            heightcm,
            owner_id,
            owner:owners(id, full_name, phone, customer_number)
          )
        `
        )
        .eq("org_id", effectiveOrgId)
        .order("appointment_date", { ascending: false })
        .limit(30);

      setTodaysBookings(bookings || []);
      setRecentJournals(journals || []);
    } catch (error) {
      console.error("Fel vid laddning:", error);
    } finally {
      setLoading(false);
    }
  };

  const performSearch = async () => {
    if (!effectiveOrgId || searchTerm.length < 2) return;

    try {
      const search = searchTerm.toLowerCase();

      // Sök i journal (både interna och externa kunder)
      const { data } = await supabase
        .from("grooming_journal")
        .select(
          `
          *,
          dog:dogs(
            id,
            name,
            breed,
            heightcm,
            owner_id,
            owner:owners(id, full_name, phone, customer_number)
          )
        `
        )
        .eq("org_id", effectiveOrgId)
        .order("appointment_date", { ascending: false });

      if (data) {
        const filtered = data.filter((entry) => {
          // Sök i hundnamn
          const dogName = entry.dog?.name || entry.external_dog_name || "";
          if (dogName.toLowerCase().includes(search)) return true;

          // Sök i ägarnamn
          const ownerName =
            entry.dog?.owner?.full_name || entry.external_customer_name || "";
          if (ownerName.toLowerCase().includes(search)) return true;

          // Sök i kundnummer
          const customerNumber =
            entry.dog?.owner?.customer_number?.toString() || "";
          if (customerNumber.includes(search)) return true;

          return false;
        });

        setSearchResults(filtered);
      }
    } catch (error) {
      console.error("Sökfel:", error);
    }
  };

  const getDogDisplayName = (entry: TodaysBooking | JournalEntry) => {
    return entry.dog?.name || entry.external_dog_name || "Okänd hund";
  };

  const getOwnerDisplayName = (entry: JournalEntry) => {
    return (
      entry.dog?.owner?.full_name ||
      entry.external_customer_name ||
      "Utomstående"
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Scissors className="h-12 w-12 text-orange-600 mx-auto mb-4 animate-pulse" />
          <p className="text-gray-600">Laddar...</p>
        </div>
      </div>
    );
  }

  if (!effectiveOrgId) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
        <div className="bg-white rounded-lg shadow-sm p-8 max-w-md w-full text-center">
          <AlertTriangle className="h-12 w-12 text-yellow-600 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">
            Ingen organisation hittades
          </h2>
          <p className="text-gray-600">
            Du är inte kopplad till någon organisation. Kontakta
            administratören.
          </p>
        </div>
      </div>
    );
  }

  // Gruppera journalposter per hund (för listan)
  const groupedJournals = recentJournals.reduce(
    (acc, entry) => {
      const dogId = entry.dog_id || `external_${entry.external_dog_name}`;
      if (!acc[dogId]) {
        acc[dogId] = {
          dogName: getDogDisplayName(entry),
          ownerName: getOwnerDisplayName(entry),
          dogId: entry.dog_id,
          breed:
            entry.dog?.breed || entry.external_dog_name ? "Blandras" : null,
          lastVisit: entry.appointment_date,
          totalVisits: 1,
          lastClipLength: entry.clip_length,
        };
      } else {
        acc[dogId].totalVisits++;
      }
      return acc;
    },
    {} as Record<string, any>
  );

  const dogsList = Object.values(groupedJournals);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero med orange gradient */}
      <div className="relative bg-gradient-to-br from-orange-600 to-orange-700 text-white overflow-hidden">
        <div className="absolute inset-0 bg-black/10"></div>
        <div className="relative max-w-[1600px] mx-auto px-6 py-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Scissors className="h-10 w-10" />
              <div>
                <h1 className="text-3xl font-bold">Frisör</h1>
                <p className="text-white/90 text-sm">
                  Dagens bokningar & journal
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={loadData}
                className="p-2 bg-white/20 hover:bg-white/30 rounded-lg transition"
              >
                <RefreshCcw className="h-5 w-5" />
              </button>
              <Link href="/admin/priser/frisor">
                <button className="p-2 bg-white/20 hover:bg-white/30 rounded-lg transition">
                  <Settings2 className="h-5 w-5" />
                </button>
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Huvudinnehåll */}
      <div className="max-w-[1600px] mx-auto px-6 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Vänster kolumn: Mina bokningar (dagens) */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-sm p-6 sticky top-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                  <Calendar className="h-5 w-5 text-orange-600" />
                  Mina bokningar idag
                </h2>
                <Link href="/frisor/ny-bokning">
                  <button className="p-2 bg-orange-600 hover:bg-orange-700 text-white rounded-lg transition">
                    <Plus className="h-4 w-4" />
                  </button>
                </Link>
              </div>

              {todaysBookings.length === 0 ? (
                <div className="text-center py-8">
                  <Clock className="h-10 w-10 text-gray-300 mx-auto mb-3" />
                  <p className="text-gray-500 text-sm">Inga bokningar idag</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {todaysBookings.map((booking) => (
                    <button
                      key={booking.id}
                      onClick={() => {
                        if (booking.dog_id) {
                          router.push(`/frisor/${booking.dog_id}`);
                        }
                      }}
                      className="w-full text-left p-4 border border-gray-200 rounded-lg hover:bg-orange-50 hover:border-orange-200 transition group"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h3 className="font-semibold text-gray-900 group-hover:text-orange-600 flex items-center gap-2">
                            {getDogDisplayName(booking)}
                            {booking.dog_id && (
                              <ChevronRight className="h-4 w-4" />
                            )}
                          </h3>
                          <p className="text-sm text-gray-600 mt-1">
                            {booking.dog?.owner?.full_name ||
                              booking.external_customer_name}
                          </p>
                          <p className="text-sm text-gray-500 mt-1">
                            {SERVICE_LABELS[booking.service_type] ||
                              booking.service_type}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-medium text-orange-600">
                            {booking.appointment_time?.slice(0, 5) ||
                              "Ej angiven"}
                          </p>
                          <span
                            className={`text-xs px-2 py-1 rounded-full mt-1 inline-block ${
                              booking.status === "completed"
                                ? "bg-green-100 text-green-800"
                                : "bg-blue-100 text-blue-800"
                            }`}
                          >
                            {booking.status === "completed"
                              ? "Klar"
                              : "Bekräftad"}
                          </span>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Höger kolumn: Sök & Lista */}
          <div className="lg:col-span-2">
            {/* Sökruta */}
            <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Sök på hundnamn, ägare eller kundnummer..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent text-lg"
                />
              </div>
              {searchTerm && (
                <p className="text-sm text-gray-500 mt-2">
                  {searchResults.length} resultat
                </p>
              )}
            </div>

            {/* Sökresultat eller lista */}
            <div className="bg-white rounded-lg shadow-sm">
              <div className="p-6 border-b border-gray-200">
                <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                  <BookOpen className="h-5 w-5 text-orange-600" />
                  {searchResults.length > 0
                    ? "Sökresultat"
                    : "Alla klippta hundar"}
                </h2>
              </div>

              <div className="divide-y divide-gray-200">
                {(searchResults.length > 0 ? searchResults : recentJournals)
                  .slice(0, 20)
                  .map((entry) => {
                    const dogId = entry.dog_id;
                    return (
                      <button
                        key={entry.id}
                        onClick={() => {
                          if (dogId) {
                            router.push(`/frisor/${dogId}`);
                          }
                        }}
                        disabled={!dogId}
                        className="w-full text-left p-4 hover:bg-gray-50 transition group disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <h3 className="font-semibold text-gray-900 group-hover:text-orange-600 flex items-center gap-2">
                              {getDogDisplayName(entry)}
                              {dogId && <ChevronRight className="h-4 w-4" />}
                            </h3>
                            <div className="flex items-center gap-4 mt-1">
                              <p className="text-sm text-gray-600 flex items-center gap-1">
                                <User className="h-3 w-3" />
                                {getOwnerDisplayName(entry)}
                              </p>
                              {entry.dog?.breed && (
                                <p className="text-sm text-gray-500">
                                  • {entry.dog.breed}
                                </p>
                              )}
                            </div>
                            <p className="text-xs text-gray-500 mt-1">
                              Senast:{" "}
                              {new Date(
                                entry.appointment_date
                              ).toLocaleDateString("sv-SE")}
                              {entry.clip_length && ` • ${entry.clip_length}`}
                            </p>
                          </div>
                        </div>
                      </button>
                    );
                  })}
              </div>

              {dogsList.length === 0 && searchResults.length === 0 && (
                <div className="text-center py-12">
                  <BookOpen className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                  <p className="text-gray-600">Ingen klipphistorik ännu</p>
                  <p className="text-sm text-gray-500 mt-1">
                    Skapa din första bokning för att komma igång
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
