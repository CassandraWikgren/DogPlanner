"use client";
import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import Link from "next/link";
import {
  Calendar,
  PawPrint,
  Scissors,
  Building,
  Users,
  TrendingUp,
  Plus,
  Activity,
  FileText,
  Settings,
  Bell,
  DollarSign,
} from "lucide-react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/app/context/AuthContext";

interface DashboardStats {
  totalDogs: number;
  totalOwners: number;
  activeBookings: number;
  monthlyRevenue: number;
}

export default function Dashboard() {
  const { currentOrgId } = useAuth();
  const [stats, setStats] = useState<DashboardStats>({
    totalDogs: 0,
    totalOwners: 0,
    activeBookings: 0,
    monthlyRevenue: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (currentOrgId) {
      loadDashboardStats();
    }
  }, [currentOrgId]);

  const loadDashboardStats = async () => {
    if (!currentOrgId) return;

    try {
      // Hämta antal hundar
      const { count: dogsCount } = await supabase
        .from("dogs")
        .select("*", { count: "exact", head: true })
        .eq("org_id", currentOrgId);

      // Hämta antal ägare
      const { count: ownersCount } = await supabase
        .from("owners")
        .select("*", { count: "exact", head: true })
        .eq("org_id", currentOrgId);

      // Hämta aktiva bokningar
      const { count: bookingsCount } = await supabase
        .from("bookings")
        .select("*", { count: "exact", head: true })
        .eq("org_id", currentOrgId)
        .eq("status", "confirmed");

      // Simulerad månadsintäkt (kan ersättas med riktig data)
      const monthlyRevenue = 45000;

      setStats({
        totalDogs: dogsCount || 0,
        totalOwners: ownersCount || 0,
        activeBookings: bookingsCount || 0,
        monthlyRevenue,
      });
    } catch (error) {
      console.error("Error loading dashboard stats:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto p-6">
        {/* Hero Header */}
        <div className="bg-gradient-to-r from-[#2c7a4c] to-[#1e5a35] rounded-2xl p-8 mb-8 text-white shadow-lg">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-4xl font-bold mb-4 text-white drop-shadow-lg">
                Dashboard
              </h1>
              <p className="text-xl text-white/90 drop-shadow">
                Översikt över din verksamhet och snabblänkar till viktiga
                funktioner.
              </p>
            </div>
            <div className="hidden md:flex items-center space-x-4">
              <Bell className="h-6 w-6 text-white/80" />
              <Settings className="h-6 w-6 text-white/80" />
            </div>
          </div>
        </div>

        {/* Statistik Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card className="border-0 shadow-lg">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Hundar</p>
                  <p className="text-3xl font-bold text-gray-900">
                    {loading ? "..." : stats.totalDogs}
                  </p>
                </div>
                <div className="p-3 bg-green-100 rounded-full">
                  <PawPrint className="h-6 w-6 text-green-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-lg">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Kunder</p>
                  <p className="text-3xl font-bold text-gray-900">
                    {loading ? "..." : stats.totalOwners}
                  </p>
                </div>
                <div className="p-3 bg-blue-100 rounded-full">
                  <Users className="h-6 w-6 text-blue-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-lg">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">
                    Aktiva bokningar
                  </p>
                  <p className="text-3xl font-bold text-gray-900">
                    {loading ? "..." : stats.activeBookings}
                  </p>
                </div>
                <div className="p-3 bg-orange-100 rounded-full">
                  <Calendar className="h-6 w-6 text-orange-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-lg">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">
                    Månadsintäkt
                  </p>
                  <p className="text-3xl font-bold text-gray-900">
                    {loading
                      ? "..."
                      : `${stats.monthlyRevenue.toLocaleString()} kr`}
                  </p>
                </div>
                <div className="p-3 bg-emerald-100 rounded-full">
                  <DollarSign className="h-6 w-6 text-emerald-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Navigation */}
        <div className="space-y-6">
          <h2 className="text-2xl font-bold text-gray-900">Huvudfunktioner</h2>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {/* Hunddagis */}
            <Card className="border-0 shadow-lg hover:shadow-xl transition-all duration-300 group">
              <CardHeader className="text-center pb-4">
                <div className="flex justify-center mb-4">
                  <div className="p-4 bg-green-100 rounded-full group-hover:bg-green-200 transition-colors">
                    <PawPrint className="h-8 w-8 text-green-600" />
                  </div>
                </div>
                <CardTitle className="text-xl text-green-700">
                  Hunddagis
                </CardTitle>
                <p className="text-gray-600 text-sm mt-2">
                  Hantera dagishundar, se fakturor, priser och hundrum.
                </p>
              </CardHeader>
              <CardContent className="pt-0">
                <Link href="/hunddagis">
                  <div className="w-full bg-green-500 hover:bg-green-600 text-white rounded-lg p-3 text-center font-semibold transition-colors">
                    Klicka här
                  </div>
                </Link>
              </CardContent>
            </Card>

            {/* Hundpensionat */}
            <Card className="border-0 shadow-lg hover:shadow-xl transition-all duration-300 group">
              <CardHeader className="text-center pb-4">
                <div className="flex justify-center mb-4">
                  <div className="p-4 bg-blue-100 rounded-full group-hover:bg-blue-200 transition-colors">
                    <Calendar className="h-8 w-8 text-blue-600" />
                  </div>
                </div>
                <CardTitle className="text-xl text-blue-700">
                  Hundpensionat
                </CardTitle>
                <p className="text-gray-600 text-sm mt-2">
                  Se och hantera pensionshundar, journaler och bokningar.
                </p>
              </CardHeader>
              <CardContent className="pt-0">
                <Link href="/hundpensionat">
                  <div className="w-full bg-blue-500 hover:bg-blue-600 text-white rounded-lg p-3 text-center font-semibold transition-colors">
                    Klicka här
                  </div>
                </Link>
              </CardContent>
            </Card>

            {/* Hundfrisör */}
            <Card className="border-0 shadow-lg hover:shadow-xl transition-all duration-300 group">
              <CardHeader className="text-center pb-4">
                <div className="flex justify-center mb-4">
                  <div className="p-4 bg-orange-100 rounded-full group-hover:bg-orange-200 transition-colors">
                    <Scissors className="h-8 w-8 text-orange-600" />
                  </div>
                </div>
                <CardTitle className="text-xl text-orange-700">
                  Hundfrisör
                </CardTitle>
                <p className="text-gray-600 text-sm mt-2">
                  Hantera bokningar, klipplistor och behandlingar i salongen.
                </p>
              </CardHeader>
              <CardContent className="pt-0">
                <Link href="/frisor">
                  <div className="w-full bg-orange-500 hover:bg-orange-600 text-white rounded-lg p-3 text-center font-semibold transition-colors">
                    Klicka här
                  </div>
                </Link>
              </CardContent>
            </Card>

            {/* Företagsinformation */}
            <Card className="border-0 shadow-lg hover:shadow-xl transition-all duration-300 group">
              <CardHeader className="text-center pb-4">
                <div className="flex justify-center mb-4">
                  <div className="p-4 bg-gray-100 rounded-full group-hover:bg-gray-200 transition-colors">
                    <Building className="h-8 w-8 text-gray-600" />
                  </div>
                </div>
                <CardTitle className="text-xl text-gray-700">
                  Företagsinformation
                </CardTitle>
                <p className="text-gray-600 text-sm mt-2">
                  Hantera abonnemang, villkor och fakturor.
                </p>
              </CardHeader>
              <CardContent className="pt-0">
                <Link href="/foretagsinformation">
                  <div className="w-full bg-gray-500 hover:bg-gray-600 text-white rounded-lg p-3 text-center font-semibold transition-colors">
                    Klicka här
                  </div>
                </Link>
              </CardContent>
            </Card>
          </div>

          {/* Snabblänkar */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Snabbåtgärder */}
            <Card className="border-0 shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Plus className="h-5 w-5 text-green-600" />
                  <span>Snabbåtgärder</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Link
                  href="/owners"
                  className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  <span>Ny kund</span>
                  <Users className="h-4 w-4 text-gray-500" />
                </Link>
                <Link
                  href="/hundpensionat/bokningsformulär"
                  className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  <span>Ny bokning</span>
                  <Calendar className="h-4 w-4 text-gray-500" />
                </Link>
                <Link
                  href="/faktura"
                  className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  <span>Fakturor</span>
                  <FileText className="h-4 w-4 text-gray-500" />
                </Link>
                <Link
                  href="/rooms"
                  className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  <span>Rumhantering</span>
                  <Building className="h-4 w-4 text-gray-500" />
                </Link>
              </CardContent>
            </Card>

            {/* Senaste aktivitet */}
            <Card className="border-0 shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Activity className="h-5 w-5 text-blue-600" />
                  <span>Senaste aktivitet</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-start space-x-3 p-3 bg-gray-50 rounded-lg">
                  <div className="w-2 h-2 bg-green-500 rounded-full mt-2"></div>
                  <div>
                    <p className="text-sm font-medium">Ny hund registrerad</p>
                    <p className="text-xs text-gray-500">För 2 timmar sedan</p>
                  </div>
                </div>
                <div className="flex items-start space-x-3 p-3 bg-gray-50 rounded-lg">
                  <div className="w-2 h-2 bg-blue-500 rounded-full mt-2"></div>
                  <div>
                    <p className="text-sm font-medium">Bokning bekräftad</p>
                    <p className="text-xs text-gray-500">För 4 timmar sedan</p>
                  </div>
                </div>
                <div className="flex items-start space-x-3 p-3 bg-gray-50 rounded-lg">
                  <div className="w-2 h-2 bg-orange-500 rounded-full mt-2"></div>
                  <div>
                    <p className="text-sm font-medium">Faktura skickad</p>
                    <p className="text-xs text-gray-500">Igår</p>
                  </div>
                </div>
                <div className="flex items-start space-x-3 p-3 bg-gray-50 rounded-lg">
                  <div className="w-2 h-2 bg-purple-500 rounded-full mt-2"></div>
                  <div>
                    <p className="text-sm font-medium">Ny kund registrerad</p>
                    <p className="text-xs text-gray-500">Igår</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
