"use client";

import Link from "next/link";
import {
  FileText,
  Building2,
  CreditCard,
  Shield,
  AlertCircle,
  CheckCircle,
  XCircle,
  Clock,
} from "lucide-react";

export default function TermsBusinessPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex items-center space-x-3 mb-4">
            <Building2 className="w-8 h-8 text-primary" />
            <h1 className="text-3xl font-bold text-gray-900">
              Allmänna Villkor för Företagskunder
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
        {/* Important Notice */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-8">
          <div className="flex items-start space-x-3">
            <AlertCircle className="w-6 h-6 text-blue-700 mt-1" />
            <div>
              <h3 className="font-semibold text-blue-900 mb-2">
                Viktigt att läsa
              </h3>
              <p className="text-sm text-blue-800">
                Dessa villkor reglerar ert abonnemang på DogPlanners
                SaaS-plattform. Genom att skapa ett företagskonto godkänner ni
                dessa villkor samt vårt{" "}
                <Link
                  href="/legal/pub-agreement"
                  className="underline font-semibold"
                >
                  Personuppgiftsbiträdesavtal (PUB)
                </Link>{" "}
                och{" "}
                <Link
                  href="/legal/privacy-policy-business"
                  className="underline font-semibold"
                >
                  Integritetspolicy för företag
                </Link>
                .
              </p>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="bg-white rounded-lg shadow-sm border p-8 space-y-8">
          {/* 1. Definitioner */}
          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              1. Definitioner
            </h2>
            <div className="space-y-3 text-sm">
              <div className="border-l-4 border-primary pl-4">
                <p>
                  <strong>"DogPlanner"</strong> eller <strong>"Vi"</strong> =
                  DogPlanner AB, org.nr [DITT ORG-NR]
                </p>
              </div>
              <div className="border-l-4 border-primary pl-4">
                <p>
                  <strong>"Kund"</strong> eller <strong>"Ni"</strong> = Det
                  företag eller den organisation som tecknar abonnemang
                </p>
              </div>
              <div className="border-l-4 border-primary pl-4">
                <p>
                  <strong>"Plattformen"</strong> eller{" "}
                  <strong>"Tjänsten"</strong> = DogPlanners SaaS-plattform för
                  hantering av hundpensionat, hunddagis och hundfrisörer
                </p>
              </div>
              <div className="border-l-4 border-primary pl-4">
                <p>
                  <strong>"Abonnemang"</strong> = Ert avtal att använda
                  Plattformen mot månatlig eller årlig avgift
                </p>
              </div>
              <div className="border-l-4 border-primary pl-4">
                <p>
                  <strong>"Användare"</strong> = Era anställda eller företrädare
                  som använder Plattformen
                </p>
              </div>
              <div className="border-l-4 border-primary pl-4">
                <p>
                  <strong>"Kunddata"</strong> = All data ni eller era användare
                  lägger in i Plattformen
                </p>
              </div>
              <div className="border-l-4 border-primary pl-4">
                <p>
                  <strong>"PUB"</strong> = Personuppgiftsbiträdesavtal enligt
                  GDPR Art. 28
                </p>
              </div>
              <div className="border-l-4 border-primary pl-4">
                <p>
                  <strong>"SLA"</strong> = Servicenivåavtal som specificerar
                  tillgänglighet och support
                </p>
              </div>
            </div>
          </section>

          {/* 2. Tjänstebeskrivning */}
          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              2. Om DogPlanner-tjänsten
            </h2>

            <p className="text-gray-700 mb-4">
              DogPlanner är en molnbaserad SaaS-plattform (Software as a
              Service) för hantering av verksamheter inom hundbranschen.
              Tjänsten inkluderar:
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              <div className="border border-gray-200 rounded-lg p-4">
                <h3 className="font-semibold text-gray-900 mb-2 flex items-center">
                  <CheckCircle className="w-5 h-5 text-green-600 mr-2" />
                  Bokningshantering
                </h3>
                <ul className="text-sm text-gray-700 space-y-1 list-disc list-inside">
                  <li>Online-bokningar via kundportal</li>
                  <li>Bekräftelse och avbokning</li>
                  <li>Check-in/Check-out</li>
                  <li>Kalenderöversikt</li>
                </ul>
              </div>

              <div className="border border-gray-200 rounded-lg p-4">
                <h3 className="font-semibold text-gray-900 mb-2 flex items-center">
                  <CheckCircle className="w-5 h-5 text-green-600 mr-2" />
                  Hundregister
                </h3>
                <ul className="text-sm text-gray-700 space-y-1 list-disc list-inside">
                  <li>Fullständiga hundprofiler</li>
                  <li>Medicinsk information</li>
                  <li>Vaccinationsstatus</li>
                  <li>Dokument och bilder</li>
                </ul>
              </div>

              <div className="border border-gray-200 rounded-lg p-4">
                <h3 className="font-semibold text-gray-900 mb-2 flex items-center">
                  <CheckCircle className="w-5 h-5 text-green-600 mr-2" />
                  Fakturering
                </h3>
                <ul className="text-sm text-gray-700 space-y-1 list-disc list-inside">
                  <li>Automatisk fakturagenering</li>
                  <li>För- och efterskott</li>
                  <li>Påminnelser</li>
                  <li>Betalningsspårning</li>
                </ul>
              </div>

              <div className="border border-gray-200 rounded-lg p-4">
                <h3 className="font-semibold text-gray-900 mb-2 flex items-center">
                  <CheckCircle className="w-5 h-5 text-green-600 mr-2" />
                  Kundportal
                </h3>
                <ul className="text-sm text-gray-700 space-y-1 list-disc list-inside">
                  <li>Självbetjäning för hundägare</li>
                  <li>Bokningshistorik</li>
                  <li>Dokumenthantering</li>
                  <li>Betalningsöversikt</li>
                </ul>
              </div>
            </div>

            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <p className="text-sm text-yellow-800">
                <strong>⚠️ Observera:</strong> Funktioner kan variera beroende
                på ert abonnemangspaket. Se sektion 4 för prisplaner.
              </p>
            </div>
          </section>

          {/* 3. Avtalets start och registrering */}
          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              3. Avtalets start och registrering
            </h2>

            <div className="space-y-4">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  3.1 Registrering
                </h3>
                <p className="text-sm text-gray-700">
                  För att använda Plattformen måste ni registrera ett
                  företagskonto med:
                </p>
                <ul className="list-disc list-inside text-sm text-gray-700 mt-2 space-y-1">
                  <li>Företagsnamn och organisationsnummer</li>
                  <li>Kontaktuppgifter (e-post, telefon, adress)</li>
                  <li>Minst en administratör med fullständiga uppgifter</li>
                  <li>Betalningsmetod (kort, autogiro eller faktura)</li>
                </ul>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  3.2 Verifiering
                </h3>
                <p className="text-sm text-gray-700">
                  Vi förbehåller oss rätten att verifiera era företagsuppgifter
                  genom kontroll mot offentliga register (Bolagsverket,
                  Skatteverket). Vi kan begära ytterligare dokumentation vid
                  behov.
                </p>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  3.3 Avtalsstart
                </h3>
                <p className="text-sm text-gray-700">
                  Avtalet träder i kraft när ni godkänt dessa villkor och
                  slutfört registreringen. Er provperiod (om tillämplig) startar
                  samma dag.
                </p>
              </div>

              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <h3 className="font-semibold text-green-900 mb-2">
                  🎁 Provperiod
                </h3>
                <p className="text-sm text-green-800">
                  Nya kunder får <strong>3 månaders gratis provperiod</strong>{" "}
                  med tillgång till alla funktioner i Professional-planen. Ingen
                  betalning krävs under provperioden, men betalningsmetod måste
                  registreras. Efter provperioden övergår ni automatiskt till
                  vald prisplan om ni inte säger upp.
                </p>
              </div>
            </div>
          </section>

          {/* 4. Prisplaner och betalning */}
          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              4. Prisplaner och betalning
            </h2>

            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-3">
                  4.1 Tillgängliga planer
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  {/* Free Plan */}
                  <div className="border-2 border-gray-200 rounded-lg p-4">
                    <h4 className="font-bold text-gray-900 mb-1">Free</h4>
                    <p className="text-2xl font-bold text-gray-900 mb-2">
                      0 kr<span className="text-sm text-gray-500">/mån</span>
                    </p>
                    <ul className="text-xs text-gray-700 space-y-1">
                      <li>✓ Upp till 5 hundar</li>
                      <li>✓ Basfunktioner</li>
                      <li>✓ Kundportal</li>
                      <li>✗ Fakturering</li>
                    </ul>
                  </div>

                  {/* Basic Plan */}
                  <div className="border-2 border-blue-200 rounded-lg p-4 bg-blue-50">
                    <h4 className="font-bold text-blue-900 mb-1">Basic</h4>
                    <p className="text-2xl font-bold text-blue-900 mb-2">
                      299 kr<span className="text-sm text-blue-600">/mån</span>
                    </p>
                    <ul className="text-xs text-blue-800 space-y-1">
                      <li>✓ Upp till 50 hundar</li>
                      <li>✓ Bokningshantering</li>
                      <li>✓ Fakturering</li>
                      <li>✓ E-postsupport</li>
                    </ul>
                  </div>

                  {/* Professional Plan */}
                  <div className="border-2 border-primary rounded-lg p-4 bg-primary/5 relative">
                    <div className="absolute -top-3 left-1/2 transform -translate-x-1/2 bg-primary text-white text-xs px-3 py-1 rounded-full">
                      POPULÄRAST
                    </div>
                    <h4 className="font-bold text-primary mb-1">
                      Professional
                    </h4>
                    <p className="text-2xl font-bold text-primary mb-2">
                      799 kr<span className="text-sm">/mån</span>
                    </p>
                    <ul className="text-xs text-gray-700 space-y-1">
                      <li>✓ Obegränsat antal hundar</li>
                      <li>✓ Alla funktioner</li>
                      <li>✓ Prioriterad support</li>
                      <li>✓ API-åtkomst</li>
                    </ul>
                  </div>

                  {/* Enterprise Plan */}
                  <div className="border-2 border-purple-200 rounded-lg p-4 bg-purple-50">
                    <h4 className="font-bold text-purple-900 mb-1">
                      Enterprise
                    </h4>
                    <p className="text-2xl font-bold text-purple-900 mb-2">
                      Kontakta
                      <span className="text-sm text-purple-600"> oss</span>
                    </p>
                    <ul className="text-xs text-purple-800 space-y-1">
                      <li>✓ Flera anläggningar</li>
                      <li>✓ Dedikerad support</li>
                      <li>✓ SLA 99.9%</li>
                      <li>✓ Anpassningar</li>
                    </ul>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  4.2 Betalningsvillkor
                </h3>
                <div className="bg-gray-50 rounded-lg p-4 space-y-2 text-sm text-gray-700">
                  <p>
                    <strong>Fakturering:</strong> Månatlig förskottsfakturering
                    (betalas i början av varje månad)
                  </p>
                  <p>
                    <strong>Årlig betalning:</strong> 10% rabatt vid
                    årsbetalning i förskott
                  </p>
                  <p>
                    <strong>Betalningsmetoder:</strong> Kort (Visa/Mastercard),
                    Autogiro, Faktura (tillgänglig från Professional)
                  </p>
                  <p>
                    <strong>Förfallodag:</strong> 14 dagar från fakturadatum
                  </p>
                  <p>
                    <strong>Dröjsmålsränta:</strong> Enligt räntelagen (för
                    närvarande 2% + referensränta per månad)
                  </p>
                  <p>
                    <strong>Påminnelseavgift:</strong> 60 kr enligt Inkassolagen
                  </p>
                </div>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  4.3 Prisändringar
                </h3>
                <p className="text-sm text-gray-700">
                  Vi kan ändra priserna med <strong>60 dagars varsel</strong>{" "}
                  via e-post. Om ni inte accepterar prisändringen kan ni säga
                  upp avtalet före ikraftträdandet utan uppsägningstid.
                </p>
              </div>
            </div>
          </section>

          {/* 5. Uppgradering och nedgradering */}
          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              5. Ändra abonnemangsplan
            </h2>

            <div className="space-y-4">
              <div className="border border-green-200 bg-green-50 rounded-lg p-4">
                <h3 className="font-semibold text-green-900 mb-2 flex items-center">
                  <CheckCircle className="w-5 h-5 mr-2" />
                  Uppgradering
                </h3>
                <p className="text-sm text-green-800 mb-2">
                  Ni kan när som helst uppgradera till en högre plan.
                  Uppgraderingen sker omedelbart och ni får direkt tillgång till
                  de nya funktionerna.
                </p>
                <p className="text-xs text-green-700">
                  <strong>Fakturering:</strong> Återstående tid på nuvarande
                  plan krediteras och ni betalar skillnaden proportionellt för
                  resterande del av månaden.
                </p>
              </div>

              <div className="border border-yellow-200 bg-yellow-50 rounded-lg p-4">
                <h3 className="font-semibold text-yellow-900 mb-2 flex items-center">
                  <AlertCircle className="w-5 h-5 mr-2" />
                  Nedgradering
                </h3>
                <p className="text-sm text-yellow-800 mb-2">
                  Ni kan nedgradera till en lägre plan. Nedgraderingen träder i
                  kraft vid nästa faktureringsperiod (inte omedelbart).
                </p>
                <p className="text-xs text-yellow-700">
                  <strong>Varning:</strong> Om ni har mer data än vad den lägre
                  planen tillåter (t.ex. fler hundar) måste ni reducera innan
                  nedgraderingen träder i kraft.
                </p>
              </div>
            </div>
          </section>

          {/* 6. Kundens ansvar */}
          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              6. Kundens ansvar och åtaganden
            </h2>

            <div className="space-y-4">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  6.1 Korrekt information
                </h3>
                <p className="text-sm text-gray-700">
                  Ni ansvarar för att all information ni lägger in i Plattformen
                  är korrekt, uppdaterad och laglig. Detta inkluderar
                  hundägaruppgifter, bokningar, priser och juridiska dokument.
                </p>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  6.2 GDPR-ansvar som Personuppgiftsansvarig
                </h3>
                <p className="text-sm text-gray-700 mb-2">
                  <strong>NI är personuppgiftsansvarig</strong> för de
                  hundägaruppgifter ni samlar in genom Plattformen. DogPlanner
                  är personuppgiftsbiträde enligt vårt PUB-avtal. Det innebär
                  att ni:
                </p>
                <ul className="list-disc list-inside text-sm text-gray-700 space-y-1">
                  <li>
                    Måste ha rättslig grund för att behandla personuppgifter
                  </li>
                  <li>Ska informera hundägare om hur deras data behandlas</li>
                  <li>
                    Ansvarar för att hantera hundägares dataskyddsrättigheter
                  </li>
                  <li>
                    Måste rapportera personuppgiftsincidenter till IMY vid behov
                  </li>
                </ul>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  6.3 Kontosäkerhet
                </h3>
                <p className="text-sm text-gray-700">Ni ansvarar för att:</p>
                <ul className="list-disc list-inside text-sm text-gray-700 space-y-1">
                  <li>Hålla inloggningsuppgifter säkra</li>
                  <li>Inte dela konton mellan personer</li>
                  <li>Omedelbart rapportera misstänkt obehörig åtkomst</li>
                  <li>
                    Använda stark tvåfaktor-autentisering (starkt rekommenderat)
                  </li>
                </ul>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  6.4 Förbjuden användning
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-3">
                  <div className="flex items-start space-x-2">
                    <XCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                    <p className="text-sm text-gray-700">
                      Laglig verksamhet i strid mot svenska eller EU-lagar
                    </p>
                  </div>
                  <div className="flex items-start space-x-2">
                    <XCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                    <p className="text-sm text-gray-700">
                      Spridning av virus eller skadlig kod
                    </p>
                  </div>
                  <div className="flex items-start space-x-2">
                    <XCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                    <p className="text-sm text-gray-700">
                      Försök att hacka eller kringgå säkerhet
                    </p>
                  </div>
                  <div className="flex items-start space-x-2">
                    <XCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                    <p className="text-sm text-gray-700">
                      Överbelastningsattacker eller spam
                    </p>
                  </div>
                  <div className="flex items-start space-x-2">
                    <XCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                    <p className="text-sm text-gray-700">
                      Återförsäljning av tjänsten utan avtal
                    </p>
                  </div>
                  <div className="flex items-start space-x-2">
                    <XCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                    <p className="text-sm text-gray-700">
                      Reverse engineering eller kopiering av kod
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* 7. DogPlanners åtaganden */}
          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              7. DogPlanners åtaganden
            </h2>

            <div className="space-y-4">
              <div className="border border-green-200 bg-green-50 rounded-lg p-4">
                <h3 className="font-semibold text-green-900 mb-2">
                  7.1 Tillgänglighet
                </h3>
                <p className="text-sm text-green-800">
                  Vi strävar efter <strong>99.5% tillgänglighet</strong>{" "}
                  (uptime) per månad, exklusive planerat underhåll. Professional
                  och Enterprise har högre SLA-garantier (se SLA-dokument).
                </p>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  7.2 Planerat underhåll
                </h3>
                <p className="text-sm text-gray-700">
                  Planerat underhåll sker normalt mellan 02:00-05:00 svensk tid.
                  Vi meddelar minst
                  <strong> 48 timmar i förväg</strong> via e-post och
                  plattformsmeddelande.
                </p>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  7.3 Säkerhetskopiering
                </h3>
                <p className="text-sm text-gray-700 mb-2">
                  Vi tar automatiska säkerhetskopior av era data:
                </p>
                <ul className="list-disc list-inside text-sm text-gray-700 space-y-1">
                  <li>
                    <strong>Dagliga backuper:</strong> Sparas i 30 dagar
                  </li>
                  <li>
                    <strong>Veckovisa backuper:</strong> Sparas i 90 dagar
                  </li>
                  <li>
                    <strong>Månatliga backuper:</strong> Sparas i 1 år
                  </li>
                </ul>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  7.4 Support
                </h3>
                <div className="overflow-x-auto">
                  <table className="min-w-full text-sm border">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-2 text-left">Plan</th>
                        <th className="px-4 py-2 text-left">Supportkanal</th>
                        <th className="px-4 py-2 text-left">Svarstid</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr className="border-t">
                        <td className="px-4 py-2">Free</td>
                        <td className="px-4 py-2">FAQ, Community</td>
                        <td className="px-4 py-2">-</td>
                      </tr>
                      <tr className="border-t">
                        <td className="px-4 py-2">Basic</td>
                        <td className="px-4 py-2">E-post</td>
                        <td className="px-4 py-2">48 timmar</td>
                      </tr>
                      <tr className="border-t">
                        <td className="px-4 py-2">Professional</td>
                        <td className="px-4 py-2">E-post, Chat</td>
                        <td className="px-4 py-2">24 timmar</td>
                      </tr>
                      <tr className="border-t">
                        <td className="px-4 py-2">Enterprise</td>
                        <td className="px-4 py-2">E-post, Chat, Telefon</td>
                        <td className="px-4 py-2">4 timmar</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </section>

          {/* 8. Ansvarsbegränsning */}
          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              8. Ansvarsbegränsning
            </h2>

            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 mb-4">
              <h3 className="font-semibold text-yellow-900 mb-3">
                Viktigt att förstå
              </h3>
              <p className="text-sm text-yellow-800 mb-4">
                DogPlanner tillhandahåller en teknisk plattform som verktyg för
                er verksamhet. Vi ansvarar INTE för:
              </p>
              <ul className="list-disc list-inside text-sm text-yellow-800 space-y-2">
                <li>Hur ni använder Plattformen i er verksamhet</li>
                <li>Riktigheten i data ni lägger in</li>
                <li>Rättsliga tvister mellan er och hundägare</li>
                <li>Hundägares eller hundars säkerhet i er verksamhet</li>
                <li>Er efterlevnad av branschspecifika lagar och regler</li>
                <li>Förlust av intäkter på grund av tekniska problem</li>
              </ul>
            </div>

            <div className="space-y-4">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  8.1 Ansvar för Plattformen
                </h3>
                <p className="text-sm text-gray-700">
                  Vårt ansvar är begränsat till tillhandahållande av Plattformen
                  och att den fungerar enligt beskrivningen. Vid fel eller
                  driftstopp är vår skyldighet begränsad till att åtgärda
                  problemet eller, om det inte är möjligt, återbetala
                  proportionell andel av månadens avgift.
                </p>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  8.2 Skadestånd
                </h3>
                <p className="text-sm text-gray-700 mb-2">
                  Vårt totala skadeståndsansvar är begränsat till:
                </p>
                <ul className="list-disc list-inside text-sm text-gray-700 space-y-1">
                  <li>
                    <strong>Free & Basic:</strong> Högst 10 000 kr per incident
                  </li>
                  <li>
                    <strong>Professional:</strong> Högst 6 månaders
                    abonnemangsavgift
                  </li>
                  <li>
                    <strong>Enterprise:</strong> Enligt separat avtal
                  </li>
                </ul>
                <p className="text-sm text-gray-600 mt-3">
                  Vi ansvarar INTE för indirekta skador som utebliven vinst,
                  förlust av data (utöver återställning från backup) eller
                  följdskador.
                </p>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  8.3 Force majeure
                </h3>
                <p className="text-sm text-gray-700">
                  Vi ansvarar inte för förseningar eller fel orsakade av
                  omständigheter utanför vår kontroll, såsom naturkatastrofer,
                  krig, strömavbrott, cyberattacker mot tredje part, eller
                  myndighetsbeslut.
                </p>
              </div>
            </div>
          </section>

          {/* 9. Uppsägning */}
          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              9. Uppsägning av abonnemang
            </h2>

            <div className="space-y-4">
              <div className="border border-blue-200 bg-blue-50 rounded-lg p-4">
                <h3 className="font-semibold text-blue-900 mb-2">
                  9.1 Uppsägning från er sida
                </h3>
                <p className="text-sm text-blue-800 mb-2">
                  Ni kan när som helst säga upp ert abonnemang via plattformens
                  inställningar eller genom att kontakta oss på
                  support@dogplanner.se.
                </p>
                <ul className="text-sm text-blue-800 space-y-1 list-disc list-inside">
                  <li>
                    <strong>Månatligt abonnemang:</strong> 30 dagars
                    uppsägningstid
                  </li>
                  <li>
                    <strong>Årligt abonnemang:</strong> Löper ut vid
                    avtalsperiodens slut (ingen återbetalning)
                  </li>
                  <li>
                    <strong>Under provperiod:</strong> Omedelbar uppsägning utan
                    kostnad
                  </li>
                </ul>
              </div>

              <div className="border border-red-200 bg-red-50 rounded-lg p-4">
                <h3 className="font-semibold text-red-900 mb-2">
                  9.2 Avstängning från vår sida
                </h3>
                <p className="text-sm text-red-800 mb-2">
                  Vi kan omedelbart stänga av ert konto om ni:
                </p>
                <ul className="text-sm text-red-800 space-y-1 list-disc list-inside">
                  <li>Bryter mot dessa villkor (särskilt sektion 6.4)</li>
                  <li>
                    Inte betalar fakturor inom 30 dagar efter förfallodatum
                  </li>
                  <li>
                    Använder tjänsten på ett sätt som skadar andra kunder eller
                    Plattformen
                  </li>
                  <li>
                    Ger falska uppgifter eller bedriver bedräglig verksamhet
                  </li>
                </ul>
                <p className="text-xs text-red-700 mt-2">
                  Vid allvarliga brott (t.ex. hacking) polisanmäler vi
                  händelsen.
                </p>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  9.3 Efter uppsägning
                </h3>
                <p className="text-sm text-gray-700 mb-2">
                  Efter att abonnemanget upphört:
                </p>
                <ul className="list-disc list-inside text-sm text-gray-700 space-y-1">
                  <li>Har ni 30 dagar på er att exportera era data</li>
                  <li>
                    Efter 30 dagar raderas all data permanent (enligt GDPR)
                  </li>
                  <li>
                    Faktureringsuppgifter sparas i 7 år enligt bokföringslagen
                  </li>
                  <li>
                    Ni kan inte återaktivera kontot - ni måste registrera nytt
                  </li>
                </ul>
              </div>
            </div>
          </section>

          {/* 10. Immateriella rättigheter */}
          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              10. Immateriella rättigheter
            </h2>

            <div className="space-y-4">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  10.1 DogPlanners rättigheter
                </h3>
                <p className="text-sm text-gray-700">
                  DogPlanner äger alla rättigheter till Plattformen, inklusive
                  källkod, design, varumärken och dokumentation. Ni får INTE
                  kopiera, modifiera, distribuera eller reverse-engineera
                  Plattformen.
                </p>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  10.2 Era rättigheter till er data
                </h3>
                <p className="text-sm text-gray-700">
                  Ni behåller alla rättigheter till den data ni lägger in i
                  Plattformen. Vi gör inte anspråk på äganderätt till er
                  kunddata. Ni ger oss endast rätt att lagra och behandla data
                  för att tillhandahålla tjänsten.
                </p>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  10.3 Licensavgift
                </h3>
                <p className="text-sm text-gray-700">
                  Ert abonnemang ger er en icke-exklusiv, icke-överlåtbar licens
                  att använda Plattformen under avtalstiden. Licensen upphör
                  automatiskt vid uppsägning.
                </p>
              </div>
            </div>
          </section>

          {/* 11. Ändringar i villkoren */}
          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              11. Ändringar i villkoren
            </h2>
            <p className="text-sm text-gray-700 mb-4">
              Vi kan komma att uppdatera dessa villkor. Vid väsentliga ändringar
              meddelar vi er via e-post minst <strong>30 dagar innan</strong>{" "}
              ändringarna träder i kraft.
            </p>
            <p className="text-sm text-gray-700">
              Om ni inte accepterar ändringarna har ni rätt att säga upp avtalet
              innan de träder i kraft, utan att behöva följa uppsägningstiden.
            </p>
          </section>

          {/* 12. Tvistlösning */}
          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              12. Tvistlösning och tillämplig lag
            </h2>

            <div className="space-y-4">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  12.1 Tillämplig lag
                </h3>
                <p className="text-sm text-gray-700">
                  Dessa villkor styrs av svensk lag. Eventuella tvister ska
                  avgöras av svensk domstol.
                </p>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  12.2 Tvistelösning (rekommenderad ordning)
                </h3>
                <div className="space-y-3">
                  <div className="flex items-start space-x-3">
                    <div className="w-8 h-8 bg-primary text-white rounded-full flex items-center justify-center flex-shrink-0 font-bold text-sm">
                      1
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900 text-sm">
                        Direkt kommunikation
                      </p>
                      <p className="text-xs text-gray-700">
                        Kontakta vår support på support@dogplanner.se för att
                        lösa problemet i samförstånd.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start space-x-3">
                    <div className="w-8 h-8 bg-primary text-white rounded-full flex items-center justify-center flex-shrink-0 font-bold text-sm">
                      2
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900 text-sm">
                        Medling
                      </p>
                      <p className="text-xs text-gray-700">
                        Om problemet kvarstår kan ni vända er till Allmänna
                        Reklamationsnämnden (ARN) för medling.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start space-x-3">
                    <div className="w-8 h-8 bg-primary text-white rounded-full flex items-center justify-center flex-shrink-0 font-bold text-sm">
                      3
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900 text-sm">
                        Tingsrätt
                      </p>
                      <p className="text-xs text-gray-700">
                        Som sista utväg kan tvisten avgöras av [DIN HEMORTS
                        TINGSRÄTT].
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* 13. Kontakt */}
          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              13. Kontaktinformation
            </h2>
            <div className="bg-primary/5 border border-primary/20 rounded-lg p-6">
              <p className="text-gray-700 mb-4">
                För frågor om dessa villkor, ert abonnemang eller teknisk
                support:
              </p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="font-semibold text-gray-900 mb-2">
                    DogPlanner AB
                  </p>
                  <p className="text-gray-700">
                    Organisationsnummer: [DITT ORG-NR]
                    <br />
                    Adress: [DIN ADRESS]
                    <br />
                    Telefon: [DITT TELEFONNUMMER]
                  </p>
                </div>

                <div>
                  <p className="font-semibold text-gray-900 mb-2">E-post</p>
                  <p className="text-gray-700">
                    Support:{" "}
                    <a
                      href="mailto:support@dogplanner.se"
                      className="text-primary hover:underline"
                    >
                      support@dogplanner.se
                    </a>
                    <br />
                    Faktura:{" "}
                    <a
                      href="mailto:faktura@dogplanner.se"
                      className="text-primary hover:underline"
                    >
                      faktura@dogplanner.se
                    </a>
                    <br />
                    Försäljning:{" "}
                    <a
                      href="mailto:sales@dogplanner.se"
                      className="text-primary hover:underline"
                    >
                      sales@dogplanner.se
                    </a>
                  </p>
                </div>
              </div>
            </div>
          </section>
        </div>

        {/* Footer Navigation */}
        <div className="mt-8 bg-white rounded-lg shadow-sm border p-6">
          <h3 className="font-semibold text-gray-900 mb-4">
            Relaterade dokument för företagskunder
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Link
              href="/legal/privacy-policy-business"
              className="flex items-center space-x-2 text-primary hover:text-primary-dark"
            >
              <Shield className="w-5 h-5" />
              <span>Integritetspolicy (Företag)</span>
            </Link>
            <Link
              href="/legal/pub-agreement"
              className="flex items-center space-x-2 text-primary hover:text-primary-dark"
            >
              <FileText className="w-5 h-5" />
              <span>Personuppgiftsbiträdesavtal (PUB)</span>
            </Link>
            <Link
              href="/legal/sla"
              className="flex items-center space-x-2 text-primary hover:text-primary-dark"
            >
              <Clock className="w-5 h-5" />
              <span>Servicenivåavtal (SLA)</span>
            </Link>
            <Link
              href="/legal/cookies"
              className="flex items-center space-x-2 text-primary hover:text-primary-dark"
            >
              <FileText className="w-5 h-5" />
              <span>Cookie-policy</span>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
