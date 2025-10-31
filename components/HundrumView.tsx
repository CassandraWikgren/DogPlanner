"use client";

import React, { useState, useEffect } from "react";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import { useAuth } from "@/app/context/AuthContext";
import { calculateRequiredArea } from "@/lib/roomCalculator";
import { Printer, Download, AlertTriangle, CheckCircle } from "lucide-react";

interface Dog {
  id: string;
  name: string;
  breed: string | null;
  heightcm: number | null;
  photo_url: string | null;
  birth: string | null;
  days: string | null; // "Måndag,Onsdag,Fredag"
  subscription: string | null; // "Heltid", "Deltid 2", "Deltid 3"
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
  name: string;
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
  const { user } = useAuth();
  const [selectedDay, setSelectedDay] = useState("Måndag");
  const [rooms, setRooms] = useState<Room[]>([]);
  const [dogs, setDogs] = useState<Dog[]>([]);
  const [loading, setLoading] = useState(true);
  const supabase = createClientComponentClient();

  useEffect(() => {
    if (user?.org_id) {
      fetchData();
    }
  }, [user?.org_id]);

  const fetchData = async () => {
    try {
      setLoading(true);

      // Hämta rum
      const { data: roomsData, error: roomsError } = await supabase
        .from("rooms")
        .select("*")
        .eq("org_id", user.org_id)
        .eq("is_active", true)
        .order("name");

      if (roomsError) throw roomsError;

      // Hämta hundar med rum tilldelade
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
        .eq("org_id", user.org_id)
        .not("room_id", "is", null);

      if (dogsError) throw dogsError;

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
      const availableSpace = room.capacity_m2 - requiredSpace;
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

  // A4 utskrift för ett rum
  const printRoomSheet = (roomOcc: RoomOccupancy) => {
    const printWindow = window.open("", "_blank");
    if (!printWindow) return;

    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>${roomOcc.room.name} - ${selectedDay}</title>
        <style>
          @page { 
            size: A4; 
            margin: 2cm; 
          }
          body {
            font-family: Arial, sans-serif;
            background: white;
            color: #1f2937;
            margin: 0;
            padding: 20px;
          }
          .header {
            text-align: center;
            margin-bottom: 30px;
            border-bottom: 3px solid #2c7a4c;
            padding-bottom: 15px;
          }
          .header h1 {
            color: #2c7a4c;
            margin: 0 0 5px 0;
            font-size: 32px;
          }
          .header p {
            color: #6b7280;
            margin: 0;
            font-size: 14px;
          }
          .dog-grid {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 20px;
            margin-bottom: 40px;
          }
          .dog-card {
            border: 2px solid #e5e7eb;
            border-radius: 8px;
            padding: 15px;
            break-inside: avoid;
          }
          .dog-header {
            display: flex;
            align-items: center;
            gap: 15px;
            margin-bottom: 12px;
            border-bottom: 1px solid #e5e7eb;
            padding-bottom: 10px;
          }
          .dog-photo {
            width: 60px;
            height: 60px;
            border-radius: 50%;
            object-fit: cover;
            border: 2px solid #2c7a4c;
          }
          .dog-photo-placeholder {
            width: 60px;
            height: 60px;
            border-radius: 50%;
            background: #e5e7eb;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 24px;
            font-weight: bold;
            color: #2c7a4c;
            border: 2px solid #2c7a4c;
          }
          .dog-name {
            font-size: 18px;
            font-weight: bold;
            color: #1f2937;
            margin: 0;
          }
          .dog-breed {
            font-size: 12px;
            color: #6b7280;
            margin: 0;
          }
          .dog-info {
            font-size: 13px;
            line-height: 1.6;
          }
          .info-row {
            display: flex;
            margin-bottom: 5px;
          }
          .info-label {
            font-weight: bold;
            min-width: 80px;
            color: #374151;
          }
          .info-value {
            color: #1f2937;
          }
          .warning-box {
            background: #fef2f2;
            border: 1px solid #fca5a5;
            border-radius: 6px;
            padding: 8px 10px;
            margin-top: 8px;
          }
          .warning-box strong {
            color: #dc2626;
            font-size: 12px;
          }
          .warning-box p {
            color: #991b1b;
            font-size: 11px;
            margin: 3px 0 0 0;
          }
          .days-badge {
            display: inline-block;
            background: #2c7a4c;
            color: white;
            padding: 3px 8px;
            border-radius: 4px;
            font-size: 11px;
            margin-right: 4px;
            margin-top: 4px;
          }
          .footer {
            text-align: right;
            margin-top: 40px;
            padding-top: 20px;
            border-top: 1px solid #e5e7eb;
            font-size: 10px;
            color: #9ca3af;
          }
          .footer img {
            width: 80px;
            opacity: 0.6;
          }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>${roomOcc.room.name}</h1>
          <p>${selectedDay} | ${roomOcc.dogs.length} hundar | ${roomOcc.requiredSpace.toFixed(1)} m² av ${roomOcc.room.capacity_m2} m²</p>
        </div>

        <div class="dog-grid">
          ${roomOcc.dogs
            .map(
              (dog) => `
            <div class="dog-card">
              <div class="dog-header">
                ${
                  dog.photo_url
                    ? `<img src="${dog.photo_url}" alt="${dog.name}" class="dog-photo" />`
                    : `<div class="dog-photo-placeholder">${dog.name.charAt(0).toUpperCase()}</div>`
                }
                <div>
                  <h3 class="dog-name">${dog.name}</h3>
                  <p class="dog-breed">${dog.breed || "Blandras"}</p>
                </div>
              </div>
              
              <div class="dog-info">
                <div class="info-row">
                  <span class="info-label">Ägare:</span>
                  <span class="info-value">${dog.owners?.full_name || "-"}</span>
                </div>
                <div class="info-row">
                  <span class="info-label">Födelsedatum:</span>
                  <span class="info-value">${dog.birth ? new Date(dog.birth).toLocaleDateString("sv-SE") : "-"}</span>
                </div>
                <div class="info-row">
                  <span class="info-label">Mankhöjd:</span>
                  <span class="info-value">${dog.heightcm || "-"} cm</span>
                </div>
                <div class="info-row">
                  <span class="info-label">Abonnemang:</span>
                  <span class="info-value">${dog.subscription || "-"}</span>
                </div>
                <div class="info-row">
                  <span class="info-label">Dagar:</span>
                  <div class="info-value">
                    ${(dog.days || "")
                      .split(",")
                      .map(
                        (day) => `<span class="days-badge">${day.trim()}</span>`
                      )
                      .join("")}
                  </div>
                </div>

                ${
                  dog.allergies ||
                  dog.medications ||
                  dog.special_needs ||
                  dog.behavior_notes
                    ? `
                  <div class="warning-box">
                    <strong>⚠️ Viktig information:</strong>
                    ${dog.allergies ? `<p><strong>Allergier:</strong> ${dog.allergies}</p>` : ""}
                    ${dog.medications ? `<p><strong>Medicin:</strong> ${dog.medications}</p>` : ""}
                    ${dog.special_needs ? `<p><strong>Särskilda behov:</strong> ${dog.special_needs}</p>` : ""}
                    ${dog.behavior_notes ? `<p><strong>Beteende:</strong> ${dog.behavior_notes}</p>` : ""}
                  </div>
                `
                    : ""
                }
              </div>
            </div>
          `
            )
            .join("")}
        </div>

        <div class="footer">
          <p>Skapad med DogPlanner</p>
        </div>
      </body>
      </html>
    `;

    printWindow.document.write(html);
    printWindow.document.close();
    setTimeout(() => {
      printWindow.print();
    }, 250);
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
        <h3 className="text-lg font-medium text-gray-900 mb-2">
          Inga rum konfigurerade
        </h3>
        <p className="text-gray-600 mb-4">
          Gå till Admin → Rum för att lägga till hundrum.
        </p>
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
                      (roomOcc.requiredSpace / roomOcc.room.capacity_m2) * 100,
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
