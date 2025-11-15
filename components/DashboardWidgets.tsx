"use client";

import React, { useState, useEffect } from "react";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import { useAuth } from "@/app/context/AuthContext";
import {
  Users,
  Calendar,
  DollarSign,
  CheckCircle,
  AlertCircle,
  TrendingUp,
} from "lucide-react";

interface DashboardStats {
  totalDogs: number;
  todayCheckedIn: number;
  pendingApplications: number;
  monthlyRevenue: number;
  overdueInvoices: number;
  activeSubscriptions: number;
}

export default function DashboardWidgets() {
  const { currentOrgId } = useAuth();
  const [stats, setStats] = useState<DashboardStats>({
    totalDogs: 0,
    todayCheckedIn: 0,
    pendingApplications: 0,
    monthlyRevenue: 0,
    overdueInvoices: 0,
    activeSubscriptions: 0,
  });
  const [loading, setLoading] = useState(true);

  const supabase = createClientComponentClient();

  useEffect(() => {
    // Vänta lite för att AuthContext ska ladda
    const timer = setTimeout(() => {
      if (currentOrgId) {
        fetchStats();
      } else {
        // Visa demo-data om ingen org_id finns efter timeout
        console.log("Ingen org_id tillgänglig, visar demo-data");
        setStats({
          totalDogs: 47,
          todayCheckedIn: 23,
          pendingApplications: 8,
          monthlyRevenue: 45000,
          overdueInvoices: 3,
          activeSubscriptions: 4,
        });
        setLoading(false);
      }
    }, 500); // Vänta 500ms på att AuthContext ska ladda

    return () => clearTimeout(timer);
  }, [currentOrgId]);

  const fetchStats = async () => {
    try {
      setLoading(true);

      // Kontrollera att vi har org_id
      if (!currentOrgId) {
        console.log("Ingen org_id tillgänglig, visar demo-data");
        return;
      }

      // Hämta grundstatistik parallellt
      const [dogsResult, applicationsResult, subscriptionsResult] =
        await Promise.all([
          // Totalt antal hundar
          supabase
            .from("dogs")
            .select("id, checked_in")
            .eq("org_id", currentOrgId),

          // Väntande ansökningar
          supabase
            .from("interest_applications")
            .select("id")
            .eq("org_id", currentOrgId)
            .eq("status", "pending"),

          // Aktiva abonnemang
          supabase
            .from("subscription_types")
            .select("id")
            .eq("org_id", currentOrgId)
            .eq("is_active", true),
        ]);

      // Kontrollera för fel
      if (dogsResult.error)
        console.error("Fel vid hämtning av hundar:", dogsResult.error);
      if (applicationsResult.error)
        console.error(
          "Fel vid hämtning av ansökningar:",
          applicationsResult.error
        );
      if (subscriptionsResult.error)
        console.error(
          "Fel vid hämtning av abonnemang:",
          subscriptionsResult.error
        );

      const dogs = dogsResult.data || [];
      const applications = applicationsResult.data || [];
      const subscriptions = subscriptionsResult.data || [];

      setStats({
        totalDogs: dogs.length,
        todayCheckedIn: dogs.filter((dog) => dog.checked_in).length,
        pendingApplications: applications.length,
        monthlyRevenue: 45000, // Mock data - kunde hämtas från invoice_logs
        overdueInvoices: 3, // Mock data
        activeSubscriptions: subscriptions.length,
      });
    } catch (error) {
      console.error("Error fetching dashboard stats:", error);
      // Fallback till demo-data vid fel
      setStats({
        totalDogs: 47,
        todayCheckedIn: 23,
        pendingApplications: 8,
        monthlyRevenue: 45000,
        overdueInvoices: 3,
        activeSubscriptions: 4,
      });
    } finally {
      setLoading(false);
    }
  };

  const widgets = [
    {
      title: "Registrerade hundar",
      value: stats.totalDogs,
      icon: Users,
      color: "text-blue-600",
      bgColor: "bg-blue-50",
      change: "+3 denna vecka",
    },
    {
      title: "Incheckade idag",
      value: stats.todayCheckedIn,
      icon: CheckCircle,
      color: "text-green-600",
      bgColor: "bg-green-50",
      change: `av ${stats.totalDogs} totalt`,
    },
    {
      title: "Dagis-väntelista",
      value: stats.pendingApplications,
      icon: Calendar,
      color: "text-orange-600",
      bgColor: "bg-orange-50",
      change: "Intresseanmälningar",
    },
    {
      title: "Månadsintäkt",
      value: `${stats.monthlyRevenue.toLocaleString()} kr`,
      icon: DollarSign,
      color: "text-green-600",
      bgColor: "bg-green-50",
      change: "+12% från förra månaden",
    },
    {
      title: "Förfallna fakturor",
      value: stats.overdueInvoices,
      icon: AlertCircle,
      color: "text-red-600",
      bgColor: "bg-red-50",
      change: "Kräver uppföljning",
    },
    {
      title: "Aktiva prislistor",
      value: stats.activeSubscriptions,
      icon: TrendingUp,
      color: "text-purple-600",
      bgColor: "bg-purple-50",
      change: "Konfigurerade",
    },
  ];

  if (loading) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-5">
        {[...Array(6)].map((_, i) => (
          <div
            key={i}
            className="bg-white rounded-lg p-5 shadow-sm border border-gray-200 animate-pulse"
          >
            <div className="h-20 bg-gray-200 rounded"></div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-5">
      {widgets.map((widget, index) => (
        <div
          key={index}
          className="bg-white rounded-lg p-5 shadow-sm border border-gray-200 hover:shadow-md transition-all"
        >
          <div className="flex flex-col">
            <div className="flex items-center justify-between mb-3">
              <div className={`p-2.5 rounded-lg ${widget.bgColor}`}>
                <widget.icon className={`w-5 h-5 ${widget.color}`} />
              </div>
            </div>
            <p className="text-xs font-medium text-gray-500 mb-2 uppercase tracking-wide">
              {widget.title}
            </p>
            <p className="text-2xl font-bold text-gray-900 mb-1">
              {widget.value}
            </p>
            <p className="text-xs text-gray-500">{widget.change}</p>
          </div>
        </div>
      ))}
    </div>
  );
}
