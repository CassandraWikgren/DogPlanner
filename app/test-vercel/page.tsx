// Diagnostisk sida för att testa Vercel deployment
export default function TestPage() {
  return (
    <div className="p-8 max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold mb-6 text-green-600">
        🟢 Vercel Test Page - Fungerar!
      </h1>

      <div className="space-y-4">
        <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
          <h2 className="font-semibold">✅ Next.js fungerar</h2>
          <p>Om du ser denna sida så fungerar grundläggande routing.</p>
        </div>

        <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <h2 className="font-semibold">🔧 Miljövariabler</h2>
          <p>
            NEXT_PUBLIC_SUPABASE_URL:{" "}
            {process.env.NEXT_PUBLIC_SUPABASE_URL ? "✅ Finns" : "❌ Saknas"}
          </p>
          <p>
            NEXT_PUBLIC_SUPABASE_ANON_KEY:{" "}
            {process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
              ? "✅ Finns"
              : "❌ Saknas"}
          </p>
        </div>

        <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
          <h2 className="font-semibold">📊 System Info</h2>
          <p>Node.js Version: {process.version}</p>
          <p>Timestamp: {new Date().toLocaleString()}</p>
          <p>Environment: {process.env.NODE_ENV}</p>
        </div>

        <div className="space-x-4">
          <a
            href="/"
            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
          >
            Hem
          </a>
          <a
            href="/dashboard"
            className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
          >
            Dashboard
          </a>
          <a
            href="/hunddagis"
            className="bg-orange-600 text-white px-4 py-2 rounded hover:bg-orange-700"
          >
            Hunddagis
          </a>
        </div>
      </div>
    </div>
  );
}
