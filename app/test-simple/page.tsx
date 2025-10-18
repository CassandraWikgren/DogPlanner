export default function TestPage() {
  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">Test Sida</h1>
      <p>Om du ser detta fungerar Vercel och Next.js.</p>
      <p>Tidsstämpel: {new Date().toLocaleString("sv-SE")}</p>

      <div className="mt-4">
        <h2 className="text-lg font-semibold">Navigering:</h2>
        <ul className="list-disc pl-6">
          <li>
            <a href="/" className="text-blue-600 hover:underline">
              Hem
            </a>
          </li>
          <li>
            <a href="/dashboard" className="text-blue-600 hover:underline">
              Dashboard
            </a>
          </li>
          <li>
            <a href="/hunddagis" className="text-blue-600 hover:underline">
              Hunddagis
            </a>
          </li>
          <li>
            <a href="/login" className="text-blue-600 hover:underline">
              Login
            </a>
          </li>
        </ul>
      </div>
    </div>
  );
}
