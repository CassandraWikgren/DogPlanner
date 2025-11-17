"use client";

import { useState } from "react";
import Link from "next/link";
import {
  ChevronDown,
  ChevronUp,
  Shield,
  FileText,
  Cookie,
  Building2,
} from "lucide-react";

export default function IntegritetspolicyKundPage() {
  const [expandedSection, setExpandedSection] = useState<string | null>(null);

  const toggleSection = (section: string) => {
    setExpandedSection(expandedSection === section ? null : section);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex items-center space-x-3 mb-4">
            <Shield className="w-8 h-8 text-primary" />
            <h1 className="text-3xl font-bold text-gray-900">
              Integritetspolicy för Hundägare
            </h1>
          </div>
          <p className="text-gray-600">
            <strong>Senast uppdaterad:</strong> 17 november 2025
          </p>
          <p className="text-sm text-gray-500 mt-2">
            Version 1.0 | Gäller från: 17 november 2025
          </p>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Quick Links */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-8">
          <h2 className="text-lg font-semibold text-blue-900 mb-4">
            Snabbnavigation
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <a
              href="#vad-samlar-vi"
              className="text-blue-700 hover:text-blue-900 text-sm"
            >
              → Vilka uppgifter samlar vi in?
            </a>
            <a
              href="#hur-anvander-vi"
              className="text-blue-700 hover:text-blue-900 text-sm"
            >
              → Hur använder vi dina uppgifter?
            </a>
            <a
              href="#dina-rattigheter"
              className="text-blue-700 hover:text-blue-900 text-sm"
            >
              → Dina rättigheter
            </a>
            <a
              href="#kontakt"
              className="text-blue-700 hover:text-blue-900 text-sm"
            >
              → Kontakta oss
            </a>
          </div>
        </div>

        {/* Main Content */}
        <div className="bg-white rounded-lg shadow-sm border p-8 space-y-8">
          {/* 1. Introduktion */}
          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              1. Introduktion
            </h2>
            <div className="prose prose-gray max-w-none">
              <p>
                Välkommen till DogPlanner! Vi värnar om din integritet och är
                dedikerade till att skydda dina personuppgifter. Denna
                integritetspolicy förklarar hur vi samlar in, använder, lagrar
                och skyddar dina uppgifter när du använder vår tjänst för att
                boka hunddagis eller hundpensionat.
              </p>
              <p className="mt-4">
                <strong>Personuppgiftsansvarig:</strong>
                <br />
                DogPlanner AB
                <br />
                Organisationsnummer: [DITT ORG-NR]
                <br />
                Adress: [DIN ADRESS]
                <br />
                E-post: privacy@dogplanner.se
              </p>
              <p className="mt-4">
                Denna policy följer EU:s dataskyddsförordning (GDPR) och svensk
                lagstiftning.
              </p>
            </div>
          </section>

          {/* 2. Vilka uppgifter samlar vi in? */}
          <section id="vad-samlar-vi">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              2. Vilka personuppgifter samlar vi in?
            </h2>

            <div className="space-y-4">
              {/* 2.1 Kontaktuppgifter */}
              <div className="border-l-4 border-primary pl-4">
                <h3 className="text-lg font-semibold mb-2">
                  2.1 Kontaktuppgifter
                </h3>
                <ul className="list-disc list-inside space-y-1 text-gray-700">
                  <li>Namn (för- och efternamn)</li>
                  <li>E-postadress</li>
                  <li>Telefonnummer</li>
                  <li>Postadress (gatuadress, postnummer, ort)</li>
                  <li>Personnummer (frivilligt, endast om du anger det)</li>
                </ul>
              </div>

              {/* 2.2 Hunduppgifter */}
              <div className="border-l-4 border-primary pl-4">
                <h3 className="text-lg font-semibold mb-2">
                  2.2 Information om din hund
                </h3>
                <ul className="list-disc list-inside space-y-1 text-gray-700">
                  <li>Namn, ras, födelsedatum, kön</li>
                  <li>Storlek och vikt</li>
                  <li>Vaccinations- och försäkringsuppgifter</li>
                  <li>Medicinska tillstånd och allergier</li>
                  <li>
                    Beteendeinformation (social med andra hundar, specialbehov,
                    etc.)
                  </li>
                  <li>Kostinformation</li>
                  <li>Foto av hunden (frivilligt)</li>
                </ul>
              </div>

              {/* 2.3 Bokningsuppgifter */}
              <div className="border-l-4 border-primary pl-4">
                <h3 className="text-lg font-semibold mb-2">
                  2.3 Boknings- och transaktionsuppgifter
                </h3>
                <ul className="list-disc list-inside space-y-1 text-gray-700">
                  <li>Bokningshistorik (datum, tid, tjänst)</li>
                  <li>
                    Betalningsinformation (hanteras av säker
                    betalningsleverantör)
                  </li>
                  <li>Fakturor och kvitton</li>
                  <li>Särskilda önskemål och anteckningar</li>
                  <li>Avbokningar och anledningar</li>
                </ul>
              </div>

              {/* 2.4 Teknisk information */}
              <div className="border-l-4 border-primary pl-4">
                <h3 className="text-lg font-semibold mb-2">
                  2.4 Teknisk information
                </h3>
                <ul className="list-disc list-inside space-y-1 text-gray-700">
                  <li>IP-adress</li>
                  <li>Webbläsartyp och version</li>
                  <li>Enhetsinformation</li>
                  <li>
                    Cookies (se vår{" "}
                    <Link
                      href="/legal/cookies"
                      className="text-primary hover:underline"
                    >
                      cookie-policy
                    </Link>
                    )
                  </li>
                </ul>
              </div>
            </div>
          </section>

          {/* 3. Hur använder vi dina uppgifter? */}
          <section id="hur-anvander-vi">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              3. Hur använder vi dina personuppgifter?
            </h2>

            <div className="space-y-4">
              <p className="text-gray-700">
                Vi behandlar dina personuppgifter för följande ändamål, med stöd
                av rättslig grund enligt GDPR:
              </p>

              {/* Avtalsuppfyllelse */}
              <div className="bg-gray-50 rounded-lg p-4">
                <h3 className="font-semibold text-primary mb-2">
                  📋 Avtalsuppfyllelse (GDPR Art. 6.1.b)
                </h3>
                <ul className="list-disc list-inside space-y-1 text-gray-700 text-sm">
                  <li>
                    Hantera dina bokningar av hunddagis eller hundpensionat
                  </li>
                  <li>Kommunicera med dig om bokningar och tjänster</li>
                  <li>Tillhandahålla kundsupport</li>
                  <li>Administrera betalningar och fakturor</li>
                </ul>
              </div>

              {/* Rättslig förpliktelse */}
              <div className="bg-gray-50 rounded-lg p-4">
                <h3 className="font-semibold text-primary mb-2">
                  ⚖️ Rättslig förpliktelse (GDPR Art. 6.1.c)
                </h3>
                <ul className="list-disc list-inside space-y-1 text-gray-700 text-sm">
                  <li>Bokföring enligt bokföringslagen (7 år)</li>
                  <li>Skatte- och momsredovisning</li>
                  <li>Hantera eventuella tvister eller klagomål</li>
                </ul>
              </div>

              {/* Berättigat intresse */}
              <div className="bg-gray-50 rounded-lg p-4">
                <h3 className="font-semibold text-primary mb-2">
                  ⚡ Berättigat intresse (GDPR Art. 6.1.f)
                </h3>
                <ul className="list-disc list-inside space-y-1 text-gray-700 text-sm">
                  <li>Förbättra våra tjänster och användarupplevelse</li>
                  <li>Säkerhet och bedrägeriförebyggande</li>
                  <li>Analysera användning av plattformen</li>
                  <li>Skicka viktig serviceinformation</li>
                </ul>
              </div>

              {/* Samtycke */}
              <div className="bg-gray-50 rounded-lg p-4">
                <h3 className="font-semibold text-primary mb-2">
                  ✅ Samtycke (GDPR Art. 6.1.a)
                </h3>
                <ul className="list-disc list-inside space-y-1 text-gray-700 text-sm">
                  <li>
                    Marknadsföring via e-post (kan avbrytas när som helst)
                  </li>
                  <li>Personliga erbjudanden och rabatter</li>
                  <li>Nyhetsbrev och tips om hundvård</li>
                  <li>Foto av din hund (om du väljer att ladda upp)</li>
                </ul>
                <p className="text-sm text-gray-600 mt-2 italic">
                  Du kan när som helst återkalla ditt samtycke genom att
                  kontakta oss eller klicka på "avregistrera" i våra
                  e-postutskick.
                </p>
              </div>
            </div>
          </section>

          {/* 4. Vem delar vi dina uppgifter med? */}
          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              4. Vem delar vi dina uppgifter med?
            </h2>

            <div className="space-y-4">
              <div className="border-l-4 border-yellow-500 bg-yellow-50 p-4">
                <p className="font-semibold text-yellow-900 mb-2">
                  Viktigt att veta:
                </p>
                <p className="text-yellow-800 text-sm">
                  Vi säljer <strong>aldrig</strong> dina personuppgifter till
                  tredje part.
                </p>
              </div>

              <p className="text-gray-700">
                Vi delar dina uppgifter endast med följande parter när det är
                nödvändigt:
              </p>

              {/* Hunddagis/pensionat */}
              <div className="bg-gray-50 rounded-lg p-4">
                <h3 className="font-semibold mb-2">
                  🏢 Hunddagis och hundpensionat
                </h3>
                <p className="text-sm text-gray-700">
                  När du bokar en tjänst delar vi nödvändig information med det
                  valda hunddagis eller hundpensionatet. Detta inkluderar dina
                  kontaktuppgifter och hundens information för att de ska kunna
                  ge bästa möjliga omsorg.
                </p>
                <p className="text-sm text-gray-600 mt-2">
                  <strong>Rättslig grund:</strong> Avtalsuppfyllelse (GDPR Art.
                  6.1.b)
                </p>
              </div>

              {/* Tekniska leverantörer */}
              <div className="bg-gray-50 rounded-lg p-4">
                <h3 className="font-semibold mb-2">💻 Tekniska leverantörer</h3>
                <ul className="list-disc list-inside space-y-1 text-sm text-gray-700">
                  <li>
                    <strong>Supabase (EU):</strong> Databas och autentisering
                    (data lagras i EU)
                  </li>
                  <li>
                    <strong>Vercel (EU):</strong> Webbhotell och drift (data
                    lagras i EU)
                  </li>
                  <li>
                    <strong>Resend:</strong> E-posttjänst för transaktionsmail
                  </li>
                  <li>
                    <strong>Stripe/Klarna:</strong> Betalningshantering (vi
                    lagrar ej kortuppgifter)
                  </li>
                </ul>
                <p className="text-sm text-gray-600 mt-2">
                  Alla våra leverantörer har personuppgiftsbiträdesavtal och
                  följer GDPR.
                </p>
              </div>

              {/* Myndigheter */}
              <div className="bg-gray-50 rounded-lg p-4">
                <h3 className="font-semibold mb-2">⚖️ Myndigheter</h3>
                <p className="text-sm text-gray-700">
                  Vi kan bli skyldiga att dela uppgifter med myndigheter
                  (Skatteverket, polis, domstol) om det krävs enligt lag.
                </p>
              </div>
            </div>
          </section>

          {/* 5. Var lagrar vi dina uppgifter? */}
          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              5. Var lagrar vi dina uppgifter?
            </h2>
            <div className="bg-green-50 border border-green-200 rounded-lg p-6">
              <div className="flex items-start space-x-3">
                <Shield className="w-6 h-6 text-green-700 mt-1" />
                <div>
                  <h3 className="font-semibold text-green-900 mb-2">
                    Säker lagring inom EU
                  </h3>
                  <p className="text-sm text-green-800">
                    Alla dina personuppgifter lagras säkert på servrar inom EU
                    (främst Sverige och Tyskland). Vi överför{" "}
                    <strong>aldrig</strong> dina uppgifter till länder utanför
                    EU/EES utan adekvat skyddsnivå.
                  </p>
                  <ul className="list-disc list-inside mt-3 space-y-1 text-sm text-green-800">
                    <li>Krypterad databaslagring</li>
                    <li>HTTPS-kryptering för all kommunikation</li>
                    <li>Regelbundna säkerhetskopior</li>
                    <li>Tvåfaktorsautentisering för administratörer</li>
                    <li>Regelbunden säkerhetsöversyn</li>
                  </ul>
                </div>
              </div>
            </div>
          </section>

          {/* 6. Hur länge sparar vi dina uppgifter? */}
          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              6. Hur länge sparar vi dina uppgifter?
            </h2>

            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 border">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Typ av uppgift
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Lagringstid
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Grund
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  <tr>
                    <td className="px-6 py-4 text-sm text-gray-900">
                      Kontaktuppgifter och hunduppgifter
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-700">
                      3 år efter sista bokning
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      Berättigat intresse + GDPR
                    </td>
                  </tr>
                  <tr>
                    <td className="px-6 py-4 text-sm text-gray-900">
                      Bokningshistorik och fakturor
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-700">7 år</td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      Bokföringslagen
                    </td>
                  </tr>
                  <tr>
                    <td className="px-6 py-4 text-sm text-gray-900">
                      Marknadsföringssamtycke
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-700">
                      Tills du avregistrerar dig
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      Samtycke (kan återkallas)
                    </td>
                  </tr>
                  <tr>
                    <td className="px-6 py-4 text-sm text-gray-900">
                      Inloggningsloggar
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-700">
                      90 dagar
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      Säkerhet
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            <p className="text-sm text-gray-600 mt-4 italic">
              Efter att lagringstiden löpt ut raderas eller anonymiseras dina
              uppgifter automatiskt.
            </p>
          </section>

          {/* 7. Dina rättigheter */}
          <section id="dina-rattigheter">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              7. Dina rättigheter enligt GDPR
            </h2>

            <div className="space-y-4">
              <p className="text-gray-700">
                Du har följande rättigheter när det gäller dina personuppgifter:
              </p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Rätt till tillgång */}
                <div className="border border-gray-200 rounded-lg p-4">
                  <h3 className="font-semibold text-primary mb-2">
                    📋 Rätt till tillgång (Art. 15)
                  </h3>
                  <p className="text-sm text-gray-700">
                    Du har rätt att få en kopia av alla personuppgifter vi har
                    om dig (registerutdrag).
                  </p>
                </div>

                {/* Rätt till rättelse */}
                <div className="border border-gray-200 rounded-lg p-4">
                  <h3 className="font-semibold text-primary mb-2">
                    ✏️ Rätt till rättelse (Art. 16)
                  </h3>
                  <p className="text-sm text-gray-700">
                    Du kan när som helst uppdatera eller rätta felaktiga
                    uppgifter via ditt konto.
                  </p>
                </div>

                {/* Rätt till radering */}
                <div className="border border-gray-200 rounded-lg p-4">
                  <h3 className="font-semibold text-primary mb-2">
                    🗑️ Rätt till radering (Art. 17)
                  </h3>
                  <p className="text-sm text-gray-700">
                    Du kan begära att vi raderar dina uppgifter, med vissa
                    undantag (t.ex. bokföringskrav).
                  </p>
                </div>

                {/* Rätt till dataportabilitet */}
                <div className="border border-gray-200 rounded-lg p-4">
                  <h3 className="font-semibold text-primary mb-2">
                    📦 Rätt till dataportabilitet (Art. 20)
                  </h3>
                  <p className="text-sm text-gray-700">
                    Du kan få ut dina uppgifter i ett strukturerat,
                    maskinläsbart format (JSON/CSV).
                  </p>
                </div>

                {/* Rätt att invända */}
                <div className="border border-gray-200 rounded-lg p-4">
                  <h3 className="font-semibold text-primary mb-2">
                    🚫 Rätt att invända (Art. 21)
                  </h3>
                  <p className="text-sm text-gray-700">
                    Du kan invända mot behandling som baseras på berättigat
                    intresse, t.ex. marknadsföring.
                  </p>
                </div>

                {/* Rätt att återkalla samtycke */}
                <div className="border border-gray-200 rounded-lg p-4">
                  <h3 className="font-semibold text-primary mb-2">
                    ↩️ Rätt att återkalla samtycke (Art. 7.3)
                  </h3>
                  <p className="text-sm text-gray-700">
                    Du kan när som helst återkalla ditt samtycke, t.ex. för
                    marknadsföring.
                  </p>
                </div>
              </div>

              {/* Hur utövar du dina rättigheter? */}
              <div className="bg-primary/5 border border-primary/20 rounded-lg p-6 mt-6">
                <h3 className="font-semibold text-primary mb-3">
                  Hur utövar du dina rättigheter?
                </h3>
                <div className="space-y-2 text-sm text-gray-700">
                  <p>
                    <strong>1. Via ditt konto:</strong> Logga in och gå till
                    "Inställningar" → "Integritet & Data"
                  </p>
                  <p>
                    <strong>2. Via e-post:</strong> Skicka din begäran till{" "}
                    <a
                      href="mailto:privacy@dogplanner.se"
                      className="text-primary hover:underline"
                    >
                      privacy@dogplanner.se
                    </a>
                  </p>
                  <p className="text-gray-600 italic">
                    Vi svarar normalt inom 30 dagar enligt GDPR. Identifiering
                    kan krävas för säkerhets skull.
                  </p>
                </div>
              </div>
            </div>
          </section>

          {/* 8. Cookies och spårning */}
          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              8. Cookies och spårningsteknologi
            </h2>
            <p className="text-gray-700 mb-4">
              Vi använder cookies för att förbättra din upplevelse på vår
              plattform. Läs mer i vår detaljerade{" "}
              <Link
                href="/legal/cookies"
                className="text-primary hover:underline font-semibold"
              >
                cookie-policy
              </Link>
              .
            </p>

            <div className="bg-gray-50 rounded-lg p-4">
              <h3 className="font-semibold mb-2">Sammanfattning:</h3>
              <ul className="list-disc list-inside space-y-1 text-sm text-gray-700">
                <li>
                  <strong>Nödvändiga cookies:</strong> För inloggning och
                  säkerhet (kan ej avböjas)
                </li>
                <li>
                  <strong>Funktionella cookies:</strong> För att komma ihåg dina
                  inställningar
                </li>
                <li>
                  <strong>Analytiska cookies:</strong> För att förstå hur
                  plattformen används (anonymiserat)
                </li>
                <li>
                  <strong>Marknadsföringscookies:</strong> Används endast med
                  ditt samtycke
                </li>
              </ul>
            </div>
          </section>

          {/* 9. Barns integritet */}
          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              9. Barns integritet
            </h2>
            <div className="border-l-4 border-yellow-500 bg-yellow-50 p-4">
              <p className="text-gray-700">
                Vår tjänst är inte avsedd för barn under 13 år. Om du är
                förälder och upptäcker att ditt barn har registrerat sig,
                vänligen kontakta oss så raderar vi informationen omgående.
              </p>
            </div>
          </section>

          {/* 10. Ändringar i integritetspolicyn */}
          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              10. Ändringar i integritetspolicyn
            </h2>
            <p className="text-gray-700">
              Vi kan komma att uppdatera denna integritetspolicy. Vid väsentliga
              ändringar kommer vi att meddela dig via e-post eller genom en
              tydlig notis på plattformen. Vi rekommenderar att du regelbundet
              läser denna policy för att hålla dig uppdaterad.
            </p>
            <p className="text-sm text-gray-600 mt-2">
              <strong>Senaste uppdatering:</strong> 17 november 2025
            </p>
          </section>

          {/* 11. Klagomål och tillsyn */}
          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              11. Klagomål och tillsyn
            </h2>
            <div className="space-y-4">
              <p className="text-gray-700">
                Om du har klagomål om hur vi hanterar dina personuppgifter,
                vänligen kontakta oss först:
              </p>

              <div className="bg-gray-50 rounded-lg p-4">
                <h3 className="font-semibold mb-2">📧 Kontakta oss</h3>
                <p className="text-sm text-gray-700">
                  E-post:{" "}
                  <a
                    href="mailto:privacy@dogplanner.se"
                    className="text-primary hover:underline"
                  >
                    privacy@dogplanner.se
                  </a>
                  <br />
                  Telefon: [DITT TELEFONNUMMER]
                  <br />
                  Adress: [DIN ADRESS]
                </p>
              </div>

              <p className="text-gray-700">
                Du har även rätt att lämna in ett klagomål till
                tillsynsmyndigheten:
              </p>

              <div className="bg-gray-50 rounded-lg p-4">
                <h3 className="font-semibold mb-2">
                  🏛️ Integritetsskyddsmyndigheten (IMY)
                </h3>
                <p className="text-sm text-gray-700">
                  Box 8114
                  <br />
                  104 20 Stockholm
                  <br />
                  Telefon: 08-657 61 00
                  <br />
                  E-post: imy@imy.se
                  <br />
                  Webbplats:{" "}
                  <a
                    href="https://www.imy.se"
                    target="_blank"
                    rel="noopener"
                    className="text-primary hover:underline"
                  >
                    www.imy.se
                  </a>
                </p>
              </div>
            </div>
          </section>

          {/* 12. Kontakt */}
          <section id="kontakt">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              12. Kontakta oss
            </h2>
            <div className="bg-primary/5 border border-primary/20 rounded-lg p-6">
              <p className="text-gray-700 mb-4">
                Har du frågor om denna integritetspolicy eller hur vi hanterar
                dina personuppgifter? Tveka inte att kontakta oss!
              </p>

              <div className="space-y-2 text-sm">
                <p>
                  <strong>E-post:</strong>{" "}
                  <a
                    href="mailto:privacy@dogplanner.se"
                    className="text-primary hover:underline"
                  >
                    privacy@dogplanner.se
                  </a>
                </p>
                <p>
                  <strong>Telefon:</strong> [DITT TELEFONNUMMER]
                </p>
                <p>
                  <strong>Postadress:</strong>
                  <br />
                  DogPlanner AB
                  <br />
                  [DIN ADRESS]
                  <br />
                  [POSTNUMMER OCH ORT]
                </p>
              </div>

              <p className="text-xs text-gray-600 mt-4">
                Vi strävar efter att svara på alla förfrågningar inom 72 timmar.
              </p>
            </div>
          </section>
        </div>

        {/* Footer Navigation */}
        <div className="mt-8 bg-white rounded-lg shadow-sm border p-6">
          <h3 className="font-semibold text-gray-900 mb-4">
            Relaterade dokument
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Link
              href="/legal/terms-customer"
              className="flex items-center space-x-2 text-primary hover:text-primary-dark"
            >
              <FileText className="w-5 h-5" />
              <span>Användarvillkor</span>
            </Link>
            <Link
              href="/legal/cookies"
              className="flex items-center space-x-2 text-primary hover:text-primary-dark"
            >
              <Cookie className="w-5 h-5" />
              <span>Cookie-policy</span>
            </Link>
            <Link
              href="/legal/privacy-policy-business"
              className="flex items-center space-x-2 text-primary hover:text-primary-dark"
            >
              <Building2 className="w-5 h-5" />
              <span>Policy för företag</span>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
