"use client";

import React from "react";
import { useAuth } from "../context/AuthContext";
import Link from "next/link";
import { StandardCard } from "@/components/ui/standard";
import DashboardWidgets from "@/components/DashboardWidgets";
import DagensHundarWidget from "@/components/DagensHundarWidget";
import { useEnabledServices } from "@/lib/hooks/useEnabledServices";
import { useRouter } from "next/navigation";

export default function Dashboard() {
  const { user, loading: authLoading, currentOrgId, isCustomer } = useAuth();
  const {
    hasDaycare,
    hasBoarding,
    hasGrooming,
    loading: servicesLoading,
  } = useEnabledServices();
  const router = useRouter();

  // 🐕 KUND-REDIRECT: Om användaren är en hundägare, skicka till kundportalen
  React.useEffect(() => {
    if (authLoading) return;
    
    if (isCustomer) {
      console.log("🐕 Kund upptäckt på /dashboard - redirectar till /kundportal");
      router.replace("/kundportal");
    }
  }, [isCustomer, authLoading, router]);

  // Smart routing: Om endast EN tjänst är aktiverad, navigera dit direkt
  React.useEffect(() => {
    if (servicesLoading || authLoading) return;

    const enabledCount = [hasDaycare, hasBoarding, hasGrooming].filter(
      Boolean
    ).length;

    // Om bara en tjänst är aktiverad, navigera dit automatiskt
    if (enabledCount === 1) {
      if (hasGrooming) {
        router.replace("/frisor");
      } else if (hasDaycare) {
        router.replace("/hunddagis");
      } else if (hasBoarding) {
        router.replace("/hundpensionat");
      }
    }
  }, [
    hasDaycare,
    hasBoarding,
    hasGrooming,
    servicesLoading,
    authLoading,
    router,
  ]);

  if (authLoading || servicesLoading) {
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
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-4">
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
      <div className="max-w-7xl mx-auto px-6 pb-4">
        {/* Show skeleton placeholders while loading */}
        {servicesLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="animate-pulse">
                <div className="bg-gray-200 rounded-lg h-[140px]"></div>
              </div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Hunddagis */}
            {hasDaycare && (
              <Link href="/hunddagis" className="group">
                <StandardCard
                  padding="sm"
                  rounded="lg"
                  className="h-full hover:border-[#2c7a4c] hover:shadow-md transition-all"
                >
                  <div className="flex flex-col items-center justify-center text-center h-full min-h-[120px] py-3">
                    <div className="text-3xl mb-2">🐕</div>
                    <h2 className="text-base font-semibold text-[#2c7a4c] mb-1">
                      Hunddagis
                    </h2>
                    <p className="text-xs text-gray-600 leading-relaxed px-2">
                      Dagishundar, schema och verksamhet
                    </p>
                  </div>
                </StandardCard>
              </Link>
            )}

            {/* Hundpensionat */}
            {hasBoarding && (
              <Link href="/hundpensionat" className="group">
                <StandardCard
                  padding="sm"
                  rounded="lg"
                  className="h-full hover:border-[#2c7a4c] hover:shadow-md transition-all"
                >
                  <div className="flex flex-col items-center justify-center text-center h-full min-h-[120px] py-3">
                    <div className="text-3xl mb-2">🏨</div>
                    <h2 className="text-base font-semibold text-[#2c7a4c] mb-1">
                      Hundpensionat
                    </h2>
                    <p className="text-xs text-gray-600 leading-relaxed px-2">
                      Bokningar och in-/utcheckning
                    </p>
                  </div>
                </StandardCard>
              </Link>
            )}

            {/* Hundfrisör */}
            {hasGrooming && (
              <Link href="/frisor" className="group">
                <StandardCard
                  padding="sm"
                  rounded="lg"
                  className="h-full hover:border-[#2c7a4c] hover:shadow-md transition-all"
                >
                  <div className="flex flex-col items-center justify-center text-center h-full min-h-[120px] py-3">
                    <div className="text-3xl mb-2">✂️</div>
                    <h2 className="text-base font-semibold text-[#2c7a4c] mb-1">
                      Hundfrisör
                    </h2>
                    <p className="text-xs text-gray-600 leading-relaxed px-2">
                      Bokningar och hundtrimning
                    </p>
                  </div>
                </StandardCard>
              </Link>
            )}

            {/* Admin - alltid synlig */}
            <Link href="/admin" className="group">
              <StandardCard
                padding="sm"
                rounded="lg"
                className="h-full hover:border-[#2c7a4c] hover:shadow-md transition-all"
              >
                <div className="flex flex-col items-center justify-center text-center h-full min-h-[120px] py-3">
                  <div className="text-3xl mb-2">⚙️</div>
                  <h2 className="text-base font-semibold text-[#2c7a4c] mb-1">
                    Admin
                  </h2>
                  <p className="text-xs text-gray-600 leading-relaxed px-2">
                    Ekonomi, priser och hantering
                  </p>
                </div>
              </StandardCard>
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
