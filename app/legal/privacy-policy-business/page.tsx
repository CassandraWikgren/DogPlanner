"use client";

import Link from "next/link";
import {
  Shield,
  FileText,
  Building2,
  Database,
  Lock,
  Eye,
  AlertTriangle,
} from "lucide-react";

export default function PrivacyPolicyBusinessPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex items-center space-x-3 mb-4">
            <Building2 className="w-8 h-8 text-primary" />
            <h1 className="text-3xl font-bold text-gray-900">
              Integritetspolicy för Företagskunder
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
                För företagskunder
              </h3>
              <p className="text-sm text-blue-800">
                Denna integritetspolicy beskriver hur DogPlanner hanterar{" "}
                <strong>era företagsuppgifter</strong>
                som kund i vår SaaS-plattform. För information om hur vi
                behandlar personuppgifter som personuppgiftsbiträde (när ni
                samlar in hundägares data), se vårt{" "}
                <Link
                  href="/legal/pub-agreement"
                  className="underline font-semibold"
                >
                  Personuppgiftsbiträdesavtal (PUB)
                </Link>
                .
              </p>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="bg-white rounded-lg shadow-sm border p-8 space-y-8">
          {/* 1. Introduktion */}
          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              1. Introduktion
            </h2>
            <div className="prose prose-gray max-w-none text-gray-700">
              <p>
                DogPlanner AB (org.nr <strong>[DITT ORG-NR]</strong>) är
                personuppgiftsansvarig för behandlingen av era företagsuppgifter
                som företagskund i vår SaaS-plattform. Denna integritetspolicy
                beskriver hur vi samlar in, använder och skyddar era uppgifter
                enligt dataskyddsförordningen (GDPR).
              </p>

              <div className="bg-gray-50 rounded-lg p-4 mt-4">
                <p className="text-sm font-semibold mb-2">
                  Viktigt att förstå:
                </p>
                <ul className="text-sm space-y-2 list-disc list-inside">
                  <li>
                    <strong>Företagsuppgifter:</strong> Vi är
                    personuppgiftsansvariga för era kontaktpersoner,
                    fakturauppgifter och användarkonton (denna policy).
                  </li>
                  <li>
                    <strong>Hundägardata:</strong> Vi är personuppgiftsbiträde
                    när ni samlar in hundägaruppgifter genom plattformen (se
                    PUB-avtalet).
                  </li>
                </ul>
              </div>
            </div>
          </section>

          {/* 2. Personuppgiftsansvarig */}
          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              2. Personuppgiftsansvarig
            </h2>
            <div className="bg-primary/5 border border-primary/20 rounded-lg p-6">
              <p className="font-semibold text-gray-900 mb-3">DogPlanner AB</p>
              <div className="space-y-1 text-sm text-gray-700">
                <p>
                  <strong>Organisationsnummer:</strong> [DITT ORG-NR]
                </p>
                <p>
                  <strong>Adress:</strong> [DIN ADRESS]
                </p>
                <p>
                  <strong>E-post:</strong> privacy@dogplanner.se
                </p>
                <p>
                  <strong>Telefon:</strong> [DITT TELEFONNUMMER]
                </p>
              </div>
            </div>
          </section>

          {/* 3. Vilka uppgifter samlar vi in? */}
          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              3. Vilka företagsuppgifter samlar vi in?
            </h2>

            {/* 3.1 Företagsinformation */}
            <div className="mb-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-3">
                3.1 Företags- och organisationsinformation
              </h3>
              <div className="bg-gray-50 rounded-lg p-4">
                <ul className="space-y-2 text-sm text-gray-700">
                  <li className="flex items-start">
                    <Building2 className="w-4 h-4 text-primary mr-2 mt-0.5 flex-shrink-0" />
                    <span>
                      <strong>Företagsnamn</strong> och organisationsnummer
                    </span>
                  </li>
                  <li className="flex items-start">
                    <Building2 className="w-4 h-4 text-primary mr-2 mt-0.5 flex-shrink-0" />
                    <span>
                      <strong>Besöksadress</strong> och postadress för
                      anläggningen
                    </span>
                  </li>
                  <li className="flex items-start">
                    <Building2 className="w-4 h-4 text-primary mr-2 mt-0.5 flex-shrink-0" />
                    <span>
                      <strong>Telefonnummer</strong> och e-postadress till
                      företaget
                    </span>
                  </li>
                  <li className="flex items-start">
                    <Building2 className="w-4 h-4 text-primary mr-2 mt-0.5 flex-shrink-0" />
                    <span>
                      <strong>Verksamhetstyp</strong> (hundpensionat, hunddagis,
                      frisör)
                    </span>
                  </li>
                  <li className="flex items-start">
                    <Building2 className="w-4 h-4 text-primary mr-2 mt-0.5 flex-shrink-0" />
                    <span>
                      <strong>Bankkontonummer</strong> (för utbetalningar från
                      plattformen)
                    </span>
                  </li>
                </ul>
              </div>
            </div>

            {/* 3.2 Kontaktpersoner */}
            <div className="mb-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-3">
                3.2 Kontaktpersoner och användarkonton
              </h3>
              <div className="bg-gray-50 rounded-lg p-4">
                <ul className="space-y-2 text-sm text-gray-700">
                  <li className="flex items-start">
                    <Eye className="w-4 h-4 text-primary mr-2 mt-0.5 flex-shrink-0" />
                    <span>
                      <strong>Namn</strong> på administratörer och personal
                    </span>
                  </li>
                  <li className="flex items-start">
                    <Eye className="w-4 h-4 text-primary mr-2 mt-0.5 flex-shrink-0" />
                    <span>
                      <strong>E-postadress</strong> för inloggning
                    </span>
                  </li>
                  <li className="flex items-start">
                    <Eye className="w-4 h-4 text-primary mr-2 mt-0.5 flex-shrink-0" />
                    <span>
                      <strong>Telefonnummer</strong> (valfritt)
                    </span>
                  </li>
                  <li className="flex items-start">
                    <Eye className="w-4 h-4 text-primary mr-2 mt-0.5 flex-shrink-0" />
                    <span>
                      <strong>Behörighetsnivå</strong> (ägare, admin, personal)
                    </span>
                  </li>
                  <li className="flex items-start">
                    <Eye className="w-4 h-4 text-primary mr-2 mt-0.5 flex-shrink-0" />
                    <span>
                      <strong>Lösenord</strong> (hashat och krypterat)
                    </span>
                  </li>
                </ul>
              </div>
            </div>

            {/* 3.3 Faktureringsuppgifter */}
            <div className="mb-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-3">
                3.3 Fakturering och betalning
              </h3>
              <div className="bg-gray-50 rounded-lg p-4">
                <ul className="space-y-2 text-sm text-gray-700">
                  <li className="flex items-start">
                    <FileText className="w-4 h-4 text-primary mr-2 mt-0.5 flex-shrink-0" />
                    <span>
                      <strong>Fakturaadress</strong> och referensperson
                    </span>
                  </li>
                  <li className="flex items-start">
                    <FileText className="w-4 h-4 text-primary mr-2 mt-0.5 flex-shrink-0" />
                    <span>
                      <strong>Betalningsmetod</strong> (autogiro, faktura, kort)
                    </span>
                  </li>
                  <li className="flex items-start">
                    <FileText className="w-4 h-4 text-primary mr-2 mt-0.5 flex-shrink-0" />
                    <span>
                      <strong>Transaktionshistorik</strong> (månatliga avgifter,
                      bokningsprovision)
                    </span>
                  </li>
                  <li className="flex items-start">
                    <FileText className="w-4 h-4 text-primary mr-2 mt-0.5 flex-shrink-0" />
                    <span>
                      <strong>Abonnemangstyp</strong> (Free, Basic,
                      Professional, Enterprise)
                    </span>
                  </li>
                </ul>
              </div>
            </div>

            {/* 3.4 Tekniska uppgifter */}
            <div className="mb-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-3">
                3.4 Tekniska uppgifter och användning
              </h3>
              <div className="bg-gray-50 rounded-lg p-4">
                <ul className="space-y-2 text-sm text-gray-700">
                  <li className="flex items-start">
                    <Database className="w-4 h-4 text-primary mr-2 mt-0.5 flex-shrink-0" />
                    <span>
                      <strong>IP-adress</strong> och inloggningshistorik
                    </span>
                  </li>
                  <li className="flex items-start">
                    <Database className="w-4 h-4 text-primary mr-2 mt-0.5 flex-shrink-0" />
                    <span>
                      <strong>Webbläsartyp</strong> och operativsystem
                    </span>
                  </li>
                  <li className="flex items-start">
                    <Database className="w-4 h-4 text-primary mr-2 mt-0.5 flex-shrink-0" />
                    <span>
                      <strong>Användningsstatistik</strong> (antal bokningar,
                      incheckningar, fakturor)
                    </span>
                  </li>
                  <li className="flex items-start">
                    <Database className="w-4 h-4 text-primary mr-2 mt-0.5 flex-shrink-0" />
                    <span>
                      <strong>Felloggar</strong> och supportärenden
                    </span>
                  </li>
                </ul>
              </div>
            </div>
          </section>

          {/* 4. Rättslig grund */}
          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              4. Rättslig grund för behandling
            </h2>

            <div className="space-y-4">
              {/* Avtalsuppfyllelse */}
              <div className="border border-green-200 bg-green-50 rounded-lg p-4">
                <div className="flex items-start space-x-3">
                  <div className="w-8 h-8 bg-green-200 rounded-full flex items-center justify-center flex-shrink-0">
                    <FileText className="w-5 h-5 text-green-700" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-green-900 mb-2">
                      Avtalsuppfyllelse (GDPR Art. 6.1.b)
                    </h3>
                    <p className="text-sm text-green-800">
                      Vi behandlar era uppgifter för att uppfylla vårt avtal med
                      er: tillhandahålla plattformen, hantera er prenumeration,
                      ge support och utföra betalningar.
                    </p>
                  </div>
                </div>
              </div>

              {/* Rättslig förpliktelse */}
              <div className="border border-blue-200 bg-blue-50 rounded-lg p-4">
                <div className="flex items-start space-x-3">
                  <div className="w-8 h-8 bg-blue-200 rounded-full flex items-center justify-center flex-shrink-0">
                    <Shield className="w-5 h-5 text-blue-700" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-blue-900 mb-2">
                      Rättslig förpliktelse (GDPR Art. 6.1.c)
                    </h3>
                    <p className="text-sm text-blue-800">
                      Vi måste spara faktureringsuppgifter i 7 år enligt
                      bokföringslagen och hantera personuppgifter enligt GDPR
                      (inklusive PUB-avtalet med er).
                    </p>
                  </div>
                </div>
              </div>

              {/* Berättigat intresse */}
              <div className="border border-purple-200 bg-purple-50 rounded-lg p-4">
                <div className="flex items-start space-x-3">
                  <div className="w-8 h-8 bg-purple-200 rounded-full flex items-center justify-center flex-shrink-0">
                    <Eye className="w-5 h-5 text-purple-700" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-purple-900 mb-2">
                      Berättigat intresse (GDPR Art. 6.1.f)
                    </h3>
                    <p className="text-sm text-purple-800 mb-2">
                      Vi behandlar uppgifter för säkerhet, bedrägeriförebyggande
                      och förbättring av plattformen. Ni kan invända mot denna
                      behandling.
                    </p>
                    <p className="text-xs text-purple-700">
                      <strong>Exempel:</strong> IP-loggning för att upptäcka
                      obehörig åtkomst, användningsstatistik för att förbättra
                      funktioner.
                    </p>
                  </div>
                </div>
              </div>

              {/* Samtycke */}
              <div className="border border-yellow-200 bg-yellow-50 rounded-lg p-4">
                <div className="flex items-start space-x-3">
                  <div className="w-8 h-8 bg-yellow-200 rounded-full flex items-center justify-center flex-shrink-0">
                    <AlertTriangle className="w-5 h-5 text-yellow-700" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-yellow-900 mb-2">
                      Samtycke (GDPR Art. 6.1.a)
                    </h3>
                    <p className="text-sm text-yellow-800">
                      För marknadsföring (nyhetsbrev, produktuppdateringar)
                      behöver vi ert samtycke. Ni kan när som helst återkalla
                      samtycket.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* 5. Hur använder vi uppgifterna? */}
          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              5. Hur använder vi era uppgifter?
            </h2>

            <div className="space-y-3">
              <div className="flex items-start space-x-3">
                <div className="w-2 h-2 bg-primary rounded-full mt-2" />
                <p className="text-gray-700 text-sm">
                  <strong>Tillhandahålla tjänsten:</strong> Ge er tillgång till
                  plattformen, hantera bokningar, hundregister, fakturering och
                  andra funktioner.
                </p>
              </div>

              <div className="flex items-start space-x-3">
                <div className="w-2 h-2 bg-primary rounded-full mt-2" />
                <p className="text-gray-700 text-sm">
                  <strong>Fakturering:</strong> Skicka fakturor, hantera
                  betalningar och föra bokföring enligt svensk lag.
                </p>
              </div>

              <div className="flex items-start space-x-3">
                <div className="w-2 h-2 bg-primary rounded-full mt-2" />
                <p className="text-gray-700 text-sm">
                  <strong>Support:</strong> Hjälpa er med tekniska problem,
                  frågor och förbättringsförslag.
                </p>
              </div>

              <div className="flex items-start space-x-3">
                <div className="w-2 h-2 bg-primary rounded-full mt-2" />
                <p className="text-gray-700 text-sm">
                  <strong>Säkerhet:</strong> Upptäcka och förebygga obehörig
                  åtkomst, bedrägeri och tekniska problem.
                </p>
              </div>

              <div className="flex items-start space-x-3">
                <div className="w-2 h-2 bg-primary rounded-full mt-2" />
                <p className="text-gray-700 text-sm">
                  <strong>Förbättring:</strong> Analysera hur plattformen
                  används för att utveckla nya funktioner och förbättra
                  användarupplevelsen.
                </p>
              </div>

              <div className="flex items-start space-x-3">
                <div className="w-2 h-2 bg-primary rounded-full mt-2" />
                <p className="text-gray-700 text-sm">
                  <strong>Kommunikation:</strong> Skicka viktiga meddelanden om
                  tjänsten, ändringar i villkor, säkerhetsuppdateringar och (med
                  samtycke) marknadsföring.
                </p>
              </div>

              <div className="flex items-start space-x-3">
                <div className="w-2 h-2 bg-primary rounded-full mt-2" />
                <p className="text-gray-700 text-sm">
                  <strong>Efterlevnad:</strong> Uppfylla lagkrav (bokföring,
                  GDPR, skatt).
                </p>
              </div>
            </div>
          </section>

          {/* 6. Vem delar vi uppgifter med? */}
          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              6. Vem delar vi era uppgifter med?
            </h2>

            <div className="space-y-4">
              <div className="border border-gray-200 rounded-lg p-4">
                <h3 className="font-semibold text-gray-900 mb-2">
                  Tekniska leverantörer (Underbiträden)
                </h3>
                <p className="text-sm text-gray-700 mb-3">
                  Vi använder följande underleverantörer som kan behandla era
                  uppgifter. Alla har personuppgiftsbiträdesavtal med oss enligt
                  GDPR Art. 28.
                </p>
                <div className="space-y-2 text-sm">
                  <p>
                    <strong>Supabase (USA, Inc. via EU-region):</strong> Databas
                    och autentisering. Data lagras i EU (Frankfurt, Tyskland).
                  </p>
                  <p>
                    <strong>Vercel Inc. (USA via EU-region):</strong>{" "}
                    Webbhosting. Data lagras i EU (Stockholm, Sverige /
                    Frankfurt, Tyskland).
                  </p>
                  <p>
                    <strong>Resend (USA via EU-region):</strong> E-posttjänst
                    för transaktionsmejl. EU-baserad infrastruktur.
                  </p>
                </div>
              </div>

              <div className="border border-gray-200 rounded-lg p-4">
                <h3 className="font-semibold text-gray-900 mb-2">
                  Betalningsleverantörer
                </h3>
                <p className="text-sm text-gray-700">
                  <strong>Stripe:</strong> Hanterar kortbetalningar och
                  autogiro. Stripe är PCI DSS Level 1 certifierad och följer
                  strikta säkerhetskrav.
                </p>
              </div>

              <div className="border border-gray-200 rounded-lg p-4">
                <h3 className="font-semibold text-gray-900 mb-2">
                  Myndigheter
                </h3>
                <p className="text-sm text-gray-700">
                  Vi kan behöva dela uppgifter med Skatteverket, Bolagsverket
                  eller andra myndigheter vid lagkrav eller officiella
                  förfrågningar.
                </p>
              </div>

              <div className="border border-gray-200 rounded-lg p-4">
                <h3 className="font-semibold text-gray-900 mb-2">
                  Vi säljer ALDRIG era uppgifter
                </h3>
                <p className="text-sm text-gray-700">
                  DogPlanner säljer eller hyr aldrig ut era företagsuppgifter
                  till tredje part för marknadsföring eller andra ändamål.
                </p>
              </div>
            </div>
          </section>

          {/* 7. Var lagras uppgifterna? */}
          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              7. Var lagras era uppgifter?
            </h2>

            <div className="bg-green-50 border border-green-200 rounded-lg p-6 mb-4">
              <div className="flex items-start space-x-3">
                <Lock className="w-6 h-6 text-green-700 mt-1" />
                <div>
                  <h3 className="font-semibold text-green-900 mb-2">
                    EU-baserad lagring
                  </h3>
                  <p className="text-sm text-green-800">
                    Alla era uppgifter lagras inom EU (primärt i Frankfurt,
                    Tyskland och Stockholm, Sverige). Vi överför inte uppgifter
                    till länder utanför EU/EES.
                  </p>
                </div>
              </div>
            </div>

            <h3 className="text-lg font-semibold mb-3">Säkerhetsåtgärder</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div className="border border-gray-200 rounded-lg p-4">
                <p className="font-semibold text-gray-900 mb-1">Kryptering</p>
                <p className="text-gray-700">
                  All data krypteras både vid överföring (TLS 1.3) och i vila
                  (AES-256).
                </p>
              </div>

              <div className="border border-gray-200 rounded-lg p-4">
                <p className="font-semibold text-gray-900 mb-1">
                  Åtkomstkontroll
                </p>
                <p className="text-gray-700">
                  Endast auktoriserad personal har tillgång.
                  Två-faktor-autentisering för alla admins.
                </p>
              </div>

              <div className="border border-gray-200 rounded-lg p-4">
                <p className="font-semibold text-gray-900 mb-1">
                  Säkerhetskopiering
                </p>
                <p className="text-gray-700">
                  Dagliga automatiska backuper med 30 dagars historik.
                  Återställning inom 4 timmar.
                </p>
              </div>

              <div className="border border-gray-200 rounded-lg p-4">
                <p className="font-semibold text-gray-900 mb-1">Övervakning</p>
                <p className="text-gray-700">
                  24/7 säkerhetsövervakning och automatisk detektion av onormal
                  aktivitet.
                </p>
              </div>
            </div>
          </section>

          {/* 8. Hur länge sparar vi uppgifterna? */}
          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              8. Hur länge sparar vi uppgifterna?
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
                      Rättslig grund
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  <tr>
                    <td className="px-6 py-4 text-sm text-gray-900">
                      Företagsinformation
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-700">
                      Under avtalstid + 3 år
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      Avtal + Bokföringslagen
                    </td>
                  </tr>
                  <tr>
                    <td className="px-6 py-4 text-sm text-gray-900">
                      Kontaktpersoner
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-700">
                      Under avtalstid + 1 år
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">Avtal</td>
                  </tr>
                  <tr>
                    <td className="px-6 py-4 text-sm text-gray-900">
                      Faktureringsuppgifter
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-700">
                      7 år från fakturadatum
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      Bokföringslagen
                    </td>
                  </tr>
                  <tr>
                    <td className="px-6 py-4 text-sm text-gray-900">
                      Användningsstatistik
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-700">
                      Under avtalstid + 6 månader
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      Berättigat intresse
                    </td>
                  </tr>
                  <tr>
                    <td className="px-6 py-4 text-sm text-gray-900">
                      Supportärenden
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-700">
                      3 år efter ärendet stängdes
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      Avtal + Berättigat intresse
                    </td>
                  </tr>
                  <tr>
                    <td className="px-6 py-4 text-sm text-gray-900">
                      Marknadsföringssamtycke
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-700">
                      Tills samtycke återkallas
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      Samtycke
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            <p className="text-sm text-gray-600 mt-4">
              <strong>Efter avtalets upphörande:</strong> Vi raderar era
              uppgifter enligt ovan tidsfrister, förutom faktureringsuppgifter
              som måste sparas i 7 år enligt bokföringslagen.
            </p>
          </section>

          {/* 9. Era rättigheter */}
          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              9. Era rättigheter enligt GDPR
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Rätt till tillgång */}
              <div className="border border-blue-200 bg-blue-50 rounded-lg p-4">
                <h3 className="font-semibold text-blue-900 mb-2 flex items-center">
                  <Eye className="w-5 h-5 mr-2" />
                  Rätt till tillgång (Art. 15)
                </h3>
                <p className="text-sm text-blue-800">
                  Ni har rätt att få en kopia av alla uppgifter vi har om ert
                  företag och era kontaktpersoner.
                </p>
              </div>

              {/* Rätt till rättelse */}
              <div className="border border-green-200 bg-green-50 rounded-lg p-4">
                <h3 className="font-semibold text-green-900 mb-2 flex items-center">
                  <FileText className="w-5 h-5 mr-2" />
                  Rätt till rättelse (Art. 16)
                </h3>
                <p className="text-sm text-green-800">
                  Ni kan när som helst uppdatera felaktiga uppgifter via
                  plattformens inställningar eller genom att kontakta oss.
                </p>
              </div>

              {/* Rätt till radering */}
              <div className="border border-red-200 bg-red-50 rounded-lg p-4">
                <h3 className="font-semibold text-red-900 mb-2 flex items-center">
                  <AlertTriangle className="w-5 h-5 mr-2" />
                  Rätt till radering (Art. 17)
                </h3>
                <p className="text-sm text-red-800">
                  Efter avtalets upphörande kan ni begära radering av uppgifter
                  (utom faktureringsuppgifter som måste sparas enligt
                  bokföringslagen).
                </p>
              </div>

              {/* Rätt till dataportabilitet */}
              <div className="border border-purple-200 bg-purple-50 rounded-lg p-4">
                <h3 className="font-semibold text-purple-900 mb-2 flex items-center">
                  <Database className="w-5 h-5 mr-2" />
                  Rätt till dataportabilitet (Art. 20)
                </h3>
                <p className="text-sm text-purple-800">
                  Ni kan exportera era data i maskinläsbart format (JSON/CSV)
                  för att flytta till annan leverantör.
                </p>
              </div>

              {/* Rätt att invända */}
              <div className="border border-yellow-200 bg-yellow-50 rounded-lg p-4">
                <h3 className="font-semibold text-yellow-900 mb-2 flex items-center">
                  <Shield className="w-5 h-5 mr-2" />
                  Rätt att invända (Art. 21)
                </h3>
                <p className="text-sm text-yellow-800">
                  Ni kan invända mot behandling baserad på berättigat intresse
                  (t.ex. användningsstatistik för förbättringar).
                </p>
              </div>

              {/* Rätt att återkalla samtycke */}
              <div className="border border-gray-200 bg-gray-50 rounded-lg p-4">
                <h3 className="font-semibold text-gray-900 mb-2 flex items-center">
                  <Lock className="w-5 h-5 mr-2" />
                  Rätt att återkalla samtycke (Art. 7.3)
                </h3>
                <p className="text-sm text-gray-700">
                  Ni kan när som helst återkalla samtycke till marknadsföring
                  utan att det påverkar lämpligheten av tidigare behandling.
                </p>
              </div>
            </div>

            <div className="bg-primary/5 border border-primary/20 rounded-lg p-4 mt-6">
              <p className="text-sm text-gray-700">
                <strong>Så utövar ni era rättigheter:</strong> Kontakta oss på{" "}
                <a
                  href="mailto:privacy@dogplanner.se"
                  className="text-primary hover:underline"
                >
                  privacy@dogplanner.se
                </a>{" "}
                så svarar vi inom 30 dagar enligt GDPR.
              </p>
            </div>
          </section>

          {/* 10. Dataskyddsombud */}
          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              10. Dataskyddsombud (DPO)
            </h2>
            <p className="text-gray-700 text-sm mb-4">
              DogPlanner har utsett ett dataskyddsombud som ni kan kontakta för
              frågor om personuppgifter och GDPR-efterlevnad:
            </p>
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
              <p className="text-sm text-gray-700">
                <strong>E-post:</strong>{" "}
                <a
                  href="mailto:dpo@dogplanner.se"
                  className="text-primary hover:underline"
                >
                  dpo@dogplanner.se
                </a>
              </p>
            </div>
          </section>

          {/* 11. Ändringar */}
          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              11. Ändringar i integritetspolicyn
            </h2>
            <p className="text-gray-700 text-sm">
              Vi kan komma att uppdatera denna integritetspolicy. Vid väsentliga
              ändringar kommer vi att meddela er via e-post minst 30 dagar innan
              ändringarna träder i kraft. Vi rekommenderar att ni regelbundet
              läser denna policy.
            </p>
          </section>

          {/* 12. Klagomål */}
          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              12. Klagomål och tillsyn
            </h2>
            <p className="text-gray-700 text-sm mb-4">
              Om ni är missnöjda med hur vi hanterar era personuppgifter har ni
              rätt att lämna klagomål till Integritetsskyddsmyndigheten (IMY):
            </p>
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
              <p className="font-semibold text-gray-900 mb-2">
                Integritetsskyddsmyndigheten (IMY)
              </p>
              <div className="space-y-1 text-sm text-gray-700">
                <p>
                  <strong>Adress:</strong> Box 8114, 104 20 Stockholm
                </p>
                <p>
                  <strong>Telefon:</strong> 08-657 61 00
                </p>
                <p>
                  <strong>Webbplats:</strong>{" "}
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

          {/* 13. Kontakt */}
          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              13. Kontakta oss
            </h2>
            <div className="bg-primary/5 border border-primary/20 rounded-lg p-6">
              <p className="text-gray-700 mb-4">
                Om ni har frågor om hur vi hanterar era personuppgifter,
                kontakta oss gärna:
              </p>

              <div className="space-y-2 text-sm">
                <p>
                  <strong>E-post (Integritet):</strong>{" "}
                  <a
                    href="mailto:privacy@dogplanner.se"
                    className="text-primary hover:underline"
                  >
                    privacy@dogplanner.se
                  </a>
                </p>
                <p>
                  <strong>E-post (Dataskyddsombud):</strong>{" "}
                  <a
                    href="mailto:dpo@dogplanner.se"
                    className="text-primary hover:underline"
                  >
                    dpo@dogplanner.se
                  </a>
                </p>
                <p>
                  <strong>E-post (Support):</strong>{" "}
                  <a
                    href="mailto:support@dogplanner.se"
                    className="text-primary hover:underline"
                  >
                    support@dogplanner.se
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
                <p>
                  <strong>Telefon:</strong> [DITT TELEFONNUMMER]
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
              href="/legal/pub-agreement"
              className="flex items-center space-x-2 text-primary hover:text-primary-dark"
            >
              <Shield className="w-5 h-5" />
              <span>Personuppgiftsbiträdesavtal (PUB)</span>
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
