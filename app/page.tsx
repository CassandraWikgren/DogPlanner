import Link from "next/link";
import Image from "next/image";

export default function HomePage() {
  return (
    <div className="min-h-screen flex flex-col bg-white text-gray-800">
      {/* Header */}
      <header className="fixed top-0 left-0 w-full z-40 backdrop-blur-sm bg-white/80 border-b border-gray-100">
        <div className="max-w-7xl mx-auto flex justify-between items-center px-6 py-4">
          <div className="flex items-center gap-2">
            <Image
              src="/logo.png"
              alt="DogPlanner logotyp"
              width={40}
              height={40}
              className="h-[40px] w-auto"
            />
            <span className="font-semibold text-xl text-[#2C7A4C]">
              DogPlanner
            </span>
          </div>
          <nav className="flex gap-2">
            <Link
              href="/login"
              className="px-4 py-2 font-medium text-[#2C7A4C] border border-[#2C7A4C] rounded-lg hover:bg-[#2C7A4C] hover:text-white transition"
            >
              Logga in
            </Link>
            <Link
              href="/register"
              className="px-4 py-2 font-semibold bg-[#2C7A4C] text-white rounded-lg shadow hover:bg-[#256d43] transition"
            >
              Prova gratis
            </Link>
          </nav>
        </div>
      </header>

      {/* Hero */}
      <section className="relative flex items-center justify-center min-h-[90vh] bg-[#E9F6EF] overflow-hidden pt-20">
        <Image
          src="https://images.unsplash.com/photo-1560807707-8cc77767d783?auto=format&fit=crop&w=1600&q=80"
          alt="Glad hund på gräsmatta"
          fill
          className="object-cover opacity-50"
          priority
        />
        <div className="relative z-10 max-w-3xl text-center bg-white/80 backdrop-blur-sm rounded-2xl p-10 shadow-lg mx-4">
          <h1 className="text-4xl md:text-5xl font-extrabold text-[#2C7A4C] mb-5 leading-tight">
            Få full kontroll på din hundverksamhet
          </h1>
          <p className="text-lg md:text-xl text-gray-700 mb-8 leading-relaxed">
            DogPlanner samlar allt du behöver – bokningar, fakturor, scheman och
            kundregister – på ett ställe.
            <br className="hidden md:block" />
            Mindre admin, mer tid för hundarna.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-2">
            <Link
              href="/register"
              className="px-8 py-3 bg-[#2C7A4C] text-white font-semibold rounded-lg shadow hover:bg-[#256d43] transition text-lg"
            >
              Starta gratis i 3 månader
            </Link>
            <Link
              href="#features"
              className="px-8 py-3 border border-[#2C7A4C] text-[#2C7A4C] font-medium rounded-lg hover:bg-[#E9F6EF] transition text-lg"
            >
              Se funktioner
            </Link>
          </div>
          <p className="text-sm text-[#2C7A4C] font-medium mt-2">
            Ingen bindningstid, ingen kortuppgift krävs
          </p>
        </div>
      </section>

      {/* Features */}
      <section
        id="features"
        className="max-w-6xl mx-auto px-6 py-24 text-center"
      >
        <h2 className="text-3xl font-bold text-[#2C7A4C] mb-14">
          Varför DogPlanner?
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
          <div className="bg-white border border-gray-100 shadow-sm rounded-2xl p-8 hover:shadow-lg transition">
            <div className="text-5xl mb-4">📅</div>
            <h3 className="text-lg font-semibold text-[#2C7A4C] mb-2">
              Smidig planering
            </h3>
            <p className="text-gray-600">
              Scheman, bokningar och närvaro på ett ställe – snabbt och smidigt.
            </p>
          </div>
          <div className="bg-white border border-gray-100 shadow-sm rounded-2xl p-8 hover:shadow-lg transition">
            <div className="text-5xl mb-4">💳</div>
            <h3 className="text-lg font-semibold text-[#2C7A4C] mb-2">
              Automatisk fakturering
            </h3>
            <p className="text-gray-600">
              Fakturor och betalningar sköts automatiskt – spara tid och undvik
              fel.
            </p>
          </div>
          <div className="bg-white border border-gray-100 shadow-sm rounded-2xl p-8 hover:shadow-lg transition">
            <div className="text-5xl mb-4">📈</div>
            <h3 className="text-lg font-semibold text-[#2C7A4C] mb-2">
              Full kontroll
            </h3>
            <p className="text-gray-600">
              Statistik, rapporter och överblick i realtid – direkt i din
              dashboard.
            </p>
          </div>
        </div>
        <div className="mt-16 flex flex-col md:flex-row items-center justify-center gap-8">
          <div className="flex-1 max-w-md">
            <Image
              src="/dashboard-demo.png"
              alt="DogPlanner dashboard"
              width={500}
              height={320}
              className="rounded-xl shadow border"
            />
          </div>
          <div className="flex-1 max-w-md text-left md:text-lg text-gray-700">
            <p className="mb-4 font-semibold text-[#2C7A4C]">
              Allt samlat i en modern dashboard
            </p>
            <ul className="list-disc pl-5 space-y-2">
              <li>GDPR-säkerhet & svensk support</li>
              <li>Personallogik & rumshantering</li>
              <li>PDF-export & rapporter</li>
              <li>Demo/testinloggning för snabb test</li>
            </ul>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-50 py-8 border-t text-center text-gray-500 text-sm">
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
