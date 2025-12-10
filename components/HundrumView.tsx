"use client";

import React, { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { useAuth } from "@/app/context/AuthContext";
import { calculateRequiredArea } from "@/lib/roomCalculator";
import {
  Printer,
  Download,
  AlertTriangle,
  CheckCircle,
  Home,
  Plus,
} from "lucide-react";

interface Dog {
  id: string;
  name: string;
  breed: string | null;
  heightcm: number | null;
  photo_url: string | null;
  birth: string | null;
  days: string | null; // "Måndag,Onsdag,Fredag"
  subscription: string | null; // "1 dag/vecka", "2 dagar/vecka", etc.
  allergies: string | null;
  medications: string | null;
  special_needs: string | null;
  behavior_notes: string | null;
  room_id: string | null;
  owners: {
    full_name: string | null;
  } | null;
}

interface Room {
  id: string;
  name: string | null;
  capacity_m2: number;
  notes: string | null;
}

interface RoomOccupancy {
  room: Room;
  dogs: Dog[];
  requiredSpace: number;
  availableSpace: number;
  isOverCapacity: boolean;
}

const WEEKDAYS = ["Måndag", "Tisdag", "Onsdag", "Torsdag", "Fredag"];

export default function HundrumView() {
  const { currentOrgId } = useAuth();
  const [selectedDay, setSelectedDay] = useState("Måndag");
  const [rooms, setRooms] = useState<Room[]>([]);
  const [dogs, setDogs] = useState<Dog[]>([]);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  useEffect(() => {
    if (currentOrgId) {
      fetchData();
    }
  }, [currentOrgId]);

  const fetchData = async () => {
    try {
      setLoading(true);

      console.log("🔍 HundrumView: Hämtar rum för org:", currentOrgId);

      // Hämta rum (dagis och kombinerade rum)
      const { data: roomsData, error: roomsError } = await supabase
        .from("rooms")
        .select("*")
        .eq("org_id", currentOrgId as string)
        .eq("is_active", true)
        .in("room_type", ["daycare", "both"])
        .order("name");

      if (roomsError) {
        console.error("[ERR-1001] Error fetching rooms:", roomsError);
        throw roomsError;
      }

      console.log(`✅ HundrumView: Hämtade ${roomsData?.length || 0} rum`);

      // Hämta ALLA hundar med room_id (både null och faktiska rum)
      // Vi filtrerar sedan i frontend baserat på vilket rum de tillhör
      const { data: dogsData, error: dogsError } = await supabase
        .from("dogs")
        .select(
          `
          id,
          name,
          breed,
          heightcm,
          photo_url,
          birth,
          days,
          subscription,
          allergies,
          medications,
          special_needs,
          behavior_notes,
          room_id,
          owners (
            full_name
          )
        `
        )
        .eq("org_id", currentOrgId as string)
        .not("room_id", "is", null); // Bara hundar MED rum

      if (dogsError) {
        console.error("[ERR-1002] Error fetching dogs:", dogsError);
        throw dogsError;
      }

      console.log(
        `✅ HundrumView: Hämtade ${dogsData?.length || 0} hundar med tilldelade rum`
      );

      setRooms(roomsData || []);
      // Fix owners type - Supabase returns array but we expect single object
      const fixedDogs = (dogsData || []).map((dog: any) => ({
        ...dog,
        owners:
          Array.isArray(dog.owners) && dog.owners.length > 0
            ? dog.owners[0]
            : dog.owners,
      }));
      setDogs(fixedDogs);
    } catch (error) {
      console.error("[ERR-1001] Error fetching room data:", error);
    } finally {
      setLoading(false);
    }
  };

  // Filtrera hundar som går vald dag
  const getDogsForDay = (day: string): Dog[] => {
    return dogs.filter((dog) => {
      if (!dog.days) return false;

      const dogDays = dog.days.split(",").map((d) => d.trim());

      // Heltid = alla vardagar
      if (dog.subscription === "Heltid") {
        return true;
      }

      // Kolla om hunden går denna dag
      return dogDays.includes(day);
    });
  };

  // Beräkna beläggning per rum för vald dag
  const getRoomOccupancy = (day: string): RoomOccupancy[] => {
    const dogsForDay = getDogsForDay(day);

    return rooms.map((room) => {
      const roomDogs = dogsForDay.filter((dog) => dog.room_id === room.id);

      // Konvertera till format som calculateRequiredArea förväntar
      const dogsForCalculation = roomDogs.map((d) => ({
        id: d.id,
        name: d.name,
        height_cm: d.heightcm || 30,
      }));

      const requiredSpace = calculateRequiredArea(dogsForCalculation);
      const roomCapacity = room.capacity_m2 ?? 0; // Fallback to 0 if null
      const availableSpace = roomCapacity - requiredSpace;
      const isOverCapacity = availableSpace < 0;

      return {
        room,
        dogs: roomDogs,
        requiredSpace,
        availableSpace,
        isOverCapacity,
      };
    });
  };

  const occupancy = getRoomOccupancy(selectedDay);

  // A4 utskrift för ett rum - använder PDF-endpoint
  const printRoomSheet = (roomOcc: RoomOccupancy) => {
    // Öppna PDF i nytt fönster
    window.open(`/api/hundrum/${roomOcc.room.id}/pdf`, "_blank");
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-gray-600">Laddar hundrum...</div>
      </div>
    );
  }

  if (rooms.length === 0) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-8 text-center">
        <Home className="w-12 h-12 text-gray-400 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">
          Inga hundrum konfigurerade
        </h3>
        <p className="text-gray-600 mb-4">
          Skapa hundrum först för att se rumsbeläggning och fördela hundar.
        </p>
        <a
          href="/admin/rum"
          className="inline-flex items-center px-4 py-2 bg-[#2c7a4c] text-white rounded-md hover:bg-[#236139] transition-colors"
        >
          <Plus className="w-4 h-4 mr-2" />
          Skapa hundrum
        </a>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Veckodagsväljare */}
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <div className="flex items-center gap-2 flex-wrap">
          {WEEKDAYS.map((day) => (
            <button
              key={day}
              onClick={() => setSelectedDay(day)}
              className={`px-4 py-2 rounded-md font-medium transition-colors ${
                selectedDay === day
                  ? "bg-[#2c7a4c] text-white"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
            >
              {day}
            </button>
          ))}
        </div>
      </div>

      {/* Översikt */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <p className="text-sm text-blue-800">
          <strong>{getDogsForDay(selectedDay).length}</strong> hundar går{" "}
          {selectedDay.toLowerCase()}. Fördelade på{" "}
          <strong>{occupancy.filter((o) => o.dogs.length > 0).length}</strong>{" "}
          rum.
        </p>
      </div>

      {/* Rumskort */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {occupancy.map((roomOcc) => (
          <div
            key={roomOcc.room.id}
            className={`bg-white rounded-lg border-2 overflow-hidden ${
              roomOcc.isOverCapacity
                ? "border-red-500"
                : roomOcc.dogs.length > 0
                  ? "border-green-500"
                  : "border-gray-200"
            }`}
          >
            {/* Header */}
            <div
              className={`p-4 ${
                roomOcc.isOverCapacity
                  ? "bg-red-50"
                  : roomOcc.dogs.length > 0
                    ? "bg-green-50"
                    : "bg-gray-50"
              }`}
            >
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="text-lg font-bold text-gray-900">
                    {roomOcc.room.name}
                  </h3>
                  <p className="text-sm text-gray-600">
                    {roomOcc.room.capacity_m2} m² totalt
                  </p>
                </div>
                {roomOcc.dogs.length > 0 && (
                  <button
                    onClick={() => printRoomSheet(roomOcc)}
                    className="p-2 rounded-md bg-white border border-gray-300 hover:bg-gray-50 transition-colors"
                    title="Skriv ut A4"
                  >
                    <Printer className="w-5 h-5 text-gray-700" />
                  </button>
                )}
              </div>
            </div>

            {/* Kapacitet */}
            <div className="p-4 border-b border-gray-200">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-700">
                  Beläggning:
                </span>
                <span
                  className={`text-sm font-bold ${
                    roomOcc.isOverCapacity ? "text-red-600" : "text-gray-900"
                  }`}
                >
                  {roomOcc.requiredSpace.toFixed(1)} /{" "}
                  {roomOcc.room.capacity_m2} m²
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
                <div
                  className={`h-full transition-all ${
                    roomOcc.isOverCapacity ? "bg-red-500" : "bg-green-500"
                  }`}
                  style={{
                    width: `${Math.min(
                      (roomOcc.requiredSpace /
                        ((roomOcc.room.capacity_m2 ?? 1) || 1)) * // Fallback to 1 to avoid division by zero
                        100,
                      100
                    )}%`,
                  }}
                />
              </div>
              <div className="mt-2 flex items-center justify-between text-xs">
                <span className="text-gray-600">
                  {roomOcc.dogs.length} hundar
                </span>
                <span
                  className={
                    roomOcc.isOverCapacity
                      ? "text-red-600 font-bold"
                      : "text-green-600"
                  }
                >
                  {roomOcc.isOverCapacity ? (
                    <>
                      <AlertTriangle className="w-3 h-3 inline mr-1" />
                      {Math.abs(roomOcc.availableSpace).toFixed(1)} m² för
                      mycket!
                    </>
                  ) : (
                    <>{roomOcc.availableSpace.toFixed(1)} m² ledigt</>
                  )}
                </span>
              </div>
            </div>

            {/* Hundlista */}
            <div className="p-4">
              {roomOcc.dogs.length === 0 ? (
                <p className="text-sm text-gray-500 text-center py-4">
                  Inga hundar denna dag
                </p>
              ) : (
                <div className="space-y-3">
                  {roomOcc.dogs.map((dog) => (
                    <div
                      key={dog.id}
                      className="flex items-center gap-3 p-2 rounded-md hover:bg-gray-50"
                    >
                      {dog.photo_url ? (
                        <img
                          src={dog.photo_url}
                          alt={dog.name}
                          className="w-10 h-10 rounded-full object-cover"
                        />
                      ) : (
                        <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center">
                          <span className="text-[#2c7a4c] font-medium text-sm">
                            {dog.name.charAt(0).toUpperCase()}
                          </span>
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">
                          {dog.name}
                        </p>
                        <p className="text-xs text-gray-500">
                          {dog.heightcm || "?"} cm |{" "}
                          {dog.subscription || "Okänt"}
                        </p>
                      </div>
                      {(dog.allergies ||
                        dog.medications ||
                        dog.special_needs) && (
                        <AlertTriangle className="w-4 h-4 text-yellow-500 flex-shrink-0" />
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
