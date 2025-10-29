"use client";
import Link from "next/link";
import Image from "next/image";

export default function HomePage() {
  return (
    <div className="min-h-screen flex flex-col bg-white">
      {/* Header */}
      <header className="flex items-center justify-between px-8 py-6 bg-green-700 text-white shadow">
        <div className="flex items-center gap-2">
          <Image
            src="/logo.png"
            alt="DogPlanner"
            width={40}
            height={40}
            className="h-10 w-10"
          />
          <span className="text-2xl font-bold tracking-tight">DogPlanner</span>
        </div>
        <nav className="flex gap-4">
          <Link href="/login" className="hover:underline">
            Logga in
          </Link>
          <Link
            href="/register"
            className="bg-white text-green-700 px-5 py-2 rounded font-bold hover:bg-green-100 transition"
          >
            Prova gratis
          </Link>
        </nav>
      </header>

      {/* Hero Section */}
      <main className="flex-1 flex flex-col items-center justify-center text-center px-4 bg-gradient-to-b from-green-50 to-white">
        <h1 className="text-4xl md:text-6xl font-extrabold text-green-800 mb-6 drop-shadow">
          Få full kontroll på din hundverksamhet
        </h1>
        <p className="text-lg md:text-2xl text-green-900 mb-8 max-w-2xl mx-auto">
          DogPlanner gör det enkelt att driva hunddagis och pensionat. Mer tid
          för hundarna, mindre för papper och stress.
        </p>
        <Link
          href="/register"
          className="inline-block bg-green-600 hover:bg-green-700 text-white font-bold px-8 py-4 rounded-lg shadow-lg text-lg mb-4"
        >
          Skapa konto gratis
        </Link>
        <p className="text-sm text-green-700">
          Ingen bindningstid, ingen kortuppgift krävs
        </p>
      </main>

      {/* Features Section */}
      <section className="py-16 bg-white border-t border-b border-green-100">
        <div className="max-w-5xl mx-auto px-4 grid grid-cols-1 md:grid-cols-3 gap-10 text-center">
          <div className="flex flex-col items-center">
            <Image
              src="/feature1.png"
              alt="Automatisera"
              width={64}
              height={64}
              className="mb-4"
            />
            <h3 className="text-xl font-semibold mb-2 text-green-800">
              Automatisera vardagen
            </h3>
            <p className="text-gray-700">
              Bokningar, fakturor, närvaro och rapporter – allt på ett ställe.
            </p>
          </div>
          <div className="flex flex-col items-center">
            <Image
              src="/feature2.png"
              alt="Trygghet"
              width={64}
              height={64}
              className="mb-4"
            />
            <h3 className="text-xl font-semibold mb-2 text-green-800">
              Tryggt & GDPR-säkert
            </h3>
            <p className="text-gray-700">
              All data lagras säkert i Sverige. Du äger alltid din information.
            </p>
          </div>
          <div className="flex flex-col items-center">
            <Image
              src="/feature3.png"
              alt="Support"
              width={64}
              height={64}
              className="mb-4"
            />
            <h3 className="text-xl font-semibold mb-2 text-green-800">
              Personlig support
            </h3>
            <p className="text-gray-700">
              Vi hjälper dig igång och finns alltid nära till hands om du
              behöver oss.
            </p>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-10 mt-8">
        <div className="max-w-5xl mx-auto px-4 grid grid-cols-1 md:grid-cols-4 gap-8">
          <div>
            <div className="flex items-center gap-2 mb-2">
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
            <h4 className="font-semibold mb-2">Produkt</h4>
            <ul className="space-y-1 text-gray-400">
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
            <h4 className="font-semibold mb-2">Support</h4>
            <ul className="space-y-1 text-gray-400">
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
            <h4 className="font-semibold mb-2">Företag</h4>
            <ul className="space-y-1 text-gray-400">
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
        <div className="border-t border-gray-800 mt-8 pt-6 text-center text-gray-400">
          <p>
            &copy; {new Date().getFullYear()} DogPlanner. Alla rättigheter
            förbehållna.{" "}
            <Link href="/terms" className="underline hover:text-white ml-2">
              Villkor
            </Link>
          </p>
        </div>
      </footer>
    </div>
  );
}
