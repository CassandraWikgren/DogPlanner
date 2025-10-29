"use client";

import { useState } from "react";
import { useAuth } from "@/app/context/AuthContext";

export default function SubscriptionPage() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);

  // 🧠 Klick-funktion för att starta betalning
  async function startCheckout(plan: "basic" | "dual" | "full") {
    if (!user) {
      alert("Du måste vara inloggad för att kunna köpa ett abonnemang.");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/subscription/checkout", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${user.access_token}`,
        },
        body: JSON.stringify({ plan }),
      });

      const data = await res.json();
      if (data.url) {
        window.location.href = data.url; // 🔁 Skickar användaren till Stripe Checkout
      } else {
        alert(data.error || "Något gick fel.");
      }
    } catch (err) {
      console.error(err);
      alert("Kunde inte starta betalningen.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex flex-col items-center gap-6 mt-10">
      <h1 className="text-2xl font-bold">Välj ditt abonnemang</h1>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* 99 kr */}
        <div className="border p-6 rounded-xl shadow text-center">
          <h2 className="font-semibold text-lg mb-2">
            Hunddagis / Frisör / Pensionat
          </h2>
          <p className="text-gray-600 mb-4">Tillgång till en sektion</p>
          <p className="text-xl font-bold mb-4">99 kr/mån</p>
          <button
            onClick={() => startCheckout("basic")}
            disabled={loading}
            className="bg-indigo-600 text-white py-2 px-4 rounded hover:bg-indigo-700"
          >
            {loading ? "Laddar..." : "Välj"}
          </button>
        </div>

        {/* 199 kr */}
        <div className="border p-6 rounded-xl shadow text-center">
          <h2 className="font-semibold text-lg mb-2">Två sektioner</h2>
          <p className="text-gray-600 mb-4">T.ex. Hunddagis + Pensionat</p>
          <p className="text-xl font-bold mb-4">199 kr/mån</p>
          <button
            onClick={() => startCheckout("dual")}
            disabled={loading}
            className="bg-indigo-600 text-white py-2 px-4 rounded hover:bg-indigo-700"
          >
            {loading ? "Laddar..." : "Välj"}
          </button>
        </div>

        {/* 299 kr */}
        <div className="border p-6 rounded-xl shadow text-center">
          <h2 className="font-semibold text-lg mb-2">Allt i ett</h2>
          <p className="text-gray-600 mb-4">Hunddagis + Frisör + Pensionat</p>
          <p className="text-xl font-bold mb-4">299 kr/mån</p>
          <button
            onClick={() => startCheckout("full")}
            disabled={loading}
            className="bg-indigo-600 text-white py-2 px-4 rounded hover:bg-indigo-700"
          >
            {loading ? "Laddar..." : "Välj"}
          </button>
        </div>
      </div>
    </div>
  );
}
