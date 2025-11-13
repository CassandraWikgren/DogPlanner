"use client";

import React, { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/app/context/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import Link from "next/link";
import {
  CreditCard,
  Briefcase,
  Euro,
  Building2,
  ArrowLeft,
  FileText,
  Settings,
  Users,
  TrendingUp,
} from "lucide-react";

// Felkoder enligt systemet
const ERROR_CODES = {
  DATABASE_CONNECTION: "[ERR-1001]",
  PDF_EXPORT: "[ERR-2001]",
  REALTIME: "[ERR-3001]",
  VALIDATION: "[ERR-4001]",
} as const;

interface AdminStats {
  totalOwners: number;
  totalDogs: number;
  totalRooms: number;
  activeSubscriptions: number;
  totalBookings: number;
  monthlyRevenue: number;
  checkedInDogs: number;
  roomOccupancy: number;
}

/**
 * Admin Dashboard - Centralhantering av ekonomi och systemkonfiguration
 * [ERR-1001] Databaskoppling, [ERR-2001] PDF-export, [ERR-3001] Realtime
 */
export default function AdminPage() {
  const { user, loading: authLoading } = useAuth();
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Ladda statistik från databasen
  useEffect(() => {
    if (!user || authLoading) return;
    loadAdminStats();
  }, [user, authLoading]);

  const loadAdminStats = async () => {
    try {
      setLoading(true);
      setError(null);

      const orgId = user?.user_metadata?.org_id || user?.id;

      // Parallella anrop för bättre prestanda
      const [ownersResult, dogsResult, roomsResult, bookingsResult] =
        await Promise.all([
          (supabase as any).from("owners").select("id").eq("org_id", orgId),
          (supabase as any)
            .from("dogs")
            .select("id, subscription, checked_in")
            .eq("org_id", orgId),
          (supabase as any)
            .from("rooms")
            .select("id, capacity_m2")
            .eq("org_id", orgId)
            .eq("is_active", true),
          (supabase as any)
            .from("bookings")
            .select("id, total_price, status, created_at")
            .eq("org_id", orgId),
        ]);

      // Kontrollera fel
      if (ownersResult.error) throw ownersResult.error;
      if (dogsResult.error) throw dogsResult.error;
      if (roomsResult.error) throw roomsResult.error;
      if (bookingsResult.error) throw bookingsResult.error;

      const owners = ownersResult.data || [];
      const dogs = dogsResult.data || [];
      const rooms = roomsResult.data || [];
      const bookings = bookingsResult.data || [];

      // Beräkna statistik
      const checkedInDogs = dogs.filter((dog: any) => dog.checked_in).length;
      const activeSubscriptions = dogs.filter(
        (dog: any) => dog.subscription
      ).length;
      const totalCapacity = rooms.reduce(
        (sum: number, room: any) => sum + room.capacity_m2,
        0
      );
      const occupancyRate =
        totalCapacity > 0 ? ((checkedInDogs * 2.5) / totalCapacity) * 100 : 0; // Antar 2.5m² per hund

      // Beräkna månadens intäkt (endast completed bookings)
      const currentMonth = new Date().toISOString().slice(0, 7); // YYYY-MM
      const monthlyRevenue = bookings
        .filter(
          (booking: any) =>
            booking.status === "completed" &&
            booking.created_at?.startsWith(currentMonth)
        )
        .reduce(
          (sum: number, booking: any) => sum + (booking.total_price || 0),
          0
        );

      const newStats: AdminStats = {
        totalOwners: owners.length,
        totalDogs: dogs.length,
        totalRooms: rooms.length,
        activeSubscriptions,
        totalBookings: bookings.length,
        monthlyRevenue,
        checkedInDogs,
        roomOccupancy: Math.round(occupancyRate),
      };

      setStats(newStats);
    } catch (err: any) {
      console.error(
        `${ERROR_CODES.DATABASE_CONNECTION} Fel vid laddning av admin-statistik:`,
        err
      );
      setError(
        `${ERROR_CODES.DATABASE_CONNECTION} Kunde inte ladda statistik: ${err.message}`
      );
    } finally {
      setLoading(false);
    }
  };

  // Loading state
  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-6xl mx-auto p-6">
          <Card>
            <CardContent className="p-8 text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600 mx-auto mb-4"></div>
              <p className="text-gray-600">Laddar admin-panel...</p>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-6xl mx-auto p-6">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center space-x-4 mb-4">
            <Link
              href="/dashboard"
              className="text-gray-600 hover:text-gray-900"
            >
              <ArrowLeft className="h-6 w-6" />
            </Link>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                👑 Administration
              </h1>
              <p className="text-gray-600 mt-1">
                Systemhantering, ekonomi och konfiguration
              </p>
            </div>
          </div>
        </div>

        {/* Error display */}
        {error && (
          <Card className="mb-6 border-red-200 bg-red-50">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 text-red-700">
                <Settings className="h-5 w-5" />
                <p>{error}</p>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Admin Functions Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Fakturor */}
          <Card className="border-0 shadow-lg hover:shadow-xl transition-all duration-300 group">
            <CardHeader className="text-center pb-4">
              <div className="flex justify-center mb-4">
                <div className="p-4 bg-blue-100 rounded-full group-hover:bg-blue-200 transition-colors">
                  <CreditCard className="h-8 w-8 text-blue-600" />
                </div>
              </div>
              <CardTitle className="text-xl text-blue-700">
                💰 Fakturor
              </CardTitle>
              <p className="text-gray-600 text-sm mt-2">
                Ekonomi, fakturor och anteckningar till ekonomi. Kärnan i
                verksamheten.
              </p>
            </CardHeader>
            <CardContent className="pt-0">
              <Link href="/admin/faktura">
                <div className="w-full bg-blue-500 hover:bg-blue-600 text-white rounded-lg p-3 text-center font-semibold transition-colors">
                  Hantera fakturor
                </div>
              </Link>
            </CardContent>
          </Card>

          {/* Mitt Abonnemang */}
          <Card className="border-0 shadow-lg hover:shadow-xl transition-all duration-300 group">
            <CardHeader className="text-center pb-4">
              <div className="flex justify-center mb-4">
                <div className="p-4 bg-purple-100 rounded-full group-hover:bg-purple-200 transition-colors">
                  <Briefcase className="h-8 w-8 text-purple-600" />
                </div>
              </div>
              <CardTitle className="text-xl text-purple-700">
                📋 Mitt abonnemang
              </CardTitle>
              <p className="text-gray-600 text-sm mt-2">
                Hantera din DogPlanner-prenumeration. Ändra, pausa eller
                avsluta.
              </p>
            </CardHeader>
            <CardContent className="pt-0">
              <Link href="/admin/abonnemang">
                <div className="w-full bg-purple-500 hover:bg-purple-600 text-white rounded-lg p-3 text-center font-semibold transition-colors">
                  Hantera abonnemang
                </div>
              </Link>
            </CardContent>
          </Card>

          {/* Priser */}
          <Card className="border-0 shadow-lg hover:shadow-xl transition-all duration-300 group">
            <CardHeader className="text-center pb-4">
              <div className="flex justify-center mb-4">
                <div className="p-4 bg-green-100 rounded-full group-hover:bg-green-200 transition-colors">
                  <Euro className="h-8 w-8 text-green-600" />
                </div>
              </div>
              <CardTitle className="text-xl text-green-700">
                💵 Priser
              </CardTitle>
              <p className="text-gray-600 text-sm mt-2">
                Företagspriser på abonnemang, tilläggstjänster och rabatter.
              </p>
            </CardHeader>
            <CardContent className="pt-0">
              <Link href="/admin/priser">
                <div className="w-full bg-green-500 hover:bg-green-600 text-white rounded-lg p-3 text-center font-semibold transition-colors">
                  Hantera priser
                </div>
              </Link>
            </CardContent>
          </Card>

          {/* Hundrum */}
          <Card className="border-0 shadow-lg hover:shadow-xl transition-all duration-300 group">
            <CardHeader className="text-center pb-4">
              <div className="flex justify-center mb-4">
                <div className="p-4 bg-orange-100 rounded-full group-hover:bg-orange-200 transition-colors">
                  <Building2 className="h-8 w-8 text-orange-600" />
                </div>
              </div>
              <CardTitle className="text-xl text-orange-700">
                🏠 Hundrum
              </CardTitle>
              <p className="text-gray-600 text-sm mt-2">
                Rumhantering, kvadratmeter och kapacitetsberäkningar.
              </p>
            </CardHeader>
            <CardContent className="pt-0">
              <Link href="/admin/rum">
                <div className="w-full bg-orange-500 hover:bg-orange-600 text-white rounded-lg p-3 text-center font-semibold transition-colors">
                  Hantera rum
                </div>
              </Link>
            </CardContent>
          </Card>
        </div>

        {/* Comprehensive Stats */}
        <div className="mt-12">
          <h2 className="text-xl font-semibold text-gray-900 mb-6">
            📊 Verksamhetsöversikt
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {/* Totalt antal ägare */}
            <Card className="border-0 shadow-md hover:shadow-lg transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">
                      Totalt ägare
                    </p>
                    <p className="text-2xl font-bold text-blue-600">
                      {stats?.totalOwners || 0}
                    </p>
                  </div>
                  <Users className="h-8 w-8 text-blue-600" />
                </div>
              </CardContent>
            </Card>

            {/* Registrerade hundar */}
            <Card className="border-0 shadow-md hover:shadow-lg transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">
                      Registrerade hundar
                    </p>
                    <p className="text-2xl font-bold text-green-600">
                      {stats?.totalDogs || 0}
                    </p>
                  </div>
                  <div className="text-green-600">🐕</div>
                </div>
              </CardContent>
            </Card>

            {/* Incheckade hundar */}
            <Card className="border-0 shadow-md hover:shadow-lg transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">
                      Incheckade idag
                    </p>
                    <p className="text-2xl font-bold text-purple-600">
                      {stats?.checkedInDogs || 0}
                    </p>
                  </div>
                  <div className="text-purple-600">✅</div>
                </div>
              </CardContent>
            </Card>

            {/* Rumkapacitet */}
            <Card className="border-0 shadow-md hover:shadow-lg transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">
                      Beläggning
                    </p>
                    <p className="text-2xl font-bold text-orange-600">
                      {stats?.roomOccupancy || 0}%
                    </p>
                  </div>
                  <div className="text-orange-600">🏠</div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Ekonomi och verksamhet */}
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            💰 Ekonomi & Verksamhet
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Månadens intäkt */}
            <Card className="border-0 shadow-md hover:shadow-lg transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">
                      Månadens intäkt
                    </p>
                    <p className="text-2xl font-bold text-emerald-600">
                      {stats?.monthlyRevenue
                        ? `${stats.monthlyRevenue.toLocaleString("sv-SE")} kr`
                        : "0 kr"}
                    </p>
                  </div>
                  <TrendingUp className="h-8 w-8 text-emerald-600" />
                </div>
              </CardContent>
            </Card>

            {/* Aktiva abonnemang */}
            <Card className="border-0 shadow-md hover:shadow-lg transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">
                      Aktiva abonnemang
                    </p>
                    <p className="text-2xl font-bold text-indigo-600">
                      {stats?.activeSubscriptions || 0}
                    </p>
                  </div>
                  <div className="text-indigo-600">📋</div>
                </div>
              </CardContent>
            </Card>

            {/* Totala bokningar */}
            <Card className="border-0 shadow-md hover:shadow-lg transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">
                      Totala bokningar
                    </p>
                    <p className="text-2xl font-bold text-pink-600">
                      {stats?.totalBookings || 0}
                    </p>
                  </div>
                  <FileText className="h-8 w-8 text-pink-600" />
                </div>
              </CardContent>
            </Card>

            {/* Antal rum */}
            <Card className="border-0 shadow-md hover:shadow-lg transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">
                      Aktiva rum
                    </p>
                    <p className="text-2xl font-bold text-cyan-600">
                      {stats?.totalRooms || 0}
                    </p>
                  </div>
                  <div className="text-cyan-600">🏢</div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
