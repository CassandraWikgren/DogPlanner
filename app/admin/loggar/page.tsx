"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";

type Log = {
  id: string;
  function_name: string;
  run_at: string;
  status: string;
  message?: string | null;
  records_created?: number | null;
  error?: string | null;
};

export default function LoggarPage() {
  const router = useRouter();
  const [logs, setLogs] = useState<Log[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [cleaning, setCleaning] = useState(false);

  // ✅ Kontrollera att användaren är admin
  useEffect(() => {
    const checkRole = async () => {
      const { data } = await supabase.auth.getUser();
      const user = data?.user;
      if (!user) {
        router.push("/login");
        return;
      }

      const { data: profile }: { data: { role: string } | null } =
        await supabase
          .from("profiles")
          .select("role")
          .eq("id", user.id)
          .single();

      if (profile?.role === "admin") setIsAdmin(true);
      else router.push("/dashboard");
    };

    checkRole();
  }, [router]);

  // ✅ Hämta loggar
  useEffect(() => {
    const fetchLogs = async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from("function_logs")
        .select("*")
        .order("run_at", { ascending: false })
        .limit(50);
      if (error) console.error("Fel vid hämtning:", error);
      else setLogs(data || []);
      setLoading(false);
    };

    fetchLogs();

    // Realtidsuppdatering
    const channel = supabase
      .channel("logs_changes")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "function_logs" },
        (payload) => {
          setLogs((prev) => [payload.new as Log, ...prev.slice(0, 49)]);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  // 🧹 Rensa gamla loggar
  async function clearOldLogs() {
    if (!confirm("Vill du rensa loggar äldre än 30 dagar?")) return;
    setCleaning(true);

    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - 30);

    const { error } = await supabase
      .from("function_logs")
      .delete()
      .lt("run_at", cutoff.toISOString());

    setCleaning(false);

    if (error) {
      alert("Fel vid rensning: " + error.message);
      return;
    }

    // Uppdatera listan
    setLogs((prev) => prev.filter((log) => new Date(log.run_at) > cutoff));

    alert("Äldre loggar rensade!");
  }

  if (loading)
    return <p className="text-center mt-20 text-gray-500">Laddar loggar...</p>;

  return (
    <main className="max-w-6xl mx-auto px-6 py-10">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-[#2c7a4c]">📜 Systemloggar</h1>
        {isAdmin && (
          <button
            onClick={clearOldLogs}
            disabled={cleaning}
            className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg text-sm transition"
          >
            {cleaning ? "Rensar..." : "🧹 Rensa äldre än 30 dagar"}
          </button>
        )}
      </div>

      <div className="overflow-x-auto bg-white shadow-md rounded-lg border border-gray-200">
        <table className="min-w-full text-sm">
          <thead className="bg-[#2c7a4c] text-white">
            <tr>
              <th className="py-3 px-4 text-left">Tidpunkt</th>
              <th className="py-3 px-4 text-left">Funktion</th>
              <th className="py-3 px-4 text-left">Status</th>
              <th className="py-3 px-4 text-left">Meddelande</th>
              <th className="py-3 px-4 text-left">Antal rader</th>
              <th className="py-3 px-4 text-left">Fel</th>
            </tr>
          </thead>
          <tbody>
            {logs.length === 0 ? (
              <tr>
                <td colSpan={6} className="text-center py-6 text-gray-500">
                  Inga loggar hittades.
                </td>
              </tr>
            ) : (
              logs.map((log) => (
                <tr
                  key={log.id}
                  className="border-t hover:bg-gray-50 transition text-gray-700"
                >
                  <td className="py-2 px-4 whitespace-nowrap">
                    {new Date(log.run_at).toLocaleString("sv-SE")}
                  </td>
                  <td className="py-2 px-4">{log.function_name}</td>
                  <td className="py-2 px-4">
                    <span
                      className={`px-2 py-1 rounded text-xs font-medium ${
                        log.status === "success"
                          ? "bg-green-100 text-green-800"
                          : "bg-red-100 text-red-800"
                      }`}
                    >
                      {log.status}
                    </span>
                  </td>
                  <td className="py-2 px-4">{log.message ?? "—"}</td>
                  <td className="py-2 px-4 text-center">
                    {log.records_created ?? "—"}
                  </td>
                  <td className="py-2 px-4 text-red-600 text-xs">
                    {log.error ?? "—"}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </main>
  );
}
