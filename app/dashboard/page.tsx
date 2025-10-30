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
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-white pt-16">
      {/* Hero Section - ingen gap */}
      <section
        className="relative text-center text-white overflow-hidden"
        style={{
          padding: "60px 20px 80px",
          background:
            'linear-gradient(rgba(44, 122, 76, 0.95), rgba(44, 122, 76, 0.95)), url("/Hero.jpeg") center/cover no-repeat',
        }}
      >
        <div className="relative z-10 max-w-4xl mx-auto">
          <h1 className="text-5xl font-bold mb-4 drop-shadow-lg">
            Välkommen till ditt Dashboard
          </h1>
          <p className="text-xl mb-8 leading-relaxed opacity-100 max-w-2xl mx-auto drop-shadow-md">
            Här får du snabb tillgång till dina hundar, abonnemang och fakturor.
          </p>
        </div>
      </section>

      {/* Main Content */}
      <main className="max-w-6xl mx-auto px-6 py-12">
        {/* Feature Cards Grid - 4 huvudflikar (mer kompakta) */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
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
