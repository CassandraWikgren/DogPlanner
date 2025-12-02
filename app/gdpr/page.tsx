"use client";
import { useRouter } from "next/navigation";

export default function GDPRPage() {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header - EXAKT som Hunddagis */}
      <div className="border-b border-gray-200 bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <h1 className="text-[32px] font-bold text-slate-700 leading-tight">
            Integritetspolicy & GDPR
          </h1>
          <p className="mt-1 text-base text-gray-600">
            Hantering av personuppgifter enligt dataskyddsförordningen
          </p>
        </div>
      </div>

      {/* Main Content - EXAKT som Hunddagis */}
      <div className="max-w-7xl mx-auto px-6 py-6">
        <div className="bg-white rounded-lg p-6 border border-gray-200 shadow-sm">
          <div className="max-w-4xl">
            <h2 className="text-xl font-semibold text-[#333333] mb-4">
              Hantering av personuppgifter
            </h2>
            <p className="text-sm text-gray-700 mb-6">
              DogPlanner värnar om din integritet och hanterar dina
              personuppgifter enligt gällande dataskyddsförordning (GDPR).
            </p>

            <h3 className="text-lg font-semibold text-[#333333] mb-3">
              Vilka uppgifter samlar vi in?
            </h3>
            <ul className="list-disc pl-6 mb-6 text-sm text-gray-700 space-y-1">
              <li>Kontaktuppgifter (namn, e-post, telefon)</li>
              <li>
                Information om hundar (namn, ras, ålder, hälsoinformation)
              </li>
              <li>Bokningshistorik och fakturauppgifter</li>
            </ul>

            <h3 className="text-lg font-semibold text-[#333333] mb-3">
              Hur används uppgifterna?
            </h3>
            <ul className="list-disc pl-6 mb-6 text-sm text-gray-700 space-y-1">
              <li>Tillhandahålla våra tjänster</li>
              <li>Kommunikation kring bokningar och fakturering</li>
              <li>Förbättra systemets funktionalitet</li>
            </ul>

            <div className="bg-green-50 border border-green-200 rounded-lg p-4 mt-6">
              <p className="text-sm text-gray-700 mb-4">
                Genom att fortsätta använda DogPlanner godkänner du vår
                hantering av personuppgifter enligt denna policy.
              </p>

              <div className="flex gap-4">
                <button
                  onClick={() => router.push("/")}
                  className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 font-medium text-sm"
                >
                  Tillbaka
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
