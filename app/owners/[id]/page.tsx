"use client";

// Förhindra prerendering för att undvika build-fel
export const dynamic = "force-dynamic";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { useAuth } from "@/app/context/AuthContext";
import { EditOwnerModal } from "@/components/EditOwnerModal";
import { Button } from "@components/ui/button";
import PageContainer from "@/components/PageContainer";

export default function OwnerPage() {
  const supabase = createClient();
  const { user } = useAuth();
  const params = useParams();
  // id från [id] är alltid en sträng i Next.js App Router
  const id =
    typeof params.id === "string"
      ? params.id
      : Array.isArray(params.id)
        ? params.id[0]
        : undefined;
  const [owner, setOwner] = useState<any>(null);
  const [dogs, setDogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [editOpen, setEditOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError(null);
      try {
        if (typeof id !== "string" || !id) {
          setError("[ERR-1001] Ogiltigt ägar-ID.");
          setLoading(false);
          return;
        }
        // Hämta ägare baserat på owners.id (Supabase: små bokstäver)
        const { data: ownerData, error: ownerErr } = await supabase
          .from("owners")
          .select("*")
          .eq("id", id)
          .maybeSingle();
        if (ownerErr) throw new Error(`[ERR-1001] ${ownerErr.message}`);
        setOwner(ownerData);

        // Hämta hundar kopplade till ägaren via dogs.owner_id → owners.id
        const { data: dogData, error: dogErr } = await supabase
          .from("dogs")
          .select("*")
          .eq("owner_id", id);
        if (dogErr) throw new Error(`[ERR-1001] ${dogErr.message}`);
        setDogs(dogData || []);
      } catch (e: any) {
        setError(e.message || "[ERR-1001] Okänt fel vid databaskoppling.");
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [id]);

  if (loading) return <p className="p-6 text-gray-500">Laddar...</p>;
  if (error) return <p className="p-6 text-red-600">{error}</p>;
  if (!owner) return <p className="p-6 text-red-600">Ingen ägare hittades.</p>;

  return (
    <PageContainer maxWidth="7xl">
      <section className="bg-white p-6 shadow rounded-xl space-y-8">
        <div>
          <h1 className="text-[32px] font-bold text-[#2c7a4c] leading-tight mb-2">
            👤 {owner.name}
          </h1>
          <p>Kundnummer: {owner.customernumber}</p>
          <p>Telefon: {owner.phone}</p>
          <p>E-post: {owner.email}</p>

          <Button
            onClick={() => setEditOpen(true)}
            className="mt-4 bg-[#2c7a4c] hover:bg-[#236139] text-white px-6 py-2.5 h-10"
          >
            ✏️ Redigera uppgifter
          </Button>
        </div>

        <div>
          <h2 className="text-lg font-semibold text-[#2c7a4c] mb-3">
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
        </div>
      </section>

      {editOpen && (
        <EditOwnerModal
          open={editOpen}
          onClose={() => setEditOpen(false)}
          owner={owner}
          refresh={() => window.location.reload()}
        />
      )}
    </PageContainer>
  );
}
