"use client";

import React, { useState, useEffect } from "react";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import { useAuth } from "@/app/context/AuthContext";
import {
  Users,
  Calendar,
  Home,
  CheckCircle,
  AlertCircle,
  LogIn,
  LogOut,
  Clock,
} from "lucide-react";

interface DashboardStats {
  // Hunddagis
  dagisTotal: number;
  dagisCheckedIn: number;

  // Hundpensionat
  pensionatTotalRooms: number;
  pensionatOccupiedRooms: number;
  pensionatCheckInsToday: number;
  pensionatCheckOutsToday: number;
  pensionatPendingBookings: number;

  // Viktiga notiser
  allergiesCount: number;
  medicationsCount: number;
}

export default function DashboardWidgets() {
  const { currentOrgId } = useAuth();
  const [stats, setStats] = useState<DashboardStats>({
    dagisTotal: 0,
    dagisCheckedIn: 0,
    pensionatTotalRooms: 0,
    pensionatOccupiedRooms: 0,
    pensionatCheckInsToday: 0,
    pensionatCheckOutsToday: 0,
    pensionatPendingBookings: 0,
    allergiesCount: 0,
    medicationsCount: 0,
  });
  const [loading, setLoading] = useState(true);

  const supabase = createClientComponentClient();

  useEffect(() => {
    const timer = setTimeout(() => {
      if (currentOrgId) {
        fetchStats();
      } else {
        setLoading(false);
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [currentOrgId]);

  const fetchStats = async () => {
    try {
      setLoading(true);

      if (!currentOrgId) {
        console.log("Ingen org_id tillgänglig");
        return;
      }

      const today = new Date().toISOString().split("T")[0];

      // Hämta data parallellt
      const [
        dogsResult,
        roomsResult,
        bookingsResult,
        checkInsResult,
        checkOutsResult,
        pendingBookingsResult,
      ] = await Promise.all([
        // Hunddagis - totalt och incheckade
        supabase
          .from("dogs")
          .select("id, checked_in")
          .eq("org_id", currentOrgId),

        // Pensionat - totalt antal rum
        supabase.from("rooms").select("id").eq("org_id", currentOrgId),

        // Pensionat - aktiva bokningar (idag)
        supabase
          .from("bookings")
          .select("id, room_id")
          .eq("org_id", currentOrgId)
          .lte("check_in", today)
          .gte("check_out", today)
          .eq("status", "confirmed"),

        // Incheckningar idag (Pensionat)
        supabase
          .from("bookings")
          .select("id")
          .eq("org_id", currentOrgId)
          .eq("check_in", today)
          .eq("status", "confirmed"),

        // Utcheckningar idag (Pensionat)
        supabase
          .from("bookings")
          .select("id")
          .eq("org_id", currentOrgId)
          .eq("check_out", today)
          .eq("status", "confirmed"),

        // Väntande bokningar (Pensionat)
        supabase
          .from("bookings")
          .select("id")
          .eq("org_id", currentOrgId)
          .eq("status", "pending"),
      ]);

      // Hämta hundar med allergier/mediciner
      const dogsWithHealthInfo = await supabase
        .from("dogs")
        .select("id, allergies, medications")
        .eq("org_id", currentOrgId)
        .or("allergies.neq.null,medications.neq.null");

      const dogs = dogsResult.data || [];
      const rooms = roomsResult.data || [];
      const bookings = bookingsResult.data || [];
      const checkIns = checkInsResult.data || [];
      const checkOuts = checkOutsResult.data || [];
      const pendingBookings = pendingBookingsResult.data || [];
      const healthInfo = dogsWithHealthInfo.data || [];

      // Räkna unika rum som är bokade
      const occupiedRooms = new Set(bookings.map((b) => b.room_id)).size;

      setStats({
        dagisTotal: dogs.length,
        dagisCheckedIn: dogs.filter((dog) => dog.checked_in).length,
        pensionatTotalRooms: rooms.length,
        pensionatOccupiedRooms: occupiedRooms,
        pensionatCheckInsToday: checkIns.length,
        pensionatCheckOutsToday: checkOuts.length,
        pensionatPendingBookings: pendingBookings.length,
        allergiesCount: healthInfo.filter((d) => d.allergies).length,
        medicationsCount: healthInfo.filter((d) => d.medications).length,
      });
    } catch (error) {
      console.error("Error fetching dashboard stats:", error);
    } finally {
      setLoading(false);
    }
  };

  const widgets = [
    {
      title: "Dagis - Incheckade",
      value: stats.dagisCheckedIn,
      icon: CheckCircle,
      color: "text-green-600",
      bgColor: "bg-green-50",
      change: `av ${stats.dagisTotal} totalt`,
    },
    {
      title: "Pensionat - Beläggning",
      value: `${stats.pensionatOccupiedRooms}/${stats.pensionatTotalRooms}`,
      icon: Home,
      color: "text-blue-600",
      bgColor: "bg-blue-50",
      change: `${Math.round((stats.pensionatOccupiedRooms / (stats.pensionatTotalRooms || 1)) * 100)}% belagda rum`,
    },
    {
      title: "Incheckningar idag",
      value: stats.pensionatCheckInsToday,
      icon: LogIn,
      color: "text-purple-600",
      bgColor: "bg-purple-50",
      change: "Pensionat",
    },
    {
      title: "Utcheckningar idag",
      value: stats.pensionatCheckOutsToday,
      icon: LogOut,
      color: "text-orange-600",
      bgColor: "bg-orange-50",
      change: "Pensionat",
    },
    {
      title: "Väntande bokningar",
      value: stats.pensionatPendingBookings,
      icon: Clock,
      color: "text-yellow-600",
      bgColor: "bg-yellow-50",
      change: "Behöver bekräftas",
    },
    {
      title: "Viktiga notiser",
      value: stats.allergiesCount + stats.medicationsCount,
      icon: AlertCircle,
      color: "text-red-600",
      bgColor: "bg-red-50",
      change: `${stats.allergiesCount} allergier, ${stats.medicationsCount} mediciner`,
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
