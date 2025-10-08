// app/page.tsx
"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

export default function HomePage() {
  const [loading, setLoading] = useState(true);

  // Simulerar laddning för att visa exempel (kan tas bort)
  useEffect(() => {
    const timer = setTimeout(() => setLoading(false), 500);
    return () => clearTimeout(timer);
  }, []);

  if (loading) {
    return (
      <main className="flex flex-col items-center justify-center h-screen text-gray-700">
        <h1 className="text-2xl font-semibold mb-4">Laddar DogPlanner...</h1>
        <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
      </main>
    );
  }

  return (
    <main className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-b from-blue-50 to-white text-gray-800">
      <h1 className="text-4xl font-bold mb-6">🐾 Välkommen till DogPlanner</h1>
      <p className="text-lg mb-10 max-w-md text-center">
        Hantera ditt hunddagis, pensionat och kunder på ett enkelt och smidigt
        sätt.
      </p>

      <div className="flex gap-4">
        <Link
          href="/hunddagis"
          className="px-5 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition"
        >
          Gå till Hunddagis
        </Link>

        <Link
          href="/hundpensionat"
          className="px-5 py-3 bg-green-600 text-white rounded-xl hover:bg-green-700 transition"
        >
          Gå till Hundpensionat
        </Link>
      </div>

      <footer className="mt-16 text-sm text-gray-500">
        © {new Date().getFullYear()} DogPlanner – alla rättigheter förbehållna
      </footer>
    </main>
  );
}
