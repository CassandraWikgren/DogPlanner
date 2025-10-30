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
      {/* Hero Section */}
      <section
        className="relative text-center text-white overflow-hidden"
        style={{
          padding: "80px 20px 100px",
          background:
            'linear-gradient(rgba(44, 122, 76, 0.88), rgba(44, 122, 76, 0.88)), url("/Hero.jpeg") center/cover no-repeat',
        }}
      >
        <div className="relative z-10 max-w-4xl mx-auto">
          <h1 className="text-5xl font-bold mb-4">
            Välkommen till ditt Dashboard
          </h1>
          <p className="text-xl mb-8 leading-relaxed opacity-95 max-w-2xl mx-auto">
            Här får du snabb tillgång till dina hundar, abonnemang och fakturor.
          </p>
        </div>
      </section>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-6 -mt-12 pb-16">
        {/* Feature Cards Grid - 4 huvudflikar */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Hunddagis */}
          <Link
            href="/hunddagis"
            className="group bg-white rounded-2xl p-8 shadow-md hover:shadow-xl transition-all duration-300 border border-gray-100 hover:border-green-200 hover:-translate-y-1"
          >
            <div className="text-5xl mb-4">🐕</div>
            <h2 className="text-xl font-bold text-[#2c7a4c] mb-3">Hunddagis</h2>
            <p className="text-gray-600 text-sm leading-relaxed mb-4">
              Hantera dagishundar, schema och daglig verksamhet.
            </p>
          </Link>

          {/* Hundpensionat */}
          <Link
            href="/hundpensionat"
            className="group bg-white rounded-2xl p-8 shadow-md hover:shadow-xl transition-all duration-300 border border-gray-100 hover:border-green-200 hover:-translate-y-1"
          >
            <div className="text-5xl mb-4">🏨</div>
            <h2 className="text-xl font-bold text-[#2c7a4c] mb-3">
              Hundpensionat
            </h2>
            <p className="text-gray-600 text-sm leading-relaxed mb-4">
              Hantera pensionshundar, bokningar och in-/utcheckning.
            </p>
          </Link>

          {/* Hundfrisör */}
          <Link
            href="/frisor"
            className="group bg-white rounded-2xl p-8 shadow-md hover:shadow-xl transition-all duration-300 border border-gray-100 hover:border-green-200 hover:-translate-y-1"
          >
            <div className="text-5xl mb-4">✂️</div>
            <h2 className="text-xl font-bold text-[#2c7a4c] mb-3">
              Hundfrisör
            </h2>
            <p className="text-gray-600 text-sm leading-relaxed mb-4">
              Hantera bokningar och behandlingar för hundtrimning.
            </p>
          </Link>

          {/* Admin */}
          <Link
            href="/admin"
            className="group bg-white rounded-2xl p-8 shadow-md hover:shadow-xl transition-all duration-300 border border-gray-100 hover:border-green-200 hover:-translate-y-1"
          >
            <div className="text-5xl mb-4">⚙️</div>
            <h2 className="text-xl font-bold text-[#2c7a4c] mb-3">Admin</h2>
            <p className="text-gray-600 text-sm leading-relaxed mb-4">
              Ekonomi, priser, företagsinformation och användarhantering.
            </p>
          </Link>
        </div>
      </main>
    </div>
  );
}
