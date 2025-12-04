"use client";

import { use } from "react";
import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";

export default function HundpensionatPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const supabase = createClient();
  // 🐾 Next.js 15 – params är en Promise
  const { id } = use(params);

  const [bookings, setBookings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadBookings() {
      if (!supabase) return;

      setLoading(true);
      const { data, error } = await supabase
        .from("pension_calendar_full_view")
        .select("*")
        .eq("org_id", id)
        .order("start_date", { ascending: true });

      if (error) console.error("Fel vid hämtning:", error);
      else setBookings(data || []);
      setLoading(false);
    }

    loadBookings();
  }, [id]);

  // ✅ return måste vara inom funktionsblocket, inte utanför
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-6 py-6 space-y-6">
        <h1 className="text-4xl font-semibold text-[#2c7a4c]">
          🐕 Hundpensionat
        </h1>

        {loading ? (
          <p>Laddar bokningar...</p>
        ) : bookings.length === 0 ? (
          <Card>
            <CardHeader>
              <CardTitle>Inga bokningar hittades.</CardTitle>
            </CardHeader>
          </Card>
        ) : (
          <div className="grid gap-4">
            {bookings.map((b) => (
              <Card key={b.id} className="p-4 border border-gray-200">
                <CardHeader>
                  <CardTitle>{b.dog_name}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p>
                    <strong>Ägare:</strong> {b.owner_name} ({b.owner_email})
                  </p>
                  <p>
                    <strong>Rum:</strong> {b.room_name}
                  </p>
                  <p>
                    <strong>Period:</strong> {b.start_date} – {b.end_date}
                  </p>
                  <p>
                    <strong>Status:</strong> {b.status}
                  </p>
                  <p>
                    <strong>Pris:</strong>{" "}
                    {b.total_amount ?? b.base_price ?? "—"} kr
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
