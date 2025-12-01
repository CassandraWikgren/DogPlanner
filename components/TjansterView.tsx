"use client";

import React, { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { useAuth } from "@/app/context/AuthContext";
import { CheckCircle, Circle, User } from "lucide-react";

interface ServiceCompletion {
  id: string;
  dog_id: string;
  service_type: string; // 'kloklipp', 'tassklipp', 'bad', 'annat'
  is_completed: boolean;
  completed_at: string | null;
  completed_by: string | null;
  completed_by_name: string | null;
  scheduled_month: string | null; // Format: "2025-10" för oktober 2025 (nullable)
  notes: string | null;
}

interface DogWithServices {
  id: string;
  name: string;
  breed: string | null;
  photo_url: string | null;
  owners: {
    full_name: string | null;
    phone: string | null;
  } | null;
  services: string[]; // Array av tjänster från events.addon_services
}

export default function TjansterView() {
  const { user } = useAuth();
  const [dogs, setDogs] = useState<DogWithServices[]>([]);
  const [completions, setCompletions] = useState<ServiceCompletion[]>([]);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  const currentMonth = new Date().toLocaleString("sv-SE", { month: "long" });
  const currentYear = new Date().getFullYear();
  const currentMonthNumber = new Date().getMonth() + 1;
  const scheduledMonth = `${currentYear}-${currentMonthNumber.toString().padStart(2, "0")}`;

  useEffect(() => {
    if (user?.org_id) {
      fetchServicesData();
    }
  }, [user?.org_id]);

  const fetchServicesData = async () => {
    try {
      setLoading(true);

      // Hämta alla hundar med tilläggsabonnemang
      const { data: dogsData, error: dogsError } = await supabase
        .from("dogs")
        .select(
          `
          id,
          name,
          breed,
          photo_url,
          events,
          owners (
            full_name,
            phone
          )
        `
        )
        .eq("org_id", user.org_id)
        .not("events->addon_services", "is", null);

      if (dogsError) throw dogsError;

      // Filtrera hundar som har tjänster (kloklipp, tassklipp, bad)
      const dogsWithServices = (dogsData || [])
        .map((dog: any) => {
          const addonServices = dog.events?.addon_services || [];
          const services = addonServices.filter((service: string) =>
            ["Kloklipp", "Tassklipp", "Bad"].includes(service)
          );

          if (services.length === 0) return null;

          return {
            id: dog.id,
            name: dog.name,
            breed: dog.breed,
            photo_url: dog.photo_url,
            owners: dog.owners,
            services: services,
          };
        })
        .filter((dog): dog is DogWithServices => dog !== null);

      setDogs(dogsWithServices);

      // Hämta slutförda tjänster för denna månad
      const { data: completionsData, error: completionsError } = await supabase
        .from("daycare_service_completions")
        .select("*")
        .eq("org_id", user.org_id)
        .eq("scheduled_month", scheduledMonth);

      if (completionsError) {
        console.log("Error fetching service completions:", completionsError);
        setCompletions([]);
      } else {
        setCompletions(completionsData || []);
      }
    } catch (error) {
      console.error("Error fetching services:", error);
    } finally {
      setLoading(false);
    }
  };

  const isServiceCompleted = (dogId: string, serviceName: string) => {
    return completions.some(
      (c) =>
        c.dog_id === dogId &&
        c.service_type === serviceName.toLowerCase() &&
        c.is_completed
    );
  };

  const getCompletionInfo = (dogId: string, serviceName: string) => {
    return completions.find(
      (c) => c.dog_id === dogId && c.service_type === serviceName.toLowerCase()
    );
  };

  const toggleServiceCompletion = async (
    dogId: string,
    serviceName: string
  ) => {
    const serviceType = serviceName.toLowerCase(); // "Kloklipp" -> "kloklipp"
    const existing = completions.find(
      (c) => c.dog_id === dogId && c.service_type === serviceType
    );

    try {
      if (existing) {
        // Uppdatera befintlig
        const { error } = await supabase
          .from("daycare_service_completions")
          .update({
            is_completed: !existing.is_completed,
            completed_at: !existing.is_completed
              ? new Date().toISOString()
              : null,
            completed_by_name: !existing.is_completed ? user.email : null,
          } as any)
          .eq("id", existing.id);

        if (error) throw error;
      } else {
        // Skapa ny
        const { error } = await supabase
          .from("daycare_service_completions")
          .insert({
            dog_id: dogId,
            service_type: serviceType,
            is_completed: true,
            completed_at: new Date().toISOString(),
            completed_by_name: user.email,
            scheduled_month: scheduledMonth,
            org_id: user.org_id,
          } as any);

        if (error) throw error;
      }

      // Uppdatera lokalt state
      await fetchServicesData();
    } catch (error) {
      console.error("Error toggling service:", error);
      alert("Kunde inte uppdatera tjänsten.");
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-gray-600">Laddar tjänster...</div>
      </div>
    );
  }

  if (dogs.length === 0) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-8 text-center">
        <h3 className="text-lg font-medium text-gray-900 mb-2">
          Inga tjänster denna månad
        </h3>
        <p className="text-gray-600">
          Det finns inga hundar med tilläggsabonnemang (kloklipp, tassklipp,
          bad) för {currentMonth}.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <p className="text-sm text-blue-800">
          <strong>{dogs.length}</strong> hundar har tjänster att utföra under{" "}
          {currentMonth} {currentYear}
        </p>
      </div>

      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-[#2c7a4c] text-white">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">
                Hund
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">
                Ägare
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">
                Tjänster
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">
                Status
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {dogs.map((dog, index) => (
              <tr
                key={dog.id}
                className={index % 2 === 0 ? "bg-white" : "bg-gray-50"}
              >
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center">
                    <div className="flex-shrink-0 h-10 w-10">
                      {dog.photo_url ? (
                        <img
                          className="h-10 w-10 rounded-full object-cover"
                          src={dog.photo_url}
                          alt={dog.name}
                        />
                      ) : (
                        <div className="h-10 w-10 rounded-full bg-green-100 flex items-center justify-center">
                          <span className="text-[#2c7a4c] font-medium">
                            {dog.name.charAt(0).toUpperCase()}
                          </span>
                        </div>
                      )}
                    </div>
                    <div className="ml-4">
                      <div className="text-sm font-medium text-gray-900">
                        {dog.name}
                      </div>
                      <div className="text-sm text-gray-500">
                        {dog.breed || "-"}
                      </div>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-900">
                    {dog.owners?.full_name || "-"}
                  </div>
                  <div className="text-sm text-gray-500">
                    {dog.owners?.phone || "-"}
                  </div>
                </td>
                <td className="px-6 py-4">
                  <div className="space-y-2">
                    {dog.services.map((service) => {
                      const completed = isServiceCompleted(dog.id, service);
                      const info = getCompletionInfo(dog.id, service);

                      return (
                        <div
                          key={service}
                          className="flex items-center justify-between gap-4"
                        >
                          <button
                            onClick={() =>
                              toggleServiceCompletion(dog.id, service)
                            }
                            className="flex items-center gap-2 hover:bg-gray-100 px-3 py-2 rounded-md transition-colors"
                          >
                            {completed ? (
                              <CheckCircle className="w-5 h-5 text-green-600" />
                            ) : (
                              <Circle className="w-5 h-5 text-gray-400" />
                            )}
                            <span
                              className={`text-sm ${
                                completed
                                  ? "text-gray-500 line-through"
                                  : "text-gray-900"
                              }`}
                            >
                              {service}
                            </span>
                          </button>
                          {completed && info && (
                            <div className="text-xs text-gray-500 flex items-center gap-1">
                              <User className="w-3 h-3" />
                              {info.completed_by_name?.split("@")[0] || "Okänd"}
                              <span className="ml-2">
                                {info.completed_at &&
                                  new Date(
                                    info.completed_at
                                  ).toLocaleDateString("sv-SE", {
                                    day: "numeric",
                                    month: "short",
                                  })}
                              </span>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  {dog.services.every((s) => isServiceCompleted(dog.id, s)) ? (
                    <span className="px-2 py-1 text-xs font-medium rounded-full bg-green-100 text-green-800">
                      Klart
                    </span>
                  ) : (
                    <span className="px-2 py-1 text-xs font-medium rounded-full bg-yellow-100 text-yellow-800">
                      Återstår
                    </span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
