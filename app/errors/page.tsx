// Simple error page for testing
export default function ErrorsPage() {
  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-6">🏥 SYSTEMSTATUS</h1>

        <div className="grid gap-6">
          {/* Rooms Status */}
          <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-xl font-semibold mb-4">
              📊 Rumhantering (ROOMS_001)
            </h2>
            <p className="text-sm text-gray-600 mb-4">
              Status:{" "}
              <span className="text-yellow-600">⚠️ Kompileringsfel</span>
            </p>
            <p className="text-xs text-gray-500">
              Felkod: ROOMS_001 - TypeScript syntaxfel på rad 751
            </p>
          </div>

          {/* Authentication Status */}
          <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-xl font-semibold mb-4">
              🔐 Autentisering (AUTH_001)
            </h2>
            <p className="text-sm text-gray-600 mb-4">
              Status: <span className="text-green-600">✅ Fungerar</span>
            </p>
            <p className="text-xs text-gray-500">
              Middleware tillåter /rooms för testning
            </p>
          </div>

          {/* Calculator Status */}
          <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-xl font-semibold mb-4">
              🧮 Jordbruksverkets beräkningar (CALC_001)
            </h2>
            <p className="text-sm text-gray-600 mb-4">
              Status: <span className="text-green-600">✅ Implementerat</span>
            </p>
            <p className="text-xs text-gray-500">
              Exakta mått enligt användarens specifikationer
            </p>
          </div>

          {/* Server Status */}
          <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-xl font-semibold mb-4">🚀 Server</h2>
            <p className="text-sm text-gray-600 mb-4">
              Status:{" "}
              <span className="text-green-600">✅ Kör på port 3001</span>
            </p>
            <p className="text-xs text-gray-500">
              Next.js utvecklingsserver aktiv
            </p>
          </div>
        </div>

        <div className="mt-8 p-4 bg-blue-50 rounded-lg">
          <h3 className="font-semibold mb-2">🔧 Snabbåtgärder:</h3>
          <ul className="text-sm space-y-1">
            <li>
              • Gå till <code>localhost:3001/rooms</code> för att testa
              rumhantering
            </li>
            <li>
              • Kontrollera felkoder med: <code>node check-structure.js</code>
            </li>
            <li>• Fixa syntax med VS Code TypeScript kontroll</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
