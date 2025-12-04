"use client";

import React from "react";
import { useAuth } from "../context/AuthContext";
import Link from "next/link";
import DashboardWidgets from "@/components/DashboardWidgets";
import { ServiceGuard } from "@/components/ServiceGuard";

export default function AdminPage() {
  const { currentOrgId } = useAuth();

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      {/* Header med titel och statistik - EXAKT som Hunddagis */}
      <div className="border-b border-gray-200 bg-white shadow-sm">
        <div className="max-w-6xl mx-auto px-8 py-8">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <h1 className="text-[38px] font-bold text-[#2c7a4c] leading-tight tracking-tight">
                🏥 Administration
              </h1>
              <p className="mt-2 text-base text-gray-600">
                Allt du behöver för att hantera DogPlanner
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content Area - max-w-6xl mx-auto px-8 py-6 */}
      <div className="max-w-6xl mx-auto px-8 py-6">
        {/* Statistik-sektion */}
        {currentOrgId && (
          <div className="mb-8">
            <div className="flex items-center gap-2 mb-5">
              <div className="w-1 h-6 bg-[#2c7a4c] rounded-full"></div>
              <h2 className="text-lg font-semibold text-[#2c7a4c]">Översikt</h2>
            </div>
            <DashboardWidgets />
          </div>
        )}

        {/* Åtgärder - Grid enligt stilguide */}
        <div>
          <div className="flex items-center gap-2 mb-5">
            <div className="w-1 h-6 bg-[#2c7a4c] rounded-full"></div>
            <h2 className="text-lg font-semibold text-[#2c7a4c]">Hantera</h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {/* Rapporter */}
            <Link href="/admin/rapporter">
              <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-5 flex flex-col items-center justify-between h-full hover:border-[#2c7a4c] hover:shadow-lg hover:bg-gradient-to-br hover:from-white hover:to-[#f0f7f3] transition-all duration-200 cursor-pointer group">
                <div className="flex-1 w-full">
                  <div className="flex items-center justify-center gap-2 mb-2">
                    <span className="text-3xl">📊</span>
                    <h3 className="text-sm font-bold text-[#2c7a4c] group-hover:text-[#236139] text-center">
                      Rapporter & Statistik
                    </h3>
                  </div>
                  <p className="text-xs text-gray-600 text-center leading-snug">
                    Intäkter, beläggning och bokningsstatistik. Exportera till
                    Excel.
                  </p>
                </div>
              </div>
            </Link>

            {/* Ekonomi & Fakturor */}
            <Link href="/ekonomi">
              <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-5 flex flex-col items-center justify-between h-full hover:border-[#2c7a4c] hover:shadow-lg hover:bg-gradient-to-br hover:from-white hover:to-[#f0f7f3] transition-all duration-200 cursor-pointer group">
                <div className="flex-1 w-full">
                  <div className="flex items-center justify-center gap-2 mb-2">
                    <span className="text-3xl">💰</span>
                    <h3 className="text-sm font-bold text-[#2c7a4c] group-hover:text-[#236139] text-center">
                      Ekonomi & Fakturor
                    </h3>
                  </div>
                  <p className="text-xs text-gray-600 text-center leading-snug">
                    Hantera fakturor, betalningar och ekonomirapporter.
                  </p>
                </div>
              </div>
            </Link>

            {/* Priser - Hunddagis */}
            <ServiceGuard service="daycare">
              <Link href="/admin/priser/dagis">
                <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-5 flex flex-col items-center justify-between h-full hover:border-[#2c7a4c] hover:shadow-lg hover:bg-gradient-to-br hover:from-white hover:to-[#f0f7f3] transition-all duration-200 cursor-pointer group">
                  <div className="flex-1 w-full">
                    <div className="flex items-center justify-center gap-2 mb-2">
                      <span className="text-3xl">🐕</span>
                      <h3 className="text-sm font-bold text-[#2c7a4c] group-hover:text-[#236139] text-center">
                        Priser - Hunddagis
                      </h3>
                    </div>
                    <p className="text-xs text-gray-600 text-center leading-snug">
                      Ändra priser för dagisabonnemang och enstaka dagar.
                    </p>
                  </div>
                </div>
              </Link>
            </ServiceGuard>

            {/* Priser - Hundpensionat */}
            <ServiceGuard service="boarding">
              <Link href="/admin/priser/pensionat">
                <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-5 flex flex-col items-center justify-between h-full hover:border-[#2c7a4c] hover:shadow-lg hover:bg-gradient-to-br hover:from-white hover:to-[#f0f7f3] transition-all duration-200 cursor-pointer group">
                  <div className="flex-1 w-full">
                    <div className="flex items-center justify-center gap-2 mb-2">
                      <span className="text-3xl">🏨</span>
                      <h3 className="text-sm font-bold text-[#2c7a4c] group-hover:text-[#236139] text-center">
                        Priser - Pensionat
                      </h3>
                    </div>
                    <p className="text-xs text-gray-600 text-center leading-snug">
                      Ändra priser för pensionatsbokningar och tilläggstjänster.
                    </p>
                  </div>
                </div>
              </Link>
            </ServiceGuard>

            {/* Priser - Hundfrisör */}
            <ServiceGuard service="grooming">
              <Link href="/admin/hundfrisor/priser">
                <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-5 flex flex-col items-center justify-between h-full hover:border-[#2c7a4c] hover:shadow-lg hover:bg-gradient-to-br hover:from-white hover:to-[#f0f7f3] transition-all duration-200 cursor-pointer group">
                  <div className="flex-1 w-full">
                    <div className="flex items-center justify-center gap-2 mb-2">
                      <span className="text-3xl">✂️</span>
                      <h3 className="text-sm font-bold text-[#2c7a4c] group-hover:text-[#236139] text-center">
                        Priser - Frisör
                      </h3>
                    </div>
                    <p className="text-xs text-gray-600 text-center leading-snug">
                      Ändra priser för klippning, bad och pälsvård.
                    </p>
                  </div>
                </div>
              </Link>
            </ServiceGuard>

            {/* Företagsinformation */}
            <Link href="/foretagsinformation">
              <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-5 flex flex-col items-center justify-between h-full hover:border-[#2c7a4c] hover:shadow-lg hover:bg-gradient-to-br hover:from-white hover:to-[#f0f7f3] transition-all duration-200 cursor-pointer group">
                <div className="flex-1 w-full">
                  <div className="flex items-center justify-center gap-2 mb-2">
                    <span className="text-3xl">🏢</span>
                    <h3 className="text-sm font-bold text-[#2c7a4c] group-hover:text-[#236139] text-center">
                      Företagsinformation
                    </h3>
                  </div>
                  <p className="text-xs text-gray-600 text-center leading-snug">
                    Hantera företagsuppgifter, kontaktinfo och adress.
                  </p>
                </div>
              </div>
            </Link>

            {/* Kunder & Hundägare */}
            <Link href="/owners">
              <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-5 flex flex-col items-center justify-between h-full hover:border-[#2c7a4c] hover:shadow-lg hover:bg-gradient-to-br hover:from-white hover:to-[#f0f7f3] transition-all duration-200 cursor-pointer group">
                <div className="flex-1 w-full">
                  <div className="flex items-center justify-center gap-2 mb-2">
                    <span className="text-3xl">👥</span>
                    <h3 className="text-sm font-bold text-[#2c7a4c] group-hover:text-[#236139] text-center">
                      Kunder & Hundägare
                    </h3>
                  </div>
                  <p className="text-xs text-gray-600 text-center leading-snug">
                    Hantera kundregister och kontaktuppgifter.
                  </p>
                </div>
              </div>
            </Link>

            {/* Rum-hantering */}
            <Link href="/admin/rum">
              <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-5 flex flex-col items-center justify-between h-full hover:border-[#2c7a4c] hover:shadow-lg hover:bg-gradient-to-br hover:from-white hover:to-[#f0f7f3] transition-all duration-200 cursor-pointer group">
                <div className="flex-1 w-full">
                  <div className="flex items-center justify-center gap-2 mb-2">
                    <span className="text-3xl">🚪</span>
                    <h3 className="text-sm font-bold text-[#2c7a4c] group-hover:text-[#236139] text-center">
                      Rum & Platser
                    </h3>
                  </div>
                  <p className="text-xs text-gray-600 text-center leading-snug">
                    Hantera rum för dagis och pensionat.
                  </p>
                </div>
              </div>
            </Link>

            {/* Användarhantering */}
            <Link href="/admin/users">
              <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-5 flex flex-col items-center justify-between h-full hover:border-[#2c7a4c] hover:shadow-lg hover:bg-gradient-to-br hover:from-white hover:to-[#f0f7f3] transition-all duration-200 cursor-pointer group">
                <div className="flex-1 w-full">
                  <div className="flex items-center justify-center gap-2 mb-2">
                    <span className="text-3xl">🔐</span>
                    <h3 className="text-sm font-bold text-[#2c7a4c] group-hover:text-[#236139] text-center">
                      Användarhantering
                    </h3>
                  </div>
                  <p className="text-xs text-gray-600 text-center leading-snug">
                    Skapa inlogg för kollegor och hantera behörigheter.
                  </p>
                </div>
              </div>
            </Link>

            {/* Abonnemang DogPlanner */}
            <Link href="/admin/abonnemang">
              <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-5 flex flex-col items-center justify-between h-full hover:border-[#2c7a4c] hover:shadow-lg hover:bg-gradient-to-br hover:from-white hover:to-[#f0f7f3] transition-all duration-200 cursor-pointer group">
                <div className="flex-1 w-full">
                  <div className="flex items-center justify-center gap-2 mb-2">
                    <span className="text-3xl">💳</span>
                    <h3 className="text-sm font-bold text-[#2c7a4c] group-hover:text-[#236139] text-center">
                      Ditt Abonnemang
                    </h3>
                  </div>
                  <p className="text-xs text-gray-600 text-center leading-snug">
                    Hantera ditt DogPlanner-abonnemang och betalning.
                  </p>
                </div>
              </div>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
