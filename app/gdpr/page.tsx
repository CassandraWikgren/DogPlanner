"use client";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";

export default function GDPRPage() {
  const router = useRouter();

  function handleAccept() {
    console.log("✅ GDPR-godkännande accepterat");
    router.push("/dashboard");
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-lg shadow-md p-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-6">
            Integritetspolicy & GDPR
          </h1>

          <div className="prose max-w-none">
            <h2 className="text-xl font-semibold mb-4">
              Hantering av personuppgifter
            </h2>
            <p className="mb-4">
              DogPlanner värnar om din integritet och hanterar dina
              personuppgifter enligt gällande dataskyddsförordning (GDPR).
            </p>

            <h3 className="text-lg font-semibold mb-3">
              Vilka uppgifter samlar vi in?
            </h3>
            <ul className="list-disc pl-6 mb-4">
              <li>Kontaktuppgifter (namn, e-post, telefon)</li>
              <li>
                Information om hundar (namn, ras, ålder, hälsoinformation)
              </li>
              <li>Bokningshistorik och fakturauppgifter</li>
            </ul>

            <h3 className="text-lg font-semibold mb-3">
              Hur används uppgifterna?
            </h3>
            <ul className="list-disc pl-6 mb-4">
              <li>Tillhandahålla våra tjänster</li>
              <li>Kommunikation kring bokningar och fakturering</li>
              <li>Förbättra systemets funktionalitet</li>
            </ul>

            <div className="bg-green-50 border border-green-200 rounded-lg p-4 mt-6">
              <p className="text-gray-700 mb-4">
                Genom att fortsätta använda DogPlanner godkänner du vår
                hantering av personuppgifter enligt denna policy.
              </p>

              <div className="flex gap-4">
                <Button
                  onClick={handleAccept}
                  className="bg-[#2c7a4c] hover:bg-[#1e5a35] text-white"
                >
                  Jag godkänner
                </Button>
                <Button
                  variant="outline"
                  onClick={() => router.push("/")}
                  className="border-gray-300 text-gray-700 hover:bg-gray-50"
                >
                  Tillbaka
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
