"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { useSupabaseClient } from "@supabase/auth-helpers-react";
import EditOwnerModal from "@/components/EditOwnerModal";
import { Button } from "@/components/ui/button";

export default function OwnerDetailPage() {
  const supabase = useSupabaseClient();
  const { id } = useParams(); // customerNumber
  const [owner, setOwner] = useState<any>(null);
  const [dogs, setDogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [editOpen, setEditOpen] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      const { data: ownerData } = await supabase
        .from("owners")
        .select("*")
        .eq("customerNumber", id)
        .maybeSingle();
      setOwner(ownerData);

      const { data: dogData } = await supabase
        .from("dogs")
        .select("*")
        .eq("customerNumber", id);
      setDogs(dogData || []);
      setLoading(false);
    };
    if (id) fetchData();
  }, [id, supabase]);

  if (loading) return <p className="p-6 text-gray-500">Laddar...</p>;
  if (!owner) return <p className="p-6 text-red-600">Ingen ägare hittades.</p>;

  return (
    <main className="max-w-5xl mx-auto p-6 space-y-8">
      <section className="bg-white p-6 shadow rounded-xl">
        <h1 className="text-2xl font-bold text-green-700 mb-2">
          👤 {owner.name}
        </h1>
        <p>Kundnummer: {owner.customerNumber}</p>
        <p>Telefon: {owner.phone}</p>
        <p>E-post: {owner.email}</p>

        <Button
          onClick={() => setEditOpen(true)}
          className="mt-4 bg-green-700 hover:bg-green-800 text-white"
        >
          ✏️ Redigera uppgifter
        </Button>
      </section>

      <section className="bg-white p-6 shadow rounded-xl">
        <h2 className="text-xl font-semibold text-green-700 mb-3">
          🐶 Hundar till denna ägare
        </h2>
        {dogs.length === 0 ? (
          <p className="text-gray-500">Inga hundar registrerade ännu.</p>
        ) : (
          <ul className="list-disc list-inside">
            {dogs.map((dog) => (
              <li key={dog.id}>
                {dog.name} ({dog.breed}, {dog.gender})
              </li>
            ))}
          </ul>
        )}
      </section>

      {editOpen && (
        <EditOwnerModal
          open={editOpen}
          onClose={() => setEditOpen(false)}
          owner={owner}
          refresh={() => window.location.reload()}
        />
      )}
    </main>
  );
}
