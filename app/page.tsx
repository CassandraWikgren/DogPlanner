import Link from "next/link";
import { Calendar, CreditCard, BarChart3 } from "lucide-react";

export default function HomePage() {
  return (
    <div className="min-h-screen flex flex-col bg-white">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white border-b border-gray-200">
        <div className="max-w-6xl mx-auto flex justify-between items-center px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-[#2c7a4c] rounded-xl flex items-center justify-center">
              <span className="text-white text-2xl">🐕</span>
            </div>
            <span className="font-bold text-xl text-gray-900">DogPlanner</span>
          </div>
          <div className="flex gap-3">
            <Link
              href="/login"
              className="px-4 py-2 font-medium text-gray-700 hover:text-[#2c7a4c] transition"
            >
              Logga in
            </Link>
            <Link
              href="/register"
              className="px-6 py-2 font-semibold bg-[#2c7a4c] text-white rounded-lg hover:bg-[#236139] transition"
            >
              Prova gratis
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section - Compact */}
      <section className="relative bg-gradient-to-br from-[#2c7a4c] to-[#1f5738] text-white py-20">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <h1 className="text-4xl md:text-5xl font-bold mb-5">
            Få full koll på din hundverksamhet
          </h1>
          <p className="text-lg md:text-xl text-green-100 mb-8 max-w-2xl mx-auto">
            DogPlanner gör det enkelt att driva hunddagis och pensionat.
            <br />
            Mer tid för hundarna, mindre för papper.
          </p>
          <Link
            href="/register"
            className="inline-block px-8 py-3 bg-white text-[#2c7a4c] font-bold rounded-lg hover:bg-gray-100 transition text-lg shadow-lg"
          >
            Prova gratis i 2 månader
          </Link>
        </div>
      </section>

      {/* Why Choose Section - Compact */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-5xl mx-auto px-6">
          <h2 className="text-3xl font-bold text-center text-gray-900 mb-12">
            Varför välja DogPlanner?
          </h2>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="w-16 h-16 bg-[#2c7a4c] rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Calendar className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Spara tid
              </h3>
              <p className="text-gray-600 text-sm">
                All planering samlad på ett ställe – schema, bokningar och
                notiser hanteras enkelt.
              </p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-[#2c7a4c] rounded-2xl flex items-center justify-center mx-auto mb-4">
                <BarChart3 className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Ha full kontroll
              </h3>
              <p className="text-gray-600 text-sm">
                Få en tydlig överblick över hundar, kunder och personal i
                realtid.
              </p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-[#2c7a4c] rounded-2xl flex items-center justify-center mx-auto mb-4">
                <CreditCard className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Smidig fakturering
              </h3>
              <p className="text-gray-600 text-sm">
                Automatisera abonnemang och fakturor så du slipper manuell
                hantering.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer - Simple */}
      <footer className="bg-gray-900 text-gray-400 py-8 mt-auto">
        <div className="max-w-6xl mx-auto px-6">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="text-sm">
              © {new Date().getFullYear()} DogPlanner — Alla rättigheter
              förbehållna
            </div>
            <div className="flex gap-6 text-sm">
              <Link href="/terms" className="hover:text-white transition">
                Villkor
              </Link>
              <a
                href="mailto:gdpr@dogplanner.se"
                className="hover:text-white transition"
              >
                Integritetspolicy
              </a>
              <a
                href="mailto:support@dogplanner.se"
                className="hover:text-white transition"
              >
                Kontakt
              </a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
