// app/(app)/foretagsinformation/page.tsx
import Link from "next/link";

export default function ForetagsInfoPage() {
  return (
    <main className="max-w-5xl mx-auto my-10 px-4">
      <h1 className="text-2xl font-bold mb-6">Företagsinformation</h1>
      <nav className="flex gap-6 mb-8">
        <Link href="/subscription" className="btn primary">
          Mitt abonnemang
        </Link>
        <Link href="/terms" className="btn primary">
          Villkor
        </Link>
        <Link href="/invoices" className="btn primary">
          Fakturor
        </Link>
      </nav>
      <p>Välj en flik ovan för att visa abonnemang, villkor eller fakturor.</p>
    </main>
  );
}
