"use client";

import React, { useState, useEffect } from "react";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import { useAuth } from "@/app/context/AuthContext";
import { useEnabledServices } from "@/lib/hooks/useEnabledServices";
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
  const { hasDaycare, hasBoarding, hasGrooming } = useEnabledServices();
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
      const dayName = new Date()
        .toLocaleDateString("sv-SE", { weekday: "long" })
        .toLowerCase();

      // Konvertera svensk veckodag till engelska fältnamn
      const dayMapping: Record<string, string> = {
        måndag: "Måndag",
        tisdag: "Tisdag",
        onsdag: "Onsdag",
        torsdag: "Torsdag",
        fredag: "Fredag",
        lördag: "Lördag",
        söndag: "Söndag",
      };
      const dayInSwedish = dayMapping[dayName] || "Måndag";

      // Hämta data parallellt
      const [
        dogsResult,
        roomsResult,
        bookingsResult,
        checkInsResult,
        checkOutsResult,
        pendingBookingsResult,
      ] = await Promise.all([
        // Hunddagis - ENDAST antagna hundar (waitlist != true)
        supabase
          .from("dogs")
          .select("id, checked_in, days, subscription, startdate")
          .eq("org_id", currentOrgId)
          .neq("waitlist", true), // ✅ Exkludera väntelista

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

      // Filtrera hundar som går IDAG (har subscription och rätt veckodag i days-fältet)
      const dogsGoingToday = dogs.filter((dog) => {
        // Om hunden inte har abonnemang eller startdatum, räknas den inte
        if (!dog.subscription || !dog.startdate) return false;

        // Om startdatum är i framtiden, räknas den inte
        if (dog.startdate > today) return false;

        // Om days-fältet är tomt, räknas hunden inte
        if (!dog.days) return false;

        // Kolla om dagens veckodag finns i days-strängen
        const daysArray = dog.days.split(",").map((d: string) => d.trim());
        return daysArray.includes(dayInSwedish);
      });

      // Räkna unika rum som är bokade
      const occupiedRooms = new Set(bookings.map((b) => b.room_id)).size;

      setStats({
        dagisTotal: dogsGoingToday.length, // ✅ Antal hundar som går IDAG, inte totalt
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
    // Hunddagis widget - endast om aktiverad
    ...(hasDaycare
      ? [
          {
            title: "Hunddagis idag",
            value: stats.dagisTotal,
            icon: Users,
            color: "text-green-600",
            bgColor: "bg-green-50",
            change: new Date().toLocaleDateString("sv-SE", {
              weekday: "long",
            }),
          },
        ]
      : []),

    // Pensionat widgets - endast om aktiverad
    ...(hasBoarding
      ? [
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
        ]
      : []),

    // Viktiga notiser - alltid visa
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
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
        {[...Array(6)].map((_, i) => (
          <div
            key={i}
            className="bg-white rounded-lg p-3 shadow-sm border border-gray-200 animate-pulse"
          >
            <div className="h-24 bg-gray-200 rounded"></div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
      {widgets.map((widget, index) => (
        <div
          key={index}
          className="bg-white rounded-lg p-3 shadow-sm border border-gray-200 hover:shadow-md transition-all"
        >
          <div className="flex flex-col items-center text-center h-full">
            <div className={`p-2 rounded-lg ${widget.bgColor} mb-2`}>
              <widget.icon className={`w-5 h-5 ${widget.color}`} />
            </div>
            <p className="text-[10px] font-medium text-gray-500 mb-1 uppercase tracking-wide">
              {widget.title}
            </p>
            <p className="text-xl font-bold text-gray-900 mb-1">
              {widget.value}
            </p>
            <p className="text-[10px] text-gray-500 mt-auto">{widget.change}</p>
          </div>
        </div>
      ))}
    </div>
  );
}
