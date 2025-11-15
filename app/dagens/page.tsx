export default function DagensPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Kompakt header */}
      <div className="bg-white border-b shadow-sm">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <h1 className="text-2xl font-bold text-[#2C7A4C] leading-tight">
            Dagens schema
          </h1>
        </div>
      </div>

      {/* Main content */}
      <div className="max-w-7xl mx-auto px-6 py-6">
        <div className="bg-yellow-50 border border-yellow-300 rounded-lg p-6">
          <p className="text-yellow-800 font-semibold mb-2">
            ⚠️ Denna sida är tillfälligt inaktiverad under utveckling.
          </p>
          <p className="text-yellow-700">
            Använd{" "}
            <a
              href="/hunddagis"
              className="underline font-semibold text-[#2C7A4C] hover:text-[#236139]"
            >
              Hunddagis-sidan
            </a>{" "}
            för att se dagens hundar.
          </p>
        </div>
      </div>
    </div>
  );
}
