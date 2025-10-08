"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

type Owner = {
  firstName?: string;
  lastName?: string;
  phone?: string;
  email?: string;
};

type Dog = {
  id: string;
  name: string;
  breed: string | null;
  birth: string | null;
  heightcm: number | null;
  subscription: string | null;
  days: string | null;
  roomid: string | null;
  vaccdhp: string | null;
  vaccpi: string | null;
  notes: string | null;
  owner: Owner | null;
};

type Room = {
  id: string;
  name: string;
};

export default function DogDetailsPage() {
  const { id } = useParams();
  const router = useRouter();
  const [dog, setDog] = useState<Dog | null>(null);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 🔹 Hämta hund + rum
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      const { data: dogData, error: dogError } = await supabase
        .from("dogs")
        .select("*")
        .eq("id", id)
        .single();

      const { data: roomData } = await supabase.from("rooms").select("*");

      if (dogError) {
        setError("Kunde inte hämta hundens data.");
        console.error(dogError);
      } else {
        setDog(dogData);
      }

      setRooms(roomData || []);
      setLoading(false);
    };

    fetchData();
  }, [id]);

  // 🔹 Uppdatera hunden i Supabase
  const handleSave = async () => {
    if (!dog) return;
    setSaving(true);
    const { error } = await supabase.from("dogs").update(dog).eq("id", dog.id);
    setSaving(false);

    if (error) {
      console.error(error);
      setError("Något gick fel vid sparning.");
    } else {
      alert("✅ Ändringar sparade!");
      router.push("/hunddagis");
    }
  };

  if (loading) return <p className="p-6 text-center">Laddar hund...</p>;
  if (error) return <p className="p-6 text-center text-red-600">{error}</p>;
  if (!dog) return <p className="p-6 text-center">Ingen hund hittades.</p>;

  return (
    <main className="min-h-screen bg-gray-50 py-10">
      <div className="max-w-3xl mx-auto bg-white shadow-md rounded-xl p-8 border border-gray-200">
        <h1 className="text-3xl font-bold text-[#2c7a4c] mb-6">
          🐶 Redigera {dog.name}
        </h1>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">
              Namn
            </label>
            <input
              value={dog.name}
              onChange={(e) => setDog({ ...dog, name: e.target.value })}
              className="w-full border rounded px-3 py-2"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">
              Ras
            </label>
            <input
              value={dog.breed || ""}
              onChange={(e) => setDog({ ...dog, breed: e.target.value })}
              className="w-full border rounded px-3 py-2"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">
              Födelsedatum
            </label>
            <input
              type="date"
              value={dog.birth || ""}
              onChange={(e) => setDog({ ...dog, birth: e.target.value })}
              className="w-full border rounded px-3 py-2"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">
              Mankhöjd (cm)
            </label>
            <input
              type="number"
              value={dog.heightcm || ""}
              onChange={(e) =>
                setDog({ ...dog, heightcm: Number(e.target.value) })
              }
              className="w-full border rounded px-3 py-2"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">
              Abonnemang
            </label>
            <input
              value={dog.subscription || ""}
              onChange={(e) => setDog({ ...dog, subscription: e.target.value })}
              className="w-full border rounded px-3 py-2"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">
              Rum
            </label>
            <select
              value={dog.roomid || ""}
              onChange={(e) => setDog({ ...dog, roomid: e.target.value })}
              className="w-full border rounded px-3 py-2"
            >
              <option value="">— Ingen —</option>
              {rooms.map((room) => (
                <option key={room.id} value={room.id}>
                  {room.name}
                </option>
              ))}
            </select>
          </div>

          <div className="col-span-2">
            <label className="block text-sm font-semibold text-gray-700 mb-1">
              Kommentarer / anteckningar
            </label>
            <textarea
              value={dog.notes || ""}
              onChange={(e) => setDog({ ...dog, notes: e.target.value })}
              className="w-full border rounded px-3 py-2 h-24"
            />
          </div>
        </div>

        <div className="flex justify-between mt-8">
          <button
            onClick={() => router.push("/hunddagis")}
            className="px-4 py-2 bg-gray-200 hover:bg-gray-300 rounded text-sm"
          >
            ⬅️ Tillbaka
          </button>

          <button
            onClick={handleSave}
            disabled={saving}
            className="px-6 py-2 bg-[#2c7a4c] hover:bg-green-700 text-white rounded text-sm"
          >
            {saving ? "💾 Sparar..." : "💾 Spara ändringar"}
          </button>
        </div>
      </div>
    </main>
  );
}
