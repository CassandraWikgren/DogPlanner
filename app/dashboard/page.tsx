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
    <div
      className="min-h-screen"
      style={{
        background: "#fdfdfd",
        color: "#333",
        fontFamily: '"Segoe UI", Tahoma, Geneva, Verdana, sans-serif',
      }}
    >
      {/* Hero Section - Med bakgrundsbild från HTML */}
      <section
        className="text-center text-white"
        style={{
          padding: "100px 20px",
          background:
            'linear-gradient(rgba(44, 122, 76, 0.85), rgba(44, 122, 76, 0.85)), url("https://images.unsplash.com/photo-1558788353-f76d92427f16?ixlib=rb-4.0.3&auto=format&fit=crop&w=1600&q=80") center/cover no-repeat',
        }}
      >
        <h1 className="text-4xl font-bold mb-4">
          Välkommen till ditt Dashboard
        </h1>
        <p className="text-xl mb-8 leading-relaxed opacity-95">
          Här får du snabb tillgång till dina hundar, abonnemang och fakturor.
        </p>

        {/* Statistik-kort som overlay på hero */}
      </section>

      {/* Main Cards Container - HTML-inspirerat utseende */}
      <main
        className="max-w-5xl mx-auto px-5 grid gap-8"
        style={{
          margin: "60px auto",
          gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
        }}
      >
        {/* Hunddagis */}
        <div
          className="bg-white text-center transition-transform duration-300 hover:-translate-y-1"
          style={{
            padding: "40px 25px",
            borderRadius: "12px",
            boxShadow: "0 4px 12px rgba(0, 0, 0, 0.06)",
          }}
        >
          <h2 className="mt-0 mb-4" style={{ color: "#2c7a4c" }}>
            🐕 Hunddagis
          </h2>
          <p
            className="mb-6 text-base leading-relaxed"
            style={{ color: "#333" }}
          >
            Hantera dagishundar och daglig verksamhet. {stats.totalDogs} hundar
            registrerade.
          </p>
          <Link
            href="/hunddagis"
            className="inline-block text-white font-bold no-underline transition-colors duration-300 hover:bg-opacity-80"
            style={{
              padding: "12px 24px",
              background: "#2c7a4c",
              borderRadius: "8px",
            }}
          >
            Gå till hunddagis
          </Link>
        </div>

        {/* Hundpensionat */}
        <div
          className="bg-white text-center transition-transform duration-300 hover:-translate-y-1"
          style={{
            padding: "40px 25px",
            borderRadius: "12px",
            boxShadow: "0 4px 12px rgba(0, 0, 0, 0.06)",
          }}
        >
          <h2 className="mt-0 mb-4" style={{ color: "#2c7a4c" }}>
            🏨 Hundpensionat
          </h2>
          <p
            className="mb-6 text-base leading-relaxed"
            style={{ color: "#333" }}
          >
            Hantera pensionshundar och bokningar. {stats.activeBookings} aktiva
            bokningar.
          </p>
          <Link
            href="/hundpensionat"
            className="inline-block text-white font-bold no-underline transition-colors duration-300 hover:bg-opacity-80"
            style={{
              padding: "12px 24px",
              background: "#2c7a4c",
              borderRadius: "8px",
            }}
          >
            Gå till pensionat
          </Link>
        </div>

        {/* Rehab */}
        <div
          className="bg-white text-center transition-transform duration-300 hover:-translate-y-1"
          style={{
            padding: "40px 25px",
            borderRadius: "12px",
            boxShadow: "0 4px 12px rgba(0, 0, 0, 0.06)",
          }}
        >
          <h2 className="mt-0 mb-4" style={{ color: "#2c7a4c" }}>
            🩺 Rehab
          </h2>
          <p
            className="mb-6 text-base leading-relaxed"
            style={{ color: "#333" }}
          >
            Hundrehabiltering och fysioterapi. Kommer snart!
          </p>
          <Link
            href="/rehab"
            className="inline-block text-white font-bold no-underline transition-colors duration-300 hover:bg-opacity-80"
            style={{
              padding: "12px 24px",
              background: "#2c7a4c",
              borderRadius: "8px",
            }}
          >
            Gå till rehab
          </Link>
        </div>

        {/* Hundfrisör */}
        <div
          className="bg-white text-center transition-transform duration-300 hover:-translate-y-1"
          style={{
            padding: "40px 25px",
            borderRadius: "12px",
            boxShadow: "0 4px 12px rgba(0, 0, 0, 0.06)",
          }}
        >
          <h2 className="mt-0 mb-4" style={{ color: "#2c7a4c" }}>
            ✂️ Hundfrisör
          </h2>
          <p
            className="mb-6 text-base leading-relaxed"
            style={{ color: "#333" }}
          >
            Hantera bokningar och behandlingar för hundtrimning.
          </p>
          <Link
            href="/frisor"
            className="inline-block text-white font-bold no-underline transition-colors duration-300 hover:bg-opacity-80"
            style={{
              padding: "12px 24px",
              background: "#2c7a4c",
              borderRadius: "8px",
            }}
          >
            Gå till frisör
          </Link>
        </div>

        {/* Administration */}
        <div
          className="bg-white text-center transition-transform duration-300 hover:-translate-y-1"
          style={{
            padding: "40px 25px",
            borderRadius: "12px",
            boxShadow: "0 4px 12px rgba(0, 0, 0, 0.06)",
          }}
        >
          <h2 className="mt-0 mb-4" style={{ color: "#2c7a4c" }}>
            ⚙️ Administration
          </h2>
          <p
            className="mb-6 text-base leading-relaxed"
            style={{ color: "#333" }}
          >
            Systemhantering och ekonomi. {stats.pendingInvoices} väntande
            fakturor.
          </p>
          <Link
            href="/admin"
            className="inline-block text-white font-bold no-underline transition-colors duration-300 hover:bg-opacity-80"
            style={{
              padding: "12px 24px",
              background: "#2c7a4c",
              borderRadius: "8px",
            }}
          >
            Gå till admin
          </Link>
        </div>

        {/* Ekonomi */}
        <div
          className="bg-white text-center transition-transform duration-300 hover:-translate-y-1"
          style={{
            padding: "40px 25px",
            borderRadius: "12px",
            boxShadow: "0 4px 12px rgba(0, 0, 0, 0.06)",
          }}
        >
          <h2 className="mt-0 mb-4" style={{ color: "#2c7a4c" }}>
            💰 Ekonomi
          </h2>
          <p
            className="mb-6 text-base leading-relaxed"
            style={{ color: "#333" }}
          >
            Fakturor och ekonomihantering.{" "}
            {stats.monthlyRevenue.toLocaleString()} kr denna månad.
          </p>
          <Link
            href="/ekonomi"
            className="inline-block text-white font-bold no-underline transition-colors duration-300 hover:bg-opacity-80"
            style={{
              padding: "12px 24px",
              background: "#2c7a4c",
              borderRadius: "8px",
            }}
          >
            Visa ekonomi
          </Link>
        </div>
      </main>
    </div>
  );
}
