"use client";

import React, { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "../context/AuthContext";
import Link from "next/link";

// Felkoder enligt systemet
const ERROR_CODES = {
  DATABASE_CONNECTION: "[ERR-1001]",
  PDF_EXPORT: "[ERR-2001]",
  REALTIME: "[ERR-3001]",
  VALIDATION: "[ERR-4001]",
} as const;

interface DashboardStats {
  totalDogs: number;
  totalOwners: number;
  activeBookings: number;
  monthlyRevenue: number;
  checkedInToday: number;
  pendingInvoices: number;
}

export default function Dashboard() {
  const { user, loading: authLoading } = useAuth();
  const [stats, setStats] = useState<DashboardStats>({
    totalDogs: 0,
    totalOwners: 0,
    activeBookings: 0,
    monthlyRevenue: 0,
    checkedInToday: 0,
    pendingInvoices: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user || authLoading) return;
    loadDashboardStats();
  }, [user, authLoading]);

  const loadDashboardStats = async () => {
    try {
      setLoading(true);
      setError(null);

      // Parallel queries för bättre prestanda - använder korrekt Supabase-struktur
      const [
        dogsResult,
        ownersResult,
        bookingsResult,
        revenueResult,
        checkedInResult,
        invoicesResult,
      ] = await Promise.all([
        (supabase as any)
          .from("dogs")
          .select("id", { count: "exact" })
          .eq("org_id", user?.org_id),
        (supabase as any)
          .from("owners")
          .select("id", { count: "exact" })
          .eq("org_id", user?.org_id),
        (supabase as any)
          .from("bookings")
          .select("id", { count: "exact" })
          .eq("org_id", user?.org_id)
          .eq("status", "confirmed"),
        (supabase as any)
          .from("bookings")
          .select("price_kr")
          .eq("org_id", user?.org_id)
          .eq("status", "completed")
          .gte(
            "start_date",
            new Date(
              new Date().getFullYear(),
              new Date().getMonth(),
              1
            ).toISOString()
          ),
        (supabase as any)
          .from("bookings")
          .select("id", { count: "exact" })
          .eq("org_id", user?.org_id)
          .eq("start_date", new Date().toISOString().split("T")[0]),
        (supabase as any)
          .from("bookings")
          .select("id", { count: "exact" })
          .eq("org_id", user?.org_id)
          .eq("invoice_status", "pending"),
      ]);

      const monthlyRevenue =
        revenueResult.data?.reduce(
          (sum: number, booking: any) => sum + (booking.price_kr || 0),
          0
        ) || 0;

      setStats({
        totalDogs: dogsResult.count || 0,
        totalOwners: ownersResult.count || 0,
        activeBookings: bookingsResult.count || 0,
        monthlyRevenue,
        checkedInToday: checkedInResult.count || 0,
        pendingInvoices: invoicesResult.count || 0,
      });
    } catch (error) {
      console.error(
        `${ERROR_CODES.DATABASE_CONNECTION} Kunde inte ladda dashboard-statistik:`,
        error
      );
      setError("Kunde inte ladda dashboard-data. Försök igen senare.");
    } finally {
      setLoading(false);
    }
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto mb-4"></div>
          <p className="text-gray-600">Laddar dashboard...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center p-6 bg-white border border-red-200">
          <div className="text-red-600 mb-4">⚠️</div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            Dashboard-fel
          </h3>
          <p className="text-gray-600 mb-4">{error}</p>
          <button
            onClick={loadDashboardStats}
            className="bg-blue-600 text-white px-4 py-2 hover:bg-blue-700 transition-colors"
          >
            Försök igen
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-white">
      {/* Hero Section - Professionell och inbjudande */}
      <section
        className="relative text-center text-white overflow-hidden"
        style={{
          padding: "80px 20px 100px",
          background:
            'linear-gradient(rgba(44, 122, 76, 0.88), rgba(44, 122, 76, 0.88)), url("/Hero.jpeg") center/cover no-repeat',
        }}
      >
        <div className="relative z-10 max-w-4xl mx-auto">
          <h1 className="text-5xl font-bold mb-4">
            Välkommen till ditt Dashboard
          </h1>
          <p className="text-xl mb-8 leading-relaxed opacity-95 max-w-2xl mx-auto">
            Här får du snabb tillgång till dina hundar, abonnemang och fakturor.
          </p>
        </div>
      </section>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-6 -mt-12 pb-16">
        {/* Live Stats - Floating over hero */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-12">
          <div className="bg-white rounded-xl shadow-lg p-6 text-center border border-green-100">
            <div className="text-3xl font-bold text-[#2c7a4c] mb-1">
              {stats.totalDogs}
            </div>
            <div className="text-sm text-gray-600">Hundar registrerade</div>
          </div>
          <div className="bg-white rounded-xl shadow-lg p-6 text-center border border-green-100">
            <div className="text-3xl font-bold text-[#2c7a4c] mb-1">
              {stats.checkedInToday}
            </div>
            <div className="text-sm text-gray-600">Incheckade idag</div>
          </div>
          <div className="bg-white rounded-xl shadow-lg p-6 text-center border border-green-100">
            <div className="text-3xl font-bold text-[#2c7a4c] mb-1">
              {stats.activeBookings}
            </div>
            <div className="text-sm text-gray-600">Aktiva bokningar</div>
          </div>
          <div className="bg-white rounded-xl shadow-lg p-6 text-center border border-green-100">
            <div className="text-3xl font-bold text-[#2c7a4c] mb-1">
              {stats.monthlyRevenue.toLocaleString()}
            </div>
            <div className="text-sm text-gray-600">kr denna månad</div>
          </div>
        </div>

        {/* Feature Cards Grid - 4 primära funktioner */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
          {/* Hunddagis */}
          <Link
            href="/hunddagis"
            className="group bg-white rounded-2xl p-8 shadow-md hover:shadow-xl transition-all duration-300 border border-gray-100 hover:border-green-200 hover:-translate-y-1"
          >
            <div className="text-5xl mb-4">🐕</div>
            <h2 className="text-xl font-bold text-[#2c7a4c] mb-3">Hunddagis</h2>
            <p className="text-gray-600 text-sm leading-relaxed mb-4">
              Hantera dagishundar, schema och daglig verksamhet.
            </p>
            <div className="text-sm text-gray-500">
              {stats.totalDogs} hundar registrerade
            </div>
          </Link>

          {/* Hundpensionat */}
          <Link
            href="/hundpensionat"
            className="group bg-white rounded-2xl p-8 shadow-md hover:shadow-xl transition-all duration-300 border border-gray-100 hover:border-green-200 hover:-translate-y-1"
          >
            <div className="text-5xl mb-4">🏨</div>
            <h2 className="text-xl font-bold text-[#2c7a4c] mb-3">
              Hundpensionat
            </h2>
            <p className="text-gray-600 text-sm leading-relaxed mb-4">
              Hantera pensionshundar, bokningar och in-/utcheckning.
            </p>
            <div className="text-sm text-gray-500">
              {stats.activeBookings} aktiva bokningar
            </div>
          </Link>

          {/* Hundfrisör */}
          <Link
            href="/frisor"
            className="group bg-white rounded-2xl p-8 shadow-md hover:shadow-xl transition-all duration-300 border border-gray-100 hover:border-green-200 hover:-translate-y-1"
          >
            <div className="text-5xl mb-4">✂️</div>
            <h2 className="text-xl font-bold text-[#2c7a4c] mb-3">
              Hundfrisör
            </h2>
            <p className="text-gray-600 text-sm leading-relaxed mb-4">
              Hantera bokningar och behandlingar för hundtrimning.
            </p>
            <div className="text-sm text-gray-500">Klippningar & bad</div>
          </Link>

          {/* Företagsinformation / Administration */}
          <Link
            href="/foretagsinformation"
            className="group bg-white rounded-2xl p-8 shadow-md hover:shadow-xl transition-all duration-300 border border-gray-100 hover:border-green-200 hover:-translate-y-1"
          >
            <div className="text-5xl mb-4">🏢</div>
            <h2 className="text-xl font-bold text-[#2c7a4c] mb-3">
              Företagsinformation
            </h2>
            <p className="text-gray-600 text-sm leading-relaxed mb-4">
              Hantera företagsuppgifter, personal och inställningar.
            </p>
            <div className="text-sm text-gray-500">Konfiguration</div>
          </Link>
        </div>

        {/* Secondary Cards - Ekonomi & Kunder */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Ekonomi */}
          <Link
            href="/ekonomi"
            className="bg-white rounded-xl p-6 shadow-md hover:shadow-lg transition-all duration-300 border border-gray-100 hover:border-green-200"
          >
            <div className="flex items-start gap-4">
              <div className="text-3xl">💰</div>
              <div className="flex-1">
                <h3 className="text-lg font-bold text-[#2c7a4c] mb-2">
                  Ekonomi & Fakturor
                </h3>
                <p className="text-sm text-gray-600 mb-3">
                  Hantera fakturor och ekonomirapporter.
                </p>
                <div className="flex gap-4 text-xs text-gray-500">
                  <span>{stats.pendingInvoices} väntande fakturor</span>
                  <span>•</span>
                  <span>{stats.monthlyRevenue.toLocaleString()} kr/mån</span>
                </div>
              </div>
            </div>
          </Link>

          {/* Kunder */}
          <Link
            href="/owners"
            className="bg-white rounded-xl p-6 shadow-md hover:shadow-lg transition-all duration-300 border border-gray-100 hover:border-green-200"
          >
            <div className="flex items-start gap-4">
              <div className="text-3xl">👥</div>
              <div className="flex-1">
                <h3 className="text-lg font-bold text-[#2c7a4c] mb-2">
                  Kunder & Hundägare
                </h3>
                <p className="text-sm text-gray-600 mb-3">
                  Hantera kundregister och kontaktuppgifter.
                </p>
                <div className="text-xs text-gray-500">
                  {stats.totalOwners} registrerade ägare
                </div>
              </div>
            </div>
          </Link>
        </div>
      </main>
    </div>
  );
}
