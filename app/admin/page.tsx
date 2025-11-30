"use client";

import React from "react";
import { useAuth } from "../context/AuthContext";
import Link from "next/link";
import DashboardWidgets from "@/components/DashboardWidgets";
import { ServiceGuard } from "@/components/ServiceGuard";

export default function AdminPage() {
  const { currentOrgId } = useAuth();

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header med titel och statistik - EXAKT som Hunddagis */}
      <div className="border-b border-gray-200 bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <h1 className="text-[32px] font-bold text-[#2c7a4c] leading-tight">
                Administration
              </h1>
              <p className="mt-1 text-base text-gray-600">
                Hantera ekonomi, priser, företagsinformation och användare
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content Area - EXAKT som Hunddagis: max-w-7xl mx-auto px-6 py-6 */}
      <div className="max-w-7xl mx-auto px-6 py-6">
        {/* Statistik-sektion */}
        {currentOrgId && (
          <div className="mb-8">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-1 h-6 bg-[#2c7a4c] rounded-full"></div>
              <h2 className="text-xl font-bold text-[#333333]">Översikt</h2>
            </div>
            <DashboardWidgets />
          </div>
        )}

        {/* Åtgärder - Grid enligt stilguide */}
        <div>
          <div className="flex items-center gap-2 mb-4">
            <div className="w-1 h-6 bg-[#2c7a4c] rounded-full"></div>
            <h2 className="text-xl font-bold text-[#333333]">Hantera</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Tjänsteinställningar - NY! Högst prioritet */}
            <Link href="/admin/tjanster">
              <div className="bg-gradient-to-br from-[#2c7a4c] to-[#236139] rounded-lg p-6 shadow-md h-full hover:shadow-xl transition-all group text-white">
                <div className="flex items-center gap-3 mb-3">
                  <div className="text-3xl">⚙️</div>
                  <h3 className="text-lg font-semibold group-hover:underline">
                    Tjänsteinställningar
                  </h3>
                </div>
                <p className="text-sm text-white/90 leading-relaxed">
                  Aktivera/deaktivera Dagis, Pensionat och Frisör för ditt
                  företag.
                </p>
              </div>
            </Link>

            {/* Rapporter */}
            <Link href="/admin/rapporter">
              <div className="bg-white rounded-lg p-6 border border-gray-200 shadow-sm h-full hover:border-[#2c7a4c] transition-all group">
                <div className="flex items-center gap-3 mb-3">
                  <div className="text-3xl">📊</div>
                  <h3 className="text-lg font-semibold text-[#2c7a4c] group-hover:text-[#236139]">
                    Rapporter & Statistik
                  </h3>
                </div>
                <p className="text-sm text-gray-600 leading-relaxed">
                  Intäkter, beläggning och bokningsstatistik. Exportera till
                  Excel.
                </p>
              </div>
            </Link>

            {/* Ekonomi & Fakturor */}
            <Link href="/ekonomi">
              <div className="bg-white rounded-lg p-6 border border-gray-200 shadow-sm h-full hover:border-[#2c7a4c] transition-all group">
                <div className="flex items-center gap-3 mb-3">
                  <div className="text-3xl">💰</div>
                  <h3 className="text-lg font-semibold text-[#2c7a4c] group-hover:text-[#236139]">
                    Ekonomi & Fakturor
                  </h3>
                </div>
                <p className="text-sm text-gray-600 leading-relaxed">
                  Hantera fakturor, betalningar och ekonomirapporter.
                </p>
              </div>
            </Link>

            {/* Priser - Hunddagis */}
            <ServiceGuard service="daycare">
              <Link href="/admin/priser/dagis">
                <div className="bg-white rounded-lg p-6 border border-gray-200 shadow-sm h-full hover:border-[#2c7a4c] transition-all group">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="text-3xl">🐕</div>
                    <h3 className="text-lg font-semibold text-[#2c7a4c] group-hover:text-[#236139]">
                      Priser - Hunddagis
                    </h3>
                  </div>
                  <p className="text-sm text-gray-600 leading-relaxed">
                    Ändra priser för dagisabonnemang och enstaka dagar.
                  </p>
                </div>
              </Link>
            </ServiceGuard>

            {/* Priser - Hundpensionat */}
            <ServiceGuard service="boarding">
              <Link href="/admin/priser/pensionat">
                <div className="bg-white rounded-lg p-6 border border-gray-200 shadow-sm h-full hover:border-[#2c7a4c] transition-all group">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="text-3xl">🏨</div>
                    <h3 className="text-lg font-semibold text-[#2c7a4c] group-hover:text-[#236139]">
                      Priser - Pensionat
                    </h3>
                  </div>
                  <p className="text-sm text-gray-600 leading-relaxed">
                    Ändra priser för pensionatsbokningar och tilläggstjänster.
                  </p>
                </div>
              </Link>
            </ServiceGuard>

            {/* Priser - Hundfrisör */}
            <ServiceGuard service="grooming">
              <Link href="/admin/hundfrisor/priser">
                <div className="bg-white rounded-lg p-6 border border-gray-200 shadow-sm h-full hover:border-[#2c7a4c] transition-all group">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="text-3xl">✂️</div>
                    <h3 className="text-lg font-semibold text-[#2c7a4c] group-hover:text-[#236139]">
                      Priser - Frisör
                    </h3>
                  </div>
                  <p className="text-sm text-gray-600 leading-relaxed">
                    Ändra priser för klippning, bad och pälsvård.
                  </p>
                </div>
              </Link>
            </ServiceGuard>

            {/* Företagsinformation */}
            <Link href="/foretagsinformation">
              <div className="bg-white rounded-lg p-6 border border-gray-200 shadow-sm h-full hover:border-[#2c7a4c] transition-all group">
                <div className="flex items-center gap-3 mb-3">
                  <div className="text-3xl">🏢</div>
                  <h3 className="text-lg font-semibold text-[#2c7a4c] group-hover:text-[#236139]">
                    Företagsinformation
                  </h3>
                </div>
                <p className="text-sm text-gray-600 leading-relaxed">
                  Hantera företagsuppgifter, kontaktinfo och adress.
                </p>
              </div>
            </Link>

            {/* Kunder & Hundägare */}
            <Link href="/owners">
              <div className="bg-white rounded-lg p-6 border border-gray-200 shadow-sm h-full hover:border-[#2c7a4c] transition-all group">
                <div className="flex items-center gap-3 mb-3">
                  <div className="text-3xl">👥</div>
                  <h3 className="text-lg font-semibold text-[#2c7a4c] group-hover:text-[#236139]">
                    Kunder & Hundägare
                  </h3>
                </div>
                <p className="text-sm text-gray-600 leading-relaxed">
                  Hantera kundregister och kontaktuppgifter.
                </p>
              </div>
            </Link>

            {/* Rum-hantering */}
            <Link href="/admin/rum">
              <div className="bg-white rounded-lg p-6 border border-gray-200 shadow-sm h-full hover:border-[#2c7a4c] transition-all group">
                <div className="flex items-center gap-3 mb-3">
                  <div className="text-3xl">🚪</div>
                  <h3 className="text-lg font-semibold text-[#2c7a4c] group-hover:text-[#236139]">
                    Rum & Platser
                  </h3>
                </div>
                <p className="text-sm text-gray-600 leading-relaxed">
                  Hantera rum för dagis och pensionat.
                </p>
              </div>
            </Link>

            {/* Användarhantering */}
            <Link href="/admin/users">
              <div className="bg-white rounded-lg p-6 border border-gray-200 shadow-sm h-full hover:border-[#2c7a4c] transition-all group">
                <div className="flex items-center gap-3 mb-3">
                  <div className="text-3xl">🔐</div>
                  <h3 className="text-lg font-semibold text-[#2c7a4c] group-hover:text-[#236139]">
                    Användarhantering
                  </h3>
                </div>
                <p className="text-sm text-gray-600 leading-relaxed">
                  Skapa inlogg för kollegor och hantera behörigheter.
                </p>
              </div>
            </Link>

            {/* Abonnemang DogPlanner */}
            <Link href="/subscription">
              <div className="bg-white rounded-lg p-6 border border-gray-200 shadow-sm h-full hover:border-[#2c7a4c] transition-all group">
                <div className="flex items-center gap-3 mb-3">
                  <div className="text-3xl">💳</div>
                  <h3 className="text-lg font-semibold text-[#2c7a4c] group-hover:text-[#236139]">
                    Ditt Abonnemang
                  </h3>
                </div>
                <p className="text-sm text-gray-600 leading-relaxed">
                  Hantera ditt DogPlanner-abonnemang och betalning.
                </p>
              </div>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
