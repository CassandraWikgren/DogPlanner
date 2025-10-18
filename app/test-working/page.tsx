export default function TestPage() {
  return (
    <div className="p-8">
      <h1 className="text-4xl font-bold mb-4">🎉 Vercel Test Fungerar!</h1>
      <p className="text-lg mb-4">Om du ser denna sida fungerar Vercel bra.</p>

      <div className="bg-green-100 p-4 rounded">
        <h2 className="font-bold">Miljövariabler:</h2>
        <ul className="mt-2">
          <li>
            SUPABASE_URL:{" "}
            {process.env.NEXT_PUBLIC_SUPABASE_URL ? "✅ Finns" : "❌ Saknas"}
          </li>
          <li>
            SUPABASE_ANON:{" "}
            {process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
              ? "✅ Finns"
              : "❌ Saknas"}
          </li>
        </ul>
      </div>

      <div className="mt-4">
        <a
          href="/"
          className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
        >
          Testa Startsida
        </a>
      </div>
    </div>
  );
}
