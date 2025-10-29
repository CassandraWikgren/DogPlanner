import Link from "next/link";
import Image from "next/image";

export default function HomePage() {
  return (
    <div className="min-h-screen bg-[#fdfdfd] flex flex-col">
      {/* Header */}
      <header className="flex justify-between items-center px-10 py-4 bg-[#2c7a4c] text-white">
        <Image
          src="/logo.png"
          alt="DogPlanner logotyp"
          width={42}
          height={42}
          className="h-[42px] w-auto"
        />
        <nav>
          <Link
            href="/login"
            className="login-btn font-bold px-4 py-2 rounded-md hover:bg-white/30 transition-colors"
            style={{ color: "white", background: "rgba(255,255,255,0.2)" }}
          >
            Logga in
          </Link>
        </nav>
      </header>

      {/* Hero */}
      <section
        className="hero flex flex-col items-center justify-center text-center py-24 px-4 bg-cover bg-center relative"
        style={{
          backgroundImage:
            "linear-gradient(rgba(44,122,76,0.85),rgba(44,122,76,0.85)),url(https://images.unsplash.com/photo-1558788353-f76d92427f16?ixlib=rb-4.0.3&auto=format&fit=crop&w=1600&q=80)",
        }}
      >
        <Image
          src="/logo.png"
          alt="DogPlanner logotyp"
          width={220}
          height={80}
          className="hero-logo mb-6 drop-shadow-lg"
        />
        <h1 className="text-4xl md:text-5xl font-bold mb-4">
          Få full koll på din hundverksamhet
        </h1>
        <p className="text-lg md:text-xl mb-8 leading-relaxed">
          DogPlanner gör det enkelt att driva hunddagis och pensionat.
          <br className="hidden md:block" />
          Mer tid för hundarna, mindre för papper.
        </p>
        <Link
          href="/register"
          className="btn primary inline-block px-7 py-3 bg-white text-[#2c7a4c] font-bold rounded-lg text-lg shadow hover:bg-[#e6f4ea] transition"
        >
          Prova gratis i 2 månader
        </Link>
      </section>

      {/* Features */}
      <section className="features max-w-5xl mx-auto my-16 px-4 text-center">
        <h2 className="text-2xl font-bold text-[#2c7a4c] mb-10">
          Varför välja DogPlanner?
        </h2>
        <div className="feature-list grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="feature bg-white p-8 rounded-xl shadow hover:-translate-y-1 transition-transform">
            <div className="feature-icon text-4xl mb-3">📅</div>
            <h3 className="text-lg font-semibold text-[#2c7a4c] mb-2">
              Spara tid
            </h3>
            <p>
              All planering samlad på ett ställe – schema, bokningar och notiser
              hanteras enkelt.
            </p>
          </div>
          <div className="feature bg-white p-8 rounded-xl shadow hover:-translate-y-1 transition-transform">
            <div className="feature-icon text-4xl mb-3">📊</div>
            <h3 className="text-lg font-semibold text-[#2c7a4c] mb-2">
              Ha full kontroll
            </h3>
            <p>
              Få en tydlig överblick över hundar, kunder och personal i realtid.
            </p>
          </div>
          <div className="feature bg-white p-8 rounded-xl shadow hover:-translate-y-1 transition-transform">
            <div className="feature-icon text-4xl mb-3">💳</div>
            <h3 className="text-lg font-semibold text-[#2c7a4c] mb-2">
              Smidig fakturering
            </h3>
            <p>
              Automatisera abonnemang och fakturor så du slipper manuell
              hantering.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
