"use client";

import Link from "next/link";
import {
  Shield,
  FileText,
  Building2,
  Lock,
  AlertTriangle,
  Database,
  Eye,
  CheckCircle,
} from "lucide-react";

export default function PUBAgreementPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex items-center space-x-3 mb-4">
            <Shield className="w-8 h-8 text-primary" />
            <h1 className="text-3xl font-bold text-gray-900">
              Personuppgiftsbiträdesavtal (PUB)
            </h1>
          </div>
          <p className="text-gray-600">
            <strong>Senast uppdaterad:</strong> 17 november 2025
          </p>
          <p className="text-sm text-gray-500 mt-2">
            Version 1.0 | Gäller från: 17 november 2025 | GDPR Art. 28
          </p>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Critical Notice */}
        <div className="bg-red-50 border-2 border-red-300 rounded-lg p-6 mb-8">
          <div className="flex items-start space-x-3">
            <AlertTriangle className="w-7 h-7 text-red-700 mt-1 flex-shrink-0" />
            <div>
              <h3 className="font-bold text-red-900 mb-2 text-lg">
                KRITISKT DOKUMENT - GDPR-KRAV
              </h3>
              <p className="text-sm text-red-800 mb-3">
                Detta Personuppgiftsbiträdesavtal (PUB) är{" "}
                <strong>juridiskt obligatoriskt</strong> enligt GDPR Artikel 28.
                Det reglerar hur DogPlanner behandlar personuppgifter som
                <strong> personuppgiftsbiträde</strong> på uppdrag av er som{" "}
                <strong>personuppgiftsansvarig</strong>.
              </p>
              <p className="text-sm text-red-800 font-semibold">
                ⚠️ Utan detta avtal får ni INTE lagligen använda DogPlanner för
                att hantera hundägaruppgifter.
              </p>
            </div>
          </div>
        </div>

        {/* Role Explanation */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
            <div className="flex items-center space-x-3 mb-3">
              <Building2 className="w-6 h-6 text-blue-700" />
              <h3 className="font-bold text-blue-900">
                NI (Personuppgiftsansvarig)
              </h3>
            </div>
            <p className="text-sm text-blue-800 mb-2">
              Er anläggning bestämmer <strong>varför</strong> och{" "}
              <strong>hur</strong> hundägardata behandlas.
            </p>
            <ul className="text-xs text-blue-700 space-y-1 list-disc list-inside">
              <li>Samlar in hundägares samtycke</li>
              <li>Bestämmer vilka data som behövs</li>
              <li>Ansvarar gentemot hundägare</li>
              <li>Hanterar personens dataskyddsrättigheter</li>
            </ul>
          </div>

          <div className="bg-green-50 border border-green-200 rounded-lg p-6">
            <div className="flex items-center space-x-3 mb-3">
              <Shield className="w-6 h-6 text-green-700" />
              <h3 className="font-bold text-green-900">
                DOGPLANNER (Personuppgiftsbiträde)
              </h3>
            </div>
            <p className="text-sm text-green-800 mb-2">
              Vi behandlar data <strong>endast på era instruktioner</strong>{" "}
              genom plattformen.
            </p>
            <ul className="text-xs text-green-700 space-y-1 list-disc list-inside">
              <li>Lagrar data säkert i EU</li>
              <li>Tillhandahåller teknisk plattform</li>
              <li>Hjälper vid dataskyddsrättigheter</li>
              <li>Rapporterar säkerhetsincidenter</li>
            </ul>
          </div>
        </div>

        {/* Main Content */}
        <div className="bg-white rounded-lg shadow-sm border p-8 space-y-8">
          {/* 1. Parter */}
          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              1. Parter och roller
            </h2>

            <div className="space-y-4">
              <div className="bg-gray-50 rounded-lg p-4">
                <h3 className="font-semibold text-gray-900 mb-2">
                  Personuppgiftsansvarig (Kund)
                </h3>
                <p className="text-sm text-gray-700">
                  Det företag eller den organisation som tecknat abonnemang på
                  DogPlanner och som samlar in och använder plattformen för att
                  behandla personuppgifter om hundägare och deras hundar.
                </p>
                <p className="text-xs text-gray-600 mt-2">
                  <strong>Juridisk grund:</strong> Ni är personuppgiftsansvarig
                  enligt GDPR Art. 4(7) och har det övergripande ansvaret för
                  att personuppgiftsbehandlingen sker lagligt.
                </p>
              </div>

              <div className="bg-gray-50 rounded-lg p-4">
                <h3 className="font-semibold text-gray-900 mb-2">
                  Personuppgiftsbiträde (DogPlanner)
                </h3>
                <p className="text-sm text-gray-700 mb-2">
                  DogPlanner AB (org.nr [DITT ORG-NR]) som tillhandahåller
                  SaaS-plattformen och behandlar personuppgifter på uppdrag av
                  och enligt instruktioner från Kunden.
                </p>
                <div className="bg-white border border-gray-200 rounded p-3 mt-2">
                  <p className="text-xs text-gray-700">
                    <strong>Kontaktuppgifter:</strong>
                    <br />
                    DogPlanner AB
                    <br />
                    [DIN ADRESS]
                    <br />
                    E-post: dpo@dogplanner.se
                    <br />
                    Telefon: [DITT TELEFONNUMMER]
                  </p>
                </div>
              </div>
            </div>
          </section>

          {/* 2. Avtalsföremål */}
          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              2. Avtalsföremål och omfattning
            </h2>

            <div className="space-y-4">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  2.1 Behandlingens syfte
                </h3>
                <p className="text-sm text-gray-700 mb-3">
                  DogPlanner behandlar personuppgifter för att tillhandahålla
                  följande tjänster till Kunden:
                </p>
                <ul className="list-disc list-inside text-sm text-gray-700 space-y-1">
                  <li>
                    Bokningshantering för hunddagis, hundpensionat och
                    hundfrisör
                  </li>
                  <li>
                    Hantering av hundregister med hälso- och beteendeinformation
                  </li>
                  <li>Ägarprofiler och kontaktinformation</li>
                  <li>Fakturering och betalningshantering</li>
                  <li>Kommunikation mellan anläggning och hundägare</li>
                  <li>
                    Dokumentlagring (vaccinationsintyg, försäkringshandlingar,
                    foton)
                  </li>
                </ul>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  2.2 Behandlingens art
                </h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-center">
                    <Database className="w-6 h-6 text-blue-700 mx-auto mb-1" />
                    <p className="text-xs font-semibold text-blue-900">
                      Lagring
                    </p>
                  </div>
                  <div className="bg-green-50 border border-green-200 rounded-lg p-3 text-center">
                    <Eye className="w-6 h-6 text-green-700 mx-auto mb-1" />
                    <p className="text-xs font-semibold text-green-900">
                      Visning
                    </p>
                  </div>
                  <div className="bg-purple-50 border border-purple-200 rounded-lg p-3 text-center">
                    <FileText className="w-6 h-6 text-purple-700 mx-auto mb-1" />
                    <p className="text-xs font-semibold text-purple-900">
                      Ändring
                    </p>
                  </div>
                  <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-center">
                    <AlertTriangle className="w-6 h-6 text-red-700 mx-auto mb-1" />
                    <p className="text-xs font-semibold text-red-900">
                      Radering
                    </p>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  2.3 Behandlingens varaktighet
                </h3>
                <p className="text-sm text-gray-700">
                  Behandlingen pågår under hela avtalstiden samt enligt de
                  lagringstider som anges i avsnitt 7 nedan. Vid avtalets
                  upphörande raderas eller återlämnas personuppgifter enligt
                  avsnitt 12.
                </p>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  2.4 Kategorier av registrerade
                </h3>
                <ul className="list-disc list-inside text-sm text-gray-700 space-y-1">
                  <li>
                    <strong>Hundägare:</strong> Privatpersoner som bokar
                    tjänster hos Kunden
                  </li>
                  <li>
                    <strong>Kontaktpersoner:</strong> Alternativa kontakter för
                    hundar
                  </li>
                  <li>
                    <strong>Veterinärer:</strong> Namn och kontaktuppgifter för
                    hundens veterinär
                  </li>
                </ul>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  2.5 Kategorier av personuppgifter
                </h3>
                <div className="overflow-x-auto">
                  <table className="min-w-full text-sm border">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-2 text-left">Kategori</th>
                        <th className="px-4 py-2 text-left">Uppgifter</th>
                        <th className="px-4 py-2 text-left">Känsligt?</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      <tr>
                        <td className="px-4 py-2 font-semibold">
                          Identifikation
                        </td>
                        <td className="px-4 py-2">
                          Namn, personnummer, adress, e-post, telefon
                        </td>
                        <td className="px-4 py-2">
                          <span className="text-yellow-700">Normal</span>
                        </td>
                      </tr>
                      <tr>
                        <td className="px-4 py-2 font-semibold">Ekonomi</td>
                        <td className="px-4 py-2">
                          Fakturor, betalningar, transaktioner
                        </td>
                        <td className="px-4 py-2">
                          <span className="text-yellow-700">Normal</span>
                        </td>
                      </tr>
                      <tr>
                        <td className="px-4 py-2 font-semibold">Hunddata</td>
                        <td className="px-4 py-2">
                          Ras, ålder, vikt, beteende, allergier
                        </td>
                        <td className="px-4 py-2">
                          <span className="text-yellow-700">Normal</span>
                        </td>
                      </tr>
                      <tr>
                        <td className="px-4 py-2 font-semibold">Hälsa</td>
                        <td className="px-4 py-2">
                          Mediciner, diagnoser, veterinärbesök
                        </td>
                        <td className="px-4 py-2">
                          <span className="text-red-700 font-semibold">
                            Känslig*
                          </span>
                        </td>
                      </tr>
                      <tr>
                        <td className="px-4 py-2 font-semibold">Dokument</td>
                        <td className="px-4 py-2">
                          Vaccinationsintyg, försäkring, foton
                        </td>
                        <td className="px-4 py-2">
                          <span className="text-yellow-700">Normal</span>
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
                <p className="text-xs text-gray-600 mt-2">
                  * Hälsouppgifter om hundar är tekniskt sett INTE känsliga
                  personuppgifter enligt GDPR (Art. 9), eftersom det rör djur.
                  Men hundägarens egna medicinska uppgifter (t.ex. allergier)
                  behandlas som känsliga uppgifter.
                </p>
              </div>
            </div>
          </section>

          {/* 3. Biträdets skyldigheter */}
          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              3. DogPlanners skyldigheter som personuppgiftsbiträde
            </h2>

            <div className="space-y-4">
              <div className="border border-primary bg-primary/5 rounded-lg p-4">
                <h3 className="font-semibold text-gray-900 mb-2 flex items-center">
                  <CheckCircle className="w-5 h-5 text-green-600 mr-2" />
                  3.1 Behandla endast enligt instruktioner
                </h3>
                <p className="text-sm text-gray-700">
                  DogPlanner behandlar personuppgifter endast enligt Kundens
                  dokumenterade instruktioner (genom plattformens funktioner)
                  och får INTE behandla data för egna ändamål. Vid otillåten
                  eller olaglig instruktion ska DogPlanner omedelbart informera
                  Kunden.
                </p>
              </div>

              <div className="border border-primary bg-primary/5 rounded-lg p-4">
                <h3 className="font-semibold text-gray-900 mb-2 flex items-center">
                  <CheckCircle className="w-5 h-5 text-green-600 mr-2" />
                  3.2 Sekretess
                </h3>
                <p className="text-sm text-gray-700">
                  All DogPlanner-personal som har åtkomst till personuppgifter
                  är bundna av sekretess. Sekretessen gäller även efter
                  anställningens upphörande.
                </p>
              </div>

              <div className="border border-primary bg-primary/5 rounded-lg p-4">
                <h3 className="font-semibold text-gray-900 mb-2 flex items-center">
                  <CheckCircle className="w-5 h-5 text-green-600 mr-2" />
                  3.3 Tekniska och organisatoriska åtgärder
                </h3>
                <p className="text-sm text-gray-700 mb-3">
                  DogPlanner vidtar följande säkerhetsåtgärder enligt GDPR Art.
                  32:
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div className="bg-white border border-gray-200 rounded p-3">
                    <p className="text-xs font-semibold text-gray-900 mb-1">
                      Kryptering
                    </p>
                    <ul className="text-xs text-gray-700 space-y-0.5 list-disc list-inside">
                      <li>TLS 1.3 vid överföring</li>
                      <li>AES-256 i vila</li>
                      <li>Krypterade backuper</li>
                    </ul>
                  </div>

                  <div className="bg-white border border-gray-200 rounded p-3">
                    <p className="text-xs font-semibold text-gray-900 mb-1">
                      Åtkomstkontroll
                    </p>
                    <ul className="text-xs text-gray-700 space-y-0.5 list-disc list-inside">
                      <li>Rollbaserad åtkomst (RBAC)</li>
                      <li>Två-faktor-autentisering (2FA)</li>
                      <li>Åtkomstloggar</li>
                    </ul>
                  </div>

                  <div className="bg-white border border-gray-200 rounded p-3">
                    <p className="text-xs font-semibold text-gray-900 mb-1">
                      Övervakning
                    </p>
                    <ul className="text-xs text-gray-700 space-y-0.5 list-disc list-inside">
                      <li>24/7 säkerhetsövervakning</li>
                      <li>Intrångsdetektering</li>
                      <li>Automatiska säkerhetsuppdateringar</li>
                    </ul>
                  </div>

                  <div className="bg-white border border-gray-200 rounded p-3">
                    <p className="text-xs font-semibold text-gray-900 mb-1">
                      Backup & återställning
                    </p>
                    <ul className="text-xs text-gray-700 space-y-0.5 list-disc list-inside">
                      <li>Dagliga säkerhetskopior</li>
                      <li>30 dagars historik</li>
                      <li>Testade återställningsplaner</li>
                    </ul>
                  </div>
                </div>
              </div>

              <div className="border border-primary bg-primary/5 rounded-lg p-4">
                <h3 className="font-semibold text-gray-900 mb-2 flex items-center">
                  <CheckCircle className="w-5 h-5 text-green-600 mr-2" />
                  3.4 Stöd vid dataskyddsrättigheter
                </h3>
                <p className="text-sm text-gray-700 mb-3">
                  DogPlanner hjälper Kunden att uppfylla registrerades
                  rättigheter (GDPR Art. 15-22):
                </p>
                <ul className="text-sm text-gray-700 space-y-1 list-disc list-inside">
                  <li>
                    <strong>Registerutdrag:</strong> Export av all data i
                    JSON/PDF-format
                  </li>
                  <li>
                    <strong>Rättelse:</strong> Kunden kan uppdatera uppgifter
                    direkt i plattformen
                  </li>
                  <li>
                    <strong>Radering:</strong> Mjuk radering med möjlighet till
                    återställning i 30 dagar
                  </li>
                  <li>
                    <strong>Begränsning:</strong> Möjlighet att markera konto
                    som "begränsat"
                  </li>
                  <li>
                    <strong>Dataportabilitet:</strong> Export i strukturerat
                    format (JSON, CSV)
                  </li>
                </ul>
                <p className="text-xs text-gray-600 mt-2">
                  <strong>Svarstid:</strong> DogPlanner tillhandahåller teknisk
                  support inom 48 timmar. Det är Kundens ansvar att hantera
                  begäran gentemot hundägaren inom 30 dagar.
                </p>
              </div>

              <div className="border border-primary bg-primary/5 rounded-lg p-4">
                <h3 className="font-semibold text-gray-900 mb-2 flex items-center">
                  <CheckCircle className="w-5 h-5 text-green-600 mr-2" />
                  3.5 Stöd vid konsekvensbedömning och förhandssamråd
                </h3>
                <p className="text-sm text-gray-700">
                  Om Kunden behöver göra en konsekvensbedömning (Data Protection
                  Impact Assessment - DPIA) enligt GDPR Art. 35, ska DogPlanner
                  tillhandahålla relevant information om behandlingen,
                  säkerhetsåtgärder och teknisk dokumentation.
                </p>
              </div>
            </div>
          </section>

          {/* 4. Underbiträden */}
          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              4. Underbiträden (Sub-processors)
            </h2>

            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4">
              <p className="text-sm text-yellow-800">
                <strong>Godkännande:</strong> Genom att teckna detta avtal
                godkänner Kunden att DogPlanner använder nedanstående
                underbiträden. Vid ändringar meddelas Kunden minst 30 dagar i
                förväg och har rätt att invända.
              </p>
            </div>

            <div className="space-y-4">
              {/* Supabase */}
              <div className="border border-gray-200 rounded-lg p-4">
                <div className="flex justify-between items-start mb-2">
                  <h3 className="font-semibold text-gray-900">Supabase Inc.</h3>
                  <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded">
                    EU-BASERAD
                  </span>
                </div>
                <div className="text-sm text-gray-700 space-y-1">
                  <p>
                    <strong>Tjänst:</strong> Databas och autentisering
                  </p>
                  <p>
                    <strong>Plats:</strong> Frankfurt, Tyskland (EU)
                  </p>
                  <p>
                    <strong>Behandlar:</strong> All kunddata (hundägare, hundar,
                    bokningar, fakturor)
                  </p>
                  <p>
                    <strong>Säkerhet:</strong> ISO 27001, SOC 2 Type II
                  </p>
                  <p>
                    <strong>DPA:</strong>{" "}
                    <a
                      href="https://supabase.com/dpa"
                      target="_blank"
                      rel="noopener"
                      className="text-primary hover:underline"
                    >
                      Supabase DPA
                    </a>
                  </p>
                </div>
              </div>

              {/* Vercel */}
              <div className="border border-gray-200 rounded-lg p-4">
                <div className="flex justify-between items-start mb-2">
                  <h3 className="font-semibold text-gray-900">Vercel Inc.</h3>
                  <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded">
                    EU-REGION
                  </span>
                </div>
                <div className="text-sm text-gray-700 space-y-1">
                  <p>
                    <strong>Tjänst:</strong> Webbhosting och CDN
                  </p>
                  <p>
                    <strong>Plats:</strong> Stockholm, Sverige / Frankfurt,
                    Tyskland
                  </p>
                  <p>
                    <strong>Behandlar:</strong> Session-cookies, cache, loggar
                  </p>
                  <p>
                    <strong>Säkerhet:</strong> SOC 2 Type II, ISO 27001
                  </p>
                  <p>
                    <strong>DPA:</strong>{" "}
                    <a
                      href="https://vercel.com/legal/dpa"
                      target="_blank"
                      rel="noopener"
                      className="text-primary hover:underline"
                    >
                      Vercel DPA
                    </a>
                  </p>
                </div>
              </div>

              {/* Resend */}
              <div className="border border-gray-200 rounded-lg p-4">
                <div className="flex justify-between items-start mb-2">
                  <h3 className="font-semibold text-gray-900">Resend</h3>
                  <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded">
                    EU-BASERAD
                  </span>
                </div>
                <div className="text-sm text-gray-700 space-y-1">
                  <p>
                    <strong>Tjänst:</strong> E-posttjänst (transaktionsmejl)
                  </p>
                  <p>
                    <strong>Plats:</strong> EU-infrastruktur (AWS EU-regioner)
                  </p>
                  <p>
                    <strong>Behandlar:</strong> Namn, e-postadress, mejlinnehåll
                    (bokningsbekräftelser, fakturor)
                  </p>
                  <p>
                    <strong>Säkerhet:</strong> TLS 1.3, DKIM, SPF
                  </p>
                </div>
              </div>

              {/* Stripe */}
              <div className="border border-gray-200 rounded-lg p-4">
                <div className="flex justify-between items-start mb-2">
                  <h3 className="font-semibold text-gray-900">
                    Stripe Payments Europe Ltd.
                  </h3>
                  <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded">
                    EU-ETABLERAD
                  </span>
                </div>
                <div className="text-sm text-gray-700 space-y-1">
                  <p>
                    <strong>Tjänst:</strong> Betalningar
                  </p>
                  <p>
                    <strong>Plats:</strong> Irland (EU)
                  </p>
                  <p>
                    <strong>Behandlar:</strong> Betalningsuppgifter,
                    kortinformation (PCI DSS Level 1)
                  </p>
                  <p>
                    <strong>Säkerhet:</strong> PCI DSS Level 1, ISO 27001, SOC 2
                  </p>
                  <p>
                    <strong>DPA:</strong>{" "}
                    <a
                      href="https://stripe.com/se/privacy-center/legal#dpa"
                      target="_blank"
                      rel="noopener"
                      className="text-primary hover:underline"
                    >
                      Stripe DPA
                    </a>
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-primary/5 border border-primary/20 rounded-lg p-4 mt-4">
              <p className="text-sm text-gray-700">
                <strong>Ändring av underbiträden:</strong> Om DogPlanner
                planerar att lägga till eller byta underbiträde meddelar vi
                Kunden minst <strong>30 dagar i förväg</strong> via e-post.
                Kunden har rätt att invända av legitima dataskyddsskäl. Om
                invändning inte kan lösas har Kunden rätt att säga upp avtalet.
              </p>
            </div>
          </section>

          {/* 5. Överföring till tredje land */}
          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              5. Överföring till tredje land (utanför EU/EES)
            </h2>

            <div className="bg-green-50 border border-green-200 rounded-lg p-6">
              <div className="flex items-start space-x-3">
                <CheckCircle className="w-6 h-6 text-green-700 mt-1" />
                <div>
                  <h3 className="font-semibold text-green-900 mb-2">
                    Ingen överföring utanför EU
                  </h3>
                  <p className="text-sm text-green-800 mb-3">
                    DogPlanner lagrar och behandlar{" "}
                    <strong>all data inom EU/EES</strong>. Vi överför INTE
                    personuppgifter till tredje land (utanför EU/EES).
                  </p>
                  <ul className="text-sm text-green-800 space-y-1 list-disc list-inside">
                    <li>Primär datalagring: Frankfurt, Tyskland (Supabase)</li>
                    <li>Backup: EU-region (Supabase)</li>
                    <li>
                      CDN: Stockholm, Sverige / Frankfurt, Tyskland (Vercel)
                    </li>
                    <li>
                      E-post: EU-baserad infrastruktur (Resend via AWS EU)
                    </li>
                  </ul>
                  <p className="text-xs text-green-700 mt-3">
                    <strong>Observera:</strong> Vissa underleverantörer
                    (Supabase, Vercel, Resend) är amerikanska företag, men de
                    lagrar och behandlar data i EU-regioner enligt GDPR Chapter
                    V krav.
                  </p>
                </div>
              </div>
            </div>
          </section>

          {/* 6. Personuppgiftsincidenter */}
          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              6. Personuppgiftsincidenter (dataintrång)
            </h2>

            <div className="space-y-4">
              <div className="border border-red-200 bg-red-50 rounded-lg p-4">
                <h3 className="font-semibold text-red-900 mb-2">
                  6.1 Rapporteringsskyldighet
                </h3>
                <p className="text-sm text-red-800 mb-2">
                  Vid personuppgiftsincident (dataintrång, läckage, förlust,
                  obehörig åtkomst) ska DogPlanner
                  <strong> omedelbart</strong> informera Kunden, dock senast{" "}
                  <strong>inom 24 timmar</strong>
                  efter att incidenten upptäckts.
                </p>
                <p className="text-xs text-red-700">
                  <strong>GDPR Art. 33:</strong> Det är Kundens ansvar att
                  rapportera allvarliga incidenter till IMY inom 72 timmar.
                  DogPlanner bistår med teknisk information.
                </p>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  6.2 Incidentrapport ska innehålla
                </h3>
                <ul className="list-disc list-inside text-sm text-gray-700 space-y-1">
                  <li>
                    Beskrivning av incidenten (vad hände, när, hur upptäcktes
                    det)
                  </li>
                  <li>
                    Vilka kategorier av uppgifter och antal registrerade som
                    påverkats
                  </li>
                  <li>Troliga konsekvenser för registrerade</li>
                  <li>
                    Vidtagna och planerade åtgärder för att begränsa skadan
                  </li>
                  <li>Kontaktperson hos DogPlanner för uppföljning</li>
                </ul>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  6.3 Åtgärder och samarbete
                </h3>
                <p className="text-sm text-gray-700">
                  DogPlanner ska omedelbart vidta åtgärder för att begränsa
                  skadan, utreda orsaken och förhindra framtida incidenter.
                  Kunden och DogPlanner samarbetar för att hantera incidenten
                  och kommunikation gentemot registrerade och myndigheter.
                </p>
              </div>
            </div>
          </section>

          {/* 7. Lagringstid */}
          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              7. Lagringstid och radering
            </h2>

            <div className="overflow-x-auto">
              <table className="min-w-full text-sm border">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-2 text-left">Typ av data</th>
                    <th className="px-4 py-2 text-left">Lagringstid</th>
                    <th className="px-4 py-2 text-left">Juridisk grund</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  <tr>
                    <td className="px-4 py-2">Aktiva kundprofiler</td>
                    <td className="px-4 py-2">Under avtalsperiod + 3 år</td>
                    <td className="px-4 py-2">Avtal + Preskription (3 år)</td>
                  </tr>
                  <tr>
                    <td className="px-4 py-2">Inaktiva kunder (3+ år)</td>
                    <td className="px-4 py-2">Anonymiseras automatiskt</td>
                    <td className="px-4 py-2">
                      GDPR Art. 5.1.e (lagringsbegränsning)
                    </td>
                  </tr>
                  <tr>
                    <td className="px-4 py-2">Bokningar och transaktioner</td>
                    <td className="px-4 py-2">7 år från transaktionsdatum</td>
                    <td className="px-4 py-2">Bokföringslagen</td>
                  </tr>
                  <tr>
                    <td className="px-4 py-2">Fakturor</td>
                    <td className="px-4 py-2">7 år från fakturadatum</td>
                    <td className="px-4 py-2">Bokföringslagen</td>
                  </tr>
                  <tr>
                    <td className="px-4 py-2">Auditloggar (booking_events)</td>
                    <td className="px-4 py-2">3 år från händelsen</td>
                    <td className="px-4 py-2">
                      GDPR Art. 30 (behandlingsregister)
                    </td>
                  </tr>
                  <tr>
                    <td className="px-4 py-2">Backuper</td>
                    <td className="px-4 py-2">
                      30 dagar (dagliga), 90 dagar (vecko), 1 år (månatliga)
                    </td>
                    <td className="px-4 py-2">Säkerhet och återställning</td>
                  </tr>
                </tbody>
              </table>
            </div>

            <p className="text-sm text-gray-600 mt-4">
              <strong>Automatisk radering:</strong> DogPlanner har implementerat
              automatiska rutiner som raderar eller anonymiserar data efter
              utgången lagringstid, förutom bokföringsdata som måste sparas
              enligt lag.
            </p>
          </section>

          {/* 8. Revision och inspektion */}
          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              8. Revision och inspektion
            </h2>

            <div className="space-y-4">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  8.1 Kundens revisionsrätt
                </h3>
                <p className="text-sm text-gray-700">
                  Kunden har rätt att genomföra revisioner eller inspektioner
                  för att verifiera att DogPlanner följer detta avtal och GDPR.
                  Revision ska aviseras minst <strong>30 dagar i förväg</strong>
                  och får inte ske oftare än en gång per år, såvida inte IMY
                  eller annan myndighet kräver det.
                </p>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  8.2 Dokumentation
                </h3>
                <p className="text-sm text-gray-700 mb-2">
                  DogPlanner tillhandahåller följande dokumentation på begäran:
                </p>
                <ul className="list-disc list-inside text-sm text-gray-700 space-y-1">
                  <li>
                    Beskrivning av tekniska och organisatoriska
                    säkerhetsåtgärder
                  </li>
                  <li>Lista över underbiträden och deras DPA</li>
                  <li>
                    Säkerhetscertifikat (SOC 2, ISO 27001 från
                    underleverantörer)
                  </li>
                  <li>Incidentrapporter (om tillämpligt)</li>
                  <li>Behandlingsregister enligt GDPR Art. 30</li>
                </ul>
              </div>

              <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                <h3 className="font-semibold text-gray-900 mb-2">
                  8.3 Certifieringar
                </h3>
                <p className="text-sm text-gray-700 mb-2">
                  DogPlanners underleverantörer har följande certifieringar:
                </p>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
                  <div className="bg-white border rounded p-2 text-center">
                    <p className="font-semibold">ISO 27001</p>
                    <p className="text-gray-600">Informationssäkerhet</p>
                  </div>
                  <div className="bg-white border rounded p-2 text-center">
                    <p className="font-semibold">SOC 2 Type II</p>
                    <p className="text-gray-600">Säkerhetskontroller</p>
                  </div>
                  <div className="bg-white border rounded p-2 text-center">
                    <p className="font-semibold">PCI DSS Level 1</p>
                    <p className="text-gray-600">Betalningssäkerhet</p>
                  </div>
                  <div className="bg-white border rounded p-2 text-center">
                    <p className="font-semibold">GDPR-compliant</p>
                    <p className="text-gray-600">EU dataskydd</p>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* 9. Ansvar och ersättning */}
          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              9. Ansvar och ersättning
            </h2>

            <div className="space-y-4">
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <h3 className="font-semibold text-yellow-900 mb-2">
                  9.1 Biträdets ansvar
                </h3>
                <p className="text-sm text-yellow-800">
                  DogPlanner ansvarar för skador som uppstår på grund av vårt
                  brott mot GDPR eller detta avtal. Ansvaret är begränsat enligt
                  Allmänna Villkor för Företagskunder (se sektion 8 i det
                  dokumentet).
                </p>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  9.2 Befrielse från ansvar
                </h3>
                <p className="text-sm text-gray-700">
                  DogPlanner är befriad från ansvar om vi kan visa att vi inte
                  på något sätt är ansvariga för den händelse som gav upphov
                  till skadan, eller om skadan orsakades av Kundens
                  instruktioner eller åtgärder.
                </p>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  9.3 Ersättning vid böter
                </h3>
                <p className="text-sm text-gray-700">
                  Om IMY utdömer böter (administrativa sanktionsavgifter) enligt
                  GDPR Art. 83 ska ansvaret fördelas enligt följande:
                </p>
                <ul className="list-disc list-inside text-sm text-gray-700 space-y-1 mt-2">
                  <li>
                    <strong>Kundens ansvar:</strong> Böter för brister i
                    rättslig grund, samtycke, information till registrerade,
                    hantering av dataskyddsrättigheter
                  </li>
                  <li>
                    <strong>DogPlanners ansvar:</strong> Böter för tekniska
                    säkerhetsbrister, obehörig underbiträde, bristande
                    rapportering av incident
                  </li>
                  <li>
                    <strong>Gemensamt ansvar:</strong> Böter som inte kan
                    hänföras till specifik part fördelas proportionellt efter
                    vållande
                  </li>
                </ul>
              </div>
            </div>
          </section>

          {/* 10. Kundens skyldigheter */}
          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              10. Kundens skyldigheter som personuppgiftsansvarig
            </h2>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-4">
              <p className="text-sm text-blue-800 mb-3">
                <strong>Viktigt:</strong> Kunden är personuppgiftsansvarig och
                har det övergripande ansvaret för att personuppgiftsbehandlingen
                sker lagligt enligt GDPR. Detta inkluderar:
              </p>
              <ul className="text-sm text-blue-800 space-y-2 list-disc list-inside">
                <li>
                  <strong>Rättslig grund (Art. 6):</strong> Se till att det
                  finns laglig grund för behandling (samtycke, avtal, rättslig
                  förpliktelse eller berättigat intresse)
                </li>
                <li>
                  <strong>Information (Art. 13-14):</strong> Informera hundägare
                  om behandlingen genom integritetspolicy
                </li>
                <li>
                  <strong>Samtycke (Art. 7):</strong> Inhämta och dokumentera
                  samtycke där det krävs
                </li>
                <li>
                  <strong>Dataminimering (Art. 5.1.c):</strong> Endast samla in
                  nödvändiga uppgifter
                </li>
                <li>
                  <strong>Rättigheter (Art. 15-22):</strong> Hantera
                  registrerades begäran inom 30 dagar
                </li>
                <li>
                  <strong>Rapportering (Art. 33-34):</strong> Rapportera
                  allvarliga incidenter till IMY och registrerade
                </li>
              </ul>
            </div>

            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
              <h3 className="font-semibold text-gray-900 mb-2">
                Exempel: Kunden måste ha...
              </h3>
              <ul className="text-sm text-gray-700 space-y-1 list-disc list-inside">
                <li>
                  En egen integritetspolicy som informerar hundägare om
                  behandlingen
                </li>
                <li>
                  Samtycke från hundägare vid registrering (checkbox i
                  bokningsformulär)
                </li>
                <li>
                  Rutiner för att hantera registerutdrag, rättelse och radering
                </li>
                <li>Dokumentation av rättslig grund för varje behandling</li>
              </ul>
            </div>
          </section>

          {/* 11. Avtalstid */}
          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              11. Avtalstid
            </h2>
            <p className="text-sm text-gray-700">
              Detta PUB-avtal gäller så länge Kunden har ett aktivt abonnemang
              på DogPlanner och behandlar personuppgifter genom Plattformen.
              Avtalet upphör automatiskt när abonnemanget sägs upp och all data
              har raderats eller återlämnats enligt avsnitt 12.
            </p>
          </section>

          {/* 12. Vid avtalets upphörande */}
          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              12. Vid avtalets upphörande
            </h2>

            <div className="space-y-4">
              <div className="border border-blue-200 bg-blue-50 rounded-lg p-4">
                <h3 className="font-semibold text-blue-900 mb-2">
                  12.1 Kundens val
                </h3>
                <p className="text-sm text-blue-800 mb-3">
                  Vid avtalets upphörande har Kunden rätt att välja mellan:
                </p>
                <div className="space-y-2">
                  <div className="bg-white border border-blue-200 rounded p-3">
                    <p className="font-semibold text-sm text-blue-900">
                      Alternativ A: Återlämning
                    </p>
                    <p className="text-xs text-blue-800">
                      DogPlanner exporterar all data i strukturerat format
                      (JSON/CSV) och tillhandahåller säker nedladdningslänk
                      giltig i 30 dagar.
                    </p>
                  </div>
                  <div className="bg-white border border-blue-200 rounded p-3">
                    <p className="font-semibold text-sm text-blue-900">
                      Alternativ B: Radering
                    </p>
                    <p className="text-xs text-blue-800">
                      DogPlanner raderar all data permanent efter 30 dagars
                      karenstid, förutom bokföringsuppgifter som sparas i 7 år
                      enligt bokföringslagen.
                    </p>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  12.2 Tidslinje
                </h3>
                <div className="space-y-3">
                  <div className="flex items-start space-x-3">
                    <div className="w-8 h-8 bg-primary text-white rounded-full flex items-center justify-center flex-shrink-0 font-bold text-xs">
                      0
                    </div>
                    <div>
                      <p className="font-semibold text-sm text-gray-900">
                        Avtalets upphörande
                      </p>
                      <p className="text-xs text-gray-700">
                        Abonnemanget sägs upp. Kunden väljer återlämning eller
                        radering.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start space-x-3">
                    <div className="w-8 h-8 bg-primary text-white rounded-full flex items-center justify-center flex-shrink-0 font-bold text-xs">
                      30d
                    </div>
                    <div>
                      <p className="font-semibold text-sm text-gray-900">
                        Karenstid
                      </p>
                      <p className="text-xs text-gray-700">
                        Kunden har 30 dagar på sig att ladda ner data. Kontot är
                        inaktiverat men data finns kvar.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start space-x-3">
                    <div className="w-8 h-8 bg-red-600 text-white rounded-full flex items-center justify-center flex-shrink-0 font-bold text-xs">
                      31d
                    </div>
                    <div>
                      <p className="font-semibold text-sm text-gray-900">
                        Permanent radering
                      </p>
                      <p className="text-xs text-gray-700">
                        All data raderas permanent (förutom bokföringsdata).
                        Ingen återställning möjlig.
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <h3 className="font-semibold text-yellow-900 mb-2">
                  12.3 Undantag: Bokföringsdata
                </h3>
                <p className="text-sm text-yellow-800">
                  Fakturor, betalningar och bokföringsdata måste sparas i 7 år
                  enligt bokföringslagen och kan inte raderas tidigare. Denna
                  data lagras isolerat från övrig verksamhet och används endast
                  vid myndighetskontroll eller skatteärenden.
                </p>
              </div>
            </div>
          </section>

          {/* 13. Ändringar */}
          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              13. Ändringar i avtalet
            </h2>
            <p className="text-sm text-gray-700 mb-4">
              DogPlanner kan uppdatera detta PUB-avtal för att följa ändringar i
              lagstiftning, nya säkerhetsåtgärder eller underleverantörer. Vid
              väsentliga ändringar meddelar vi Kunden minst
              <strong> 30 dagar i förväg</strong> via e-post.
            </p>
            <p className="text-sm text-gray-700">
              Om Kunden inte accepterar ändringarna har Kunden rätt att säga upp
              avtalet före ikraftträdandet.
            </p>
          </section>

          {/* 14. Tvistlösning */}
          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              14. Tillämplig lag och tvistlösning
            </h2>

            <div className="space-y-4">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  14.1 Tillämplig lag
                </h3>
                <p className="text-sm text-gray-700">
                  Detta avtal regleras av svensk lag och dataskyddsförordningen
                  (GDPR). Vid motsättning mellan svensk lag och GDPR, gäller
                  GDPR.
                </p>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  14.2 Tvistlösning
                </h3>
                <p className="text-sm text-gray-700">
                  Tvister ska i första hand lösas genom förhandling mellan
                  parterna. Om förhandling misslyckas ska tvisten avgöras av
                  svensk domstol med [DIN HEMORTS TINGSRÄTT] som första instans.
                </p>
              </div>
            </div>
          </section>

          {/* 15. Kontakt */}
          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              15. Kontaktinformation
            </h2>
            <div className="bg-primary/5 border border-primary/20 rounded-lg p-6">
              <p className="text-gray-700 mb-4">
                För frågor om detta PUB-avtal, personuppgiftsbehandling eller
                dataskydd:
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
                  <p className="font-semibold text-gray-900 mb-2">Dataskydd</p>
                  <p className="text-gray-700">
                    Dataskyddsombud:{" "}
                    <a
                      href="mailto:dpo@dogplanner.se"
                      className="text-primary hover:underline"
                    >
                      dpo@dogplanner.se
                    </a>
                    <br />
                    Integritet:{" "}
                    <a
                      href="mailto:privacy@dogplanner.se"
                      className="text-primary hover:underline"
                    >
                      privacy@dogplanner.se
                    </a>
                    <br />
                    Support:{" "}
                    <a
                      href="mailto:support@dogplanner.se"
                      className="text-primary hover:underline"
                    >
                      support@dogplanner.se
                    </a>
                  </p>
                </div>
              </div>
            </div>
          </section>

          {/* Signering */}
          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              16. Godkännande av avtalet
            </h2>
            <div className="bg-green-50 border border-green-200 rounded-lg p-6">
              <p className="text-sm text-green-800 mb-4">
                Detta Personuppgiftsbiträdesavtal godkänns elektroniskt när
                Kunden accepterar{" "}
                <Link
                  href="/legal/terms-business"
                  className="underline font-semibold"
                >
                  Allmänna Villkor för Företagskunder
                </Link>{" "}
                vid registrering av företagskonto. Båda dokumenten utgör
                tillsammans det fullständiga avtalet mellan DogPlanner och
                Kunden.
              </p>
              <p className="text-xs text-green-700">
                <strong>Juridisk grund:</strong> Elektronisk signering är
                juridiskt bindande enligt svensk lag och EU:s eIDAS-förordning
                (910/2014).
              </p>
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
              href="/legal/sla"
              className="flex items-center space-x-2 text-primary hover:text-primary-dark"
            >
              <Building2 className="w-5 h-5" />
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
