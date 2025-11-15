"use client";

import React from "react";
import { useAuth } from "../context/AuthContext";
import Link from "next/link";
import { HeroH1, HeroH2, StandardCard, StandardContainer, StandardPage } from "@/components/ui/standard";

export default function Dashboard() {
  const { user, loading: authLoading } = useAuth();

  if (authLoading) {
    return (
      <StandardPage>
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#2c7a4c] mx-auto mb-4"></div>
            <p className="text-gray-600">Laddar dashboard...</p>
          </div>
        </div>
      </StandardPage>
    );
  }

  return (
    <StandardPage>
      {/* Hero Section - Exakt enligt stilguide */}
      <section
        className="relative text-center text-white overflow-hidden"
        style={{
          paddingTop: "64px",
          paddingBottom: "64px",
          backgroundImage: 'url("/Hero.jpeg")',
          backgroundSize: "cover",
          backgroundPosition: "center 35%",
        }}
      >
        {/* Grön gradient med opacitet 0.85-0.9 enligt stilguide */}
        <div
          className="absolute inset-0"
          style={{
            background:
              "linear-gradient(180deg, rgba(44,122,76,0.9), rgba(44,122,76,0.8))",
          }}
        />
        
        {/* Container med rätt padding: 32px horisontellt enligt stilguide */}
        <div className="relative z-10 max-w-7xl mx-auto px-8">
          <HeroH1 className="mb-4">
            Välkommen till ditt Dashboard
          </HeroH1>
          <HeroH2 className="max-w-2xl mx-auto">
            Här får du snabb tillgång till dina hundar, abonnemang och fakturor.
          </HeroH2>
        </div>
      </section>

      {/* Main Content - Stilguide: maxbredd 1200px, sidmarginal 24px, vertikal spacing 32px */}
      <StandardContainer size="xl" padding="md">
        {/* Feature Cards Grid - 4 modulkort */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Hunddagis */}
          <Link href="/hunddagis" className="group">
            <StandardCard padding="lg" rounded="lg" className="h-full hover:border-[#2c7a4c] transition-all">
              <div className="text-4xl mb-4">🐕</div>
              <h2 className="text-xl font-bold text-[#2c7a4c] mb-3">Hunddagis</h2>
              <p className="text-gray-600 text-base leading-relaxed">
                Hantera dagishundar, schema och daglig verksamhet.
              </p>
            </StandardCard>
          </Link>

          {/* Hundpensionat */}
          <Link href="/hundpensionat" className="group">
            <StandardCard padding="lg" rounded="lg" className="h-full hover:border-[#2c7a4c] transition-all">
              <div className="text-4xl mb-4">🏨</div>
              <h2 className="text-xl font-bold text-[#2c7a4c] mb-3">
                Hundpensionat
              </h2>
              <p className="text-gray-600 text-base leading-relaxed">
                Hantera pensionshundar, bokningar och in-/utcheckning.
              </p>
            </StandardCard>
          </Link>

          {/* Hundfrisör */}
          <Link href="/frisor" className="group">
            <StandardCard padding="lg" rounded="lg" className="h-full hover:border-[#2c7a4c] transition-all">
              <div className="text-4xl mb-4">✂️</div>
              <h2 className="text-xl font-bold text-[#2c7a4c] mb-3">
                Hundfrisör
              </h2>
              <p className="text-gray-600 text-base leading-relaxed">
                Hantera bokningar och behandlingar för hundtrimning.
              </p>
            </StandardCard>
          </Link>

          {/* Admin */}
          <Link href="/admin" className="group">
            <StandardCard padding="lg" rounded="lg" className="h-full hover:border-[#2c7a4c] transition-all">
              <div className="text-4xl mb-4">⚙️</div>
              <h2 className="text-xl font-bold text-[#2c7a4c] mb-3">Admin</h2>
              <p className="text-gray-600 text-base leading-relaxed">
                Ekonomi, priser, företagsinformation och användarhantering.
              </p>
            </StandardCard>
          </Link>
        </div>
      </StandardContainer>
    </StandardPage>
  );
}
