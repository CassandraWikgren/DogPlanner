"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Calendar,
  Clock,
  MapPin,
  FileText,
  Scissors,
  Home,
} from "lucide-react";

interface Dog {
  id: string;
  name: string;
  days: string | null;
  startdate: string | null;
  enddate: string | null;
  subscription: string | null;
}

interface DagisStatsProps {
  dogs: Dog[];
  onStatClick: (stat: string) => void;
}

export function DagisStats({ dogs, onStatClick }: DagisStatsProps) {
  const today = new Date();
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  // Översätt veckodagar till svenska
  const getCurrentWeekday = () => {
    const weekdays = [
      "söndag",
      "måndag",
      "tisdag",
      "onsdag",
      "torsdag",
      "fredag",
      "lördag",
    ];
    return weekdays[today.getDay()];
  };

  const getTomorrowWeekday = () => {
    const weekdays = [
      "söndag",
      "måndag",
      "tisdag",
      "onsdag",
      "torsdag",
      "fredag",
      "lördag",
    ];
    return weekdays[tomorrow.getDay()];
  };

  const currentWeekday = getCurrentWeekday();
  const tomorrowWeekday = getTomorrowWeekday();

  console.log("🔍 DagisStats debug:", {
    today: today.toLocaleDateString("sv-SE"),
    tomorrow: tomorrow.toLocaleDateString("sv-SE"),
    currentWeekday,
    tomorrowWeekday,
    totalDogs: dogs.length,
  });

  // Beräkna statistik
  const todayDogs = dogs.filter((dog) => {
    if (!dog.days) return false;

    // Kontrollera om hunden är aktiv idag
    const startDate = dog.startdate ? new Date(dog.startdate) : null;
    const endDate = dog.enddate ? new Date(dog.enddate) : null;

    const isActive =
      (!startDate || startDate <= today) && (!endDate || endDate >= today);

    // Kontrollera om hunden kommer idag baserat på veckodagar
    const comesToday = dog.days.toLowerCase().includes(currentWeekday);

    return isActive && comesToday;
  }).length;

  const tomorrowDogs = dogs.filter((dog) => {
    if (!dog.days) return false;

    const startDate = dog.startdate ? new Date(dog.startdate) : null;
    const endDate = dog.enddate ? new Date(dog.enddate) : null;

    const isActive =
      (!startDate || startDate <= tomorrow) &&
      (!endDate || endDate >= tomorrow);

    const comesTomorrow = dog.days.toLowerCase().includes(tomorrowWeekday);

    return isActive && comesTomorrow;
  }).length;

  // Beräkna promenader (approximation: 70% av dagens hundar)
  const walkingDogs = Math.floor(todayDogs * 0.7);

  // Placeholder för värden som kommer från andra tabeller
  const applications = 8; // TODO: Hämta från applications-tabellen
  const services = 5; // TODO: Beräkna från tilläggstjänster (kloklipp, bad)
  const rooms = 6; // TODO: Hämta från rooms-tabellen

  const stats = [
    {
      key: "today",
      label: "Dagishundar",
      value: todayDogs,
      color: "text-green-600",
      bgColor: "bg-green-50",
      hoverColor: "hover:bg-green-100",
      icon: Calendar,
      description: `${currentWeekday}`,
    },
    {
      key: "tomorrow",
      label: "Dagishundar imorgon",
      value: tomorrowDogs,
      color: "text-blue-600",
      bgColor: "bg-blue-50",
      hoverColor: "hover:bg-blue-100",
      icon: Clock,
      description: `${tomorrowWeekday}`,
    },
    {
      key: "walks",
      label: "Promenader",
      value: walkingDogs,
      color: "text-orange-600",
      bgColor: "bg-orange-50",
      hoverColor: "hover:bg-orange-100",
      icon: MapPin,
      description: "aktiva idag",
    },
    {
      key: "applications",
      label: "Intresseanmälningar",
      value: applications,
      color: "text-purple-600",
      bgColor: "bg-purple-50",
      hoverColor: "hover:bg-purple-100",
      icon: FileText,
      description: "senaste månaden",
    },
    {
      key: "services",
      label: "Tjänster",
      value: services,
      color: "text-yellow-600",
      bgColor: "bg-yellow-50",
      hoverColor: "hover:bg-yellow-100",
      icon: Scissors,
      description: "denna månaden",
    },
    {
      key: "rooms",
      label: "Hundrum",
      value: rooms,
      color: "text-gray-600",
      bgColor: "bg-gray-50",
      hoverColor: "hover:bg-gray-100",
      icon: Home,
      description: "tillgängliga",
    },
  ];

  return (
    <div className="mb-8">
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <div
              key={stat.key}
              className={`cursor-pointer transition-all duration-200 ${stat.bgColor} ${stat.hoverColor} border-l-4 border-l-transparent hover:border-l-current hover:shadow-md rounded-lg border bg-card text-card-foreground shadow-sm`}
              onClick={() => onStatClick(stat.key)}
            >
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <Icon className={`h-5 w-5 ${stat.color}`} />
                  <Badge variant="outline" className="text-xs">
                    Live
                  </Badge>
                </div>

                <div className={`text-2xl font-bold ${stat.color} mb-1`}>
                  {stat.value}
                </div>

                <div className="text-sm font-medium text-gray-800 mb-1 leading-tight">
                  {stat.label}
                </div>

                <div className="text-xs text-gray-500">{stat.description}</div>
              </CardContent>
            </div>
          );
        })}
      </div>

      {/* Debug information (kan tas bort senare) */}
      <div className="mt-4 p-2 bg-gray-100 rounded text-xs text-gray-600">
        <strong>Debug:</strong> Idag: {currentWeekday}, Imorgon:{" "}
        {tomorrowWeekday}, Totalt hundar: {dogs.length}, Idag: {todayDogs},
        Imorgon: {tomorrowDogs}
      </div>
    </div>
  );
}
