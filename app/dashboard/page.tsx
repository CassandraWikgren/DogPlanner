"use client";

import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import Link from "next/link";

export default function DashboardPage() {
  const { user } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!user) router.push("/login");
  }, [user, router]);

  // Visa en laddningsskärm medan auth kollas
  if (!user)
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 text-gray-700">
        <p>Laddar...</p>
      </div>
    );

  return (
    <main>
      {/* Hero */}
      <section
        className="relative text-center text-white py-24 px-6"
        style={{
          background:
            "linear-gradient(rgba(44, 122, 76, 0.75), rgba(44, 122, 76, 0.75)), url('https://images.unsplash.com/photo-1558788353-f76d92427f16?auto=format&fit=crop&w=1600&q=80') center/cover no-repeat",
        }}
      >
        <h1 className="text-4xl md:text-5xl font-extrabold mb-4">
          Välkommen till DogPlanner
        </h1>
        <p className="text-lg md:text-xl max-w-2xl mx-auto opacity-95">
          Välj en funktion nedan för att komma igång med ditt hunddagis eller
          pensionat.
        </p>
      </section>

      {/* Cards */}
      <section className="max-w-6xl mx-auto my-16 px-6 grid gap-10 md:grid-cols-3">
        {/* Hunddagis */}
        <div className="bg-white rounded-2xl shadow-lg p-8 flex flex-col items-center text-center hover:shadow-2xl hover:-translate-y-1 transition">
          <h2 className="text-2xl font-bold text-green-700 mb-3">
            🐾 Hunddagis
          </h2>
          <p className="text-gray-600 flex-grow">
            Hantera dina dagishundar, se fakturor, priser och hundrum.
          </p>
          <Link
            href="/hunddagis"
            className="mt-6 bg-green-600 hover:bg-green-700 text-white px-5 py-2.5 rounded-md font-semibold shadow"
          >
            Mina dagishundar
          </Link>
        </div>

        {/* Hundpensionat */}
        <div className="bg-white rounded-2xl shadow-lg p-8 flex flex-col items-center text-center hover:shadow-2xl hover:-translate-y-1 transition">
          <h2 className="text-2xl font-bold text-green-700 mb-3">
            🏠 Hundpensionat
          </h2>
          <p className="text-gray-600 flex-grow">
            Se och hantera pensionathundar, journaler och bokningar.
          </p>
          <Link
            href="/hundpensionat"
            className="mt-6 bg-green-600 hover:bg-green-700 text-white px-5 py-2.5 rounded-md font-semibold shadow"
          >
            Mina pensionathundar
          </Link>
        </div>

        {/* Företagsinformation */}
        <div className="bg-white rounded-2xl shadow-lg p-8 flex flex-col items-center text-center hover:shadow-2xl hover:-translate-y-1 transition">
          <h2 className="text-2xl font-bold text-green-700 mb-3">
            📂 Företagsinformation
          </h2>
          <p className="text-gray-600 flex-grow">
            Hantera abonnemang, villkor och fakturor.
          </p>
          <Link
            href="/foretagsinformation"
            className="mt-6 bg-green-600 hover:bg-green-700 text-white px-5 py-2.5 rounded-md font-semibold shadow"
          >
            Företagssida
          </Link>
        </div>
      </section>
    </main>
  );
}
