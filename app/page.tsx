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
          <nav>
            <Link
              href="/login"
              className="px-4 py-2 font-medium text-[#2C7A4C] border border-[#2C7A4C] rounded-lg hover:bg-[#2C7A4C] hover:text-white transition"
            >
              Logga in
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
          <h1 className="text-4xl md:text-5xl font-bold text-[#2C7A4C] mb-5">
            Det smarta sättet att driva hunddagis och pensionat
          </h1>
          <p className="text-lg md:text-xl text-gray-700 mb-8 leading-relaxed">
            Med DogPlanner får du full koll på bokningar, fakturor och scheman –
            <br className="hidden md:block" />
            så att du kan lägga mer tid på hundarna 🐶
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
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
              Läs mer
            </Link>
          </div>
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
          {[
            {
              icon: "📅",
              title: "Smidig planering",
              desc: "Hantera scheman, bokningar och notiser på ett ställe – snabbt och smidigt.",
            },
            {
              icon: "💳",
              title: "Automatisk fakturering",
              desc: "Skicka fakturor och följ betalningar automatiskt – spara tid och undvik fel.",
            },
            {
              icon: "📈",
              title: "Full kontroll",
              desc: "Se beläggning, kundhistorik och statistik direkt i din dashboard.",
            },
          ].map((f, i) => (
            <div
              key={i}
              className="bg-white border border-gray-100 shadow-sm rounded-2xl p-8 hover:shadow-lg transition"
            >
              <div className="text-5xl mb-4">{f.icon}</div>
              <h3 className="text-lg font-semibold text-[#2C7A4C] mb-2">
                {f.title}
              </h3>
              <p className="text-gray-600">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-50 py-8 border-t text-center text-gray-500 text-sm">
        © {new Date().getFullYear()} DogPlanner — Alla rättigheter förbehållna.
      </footer>
    </div>
  );
}
