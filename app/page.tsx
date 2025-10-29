"use client";

import React, { useEffect } from "react";
import { useAuth } from "@/app/context/AuthContext";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Calendar,
  BarChart3,
  FileText,
  ArrowRight,
  PawPrint,
  Users,
  Clock,
  Heart,
  Shield,
  Smartphone,
  CheckCircle,
  Star,
} from "lucide-react";
import Image from "next/image";
import Navbar from "@/components/Navbar";

/**
 * Start-/hem-sida för DogPlanner.
 * Professionell marketingsida för hunddagis och pensionat.
 */
export default function HomePage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  // Ingen redirect – startsidan visas alltid, även för inloggade

  // Om användaren är inloggad, visa dashboard-version
  if (user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#2c7a4c] to-[#1e5a35]">
        {/* Hero Section */}
        <div className="relative px-6 py-16 lg:py-32">
          <div className="max-w-4xl mx-auto text-center text-white">
            <h1 className="text-4xl lg:text-6xl font-bold mb-6">
              Välkommen till ditt Dashboard
            </h1>
            <p className="text-xl lg:text-2xl mb-8 text-green-100">
              Här får du snabb tillgång till dina hundar, abonnemang och
              fakturor.
            </p>
            <Link href="/dashboard">
              <Button
                size="lg"
                className="bg-white text-[#2c7a4c] hover:bg-green-50 text-lg px-8 py-4"
              >
                Gå till Dashboard
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // Professionell marketingsida för icke-inloggade användare
  return (
    <div className="min-h-screen bg-[#fdfdfd] flex flex-col">
      {/* Header */}
      <header className="flex justify-between items-center px-8 py-4 bg-green-700 text-white shadow">
        <div className="flex items-center gap-2">
          <Image
            src="/logo.png"
            alt="DogPlanner logotyp"
            width={42}
            height={42}
          />
          <span className="font-bold text-xl tracking-tight">DogPlanner</span>
        </div>
        <Link
          href="/login"
          className="font-bold px-4 py-2 rounded bg-white/20 hover:bg-white/35 transition"
        >
          Logga in
        </Link>
      </header>

      {/* Hero */}
      <section className="flex-1 flex flex-col items-center justify-center text-center relative bg-gradient-to-b from-green-700/90 to-green-600/80">
        <Image
          src="/logo.png"
          alt="DogPlanner logotyp"
          width={180}
          height={180}
          className="mx-auto mb-6 drop-shadow-lg"
        />
        <h1 className="text-4xl md:text-5xl font-extrabold text-white mb-4 drop-shadow">
          Få full koll på din hundverksamhet
        </h1>
        <p className="text-lg md:text-2xl text-green-100 mb-8 max-w-2xl mx-auto">
          DogPlanner gör det enkelt att driva hunddagis och pensionat.
          <br />
          Mer tid för hundarna, mindre för papper.
        </p>
        <Link href="/register">
          <Button
            size="lg"
            className="bg-white text-green-700 font-bold px-8 py-4 rounded-lg shadow hover:bg-green-50 text-lg"
          >
            Prova gratis i 2 månader
          </Button>
        </Link>
        <p className="text-sm text-green-200 mt-4">
          Ingen bindningstid, ingen kortuppgift krävs
        </p>
      </section>

      {/* Funktioner Section */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-4xl lg:text-5xl font-bold text-gray-900 mb-6">
              Funktioner som förenklar din vardag
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Ett system som täcker grunderna för hunddagis och pensionat.
              Enkelt att använda, designat av hundälskare.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {/* Hundhantering */}
            <Card className="border-0 shadow-lg hover:shadow-xl transition-all duration-300 group">
              <CardContent className="p-8 text-center">
                <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-6 group-hover:bg-blue-200 transition-colors">
                  <Calendar className="h-8 w-8 text-blue-600" />
                </div>
                <h3 className="text-2xl font-bold text-gray-900 mb-4">
                  Hundhantering & schema
                </h3>
                <p className="text-gray-600 leading-relaxed mb-6">
                  Hantera alla dina hundar med profiler, abonnemang och
                  veckodagar. Få en klar översikt över vilka hundar som kommer
                  när.
                </p>
                <div className="text-left space-y-2">
                  <div className="flex items-center space-x-2">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    <span className="text-sm">Hundprofiler med detaljer</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    <span className="text-sm">Veckodagshantering</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    <span className="text-sm">Sök och filtrera</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Ekonomi & Fakturering */}
            <Card className="border-0 shadow-lg hover:shadow-xl transition-all duration-300 group">
              <CardContent className="p-8 text-center">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6 group-hover:bg-green-200 transition-colors">
                  <FileText className="h-8 w-8 text-green-600" />
                </div>
                <h3 className="text-2xl font-bold text-gray-900 mb-4">
                  Fakturaunderlag
                </h3>
                <p className="text-gray-600 leading-relaxed mb-6">
                  Generera fakturaunderlag baserat på hundarnas abonnemang.
                  Export till PDF för enkel hantering.
                </p>
                <div className="text-left space-y-2">
                  <div className="flex items-center space-x-2">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    <span className="text-sm">Månadsvis fakturaunderlag</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    <span className="text-sm">PDF-export</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    <span className="text-sm">Prissättning per abonnemang</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Kundhantering */}
            <Card className="border-0 shadow-lg hover:shadow-xl transition-all duration-300 group">
              <CardContent className="p-8 text-center">
                <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-6 group-hover:bg-purple-200 transition-colors">
                  <Users className="h-8 w-8 text-purple-600" />
                </div>
                <h3 className="text-2xl font-bold text-gray-900 mb-4">
                  Kundhantering
                </h3>
                <p className="text-gray-600 leading-relaxed mb-6">
                  Allt om dina kunder och deras hundar på ett ställe. Mediciner,
                  allergier, beteenden och kontaktinfo.
                </p>
                <div className="text-left space-y-2">
                  <div className="flex items-center space-x-2">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    <span className="text-sm">Hundprofiler med bilder</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    <span className="text-sm">Medicinsk information</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    <span className="text-sm">Kommunikationshistorik</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Hundpensionat */}
            <Card className="border-0 shadow-lg hover:shadow-xl transition-all duration-300 group">
              <CardContent className="p-8 text-center">
                <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-6 group-hover:bg-orange-200 transition-colors">
                  <Smartphone className="h-8 w-8 text-orange-600" />
                </div>
                <h3 className="text-2xl font-bold text-gray-900 mb-4">
                  Hundpensionat
                </h3>
                <p className="text-gray-600 leading-relaxed mb-6">
                  Hantera pensionsbokningar med in- och utcheckningsdatum.
                  Rum-hantering och översikt över alla vistelser.
                </p>
                <div className="text-left space-y-2">
                  <div className="flex items-center space-x-2">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    <span className="text-sm">Bokningshantering</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    <span className="text-sm">Rum och kapacitet</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    <span className="text-sm">Prissättning</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Säkerhet */}
            <Card className="border-0 shadow-lg hover:shadow-xl transition-all duration-300 group">
              <CardContent className="p-8 text-center">
                <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6 group-hover:bg-red-200 transition-colors">
                  <Shield className="h-8 w-8 text-red-600" />
                </div>
                <h3 className="text-2xl font-bold text-gray-900 mb-4">
                  Säkerhet & backup
                </h3>
                <p className="text-gray-600 leading-relaxed mb-6">
                  Din data är säker med oss. Automatiska backups,
                  GDPR-kompatibel och serverdata inom EU.
                </p>
                <div className="text-left space-y-2">
                  <div className="flex items-center space-x-2">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    <span className="text-sm">GDPR-kompatibel</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    <span className="text-sm">SSL-kryptering</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    <span className="text-sm">Dagliga backups</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Rapporter & Export */}
            <Card className="border-0 shadow-lg hover:shadow-xl transition-all duration-300 group">
              <CardContent className="p-8 text-center">
                <div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-6 group-hover:bg-yellow-200 transition-colors">
                  <Clock className="h-8 w-8 text-yellow-600" />
                </div>
                <h3 className="text-2xl font-bold text-gray-900 mb-4">
                  Rapporter & Export
                </h3>
                <p className="text-gray-600 leading-relaxed mb-6">
                  Exportera listor och rapporter till PDF. Håll koll på din
                  verksamhet med enkla överskådliga rapporter.
                </p>
                <div className="text-left space-y-2">
                  <div className="flex items-center space-x-2">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    <span className="text-sm">PDF-export</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    <span className="text-sm">Månadsrapporter</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    <span className="text-sm">Sök och filtrera</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Call to Action Section */}
      <section className="py-20 bg-gradient-to-r from-[#2c7a4c] to-[#1e5a35]">
        <div className="max-w-4xl mx-auto text-center px-6">
          <h2 className="text-4xl lg:text-5xl font-bold text-white mb-6">
            Redo att förändra ditt hunddagis?
          </h2>
          <p className="text-xl text-green-100 mb-8">
            Vi bygger framtidens system för hunddagis och pensionat. Var med och
            forma utvecklingen från start.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Link href="/register">
              <Button
                size="lg"
                className="bg-white text-[#2c7a4c] hover:bg-gray-100 text-lg px-8 py-4 font-semibold"
              >
                Testa DogPlanner gratis
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
          </div>
          <p className="text-green-200 mt-4">
            30 dagar gratis • Ingen bindningstid • Fullständig support
          </p>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center space-x-2 mb-4">
                <Image
                  src="/logo.png"
                  alt="DogPlanner"
                  width={32}
                  height={32}
                  className="h-8 w-8"
                />
                <span className="text-xl font-bold">DogPlanner</span>
              </div>
              <p className="text-gray-400">
                Sveriges smartaste system för hunddagis och hundpensionat.
              </p>
            </div>

            <div>
              <h4 className="font-semibold mb-4">Produkt</h4>
              <ul className="space-y-2 text-gray-400">
                <li>
                  <Link href="/funktioner" className="hover:text-white">
                    Funktioner
                  </Link>
                </li>
                <li>
                  <Link href="/priser" className="hover:text-white">
                    Priser
                  </Link>
                </li>
                <li>
                  <Link href="/demo" className="hover:text-white">
                    Demo
                  </Link>
                </li>
              </ul>
            </div>

            <div>
              <h4 className="font-semibold mb-4">Support</h4>
              <ul className="space-y-2 text-gray-400">
                <li>
                  <Link href="/help" className="hover:text-white">
                    Hjälpcenter
                  </Link>
                </li>
                <li>
                  <Link href="/kontakt" className="hover:text-white">
                    Kontakt
                  </Link>
                </li>
                <li>
                  <Link href="/status" className="hover:text-white">
                    Status
                  </Link>
                </li>
              </ul>
            </div>

            <div>
              <h4 className="font-semibold mb-4">Företag</h4>
              <ul className="space-y-2 text-gray-400">
                <li>
                  <Link href="/om-oss" className="hover:text-white">
                    Om oss
                  </Link>
                </li>
                <li>
                  <Link href="/karriar" className="hover:text-white">
                    Karriär
                  </Link>
                </li>
                <li>
                  <Link href="/integritet" className="hover:text-white">
                    Integritet
                  </Link>
                </li>
              </ul>
            </div>
          </div>

          <div className="border-t border-gray-800 mt-8 pt-8 text-center text-gray-400">
            <p>&copy; 2025 DogPlanner. Alla rättigheter förbehållna.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
