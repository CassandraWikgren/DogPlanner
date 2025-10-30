import Link from "next/link";
import Image from "next/image";
import {
  CheckCircle,
  Calendar,
  CreditCard,
  BarChart3,
  Users,
  Clock,
  Shield,
  Sparkles,
  Heart,
  Scissors,
} from "lucide-react";

export default function HomePage() {
  return (
    <div className="min-h-screen flex flex-col bg-white text-gray-800">
      {/* Header */}
      <header className="fixed top-0 left-0 w-full z-50 backdrop-blur-md bg-white/90 border-b border-gray-200 shadow-sm">
        <div className="max-w-7xl mx-auto flex justify-between items-center px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-[#2c7a4c] to-[#1f5738] rounded-xl flex items-center justify-center shadow-md">
              <Heart className="w-6 h-6 text-white" fill="currentColor" />
            </div>
            <span className="font-bold text-xl text-[#2C7A4C]">DogPlanner</span>
          </div>
          <nav className="hidden md:flex gap-6 text-sm font-medium">
            <a
              href="#features"
              className="text-gray-700 hover:text-[#2C7A4C] transition"
            >
              Funktioner
            </a>
            <a
              href="#how-it-works"
              className="text-gray-700 hover:text-[#2C7A4C] transition"
            >
              Så fungerar det
            </a>
            <a
              href="#pricing"
              className="text-gray-700 hover:text-[#2C7A4C] transition"
            >
              Priser
            </a>
            <a
              href="#testimonials"
              className="text-gray-700 hover:text-[#2C7A4C] transition"
            >
              Omdömen
            </a>
          </nav>
          <div className="flex gap-3">
            <Link
              href="/login"
              className="px-4 py-2 font-medium text-[#2C7A4C] hover:bg-green-50 rounded-lg transition"
            >
              Logga in
            </Link>
            <Link
              href="/register"
              className="px-5 py-2 font-semibold bg-[#2C7A4C] text-white rounded-lg shadow-md hover:bg-[#236139] hover:shadow-lg transition transform hover:-translate-y-0.5"
            >
              Starta gratis
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative flex items-center justify-center min-h-screen bg-gradient-to-br from-green-50 via-white to-blue-50 overflow-hidden pt-20">
        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-5">
          <div
            className="absolute inset-0"
            style={{
              backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%232c7a4c' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
            }}
          ></div>
        </div>

        <div className="relative z-10 max-w-6xl mx-auto px-6 text-center">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-green-100 text-[#2c7a4c] rounded-full text-sm font-semibold mb-6 shadow-sm">
            <Sparkles className="w-4 h-4" />
            <span>Sveriges smartaste system för hundbranschen</span>
          </div>

          {/* Main Heading */}
          <h1 className="text-5xl md:text-7xl font-extrabold text-gray-900 mb-6 leading-tight">
            Förenkla vardagen för ditt
            <span className="block text-transparent bg-clip-text bg-gradient-to-r from-[#2c7a4c] to-[#1a5a35]">
              hunddagis, pensionat eller trim
            </span>
          </h1>

          <p className="text-xl md:text-2xl text-gray-600 mb-10 max-w-3xl mx-auto leading-relaxed">
            Slipp tidskrävande pappersarbete och Excel-filer. Med DogPlanner får
            du allt samlat –
            <strong> bokningar, schema, fakturering och kundregister</strong> –
            på ett enda ställe.
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-8">
            <Link
              href="/register"
              className="group px-8 py-4 bg-[#2C7A4C] text-white font-bold rounded-xl shadow-lg hover:bg-[#236139] hover:shadow-xl transition transform hover:-translate-y-1 text-lg flex items-center justify-center gap-2"
            >
              <span>Kom igång gratis i 2 månader</span>
              <span className="group-hover:translate-x-1 transition-transform">
                →
              </span>
            </Link>
            <Link
              href="#demo"
              className="px-8 py-4 border-2 border-[#2C7A4C] text-[#2C7A4C] font-semibold rounded-xl hover:bg-green-50 transition text-lg flex items-center justify-center gap-2"
            >
              <span>Se live-demo</span>
            </Link>
          </div>

          {/* Trust Badge */}
          <div className="flex flex-wrap items-center justify-center gap-6 text-sm text-gray-600">
            <div className="flex items-center gap-2">
              <CheckCircle className="w-5 h-5 text-green-600" />
              <span>Ingen bindningstid</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle className="w-5 h-5 text-green-600" />
              <span>Inget betalkort krävs</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle className="w-5 h-5 text-green-600" />
              <span>GDPR-säkert</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle className="w-5 h-5 text-green-600" />
              <span>Svensk support</span>
            </div>
          </div>
        </div>
      </section>

      {/* For Who Section */}
      <section className="py-20 bg-white">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              Perfekt för alla inom hundbranschen
            </h2>
            <p className="text-xl text-gray-600">
              Oavsett om du driver hunddagis, pensionat eller hundtrim – vi har
              allt du behöver
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {/* Hunddagis */}
            <div className="bg-gradient-to-br from-green-50 to-white p-8 rounded-2xl border-2 border-green-100 hover:border-green-300 transition shadow-sm hover:shadow-lg">
              <div className="w-16 h-16 bg-[#2c7a4c] rounded-2xl flex items-center justify-center mb-6 shadow-md">
                <Users className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-4">
                Hunddagis
              </h3>
              <ul className="space-y-3 text-gray-700">
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
                  <span>Daglig närvaro & in-/utcheckning</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
                  <span>Automatiska månadsfakturor</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
                  <span>Rumshantering & kapacitet</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
                  <span>Abonnemang & prislistor</span>
                </li>
              </ul>
            </div>

            {/* Hundpensionat */}
            <div className="bg-gradient-to-br from-blue-50 to-white p-8 rounded-2xl border-2 border-blue-100 hover:border-blue-300 transition shadow-sm hover:shadow-lg">
              <div className="w-16 h-16 bg-blue-600 rounded-2xl flex items-center justify-center mb-6 shadow-md">
                <Calendar className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-4">
                Hundpensionat
              </h3>
              <ul className="space-y-3 text-gray-700">
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
                  <span>Bokningskalender & överblick</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
                  <span>Flexibel prissättning per säsong</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
                  <span>Tillval & extra tjänster</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
                  <span>In- & utcheckning</span>
                </li>
              </ul>
            </div>

            {/* Hundtrim */}
            <div className="bg-gradient-to-br from-purple-50 to-white p-8 rounded-2xl border-2 border-purple-100 hover:border-purple-300 transition shadow-sm hover:shadow-lg">
              <div className="w-16 h-16 bg-purple-600 rounded-2xl flex items-center justify-center mb-6 shadow-md">
                <Scissors className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-4">
                Hundtrim
              </h3>
              <ul className="space-y-3 text-gray-700">
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-5 h-5 text-purple-600 mt-0.5 flex-shrink-0" />
                  <span>Bokningssystem för trimsalongen</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-5 h-5 text-purple-600 mt-0.5 flex-shrink-0" />
                  <span>Kundkort med hundinfo</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-5 h-5 text-purple-600 mt-0.5 flex-shrink-0" />
                  <span>SMS-påminnelser (kommande)</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-5 h-5 text-purple-600 mt-0.5 flex-shrink-0" />
                  <span>Tjänstepaket & priser</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section
        id="features"
        className="py-20 bg-gradient-to-br from-gray-50 to-green-50"
      >
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              Allt du behöver – och mer därtill
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Vi har byggt DogPlanner med hundentusiaster i åt anke. Varje
              funktion är designad för att spara tid och göra din vardag
              enklare.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[
              {
                icon: <Calendar className="w-6 h-6" />,
                title: "Smart bokningssystem",
                description:
                  "Hantera dagis, pensionat och trim med lätthet. Automatisk konflikthantering och påminnelser.",
              },
              {
                icon: <CreditCard className="w-6 h-6" />,
                title: "Automatisk fakturering",
                description:
                  "Skicka fakturor automatiskt varje månad. Spara tid och minska administrativa fel.",
              },
              {
                icon: <BarChart3 className="w-6 h-6" />,
                title: "Live-statistik",
                description:
                  "Se intäkter, beläggning och trender i realtid. Fatta smartare beslut för din verksamhet.",
              },
              {
                icon: <Users className="w-6 h-6" />,
                title: "Komplett kundregister",
                description:
                  "All info om hundar, ägare och bokningar på ett ställe. GDPR-säkert och lättåtkomligt.",
              },
              {
                icon: <Clock className="w-6 h-6" />,
                title: "Tidsbesparande",
                description:
                  "Slipp Excel och papperslappar. Spara upp till 10 timmar/vecka på administration.",
              },
              {
                icon: <Shield className="w-6 h-6" />,
                title: "Säkerhet & GDPR",
                description:
                  "Krypterad data, säkra servrar och fullständig GDPR-efterlevnad. Din data är trygg hos oss.",
              },
            ].map((feature, idx) => (
              <div
                key={idx}
                className="bg-white p-6 rounded-xl shadow-sm hover:shadow-md transition border border-gray-100"
              >
                <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center text-[#2c7a4c] mb-4">
                  {feature.icon}
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  {feature.title}
                </h3>
                <p className="text-gray-600 text-sm leading-relaxed">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section id="how-it-works" className="py-20 bg-white">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              Kom igång på 3 enkla steg
            </h2>
            <p className="text-xl text-gray-600">
              Från registrering till fullständig kontroll – på mindre än 10
              minuter
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-12">
            <div className="text-center">
              <div className="w-20 h-20 bg-gradient-to-br from-[#2c7a4c] to-[#1a5a35] rounded-full flex items-center justify-center text-white text-3xl font-bold mx-auto mb-6 shadow-lg">
                1
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">
                Skapa ditt konto
              </h3>
              <p className="text-gray-600 leading-relaxed">
                Fyll i dina företagsuppgifter och kom igång direkt. Ingen
                installation krävs – allt finns i webbläsaren.
              </p>
            </div>

            <div className="text-center">
              <div className="w-20 h-20 bg-gradient-to-br from-[#2c7a4c] to-[#1a5a35] rounded-full flex items-center justify-center text-white text-3xl font-bold mx-auto mb-6 shadow-lg">
                2
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">
                Lägg in hundar & kunder
              </h3>
              <p className="text-gray-600 leading-relaxed">
                Importera befintliga kunder eller lägg till manuellt. Varje hund
                får sin egen profil med all viktig information.
              </p>
            </div>

            <div className="text-center">
              <div className="w-20 h-20 bg-gradient-to-br from-[#2c7a4c] to-[#1a5a35] rounded-full flex items-center justify-center text-white text-3xl font-bold mx-auto mb-6 shadow-lg">
                3
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">
                Börja boka & fakturera
              </h3>
              <p className="text-gray-600 leading-relaxed">
                Schemalägg besök, hantera bokningar och skicka fakturor
                automatiskt. Allt sköts åt dig!
              </p>
            </div>
          </div>

          <div className="text-center mt-12">
            <Link
              href="/register"
              className="inline-flex items-center gap-2 px-8 py-4 bg-[#2C7A4C] text-white font-bold rounded-xl shadow-lg hover:bg-[#236139] hover:shadow-xl transition transform hover:-translate-y-1 text-lg"
            >
              <span>Starta din gratisperiod nu</span>
              <span>→</span>
            </Link>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section
        id="testimonials"
        className="py-20 bg-gradient-to-br from-green-50 to-blue-50"
      >
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              Vad säger våra kunder?
            </h2>
            <p className="text-xl text-gray-600">
              Hundratals hunddagis och pensionat litar redan på DogPlanner
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                name: "Anna Svensson",
                role: "Ägare, Glada Tassar Hunddagis",
                text: "DogPlanner har sparat oss minst 8 timmar i veckan! Automatisk fakturering är guld värt.",
                rating: 5,
              },
              {
                name: "Erik Johansson",
                role: "Hundpensionat Sjöviken",
                text: "Äntligen ett system som är byggt för just vår bransch. Enkelt, intuitivt och prisvärt!",
                rating: 5,
              },
              {
                name: "Maria Andersson",
                role: "Trimmare, Hundsalong Bella",
                text: "Bokningssystemet är fantastiskt! Kunderna älskar att kunna boka online.",
                rating: 5,
              },
            ].map((testimonial, idx) => (
              <div
                key={idx}
                className="bg-white p-6 rounded-xl shadow-md hover:shadow-lg transition border border-gray-100"
              >
                <div className="flex gap-1 mb-4">
                  {[...Array(testimonial.rating)].map((_, i) => (
                    <span key={i} className="text-yellow-400 text-xl">
                      ★
                    </span>
                  ))}
                </div>
                <p className="text-gray-700 mb-6 leading-relaxed italic">
                  "{testimonial.text}"
                </p>
                <div className="border-t pt-4">
                  <p className="font-semibold text-gray-900">
                    {testimonial.name}
                  </p>
                  <p className="text-sm text-gray-600">{testimonial.role}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="py-20 bg-white">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              Transparent prissättning
            </h2>
            <p className="text-xl text-gray-600">
              Välj det paket som passar din verksamhet bäst
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {/* Starter */}
            <div className="bg-white p-8 rounded-2xl border-2 border-gray-200 hover:border-green-300 transition shadow-sm hover:shadow-lg">
              <h3 className="text-2xl font-bold text-gray-900 mb-2">Starter</h3>
              <p className="text-gray-600 mb-6">För mindre verksamheter</p>
              <div className="mb-6">
                <span className="text-5xl font-bold text-gray-900">299</span>
                <span className="text-gray-600 ml-2">kr/mån</span>
              </div>
              <ul className="space-y-3 mb-8">
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
                  <span className="text-gray-700">Upp till 30 hundar</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
                  <span className="text-gray-700">Grundläggande bokningar</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
                  <span className="text-gray-700">Automatisk fakturering</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
                  <span className="text-gray-700">E-postsupport</span>
                </li>
              </ul>
              <Link
                href="/register"
                className="block text-center w-full px-6 py-3 border-2 border-[#2c7a4c] text-[#2c7a4c] font-semibold rounded-lg hover:bg-green-50 transition"
              >
                Välj Starter
              </Link>
            </div>

            {/* Professional - POPULAR */}
            <div className="bg-gradient-to-br from-[#2c7a4c] to-[#1a5a35] p-8 rounded-2xl border-2 border-[#2c7a4c] shadow-xl transform scale-105">
              <div className="bg-yellow-400 text-gray-900 font-bold text-xs px-3 py-1 rounded-full inline-block mb-4">
                POPULÄRAST
              </div>
              <h3 className="text-2xl font-bold text-white mb-2">
                Professional
              </h3>
              <p className="text-green-100 mb-6">För växande företag</p>
              <div className="mb-6">
                <span className="text-5xl font-bold text-white">599</span>
                <span className="text-green-100 ml-2">kr/mån</span>
              </div>
              <ul className="space-y-3 mb-8">
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-5 h-5 text-green-300 mt-0.5 flex-shrink-0" />
                  <span className="text-white">Obegränsat antal hundar</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-5 h-5 text-green-300 mt-0.5 flex-shrink-0" />
                  <span className="text-white">Avancerad bokningslogik</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-5 h-5 text-green-300 mt-0.5 flex-shrink-0" />
                  <span className="text-white">Live-statistik & rapporter</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-5 h-5 text-green-300 mt-0.5 flex-shrink-0" />
                  <span className="text-white">Prioriterad support</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-5 h-5 text-green-300 mt-0.5 flex-shrink-0" />
                  <span className="text-white">Flera användare</span>
                </li>
              </ul>
              <Link
                href="/register"
                className="block text-center w-full px-6 py-3 bg-white text-[#2c7a4c] font-bold rounded-lg hover:bg-gray-100 transition shadow-md"
              >
                Välj Professional
              </Link>
            </div>

            {/* Enterprise */}
            <div className="bg-white p-8 rounded-2xl border-2 border-gray-200 hover:border-green-300 transition shadow-sm hover:shadow-lg">
              <h3 className="text-2xl font-bold text-gray-900 mb-2">
                Enterprise
              </h3>
              <p className="text-gray-600 mb-6">För stora kedjor</p>
              <div className="mb-6">
                <span className="text-5xl font-bold text-gray-900">
                  Kontakta
                </span>
                <span className="text-gray-600 ml-2 block text-lg">oss</span>
              </div>
              <ul className="space-y-3 mb-8">
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
                  <span className="text-gray-700">Flera anläggningar</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
                  <span className="text-gray-700">API-åtkomst</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
                  <span className="text-gray-700">Dedikerad support</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
                  <span className="text-gray-700">Skräddarsydd lösning</span>
                </li>
              </ul>
              <Link
                href="mailto:sales@dogplanner.se"
                className="block text-center w-full px-6 py-3 border-2 border-[#2c7a4c] text-[#2c7a4c] font-semibold rounded-lg hover:bg-green-50 transition"
              >
                Kontakta säljteam
              </Link>
            </div>
          </div>

          <div className="text-center mt-12">
            <p className="text-gray-600">
              <strong>
                Alla paket inkluderar 2 månaders gratis provperiod
              </strong>{" "}
              – ingen kortuppgift krävs!
            </p>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-r from-[#2c7a4c] to-[#1a5a35] text-white">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <h2 className="text-4xl md:text-5xl font-bold mb-6">
            Redo att förändra din vardag?
          </h2>
          <p className="text-xl mb-10 text-green-100">
            Gå med i hundratals nöjda kunder som redan har digitaliserat sin
            hundverksamhet
          </p>
          <Link
            href="/register"
            className="inline-flex items-center gap-2 px-10 py-5 bg-white text-[#2c7a4c] font-bold rounded-xl shadow-2xl hover:shadow-3xl transition transform hover:-translate-y-1 text-xl"
          >
            <span>Kom igång gratis i 2 månader</span>
            <span>→</span>
          </Link>
          <p className="mt-6 text-green-200 text-sm">
            Inga dolda kostnader • Säg upp när som helst • GDPR-säkert
          </p>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-gray-300 py-16">
        <div className="max-w-6xl mx-auto px-6">
          <div className="grid md:grid-cols-4 gap-12 mb-12">
            {/* Company Info */}
            <div>
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-gradient-to-br from-[#2c7a4c] to-[#1f5738] rounded-xl flex items-center justify-center">
                  <Heart className="w-6 h-6 text-white" fill="currentColor" />
                </div>
                <span className="font-bold text-xl text-white">DogPlanner</span>
              </div>
              <p className="text-gray-400 text-sm leading-relaxed">
                Sveriges smartaste system för hunddagis, pensionat och trim. Mer
                tid för hundarna, mindre tid för administration.
              </p>
            </div>

            {/* Product */}
            <div>
              <h3 className="font-semibold text-white mb-4">Produkt</h3>
              <ul className="space-y-2 text-sm">
                <li>
                  <a href="#features" className="hover:text-white transition">
                    Funktioner
                  </a>
                </li>
                <li>
                  <a href="#pricing" className="hover:text-white transition">
                    Priser
                  </a>
                </li>
                <li>
                  <a
                    href="#how-it-works"
                    className="hover:text-white transition"
                  >
                    Så fungerar det
                  </a>
                </li>
                <li>
                  <Link
                    href="/register"
                    className="hover:text-white transition"
                  >
                    Prova gratis
                  </Link>
                </li>
              </ul>
            </div>

            {/* Support */}
            <div>
              <h3 className="font-semibold text-white mb-4">Support</h3>
              <ul className="space-y-2 text-sm">
                <li>
                  <a
                    href="mailto:support@dogplanner.se"
                    className="hover:text-white transition"
                  >
                    Kontakta oss
                  </a>
                </li>
                <li>
                  <Link href="/terms" className="hover:text-white transition">
                    Användarvillkor
                  </Link>
                </li>
                <li>
                  <a href="#privacy" className="hover:text-white transition">
                    Integritetspolicy
                  </a>
                </li>
                <li>
                  <a
                    href="mailto:gdpr@dogplanner.se"
                    className="hover:text-white transition"
                  >
                    GDPR-frågor
                  </a>
                </li>
              </ul>
            </div>

            {/* Contact */}
            <div>
              <h3 className="font-semibold text-white mb-4">Kontakt</h3>
              <ul className="space-y-2 text-sm">
                <li className="flex items-start gap-2">
                  <span className="text-gray-500">📧</span>
                  <a
                    href="mailto:info@dogplanner.se"
                    className="hover:text-white transition"
                  >
                    info@dogplanner.se
                  </a>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-gray-500">💬</span>
                  <a
                    href="mailto:support@dogplanner.se"
                    className="hover:text-white transition"
                  >
                    support@dogplanner.se
                  </a>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-gray-500">🔒</span>
                  <a
                    href="mailto:gdpr@dogplanner.se"
                    className="hover:text-white transition"
                  >
                    gdpr@dogplanner.se
                  </a>
                </li>
              </ul>
            </div>
          </div>

          {/* Privacy Policy Section */}
          <div id="privacy" className="border-t border-gray-800 pt-12 mb-12">
            <h3 className="text-2xl font-bold text-white mb-6">
              Integritetspolicy – Vi värnar om dig och din hund
            </h3>
            <div className="text-sm text-gray-400 space-y-4 leading-relaxed max-w-4xl">
              <p>
                På DogPlanner sätter vi både dig och din hund i centrum. För oss
                är det viktigt att du känner dig trygg när du lämnar dina
                personuppgifter till oss. Ditt förtroende betyder mycket, och
                därför ser vi alltid till att hantera informationen på ett
                säkert och ansvarsfullt sätt.
              </p>
              <p>
                <strong className="text-gray-300">
                  En sak vill vi vara tydliga med:
                </strong>{" "}
                vi säljer aldrig dina personuppgifter och vi lämnar dem aldrig
                vidare till obehöriga. Endast våra betrodda IT-leverantörer och
                samarbetspartners kan få tillgång när det är nödvändigt för att
                ge dig och din hund den bästa servicen.
              </p>

              <div className="grid md:grid-cols-2 gap-6 mt-8">
                <div>
                  <h4 className="font-semibold text-white mb-2">
                    Vem ansvarar för uppgifterna?
                  </h4>
                  <p>
                    DogPlanner AB är ansvarig för de personuppgifter vi
                    behandlar inom vår verksamhet.
                  </p>
                </div>
                <div>
                  <h4 className="font-semibold text-white mb-2">
                    Hur länge sparar vi uppgifterna?
                  </h4>
                  <p>
                    Kunduppgifter sparas i max 36 månader efter att ett avtal
                    eller en bokning avslutats. Efter det raderas eller
                    anonymiseras informationen.
                  </p>
                </div>
                <div>
                  <h4 className="font-semibold text-white mb-2">
                    Dina rättigheter
                  </h4>
                  <p>
                    Du har rätt att begära ett kostnadsfritt registerutdrag, få
                    felaktiga uppgifter rättade och bli raderad ("rätten att bli
                    glömd").
                  </p>
                </div>
                <div>
                  <h4 className="font-semibold text-white mb-2">
                    Kontakta oss
                  </h4>
                  <p>
                    Har du frågor om hur vi behandlar dina personuppgifter?
                    <br />
                    📧{" "}
                    <a
                      href="mailto:gdpr@dogplanner.se"
                      className="text-green-400 hover:text-green-300"
                    >
                      gdpr@dogplanner.se
                    </a>
                  </p>
                </div>
              </div>

              <p className="mt-6 text-xs text-gray-500">
                Vi hanterar inga känsliga personuppgifter och använder inte
                profilering. All data är krypterad och skyddad enligt
                GDPR-standarder.
              </p>
            </div>
          </div>

          {/* Copyright */}
          <div className="border-t border-gray-800 pt-8 text-center text-sm text-gray-500">
            <p>
              © {new Date().getFullYear()} DogPlanner AB — Alla rättigheter
              förbehållna
            </p>
            <p className="mt-2">
              Organisationsnummer: 559xxx-xxxx | Säte: Sverige
            </p>
          </div>
        </div>
        <div className="mb-2">
          <Link href="/kontakt" className="text-[#2C7A4C] hover:underline mx-2">
            Kontakt
          </Link>
          <Link href="/priser" className="text-[#2C7A4C] hover:underline mx-2">
            Priser
          </Link>
          <Link href="/terms" className="text-[#2C7A4C] hover:underline mx-2">
            Villkor
          </Link>
        </div>
        © {new Date().getFullYear()} DogPlanner — Alla rättigheter förbehållna.
      </footer>
    </div>
  );
}
