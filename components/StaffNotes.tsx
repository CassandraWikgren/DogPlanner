"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

export default function StaffNotes() {
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(true);
  const [showSaved, setShowSaved] = useState(false); // ✅ för popup

  useEffect(() => {
    fetchNote();
  }, []);

  // 🔹 Hämta anteckningen från databasen
  async function fetchNote() {
    if (!supabase) return;

    setLoading(true);
    const { data, error } = await supabase
      .from("staff_notes")
      .select("note")
      .eq("id", 1)
      .single();

    const typedData = data as { note: string } | null;
    if (!error && typedData) setNotes(typedData.note || "");
    setLoading(false);
  }

  // 💾 Spara direkt när man skriver
  async function saveNote(value: string) {
    setNotes(value);

    const { error } = await (supabase as any)
      .from("staff_notes")
      .upsert({ id: 1, note: value });

    if (error) {
      console.error("Fel vid sparning:", error.message);
    } else {
      // Visa “✅ Sparat!” i 2 sekunder
      setShowSaved(true);
      setTimeout(() => setShowSaved(false), 2000);
    }
  }

  return (
    <section className="max-w-6xl mx-auto my-12 px-6 relative">
      <div className="bg-white shadow-lg rounded-2xl p-8">
        <h2 className="text-2xl font-bold text-green-700 mb-4">
          🧭 Personalplan & ansvar för dagen
        </h2>

        {loading ? (
          <p className="text-gray-500 italic">Laddar anteckning...</p>
        ) : (
          <textarea
            value={notes}
            onChange={(e) => saveNote(e.target.value)}
            placeholder="Skriv t.ex: 
Lisa – Grupp 1 (promenad)
Emma – Trim / Bad
Anna – Medicinering och lunchgrupp"
            className="w-full border rounded-lg p-4 text-gray-700 text-sm h-48 resize-none focus:outline-none focus:ring-2 focus:ring-green-600"
          />
        )}

        <p className="text-xs text-gray-400 mt-2">
          Ändringar sparas automatiskt.
        </p>
      </div>

      {/* ✅ Popup för sparad status */}
      {showSaved && (
        <div className="absolute bottom-0 right-4 mb-4 bg-green-600 text-white text-sm px-4 py-2 rounded-lg shadow-md transition-all duration-300">
          ✅ Sparat!
        </div>
      )}
    </section>
  );
}
