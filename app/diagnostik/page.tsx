export default function DiagnosticsPage() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">🔍 DogPlanner Diagnostik</h1>

      <div className="bg-gray-100 p-6 rounded-lg mb-6">
        <h2 className="text-xl font-semibold mb-4">Miljövariabler Status:</h2>

        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <span className={supabaseUrl ? "text-green-600" : "text-red-600"}>
              {supabaseUrl ? "✅" : "❌"}
            </span>
            <span>
              NEXT_PUBLIC_SUPABASE_URL: {supabaseUrl ? "OK" : "SAKNAS"}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <span
              className={supabaseAnonKey ? "text-green-600" : "text-red-600"}
            >
              {supabaseAnonKey ? "✅" : "❌"}
            </span>
            <span>
              NEXT_PUBLIC_SUPABASE_ANON_KEY: {supabaseAnonKey ? "OK" : "SAKNAS"}
            </span>
          </div>
        </div>
      </div>

      <div className="bg-blue-100 p-6 rounded-lg">
        <h2 className="text-xl font-semibold mb-4">🚀 Nästa steg:</h2>
        {supabaseUrl && supabaseAnonKey ? (
          <p className="text-green-700">
            ✅ Miljövariabler är konfigurerade! Appen borde fungera.
          </p>
        ) : (
          <div className="text-red-700">
            <p className="mb-2">❌ Miljövariabler saknas i Vercel.</p>
            <p>
              Gå till Vercel Dashboard → Settings → Environment Variables och
              lägg till:
            </p>
            <ul className="list-disc ml-6 mt-2">
              <li>NEXT_PUBLIC_SUPABASE_URL</li>
              <li>NEXT_PUBLIC_SUPABASE_ANON_KEY</li>
              <li>SUPABASE_SERVICE_ROLE_KEY</li>
            </ul>
          </div>
        )}
      </div>

      <div className="mt-6 text-sm text-gray-600">
        <p>Build-tid: {new Date().toISOString()}</p>
        <p>Environment: {process.env.NODE_ENV}</p>
      </div>
    </div>
  );
}
