"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import Hero from "../components/Hero";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

export default function DagensPage() {
  const [dogs, setDogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterRoom, setFilterRoom] = useState("");
  const [rooms, setRooms] = useState<any[]>([]);

  useEffect(() => {
    fetchDogs();
    fetchRooms();

    const channel = supabase
      .channel("dogs-realtime")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "dogs" },
        () => fetchDogs()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  async function fetchDogs() {
    setLoading(true);
    const { data, error } = await supabase
      .from("dogs")
      .select("*, rooms(name)")
      .order("name");

    if (!error) setDogs(data || []);
    setLoading(false);
  }

  async function fetchRooms() {
    const { data } = await supabase.from("rooms").select("*").order("name");
    setRooms(data || []);
  }

  async function toggleCheckIn(dog: any) {
    await supabase
      .from("dogs")
      .update({ checked_in: !dog.checked_in })
      .eq("id", dog.id);
  }

  async function updateNote(dog: any, note: string) {
    await supabase.from("dogs").update({ note }).eq("id", dog.id);
  }

  // 🔹 Export till PDF
  function exportPDF() {
    if (!dogs.length) return alert("Ingen data att exportera ännu.");

    const today = new Date();
    const tomorrow = new Date();
    tomorrow.setDate(today.getDate() + 1);

    const doc = new jsPDF();
    const formattedDate = today.toLocaleDateString("sv-SE", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });

    doc.text(`Dagens lista – Hunddagis ${formattedDate}`, 14, 18);
    doc.setFontSize(10);
    doc.text(`Utskriven: ${new Date().toLocaleTimeString("sv-SE")}`, 160, 18, {
      align: "right",
    });

    const filtered = filterRoom
      ? dogs.filter((d) => d.rooms?.name === filterRoom)
      : dogs;

    const inDogs = filtered.filter((d) => d.checked_in);
    const plannedIn = filtered.filter(
      (d) => d.checkin_date && isToday(d.checkin_date)
    );
    const plannedOut = filtered.filter(
      (d) =>
        d.checkout_date &&
        (isToday(d.checkout_date) || isTomorrow(d.checkout_date))
    );

    const total = filtered.length;
    const totalIn = inDogs.length;
    const totalPlannedIn = plannedIn.length;
    const totalPlannedOut = plannedOut.length;

    // 🐶 Tabell 1 – Aktuella hundar
    autoTable(doc, {
      startY: 26,
      head: [["Hund", "Rum", "Status", "Anteckning", "Nästa in/ut"]],
      body: filtered.map((d) => [
        d.name,
        d.rooms?.name || "-",
        d.checked_in
          ? "✅ Incheckad"
          : d.checkin_date && isToday(d.checkin_date)
          ? "🕓 Planerad in"
          : d.checkout_date &&
            (isToday(d.checkout_date) || isTomorrow(d.checkout_date))
          ? "🚗 Planerad ut"
          : "—",
        d.note || "-",
        d.checkout_date
          ? new Date(d.checkout_date).toLocaleDateString("sv-SE")
          : d.checkin_date
          ? new Date(d.checkin_date).toLocaleDateString("sv-SE")
          : "-",
      ]),
      styles: { fontSize: 9 },
      headStyles: { fillColor: [46, 125, 50] },
    });

    // 🧾 Summering
    const finalY = (doc as any).lastAutoTable.finalY + 10;
    doc.setFontSize(11);
    doc.text(`Totalt antal hundar: ${total}`, 14, finalY);
    doc.text(`Incheckade: ${totalIn}`, 14, finalY + 6);
    doc.text(`Planerade in: ${totalPlannedIn}`, 14, finalY + 12);
    doc.text(
      `Planerade ut (idag/imorgon): ${totalPlannedOut}`,
      14,
      finalY + 18
    );

    doc.save(`dagens-lista-${today.toISOString().slice(0, 10)}.pdf`);
  }

  function isToday(dateStr: string) {
    const date = new Date(dateStr);
    const today = new Date();
    return (
      date.getDate() === today.getDate() &&
      date.getMonth() === today.getMonth() &&
      date.getFullYear() === today.getFullYear()
    );
  }

  function isTomorrow(dateStr: string) {
    const date = new Date(dateStr);
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    return (
      date.getDate() === tomorrow.getDate() &&
      date.getMonth() === tomorrow.getMonth() &&
      date.getFullYear() === tomorrow.getFullYear()
    );
  }

  const filteredDogs = filterRoom
    ? dogs.filter((d) => d.rooms?.name === filterRoom)
    : dogs;

  return (
    <main>
      <Hero
        title="Dagens översikt"
        subtitle="Se alla hundar som är inne idag, planerade in- och utcheckningar, och skapa PDF-lista."
        image="https://images.unsplash.com/photo-1596495577886-d920f1fb7238?auto=format&fit=crop&w=1600&q=80"
      />

      <section className="max-w-6xl mx-auto my-10 px-6">
        <div className="bg-white rounded-2xl shadow p-8">
          {/* Rubrik + filter + PDF-knapp */}
          <div className="flex flex-wrap items-center justify-between mb-6 gap-4">
            <h2 className="text-2xl font-bold text-green-700">
              🐾 Hundar idag
            </h2>

            <div className="flex items-center gap-3">
              <select
                value={filterRoom}
                onChange={(e) => setFilterRoom(e.target.value)}
                className="border rounded px-3 py-2 text-sm"
              >
                <option value="">Alla rum</option>
                {rooms.map((r) => (
                  <option key={r.id} value={r.name}>
                    {r.name}
                  </option>
                ))}
              </select>

              <button
                onClick={exportPDF}
                className="bg-green-700 hover:bg-green-800 text-white px-4 py-2 rounded text-sm font-semibold"
              >
                Skriv ut PDF
              </button>
            </div>
          </div>

          {/* Tabell */}
          <div className="overflow-x-auto">
            <table className="min-w-full border-collapse text-sm">
              <thead className="bg-green-700 text-white">
                <tr>
                  <th className="py-3 px-4 text-left">Hund</th>
                  <th className="py-3 px-4 text-left">Rum</th>
                  <th className="py-3 px-4 text-left">Status</th>
                  <th className="py-3 px-4 text-left">Anteckning</th>
                  <th className="py-3 px-4 text-left">Nästa in/ut</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={5} className="text-center py-6 text-gray-500">
                      Hämtar hundar...
                    </td>
                  </tr>
                ) : filteredDogs.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="text-center py-6 text-gray-500">
                      Inga hundar hittades.
                    </td>
                  </tr>
                ) : (
                  filteredDogs.map((dog) => (
                    <tr
                      key={dog.id}
                      className={`${
                        dog.checked_in
                          ? "bg-green-50 hover:bg-green-100"
                          : dog.checkin_date && isToday(dog.checkin_date)
                          ? "bg-yellow-50 hover:bg-yellow-100"
                          : dog.checkout_date &&
                            (isToday(dog.checkout_date) ||
                              isTomorrow(dog.checkout_date))
                          ? "bg-blue-50 hover:bg-blue-100"
                          : "bg-gray-50 hover:bg-gray-100"
                      } transition`}
                    >
                      <td className="py-2 px-4 font-medium">{dog.name}</td>
                      <td className="py-2 px-4">
                        {dog.rooms?.name || "Ej tilldelad"}
                      </td>
                      <td className="py-2 px-4">
                        <button
                          onClick={() => toggleCheckIn(dog)}
                          className={`px-3 py-1 rounded text-sm font-semibold ${
                            dog.checked_in
                              ? "bg-green-600 text-white hover:bg-green-700"
                              : "bg-gray-300 text-gray-800 hover:bg-gray-400"
                          }`}
                        >
                          {dog.checked_in ? "Incheckad" : "Utcheckad"}
                        </button>
                      </td>
                      <td className="py-2 px-4">
                        <input
                          type="text"
                          defaultValue={dog.note || ""}
                          onBlur={(e) => updateNote(dog, e.target.value)}
                          placeholder="Anteckning..."
                          className="border rounded px-2 py-1 w-full text-sm"
                        />
                      </td>
                      <td className="py-2 px-4 text-gray-500">
                        {dog.checkout_date
                          ? new Date(dog.checkout_date).toLocaleDateString(
                              "sv-SE"
                            )
                          : dog.checkin_date
                          ? new Date(dog.checkin_date).toLocaleDateString(
                              "sv-SE"
                            )
                          : "-"}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </section>
    </main>
  );
}
