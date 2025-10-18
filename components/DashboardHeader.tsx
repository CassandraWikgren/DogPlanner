"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { AlertTriangle, CheckCircle2, Clock } from "lucide-react";

interface Dog {
  id: string;
  name: string;
  checked_in: boolean;
  checkin_date: string | null;
  checkout_date: string | null;
  special_note?: string | null;
}

export default function DashboardHeader() {
  const [dateInfo, setDateInfo] = useState({ date: "", weekday: "" });
  const [dogs, setDogs] = useState<Dog[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      const today = new Date();
      const options = { weekday: "long" } as const;

      setDateInfo({
        date: today.toLocaleDateString("sv-SE", {
          year: "numeric",
          month: "long",
          day: "numeric",
        }),
        weekday: today.toLocaleDateString("sv-SE", options),
      });

      await fetchDogs();
    }

    loadData();
  }, []);

  async function fetchDogs() {
    setLoading(true);
    const { data, error } = await supabase.from("dogs").select("*");

    if (!error && data) setDogs(data);
    setLoading(false);
  }

  const today = new Date().toISOString().split("T")[0];
  const inChecked = dogs.filter((d) => d.checked_in).length;
  const comingToday = dogs.filter((d) => d.checkin_date === today).length;
  const leavingToday = dogs.filter((d) => d.checkout_date === today).length;
  const dogsWithNotes = dogs.filter(
    (d) => d.special_note && d.special_note.trim() !== ""
  ).length;

  return (
    <section className="max-w-6xl mx-auto my-8 px-6">
      <div className="bg-green-700 text-white rounded-2xl shadow-lg p-8 flex flex-col md:flex-row md:justify-between md:items-center">
        {/* Datum & veckodag */}
        <div>
          <h1 className="text-3xl font-bold mb-1">📅 {dateInfo.weekday}</h1>
          <p className="text-lg opacity-90">{dateInfo.date}</p>
        </div>

        {/* Statistik */}
        <div className="flex flex-wrap gap-6 mt-6 md:mt-0">
          <StatBox
            icon={<CheckCircle2 className="text-white" size={24} />}
            label="Incheckade"
            value={loading ? "..." : inChecked}
            color="bg-green-500"
          />
          <StatBox
            icon={<Clock className="text-white" size={24} />}
            label="Kommer idag"
            value={loading ? "..." : comingToday}
            color="bg-blue-500"
          />
          <StatBox
            icon={<Clock className="text-white" size={24} />}
            label="Går hem idag"
            value={loading ? "..." : leavingToday}
            color="bg-yellow-500"
          />
          <StatBox
            icon={<AlertTriangle className="text-white" size={24} />}
            label="Varningar"
            value={loading ? "..." : dogsWithNotes}
            color="bg-red-500"
          />
        </div>
      </div>
    </section>
  );
}

function StatBox({
  icon,
  label,
  value,
  color,
}: {
  icon: React.ReactNode;
  label: string;
  value: string | number;
  color: string;
}) {
  return (
    <div
      className={`flex items-center gap-3 ${color} rounded-xl px-4 py-3 shadow-md w-40 justify-between`}
    >
      {icon}
      <div className="text-right">
        <p className="text-lg font-bold">{value}</p>
        <p className="text-sm opacity-90">{label}</p>
      </div>
    </div>
  );
}
