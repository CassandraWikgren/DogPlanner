import Link from "next/link";
import {
  Calendar,
  Users,
  TrendingUp,
  CheckCircle,
  Clock,
  Shield,
  Zap,
} from "lucide-react";

export default function HomePage() {
  return (
    <div className="min-h-screen bg-white">
      {/* Navigation */}
      <nav className="fixed top-0 w-full bg-white/80 backdrop-blur-md border-b border-gray-100 z-50">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <Link href="/" className="flex items-center gap-3 group">
              <div className="w-10 h-10 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-xl flex items-center justify-center shadow-lg shadow-emerald-500/20 group-hover:shadow-emerald-500/40 transition-all">
                <span className="text-white text-xl">�</span>
              </div>
              <span className="text-xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
                DogPlanner
              </span>
            </Link>
            <div className="flex items-center gap-4">
              <Link
                href="/login"
                className="px-4 py-2 text-sm font-medium text-gray-700 hover:text-emerald-600 transition-colors"
              >
                Logga in
              </Link>
              <Link
                href="/register"
                className="px-6 py-2.5 text-sm font-semibold bg-gradient-to-r from-emerald-500 to-emerald-600 text-white rounded-lg hover:shadow-lg hover:shadow-emerald-500/30 transition-all hover:-translate-y-0.5"
              >
                Kom igång gratis
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-32 pb-20 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="max-w-4xl mx-auto text-center">
            {/* Badge */}
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-50 border border-emerald-200 rounded-full text-sm font-medium text-emerald-700 mb-8">
              <Zap className="w-4 h-4" />
              <span>Från små verksamheter till stora anläggningar</span>
            </div>

            {/* Headline */}
            <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold text-gray-900 mb-6 leading-tight">
              Allt du behöver för att driva{" "}
              <span className="bg-gradient-to-r from-emerald-500 to-emerald-600 bg-clip-text text-transparent">
                hunddagis
              </span>
            </h1>

            {/* Subheadline */}
            <p className="text-xl md:text-2xl text-gray-600 mb-12 leading-relaxed max-w-3xl mx-auto">
              Slipp krångliga Excel-filer och papperslappar. DogPlanner samlar
              bokningar, fakturering och hundregister på ett ställe.
            </p>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-12">
              <Link
                href="/register"
                className="px-8 py-4 bg-gradient-to-r from-emerald-500 to-emerald-600 text-white font-semibold rounded-xl hover:shadow-xl hover:shadow-emerald-500/30 transition-all hover:-translate-y-1 text-lg"
              >
                Prova gratis i 2 månader
              </Link>
              <Link
                href="/login"
                className="px-8 py-4 bg-white border-2 border-gray-200 text-gray-700 font-semibold rounded-xl hover:border-emerald-500 hover:text-emerald-600 transition-all text-lg"
              >
                Se hur det fungerar
              </Link>
            </div>

            {/* Trust Indicators */}
            <div className="flex flex-wrap items-center justify-center gap-8 text-sm text-gray-600">
              <div className="flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-emerald-500" />
                <span>Ingen bindningstid</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-emerald-500" />
                <span>Inget kreditkort behövs</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-emerald-500" />
                <span>GDPR-säkert</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 px-6 bg-gray-50">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
              Allt på ett ställe
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Fokusera på hundarna – vi tar hand om administrationen
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {/* Feature 1 */}
            <div className="bg-white p-8 rounded-2xl shadow-sm hover:shadow-xl transition-shadow border border-gray-100">
              <div className="w-14 h-14 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center mb-6 shadow-lg shadow-blue-500/20">
                <Calendar className="w-7 h-7 text-white" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-3">
                Smart schemaläggning
              </h3>
              <p className="text-gray-600 leading-relaxed">
                Hantera bokningar, daglig närvaro och in-/utcheckning med några
                få klick. Se direkt vilka hundar som kommer idag.
              </p>
            </div>

            {/* Feature 2 */}
            <div className="bg-white p-8 rounded-2xl shadow-sm hover:shadow-xl transition-shadow border border-gray-100">
              <div className="w-14 h-14 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-xl flex items-center justify-center mb-6 shadow-lg shadow-emerald-500/20">
                <Users className="w-7 h-7 text-white" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-3">
                Komplett hundregister
              </h3>
              <p className="text-gray-600 leading-relaxed">
                All info om hundar och ägare på ett ställe. Mediciner,
                allergier, notiser – alltid uppdaterat och lättillgängligt.
              </p>
            </div>

            {/* Feature 3 */}
            <div className="bg-white p-8 rounded-2xl shadow-sm hover:shadow-xl transition-shadow border border-gray-100">
              <div className="w-14 h-14 bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl flex items-center justify-center mb-6 shadow-lg shadow-purple-500/20">
                <TrendingUp className="w-7 h-7 text-white" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-3">
                Automatisk fakturering
              </h3>
              <p className="text-gray-600 leading-relaxed">
                Skapa och skicka fakturor automatiskt varje månad. Abonnemang,
                engångstjänster och tillval – allt i ett system.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Why DogPlanner Section */}
      <section className="py-20 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
                Bygg din verksamhet med trygghet
              </h2>
              <p className="text-xl text-gray-600 mb-8 leading-relaxed">
                DogPlanner är byggt för hunddagis, pensionat och
                trimmningsverksamheter som vill växa utan att drunkna i
                administration.
              </p>
              <div className="space-y-4">
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 bg-emerald-100 rounded-lg flex items-center justify-center flex-shrink-0">
                    <Clock className="w-5 h-5 text-emerald-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-1">
                      Spara 10+ timmar varje vecka
                    </h3>
                    <p className="text-gray-600">
                      Automatisera fakturering, bokningar och rapporter
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                    <Shield className="w-5 h-5 text-blue-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-1">
                      100% GDPR-säkert
                    </h3>
                    <p className="text-gray-600">
                      All data krypterad och lagrad säkert i Sverige
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center flex-shrink-0">
                    <Users className="w-5 h-5 text-purple-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-1">
                      Alltid uppdaterad information
                    </h3>
                    <p className="text-gray-600">
                      Dela data med personalen i realtid
                    </p>
                  </div>
                </div>
              </div>
            </div>
            <div className="bg-gradient-to-br from-emerald-50 to-blue-50 rounded-3xl p-12 border border-emerald-100">
              <div className="space-y-6">
                <div className="bg-white p-6 rounded-xl shadow-sm">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-gray-600">
                      Aktiva hundar idag
                    </span>
                    <span className="text-2xl font-bold text-emerald-600">
                      24
                    </span>
                  </div>
                  <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-emerald-500 to-emerald-600 rounded-full"
                      style={{ width: "80%" }}
                    ></div>
                  </div>
                </div>
                <div className="bg-white p-6 rounded-xl shadow-sm">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-gray-600">
                      Bokningar denna månad
                    </span>
                    <span className="text-2xl font-bold text-blue-600">
                      156
                    </span>
                  </div>
                  <div className="text-sm text-gray-500">
                    ↑ 23% från förra månaden
                  </div>
                </div>
                <div className="bg-white p-6 rounded-xl shadow-sm">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-gray-600">
                      Intäkter denna månad
                    </span>
                    <span className="text-2xl font-bold text-purple-600">
                      47 800 kr
                    </span>
                  </div>
                  <div className="text-sm text-gray-500">
                    På väg mot månadsmål
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-6 bg-gradient-to-br from-emerald-500 to-emerald-600">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
            Redo att komma igång?
          </h2>
          <p className="text-xl text-emerald-50 mb-10 leading-relaxed">
            Prova DogPlanner gratis i 2 månader. Ingen bindningstid, inget
            kreditkort behövs.
          </p>
          <Link
            href="/register"
            className="inline-block px-10 py-5 bg-white text-emerald-600 font-bold text-lg rounded-xl hover:shadow-2xl hover:-translate-y-1 transition-all"
          >
            Skapa gratis konto
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-gray-400 py-12 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="grid md:grid-cols-4 gap-8 mb-8">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <div className="w-8 h-8 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-lg flex items-center justify-center">
                  <span className="text-white text-sm">🐾</span>
                </div>
                <span className="text-white font-bold">DogPlanner</span>
              </div>
              <p className="text-sm text-gray-500">
                Smartare administration för hunddagis och pensionat
              </p>
            </div>
            <div>
              <h4 className="text-white font-semibold mb-3">Produkt</h4>
              <ul className="space-y-2 text-sm">
                <li>
                  <Link
                    href="/features"
                    className="hover:text-white transition-colors"
                  >
                    Funktioner
                  </Link>
                </li>
                <li>
                  <Link
                    href="/pricing"
                    className="hover:text-white transition-colors"
                  >
                    Priser
                  </Link>
                </li>
              </ul>
            </div>
            <div>
              <h4 className="text-white font-semibold mb-3">Företag</h4>
              <ul className="space-y-2 text-sm">
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
                    Integritet
                  </a>
                </li>
              </ul>
            </div>
            <div>
              <h4 className="text-white font-semibold mb-3">Support</h4>
              <ul className="space-y-2 text-sm">
                <li>
                  <a
                    href="mailto:support@dogplanner.se"
                    className="hover:text-white transition-colors"
                  >
                    Kontakta oss
                  </a>
                </li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-800 pt-8 text-center text-sm">
            <p>
              © {new Date().getFullYear()} DogPlanner. Alla rättigheter
              förbehållna.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
