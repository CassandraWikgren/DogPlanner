"use client";

import React from "react";
import { useAuth } from "../context/AuthContext";
import Link from "next/link";

export default function Dashboard() {
  const { user, loading: authLoading } = useAuth();

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto mb-4"></div>
          <p className="text-gray-600">Laddar dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-white">
      {/* Hero Section - ingen gap */}
      <section
        className="relative text-center text-white overflow-hidden"
        style={{
          paddingTop: "100px",
          paddingBottom: "100px",
          background:
            'linear-gradient(rgba(44, 122, 76, 0.7), rgba(44, 122, 76, 0.7)), url("/Hero.jpeg")',
          backgroundSize: "cover",
          backgroundPosition: "center 35%",
        }}
      >
        <div className="relative z-10 max-w-4xl mx-auto px-6">
          <h1 className="text-5xl font-extrabold mb-4 drop-shadow-lg">
            Välkommen till ditt Dashboard
          </h1>
          <p className="text-xl mb-8 leading-relaxed font-normal max-w-2xl mx-auto drop-shadow-md">
            Här får du snabb tillgång till dina hundar, abonnemang och fakturor.
          </p>
        </div>
      </section>

      {/* Main Content */}
      <main className="max-w-6xl mx-auto px-6 py-12">
        {/* Feature Cards Grid - 4 huvudflikar (TVINGAD DESKTOP-LAYOUT) */}
        <div
          className="grid gap-4"
          style={{
            gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
            display: "grid",
          }}
        >
          {/* Hunddagis */}
          <Link
            href="/hunddagis"
            className="group bg-white rounded-xl p-6 shadow-sm hover:shadow-md transition-all duration-300 border border-gray-200 hover:border-green-300"
          >
            <div className="text-4xl mb-3">🐕</div>
            <h2 className="text-lg font-bold text-[#2c7a4c] mb-2">Hunddagis</h2>
            <p className="text-gray-600 text-xs leading-relaxed">
              Hantera dagishundar, schema och daglig verksamhet.
            </p>
          </Link>

          {/* Hundpensionat */}
          <Link
            href="/hundpensionat"
            className="group bg-white rounded-xl p-6 shadow-sm hover:shadow-md transition-all duration-300 border border-gray-200 hover:border-green-300"
          >
            <div className="text-4xl mb-3">🏨</div>
            <h2 className="text-lg font-bold text-[#2c7a4c] mb-2">
              Hundpensionat
            </h2>
            <p className="text-gray-600 text-xs leading-relaxed">
              Hantera pensionshundar, bokningar och in-/utcheckning.
            </p>
          </Link>

          {/* Hundfrisör */}
          <Link
            href="/frisor"
            className="group bg-white rounded-xl p-6 shadow-sm hover:shadow-md transition-all duration-300 border border-gray-200 hover:border-green-300"
          >
            <div className="text-4xl mb-3">✂️</div>
            <h2 className="text-lg font-bold text-[#2c7a4c] mb-2">
              Hundfrisör
            </h2>
            <p className="text-gray-600 text-xs leading-relaxed">
              Hantera bokningar och behandlingar för hundtrimning.
            </p>
          </Link>

          {/* Admin */}
          <Link
            href="/admin"
            className="group bg-white rounded-xl p-6 shadow-sm hover:shadow-md transition-all duration-300 border border-gray-200 hover:border-green-300"
          >
            <div className="text-4xl mb-3">⚙️</div>
            <h2 className="text-lg font-bold text-[#2c7a4c] mb-2">Admin</h2>
            <p className="text-gray-600 text-xs leading-relaxed">
              Ekonomi, priser, företagsinformation och användarhantering.
            </p>
          </Link>
        </div>
      </main>
    </div>
  );
}
