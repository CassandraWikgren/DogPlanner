import Hero from "../components/Hero";

export default function AnsokanPage() {
  return (
    <main>
      {/* Hero */}
      <Hero
        title="Ansökan om dagisplats"
        subtitle="Vi ser fram emot att höra mer om din hund – fyll i formuläret nedan för att skicka in din intresseanmälan."
        image="https://images.unsplash.com/photo-1601979039862-4c707e2d1c1c?auto=format&fit=crop&w=1600&q=80"
      />

      {/* Formulär i vitt kort */}
      <section className="max-w-3xl mx-auto my-16 px-6">
        <div className="bg-white rounded-2xl shadow-lg p-8">
          <h2 className="text-2xl font-bold text-green-700 mb-6">
            🐶 Ansökningsformulär
          </h2>

          <form className="grid gap-6">
            {/* Hundens namn & Ras */}
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Hundens namn
                </label>
                <input
                  type="text"
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-green-500 focus:border-green-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Ras
                </label>
                <input
                  type="text"
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-green-500 focus:border-green-500"
                />
              </div>
            </div>

            {/* Födelsedatum & Mankhöjd */}
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Födelsedatum
                </label>
                <input
                  type="date"
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-green-500 focus:border-green-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Mankhöjd (cm)
                </label>
                <input
                  type="number"
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-green-500 focus:border-green-500"
                />
              </div>
            </div>

            {/* Kön & Abonnemang */}
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Kön
                </label>
                <select className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-green-500 focus:border-green-500">
                  <option value="">Välj kön</option>
                  <option value="tik">Tik</option>
                  <option value="hane">Hane</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Önskat abonnemang
                </label>
                <select className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-green-500 focus:border-green-500">
                  <option value="heltid">Heltid</option>
                  <option value="deltid1">Deltid 1</option>
                  <option value="deltid2">Deltid 2</option>
                  <option value="deltid3">Deltid 3</option>
                </select>
              </div>
            </div>

            {/* Ägare */}
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Ägarens namn
                </label>
                <input
                  type="text"
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-green-500 focus:border-green-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Telefon
                </label>
                <input
                  type="tel"
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-green-500 focus:border-green-500"
                />
              </div>
            </div>

            {/* E-post */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                E-post
              </label>
              <input
                type="email"
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-green-500 focus:border-green-500"
              />
            </div>

            {/* Skicka-knapp */}
            <div className="text-right">
              <button
                type="submit"
                className="bg-green-600 hover:bg-green-700 text-white font-semibold px-6 py-2 rounded-md shadow"
              >
                Skicka ansökan
              </button>
            </div>
          </form>
        </div>
      </section>
    </main>
  );
}
