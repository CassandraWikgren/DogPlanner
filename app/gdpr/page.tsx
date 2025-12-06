"use client";
import { useRouter } from "next/navigation";

export default function GDPRPage() {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="border-b border-gray-200 bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <h1 className="text-[32px] font-bold text-[#2c7a4c] leading-tight">
            Integritetspolicy & GDPR
          </h1>
          <p className="mt-1 text-base text-gray-600">
            Hantering av personuppgifter enligt dataskyddsförordningen
          </p>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-6 py-6">
        <div className="bg-white rounded-lg p-6 border border-gray-200 shadow-sm">
          <div className="max-w-4xl space-y-8">
            {/* Inledning */}
            <section>
              <h2 className="text-xl font-semibold text-[#333333] mb-4">
                Hantering av personuppgifter
              </h2>
              <p className="text-sm text-gray-700">
                DogPlanner värnar om din integritet och hanterar dina
                personuppgifter enligt gällande dataskyddsförordning (GDPR).
                Denna policy beskriver hur vi samlar in, använder och skyddar
                dina uppgifter.
              </p>
            </section>

            {/* Personuppgiftsansvarig */}
            <section>
              <h3 className="text-lg font-semibold text-[#333333] mb-3">
                Personuppgiftsansvarig
              </h3>
              <p className="text-sm text-gray-700">
                Det hundföretag du har kontakt med är personuppgiftsansvarig för
                hanteringen av dina personuppgifter. DogPlanner tillhandahåller
                endast systemet som verktyg.
              </p>
            </section>

            {/* Vilka uppgifter */}
            <section>
              <h3 className="text-lg font-semibold text-[#333333] mb-3">
                Vilka uppgifter samlar vi in?
              </h3>
              <ul className="list-disc pl-6 text-sm text-gray-700 space-y-2">
                <li>
                  <strong>Kontaktuppgifter:</strong> Namn, e-postadress,
                  telefonnummer, adress
                </li>
                <li>
                  <strong>Nödkontakt:</strong> Namn och telefonnummer till
                  alternativ kontaktperson
                </li>
                <li>
                  <strong>Hundinformation:</strong> Namn, ras, ålder, kön, vikt,
                  mankhöjd, kastrering
                </li>
                <li>
                  <strong>Hälsoinformation:</strong> Vaccinationer, allergier,
                  mediciner, särskilda behov, beteendenoteringar
                </li>
                <li>
                  <strong>Bokningar:</strong> Bokningshistorik,
                  in/utcheckningstider
                </li>
                <li>
                  <strong>Ekonomi:</strong> Fakturauppgifter och
                  betalningshistorik
                </li>
              </ul>
            </section>

            {/* Rättslig grund */}
            <section>
              <h3 className="text-lg font-semibold text-[#333333] mb-3">
                Rättslig grund för behandling
              </h3>
              <ul className="list-disc pl-6 text-sm text-gray-700 space-y-2">
                <li>
                  <strong>Avtal:</strong> Vi behandlar dina uppgifter för att
                  kunna tillhandahålla de tjänster du bokar (dagis, pensionat,
                  grooming)
                </li>
                <li>
                  <strong>Samtycke:</strong> Du ger ditt samtycke genom att
                  skicka in intresseanmälan eller boka våra tjänster
                </li>
                <li>
                  <strong>Rättslig förpliktelse:</strong> Fakturauppgifter
                  sparas enligt bokföringslagen i 7 år
                </li>
              </ul>
            </section>

            {/* Hur används */}
            <section>
              <h3 className="text-lg font-semibold text-[#333333] mb-3">
                Hur används uppgifterna?
              </h3>
              <ul className="list-disc pl-6 text-sm text-gray-700 space-y-2">
                <li>
                  Tillhandahålla våra tjänster (dagis, pensionat, grooming)
                </li>
                <li>Säkerställa att din hund får rätt vård och omsorg</li>
                <li>
                  Kommunikation kring bokningar, påminnelser och ändringar
                </li>
                <li>Fakturering och betalningshantering</li>
                <li>Uppfylla lagkrav (bokföringslagen)</li>
              </ul>
            </section>

            {/* Lagring */}
            <section>
              <h3 className="text-lg font-semibold text-[#333333] mb-3">
                Hur länge sparas uppgifterna?
              </h3>
              <ul className="list-disc pl-6 text-sm text-gray-700 space-y-2">
                <li>
                  <strong>Kunduppgifter:</strong> Så länge du är aktiv kund,
                  plus 2 år efter sista kontakt
                </li>
                <li>
                  <strong>Bokningshistorik:</strong> 2 år efter genomförd
                  bokning
                </li>
                <li>
                  <strong>Fakturaunderlag:</strong> 7 år enligt bokföringslagen
                </li>
                <li>
                  <strong>Hälsojournaler:</strong> Raderas vid begäran eller 2
                  år efter sista besök
                </li>
              </ul>
            </section>

            {/* Dina rättigheter */}
            <section>
              <h3 className="text-lg font-semibold text-[#333333] mb-3">
                Dina rättigheter enligt GDPR
              </h3>
              <ul className="list-disc pl-6 text-sm text-gray-700 space-y-2">
                <li>
                  <strong>Rätt till tillgång:</strong> Du kan begära att få veta
                  vilka uppgifter vi har om dig
                </li>
                <li>
                  <strong>Rätt till rättelse:</strong> Du kan begära att
                  felaktiga uppgifter korrigeras
                </li>
                <li>
                  <strong>Rätt till radering:</strong> Du kan begära att dina
                  uppgifter raderas ("rätten att bli glömd")
                </li>
                <li>
                  <strong>Rätt till dataportabilitet:</strong> Du kan begära att
                  få dina uppgifter i ett maskinläsbart format
                </li>
                <li>
                  <strong>Rätt att invända:</strong> Du kan invända mot viss
                  behandling av dina uppgifter
                </li>
              </ul>
              <p className="text-sm text-gray-700 mt-3">
                För att utöva dina rättigheter, kontakta hundföretaget du är
                kund hos.
              </p>
            </section>

            {/* Säkerhet */}
            <section>
              <h3 className="text-lg font-semibold text-[#333333] mb-3">
                Säkerhet
              </h3>
              <p className="text-sm text-gray-700">
                Vi vidtar tekniska och organisatoriska åtgärder för att skydda
                dina personuppgifter mot obehörig åtkomst, ändring eller
                radering. All data lagras på säkra servrar med kryptering.
              </p>
            </section>

            {/* Cookies */}
            <section>
              <h3 className="text-lg font-semibold text-[#333333] mb-3">
                Cookies
              </h3>
              <p className="text-sm text-gray-700">
                DogPlanner använder endast nödvändiga cookies för att systemet
                ska fungera (inloggning, sessionshantering). Vi använder inga
                spårningscookies eller tredjepartscookies för marknadsföring.
              </p>
            </section>

            {/* Kontakt */}
            <section>
              <h3 className="text-lg font-semibold text-[#333333] mb-3">
                Frågor om integritet?
              </h3>
              <p className="text-sm text-gray-700">
                Har du frågor om hur dina personuppgifter hanteras? Kontakta det
                hundföretag du är kund hos. De är personuppgiftsansvariga och
                kan hjälpa dig med dina förfrågningar.
              </p>
              <p className="text-sm text-gray-700 mt-2">
                Du har också rätt att lämna klagomål till
                Integritetsskyddsmyndigheten (IMY) om du anser att dina
                uppgifter hanteras felaktigt.
              </p>
            </section>

            {/* Uppdatering */}
            <section className="border-t border-gray-200 pt-6">
              <p className="text-xs text-gray-500">
                Denna integritetspolicy uppdaterades senast: December 2025
              </p>
            </section>

            {/* Godkännande */}
            <div className="bg-green-50 border border-green-200 rounded-lg p-4 mt-6">
              <p className="text-sm text-gray-700 mb-4">
                Genom att använda DogPlanner och våra tjänster godkänner du vår
                hantering av personuppgifter enligt denna policy.
              </p>

              <button onClick={() => router.back()} className="btn-primary">
                Tillbaka
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
