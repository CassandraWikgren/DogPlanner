"use client";

import Link from "next/link";
import Image from "next/image";
import { useAuth } from "@/app/context/AuthContext";
import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function HomePage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  // Debug: Logga auth-status
  useEffect(() => {
    console.log("🏠 Landing Page - Auth status:", { user: !!user, loading });
  }, [user, loading]);

  // Inloggade användare ska INTE se landing page - redirecta till dashboard
  useEffect(() => {
    if (!loading && user) {
      console.log("🔄 Inloggad användare, redirectar till dashboard...");
      router.replace("/dashboard");
    }
  }, [user, loading, router]);

  // Visa laddning medan vi kollar auth
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-gray-600">Laddar...</div>
      </div>
    );
  }

  // Om inloggad, visa ingenting (redirect pågår)
  if (user) {
    return null;
  }

  // Landing page - ENDAST för utloggade besökare
  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <nav className="bg-white border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link
            href="/dashboard"
            className="flex items-center hover:opacity-90 transition-opacity"
          >
            <Image
              src="/logo.png"
              alt="DogPlanner"
              width={50}
              height={50}
              priority
              className="rounded-lg"
            />
          </Link>
          <div className="flex items-center gap-4">
            <Link
              href="/login"
              className="text-gray-700 hover:text-[#2c7a4c] font-medium transition-colors"
            >
              Logga in
            </Link>
            <Link
              href="/register"
              className="px-6 py-2.5 bg-[#2c7a4c] text-white rounded-lg hover:bg-[#236139] font-medium transition-all shadow-sm hover:shadow-md"
            >
              Kom igång gratis
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section med bakgrundsbild */}
      <section
        className="relative bg-cover bg-center"
        style={{
          backgroundImage: "url('/Hero.jpeg')",
          backgroundColor: "#2c7a4c",
          minHeight: "600px",
          backgroundSize: "cover",
          backgroundPosition: "center",
          position: "relative",
        }}
      >
        {/* Gradient overlay */}
        <div
          className="absolute inset-0 bg-gradient-to-r from-[#2c7a4c]/90 to-[#2c7a4c]/70"
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background:
              "linear-gradient(to right, rgba(44, 122, 76, 0.9), rgba(44, 122, 76, 0.7))",
          }}
        ></div>

        {/* Content */}
        <div
          className="relative max-w-7xl mx-auto px-6 py-20 md:py-32"
          style={{
            position: "relative",
            paddingTop: "5rem",
            paddingBottom: "5rem",
          }}
        >
          <div className="max-w-2xl">
            <h1
              className="font-bold text-white mb-6 leading-tight drop-shadow-lg"
              style={{
                fontSize: "3rem",
                fontWeight: "bold",
                color: "white",
                marginBottom: "1.5rem",
                lineHeight: "1.2",
              }}
            >
              Hunddagis som hanterar sig självt
            </h1>
            <p
              className="text-white mb-8 leading-relaxed drop-shadow-md"
              style={{
                fontSize: "1.25rem",
                color: "rgba(255, 255, 255, 0.95)",
                marginBottom: "2rem",
                lineHeight: "1.6",
              }}
            >
              Slipp Excel-kaoset. Hantera bokningar, hundregister och
              fakturering på ett ställe. Enklare än någonsin.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 mb-6">
              <Link
                href="/register"
                className="px-8 py-4 bg-white rounded-lg hover:bg-gray-50 font-bold transition-all shadow-lg hover:shadow-xl text-center"
                style={{
                  backgroundColor: "white",
                  color: "#2c7a4c",
                  padding: "1rem 2rem",
                  borderRadius: "0.5rem",
                  fontWeight: "bold",
                  fontSize: "1.125rem",
                }}
              >
                ✨ Prova gratis i 2 månader
              </Link>
              <a
                href="#features"
                className="px-8 py-4 border-2 rounded-lg hover:bg-white/10 font-semibold transition-all backdrop-blur text-center"
                style={{
                  border: "2px solid white",
                  color: "white",
                  padding: "1rem 2rem",
                  borderRadius: "0.5rem",
                  fontWeight: "600",
                  fontSize: "1.125rem",
                }}
              >
                Se hur det fungerar
              </a>
            </div>
            <div
              className="flex items-center gap-4"
              style={{
                color: "rgba(255, 255, 255, 0.9)",
                fontSize: "0.875rem",
              }}
            >
              <span className="flex items-center gap-2">
                <svg
                  className="w-5 h-5 text-green-300"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                    clipRule="evenodd"
                  />
                </svg>
                Ingen bindningstid
              </span>
              <span className="flex items-center gap-2">
                <svg
                  className="w-5 h-5 text-green-300"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                    clipRule="evenodd"
                  />
                </svg>
                Inget kreditkort behövs
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* Problem Section */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              Känner du igen dig?
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Hundverksamheter slösar i snitt 10+ timmar per vecka på
              administration
            </p>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            <div className="bg-white p-8 rounded-xl shadow-sm border border-gray-200">
              <div className="text-4xl mb-4">😰</div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">
                Excel-kaos
              </h3>
              <p className="text-gray-600">
                Hundra olika flikar. Glömmer uppdatera. Hittar inte rätt
                information när ägare ringer.
              </p>
            </div>
            <div className="bg-white p-8 rounded-xl shadow-sm border border-gray-200">
              <div className="text-4xl mb-4">📱</div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">
                Papperslappar överallt
              </h3>
              <p className="text-gray-600">
                Bokningar på lappar, hundinfo i pärmar. Ägare ringer och frågar
                om lediga platser - du vet inte.
              </p>
            </div>
            <div className="bg-white p-8 rounded-xl shadow-sm border border-gray-200">
              <div className="text-4xl mb-4">💸</div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">
                Fakturering tar evigheter
              </h3>
              <p className="text-gray-600">
                Sitta och räkna dagar, skapa fakturor manuellt. Vissa ägare
                glömmer betala.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Solution Features */}
      <section id="features" className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              En plattform för allt
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              DogPlanner ersätter alla dina system. Bygg från en enkel början
              och lägg till mer när du behöver.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-12 items-center mb-20">
            <div>
              <div className="inline-block px-4 py-1 bg-green-100 text-[#2c7a4c] rounded-full text-sm font-semibold mb-4">
                🐕 HUNDDAGIS
              </div>
              <h3 className="text-3xl font-bold text-gray-900 mb-4">
                Se hela veckan på ett ögonblick
              </h3>
              <p className="text-lg text-gray-600 mb-6">
                Dagsschemat visar exakt vilka hundar som kommer vilka dagar. Se
                lediga platser per rum. Jordbruksverkets regler inkluderade -
                systemet varnar om rummen blir överbelagda.
              </p>
              <ul className="space-y-3">
                <li className="flex items-start gap-3">
                  <svg
                    className="w-6 h-6 text-[#2c7a4c] flex-shrink-0 mt-0.5"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                      clipRule="evenodd"
                    />
                  </svg>
                  <span className="text-gray-700">
                    Snabbsök efter hund, ägare eller telefonnummer
                  </span>
                </li>
                <li className="flex items-start gap-3">
                  <svg
                    className="w-6 h-6 text-[#2c7a4c] flex-shrink-0 mt-0.5"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                      clipRule="evenodd"
                    />
                  </svg>
                  <span className="text-gray-700">
                    Filtrera på abonnemang: Heltid, Deltid eller Dagshundar
                  </span>
                </li>
                <li className="flex items-start gap-3">
                  <svg
                    className="w-6 h-6 text-[#2c7a4c] flex-shrink-0 mt-0.5"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                      clipRule="evenodd"
                    />
                  </svg>
                  <span className="text-gray-700">
                    Exportera till PDF för utskrift
                  </span>
                </li>
              </ul>
            </div>
            <div className="bg-gradient-to-br from-[#2c7a4c] to-[#236139] p-8 rounded-2xl shadow-xl">
              <div className="text-white text-sm font-semibold mb-4">
                DAGISVY
              </div>
              <div className="bg-white/10 backdrop-blur rounded-lg p-4 mb-4">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-white font-semibold">
                    Bella (Golden Retriever)
                  </span>
                  <span className="px-2 py-1 bg-green-400 text-green-900 rounded text-xs font-semibold">
                    Heltid
                  </span>
                </div>
                <div className="text-white/80 text-sm">
                  📞 Anna Andersson • 070-123 45 67
                </div>
                <div className="text-white/70 text-xs mt-2">
                  📍 Rum A • Må-Fr
                </div>
              </div>
              <div className="bg-white/10 backdrop-blur rounded-lg p-4 mb-4">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-white font-semibold">
                    Max (Labrador)
                  </span>
                  <span className="px-2 py-1 bg-blue-400 text-blue-900 rounded text-xs font-semibold">
                    Deltid 3
                  </span>
                </div>
                <div className="text-white/80 text-sm">
                  📞 Erik Eriksson • 073-987 65 43
                </div>
                <div className="text-white/70 text-xs mt-2">
                  📍 Rum B • Må, On, Fr
                </div>
              </div>
              <div className="text-white/60 text-sm text-center">
                + 18 andra hundar
              </div>
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-12 items-center mb-20">
            <div className="order-2 md:order-1">
              <div className="bg-gradient-to-br from-blue-500 to-blue-600 p-8 rounded-2xl shadow-xl">
                <div className="text-white text-sm font-semibold mb-4">
                  HUNDPROFIL
                </div>
                <div className="bg-white rounded-xl p-6">
                  <div className="flex items-start gap-4 mb-4">
                    <div className="w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center text-3xl">
                      🐕
                    </div>
                    <div>
                      <h4 className="font-bold text-gray-900 text-lg">Luna</h4>
                      <p className="text-gray-600 text-sm">
                        Border Collie • 3 år
                      </p>
                    </div>
                  </div>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between py-2 border-b">
                      <span className="text-gray-600">Försäkring</span>
                      <span className="font-semibold text-gray-900">Agria</span>
                    </div>
                    <div className="flex justify-between py-2 border-b">
                      <span className="text-gray-600">Vaccination</span>
                      <span className="font-semibold text-green-600">
                        ✓ Giltig
                      </span>
                    </div>
                    <div className="flex justify-between py-2">
                      <span className="text-gray-600">Mat</span>
                      <span className="font-semibold text-gray-900">
                        2 dl • 2 ggr/dag
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div className="order-1 md:order-2">
              <div className="inline-block px-4 py-1 bg-blue-100 text-blue-600 rounded-full text-sm font-semibold mb-4">
                📋 HUNDREGISTER
              </div>
              <h3 className="text-3xl font-bold text-gray-900 mb-4">
                All info om varje hund
              </h3>
              <p className="text-lg text-gray-600 mb-6">
                Mediciner, allergier, kontaktuppgifter - allt på ett ställe. När
                ägaren ringer kan du svara direkt utan att leta.
              </p>
              <ul className="space-y-3">
                <li className="flex items-start gap-3">
                  <svg
                    className="w-6 h-6 text-blue-500 flex-shrink-0 mt-0.5"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                      clipRule="evenodd"
                    />
                  </svg>
                  <span className="text-gray-700">
                    Matschema, mediciner och vårdanteckningar
                  </span>
                </li>
                <li className="flex items-start gap-3">
                  <svg
                    className="w-6 h-6 text-blue-500 flex-shrink-0 mt-0.5"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                      clipRule="evenodd"
                    />
                  </svg>
                  <span className="text-gray-700">
                    Ägarinformation + kontaktperson 2
                  </span>
                </li>
                <li className="flex items-start gap-3">
                  <svg
                    className="w-6 h-6 text-blue-500 flex-shrink-0 mt-0.5"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                      clipRule="evenodd"
                    />
                  </svg>
                  <span className="text-gray-700">
                    Försäkrings- och vaccinationsuppgifter
                  </span>
                </li>
              </ul>
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <div className="inline-block px-4 py-1 bg-purple-100 text-purple-600 rounded-full text-sm font-semibold mb-4">
                💰 FAKTURERING
              </div>
              <h3 className="text-3xl font-bold text-gray-900 mb-4">
                Automatisk fakturering
              </h3>
              <p className="text-lg text-gray-600 mb-6">
                Systemet räknar dagarna automatiskt. Skapa fakturor med ett
                klick. Lägg till tillvalstjänster som kloklippning eller bad.
              </p>
              <ul className="space-y-3">
                <li className="flex items-start gap-3">
                  <svg
                    className="w-6 h-6 text-purple-500 flex-shrink-0 mt-0.5"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                      clipRule="evenodd"
                    />
                  </svg>
                  <span className="text-gray-700">
                    Räknar automatiskt antal dagar per månad
                  </span>
                </li>
                <li className="flex items-start gap-3">
                  <svg
                    className="w-6 h-6 text-purple-500 flex-shrink-0 mt-0.5"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                      clipRule="evenodd"
                    />
                  </svg>
                  <span className="text-gray-700">
                    Tillvalstjänster: kloklippning, tassklipp, bad
                  </span>
                </li>
                <li className="flex items-start gap-3">
                  <svg
                    className="w-6 h-6 text-purple-500 flex-shrink-0 mt-0.5"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                      clipRule="evenodd"
                    />
                  </svg>
                  <span className="text-gray-700">
                    Exportera till PDF eller Excel
                  </span>
                </li>
              </ul>
            </div>
            <div className="bg-gradient-to-br from-purple-500 to-purple-600 p-8 rounded-2xl shadow-xl">
              <div className="text-white text-sm font-semibold mb-4">
                FAKTURA #2025-003
              </div>
              <div className="bg-white rounded-xl p-6">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h4 className="font-bold text-gray-900">Anna Andersson</h4>
                    <p className="text-gray-600 text-sm">Bella • Heltid</p>
                  </div>
                  <div className="text-right">
                    <p className="text-gray-600 text-sm">Oktober 2025</p>
                  </div>
                </div>
                <div className="space-y-2 text-sm border-t border-b py-3 my-3">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Hunddagis • 22 dagar</span>
                    <span className="font-semibold text-gray-900">
                      5 500 kr
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Kloklippning • 1 st</span>
                    <span className="font-semibold text-gray-900">150 kr</span>
                  </div>
                </div>
                <div className="flex justify-between items-center">
                  <span className="font-bold text-gray-900">Totalt</span>
                  <span className="text-2xl font-bold text-[#2c7a4c]">
                    5 650 kr
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Social Proof */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              Hundverksamheter sparar 10+ timmar/vecka
            </h2>
            <p className="text-xl text-gray-600">
              Mindre admin, mer tid med hundarna
            </p>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="bg-white p-8 rounded-xl shadow-sm">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                  <span className="text-2xl">👤</span>
                </div>
                <div>
                  <div className="font-semibold text-gray-900">
                    Marias Hunddagis
                  </div>
                  <div className="text-sm text-gray-600">Stockholm</div>
                </div>
              </div>
              <p className="text-gray-700 italic">
                "Slutade med Excel direkt. Nu ser jag vilka hundar som kommer på
                måndagar med ett klick. Sparar timmar varje vecka!"
              </p>
            </div>
            <div className="bg-white p-8 rounded-xl shadow-sm">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                  <span className="text-2xl">👤</span>
                </div>
                <div>
                  <div className="font-semibold text-gray-900">
                    Lilla Tassen
                  </div>
                  <div className="text-sm text-gray-600">Göteborg</div>
                </div>
              </div>
              <p className="text-gray-700 italic">
                "Faktureringen tog typ 5 sekunder istället för 2 timmar. Kan
                inte förstå hur jag kunde jobba utan förut."
              </p>
            </div>
            <div className="bg-white p-8 rounded-xl shadow-sm">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center">
                  <span className="text-2xl">👤</span>
                </div>
                <div>
                  <div className="font-semibold text-gray-900">Happy Dogs</div>
                  <div className="text-sm text-gray-600">Malmö</div>
                </div>
              </div>
              <p className="text-gray-700 italic">
                "Äntligen slipper jag papperslappar. All hundinfo på ett ställe,
                kan svara ägare direkt när de ringer."
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              Enkel prissättning
            </h2>
            <p className="text-xl text-gray-600">
              Betala bara för det du använder. Ingen bindningstid.
            </p>
          </div>
          <div className="max-w-2xl mx-auto">
            <div className="bg-gradient-to-br from-[#2c7a4c] to-[#236139] rounded-2xl p-8 md:p-12 text-white shadow-2xl">
              <div className="text-center mb-8">
                <div className="text-5xl font-bold mb-2">
                  299 kr
                  <span className="text-2xl font-normal text-white/80">
                    /månad
                  </span>
                </div>
                <p className="text-white/90 text-lg">
                  För hunddagis, pensionat eller frisör
                </p>
              </div>
              <ul className="space-y-4 mb-8">
                <li className="flex items-start gap-3">
                  <svg
                    className="w-6 h-6 text-green-300 flex-shrink-0 mt-0.5"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                      clipRule="evenodd"
                    />
                  </svg>
                  <span>Obegränsat antal hundar och bokningar</span>
                </li>
                <li className="flex items-start gap-3">
                  <svg
                    className="w-6 h-6 text-green-300 flex-shrink-0 mt-0.5"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                      clipRule="evenodd"
                    />
                  </svg>
                  <span>Hundregister med alla uppgifter</span>
                </li>
                <li className="flex items-start gap-3">
                  <svg
                    className="w-6 h-6 text-green-300 flex-shrink-0 mt-0.5"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                      clipRule="evenodd"
                    />
                  </svg>
                  <span>Automatisk fakturering</span>
                </li>
                <li className="flex items-start gap-3">
                  <svg
                    className="w-6 h-6 text-green-300 flex-shrink-0 mt-0.5"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                      clipRule="evenodd"
                    />
                  </svg>
                  <span>Rumshantering med Jordbruksverkets regler</span>
                </li>
                <li className="flex items-start gap-3">
                  <svg
                    className="w-6 h-6 text-green-300 flex-shrink-0 mt-0.5"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                      clipRule="evenodd"
                    />
                  </svg>
                  <span>
                    ✨ <strong>Prova gratis i 2 månader</strong>
                  </span>
                </li>
              </ul>
              <Link
                href="/register"
                className="block w-full text-center px-8 py-4 bg-white text-[#2c7a4c] rounded-lg hover:bg-gray-50 font-bold text-lg transition-all shadow-lg hover:shadow-xl"
              >
                Kom igång gratis nu
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-20 bg-gradient-to-br from-[#2c7a4c] to-[#236139]">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
            Redo att slippa Excel-kaoset?
          </h2>
          <p className="text-xl text-white/90 mb-8">
            Starta gratis idag. Ingen bindningstid, inget krångel.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/register"
              className="px-8 py-4 bg-white text-[#2c7a4c] rounded-lg hover:bg-gray-50 font-bold text-lg transition-all shadow-lg hover:shadow-xl"
            >
              🚀 Starta gratis provperiod
            </Link>
            <Link
              href="/login"
              className="px-8 py-4 border-2 border-white text-white rounded-lg hover:bg-white/10 font-semibold text-lg transition-all backdrop-blur"
            >
              Logga in
            </Link>
          </div>
          <p className="text-white/80 mt-6">
            Gratis i 2 månader • Sedan 299 kr/månad • Avsluta när du vill
          </p>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid md:grid-cols-4 gap-8 mb-8">
            <div>
              <Link
                href="/dashboard"
                className="flex items-center gap-2 mb-4 hover:opacity-90 transition-opacity"
              >
                <Image
                  src="/logo.png"
                  alt="DogPlanner"
                  width={40}
                  height={40}
                  className="rounded-lg"
                />
                <span className="font-bold text-xl">DogPlanner</span>
              </Link>
              <p className="text-gray-400 text-sm">
                Hantera ditt hunddagis enklare. Slipp Excel-kaos och
                papperslappar.
              </p>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Produkt</h4>
              <ul className="space-y-2 text-sm text-gray-400">
                <li>
                  <Link
                    href="/register"
                    className="hover:text-white transition-colors"
                  >
                    Priser
                  </Link>
                </li>
                <li>
                  <Link
                    href="/login"
                    className="hover:text-white transition-colors"
                  >
                    Logga in
                  </Link>
                </li>
                <li>
                  <Link
                    href="/register"
                    className="hover:text-white transition-colors"
                  >
                    Kom igång
                  </Link>
                </li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Företag</h4>
              <ul className="space-y-2 text-sm text-gray-400">
                <li>
                  <Link
                    href="/terms"
                    className="hover:text-white transition-colors"
                  >
                    Villkor
                  </Link>
                </li>
                <li>
                  <a
                    href="mailto:gdpr@dogplanner.se"
                    className="hover:text-white transition-colors"
                  >
                    Integritet (GDPR)
                  </a>
                </li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Support</h4>
              <ul className="space-y-2 text-sm text-gray-400">
                <li>
                  <a
                    href="mailto:support@dogplanner.se"
                    className="hover:text-white transition-colors"
                  >
                    support@dogplanner.se
                  </a>
                </li>
                <li className="text-gray-500">Svarar inom 24h</li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-800 pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="text-sm text-gray-400">
              © {new Date().getFullYear()} DogPlanner. Alla rättigheter
              förbehållna.
            </div>
            <div className="text-sm text-gray-400">
              Made with 💚 för hundverksamheter i Sverige
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
