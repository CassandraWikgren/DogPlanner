"use client";

import Link from "next/link";
import Image from "next/image";
import { useAuth } from "@/app/context/AuthContext";
import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function HomePage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  // Inloggade användare ska redirecta till dashboard
  useEffect(() => {
    if (!loading && user) {
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

  // B2C Landing page - För hundägare som vill boka dagis/pensionat
  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <nav className="bg-white border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-[1600px] mx-auto px-16 sm:px-24 lg:px-32 py-4 flex items-center justify-between">
          <Link
            href="/"
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
          <div className="flex items-center gap-6">
            <Link href="/" className="text-[#2c7a4c] font-semibold">
              För hundägare
            </Link>
            <Link
              href="/foretag"
              className="text-gray-700 hover:text-[#2c7a4c] font-medium transition-colors"
            >
              För företag
            </Link>
            <div className="h-6 w-px bg-gray-300"></div>
            <Link
              href="/login"
              className="text-gray-700 hover:text-[#2c7a4c] font-medium transition-colors"
            >
              Logga in
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
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
          className="relative max-w-[1600px] mx-auto px-16 sm:px-24 lg:px-32 py-20 md:py-32"
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
              Trygg omsorg för din hund
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
              Boka hunddagis eller pensionat hos Sveriges modernaste
              hundverksamheter. Enkelt, tryggt och professionellt.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 mb-6">
              <Link
                href="/ansokan/hunddagis"
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
                🐕 Boka hunddagis
              </Link>
              <Link
                href="/ansokan/pensionat"
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
                🏠 Boka pensionat
              </Link>
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
                Erfaren personal
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
                Försäkrad verksamhet
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* Services Section */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-[1600px] mx-auto px-16 sm:px-24 lg:px-32">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              Våra tjänster
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Professionell omsorg för din hund - vare sig det gäller daglig tillsyn eller längre vistelser
            </p>
          </div>
          <div className="grid md:grid-cols-2 gap-8">
            <div className="bg-white p-8 rounded-xl shadow-sm border border-gray-200">
              <div className="text-4xl mb-4">�</div>
              <h3 className="text-2xl font-semibold text-gray-900 mb-3">
                Hunddagis
              </h3>
              <p className="text-gray-600 mb-4">
                Låt din hund umgås och leka under dagen medan du är på jobbet. Erfaren personal, trygga lokaler och roliga aktiviteter.
              </p>
              <ul className="space-y-2 mb-6">
                <li className="flex items-start gap-2 text-gray-700">
                  <svg className="w-5 h-5 text-[#2c7a4c] flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  <span>Flexibla abonnemang - heltid, deltid eller dagshund</span>
                </li>
                <li className="flex items-start gap-2 text-gray-700">
                  <svg className="w-5 h-5 text-[#2c7a4c] flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  <span>Anpassade rum efter hundens behov</span>
                </li>
                <li className="flex items-start gap-2 text-gray-700">
                  <svg className="w-5 h-5 text-[#2c7a4c] flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  <span>Daglig motion och aktivering</span>
                </li>
              </ul>
              <Link
                href="/ansokan/hunddagis"
                className="inline-block px-6 py-3 bg-[#2c7a4c] text-white rounded-lg hover:bg-[#236139] font-medium transition-all"
              >
                Boka hunddagis →
              </Link>
            </div>
            <div className="bg-white p-8 rounded-xl shadow-sm border border-gray-200">
              <div className="text-4xl mb-4">🏠</div>
              <h3 className="text-2xl font-semibold text-gray-900 mb-3">
                Hundpensionat
              </h3>
              <p className="text-gray-600 mb-4">
                Trygg boende för din hund när du är bortrest. Bekväma rum, regelbundna promenader och omtänksam personal dygnet runt.
              </p>
              <ul className="space-y-2 mb-6">
                <li className="flex items-start gap-2 text-gray-700">
                  <svg className="w-5 h-5 text-[#2c7a4c] flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  <span>Individuella rum för optimal vila</span>
                </li>
                <li className="flex items-start gap-2 text-gray-700">
                  <svg className="w-5 h-5 text-[#2c7a4c] flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  <span>Måltider enligt din hunds schema</span>
                </li>
                <li className="flex items-start gap-2 text-gray-700">
                  <svg className="w-5 h-5 text-[#2c7a4c] flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  <span>Mediciner och specialkost hanteras</span>
                </li>
              </ul>
              <Link
                href="/ansokan/pensionat"
                className="inline-block px-6 py-3 bg-[#2c7a4c] text-white rounded-lg hover:bg-[#236139] font-medium transition-all"
              >
                Boka pensionat →
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Why Choose Us */}
      <section className="py-20 bg-white">
        <div className="max-w-[1600px] mx-auto px-16 sm:px-24 lg:px-32">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              Därför är din hund trygg hos oss
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Vi tar hundomsorgen på allvar och följer alla branschstandarder
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 mb-16">
            <div className="text-center">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-[#2c7a4c]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                Försäkrad verksamhet
              </h3>
              <p className="text-gray-600">
                Fullständig ansvarsförsäkring och godkänd av Jordbruksverket enligt gällande djurskyddslagstiftning.
              </p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                Erfaren personal
              </h3>
              <p className="text-gray-600">
                Utbildad personal med lång erfarenhet av hundvård. Vi känner igen tecken på stress och anpassar omsorgen.
              </p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                Moderna lokaler
              </h3>
              <p className="text-gray-600">
                Ändamålsenliga lokaler med rätt storlek på rum enligt Jordbruksverkets rekommendationer för hundens storlek.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-[1600px] mx-auto px-16 sm:px-24 lg:px-32">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              Vad hundägare säger
            </h2>
            <p className="text-xl text-gray-600">
              Läs om andra hundägares upplevelser
            </p>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="bg-white p-8 rounded-xl shadow-sm">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                  <span className="text-2xl">👤</span>
                </div>
                <div>
                  <div className="font-semibold text-gray-900">Anna</div>
                  <div className="text-sm text-gray-600">Bella, Golden Retriever</div>
                </div>
              </div>
              <p className="text-gray-700 italic">
                "Bella älskar att gå till dagiset! Personalen är jättebra och jag känner mig helt trygg. Kan varmt rekommendera!"
              </p>
            </div>
            <div className="bg-white p-8 rounded-xl shadow-sm">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                  <span className="text-2xl">👤</span>
                </div>
                <div>
                  <div className="font-semibold text-gray-900">Erik</div>
                  <div className="text-sm text-gray-600">Max, Labrador</div>
                </div>
              </div>
              <p className="text-gray-700 italic">
                "Lämnade Max på pensionat i två veckor. Fick uppdateringar varje dag och han var pigg och glad när vi hämtade!"
              </p>
            </div>
            <div className="bg-white p-8 rounded-xl shadow-sm">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center">
                  <span className="text-2xl">👤</span>
                </div>
                <div>
                  <div className="font-semibold text-gray-900">Maria</div>
                  <div className="text-sm text-gray-600">Luna, Border Collie</div>
                </div>
              </div>
              <p className="text-gray-700 italic">
                "Bästa dagis! Luna kommer hem trött och nöjd varje dag. Personalen är professionella och verkligen bryr sig."
              </p>
            </div>
          </div>
        </div>
      </section>
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
        <div className="max-w-[1600px] mx-auto px-16 sm:px-24 lg:px-32">
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
        <div className="max-w-[1600px] mx-auto px-16 sm:px-24 lg:px-32">
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

      {/* FAQ Section */}
      <section className="py-20 bg-white">
        <div className="max-w-[1600px] mx-auto px-16 sm:px-24 lg:px-32">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              Vanliga frågor
            </h2>
            <p className="text-xl text-gray-600">
              Här hittar du svar på de vanligaste frågorna om våra tjänster
            </p>
          </div>
          <div className="max-w-3xl mx-auto space-y-6">
            <details className="bg-gray-50 rounded-lg p-6">
              <summary className="font-semibold text-gray-900 cursor-pointer">
                Vad krävs för att min hund ska kunna gå på dagis eller pensionat?
              </summary>
              <p className="text-gray-600 mt-3">
                Din hund behöver ha giltiga vaccinationer, vara försäkrad och socialiserad med andra hundar. Vi gör alltid en introduktion där vi träffar dig och din hund för att säkerställa att det är en bra match.
              </p>
            </details>
            <details className="bg-gray-50 rounded-lg p-6">
              <summary className="font-semibold text-gray-900 cursor-pointer">
                Hur bokar jag en plats?
              </summary>
              <p className="text-gray-600 mt-3">
                Fyll i vårt bokningsformulär för antingen hunddagis eller pensionat. Vi kontaktar dig inom 24 timmar för att bekräfta bokningen och boka in en introduktion om det är första gången.
              </p>
            </details>
            <details className="bg-gray-50 rounded-lg p-6">
              <summary className="font-semibold text-gray-900 cursor-pointer">
                Vad händer om min hund blir sjuk under vistelsen?
              </summary>
              <p className="text-gray-600 mt-3">
                Vi kontaktar dig omedelbart om din hund visar tecken på sjukdom eller skada. Vi har rutiner för att hantera akuta situationer och samarbetar med veterinärer i närheten om det skulle behövas.
              </p>
            </details>
            <details className="bg-gray-50 rounded-lg p-6">
              <summary className="font-semibold text-gray-900 cursor-pointer">
                Kan min hund få sin egen mat och medicin?
              </summary>
              <p className="text-gray-600 mt-3">
                Absolut! Vi följer din hunds ordinarie matschema och ger mediciner enligt dina instruktioner. Ta med egen mat och mediciner märkta med hundens namn.
              </p>
            </details>
            <details className="bg-gray-50 rounded-lg p-6">
              <summary className="font-semibold text-gray-900 cursor-pointer">
                Vilka tider kan jag lämna och hämta min hund?
              </summary>
              <p className="text-gray-600 mt-3">
                Våra öppettider varierar beroende på anläggning. Normalt är öppet 7:00-18:00 på vardagar. Kontakta oss för specifika öppettider och för att diskutera särskilda behov.
              </p>
            </details>
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-20 bg-gradient-to-br from-[#2c7a4c] to-[#236139]">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
            Redo att boka för din hund?
          </h2>
          <p className="text-xl text-white/90 mb-8">
            Enkel bokning online. Svar inom 24 timmar.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/ansokan/hunddagis"
              className="px-8 py-4 bg-white text-[#2c7a4c] rounded-lg hover:bg-gray-50 font-bold text-lg transition-all shadow-lg hover:shadow-xl"
            >
              � Boka hunddagis
            </Link>
            <Link
              href="/ansokan/pensionat"
              className="px-8 py-4 border-2 border-white text-white rounded-lg hover:bg-white/10 font-semibold text-lg transition-all backdrop-blur"
            >
              🏠 Boka pensionat
            </Link>
          </div>
          <p className="text-white/80 mt-6">
            Trygg och professionell omsorg • Erfaren personal • Moderna lokaler
          </p>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="max-w-[1600px] mx-auto px-16 sm:px-24 lg:px-32">
          <div className="grid md:grid-cols-4 gap-8 mb-8">
            <div>
              <Link
                href="/"
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
                Trygg och professionell omsorg för din hund.
              </p>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Tjänster</h4>
              <ul className="space-y-2 text-sm text-gray-400">
                <li>
                  <Link
                    href="/ansokan/hunddagis"
                    className="hover:text-white transition-colors"
                  >
                    Hunddagis
                  </Link>
                </li>
                <li>
                  <Link
                    href="/ansokan/pensionat"
                    className="hover:text-white transition-colors"
                  >
                    Hundpensionat
                  </Link>
                </li>
                <li>
                  <Link
                    href="/foretag"
                    className="hover:text-white transition-colors"
                  >
                    För företag
                  </Link>
                </li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Information</h4>
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
                  <Link
                    href="/gdpr"
                    className="hover:text-white transition-colors"
                  >
                    Integritetspolicy
                  </Link>
                </li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Kontakt</h4>
              <ul className="space-y-2 text-sm text-gray-400">
                <li>
                  <a
                    href="mailto:info@dogplanner.se"
                    className="hover:text-white transition-colors"
                  >
                    info@dogplanner.se
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
              Made with 💚 för hundar i Sverige
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
