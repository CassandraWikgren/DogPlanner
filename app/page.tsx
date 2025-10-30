import Link from "next/link";

export default function HomePage() {
  return (
    <div className="min-h-screen bg-white">
      {/* Simple Header */}
      <nav className="border-b border-gray-200">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-2xl">🐕</span>
            <span className="text-xl font-bold text-gray-900">DogPlanner</span>
          </div>
          <div className="flex items-center gap-4">
            <Link href="/login" className="text-gray-700 hover:text-gray-900">
              Logga in
            </Link>
            <Link
              href="/register"
              className="px-5 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700"
            >
              Kom igång
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="max-w-6xl mx-auto px-6 py-20">
        <div className="max-w-3xl">
          <h1 className="text-5xl font-bold text-gray-900 mb-6 leading-tight">
            Hantera ditt hunddagis enklare
          </h1>
          <p className="text-xl text-gray-600 mb-8 leading-relaxed">
            Slipp Excel-filer och papperslappar. Håll koll på bokningar,
            fakturor och hundregister på ett ställe.
          </p>
          <div className="flex gap-4">
            <Link
              href="/register"
              className="px-6 py-3 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 font-medium"
            >
              Prova gratis i 2 månader
            </Link>
            <Link
              href="/login"
              className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium"
            >
              Logga in
            </Link>
          </div>
          <p className="text-sm text-gray-500 mt-4">
            Ingen bindningstid • Inget kreditkort behövs
          </p>
        </div>
      </section>

      {/* Features */}
      <section className="max-w-6xl mx-auto px-6 py-16">
        <h2 className="text-3xl font-bold text-gray-900 mb-12">
          Allt du behöver
        </h2>
        <div className="grid md:grid-cols-3 gap-8">
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Bokningar
            </h3>
            <p className="text-gray-600">
              Håll koll på vilka hundar som kommer när. Se lediga platser direkt.
            </p>
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Hundregister
            </h3>
            <p className="text-gray-600">
              All info om hundarna och deras ägare samlat. Mediciner, allergier,
              kontaktuppgifter.
            </p>
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Fakturering
            </h3>
            <p className="text-gray-600">
              Skapa och skicka fakturor automatiskt. Ingen manuell hantering.
            </p>
          </div>
        </div>
      </section>

      {/* Simple CTA */}
      <section className="max-w-6xl mx-auto px-6 py-20">
        <div className="bg-gray-50 rounded-2xl p-12 text-center">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">
            Redo att börja?
          </h2>
          <p className="text-lg text-gray-600 mb-8">
            Prova gratis i 2 månader, ingen bindningstid.
          </p>
          <Link
            href="/register"
            className="inline-block px-8 py-3 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 font-medium"
          >
            Skapa konto
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-gray-200 py-12">
        <div className="max-w-6xl mx-auto px-6">
          <div className="flex flex-col md:flex-row justify-between items-center gap-6">
            <div className="flex items-center gap-2">
              <span className="text-xl">🐕</span>
              <span className="font-semibold text-gray-900">DogPlanner</span>
            </div>
            <div className="flex gap-8 text-sm text-gray-600">
              <Link href="/terms" className="hover:text-gray-900">
                Villkor
              </Link>
              <a href="mailto:gdpr@dogplanner.se" className="hover:text-gray-900">
                Integritet
              </a>
              <a
                href="mailto:support@dogplanner.se"
                className="hover:text-gray-900"
              >
                Kontakt
              </a>
            </div>
          </div>
          <div className="text-center mt-8 text-sm text-gray-500">
            © {new Date().getFullYear()} DogPlanner
          </div>
        </div>
      </footer>
    </div>
  );
}
