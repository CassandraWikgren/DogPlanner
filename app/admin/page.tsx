"use client";

import React from "react";
import { useAuth } from "../context/AuthContext";
import Link from "next/link";
import DashboardWidgets from "@/components/DashboardWidgets";
import {
  H1,
  H2,
  StandardCard,
  StandardContainer,
  StandardPage,
} from "@/components/ui/standard";

export default function AdminPage() {
  const { currentOrgId } = useAuth();

  return (
    <StandardPage>
      {/* Header - Enligt stilguide: vit bakgrund, padding 24px */}
      <div className="bg-white border-b border-gray-200">
        <StandardContainer size="xl" padding="md">
          <H1 className="mb-2">Administration</H1>
          <p className="text-base text-gray-600">
            Hantera ekonomi, priser, företagsinformation och användare
          </p>
        </StandardContainer>
      </div>

      {/* Main Content - Stilguide: maxbredd 1200px, sidmarginal 24px */}
      <StandardContainer size="xl" padding="md">
        {/* Statistik-sektion */}
        {currentOrgId && (
          <div className="mb-8">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-1 h-6 bg-[#2c7a4c] rounded-full"></div>
              <H2>Översikt</H2>
            </div>
            <DashboardWidgets />
          </div>
        )}

        {/* Åtgärder - Grid enligt stilguide */}
        <div>
          <div className="flex items-center gap-2 mb-4">
            <div className="w-1 h-6 bg-[#2c7a4c] rounded-full"></div>
            <H2>Hantera</H2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Ekonomi & Fakturor */}
            <Link href="/ekonomi">
              <StandardCard
                padding="md"
                rounded="lg"
                className="h-full hover:border-[#2c7a4c] transition-all group"
              >
                <div className="flex items-center gap-3 mb-3">
                  <div className="text-3xl">💰</div>
                  <h3 className="text-lg font-semibold text-[#2c7a4c] group-hover:text-[#236139]">
                    Ekonomi & Fakturor
                  </h3>
                </div>
                <p className="text-base text-gray-600 leading-relaxed">
                  Hantera fakturor, betalningar och ekonomirapporter.
                </p>
              </StandardCard>
            </Link>

            {/* Priser - Hunddagis */}
            <Link href="/admin/priser/dagis">
              <StandardCard
                padding="md"
                rounded="lg"
                className="h-full hover:border-[#2c7a4c] transition-all group"
              >
                <div className="flex items-center gap-3 mb-3">
                  <div className="text-3xl">🐕</div>
                  <h3 className="text-lg font-semibold text-[#2c7a4c] group-hover:text-[#236139]">
                    Priser - Hunddagis
                  </h3>
                </div>
                <p className="text-base text-gray-600 leading-relaxed">
                  Ändra priser för dagisabonnemang och enstaka dagar.
                </p>
              </StandardCard>
            </Link>

            {/* Priser - Hundpensionat */}
            <Link href="/admin/priser/pensionat">
              <StandardCard
                padding="md"
                rounded="lg"
                className="h-full hover:border-[#2c7a4c] transition-all group"
              >
                <div className="flex items-center gap-3 mb-3">
                  <div className="text-3xl">🏨</div>
                  <h3 className="text-lg font-semibold text-[#2c7a4c] group-hover:text-[#236139]">
                    Priser - Pensionat
                  </h3>
                </div>
                <p className="text-base text-gray-600 leading-relaxed">
                  Ändra priser för pensionatsbokningar och tilläggstjänster.
                </p>
              </StandardCard>
            </Link>

            {/* Priser - Hundfrisör */}
            <Link href="/admin/priser/frisor">
              <StandardCard
                padding="md"
                rounded="lg"
                className="h-full hover:border-[#2c7a4c] transition-all group"
              >
                <div className="flex items-center gap-3 mb-3">
                  <div className="text-3xl">✂️</div>
                  <h3 className="text-lg font-semibold text-[#2c7a4c] group-hover:text-[#236139]">
                    Priser - Frisör
                  </h3>
                </div>
                <p className="text-base text-gray-600 leading-relaxed">
                  Ändra priser för klippning, bad och pälsvård.
                </p>
              </StandardCard>
            </Link>

            {/* Företagsinformation */}
            <Link href="/foretagsinformation">
              <StandardCard
                padding="md"
                rounded="lg"
                className="h-full hover:border-[#2c7a4c] transition-all group"
              >
                <div className="flex items-center gap-3 mb-3">
                  <div className="text-3xl">🏢</div>
                  <h3 className="text-lg font-semibold text-[#2c7a4c] group-hover:text-[#236139]">
                    Företagsinformation
                  </h3>
                </div>
                <p className="text-base text-gray-600 leading-relaxed">
                  Hantera företagsuppgifter, kontaktinfo och adress.
                </p>
              </StandardCard>
            </Link>

            {/* Kunder & Hundägare */}
            <Link href="/owners">
              <StandardCard
                padding="md"
                rounded="lg"
                className="h-full hover:border-[#2c7a4c] transition-all group"
              >
                <div className="flex items-center gap-3 mb-3">
                  <div className="text-3xl">👥</div>
                  <h3 className="text-lg font-semibold text-[#2c7a4c] group-hover:text-[#236139]">
                    Kunder & Hundägare
                  </h3>
                </div>
                <p className="text-base text-gray-600 leading-relaxed">
                  Hantera kundregister och kontaktuppgifter.
                </p>
              </StandardCard>
            </Link>

            {/* Rum-hantering */}
            <Link href="/admin/rum">
              <StandardCard
                padding="md"
                rounded="lg"
                className="h-full hover:border-[#2c7a4c] transition-all group"
              >
                <div className="flex items-center gap-3 mb-3">
                  <div className="text-3xl">🚪</div>
                  <h3 className="text-lg font-semibold text-[#2c7a4c] group-hover:text-[#236139]">
                    Rum & Platser
                  </h3>
                </div>
                <p className="text-base text-gray-600 leading-relaxed">
                  Hantera rum för dagis och pensionat.
                </p>
              </StandardCard>
            </Link>

            {/* Användarhantering */}
            <Link href="/admin/users">
              <StandardCard
                padding="md"
                rounded="lg"
                className="h-full hover:border-[#2c7a4c] transition-all group"
              >
                <div className="flex items-center gap-3 mb-3">
                  <div className="text-3xl">🔐</div>
                  <h3 className="text-lg font-semibold text-[#2c7a4c] group-hover:text-[#236139]">
                    Användarhantering
                  </h3>
                </div>
                <p className="text-base text-gray-600 leading-relaxed">
                  Skapa inlogg för kollegor och hantera behörigheter.
                </p>
              </StandardCard>
            </Link>

            {/* Abonnemang DogPlanner */}
            <Link href="/subscription">
              <StandardCard
                padding="md"
                rounded="lg"
                className="h-full hover:border-[#2c7a4c] transition-all group"
              >
                <div className="flex items-center gap-3 mb-3">
                  <div className="text-3xl">💳</div>
                  <h3 className="text-lg font-semibold text-[#2c7a4c] group-hover:text-[#236139]">
                    Ditt Abonnemang
                  </h3>
                </div>
                <p className="text-base text-gray-600 leading-relaxed">
                  Hantera ditt DogPlanner-abonnemang och betalning.
                </p>
              </StandardCard>
            </Link>
          </div>
        </div>
      </StandardContainer>
    </StandardPage>
  );
}
