"use client";

import Link from "next/link";
import Image from "next/image";
import Head from "next/head";
import { useAuth } from "@/app/context/AuthContext";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import PublicNav from "@/components/PublicNav";
import BookingOptionsModal from "@/components/BookingOptionsModal";

export default function HomePage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [showBookingModal, setShowBookingModal] = useState(false);
  const [bookingType, setBookingType] = useState<"hunddagis" | "pensionat">(
    "pensionat"
  );

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
      <PublicNav currentPage="customer" />

      {/* Hero Section */}
      <section
        className="relative bg-cover bg-center"
        style={{
          backgroundImage: "url('/Hero.jpeg')",
          minHeight: "600px",
          backgroundSize: "cover",
          backgroundPosition: "center",
        }}
      >
        {/* Gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-r from-primary/90 to-primary/70"></div>

        {/* Content */}
        <div className="relative max-w-[1600px] mx-auto px-6 md:px-16 lg:px-32 py-20 md:py-32">
          <div className="max-w-2xl">
            <h1 className="text-4xl md:text-5xl font-bold text-white mb-6 leading-tight drop-shadow-lg">
              Hitta trygg omsorg för din hund
            </h1>
            <p className="text-lg md:text-xl text-white/95 mb-8 leading-relaxed drop-shadow-md">
              DogPlanner hjälper dig att hitta och boka hunddagis eller
              pensionat hos Sveriges modernaste hundverksamheter. Enkelt, tryggt
              och professionellt.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 mb-6">
              <Link
                href="/ansokan/hunddagis"
                className="px-8 py-4 bg-white text-primary rounded-lg hover:bg-gray-50 font-bold text-lg transition-all shadow-lg hover:shadow-xl text-center"
              >
                🐕 Boka hunddagis
              </Link>
              <button
                onClick={() => {
                  setBookingType("pensionat");
                  setShowBookingModal(true);
                }}
                className="px-8 py-4 border-2 border-white text-white rounded-lg hover:bg-white/10 font-semibold text-lg transition-all backdrop-blur text-center"
              >
                🏠 Boka pensionat
              </button>
            </div>

            {/* Bokningsmodal */}
            <BookingOptionsModal
              isOpen={showBookingModal}
              onClose={() => setShowBookingModal(false)}
              bookingType={bookingType}
            />
            <div className="flex flex-wrap items-center gap-4 text-white/90 text-sm">
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
              Tjänster via anslutna hundverksamheter
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Vi samarbetar med verifierade hunddagis och hundpensionat över
              hela Sverige som erbjuder professionell hundomsorg
            </p>
          </div>
          <div className="grid md:grid-cols-2 gap-8">
            <div className="bg-white p-8 rounded-xl shadow-sm border border-gray-200">
              <div className="text-4xl mb-4">🐕</div>
              <h3 className="text-2xl font-semibold text-gray-900 mb-3">
                Hunddagis
              </h3>
              <p className="text-gray-600 mb-4">
                Låt din hund umgås och leka under dagen medan du är på jobbet.
                Erfaren personal, trygga lokaler och roliga aktiviteter.
              </p>
              <ul className="space-y-2 mb-6">
                <li className="flex items-start gap-2 text-gray-700">
                  <svg
                    className="w-5 h-5 text-primary flex-shrink-0 mt-0.5"
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
                    Flexibla abonnemang - heltid, deltid eller dagshund
                  </span>
                </li>
                <li className="flex items-start gap-2 text-gray-700">
                  <svg
                    className="w-5 h-5 text-primary flex-shrink-0 mt-0.5"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                      clipRule="evenodd"
                    />
                  </svg>
                  <span>Anpassade rum efter hundens behov</span>
                </li>
                <li className="flex items-start gap-2 text-gray-700">
                  <svg
                    className="w-5 h-5 text-primary flex-shrink-0 mt-0.5"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                      clipRule="evenodd"
                    />
                  </svg>
                  <span>Daglig motion och aktivering</span>
                </li>
              </ul>
              <Link
                href="/ansokan/hunddagis"
                className="inline-block px-6 py-3 bg-primary text-white rounded-lg hover:bg-primary-dark font-medium transition-all"
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
                Trygg boende för din hund när du är bortrest. Bekväma rum,
                regelbundna promenader och omtänksam personal dygnet runt.
              </p>
              <ul className="space-y-2 mb-6">
                <li className="flex items-start gap-2 text-gray-700">
                  <svg
                    className="w-5 h-5 text-primary flex-shrink-0 mt-0.5"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                      clipRule="evenodd"
                    />
                  </svg>
                  <span>Individuella rum för optimal vila</span>
                </li>
                <li className="flex items-start gap-2 text-gray-700">
                  <svg
                    className="w-5 h-5 text-primary flex-shrink-0 mt-0.5"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                      clipRule="evenodd"
                    />
                  </svg>
                  <span>Måltider enligt din hunds schema</span>
                </li>
                <li className="flex items-start gap-2 text-gray-700">
                  <svg
                    className="w-5 h-5 text-primary flex-shrink-0 mt-0.5"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                      clipRule="evenodd"
                    />
                  </svg>
                  <span>Mediciner och specialkost hanteras</span>
                </li>
              </ul>
              <Link
                href="/ansokan/pensionat"
                className="inline-block px-6 py-3 bg-primary text-white rounded-lg hover:bg-primary-dark font-medium transition-all"
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
              Hur DogPlanner fungerar
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              DogPlanner är en plattform som kopplar samman hundägare med
              verifierade hundverksamheter. Vi underlättar bokningsprocessen,
              men varje företag ansvarar för sin egen verksamhet och kvalitet.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 mb-16">
            <div className="text-center">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg
                  className="w-8 h-8 text-primary"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                  />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                1. Hitta och jämför
              </h3>
              <p className="text-gray-600">
                Sök bland anslutna hunddagis och pensionat i ditt område.
                Filtrera på plats och tjänster.
              </p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg
                  className="w-8 h-8 text-blue-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                  />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                2. Skicka ansökan
              </h3>
              <p className="text-gray-600">
                Fyll i formuläret och skicka din ansökan direkt till det valda
                företaget via vår plattform.
              </p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg
                  className="w-8 h-8 text-purple-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                3. Företaget hör av sig
              </h3>
              <p className="text-gray-600">
                Det valda företaget kontaktar dig med prisuppgift och
                bekräftelse. Du kommunicerar direkt med dem.
              </p>
            </div>
          </div>

          <div className="max-w-3xl mx-auto p-6 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-sm text-blue-900">
              <strong>📋 Viktigt att veta:</strong> DogPlanner är en
              bokningsplattform som underlättar kontakten mellan hundägare och
              hundverksamheter. Alla anslutna företag är verifierade som
              registrerade svenska företag, men varje företag ansvarar själv för
              sin verksamhet, kvalitet och följsamhet till
              djurskyddslagstiftning.{" "}
              <strong>
                Läs alltid företagets egna villkor, avbokningsregler och
                försäkringar innan du bekräftar en bokning.
              </strong>{" "}
              DogPlanner tillhandahåller systemet men garanterar inte för
              individuella företags tjänster.
            </p>
          </div>
        </div>
      </section>

      {/* What businesses offer */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-[1600px] mx-auto px-16 sm:px-24 lg:px-32">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              Vad anslutna företag erbjuder
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Våra partnersföretag erbjuder professionell hundomsorg med moderna
              lokaler och erfaren personal
            </p>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg
                  className="w-8 h-8 text-primary"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
                  />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                Verifierade företag
              </h3>
              <p className="text-gray-600">
                Alla anslutna företag är registrerade svenska företag. De flesta
                följer Jordbruksverkets rekommendationer för hundomsorg.
              </p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg
                  className="w-8 h-8 text-blue-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                  />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                Erfaren personal
              </h3>
              <p className="text-gray-600">
                De flesta anslutna företag har utbildad personal med lång
                erfarenhet av hundvård och känner igen tecken på stress.
              </p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg
                  className="w-8 h-8 text-purple-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
                  />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                Moderna lokaler
              </h3>
              <p className="text-gray-600">
                Många av våra partnersföretag har ändamålsenliga lokaler med
                rätt storlek på rum enligt Jordbruksverkets rekommendationer.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Original "Why Choose Us" becomes "Why Use DogPlanner" */}
      <section className="py-20 bg-white">
        <div className="max-w-[1600px] mx-auto px-16 sm:px-24 lg:px-32">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              Därför ska du använda DogPlanner
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Vi gör det enklare att hitta och boka hundomsorg i hela Sverige
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 mb-16">
            <div className="text-center">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg
                  className="w-8 h-8 text-primary"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
                  />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                Enkelt att använda
              </h3>
              <p className="text-gray-600">
                Hitta och jämför hundverksamheter på en plats. Skicka
                ansökningar digitalt istället för att ringa runt.
              </p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg
                  className="w-8 h-8 text-blue-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
                  />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                Spara tid
              </h3>
              <p className="text-gray-600">
                Fyll i ett formulär istället för många. Alla dina bokningar och
                hunduppgifter på samma ställe.
              </p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg
                  className="w-8 h-8 text-purple-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 11c0 3.517-1.009 6.799-2.753 9.571m-3.44-2.04l.054-.09A13.916 13.916 0 008 11a4 4 0 118 0c0 1.017-.07 2.019-.203 3m-2.118 6.844A21.88 21.88 0 0015.171 17m3.839 1.132c.645-2.266.99-4.659.99-7.132A8 8 0 008 4.07M3 15.364c.64-1.319 1-2.8 1-4.364 0-1.457.39-2.823 1.07-4"
                  />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                GDPR-säkert
              </h3>
              <p className="text-gray-600">
                Vi hanterar dina personuppgifter enligt GDPR och delar endast
                information med det företag du väljer att ansöka till.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials - Keep mostly the same */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-[1600px] mx-auto px-16 sm:px-24 lg:px-32">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              Vad hundägare säger
            </h2>
            <p className="text-xl text-gray-600">
              Läs om andra hundägares upplevelser med våra partnersföretag
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
                  <div className="text-sm text-gray-600">
                    Bella, Golden Retriever
                  </div>
                </div>
              </div>
              <p className="text-gray-700 italic">
                "Bella älskar att gå till dagiset! Personalen är jättebra och
                jag känner mig helt trygg. Kan varmt rekommendera!"
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
                "Lämnade Max på pensionat i två veckor. Fick uppdateringar varje
                dag och han var pigg och glad när vi hämtade!"
              </p>
            </div>
            <div className="bg-white p-8 rounded-xl shadow-sm">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center">
                  <span className="text-2xl">👤</span>
                </div>
                <div>
                  <div className="font-semibold text-gray-900">Maria</div>
                  <div className="text-sm text-gray-600">
                    Luna, Border Collie
                  </div>
                </div>
              </div>
              <p className="text-gray-700 italic">
                "Bästa dagis! Luna kommer hem trött och nöjd varje dag.
                Personalen är professionella och verkligen bryr sig."
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-20 bg-white">
        <div className="max-w-[1600px] mx-auto px-16 sm:px-24 lg:px-32">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              Vanliga frågor
            </h2>
            <p className="text-xl text-gray-600">
              Här hittar du svar på de vanligaste frågorna om hur DogPlanner
              fungerar
            </p>
          </div>
          <div className="max-w-3xl mx-auto space-y-6">
            <details className="bg-gray-50 rounded-lg p-6">
              <summary className="font-semibold text-gray-900 cursor-pointer">
                Vad är DogPlanner?
              </summary>
              <p className="text-gray-600 mt-3">
                DogPlanner är en plattform som kopplar samman hundägare med
                hundverksamheter i hela Sverige. Vi underlättar
                bokningsprocessen och hjälper dig att hitta rätt dagis eller
                pensionat för din hund. Vi driver ingen egen hundverksamhet utan
                samarbetar med anslutna företag.
              </p>
            </details>
            <details className="bg-gray-50 rounded-lg p-6">
              <summary className="font-semibold text-gray-900 cursor-pointer">
                Hur bokar jag via DogPlanner?
              </summary>
              <p className="text-gray-600 mt-3">
                Välj det hunddagis eller pensionat du är intresserad av genom
                att filtrera på län och kommun. Fyll i ansökningsformuläret så
                skickas din ansökan direkt till det valda företaget. De
                återkommer till dig med prisuppgift och bekräftelse, vanligtvis
                inom 1-2 arbetsdagar.
              </p>
            </details>
            <details className="bg-gray-50 rounded-lg p-6">
              <summary className="font-semibold text-gray-900 cursor-pointer">
                Kostar det något att använda DogPlanner?
              </summary>
              <p className="text-gray-600 mt-3">
                Nej, DogPlanner är gratis för hundägare att använda. Du betalar
                endast de tjänster du bokar direkt till det företag du väljer
                att anlita. Priser varierar mellan olika verksamheter.
              </p>
            </details>
            <details className="bg-gray-50 rounded-lg p-6">
              <summary className="font-semibold text-gray-900 cursor-pointer">
                Hur vet jag att företagen är seriösa?
              </summary>
              <p className="text-gray-600 mt-3">
                Alla anslutna företag är verifierade som registrerade svenska
                företag. Vi rekommenderar starkt att du läser företagets egna
                villkor, kontrollerar deras försäkringar och eventuellt besöker
                lokalerna innan du bekräftar en bokning. Du är alltid välkommen
                att ställa frågor direkt till företaget.
              </p>
            </details>
            <details className="bg-gray-50 rounded-lg p-6">
              <summary className="font-semibold text-gray-900 cursor-pointer">
                Vad händer med mina personuppgifter?
              </summary>
              <p className="text-gray-600 mt-3">
                Dina personuppgifter hanteras enligt GDPR. När du skickar en
                ansökan delas uppgifterna endast med det företag du valt att
                ansöka till. DogPlanner sparar dina uppgifter för att underlätta
                framtida bokningar. Du kan när som helst begära att få dina
                uppgifter raderade.
              </p>
            </details>
            <details className="bg-gray-50 rounded-lg p-6">
              <summary className="font-semibold text-gray-900 cursor-pointer">
                Vad händer om det blir problem med en bokning?
              </summary>
              <p className="text-gray-600 mt-3">
                Alla frågor och eventuella problem kring bokningar, avbokningar
                och tjänsteutförande hanteras direkt mellan dig och företaget du
                bokat hos. DogPlanner är en förmedlingsplattform och kan inte
                hantera dispyter mellan hundägare och hundverksamheter. Läs
                alltid företagets avbokningsregler noggrant innan du bekräftar.
              </p>
            </details>
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-20 bg-gradient-to-br from-primary to-primary-dark">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
            Hitta rätt hunddagis eller pensionat idag
          </h2>
          <p className="text-xl text-white/90 mb-8">
            Enkel ansökan online. Företaget svarar inom 1-2 arbetsdagar.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/ansokan/hunddagis"
              className="px-8 py-4 bg-white text-primary rounded-lg hover:bg-gray-50 font-bold text-lg transition-all shadow-lg hover:shadow-xl"
            >
              🐕 Sök hunddagis
            </Link>
            <Link
              href="/ansokan/pensionat"
              className="px-8 py-4 border-2 border-white text-white rounded-lg hover:bg-white/10 font-semibold text-lg transition-all backdrop-blur"
            >
              🏠 Sök pensionat
            </Link>
          </div>
          <p className="text-white/80 mt-6">
            Gratis att använda • Verifierade företag • GDPR-säkert
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
