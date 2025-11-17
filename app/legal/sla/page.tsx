"use client";

import Link from "next/link";
import {
  Clock,
  Shield,
  FileText,
  Building2,
  CheckCircle,
  AlertTriangle,
  Zap,
  HeadphonesIcon,
} from "lucide-react";

export default function SLAPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex items-center space-x-3 mb-4">
            <Clock className="w-8 h-8 text-primary" />
            <h1 className="text-3xl font-bold text-gray-900">
              Servicenivåavtal (SLA)
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
            <AlertTriangle className="w-6 h-6 text-blue-700 mt-1" />
            <div>
              <h3 className="font-semibold text-blue-900 mb-2">
                Om detta servicenivåavtal
              </h3>
              <p className="text-sm text-blue-800">
                Detta SLA beskriver tillgänglighetsgarantier, supportnivåer och
                servicemål för DogPlanners SaaS-plattform. Olika
                abonnemangsplaner har olika SLA-nivåer. Se{" "}
                <Link
                  href="/legal/terms-business"
                  className="underline font-semibold"
                >
                  Allmänna Villkor
                </Link>{" "}
                för information om prisplaner.
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
                  <strong>"Tillgänglighet" (Uptime)</strong> = Procentandel av
                  tiden som Plattformen är tillgänglig och funktionell
                </p>
              </div>
              <div className="border-l-4 border-primary pl-4">
                <p>
                  <strong>"Avbrott" (Downtime)</strong> = Period när Plattformen
                  är otillgänglig eller oanvändbar för Kunden
                </p>
              </div>
              <div className="border-l-4 border-primary pl-4">
                <p>
                  <strong>"Planerat underhåll"</strong> = Schemalagt underhåll
                  som meddelas minst 48 timmar i förväg (räknas ej som avbrott)
                </p>
              </div>
              <div className="border-l-4 border-primary pl-4">
                <p>
                  <strong>"Incident"</strong> = Oplanerad händelse som påverkar
                  tjänstens tillgänglighet eller prestanda
                </p>
              </div>
              <div className="border-l-4 border-primary pl-4">
                <p>
                  <strong>"Servicekredit"</strong> = Kompensation i form av
                  återbetalning eller förlängd abonnemangstid vid SLA-brott
                </p>
              </div>
              <div className="border-l-4 border-primary pl-4">
                <p>
                  <strong>"Svarstid"</strong> = Tid från det att support tar
                  emot ett ärende till första svaret skickas
                </p>
              </div>
              <div className="border-l-4 border-primary pl-4">
                <p>
                  <strong>"Lösningstid"</strong> = Tid från ärendets skapande
                  till problemet är löst eller förbikoppling finns
                </p>
              </div>
            </div>
          </section>

          {/* 2. Tillgänglighetsgaranti */}
          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              2. Tillgänglighetsgaranti (Uptime SLA)
            </h2>

            <div className="overflow-x-auto mb-6">
              <table className="min-w-full text-sm border">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left">Abonnemangsplan</th>
                    <th className="px-4 py-3 text-left">Tillgänglighet</th>
                    <th className="px-4 py-3 text-left">Max avbrott/månad</th>
                    <th className="px-4 py-3 text-left">
                      Servicekredit vid brott
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  <tr>
                    <td className="px-4 py-3 font-semibold">Free</td>
                    <td className="px-4 py-3">
                      <span className="text-gray-600">Ingen garanti</span>
                    </td>
                    <td className="px-4 py-3 text-gray-600">-</td>
                    <td className="px-4 py-3 text-gray-600">Nej</td>
                  </tr>
                  <tr>
                    <td className="px-4 py-3 font-semibold">Basic</td>
                    <td className="px-4 py-3">
                      <span className="text-yellow-700 font-semibold">
                        99.0%
                      </span>
                    </td>
                    <td className="px-4 py-3">~7.2 timmar</td>
                    <td className="px-4 py-3">10% rabatt nästa månad</td>
                  </tr>
                  <tr>
                    <td className="px-4 py-3 font-semibold">Professional</td>
                    <td className="px-4 py-3">
                      <span className="text-green-700 font-semibold">
                        99.5%
                      </span>
                    </td>
                    <td className="px-4 py-3">~3.6 timmar</td>
                    <td className="px-4 py-3">25% rabatt nästa månad</td>
                  </tr>
                  <tr>
                    <td className="px-4 py-3 font-semibold">Enterprise</td>
                    <td className="px-4 py-3">
                      <span className="text-blue-700 font-semibold">99.9%</span>
                    </td>
                    <td className="px-4 py-3">~43 minuter</td>
                    <td className="px-4 py-3">50% rabatt + eskalering</td>
                  </tr>
                </tbody>
              </table>
            </div>

            <div className="space-y-4">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  2.1 Beräkning av tillgänglighet
                </h3>
                <div className="bg-gray-50 rounded-lg p-4">
                  <p className="text-sm text-gray-700 mb-2 font-mono">
                    Tillgänglighet (%) = ((Total tid - Avbrott) / Total tid) ×
                    100
                  </p>
                  <p className="text-xs text-gray-600">
                    <strong>Exempel:</strong> En månad har 720 timmar (30 dagar
                    × 24 timmar). För 99.5% SLA tillåts max 3.6 timmars avbrott
                    (720 × 0.005 = 3.6).
                  </p>
                </div>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  2.2 Vad räknas INTE som avbrott?
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div className="flex items-start space-x-2">
                    <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                    <p className="text-sm text-gray-700">
                      <strong>Planerat underhåll</strong> (med 48h varsel,
                      02:00-05:00 svensk tid)
                    </p>
                  </div>
                  <div className="flex items-start space-x-2">
                    <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                    <p className="text-sm text-gray-700">
                      <strong>Force majeure</strong> (naturkatastrofer,
                      cyberattacker mot tredje part)
                    </p>
                  </div>
                  <div className="flex items-start space-x-2">
                    <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                    <p className="text-sm text-gray-700">
                      <strong>Kundens egna fel</strong> (fel konfiguration,
                      överskridna gränser)
                    </p>
                  </div>
                  <div className="flex items-start space-x-2">
                    <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                    <p className="text-sm text-gray-700">
                      <strong>Tredje parts problem</strong> (DNS, ISP,
                      användarens internetanslutning)
                    </p>
                  </div>
                  <div className="flex items-start space-x-2">
                    <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                    <p className="text-sm text-gray-700">
                      <strong>Suspenderat konto</strong> (obetald faktura, brott
                      mot villkor)
                    </p>
                  </div>
                  <div className="flex items-start space-x-2">
                    <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                    <p className="text-sm text-gray-700">
                      <strong>Beta-funktioner</strong> (funktioner märkta som
                      "BETA" eller "Preview")
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* 3. Supportnivåer */}
          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              3. Supportnivåer och svarstider
            </h2>

            <div className="space-y-6">
              {/* Free Plan Support */}
              <div className="border-2 border-gray-200 rounded-lg p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-xl font-bold text-gray-900">Free Plan</h3>
                  <span className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-sm font-semibold">
                    Självbetjäning
                  </span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm font-semibold text-gray-900 mb-2">
                      Tillgängliga kanaler:
                    </p>
                    <ul className="text-sm text-gray-700 space-y-1 list-disc list-inside">
                      <li>Hjälpcenter och FAQ</li>
                      <li>Community-forum</li>
                      <li>Videotutorials</li>
                    </ul>
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-gray-900 mb-2">
                      Svarstid:
                    </p>
                    <p className="text-sm text-gray-700">
                      Ingen garanterad svarstid
                    </p>
                  </div>
                </div>
              </div>

              {/* Basic Plan Support */}
              <div className="border-2 border-blue-200 rounded-lg p-6 bg-blue-50/30">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-xl font-bold text-blue-900">
                    Basic Plan
                  </h3>
                  <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm font-semibold">
                    E-postsupport
                  </span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm font-semibold text-gray-900 mb-2">
                      Tillgängliga kanaler:
                    </p>
                    <ul className="text-sm text-gray-700 space-y-1 list-disc list-inside">
                      <li>E-post: support@dogplanner.se</li>
                      <li>Hjälpcenter och FAQ</li>
                      <li>Community-forum</li>
                    </ul>
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-gray-900 mb-2">
                      Svarstider:
                    </p>
                    <ul className="text-sm text-gray-700 space-y-1">
                      <li>
                        <span className="font-semibold">Kritiskt:</span> 24
                        timmar
                      </li>
                      <li>
                        <span className="font-semibold">Högt:</span> 48 timmar
                      </li>
                      <li>
                        <span className="font-semibold">Normalt:</span> 72
                        timmar
                      </li>
                      <li>
                        <span className="font-semibold">Lågt:</span> 7 dagar
                      </li>
                    </ul>
                  </div>
                </div>
                <p className="text-xs text-gray-600 mt-4">
                  <strong>Öppettider:</strong> Måndag-fredag 09:00-17:00 (svensk
                  tid). Ärenden som inkommer utanför kontorstid besvaras nästa
                  arbetsdag.
                </p>
              </div>

              {/* Professional Plan Support */}
              <div className="border-2 border-primary rounded-lg p-6 bg-primary/5">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-xl font-bold text-primary">
                    Professional Plan
                  </h3>
                  <span className="px-3 py-1 bg-primary text-white rounded-full text-sm font-semibold">
                    Prioriterad support
                  </span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm font-semibold text-gray-900 mb-2">
                      Tillgängliga kanaler:
                    </p>
                    <ul className="text-sm text-gray-700 space-y-1 list-disc list-inside">
                      <li>E-post: support@dogplanner.se (prioriterad kö)</li>
                      <li>Live-chat (in-app)</li>
                      <li>Hjälpcenter och FAQ</li>
                      <li>Community-forum</li>
                    </ul>
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-gray-900 mb-2">
                      Svarstider:
                    </p>
                    <ul className="text-sm text-gray-700 space-y-1">
                      <li>
                        <span className="font-semibold text-red-700">
                          Kritiskt:
                        </span>{" "}
                        4 timmar
                      </li>
                      <li>
                        <span className="font-semibold text-orange-700">
                          Högt:
                        </span>{" "}
                        12 timmar
                      </li>
                      <li>
                        <span className="font-semibold text-yellow-700">
                          Normalt:
                        </span>{" "}
                        24 timmar
                      </li>
                      <li>
                        <span className="font-semibold text-green-700">
                          Lågt:
                        </span>{" "}
                        48 timmar
                      </li>
                    </ul>
                  </div>
                </div>
                <p className="text-xs text-gray-600 mt-4">
                  <strong>Öppettider:</strong> Måndag-fredag 08:00-20:00,
                  Lördag-söndag 10:00-16:00 (svensk tid). Kritiska ärenden
                  hanteras även utanför kontorstid.
                </p>
              </div>

              {/* Enterprise Plan Support */}
              <div className="border-2 border-purple-200 rounded-lg p-6 bg-purple-50/30">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-xl font-bold text-purple-900">
                    Enterprise Plan
                  </h3>
                  <span className="px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-sm font-semibold">
                    Dedikerad support
                  </span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm font-semibold text-gray-900 mb-2">
                      Tillgängliga kanaler:
                    </p>
                    <ul className="text-sm text-gray-700 space-y-1 list-disc list-inside">
                      <li>Dedikerad account manager</li>
                      <li>Telefonsupport (direkt nummer)</li>
                      <li>E-post (prioriterad kö)</li>
                      <li>Live-chat (prioriterad)</li>
                      <li>Videosamtal (vid behov)</li>
                    </ul>
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-gray-900 mb-2">
                      Svarstider:
                    </p>
                    <ul className="text-sm text-gray-700 space-y-1">
                      <li>
                        <span className="font-semibold text-red-700">
                          Kritiskt:
                        </span>{" "}
                        1 timme
                      </li>
                      <li>
                        <span className="font-semibold text-orange-700">
                          Högt:
                        </span>{" "}
                        4 timmar
                      </li>
                      <li>
                        <span className="font-semibold text-yellow-700">
                          Normalt:
                        </span>{" "}
                        8 timmar
                      </li>
                      <li>
                        <span className="font-semibold text-green-700">
                          Lågt:
                        </span>{" "}
                        24 timmar
                      </li>
                    </ul>
                  </div>
                </div>
                <p className="text-xs text-gray-600 mt-4">
                  <strong>Öppettider:</strong> 24/7 för kritiska ärenden. Övriga
                  ärenden hanteras måndag-söndag 08:00-22:00 (svensk tid).
                </p>
              </div>
            </div>
          </section>

          {/* 4. Prioritetsnivåer */}
          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              4. Prioritetsnivåer för ärenden
            </h2>

            <div className="space-y-4">
              {/* Kritisk */}
              <div className="border-2 border-red-300 bg-red-50 rounded-lg p-4">
                <div className="flex items-start space-x-3">
                  <div className="w-12 h-12 bg-red-600 text-white rounded-full flex items-center justify-center flex-shrink-0 font-bold">
                    P1
                  </div>
                  <div className="flex-1">
                    <h3 className="font-bold text-red-900 mb-2">
                      Kritisk (P1)
                    </h3>
                    <p className="text-sm text-red-800 mb-2">
                      <strong>Definition:</strong> Plattformen är helt
                      otillgänglig eller en kärnfunktion fungerar inte alls.
                      Påverkar alla eller majoriteten av användarna.
                    </p>
                    <p className="text-xs text-red-700">
                      <strong>Exempel:</strong> Kan inte logga in, databas nere,
                      bokningar går inte att skapa, betalningar fungerar inte,
                      allvarlig säkerhetsbrist.
                    </p>
                  </div>
                </div>
              </div>

              {/* Hög */}
              <div className="border-2 border-orange-300 bg-orange-50 rounded-lg p-4">
                <div className="flex items-start space-x-3">
                  <div className="w-12 h-12 bg-orange-600 text-white rounded-full flex items-center justify-center flex-shrink-0 font-bold">
                    P2
                  </div>
                  <div className="flex-1">
                    <h3 className="font-bold text-orange-900 mb-2">Hög (P2)</h3>
                    <p className="text-sm text-orange-800 mb-2">
                      <strong>Definition:</strong> Viktiga funktioner fungerar
                      inte eller har allvarliga begränsningar. Det finns en
                      förbikoppling men den är ineffektiv.
                    </p>
                    <p className="text-xs text-orange-700">
                      <strong>Exempel:</strong> Fakturor kan inte skickas,
                      hundregister går inte att uppdatera, e-postnotifieringar
                      skickas inte, långsam laddningstid.
                    </p>
                  </div>
                </div>
              </div>

              {/* Normal */}
              <div className="border-2 border-yellow-300 bg-yellow-50 rounded-lg p-4">
                <div className="flex items-start space-x-3">
                  <div className="w-12 h-12 bg-yellow-600 text-white rounded-full flex items-center justify-center flex-shrink-0 font-bold">
                    P3
                  </div>
                  <div className="flex-1">
                    <h3 className="font-bold text-yellow-900 mb-2">
                      Normal (P3)
                    </h3>
                    <p className="text-sm text-yellow-800 mb-2">
                      <strong>Definition:</strong> Mindre funktioner fungerar
                      inte eller har buggar. Det finns en rimlig förbikoppling.
                      Påverkar få användare.
                    </p>
                    <p className="text-xs text-yellow-700">
                      <strong>Exempel:</strong> En rapport visar felaktig data,
                      designproblem, en filterfunktion fungerar inte, stavfel,
                      mindre UX-problem.
                    </p>
                  </div>
                </div>
              </div>

              {/* Låg */}
              <div className="border-2 border-green-300 bg-green-50 rounded-lg p-4">
                <div className="flex items-start space-x-3">
                  <div className="w-12 h-12 bg-green-600 text-white rounded-full flex items-center justify-center flex-shrink-0 font-bold">
                    P4
                  </div>
                  <div className="flex-1">
                    <h3 className="font-bold text-green-900 mb-2">Låg (P4)</h3>
                    <p className="text-sm text-green-800 mb-2">
                      <strong>Definition:</strong> Kosmetiska problem, önskemål
                      om nya funktioner, allmänna frågor. Ingen funktionalitet
                      påverkas.
                    </p>
                    <p className="text-xs text-green-700">
                      <strong>Exempel:</strong> Funktionsförslag,
                      dokumentationsfrågor, hur använder jag X?, önskan om
                      förbättrad UX, mindre designjusteringar.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 mt-4">
              <p className="text-sm text-gray-700">
                <strong>⚠️ Viktigt:</strong> DogPlanner avgör slutgiltig
                prioritetsnivå baserat på faktisk påverkan. Om en kund
                rapporterar ett ärende som P1 men det visar sig vara P3,
                justerar vi prioriteten och svarstiden därefter.
              </p>
            </div>
          </section>

          {/* 5. Planerat underhåll */}
          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              5. Planerat underhåll
            </h2>

            <div className="space-y-4">
              <div className="border border-blue-200 bg-blue-50 rounded-lg p-4">
                <h3 className="font-semibold text-blue-900 mb-2">
                  5.1 Underhållsfönster
                </h3>
                <p className="text-sm text-blue-800 mb-3">
                  Planerat underhåll sker normalt{" "}
                  <strong>
                    tisdagar och torsdagar mellan 02:00-05:00 svensk tid
                  </strong>
                  , när trafiken är som lägst. Vi strävar efter att genomföra
                  underhåll utan avbrott genom rullande uppdateringar.
                </p>
                <ul className="text-sm text-blue-800 space-y-1 list-disc list-inside">
                  <li>
                    Förväntat avbrott: <strong>Mindre än 15 minuter</strong>
                  </li>
                  <li>
                    Notifiering: <strong>Minst 48 timmar i förväg</strong> via
                    e-post och plattformsmeddelande
                  </li>
                  <li>Status: Realtidsuppdateringar på status.dogplanner.se</li>
                </ul>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  5.2 Akut underhåll
                </h3>
                <p className="text-sm text-gray-700">
                  Vid kritiska säkerhetsuppdateringar eller akuta bugfixar kan
                  vi behöva utföra underhåll med kortare varsel (minst 4
                  timmar). Vi informerar omedelbart via e-post, SMS (Enterprise)
                  och in-app notifikation.
                </p>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  5.3 Nollstående underhåll
                </h3>
                <p className="text-sm text-gray-700">
                  Majoriteten av uppdateringar sker som{" "}
                  <strong>rullande deployer</strong> (blue-green deployment)
                  utan avbrott. Kunder kan uppleva några sekunders fördröjning
                  under övergången men ingen funktionalitet går förlorad.
                </p>
              </div>
            </div>
          </section>

          {/* 6. Prestanda och responstider */}
          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              6. Prestanda och responstider
            </h2>

            <div className="space-y-4">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-3">
                  6.1 Målsatta responstider
                </h3>
                <div className="overflow-x-auto">
                  <table className="min-w-full text-sm border">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-2 text-left">Åtgärd</th>
                        <th className="px-4 py-2 text-left">Mål responstid</th>
                        <th className="px-4 py-2 text-left">
                          95:e percentilen
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      <tr>
                        <td className="px-4 py-2">Sidladdning (initial)</td>
                        <td className="px-4 py-2">&lt; 2 sekunder</td>
                        <td className="px-4 py-2">&lt; 3 sekunder</td>
                      </tr>
                      <tr>
                        <td className="px-4 py-2">API-anrop (read)</td>
                        <td className="px-4 py-2">&lt; 200 ms</td>
                        <td className="px-4 py-2">&lt; 500 ms</td>
                      </tr>
                      <tr>
                        <td className="px-4 py-2">API-anrop (write)</td>
                        <td className="px-4 py-2">&lt; 500 ms</td>
                        <td className="px-4 py-2">&lt; 1 sekund</td>
                      </tr>
                      <tr>
                        <td className="px-4 py-2">Rapportgenerering</td>
                        <td className="px-4 py-2">&lt; 5 sekunder</td>
                        <td className="px-4 py-2">&lt; 10 sekunder</td>
                      </tr>
                      <tr>
                        <td className="px-4 py-2">PDF-faktura (generering)</td>
                        <td className="px-4 py-2">&lt; 3 sekunder</td>
                        <td className="px-4 py-2">&lt; 5 sekunder</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
                <p className="text-xs text-gray-600 mt-2">
                  <strong>Observera:</strong> Responstider påverkas av
                  användarens internetanslutning, geografisk plats och
                  datamängd. Ovan mål gäller för EU-baserade användare med
                  rimlig internetanslutning.
                </p>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  6.2 Överbelastningsskydd
                </h3>
                <p className="text-sm text-gray-700 mb-2">
                  För att skydda plattformens stabilitet har vi följande rate
                  limits:
                </p>
                <ul className="text-sm text-gray-700 space-y-1 list-disc list-inside">
                  <li>
                    <strong>API-anrop:</strong> 1000 requests per minut per
                    organisation
                  </li>
                  <li>
                    <strong>Filuppladdning:</strong> Max 10 MB per fil, 100 MB
                    per timme
                  </li>
                  <li>
                    <strong>E-postutskick:</strong> Max 100 e-postmeddelanden
                    per timme
                  </li>
                </ul>
                <p className="text-xs text-gray-600 mt-2">
                  Enterprise-kunder kan begära höjda gränser. Kontakta
                  sales@dogplanner.se.
                </p>
              </div>
            </div>
          </section>

          {/* 7. Övervakning och statussida */}
          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              7. Övervakning och transparens
            </h2>

            <div className="space-y-4">
              <div className="border border-green-200 bg-green-50 rounded-lg p-4">
                <h3 className="font-semibold text-green-900 mb-2 flex items-center">
                  <Zap className="w-5 h-5 mr-2" />
                  7.1 Realtidsövervakning
                </h3>
                <p className="text-sm text-green-800 mb-2">
                  Vi övervakar plattformen 24/7 med automatiska alerts vid:
                </p>
                <ul className="text-sm text-green-800 space-y-1 list-disc list-inside">
                  <li>Responstid &gt; 2 sekunder</li>
                  <li>Felfrekvens &gt; 1%</li>
                  <li>CPU/Minne &gt; 80%</li>
                  <li>Databaskö &gt; 100 queries</li>
                  <li>Diskutrymme &lt; 20%</li>
                </ul>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  7.2 Offentlig statussida
                </h3>
                <p className="text-sm text-gray-700 mb-3">
                  Besök <strong>status.dogplanner.se</strong> för
                  realtidsöversikt av systemstatus, pågående incident och
                  planerat underhåll. Du kan prenumerera på uppdateringar via:
                </p>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <div className="border border-gray-200 rounded-lg p-3 text-center">
                    <p className="text-sm font-semibold text-gray-900">
                      E-post
                    </p>
                    <p className="text-xs text-gray-600">Automatiska notiser</p>
                  </div>
                  <div className="border border-gray-200 rounded-lg p-3 text-center">
                    <p className="text-sm font-semibold text-gray-900">SMS</p>
                    <p className="text-xs text-gray-600">Kritiska händelser</p>
                  </div>
                  <div className="border border-gray-200 rounded-lg p-3 text-center">
                    <p className="text-sm font-semibold text-gray-900">RSS</p>
                    <p className="text-xs text-gray-600">Feed för automation</p>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  7.3 Månatlig SLA-rapport
                </h3>
                <p className="text-sm text-gray-700">
                  Professional och Enterprise-kunder får månatlig rapport via
                  e-post med:
                </p>
                <ul className="text-sm text-gray-700 space-y-1 list-disc list-inside mt-2">
                  <li>Uppmätt tillgänglighet</li>
                  <li>Antal och varaktighet av incidenter</li>
                  <li>Genomsnittliga responstider</li>
                  <li>Supportärenden (antal, genomsnittlig lösningstid)</li>
                  <li>Planerat underhåll nästa månad</li>
                </ul>
              </div>
            </div>
          </section>

          {/* 8. Servicekrediter */}
          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              8. Servicekrediter vid SLA-brott
            </h2>

            <div className="space-y-4">
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <h3 className="font-semibold text-yellow-900 mb-2">
                  8.1 Beräkning av servicekredit
                </h3>
                <p className="text-sm text-yellow-800 mb-3">
                  Om vi bryter mot SLA-garantin får Kunden automatisk kredit
                  enligt tabellen nedan:
                </p>
                <div className="overflow-x-auto">
                  <table className="min-w-full text-xs border bg-white">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-3 py-2 text-left">
                          Uppmätt tillgänglighet
                        </th>
                        <th className="px-3 py-2 text-left">Basic</th>
                        <th className="px-3 py-2 text-left">Professional</th>
                        <th className="px-3 py-2 text-left">Enterprise</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      <tr>
                        <td className="px-3 py-2">99.9% - 100%</td>
                        <td className="px-3 py-2 text-green-700">
                          ✓ SLA uppfyllt
                        </td>
                        <td className="px-3 py-2 text-green-700">
                          ✓ SLA uppfyllt
                        </td>
                        <td className="px-3 py-2 text-green-700">
                          ✓ SLA uppfyllt
                        </td>
                      </tr>
                      <tr>
                        <td className="px-3 py-2">99.5% - 99.9%</td>
                        <td className="px-3 py-2 text-green-700">
                          ✓ SLA uppfyllt
                        </td>
                        <td className="px-3 py-2 text-green-700">
                          ✓ SLA uppfyllt
                        </td>
                        <td className="px-3 py-2 text-yellow-700">
                          10% kredit
                        </td>
                      </tr>
                      <tr>
                        <td className="px-3 py-2">99.0% - 99.5%</td>
                        <td className="px-3 py-2 text-green-700">
                          ✓ SLA uppfyllt
                        </td>
                        <td className="px-3 py-2 text-yellow-700">
                          10% kredit
                        </td>
                        <td className="px-3 py-2 text-orange-700">
                          25% kredit
                        </td>
                      </tr>
                      <tr>
                        <td className="px-3 py-2">98.0% - 99.0%</td>
                        <td className="px-3 py-2 text-yellow-700">
                          10% kredit
                        </td>
                        <td className="px-3 py-2 text-orange-700">
                          25% kredit
                        </td>
                        <td className="px-3 py-2 text-red-700">50% kredit</td>
                      </tr>
                      <tr>
                        <td className="px-3 py-2">&lt; 98.0%</td>
                        <td className="px-3 py-2 text-orange-700">
                          25% kredit
                        </td>
                        <td className="px-3 py-2 text-red-700">50% kredit</td>
                        <td className="px-3 py-2 text-red-700">
                          100% kredit + eskalering
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  8.2 Hur begära servicekredit
                </h3>
                <div className="bg-gray-50 rounded-lg p-4 space-y-2 text-sm">
                  <p className="text-gray-700">
                    <strong>1.</strong> Servicekrediter beräknas automatiskt
                    varje månad
                  </p>
                  <p className="text-gray-700">
                    <strong>2.</strong> Om SLA-brott upptäcks får ni e-post inom
                    5 arbetsdagar
                  </p>
                  <p className="text-gray-700">
                    <strong>3.</strong> Krediten appliceras automatiskt på nästa
                    faktura
                  </p>
                  <p className="text-gray-700">
                    <strong>4.</strong> Om ni avviker kan ni kontakta
                    faktura@dogplanner.se med datum för incidenten
                  </p>
                </div>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  8.3 Begränsningar
                </h3>
                <ul className="text-sm text-gray-700 space-y-1 list-disc list-inside">
                  <li>
                    Max servicekredit per månad:{" "}
                    <strong>100% av månadens avgift</strong>
                  </li>
                  <li>
                    Servicekrediter kan inte tas ut som kontanter, endast som
                    rabatt på framtida fakturor
                  </li>
                  <li>
                    Krav på servicekredit måste lämnas in inom{" "}
                    <strong>30 dagar</strong> från månadens slut
                  </li>
                  <li>
                    Servicekrediter är kundens <strong>enda gottgörelse</strong>{" "}
                    för SLA-brott
                  </li>
                </ul>
              </div>
            </div>
          </section>

          {/* 9. Eskalering */}
          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              9. Eskaleringsprocess
            </h2>

            <div className="space-y-4">
              <p className="text-sm text-gray-700">
                Om ett supportärende inte löses inom rimlig tid eller om ni är
                missnöjda med hanteringen kan ni eskalera ärendet:
              </p>

              <div className="space-y-3">
                <div className="flex items-start space-x-3">
                  <div className="w-10 h-10 bg-blue-600 text-white rounded-full flex items-center justify-center flex-shrink-0 font-bold text-sm">
                    L1
                  </div>
                  <div>
                    <p className="font-semibold text-sm text-gray-900">
                      Första linjens support
                    </p>
                    <p className="text-xs text-gray-700">
                      Standard supportkanal (e-post, chat). Hanterar 90% av alla
                      ärenden.
                    </p>
                  </div>
                </div>

                <div className="flex items-start space-x-3">
                  <div className="w-10 h-10 bg-orange-600 text-white rounded-full flex items-center justify-center flex-shrink-0 font-bold text-sm">
                    L2
                  </div>
                  <div>
                    <p className="font-semibold text-sm text-gray-900">
                      Teknisk specialist
                    </p>
                    <p className="text-xs text-gray-700">
                      Eskaleras automatiskt vid komplexa tekniska problem eller
                      efter 48 timmar (Basic) / 24 timmar (Pro/Enterprise) utan
                      lösning.
                    </p>
                  </div>
                </div>

                <div className="flex items-start space-x-3">
                  <div className="w-10 h-10 bg-red-600 text-white rounded-full flex items-center justify-center flex-shrink-0 font-bold text-sm">
                    L3
                  </div>
                  <div>
                    <p className="font-semibold text-sm text-gray-900">
                      Engineering team / CTO
                    </p>
                    <p className="text-xs text-gray-700">
                      För kritiska system-buggar eller säkerhetsproblem. Endast
                      för Enterprise eller vid allvarliga incidenter. Kontakt:
                      escalation@dogplanner.se
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-primary/5 border border-primary/20 rounded-lg p-4 mt-4">
                <p className="text-sm text-gray-700">
                  <strong>Enterprise-kunder</strong> kan begära eskalering
                  direkt till L2 eller L3 vid kritiska ärenden genom att
                  kontakta sin dedikerade account manager eller ringa
                  telefonsupportnumret.
                </p>
              </div>
            </div>
          </section>

          {/* 10. Ändringar i SLA */}
          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              10. Ändringar i SLA
            </h2>
            <p className="text-sm text-gray-700 mb-4">
              Vi kan uppdatera detta SLA för att förbättra service, lägga till
              nya garantier eller anpassa till nya tekniska förutsättningar. Vid
              väsentliga ändringar meddelar vi Kunden minst
              <strong> 60 dagar i förväg</strong> via e-post.
            </p>
            <p className="text-sm text-gray-700">
              Om ändringar innebär försämrade garantier har Kunden rätt att säga
              upp avtalet innan ändringarna träder i kraft.
            </p>
          </section>

          {/* 11. Kontakt */}
          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              11. Kontaktinformation
            </h2>
            <div className="bg-primary/5 border border-primary/20 rounded-lg p-6">
              <p className="text-gray-700 mb-4">
                För frågor om SLA, support eller servicekrediter:
              </p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="font-semibold text-gray-900 mb-2 flex items-center">
                    <HeadphonesIcon className="w-5 h-5 mr-2" />
                    Support
                  </p>
                  <p className="text-gray-700">
                    E-post:{" "}
                    <a
                      href="mailto:support@dogplanner.se"
                      className="text-primary hover:underline"
                    >
                      support@dogplanner.se
                    </a>
                    <br />
                    Chat: Via plattformen (Pro/Enterprise)
                    <br />
                    Telefon: [DITT TELEFONNUMMER] (Enterprise)
                  </p>
                </div>

                <div>
                  <p className="font-semibold text-gray-900 mb-2 flex items-center">
                    <Building2 className="w-5 h-5 mr-2" />
                    Företag
                  </p>
                  <p className="text-gray-700">
                    DogPlanner AB
                    <br />
                    Org.nr: [DITT ORG-NR]
                    <br />
                    [DIN ADRESS]
                    <br />
                    Faktura: faktura@dogplanner.se
                  </p>
                </div>
              </div>

              <div className="mt-4 pt-4 border-t border-primary/20">
                <p className="text-sm text-gray-700">
                  <strong>Status:</strong>{" "}
                  <a
                    href="https://status.dogplanner.se"
                    target="_blank"
                    rel="noopener"
                    className="text-primary hover:underline"
                  >
                    status.dogplanner.se
                  </a>
                </p>
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
              href="/legal/terms-business"
              className="flex items-center space-x-2 text-primary hover:text-primary-dark"
            >
              <FileText className="w-5 h-5" />
              <span>Allmänna Villkor (SaaS)</span>
            </Link>
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
              <Shield className="w-5 h-5" />
              <span>Personuppgiftsbiträdesavtal (PUB)</span>
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
