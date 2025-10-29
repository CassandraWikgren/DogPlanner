import Link from "next/link";
import Image from "next/image";

export default function HomePage() {
  return (
    <div className="min-h-screen flex flex-col bg-white text-gray-800">
      {/* Header */}
      <header className="flex justify-between items-center px-10 py-4 shadow-sm bg-white">
        <div className="flex items-center gap-2">
          <Image
            src="/logo.png"
            alt="DogPlanner logotyp"
            width={42}
            height={42}
            className="h-[42px] w-auto"
          />
          <span className="font-semibold text-xl text-[#2c7a4c]">
            DogPlanner
          </span>
        </div>
        <nav>
          <Link
            href="/login"
            className="px-4 py-2 font-medium text-[#2c7a4c] border border-[#2c7a4c] rounded-lg hover:bg-[#2c7a4c] hover:text-white transition"
          >
            Logga in
          </Link>
        </nav>
      </header>

      {/* Hero */}
      <section className="relative flex flex-col items-center justify-center text-center px-6 py-28 md:py-40 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-white/60 to-white/90 z-10"></div>
        <Image
          src="https://images.unsplash.com/photo-1560807707-8cc77767d783?auto=format&fit=crop&w=1600&q=80"
          alt="Hund som springer i gräs"
          fill
          priority
          className="object-cover object-center opacity-90"
        />
        <div className="relative z-20 max-w-2xl">
          <h1 className="text-4xl md:text-5xl font-bold text-[#2c7a4c] mb-6 leading-tight">
            Det smarta sättet att driva hunddagis och pensionat
          </h1>
          <p className="text-lg md:text-xl text-gray-700 mb-8 leading-relaxed">
            Med DogPlanner får du full koll på bokningar, fakturor och scheman –
            så att du kan lägga mer tid på hundarna 🐾
          </p>
          <Link
            href="/register"
            className="inline-block bg-[#2c7a4c] text-white font-semibold px-8 py-3 rounded-lg shadow hover:bg-[#256d43] transition"
          >
            Starta gratis i 3 månader
          </Link>
        </div>
      </section>

      {/* Features */}
      <section className="max-w-6xl mx-auto px-6 py-20">
        <h2 className="text-3xl font-bold text-center text-[#2c7a4c] mb-14">
          Varför DogPlanner?
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
          <div className="bg-white border border-gray-100 shadow-md rounded-2xl p-8 text-center hover:shadow-lg transition">
            <div className="text-5xl mb-4">📅</div>
            <h3 className="font-semibold text-lg text-[#2c7a4c] mb-2">
              Enkel planering
            </h3>
            <p className="text-gray-600">
              Hantera scheman, bokningar och notiser på ett ställe – snabbt och
              smidigt.
            </p>
          </div>

          <div className="bg-white border border-gray-100 shadow-md rounded-2xl p-8 text-center hover:shadow-lg transition">
            <div className="text-5xl mb-4">💳</div>
            <h3 className="font-semibold text-lg text-[#2c7a4c] mb-2">
              Automatiserad fakturering
            </h3>
            <p className="text-gray-600">
              Skicka fakturor och följ betalningar automatiskt – spara tid och
              undvik fel.
            </p>
          </div>

          <div className="bg-white border border-gray-100 shadow-md rounded-2xl p-8 text-center hover:shadow-lg transition">
            <div className="text-5xl mb-4">📈</div>
            <h3 className="font-semibold text-lg text-[#2c7a4c] mb-2">
              Full överblick
            </h3>
            <p className="text-gray-600">
              Se beläggning, kundhistorik och statistik direkt i din dashboard.
            </p>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-50 py-8 border-t text-center text-gray-500 text-sm">
        © {new Date().getFullYear()} DogPlanner. Alla rättigheter förbehållna.
      </footer>
    </div>
  );
}
