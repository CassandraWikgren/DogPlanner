"use client";

import React from "react";
import { useAuth } from "../context/AuthContext";
import Link from "next/link";

export default function AdminPage() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-gray-600">Laddar...</div>
      </div>
    );
  }

  // TODO: Lägg till rollkontroll här senare - endast admin ska se denna sida
  // if (user?.role !== 'admin') { ... }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-6 py-8">
          <h1 className="text-3xl font-bold text-gray-900">Administration</h1>
          <p className="text-gray-600 mt-2">
            Hantera ekonomi, priser, företagsinformation och användare
          </p>
        </div>
      </div>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-6 py-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Ekonomi & Fakturor */}
          <Link
            href="/ekonomi"
            className="bg-white rounded-xl p-6 shadow-sm hover:shadow-md transition-all border border-gray-200 hover:border-green-300"
          >
            <div className="flex items-start gap-4">
              <div className="text-4xl">💰</div>
              <div className="flex-1">
                <h2 className="text-lg font-bold text-gray-900 mb-2">
                  Ekonomi & Fakturor
                </h2>
                <p className="text-sm text-gray-600">
                  Hantera fakturor, betalningar och ekonomirapporter.
                </p>
              </div>
            </div>
          </Link>

          {/* Priser - Hunddagis */}
          <Link
            href="/admin/priser/dagis"
            className="bg-white rounded-xl p-6 shadow-sm hover:shadow-md transition-all border border-gray-200 hover:border-green-300"
          >
            <div className="flex items-start gap-4">
              <div className="text-4xl">🐕</div>
              <div className="flex-1">
                <h2 className="text-lg font-bold text-gray-900 mb-2">
                  Priser - Hunddagis
                </h2>
                <p className="text-sm text-gray-600">
                  Ändra priser för dagisabonnemang och enstaka dagar.
                </p>
              </div>
            </div>
          </Link>

          {/* Priser - Hundpensionat */}
          <Link
            href="/admin/priser/pensionat"
            className="bg-white rounded-xl p-6 shadow-sm hover:shadow-md transition-all border border-gray-200 hover:border-green-300"
          >
            <div className="flex items-start gap-4">
              <div className="text-4xl">🏨</div>
              <div className="flex-1">
                <h2 className="text-lg font-bold text-gray-900 mb-2">
                  Priser - Pensionat
                </h2>
                <p className="text-sm text-gray-600">
                  Ändra priser för pensionatsbokningar och tilläggstjänster.
                </p>
              </div>
            </div>
          </Link>

          {/* Priser - Hundfrisör */}
          <Link
            href="/admin/priser/frisor"
            className="bg-white rounded-xl p-6 shadow-sm hover:shadow-md transition-all border border-gray-200 hover:border-green-300"
          >
            <div className="flex items-start gap-4">
              <div className="text-4xl">✂️</div>
              <div className="flex-1">
                <h2 className="text-lg font-bold text-gray-900 mb-2">
                  Priser - Frisör
                </h2>
                <p className="text-sm text-gray-600">
                  Ändra priser för klippning, bad och pälsvård.
                </p>
              </div>
            </div>
          </Link>

          {/* Företagsinformation */}
          <Link
            href="/foretagsinformation"
            className="bg-white rounded-xl p-6 shadow-sm hover:shadow-md transition-all border border-gray-200 hover:border-green-300"
          >
            <div className="flex items-start gap-4">
              <div className="text-4xl">🏢</div>
              <div className="flex-1">
                <h2 className="text-lg font-bold text-gray-900 mb-2">
                  Företagsinformation
                </h2>
                <p className="text-sm text-gray-600">
                  Hantera företagsuppgifter, kontaktinfo och adress.
                </p>
              </div>
            </div>
          </Link>

          {/* Kunder & Hundägare */}
          <Link
            href="/owners"
            className="bg-white rounded-xl p-6 shadow-sm hover:shadow-md transition-all border border-gray-200 hover:border-green-300"
          >
            <div className="flex items-start gap-4">
              <div className="text-4xl">👥</div>
              <div className="flex-1">
                <h2 className="text-lg font-bold text-gray-900 mb-2">
                  Kunder & Hundägare
                </h2>
                <p className="text-sm text-gray-600">
                  Hantera kundregister och kontaktuppgifter.
                </p>
              </div>
            </div>
          </Link>

          {/* Rum-hantering */}
          <Link
            href="/rooms"
            className="bg-white rounded-xl p-6 shadow-sm hover:shadow-md transition-all border border-gray-200 hover:border-green-300"
          >
            <div className="flex items-start gap-4">
              <div className="text-4xl">🚪</div>
              <div className="flex-1">
                <h2 className="text-lg font-bold text-gray-900 mb-2">
                  Rum & Platser
                </h2>
                <p className="text-sm text-gray-600">
                  Hantera rum för dagis och pensionat.
                </p>
              </div>
            </div>
          </Link>

          {/* Användarhantering */}
          <Link
            href="/admin/users"
            className="bg-white rounded-xl p-6 shadow-sm hover:shadow-md transition-all border border-gray-200 hover:border-green-300"
          >
            <div className="flex items-start gap-4">
              <div className="text-4xl">🔐</div>
              <div className="flex-1">
                <h2 className="text-lg font-bold text-gray-900 mb-2">
                  Användarhantering
                </h2>
                <p className="text-sm text-gray-600">
                  Skapa inlogg för kollegor och hantera behörigheter.
                </p>
              </div>
            </div>
          </Link>

          {/* Abonnemang DogPlanner */}
          <Link
            href="/subscription"
            className="bg-white rounded-xl p-6 shadow-sm hover:shadow-md transition-all border border-gray-200 hover:border-green-300"
          >
            <div className="flex items-start gap-4">
              <div className="text-4xl">💳</div>
              <div className="flex-1">
                <h2 className="text-lg font-bold text-gray-900 mb-2">
                  Ditt Abonnemang
                </h2>
                <p className="text-sm text-gray-600">
                  Hantera ditt DogPlanner-abonnemang och betalning.
                </p>
              </div>
            </div>
          </Link>
        </div>
      </main>
    </div>
  );
}
