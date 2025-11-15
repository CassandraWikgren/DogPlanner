"use client";

// Förhindra prerendering för att undvika build-fel
export const dynamic = "force-dynamic";

import React, { useState, useEffect } from "react";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import { useAuth } from "@/app/context/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import Link from "next/link";
import {
  Scissors,
  Calendar,
  Plus,
  Clock,
  CheckCircle,
  XCircle,
  PawPrint,
  DollarSign,
  Search,
} from "lucide-react";

interface Dog {
  id: string;
  name: string;
  breed?: string;
  owner?: {
    full_name: string;
    phone?: string;
  };
}

interface GroomingBooking {
  id: string;
  dog_id: string;
  appointment_date: string;
  appointment_time: string;
  service_type: string;
  estimated_price?: number;
  status: "confirmed" | "completed" | "cancelled" | "no_show";
  notes?: string;
  dog?: Dog;
  created_at: string;
}

interface GroomingJournalEntry {
  id: string;
  dog_id: string;
  appointment_date: string;
  service_type: string;
  clip_length?: string;
  shampoo_type?: string;
  special_treatments?: string;
  final_price: number;
  duration_minutes?: number;
  notes?: string;
  before_photos?: string[];
  after_photos?: string[];
  next_appointment_recommended?: string;
  dog?: Dog;
  created_at: string;
}

export default function FrisorPage() {
  const supabase = createClientComponentClient();
  const { currentOrgId, loading: authLoading } = useAuth();
  const [activeTab, setActiveTab] = useState<"bookings" | "journal">(
    "bookings"
  );
  const [bookings, setBookings] = useState<GroomingBooking[]>([]);
  const [journalEntries, setJournalEntries] = useState<GroomingJournalEntry[]>(
    []
  );
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [dateFilter, setDateFilter] = useState("");

  useEffect(() => {
    if (currentOrgId && !authLoading) {
      fetchData();
    }
  }, [activeTab, currentOrgId, authLoading]);

  const fetchData = async () => {
    if (!currentOrgId) return;

    setLoading(true);
    try {
      if (activeTab === "bookings") {
        const { data, error } = await supabase
          .from("grooming_bookings")
          .select(
            `
            *,
            dog:dogs!grooming_bookings_dog_id_fkey(
              id,
              name,
              breed,
              owner:owners!dogs_owner_id_fkey(
                full_name,
                phone
              )
            )
          `
          )
          .eq("org_id", currentOrgId)
          .order("appointment_date", { ascending: true });

        if (error) throw error;
        setBookings(data || []);
      } else {
        const { data, error } = await supabase
          .from("grooming_journal")
          .select(
            `
            *,
            dog:dogs!grooming_journal_dog_id_fkey(
              id,
              name,
              breed,
              owner:owners!dogs_owner_id_fkey(
                full_name,
                phone
              )
            )
          `
          )
          .eq("org_id", currentOrgId)
          .order("appointment_date", { ascending: false });

        if (error) throw error;
        setJournalEntries(data || []);
      }
    } catch (error) {
      console.error("Fel vid hämtning av data:", error);
    } finally {
      setLoading(false);
    }
  };

  const updateBookingStatus = async (
    id: string,
    status: GroomingBooking["status"]
  ) => {
    try {
      const { error } = await supabase
        .from("grooming_bookings")
        .update({ status })
        .eq("id", id);

      if (error) throw error;
      await fetchData();
    } catch (error) {
      console.error("Fel vid uppdatering av bokning:", error);
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
        return "bg-orange-100 text-orange-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "confirmed":
        return <Clock className="h-4 w-4" />;
      case "completed":
        return <CheckCircle className="h-4 w-4" />;
      case "cancelled":
        return <XCircle className="h-4 w-4" />;
      case "no_show":
        return <XCircle className="h-4 w-4" />;
      default:
        return <Clock className="h-4 w-4" />;
    }
  };

  const getStatusText = (status: string) => {
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
        return "Okänd";
    }
  };

  const filterData = () => {
    if (activeTab === "bookings") {
      return bookings.filter((booking) => {
        const matchesSearch =
          !searchTerm ||
          booking.dog?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          booking.dog?.owner?.full_name
            ?.toLowerCase()
            .includes(searchTerm.toLowerCase()) ||
          booking.service_type
            ?.toLowerCase()
            .includes(searchTerm.toLowerCase());

        const matchesDate =
          !dateFilter || booking.appointment_date === dateFilter;

        return matchesSearch && matchesDate;
      });
    } else {
      return journalEntries.filter((entry) => {
        const matchesSearch =
          !searchTerm ||
          entry.dog?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          entry.dog?.owner?.full_name
            ?.toLowerCase()
            .includes(searchTerm.toLowerCase()) ||
          entry.service_type?.toLowerCase().includes(searchTerm.toLowerCase());

        const matchesDate =
          !dateFilter || entry.appointment_date === dateFilter;

        return matchesSearch && matchesDate;
      });
    }
  };

  const stats = {
    todayBookings: bookings.filter(
      (b) =>
        b.appointment_date === new Date().toISOString().split("T")[0] &&
        b.status === "confirmed"
    ).length,
    completedThisWeek: journalEntries.filter((e) => {
      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);
      return new Date(e.appointment_date) >= weekAgo;
    }).length,
    totalRevenue: journalEntries.reduce(
      (sum, entry) => sum + (entry.final_price || 0),
      0
    ),
    pendingBookings: bookings.filter((b) => b.status === "confirmed").length,
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-[1600px] mx-auto">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-64 mb-6"></div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="h-32 bg-gray-200 rounded-lg"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Kompakt header med inline stats */}
      <div className="border-b border-gray-200 bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <h1 className="text-[32px] font-bold text-[#2c7a4c] leading-tight">
                Hundfrisör
              </h1>
              <p className="mt-1 text-base text-gray-600">
                Hantera frisörbokningar och journalföring för alla behandlingar
              </p>
            </div>

            {/* Statistik inline höger */}
            <div className="flex items-center gap-4 ml-8">
              <div className="text-center bg-white rounded-lg px-4 py-2 border border-gray-200 shadow-sm">
                <p className="text-2xl font-bold text-orange-600">
                  {stats.todayBookings}
                </p>
                <p className="text-xs text-gray-600 mt-0.5">Idag</p>
              </div>
              <div className="text-center bg-white rounded-lg px-4 py-2 border border-gray-200 shadow-sm">
                <p className="text-2xl font-bold text-green-600">
                  {stats.completedThisWeek}
                </p>
                <p className="text-xs text-gray-600 mt-0.5">Denna vecka</p>
              </div>
              <div className="text-center bg-white rounded-lg px-4 py-2 border border-gray-200 shadow-sm">
                <p className="text-2xl font-bold text-[#2c7a4c]">
                  {stats.pendingBookings}
                </p>
                <p className="text-xs text-gray-600 mt-0.5">Väntande</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="max-w-7xl mx-auto px-6 py-6">
        {/* Action buttons */}
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center gap-3"></div>
          <Link
            href="/frisor/ny-bokning"
            className="inline-flex items-center px-4 py-2.5 rounded-md text-[15px] font-semibold text-white bg-[#2c7a4c] hover:bg-[#236139] shadow-sm transition-colors"
          >
            <Plus className="h-4 w-4 mr-2" />
            Ny bokning
          </Link>
        </div>

        {/* Tabs */}
        <Card className="mb-6">
          <CardHeader>
            <div className="flex space-x-4">
              <button
                onClick={() => setActiveTab("bookings")}
                className={`px-4 py-2 rounded-md font-medium transition-colors ${
                  activeTab === "bookings"
                    ? "bg-orange-600 text-white"
                    : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                }`}
              >
                Bokningar
              </button>
              <button
                onClick={() => setActiveTab("journal")}
                className={`px-4 py-2 rounded-md font-medium transition-colors ${
                  activeTab === "journal"
                    ? "bg-orange-600 text-white"
                    : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                }`}
              >
                Journal
              </button>
            </div>
          </CardHeader>
        </Card>

        {/* Filter */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Search className="h-5 w-5" />
              Sök och filtrera
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Sök på hund, ägare eller behandling..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Input
                type="date"
                value={dateFilter}
                onChange={(e) => setDateFilter(e.target.value)}
                placeholder="Filtrera på datum"
              />
              <Button
                onClick={() => {
                  setSearchTerm("");
                  setDateFilter("");
                }}
                variant="outline"
              >
                Rensa filter
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Innehåll baserat på aktiv flik */}
        {activeTab === "bookings" ? (
          <div className="space-y-6">
            {(filterData() as GroomingBooking[]).map((booking) => (
              <Card key={booking.id}>
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="text-lg flex items-center gap-2">
                        <PawPrint className="h-5 w-5 text-orange-600" />
                        {booking.dog?.name}
                      </CardTitle>
                      <p className="text-gray-600">
                        {booking.dog?.breed} • Ägare:{" "}
                        {booking.dog?.owner?.full_name}
                      </p>
                    </div>
                    <Badge className={getStatusColor(booking.status)}>
                      <div className="flex items-center gap-1">
                        {getStatusIcon(booking.status)}
                        {getStatusText(booking.status)}
                      </div>
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <h4 className="font-medium text-gray-900 mb-1">
                        Datum & tid
                      </h4>
                      <p className="text-sm text-gray-600">
                        {new Date(booking.appointment_date).toLocaleDateString(
                          "sv-SE"
                        )}{" "}
                        kl {booking.appointment_time}
                      </p>
                    </div>
                    <div>
                      <h4 className="font-medium text-gray-900 mb-1">
                        Behandling
                      </h4>
                      <p className="text-sm text-gray-600">
                        {booking.service_type}
                      </p>
                    </div>
                    <div>
                      <h4 className="font-medium text-gray-900 mb-1">
                        Uppskattat pris
                      </h4>
                      <p className="text-sm text-gray-600">
                        {booking.estimated_price
                          ? `${booking.estimated_price} kr`
                          : "Ej angivet"}
                      </p>
                    </div>
                  </div>

                  {booking.notes && (
                    <div>
                      <h4 className="font-medium text-gray-900 mb-1">
                        Anteckningar
                      </h4>
                      <p className="text-sm text-gray-600">{booking.notes}</p>
                    </div>
                  )}

                  {booking.status === "confirmed" && (
                    <div className="flex gap-3">
                      <Button
                        onClick={() =>
                          updateBookingStatus(booking.id, "completed")
                        }
                        className="bg-green-600 hover:bg-green-700"
                      >
                        <CheckCircle className="h-4 w-4 mr-2" />
                        Markera som genomförd
                      </Button>
                      <Button
                        onClick={() =>
                          updateBookingStatus(booking.id, "no_show")
                        }
                        variant="outline"
                      >
                        Uteblev
                      </Button>
                      <Button
                        onClick={() =>
                          updateBookingStatus(booking.id, "cancelled")
                        }
                        variant="destructive"
                      >
                        Avboka
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <div className="space-y-6">
            {(filterData() as GroomingJournalEntry[]).map((entry) => (
              <Card key={entry.id}>
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="text-lg flex items-center gap-2">
                        <Scissors className="h-5 w-5 text-orange-600" />
                        {entry.dog?.name}
                      </CardTitle>
                      <p className="text-gray-600">
                        {entry.dog?.breed} • Ägare:{" "}
                        {entry.dog?.owner?.full_name}
                      </p>
                    </div>
                    <Badge className="bg-green-100 text-green-800">
                      {entry.final_price} kr
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div>
                      <h4 className="font-medium text-gray-900 mb-1">Datum</h4>
                      <p className="text-sm text-gray-600">
                        {new Date(entry.appointment_date).toLocaleDateString(
                          "sv-SE"
                        )}
                      </p>
                    </div>
                    <div>
                      <h4 className="font-medium text-gray-900 mb-1">
                        Behandling
                      </h4>
                      <p className="text-sm text-gray-600">
                        {entry.service_type}
                      </p>
                    </div>
                    <div>
                      <h4 className="font-medium text-gray-900 mb-1">
                        Klipplängd
                      </h4>
                      <p className="text-sm text-gray-600">
                        {entry.clip_length || "Ej angivet"}
                      </p>
                    </div>
                    <div>
                      <h4 className="font-medium text-gray-900 mb-1">Tid</h4>
                      <p className="text-sm text-gray-600">
                        {entry.duration_minutes
                          ? `${entry.duration_minutes} min`
                          : "Ej angivet"}
                      </p>
                    </div>
                  </div>

                  {entry.special_treatments && (
                    <div>
                      <h4 className="font-medium text-gray-900 mb-1">
                        Specialbehandlingar
                      </h4>
                      <p className="text-sm text-gray-600">
                        {entry.special_treatments}
                      </p>
                    </div>
                  )}

                  {entry.notes && (
                    <div>
                      <h4 className="font-medium text-gray-900 mb-1">
                        Anteckningar
                      </h4>
                      <p className="text-sm text-gray-600">{entry.notes}</p>
                    </div>
                  )}

                  {entry.next_appointment_recommended && (
                    <div>
                      <h4 className="font-medium text-gray-900 mb-1">
                        Nästa besök rekommenderas
                      </h4>
                      <p className="text-sm text-gray-600">
                        {new Date(
                          entry.next_appointment_recommended
                        ).toLocaleDateString("sv-SE")}
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Tom lista */}
        {filterData().length === 0 && (
          <Card className="text-center py-12">
            <CardContent>
              <Scissors className="h-16 w-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                {activeTab === "bookings"
                  ? "Inga bokningar hittades"
                  : "Inga journalposter hittades"}
              </h3>
              <p className="text-gray-600 mb-4">
                {activeTab === "bookings"
                  ? "Skapa en ny bokning för att komma igång."
                  : "Journalposter skapas automatiskt när bokningar markeras som genomförda."}
              </p>
              {activeTab === "bookings" && (
                <Link href="/frisor/ny-bokning">
                  <Button className="bg-orange-600 hover:bg-orange-700">
                    Skapa första bokningen
                  </Button>
                </Link>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
