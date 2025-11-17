"use client";

import Link from "next/link";
import { Cookie, Shield, FileText, Settings, Info } from "lucide-react";

export default function CookiePolicyPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex items-center space-x-3 mb-4">
            <Cookie className="w-8 h-8 text-primary" />
            <h1 className="text-3xl font-bold text-gray-900">Cookie-policy</h1>
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
        {/* Cookie Banner Info */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-8">
          <div className="flex items-start space-x-3">
            <Info className="w-6 h-6 text-blue-700 mt-1" />
            <div>
              <h3 className="font-semibold text-blue-900 mb-2">Om cookies</h3>
              <p className="text-sm text-blue-800">
                Cookies är små textfiler som lagras på din enhet när du besöker
                en webbplats. De hjälper oss att förbättra din upplevelse, komma
                ihåg dina inställningar och förstå hur du använder vår tjänst.
                Du kan när som helst ändra dina cookie-inställningar.
              </p>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="bg-white rounded-lg shadow-sm border p-8 space-y-8">
          {/* 1. Vad är cookies? */}
          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              1. Vad är cookies?
            </h2>
            <div className="prose prose-gray max-w-none text-gray-700">
              <p>
                En cookie är en liten textfil som lagras på din dator, telefon
                eller surfplatta när du besöker en webbplats. Cookies används
                för att webbplatsen ska fungera optimalt, ge dig en bättre
                upplevelse och för att vi ska kunna analysera hur vår tjänst
                används.
              </p>

              <h3 className="text-lg font-semibold mt-6 mb-3">
                Cookies kan vara:
              </h3>
              <ul className="list-disc list-inside space-y-2">
                <li>
                  <strong>Sessionscookies:</strong> Tillfälliga cookies som
                  försvinner när du stänger webbläsaren
                </li>
                <li>
                  <strong>Permanenta cookies:</strong> Sparas på din enhet tills
                  de raderas eller går ut
                </li>
                <li>
                  <strong>Förstapartscookies:</strong> Sätts av DogPlanner
                </li>
                <li>
                  <strong>Tredjepartscookies:</strong> Sätts av externa
                  leverantörer (t.ex. Google Analytics)
                </li>
              </ul>
            </div>
          </section>

          {/* 2. Varför använder vi cookies? */}
          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              2. Varför använder vi cookies?
            </h2>
            <p className="text-gray-700 mb-6">
              Vi använder cookies för att förbättra din upplevelse på DogPlanner
              och för att tjänsten ska fungera korrekt. Olika cookies har olika
              syften:
            </p>

            {/* 2.1 Nödvändiga cookies */}
            <div className="border border-red-200 bg-red-50 rounded-lg p-6 mb-4">
              <div className="flex items-start space-x-3">
                <Shield className="w-6 h-6 text-red-700 mt-1" />
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-red-900 mb-2">
                    Nödvändiga cookies (Kan ej avböjas)
                  </h3>
                  <p className="text-sm text-red-800 mb-3">
                    Dessa cookies är nödvändiga för att webbplatsen ska fungera
                    och kan inte stängas av. De sätts vanligtvis som svar på
                    åtgärder du gör, som att ställa in säkerhetsinställningar,
                    logga in eller fylla i formulär.
                  </p>

                  <div className="bg-white rounded-lg p-4 space-y-3">
                    <div>
                      <p className="font-semibold text-sm text-gray-900">
                        Autentisering
                      </p>
                      <p className="text-xs text-gray-600">
                        <strong>Cookie:</strong> supabase-auth-token
                        <br />
                        <strong>Syfte:</strong> Håller dig inloggad mellan
                        sidvisningar
                        <br />
                        <strong>Giltighetstid:</strong> 7 dagar
                        <br />
                        <strong>Leverantör:</strong> Supabase (EU)
                      </p>
                    </div>

                    <div>
                      <p className="font-semibold text-sm text-gray-900">
                        Session
                      </p>
                      <p className="text-xs text-gray-600">
                        <strong>Cookie:</strong> dogplanner-session
                        <br />
                        <strong>Syfte:</strong> Identifierar din session
                        <br />
                        <strong>Giltighetstid:</strong> Session (raderas vid
                        stängning)
                        <br />
                        <strong>Leverantör:</strong> DogPlanner
                      </p>
                    </div>

                    <div>
                      <p className="font-semibold text-sm text-gray-900">
                        CSRF-skydd
                      </p>
                      <p className="text-xs text-gray-600">
                        <strong>Cookie:</strong> csrf-token
                        <br />
                        <strong>Syfte:</strong> Skyddar mot cross-site request
                        forgery-attacker
                        <br />
                        <strong>Giltighetstid:</strong> Session
                        <br />
                        <strong>Leverantör:</strong> DogPlanner
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* 2.2 Funktionella cookies */}
            <div className="border border-blue-200 bg-blue-50 rounded-lg p-6 mb-4">
              <div className="flex items-start space-x-3">
                <Settings className="w-6 h-6 text-blue-700 mt-1" />
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-blue-900 mb-2">
                    Funktionella cookies
                  </h3>
                  <p className="text-sm text-blue-800 mb-3">
                    Dessa cookies gör att webbplatsen kan komma ihåg val du gör
                    (som språk eller region) och ge förbättrade, mer personliga
                    funktioner.
                  </p>

                  <div className="bg-white rounded-lg p-4 space-y-3">
                    <div>
                      <p className="font-semibold text-sm text-gray-900">
                        Språkinställningar
                      </p>
                      <p className="text-xs text-gray-600">
                        <strong>Cookie:</strong> dogplanner-lang
                        <br />
                        <strong>Syfte:</strong> Sparar valt språk
                        (svenska/engelska)
                        <br />
                        <strong>Giltighetstid:</strong> 1 år
                        <br />
                        <strong>Leverantör:</strong> DogPlanner
                      </p>
                    </div>

                    <div>
                      <p className="font-semibold text-sm text-gray-900">
                        Cookie-val
                      </p>
                      <p className="text-xs text-gray-600">
                        <strong>Cookie:</strong> cookie-consent
                        <br />
                        <strong>Syfte:</strong> Sparar dina cookie-inställningar
                        <br />
                        <strong>Giltighetstid:</strong> 1 år
                        <br />
                        <strong>Leverantör:</strong> DogPlanner
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* 2.3 Analytiska cookies */}
            <div className="border border-purple-200 bg-purple-50 rounded-lg p-6 mb-4">
              <div className="flex items-start space-x-3">
                <FileText className="w-6 h-6 text-purple-700 mt-1" />
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-purple-900 mb-2">
                    Analytiska cookies (Kräver samtycke)
                  </h3>
                  <p className="text-sm text-purple-800 mb-3">
                    Dessa cookies hjälper oss förstå hur besökare interagerar
                    med webbplatsen genom att samla in och rapportera
                    information anonymt. Vi använder denna data för att
                    förbättra tjänsten.
                  </p>

                  <div className="bg-white rounded-lg p-4 space-y-3">
                    <div>
                      <p className="font-semibold text-sm text-gray-900">
                        Google Analytics (Om du godkänner)
                      </p>
                      <p className="text-xs text-gray-600">
                        <strong>Cookies:</strong> _ga, _ga_*, _gid
                        <br />
                        <strong>Syfte:</strong> Analysera användning och
                        förbättra tjänsten
                        <br />
                        <strong>Data:</strong> Anonymiserad (IP-adresser
                        maskeras)
                        <br />
                        <strong>Giltighetstid:</strong> _ga: 2 år, _gid: 24
                        timmar
                        <br />
                        <strong>Leverantör:</strong> Google Ireland Ltd (EU)
                        <br />
                        <strong>Mer info:</strong>{" "}
                        <a
                          href="https://policies.google.com/privacy"
                          target="_blank"
                          rel="noopener"
                          className="text-primary hover:underline"
                        >
                          Google Privacy Policy
                        </a>
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* 2.4 Marknadsföringscookies */}
            <div className="border border-green-200 bg-green-50 rounded-lg p-6">
              <div className="flex items-start space-x-3">
                <Cookie className="w-6 h-6 text-green-700 mt-1" />
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-green-900 mb-2">
                    Marknadsföringscookies (Kräver samtycke)
                  </h3>
                  <p className="text-sm text-green-800 mb-3">
                    Dessa cookies används för att visa relevanta annonser och
                    marknadsföringsmeddelanden. De kan också användas för att
                    begränsa hur många gånger du ser en annons.
                  </p>

                  <div className="bg-white rounded-lg p-4">
                    <p className="text-sm text-gray-700">
                      <strong>⚠️ Observera:</strong> Vi använder för närvarande{" "}
                      <strong>inte</strong> marknadsföringscookies på
                      DogPlanner. Om vi i framtiden skulle börja använda sådana
                      kommer vi att informera dig och be om ditt samtycke.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* 3. Hur länge sparas cookies? */}
          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              3. Hur länge sparas cookies?
            </h2>

            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 border">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Cookie
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Typ
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Giltighetstid
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  <tr>
                    <td className="px-6 py-4 text-sm text-gray-900">
                      supabase-auth-token
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-700">
                      Nödvändig
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">7 dagar</td>
                  </tr>
                  <tr>
                    <td className="px-6 py-4 text-sm text-gray-900">
                      dogplanner-session
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-700">
                      Nödvändig
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">Session</td>
                  </tr>
                  <tr>
                    <td className="px-6 py-4 text-sm text-gray-900">
                      csrf-token
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-700">
                      Nödvändig
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">Session</td>
                  </tr>
                  <tr>
                    <td className="px-6 py-4 text-sm text-gray-900">
                      dogplanner-lang
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-700">
                      Funktionell
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">1 år</td>
                  </tr>
                  <tr>
                    <td className="px-6 py-4 text-sm text-gray-900">
                      cookie-consent
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-700">
                      Funktionell
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">1 år</td>
                  </tr>
                  <tr>
                    <td className="px-6 py-4 text-sm text-gray-900">_ga</td>
                    <td className="px-6 py-4 text-sm text-gray-700">
                      Analytisk
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">2 år</td>
                  </tr>
                  <tr>
                    <td className="px-6 py-4 text-sm text-gray-900">_gid</td>
                    <td className="px-6 py-4 text-sm text-gray-700">
                      Analytisk
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      24 timmar
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </section>

          {/* 4. Hantera dina cookie-inställningar */}
          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              4. Hur hanterar jag mina cookie-inställningar?
            </h2>

            <div className="space-y-4">
              <h3 className="text-lg font-semibold">4.1 Via DogPlanner</h3>
              <p className="text-gray-700 text-sm">
                Du kan när som helst ändra dina cookie-inställningar genom att
                klicka på "Cookie-inställningar" längst ner på sidan. Där kan du
                välja vilka typer av cookies du accepterar.
              </p>

              <div className="bg-primary/5 border border-primary/20 rounded-lg p-4 mt-4">
                <button className="px-4 py-2 bg-primary text-white rounded-md hover:bg-primary-dark">
                  Hantera cookie-inställningar
                </button>
              </div>

              <h3 className="text-lg font-semibold mt-6">
                4.2 Via din webbläsare
              </h3>
              <p className="text-gray-700 text-sm mb-3">
                Du kan också hantera cookies direkt i din webbläsare. Observera
                att om du blockerar alla cookies kan vissa delar av webbplatsen
                sluta fungera.
              </p>

              <div className="bg-gray-50 rounded-lg p-4 space-y-2 text-sm">
                <p>
                  <strong>Google Chrome:</strong>{" "}
                  <a
                    href="https://support.google.com/chrome/answer/95647"
                    target="_blank"
                    rel="noopener"
                    className="text-primary hover:underline"
                  >
                    Hantera cookies i Chrome
                  </a>
                </p>
                <p>
                  <strong>Firefox:</strong>{" "}
                  <a
                    href="https://support.mozilla.org/sv/kb/skapa-radera-cookies"
                    target="_blank"
                    rel="noopener"
                    className="text-primary hover:underline"
                  >
                    Hantera cookies i Firefox
                  </a>
                </p>
                <p>
                  <strong>Safari:</strong>{" "}
                  <a
                    href="https://support.apple.com/sv-se/guide/safari/sfri11471/mac"
                    target="_blank"
                    rel="noopener"
                    className="text-primary hover:underline"
                  >
                    Hantera cookies i Safari
                  </a>
                </p>
                <p>
                  <strong>Microsoft Edge:</strong>{" "}
                  <a
                    href="https://support.microsoft.com/sv-se/microsoft-edge/radera-cookies-i-microsoft-edge-63947406-40ac-c3b8-57b9-2a946a29ae09"
                    target="_blank"
                    rel="noopener"
                    className="text-primary hover:underline"
                  >
                    Hantera cookies i Edge
                  </a>
                </p>
              </div>

              <h3 className="text-lg font-semibold mt-6">4.3 Rensa cookies</h3>
              <p className="text-gray-700 text-sm">
                Du kan när som helst radera cookies som redan lagrats på din
                enhet via din webbläsares inställningar. Observera att detta kan
                påverka din användarupplevelse på DogPlanner.
              </p>
            </div>
          </section>

          {/* 5. Tredjepartsleverantörer */}
          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              5. Tredjepartsleverantörer
            </h2>
            <p className="text-gray-700 mb-4">
              Vi använder följande tredjepartsleverantörer som kan sätta
              cookies:
            </p>

            <div className="space-y-4">
              <div className="border border-gray-200 rounded-lg p-4">
                <h3 className="font-semibold text-gray-900 mb-2">
                  Supabase (Autentisering & Databas)
                </h3>
                <p className="text-sm text-gray-700 mb-2">
                  <strong>Plats:</strong> EU (Frankfurt, Tyskland)
                  <br />
                  <strong>Cookies:</strong> supabase-auth-token (nödvändig)
                  <br />
                  <strong>Integritetspolicy:</strong>{" "}
                  <a
                    href="https://supabase.com/privacy"
                    target="_blank"
                    rel="noopener"
                    className="text-primary hover:underline"
                  >
                    Supabase Privacy Policy
                  </a>
                </p>
              </div>

              <div className="border border-gray-200 rounded-lg p-4">
                <h3 className="font-semibold text-gray-900 mb-2">
                  Google Analytics (Analys)
                </h3>
                <p className="text-sm text-gray-700 mb-2">
                  <strong>Plats:</strong> EU (Irland)
                  <br />
                  <strong>Cookies:</strong> _ga, _gid (kräver samtycke)
                  <br />
                  <strong>Anonymisering:</strong> IP-adresser maskeras
                  <br />
                  <strong>Integritetspolicy:</strong>{" "}
                  <a
                    href="https://policies.google.com/privacy"
                    target="_blank"
                    rel="noopener"
                    className="text-primary hover:underline"
                  >
                    Google Privacy Policy
                  </a>
                </p>
              </div>
            </div>
          </section>

          {/* 6. Dina rättigheter */}
          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              6. Dina rättigheter
            </h2>
            <p className="text-gray-700 mb-4">
              Enligt GDPR och e-privatlagen har du rätt att:
            </p>

            <ul className="list-disc list-inside space-y-2 text-sm text-gray-700">
              <li>Få information om vilka cookies vi använder</li>
              <li>Acceptera eller neka icke-nödvändiga cookies</li>
              <li>Ändra dina cookie-inställningar när som helst</li>
              <li>Radera cookies via din webbläsare</li>
              <li>Invända mot användning av cookies för marknadsföring</li>
            </ul>

            <p className="text-sm text-gray-600 mt-4">
              Observera att nödvändiga cookies inte kan stängas av eftersom de
              krävs för att webbplatsen ska fungera korrekt.
            </p>
          </section>

          {/* 7. Ändringar i cookie-policyn */}
          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              7. Ändringar i cookie-policyn
            </h2>
            <p className="text-gray-700 text-sm">
              Vi kan komma att uppdatera denna cookie-policy för att återspegla
              ändringar i hur vi använder cookies eller på grund av
              lagändringar. Vi rekommenderar att du regelbundet läser denna
              policy för att hålla dig uppdaterad.
            </p>
            <p className="text-sm text-gray-600 mt-2">
              <strong>Senaste uppdatering:</strong> 17 november 2025
            </p>
          </section>

          {/* 8. Kontakt */}
          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              8. Frågor om cookies?
            </h2>
            <div className="bg-primary/5 border border-primary/20 rounded-lg p-6">
              <p className="text-gray-700 mb-4">
                Om du har frågor om hur vi använder cookies, kontakta oss gärna:
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
                  <strong>Postadress:</strong>
                  <br />
                  DogPlanner AB
                  <br />
                  [DIN ADRESS]
                  <br />
                  [POSTNUMMER OCH ORT]
                </p>
              </div>
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
              href="/legal/privacy-policy-customer"
              className="flex items-center space-x-2 text-primary hover:text-primary-dark"
            >
              <Shield className="w-5 h-5" />
              <span>Integritetspolicy (Hundägare)</span>
            </Link>
            <Link
              href="/legal/terms-customer"
              className="flex items-center space-x-2 text-primary hover:text-primary-dark"
            >
              <FileText className="w-5 h-5" />
              <span>Användarvillkor (Hundägare)</span>
            </Link>
            <Link
              href="/legal/privacy-policy-business"
              className="flex items-center space-x-2 text-primary hover:text-primary-dark"
            >
              <Shield className="w-5 h-5" />
              <span>Integritetspolicy (Företag)</span>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
