"use client";

import React from "react";
import { useAuth } from "../context/AuthContext";
import Link from "next/link";
import { StandardCard } from "@/components/ui/standard";
import DashboardWidgets from "@/components/DashboardWidgets";
import DagensHundarWidget from "@/components/DagensHundarWidget";

export default function Dashboard() {
  const { user, loading: authLoading, currentOrgId } = useAuth();

  if (authLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#2c7a4c] mx-auto mb-4"></div>
          <p className="text-gray-600">Laddar dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Kompakt header - INGEN HERO */}
      <div className="bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <h1 className="text-[32px] font-bold text-[#2c7a4c] leading-tight">
            Dashboard
          </h1>
          <p className="text-base text-gray-600 mt-1">
            Välkommen tillbaka! Här är en snabb överblick över din verksamhet
          </p>
        </div>
      </div>

      {/* Stats overview - om org finns */}
      {currentOrgId && (
        <div className="max-w-7xl mx-auto px-6 py-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
            <div className="lg:col-span-2">
              <DashboardWidgets />
            </div>
            <div className="flex flex-col">
              <DagensHundarWidget />
            </div>
          </div>
        </div>
      )}

      {/* Modulkort - Kompakta och professionella */}
      <div className="max-w-7xl mx-auto px-6 pb-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
          {/* Hunddagis */}
          <Link href="/hunddagis" className="group">
            <StandardCard
              padding="sm"
              rounded="lg"
              className="h-full hover:border-[#2c7a4c] hover:shadow-md transition-all"
            >
              <div className="flex flex-col items-center justify-center text-center h-full min-h-[140px] py-4">
                <div className="text-4xl mb-3">🐕</div>
                <h2 className="text-lg font-semibold text-[#2c7a4c] mb-2">
                  Hunddagis
                </h2>
                <p className="text-sm text-gray-600 leading-relaxed px-2">
                  Dagishundar, schema och verksamhet
                </p>
              </div>
            </StandardCard>
          </Link>

          {/* Hundpensionat */}
          <Link href="/hundpensionat" className="group">
            <StandardCard
              padding="sm"
              rounded="lg"
              className="h-full hover:border-[#2c7a4c] hover:shadow-md transition-all"
            >
              <div className="flex flex-col items-center justify-center text-center h-full min-h-[140px] py-4">
                <div className="text-4xl mb-3">🏨</div>
                <h2 className="text-lg font-semibold text-[#2c7a4c] mb-2">
                  Hundpensionat
                </h2>
                <p className="text-sm text-gray-600 leading-relaxed px-2">
                  Bokningar och in-/utcheckning
                </p>
              </div>
            </StandardCard>
          </Link>

          {/* Hundfrisör */}
          <Link href="/frisor" className="group">
            <StandardCard
              padding="sm"
              rounded="lg"
              className="h-full hover:border-[#2c7a4c] hover:shadow-md transition-all"
            >
              <div className="flex flex-col items-center justify-center text-center h-full min-h-[140px] py-4">
                <div className="text-4xl mb-3">✂️</div>
                <h2 className="text-lg font-semibold text-[#2c7a4c] mb-2">
                  Hundfrisör
                </h2>
                <p className="text-sm text-gray-600 leading-relaxed px-2">
                  Bokningar och hundtrimning
                </p>
              </div>
            </StandardCard>
          </Link>

          {/* Admin */}
          <Link href="/admin" className="group">
            <StandardCard
              padding="sm"
              rounded="lg"
              className="h-full hover:border-[#2c7a4c] hover:shadow-md transition-all"
            >
              <div className="flex flex-col items-center justify-center text-center h-full min-h-[140px] py-4">
                <div className="text-4xl mb-3">⚙️</div>
                <h2 className="text-lg font-semibold text-[#2c7a4c] mb-2">
                  Admin
                </h2>
                <p className="text-sm text-gray-600 leading-relaxed px-2">
                  Ekonomi, priser och hantering
                </p>
              </div>
            </StandardCard>
          </Link>
        </div>
      </div>
    </div>
  );
}
