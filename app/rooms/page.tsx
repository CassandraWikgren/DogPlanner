"use client";

import { useEffect, useState } from "react";
import { createClient } from "@supabase/supabase-js";
import { useAuth } from "@/context/AuthContext";

// ✅ Använd miljövariabler
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

type Room = {
  id: string;
  name: string;
  capacity: number;
  notes?: string;
  user_id: string;
};

export default function RoomsPage() {
  const { user } = useAuth();
  const [rooms, setRooms] = useState<Room[]>([]);
  const [newRoomName, setNewRoomName] = useState("");
  const [newCapacity, setNewCapacity] = useState<number>(0);
  const [newNotes, setNewNotes] = useState("");
  const [loading, setLoading] = useState(false);

  // 🔹 Hämta rum
  useEffect(() => {
    if (!user) return;
    const fetchRooms = async () => {
      const { data, error } = await supabase
        .from("rooms")
        .select("*")
        .eq("user_id", user.id)
        .order("name");
      if (error) console.error("Fel vid hämtning:", error.message);
      else setRooms(data || []);
    };
    fetchRooms();
  }, [user]);

  // 🔹 Lägg till nytt rum
  const addRoom = async () => {
    if (!newRoomName) return alert("Du måste ange ett namn på rummet.");
    setLoading(true);
    const { error } = await supabase.from("rooms").insert([
      {
        name: newRoomName,
        capacity: newCapacity || 0,
        notes: newNotes,
        user_id: user?.id,
      },
    ]);
    setLoading(false);
    if (error) alert("Kunde inte lägga till rum: " + error.message);
    else {
      setNewRoomName("");
      setNewCapacity(0);
      setNewNotes("");
      const { data } = await supabase
        .from("rooms")
        .select("*")
        .eq("user_id", user?.id)
        .order("name");
      setRooms(data || []);
    }
  };

  // 🔹 Ta bort rum
  const deleteRoom = async (id: string) => {
    if (!confirm("Är du säker på att du vill ta bort detta rum?")) return;
    const { error } = await supabase.from("rooms").delete().eq("id", id);
    if (error) alert("Kunde inte ta bort rummet: " + error.message);
    else setRooms(rooms.filter((r) => r.id !== id));
  };

  return (
    <main className="min-h-screen bg-gray-50 py-10 px-6">
      <div className="max-w-4xl mx-auto bg-white rounded-2xl shadow-md p-8 border border-gray-200">
        <h1 className="text-3xl font-bold text-[#2c7a4c] mb-6 text-center">
          🏡 Mina hundrum
        </h1>

        {/* Lägg till nytt rum */}
        <div className="bg-gray-100 p-4 rounded-lg mb-8">
          <h2 className="font-semibold mb-3 text-[#2c7a4c]">
            ➕ Lägg till nytt rum
          </h2>
          <div className="flex flex-col md:flex-row gap-3">
            <input
              type="text"
              placeholder="Rumsnamn..."
              value={newRoomName}
              onChange={(e) => setNewRoomName(e.target.value)}
              className="border px-3 py-2 rounded w-full md:w-1/3"
            />
            <input
              type="number"
              placeholder="Kapacitet"
              value={newCapacity}
              onChange={(e) => setNewCapacity(Number(e.target.value))}
              className="border px-3 py-2 rounded w-full md:w-1/4"
            />
            <input
              type="text"
              placeholder="Anteckningar (valfritt)"
              value={newNotes}
              onChange={(e) => setNewNotes(e.target.value)}
              className="border px-3 py-2 rounded w-full md:w-1/3"
            />
            <button
              onClick={addRoom}
              disabled={loading}
              className="bg-[#2c7a4c] text-white px-5 py-2 rounded hover:bg-green-700 transition"
            >
              {loading ? "Lägger till..." : "Lägg till"}
            </button>
          </div>
        </div>

        {/* Lista med rum */}
        {rooms.length === 0 ? (
          <p className="text-gray-500 text-center italic">
            Inga rum tillagda ännu.
          </p>
        ) : (
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr className="bg-[#2c7a4c] text-white">
                <th className="py-3 px-4 text-left rounded-tl-lg">Namn</th>
                <th className="py-3 px-4 text-left">Kapacitet</th>
                <th className="py-3 px-4 text-left">Anteckningar</th>
                <th className="py-3 px-4 text-right rounded-tr-lg">Åtgärder</th>
              </tr>
            </thead>
            <tbody>
              {rooms.map((room) => (
                <tr
                  key={room.id}
                  className="border-b hover:bg-gray-50 transition duration-100"
                >
                  <td className="py-3 px-4 font-medium text-[#2c7a4c]">
                    {room.name}
                  </td>
                  <td className="py-3 px-4">{room.capacity}</td>
                  <td className="py-3 px-4 text-gray-600">
                    {room.notes || "—"}
                  </td>
                  <td className="py-3 px-4 text-right">
                    <button
                      onClick={() => deleteRoom(room.id)}
                      className="text-red-600 hover:text-red-800"
                    >
                      Ta bort
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </main>
  );
}
