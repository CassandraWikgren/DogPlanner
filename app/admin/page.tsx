"use client";

import React from "react";
import { useAuth } from "../context/AuthContext";
import Link from "next/link";
import DashboardWidgets from "@/components/DashboardWidgets";

export default function AdminPage() {
  const { currentOrgId } = useAuth();

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header med titel */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-[1600px] mx-auto px-6 py-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Administration
          </h1>
          <p className="text-base text-gray-600">
            Hantera ekonomi, priser, företagsinformation och användare
          </p>
        </div>
      </div>

      {/* Main Content */}
      <main className="max-w-[1600px] mx-auto px-6 py-10">
        {/* Statistik-sektion */}
        {currentOrgId && (
          <div className="mb-10">
            <div className="flex items-center gap-2 mb-6">
              <div className="w-1 h-6 bg-[#2c7a4c] rounded-full"></div>
              <h2 className="text-xl font-semibold text-gray-900">Översikt</h2>
            </div>
            <DashboardWidgets />
          </div>
        )}

        {/* Åtgärder */}
        <div>
          <div className="flex items-center gap-2 mb-6">
            <div className="w-1 h-6 bg-[#2c7a4c] rounded-full"></div>
            <h2 className="text-xl font-semibold text-gray-900">Hantera</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {/* Ekonomi & Fakturor */}
            <Link
              href="/ekonomi"
              className="group bg-white rounded-lg p-6 shadow-sm hover:shadow-md transition-all border border-gray-200 hover:border-[#2c7a4c]"
            >
              <div className="flex items-center gap-4 mb-3">
                <div className="text-3xl">💰</div>
                <h3 className="text-lg font-semibold text-gray-900 group-hover:text-[#2c7a4c] transition-colors">
                  Ekonomi & Fakturor
                </h3>
              </div>
              <p className="text-sm text-gray-600 leading-relaxed">
                Hantera fakturor, betalningar och ekonomirapporter.
              </p>
            </Link>

            {/* Priser - Hunddagis */}
            <Link
              href="/admin/priser/dagis"
              className="group bg-white rounded-lg p-6 shadow-sm hover:shadow-md transition-all border border-gray-200 hover:border-[#2c7a4c]"
            >
              <div className="flex items-center gap-4 mb-3">
                <div className="text-3xl">🐕</div>
                <h3 className="text-lg font-semibold text-gray-900 group-hover:text-[#2c7a4c] transition-colors">
                  Priser - Hunddagis
                </h3>
              </div>
              <p className="text-sm text-gray-600 leading-relaxed">
                Ändra priser för dagisabonnemang och enstaka dagar.
              </p>
            </Link>

            {/* Priser - Hundpensionat */}
            <Link
              href="/admin/priser/pensionat"
              className="group bg-white rounded-lg p-6 shadow-sm hover:shadow-md transition-all border border-gray-200 hover:border-[#2c7a4c]"
            >
              <div className="flex items-center gap-4 mb-3">
                <div className="text-3xl">🏨</div>
                <h3 className="text-lg font-semibold text-gray-900 group-hover:text-[#2c7a4c] transition-colors">
                  Priser - Pensionat
                </h3>
              </div>
              <p className="text-sm text-gray-600 leading-relaxed">
                Ändra priser för pensionatsbokningar och tilläggstjänster.
              </p>
            </Link>

            {/* Priser - Hundfrisör */}
            <Link
              href="/admin/priser/frisor"
              className="group bg-white rounded-lg p-6 shadow-sm hover:shadow-md transition-all border border-gray-200 hover:border-[#2c7a4c]"
            >
              <div className="flex items-center gap-4 mb-3">
                <div className="text-3xl">✂️</div>
                <h3 className="text-lg font-semibold text-gray-900 group-hover:text-[#2c7a4c] transition-colors">
                  Priser - Frisör
                </h3>
              </div>
              <p className="text-sm text-gray-600 leading-relaxed">
                Ändra priser för klippning, bad och pälsvård.
              </p>
            </Link>

            {/* Företagsinformation */}
            <Link
              href="/foretagsinformation"
              className="group bg-white rounded-lg p-6 shadow-sm hover:shadow-md transition-all border border-gray-200 hover:border-[#2c7a4c]"
            >
              <div className="flex items-center gap-4 mb-3">
                <div className="text-3xl">🏢</div>
                <h3 className="text-lg font-semibold text-gray-900 group-hover:text-[#2c7a4c] transition-colors">
                  Företagsinformation
                </h3>
              </div>
              <p className="text-sm text-gray-600 leading-relaxed">
                Hantera företagsuppgifter, kontaktinfo och adress.
              </p>
            </Link>

            {/* Kunder & Hundägare */}
            <Link
              href="/owners"
              className="group bg-white rounded-lg p-6 shadow-sm hover:shadow-md transition-all border border-gray-200 hover:border-[#2c7a4c]"
            >
              <div className="flex items-center gap-4 mb-3">
                <div className="text-3xl">👥</div>
                <h3 className="text-lg font-semibold text-gray-900 group-hover:text-[#2c7a4c] transition-colors">
                  Kunder & Hundägare
                </h3>
              </div>
              <p className="text-sm text-gray-600 leading-relaxed">
                Hantera kundregister och kontaktuppgifter.
              </p>
            </Link>

            {/* Rum-hantering */}
            <Link
              href="/admin/rum"
              className="group bg-white rounded-lg p-6 shadow-sm hover:shadow-md transition-all border border-gray-200 hover:border-[#2c7a4c]"
            >
              <div className="flex items-center gap-4 mb-3">
                <div className="text-3xl">🚪</div>
                <h3 className="text-lg font-semibold text-gray-900 group-hover:text-[#2c7a4c] transition-colors">
                  Rum & Platser
                </h3>
              </div>
              <p className="text-sm text-gray-600 leading-relaxed">
                Hantera rum för dagis och pensionat.
              </p>
            </Link>

            {/* Användarhantering */}
            <Link
              href="/admin/users"
              className="group bg-white rounded-lg p-6 shadow-sm hover:shadow-md transition-all border border-gray-200 hover:border-[#2c7a4c]"
            >
              <div className="flex items-center gap-4 mb-3">
                <div className="text-3xl">🔐</div>
                <h3 className="text-lg font-semibold text-gray-900 group-hover:text-[#2c7a4c] transition-colors">
                  Användarhantering
                </h3>
              </div>
              <p className="text-sm text-gray-600 leading-relaxed">
                Skapa inlogg för kollegor och hantera behörigheter.
              </p>
            </Link>

            {/* Abonnemang DogPlanner */}
            <Link
              href="/subscription"
              className="group bg-white rounded-lg p-6 shadow-sm hover:shadow-md transition-all border border-gray-200 hover:border-[#2c7a4c]"
            >
              <div className="flex items-center gap-4 mb-3">
                <div className="text-3xl">💳</div>
                <h3 className="text-lg font-semibold text-gray-900 group-hover:text-[#2c7a4c] transition-colors">
                  Ditt Abonnemang
                </h3>
              </div>
              <p className="text-sm text-gray-600 leading-relaxed">
                Hantera ditt DogPlanner-abonnemang och betalning.
              </p>
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}
