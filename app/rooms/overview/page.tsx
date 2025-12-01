"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import Hero from "@/components/Hero";
import Link from "next/link";

export default function RoomsOverviewPage() {
  const supabase = createClient();

  const [rooms, setRooms] = useState<any[]>([]);
  const [dogs, setDogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDay, setSelectedDay] = useState("Måndag");

  const days = ["Måndag", "Tisdag", "Onsdag", "Torsdag", "Fredag"];

  useEffect(() => {
    fetchData();
  }, []);

  async function fetchData() {
    if (!supabase) return;

    setLoading(true);
    const { data: roomsData } = await supabase.from("rooms").select("*");
    const { data: dogsData } = await supabase
      .from("dogs")
      .select("*, rooms(id, name)");
    setRooms(roomsData || []);
    setDogs(dogsData || []);
    setLoading(false);
  }

  function dogIsHere(dog: any, day: string) {
    switch (dog.subscription?.toLowerCase()) {
      case "heltid":
        return ["Måndag", "Tisdag", "Onsdag", "Torsdag", "Fredag"].includes(
          day
        );
      case "deltid 3":
        return ["Måndag", "Onsdag", "Fredag"].includes(day);
      case "deltid 2":
        return ["Tisdag", "Torsdag"].includes(day);
      default:
        return false;
    }
  }

  function calcDogArea(dog: any) {
    const h = dog.height || 40;
    if (h < 25) return 2;
    if (h <= 35) return 2;
    if (h <= 45) return 2.5;
    if (h <= 55) return 3.5;
    if (h <= 65) return 4.5;
    return 5.5;
  }

  function calcUsedSpace(roomId: string) {
    const dogsInRoom = dogs.filter(
      (d) => d.room_id === roomId && dogIsHere(d, selectedDay)
    );
    const total = dogsInRoom.reduce((sum, d) => sum + calcDogArea(d), 0);
    return { dogsInRoom, used: Number(total.toFixed(1)) };
  }

  return (
    <main>
      <Hero
        title="Rumsöversikt"
        subtitle="Se vilka hundar som är i varje rum, hur mycket yta som används och om det finns plats kvar."
        image="https://images.unsplash.com/photo-1583511655624-9c8533e3f30b?auto=format&fit=crop&w=1600&q=80"
      />

      <section className="max-w-6xl mx-auto my-10 px-6">
        <Link
          href="/rooms"
          className="inline-block mb-6 text-green-700 font-semibold hover:underline"
        >
          ← Tillbaka till rum
        </Link>

        {/* Dagsväljare */}
        <div className="flex flex-wrap items-center gap-3 mb-6">
          <label className="text-sm font-semibold text-gray-700">
            Välj dag:
          </label>
          {days.map((day) => (
            <button
              key={day}
              onClick={() => setSelectedDay(day)}
              className={`px-3 py-1 rounded text-sm font-semibold ${
                selectedDay === day
                  ? "bg-green-700 text-white"
                  : "bg-gray-200 hover:bg-gray-300"
              }`}
            >
              {day}
            </button>
          ))}
        </div>

        <div className="bg-white rounded-2xl shadow p-8">
          <h2 className="text-2xl font-bold text-green-700 mb-6 flex items-center gap-2">
            🗓️ Rumsstatus för {selectedDay.toLowerCase()}
          </h2>

          {loading ? (
            <p className="text-gray-500">Hämtar data...</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full border-collapse text-sm">
                <thead className="bg-green-700 text-white">
                  <tr>
                    <th className="py-3 px-4 text-left">Rum</th>
                    <th className="py-3 px-4 text-left">Total yta (m²)</th>
                    <th className="py-3 px-4 text-left">Upptagen yta (m²)</th>
                    <th className="py-3 px-4 text-left">Ledig yta (m²)</th>
                    <th className="py-3 px-4 text-left">Hundar i rummet</th>
                  </tr>
                </thead>
                <tbody>
                  {rooms.map((room) => {
                    const { dogsInRoom, used } = calcUsedSpace(room.id);
                    const remaining = Math.max(room.capacity - used, 0).toFixed(
                      1
                    );

                    return (
                      <tr key={room.id} className="even:bg-green-50">
                        <td className="py-3 px-4 font-medium text-green-700">
                          {room.name}
                        </td>
                        <td className="py-3 px-4">{room.capacity} m²</td>
                        <td className="py-3 px-4">{used} m²</td>
                        <td
                          className={`py-3 px-4 font-semibold ${
                            Number(remaining) > 0
                              ? "text-green-700"
                              : "text-red-600"
                          }`}
                        >
                          {remaining} m²
                        </td>
                        <td className="py-3 px-4">
                          {dogsInRoom.length > 0 ? (
                            <ul className="list-disc list-inside">
                              {dogsInRoom.map((dog) => (
                                <li key={dog.id}>
                                  {dog.name} ({dog.subscription})
                                </li>
                              ))}
                            </ul>
                          ) : (
                            <span className="text-gray-400 italic">
                              Inga hundar i rummet
                            </span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </section>
    </main>
  );
}
