"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import Hero from "../components/Hero";

export default function FakturorPage() {
  const [month, setMonth] = useState(() =>
    new Date().toISOString().slice(0, 7)
  );
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  useEffect(() => {
    fetchInvoiceData();
  }, []);

  async function fetchInvoiceData() {
    setLoading(true);
    const { data, error } = await supabase
      .from("invoices")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Fel vid hämtning:", error.message);
      setErrorMsg("Kunde inte hämta fakturaunderlag.");
    } else {
      setData(data || []);
      setErrorMsg("");
    }
    setLoading(false);
  }

  async function generateUnderlag() {
    setLoading(true);
    setErrorMsg("");

    const { data: dogs, error } = await supabase.from("dogs").select("*");

    if (error) {
      console.error("Fel vid hämtning av hundar:", error.message);
      setErrorMsg("Kunde inte hämta hundar.");
      setLoading(false);
      return;
    }

    const summary = dogs.map((d: any) => ({
      user_id: d.user_id,
      dog_id: d.id,
      dog_name: d.name,
      owner_name: `${d.owner_firstname ?? ""} ${d.owner_lastname ?? ""}`.trim(),
      month,
      subscription: d.subscription ?? "Okänt",
      addons: d.addons ?? {},
      total: calcTotal(d),
      status: "draft",
    }));

    const { error: insertError } = await supabase
      .from("invoices")
      .insert(summary);

    if (insertError) {
      console.error("Fel vid sparande:", insertError.message);
      setErrorMsg("Kunde inte spara fakturaunderlag.");
    } else {
      await fetchInvoiceData();
    }
    setLoading(false);
  }

  function calcTotal(dog: any) {
    const base = dog.subscription?.toLowerCase().includes("heltid")
      ? 5400
      : 3200;
    const addons = Object.values(dog.addons || {}).reduce(
      (sum: number, val: any) => sum + Number(val),
      0
    );
    return base + addons;
  }

  // 📄 PDF-export
  function exportPDF() {
    if (!data.length) return alert("Inget underlag att exportera ännu.");

    const doc = new jsPDF();
    doc.text(`Fakturaunderlag ${month}`, 14, 18);

    autoTable(doc, {
      startY: 24,
      head: [["Hund", "Ägare", "Abonnemang", "Tillägg", "Summa"]],
      body: data.map((r) => [
        r.dog_name || "-",
        r.owner_name || "-",
        r.subscription || "-",
        Object.keys(r.addons || {}).join(", ") || "-",
        `${r.total ?? 0} kr`,
      ]),
    });

    doc.save(`fakturaunderlag-${month}.pdf`);
  }

  // 📊 Standard CSV
  function exportCSV(headers: string[], rows: string[][], filename: string) {
    const csvContent =
      "data:text/csv;charset=utf-8," +
      [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  // 💼 Fortnox-format
  function exportFortnox() {
    if (!data.length) return alert("Inget underlag att exportera ännu.");

    const headers = ["Kundnamn", "Artikel", "Antal", "Pris exkl. moms"];
    const rows = data.map((r) => [
      r.owner_name || "-",
      `Hunddagis: ${r.dog_name}`,
      "1",
      r.total?.toString() ?? "0",
    ]);

    exportCSV(headers, rows, `fortnox-fakturaunderlag-${month}.csv`);
  }

  // 📘 Visma-format
  function exportVisma() {
    if (!data.length) return alert("Inget underlag att exportera ännu.");

    const headers = ["Kund", "Fakturatext", "Artikelnummer", "Belopp", "Datum"];
    const rows = data.map((r) => [
      r.owner_name || "-",
      `Dagis ${r.dog_name} - ${r.subscription}`,
      "DP-001",
      r.total?.toString() ?? "0",
      new Date().toLocaleDateString("sv-SE"),
    ]);

    exportCSV(headers, rows, `visma-fakturaunderlag-${month}.csv`);
  }

  // 💜 Bokio-format
  function exportBokio() {
    if (!data.length) return alert("Inget underlag att exportera ännu.");

    const headers = ["Datum", "Kund", "Beskrivning", "Belopp (SEK)", "Betald"];
    const rows = data.map((r) => [
      new Date().toLocaleDateString("sv-SE"),
      r.owner_name || "-",
      `Hund: ${r.dog_name} (${r.subscription})`,
      r.total?.toString() ?? "0",
      "Nej",
    ]);

    exportCSV(headers, rows, `bokio-fakturaunderlag-${month}.csv`);
  }

  return (
    <main>
      <Hero
        title="Sammanställning av fakturor"
        subtitle="Här kan du skapa fakturaunderlag för vald månad. Exportera till PDF, Fortnox, Visma eller Bokio-format."
        image="https://images.unsplash.com/photo-1601979039862-4c707e2d1c1c?auto=format&fit=crop&w=1600&q=80"
      />

      <section className="max-w-6xl mx-auto my-16 px-6">
        <div className="bg-white rounded-2xl shadow-lg p-8">
          <h2 className="text-2xl font-bold text-green-700 mb-6">
            📑 Fakturaunderlag
          </h2>

          {/* ⚙️ Kontrollpanel */}
          <div className="flex flex-wrap items-center gap-4 mb-6">
            <input
              type="month"
              value={month}
              onChange={(e) => setMonth(e.target.value)}
              className="border rounded px-3 py-2"
            />
            <button
              onClick={generateUnderlag}
              disabled={loading}
              className="bg-green-700 hover:bg-green-800 text-white font-semibold px-4 py-2 rounded"
            >
              {loading ? "Skapar..." : "Skapa underlag"}
            </button>
            <button
              onClick={exportPDF}
              className="bg-gray-200 hover:bg-gray-300 text-gray-800 font-semibold px-4 py-2 rounded"
            >
              Exportera PDF
            </button>

            {/* Nya exportknappar */}
            <button
              onClick={exportFortnox}
              className="bg-yellow-100 hover:bg-yellow-200 text-yellow-900 font-semibold px-4 py-2 rounded"
            >
              Fortnox CSV
            </button>
            <button
              onClick={exportVisma}
              className="bg-blue-100 hover:bg-blue-200 text-blue-800 font-semibold px-4 py-2 rounded"
            >
              Visma CSV
            </button>
            <button
              onClick={exportBokio}
              className="bg-purple-100 hover:bg-purple-200 text-purple-800 font-semibold px-4 py-2 rounded"
            >
              Bokio CSV
            </button>
          </div>

          {errorMsg && (
            <p className="text-red-600 bg-red-50 border border-red-200 rounded p-3 mb-4">
              {errorMsg}
            </p>
          )}

          {/* 🔹 Tabell */}
          <div className="overflow-x-auto">
            <table className="min-w-full border-collapse text-sm">
              <thead className="bg-green-700 text-white">
                <tr>
                  <th className="py-3 px-4 text-left">Hund</th>
                  <th className="py-3 px-4 text-left">Ägare</th>
                  <th className="py-3 px-4 text-left">Abonnemang</th>
                  <th className="py-3 px-4 text-left">Tillägg</th>
                  <th className="py-3 px-4 text-left">Summa</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={5} className="py-6 text-center text-gray-500">
                      Hämtar data...
                    </td>
                  </tr>
                ) : data.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-6 text-center text-gray-500">
                      Inga fakturaunderlag hittades.
                    </td>
                  </tr>
                ) : (
                  data.map((r) => (
                    <tr
                      key={r.id}
                      className="odd:bg-gray-50 even:bg-gray-100 hover:bg-green-50"
                    >
                      <td className="py-2 px-4">{r.dog_name || "-"}</td>
                      <td className="py-2 px-4">{r.owner_name || "-"}</td>
                      <td className="py-2 px-4">{r.subscription || "-"}</td>
                      <td className="py-2 px-4">
                        {Object.keys(r.addons || {}).join(", ") || "–"}
                      </td>
                      <td className="py-2 px-4">{r.total ?? 0} kr</td>
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
