"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/app/context/AuthContext";

type Dog = {
  id: string;
  name: string;
  owners?: { full_name: string } | null;
};

type Room = {
  id: string;
  name: string;
  capacity_m2: number;
};

export default function NewBookingPage() {
  const router = useRouter();
  const { user, currentOrgId } = useAuth();

  const [dogs, setDogs] = useState<Dog[]>([]);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [loading, setLoading] = useState(true);

  const [bookingForm, setBookingForm] = useState({
    dog_id: "",
    room_id: "",
    start_date: "",
    end_date: "",
    notes: "",
    special_requests: "",
  });

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    if (currentOrgId) {
      loadData();
    }
  }, [currentOrgId]);

  const loadData = async () => {
    if (!supabase || !currentOrgId) return;

    try {
      const [dogsResponse, roomsResponse] = await Promise.all([
        supabase
          .from("dogs")
          .select("id, name, owners(full_name)")
          .eq("org_id", currentOrgId)
          .order("name"),
        supabase
          .from("rooms")
          .select("id, name, capacity_m2")
          .eq("org_id", currentOrgId)
          .in("room_type", ["boarding", "both"])
          .order("name"),
      ]);

      if (dogsResponse.error) throw dogsResponse.error;
      if (roomsResponse.error) throw roomsResponse.error;

      setDogs((dogsResponse.data as any) || []);
      setRooms((roomsResponse.data as any) || []);
    } catch (err: any) {
      console.error("Error loading data:", err);
      setError(`Fel vid laddning: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const validate = (): string | null => {
    if (!bookingForm.dog_id) return "Du måste välja en hund";
    if (!bookingForm.room_id) return "Du måste välja ett rum";
    if (!bookingForm.start_date) return "Startdatum är obligatoriskt";
    if (!bookingForm.end_date) return "Slutdatum är obligatoriskt";

    const startDate = new Date(bookingForm.start_date);
    const endDate = new Date(bookingForm.end_date);

    if (endDate <= startDate) {
      return "Slutdatum måste vara efter startdatum";
    }

    return null;
  };

  const calculatePrice = () => {
    if (!bookingForm.start_date || !bookingForm.end_date) return 0;

    const startDate = new Date(bookingForm.start_date);
    const endDate = new Date(bookingForm.end_date);
    const nights = Math.ceil(
      (endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)
    );

    // Grundpris per natt (detta kan göras mer avancerat senare)
    const basePrice = 350;
    return nights * basePrice;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!supabase) {
      setError("Databaskoppling saknas");
      return;
    }

    const validationError = validate();
    if (validationError) {
      setError(validationError);
      return;
    }

    setSubmitting(true);
    setError(null);
    setSuccess(null);

    try {
      const orgId = user?.user_metadata?.org_id || user?.id;

      // Hämta hundens ägare
      const { data: dogData } = await supabase
        .from("dogs")
        .select("owner_id")
        .eq("id", bookingForm.dog_id)
        .single();

      const totalPrice = calculatePrice();

      const { data: newBooking, error: bookingError } = await supabase
        .from("bookings")
        .insert({
          org_id: orgId,
          dog_id: bookingForm.dog_id,
          owner_id: (dogData as any)?.owner_id,
          room_id: bookingForm.room_id,
          start_date: bookingForm.start_date,
          end_date: bookingForm.end_date,
          notes: bookingForm.notes || null,
          special_requests: bookingForm.special_requests || null,
          total_price: totalPrice,
          status: "pending",
        } as any)
        .select("id")
        .single();

      if (bookingError) throw bookingError;

      setSuccess("Bokning har skapats!");

      // Redirect efter 1.5 sekunder
      setTimeout(() => {
        router.push("/hundpensionat");
      }, 1500);
    } catch (err: any) {
      console.error("Error creating booking:", err);
      setError(`Fel vid sparande: ${err.message}`);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-lg">Laddar...</div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold text-blue-600">
            Ny pensionatbokning
          </h1>
          <p className="text-gray-600 mt-1">
            Skapa en ny bokning för hundpensionat
          </p>
        </div>
        <Link
          href="/hundpensionat"
          className="inline-flex items-center gap-2 rounded-lg border px-3 py-2 text-sm hover:bg-gray-50"
        >
          ← Tillbaka
        </Link>
      </div>

      {error && (
        <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-red-700">
          {error}
        </div>
      )}

      {success && (
        <div className="mb-4 rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-green-700">
          {success}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Bokningsdetaljer */}
        <section className="rounded-2xl border bg-white p-6 shadow-sm">
          <h2 className="mb-4 text-lg font-semibold text-gray-900">
            Bokningsdetaljer
          </h2>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Välj hund *
              </label>
              <select
                required
                className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-blue-500 focus:ring-blue-500"
                value={bookingForm.dog_id}
                onChange={(e) =>
                  setBookingForm((prev) => ({
                    ...prev,
                    dog_id: e.target.value,
                  }))
                }
              >
                <option value="">Välj hund...</option>
                {dogs.map((dog) => (
                  <option key={dog.id} value={dog.id}>
                    {dog.name} ({dog.owners?.full_name || "Okänd ägare"})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Välj rum *
              </label>
              <select
                required
                className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-blue-500 focus:ring-blue-500"
                value={bookingForm.room_id}
                onChange={(e) =>
                  setBookingForm((prev) => ({
                    ...prev,
                    room_id: e.target.value,
                  }))
                }
              >
                <option value="">Välj rum...</option>
                {rooms.map((room) => (
                  <option key={room.id} value={room.id}>
                    {room.name} ({room.capacity_m2}m²)
                  </option>
                ))}
              </select>
              {rooms.length === 0 && (
                <p className="text-sm text-red-600 mt-1">
                  Inga rum tillgängliga.{" "}
                  <Link href="/rooms" className="underline">
                    Lägg till rum först
                  </Link>
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Startdatum *
              </label>
              <input
                type="date"
                required
                className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-blue-500 focus:ring-blue-500"
                value={bookingForm.start_date}
                onChange={(e) =>
                  setBookingForm((prev) => ({
                    ...prev,
                    start_date: e.target.value,
                  }))
                }
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Slutdatum *
              </label>
              <input
                type="date"
                required
                className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-blue-500 focus:ring-blue-500"
                value={bookingForm.end_date}
                onChange={(e) =>
                  setBookingForm((prev) => ({
                    ...prev,
                    end_date: e.target.value,
                  }))
                }
              />
            </div>

            {bookingForm.start_date && bookingForm.end_date && (
              <div className="md:col-span-2 p-4 bg-blue-50 rounded-lg">
                <p className="font-semibold text-blue-900">
                  Uppskattad kostnad: {calculatePrice()} kr
                </p>
                <p className="text-sm text-blue-700">
                  (
                  {Math.ceil(
                    (new Date(bookingForm.end_date).getTime() -
                      new Date(bookingForm.start_date).getTime()) /
                      (1000 * 60 * 60 * 24)
                  )}{" "}
                  nätter × 350 kr/natt)
                </p>
              </div>
            )}

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Speciella önskemål
              </label>
              <textarea
                rows={3}
                placeholder="Särskilda behov, mediciner, kostvanor..."
                className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-blue-500 focus:ring-blue-500"
                value={bookingForm.special_requests}
                onChange={(e) =>
                  setBookingForm((prev) => ({
                    ...prev,
                    special_requests: e.target.value,
                  }))
                }
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Interna anteckningar
              </label>
              <textarea
                rows={3}
                placeholder="Anteckningar för personalen..."
                className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-blue-500 focus:ring-blue-500"
                value={bookingForm.notes}
                onChange={(e) =>
                  setBookingForm((prev) => ({ ...prev, notes: e.target.value }))
                }
              />
            </div>
          </div>
        </section>

        {/* Submit buttons */}
        <div className="flex justify-end gap-3">
          <Link
            href="/hundpensionat"
            className="rounded-lg border border-gray-300 px-4 py-2 text-sm hover:bg-gray-50"
          >
            Avbryt
          </Link>
          <button
            type="submit"
            disabled={submitting || dogs.length === 0 || rooms.length === 0}
            className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {submitting ? "Sparar..." : "Skapa bokning"}
          </button>
        </div>
      </form>
    </div>
  );
}
