"use client";

export const dynamic = "force-dynamic";

import React, { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/app/context/AuthContext";
import { capitalize } from "@/lib/textUtils";
import {
  Scissors,
  Plus,
  Settings2,
  RefreshCcw,
  Search,
  Calendar,
  Clock,
  CheckCircle,
  XCircle,
  AlertTriangle,
  BookOpen,
  Users,
} from "lucide-react";

/* ===========================
 * Types & Constants
 * =========================== */
const ERROR_CODES = {
  DATABASE_CONNECTION: "[ERR-1001]",
  VALIDATION: "[ERR-4001]",
} as const;

type Dog = {
  id: string;
  name: string;
  breed: string | null;
  heightcm: number | null;
  owner_id: string | null;
  org_id: string | null;
  is_active: boolean | null;
  owner?: {
    full_name: string | null;
    phone: string | null;
  } | null;
};

type GroomingBooking = {
  id: string;
  org_id: string;
  dog_id: string | null;
  appointment_date: string;
  appointment_time: string | null;
  service_type: string;
  estimated_price: number | null;
  status: "confirmed" | "completed" | "cancelled" | "no_show";
  notes: string | null;
  created_at: string;
  dog?: Dog | null;
  // För utomstående kunder
  external_customer_name: string | null;
  external_customer_phone: string | null;
  external_dog_name: string | null;
  external_dog_breed: string | null;
};

type GroomingJournal = {
  id: string;
  org_id: string;
  dog_id: string | null;
  appointment_date: string;
  service_type: string;
  clip_length: string | null;
  shampoo_type: string | null;
  special_treatments: string | null;
  final_price: number;
  duration_minutes: number | null;
  notes: string | null;
  before_photos: string[] | null;
  after_photos: string[] | null;
  next_appointment_recommended: string | null;
  created_at: string;
  dog?: Dog | null;
  // För utomstående kunder
  external_customer_name: string | null;
  external_dog_name: string | null;
  external_dog_breed: string | null;
};

type TabType = "bokningar" | "journal" | "vantelista";

const SERVICE_LABELS: Record<string, string> = {
  bath: "Badning",
  bath_trim: "Bad + Trimning",
  full_groom: "Fullständig klippning",
  nail_trim: "Klotrimning",
  ear_cleaning: "Öronrengöring",
  teeth_cleaning: "Tandrengöring",
  custom: "Anpassad behandling",
};

/* ===========================
 * Main Component
 * =========================== */
export default function FrisorPage() {
  const { user, currentOrgId, loading: authLoading } = useAuth();
  const effectiveOrgId = currentOrgId || user?.user_metadata?.org_id || null;

  const [activeTab, setActiveTab] = useState<TabType>("bokningar");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");

  const [bookings, setBookings] = useState<GroomingBooking[]>([]);
  const [journals, setJournals] = useState<GroomingJournal[]>([]);
  const [dogs, setDogs] = useState<Dog[]>([]);

  const [timeout, setTimeoutReached] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (loading && !effectiveOrgId) {
        setTimeoutReached(true);
        setLoading(false);
        setError("Ingen organisation hittades. Kontakta administratören.");
      }
    }, 5000);

    return () => clearTimeout(timer);
  }, [loading, effectiveOrgId]);

  useEffect(() => {
    if (effectiveOrgId && !authLoading) {
      loadData();
    }
  }, [effectiveOrgId, authLoading]);

  const loadData = async () => {
    if (!effectiveOrgId) return;

    setLoading(true);
    setError(null);

    try {
      // Ladda bokningar
      const { data: bookingsData, error: bookingsError } = await supabase
        .from("grooming_bookings")
        .select(
          `
          *,
          dog:dogs(
            id,
            name,
            breed,
            heightcm,
            owner:owners(full_name, phone)
          )
        `
        )
        .eq("org_id", effectiveOrgId)
        .order("appointment_date", { ascending: false })
        .order("appointment_time", { ascending: false });

      if (bookingsError) throw bookingsError;

      // Ladda journal
      const { data: journalData, error: journalError } = await supabase
        .from("grooming_journal")
        .select(
          `
          *,
          dog:dogs(
            id,
            name,
            breed,
            heightcm,
            owner:owners(full_name, phone)
          )
        `
        )
        .eq("org_id", effectiveOrgId)
        .order("appointment_date", { ascending: false });

      if (journalError) throw journalError;

      // Ladda hundar
      const { data: dogsData, error: dogsError } = await supabase
        .from("dogs")
        .select(
          `
          id,
          name,
          breed,
          heightcm,
          owner_id,
          org_id,
          is_active,
          owner:owners(full_name, phone)
        `
        )
        .eq("org_id", effectiveOrgId)
        .eq("is_active", true)
        .order("name");

      if (dogsError) throw dogsError;

      setBookings(bookingsData || []);
      setJournals(journalData || []);
      setDogs(dogsData || []);
    } catch (err: any) {
      console.error(
        `${ERROR_CODES.DATABASE_CONNECTION} Fel vid laddning:`,
        err
      );
      setError(`Kunde inte ladda data: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "confirmed":
        return "bg-blue-100 text-blue-800";
      case "completed":
        return "bg-green-100 text-green-800";
      case "cancelled":
        return "bg-red-100 text-red-800";
      case "no_show":
        return "bg-gray-100 text-gray-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case "confirmed":
        return "Bekräftad";
      case "completed":
        return "Genomförd";
      case "cancelled":
        return "Avbokad";
      case "no_show":
        return "Uteblev";
      default:
        return status;
    }
  };

  const filteredBookings = bookings.filter((booking) => {
    if (!searchTerm) return true;
    const search = searchTerm.toLowerCase();

    // Sök i hundnamn (både interna och externa)
    const dogName = booking.dog?.name || booking.external_dog_name || "";
    if (dogName.toLowerCase().includes(search)) return true;

    // Sök i ägarnamn
    const ownerName =
      booking.dog?.owner?.full_name || booking.external_customer_name || "";
    if (ownerName.toLowerCase().includes(search)) return true;

    // Sök i ras
    const breed = booking.dog?.breed || booking.external_dog_breed || "";
    if (breed.toLowerCase().includes(search)) return true;

    return false;
  });

  const filteredJournals = journals.filter((journal) => {
    if (!searchTerm) return true;
    const search = searchTerm.toLowerCase();

    const dogName = journal.dog?.name || journal.external_dog_name || "";
    if (dogName.toLowerCase().includes(search)) return true;

    const ownerName =
      journal.dog?.owner?.full_name || journal.external_customer_name || "";
    if (ownerName.toLowerCase().includes(search)) return true;

    const breed = journal.dog?.breed || journal.external_dog_breed || "";
    if (breed.toLowerCase().includes(search)) return true;

    return false;
  });

  /* ===========================
   * Rendering
   * =========================== */
  if (authLoading || (loading && !timeoutReached)) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-[1600px] mx-auto">
          <div className="animate-pulse space-y-4">
            <div className="h-10 bg-gray-200 rounded w-64"></div>
            <div className="flex gap-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-10 bg-gray-200 rounded w-32"></div>
              ))}
            </div>
            <div className="bg-white rounded-lg p-6 space-y-4">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="h-24 bg-gray-200 rounded"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (timeoutReached || (!effectiveOrgId && !authLoading)) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
        <div className="bg-white rounded-lg shadow-sm p-8 max-w-md w-full text-center">
          <AlertTriangle className="h-12 w-12 text-yellow-600 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">
            Ingen organisation hittades
          </h2>
          <p className="text-gray-600 mb-6">
            Du är inte kopplad till någon organisation. Kontakta
            administratören.
          </p>
          <Link
            href="/dashboard"
            className="inline-flex items-center justify-center px-4 py-2 bg-[#2c7a4c] text-white rounded-md hover:bg-[#245c3a] transition"
          >
            Tillbaka till dashboard
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero-sektion med orange gradient */}
      <div className="relative bg-gradient-to-br from-orange-600 to-orange-700 text-white overflow-hidden">
        <div className="absolute inset-0 bg-black/10"></div>
        <div className="relative max-w-[1600px] mx-auto px-6 py-8">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-3">
              <Scissors className="h-10 w-10" />
              <h1 className="text-3xl font-bold">Frisör</h1>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={loadData}
                className="p-2 bg-white/20 hover:bg-white/30 rounded-lg transition"
                title="Uppdatera"
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
          <p className="text-white/90">Hantera frisörbokningar och journal</p>
        </div>
      </div>

      {/* Huvudinnehåll */}
      <div className="max-w-[1600px] mx-auto px-6 py-6">
        {error && (
          <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
            <AlertTriangle className="h-5 w-5 text-red-600 mt-0.5 flex-shrink-0" />
            <div>
              <p className="text-red-800 font-medium">Fel</p>
              <p className="text-red-700 text-sm">{error}</p>
            </div>
          </div>
        )}

        {/* Flikar */}
        <div className="bg-white rounded-lg shadow-sm mb-6">
          <div className="border-b border-gray-200 px-6">
            <nav className="flex gap-6" aria-label="Tabs">
              <button
                onClick={() => setActiveTab("bokningar")}
                className={`py-4 px-1 border-b-2 font-medium text-sm transition ${
                  activeTab === "bokningar"
                    ? "border-orange-600 text-orange-600"
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                }`}
              >
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  Bokningar ({bookings.length})
                </div>
              </button>
              <button
                onClick={() => setActiveTab("journal")}
                className={`py-4 px-1 border-b-2 font-medium text-sm transition ${
                  activeTab === "journal"
                    ? "border-orange-600 text-orange-600"
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                }`}
              >
                <div className="flex items-center gap-2">
                  <BookOpen className="h-4 w-4" />
                  Journal & Historik ({journals.length})
                </div>
              </button>
              <button
                onClick={() => setActiveTab("vantelista")}
                className={`py-4 px-1 border-b-2 font-medium text-sm transition ${
                  activeTab === "vantelista"
                    ? "border-orange-600 text-orange-600"
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                }`}
              >
                <div className="flex items-center gap-2">
                  <Users className="h-4 w-4" />
                  Väntelista (0)
                </div>
              </button>
            </nav>
          </div>

          {/* Sök + Ny bokning */}
          <div className="p-6 border-b border-gray-200">
            <div className="flex items-center gap-4">
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Sök på hund, ägare eller ras..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                />
              </div>
              <Link href="/frisor/ny-bokning">
                <button className="flex items-center gap-2 px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white rounded-md font-medium transition">
                  <Plus className="h-4 w-4" />
                  Ny bokning
                </button>
              </Link>
            </div>
          </div>

          {/* Innehåll baserat på aktiv flik */}
          <div className="p-6">
            {activeTab === "bokningar" && (
              <BokningarView
                bookings={filteredBookings}
                onUpdate={loadData}
                getStatusColor={getStatusColor}
                getStatusLabel={getStatusLabel}
              />
            )}
            {activeTab === "journal" && (
              <JournalView journals={filteredJournals} onUpdate={loadData} />
            )}
            {activeTab === "vantelista" && <VantelistaView />}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ===========================
 * Sub-Components
 * =========================== */

function BokningarView({
  bookings,
  onUpdate,
  getStatusColor,
  getStatusLabel,
}: {
  bookings: GroomingBooking[];
  onUpdate: () => void;
  getStatusColor: (status: string) => string;
  getStatusLabel: (status: string) => string;
}) {
  if (bookings.length === 0) {
    return (
      <div className="text-center py-12">
        <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
        <p className="text-gray-600">Inga bokningar ännu</p>
        <p className="text-sm text-gray-500 mt-1">
          Skapa din första frisörbokning genom att klicka på "Ny bokning"
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {bookings.map((booking) => (
        <div
          key={booking.id}
          className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition"
        >
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <h3 className="font-semibold text-lg text-gray-900">
                  {booking.dog?.name ||
                    booking.external_dog_name ||
                    "Okänd hund"}
                </h3>
                <span
                  className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(booking.status)}`}
                >
                  {getStatusLabel(booking.status)}
                </span>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div>
                  <p className="text-gray-500">Ägare</p>
                  <p className="text-gray-900 font-medium">
                    {booking.dog?.owner?.full_name ||
                      booking.external_customer_name ||
                      "Utomstående"}
                  </p>
                </div>
                <div>
                  <p className="text-gray-500">Ras</p>
                  <p className="text-gray-900">
                    {booking.dog?.breed || booking.external_dog_breed || "-"}
                  </p>
                </div>
                <div>
                  <p className="text-gray-500">Datum & Tid</p>
                  <p className="text-gray-900 font-medium">
                    {new Date(booking.appointment_date).toLocaleDateString(
                      "sv-SE"
                    )}
                    {booking.appointment_time &&
                      ` kl ${booking.appointment_time.slice(0, 5)}`}
                  </p>
                </div>
                <div>
                  <p className="text-gray-500">Behandling</p>
                  <p className="text-gray-900">
                    {SERVICE_LABELS[booking.service_type] ||
                      booking.service_type}
                  </p>
                </div>
              </div>

              {booking.notes && (
                <div className="mt-3 pt-3 border-t border-gray-100">
                  <p className="text-sm text-gray-600">{booking.notes}</p>
                </div>
              )}
            </div>

            <div className="ml-4 text-right">
              {booking.estimated_price && (
                <p className="text-lg font-semibold text-gray-900">
                  {booking.estimated_price} kr
                </p>
              )}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

function JournalView({
  journals,
  onUpdate,
}: {
  journals: GroomingJournal[];
  onUpdate: () => void;
}) {
  if (journals.length === 0) {
    return (
      <div className="text-center py-12">
        <BookOpen className="h-12 w-12 text-gray-400 mx-auto mb-4" />
        <p className="text-gray-600">Ingen klipphistorik ännu</p>
        <p className="text-sm text-gray-500 mt-1">
          Journalanteckningar skapas automatiskt när bokningar genomförs
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {journals.map((journal) => (
        <div
          key={journal.id}
          className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition"
        >
          <div className="flex items-start justify-between mb-3">
            <div>
              <h3 className="font-semibold text-lg text-gray-900">
                {journal.dog?.name || journal.external_dog_name || "Okänd hund"}
              </h3>
              <p className="text-sm text-gray-500">
                {new Date(journal.appointment_date).toLocaleDateString("sv-SE")}
              </p>
            </div>
            <p className="text-lg font-semibold text-gray-900">
              {journal.final_price} kr
            </p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm mb-3">
            <div>
              <p className="text-gray-500">Behandling</p>
              <p className="text-gray-900 font-medium">
                {SERVICE_LABELS[journal.service_type] || journal.service_type}
              </p>
            </div>
            {journal.clip_length && (
              <div>
                <p className="text-gray-500">Klipplängd</p>
                <p className="text-gray-900">{journal.clip_length}</p>
              </div>
            )}
            {journal.shampoo_type && (
              <div>
                <p className="text-gray-500">Schampo</p>
                <p className="text-gray-900">{journal.shampoo_type}</p>
              </div>
            )}
            {journal.duration_minutes && (
              <div>
                <p className="text-gray-500">Tid</p>
                <p className="text-gray-900">{journal.duration_minutes} min</p>
              </div>
            )}
          </div>

          {journal.special_treatments && (
            <div className="mb-3">
              <p className="text-sm text-gray-500">Specialbehandlingar</p>
              <p className="text-sm text-gray-900">
                {journal.special_treatments}
              </p>
            </div>
          )}

          {journal.notes && (
            <div className="pt-3 border-t border-gray-100">
              <p className="text-sm text-gray-600">{journal.notes}</p>
            </div>
          )}

          {journal.next_appointment_recommended && (
            <div className="mt-3 pt-3 border-t border-gray-100 bg-blue-50 -m-4 p-4 rounded-b-lg">
              <p className="text-sm text-blue-800">
                <strong>Nästa besök rekommenderas:</strong>{" "}
                {journal.next_appointment_recommended}
              </p>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

function VantelistaView() {
  return (
    <div className="text-center py-12">
      <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
      <p className="text-gray-600">Väntelista kommer snart</p>
      <p className="text-sm text-gray-500 mt-1">
        Här kommer du kunna hantera kunder som väntar på lediga tider
      </p>
    </div>
  );
}
