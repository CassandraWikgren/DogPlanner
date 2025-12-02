"use client";

import React from "react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  ArrowLeft,
  BookOpen,
  CheckCircle,
  AlertTriangle,
  FileText,
  Mail,
  Calendar,
  DollarSign,
  Info,
  Lightbulb,
  Clock,
} from "lucide-react";

export default function EkonomiHjalpPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-4xl mx-auto px-6 py-6">
          <Link
            href="/ekonomi"
            className="inline-flex items-center text-[#2c7a4c] hover:text-[#236139] mb-4"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Tillbaka till Ekonomi
          </Link>
          <h1 className="text-[32px] font-bold text-[#2c7a4c]">
            📚 Hjälp: Faktureringssystemet
          </h1>
          <p className="text-base text-gray-600 mt-1">
            Så fungerar fakturering i DogPlanner - en komplett guide
          </p>
        </div>
      </div>

      <main className="max-w-4xl mx-auto px-6 py-8">
        {/* Viktigt att veta först */}
        <Card className="mb-6 border-l-4 border-l-orange-500 bg-orange-50">
          <CardContent className="pt-6">
            <div className="flex items-start gap-3">
              <AlertTriangle className="h-6 w-6 text-orange-600 flex-shrink-0 mt-1" />
              <div>
                <h3 className="font-bold text-orange-900 text-lg mb-2">
                  ⚠️ Viktigt att göra rätt från start!
                </h3>
                <p className="text-orange-800 mb-2">
                  Fakturering påverkar direkt dina inkomster och bokföring. Ta
                  dig tid att förstå hur systemet fungerar innan du börjar skapa
                  fakturor.
                </p>
                <ul className="list-disc list-inside space-y-1 text-orange-800 text-sm">
                  <li>Fakturor skapas automatiskt när bokningar godkänns</li>
                  <li>Du kan även skapa manuella fakturor</li>
                  <li>
                    Kontrollera alltid att kunduppgifter (email, telefon) är
                    korrekta
                  </li>
                  <li>
                    Fakturor skickas via email - kunden måste ha email för att
                    ta emot
                  </li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Hur systemet fungerar */}
        <Card className="mb-6">
          <CardHeader className="bg-[#2c7a4c] text-white rounded-t-lg">
            <CardTitle className="text-lg font-semibold flex items-center gap-2">
              <BookOpen className="h-5 w-5" />
              Hur fakturering fungerar i DogPlanner
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="space-y-6">
              {/* Automatisk fakturering */}
              <div>
                <h3 className="font-bold text-gray-900 mb-3 flex items-center gap-2">
                  <CheckCircle className="h-5 w-5 text-green-600" />
                  1. Automatisk fakturering (Rekommenderat)
                </h3>
                <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-3">
                  <p className="text-sm text-green-800 mb-2">
                    <strong>Hunddagis:</strong> När du godkänner en ansökan
                    skapas automatiskt en förskottsfaktura för första månaden.
                  </p>
                  <p className="text-sm text-green-800 mb-2">
                    <strong>Hundpensionat:</strong> När gästen checkar ut skapas
                    automatiskt en faktura med alla kostnader (boende, mat,
                    tillval).
                  </p>
                  <p className="text-sm text-green-800">
                    <strong>Hundfrisör:</strong> När du markerar en bokning som
                    klar skapas automatiskt en faktura för behandlingen.
                  </p>
                </div>
                <p className="text-sm text-gray-600">
                  Systemet skapar fakturan med status <strong>"Utkast"</strong>.
                  Du måste sedan granska och skicka fakturan manuellt.
                </p>
              </div>

              {/* Manuell fakturering */}
              <div>
                <h3 className="font-bold text-gray-900 mb-3 flex items-center gap-2">
                  <FileText className="h-5 w-5 text-blue-600" />
                  2. Manuell fakturering
                </h3>
                <p className="text-sm text-gray-600 mb-2">
                  Använd knappen <strong>"Ny faktura"</strong> för att skapa
                  egna fakturor:
                </p>
                <ul className="list-disc list-inside space-y-1 text-sm text-gray-600 ml-4">
                  <li>Extrakostnader som inte täcks av standardpriser</li>
                  <li>Särskilda tjänster eller produkter</li>
                  <li>Korrigera eller justera belopp</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Fakturastatusar */}
        <Card className="mb-6">
          <CardHeader className="bg-[#2c7a4c] text-white rounded-t-lg">
            <CardTitle className="text-lg font-semibold flex items-center gap-2">
              <Info className="h-5 w-5" />
              Förstå fakturastatusar
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <div className="w-20 flex-shrink-0">
                  <span className="inline-block px-3 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                    Utkast
                  </span>
                </div>
                <div>
                  <p className="text-sm text-gray-700">
                    Fakturan är skapad men <strong>inte skickad</strong> till
                    kunden. Du kan redigera, granska och sedan skicka den.
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    ➡️ Åtgärd: Klicka "Skicka via email" för att skicka till
                    kund
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="w-20 flex-shrink-0">
                  <span className="inline-block px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                    Skickad
                  </span>
                </div>
                <div>
                  <p className="text-sm text-gray-700">
                    Fakturan är <strong>skickad via email</strong> till kunden
                    och väntar på betalning.
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    ➡️ Åtgärd: När kunden betalar, klicka "Markera som betald"
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="w-20 flex-shrink-0">
                  <span className="inline-block px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                    Betald
                  </span>
                </div>
                <div>
                  <p className="text-sm text-gray-700">
                    Fakturan är <strong>betald och klar</strong>. Ingen åtgärd
                    behövs.
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    ✅ Detta räknas som intäkt i din bokföring
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="w-20 flex-shrink-0">
                  <span className="inline-block px-3 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
                    Förfallen
                  </span>
                </div>
                <div>
                  <p className="text-sm text-gray-700">
                    Fakturan har <strong>passerat förfallodatum</strong> utan
                    betalning. Kontakta kunden.
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    ⚠️ Följ upp med kunden via telefon eller email
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Steg-för-steg guide */}
        <Card className="mb-6">
          <CardHeader className="bg-[#2c7a4c] text-white rounded-t-lg">
            <CardTitle className="text-lg font-semibold flex items-center gap-2">
              <Lightbulb className="h-5 w-5" />
              Steg-för-steg: Hantera fakturor
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="space-y-6">
              {/* Steg 1 */}
              <div>
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-8 h-8 rounded-full bg-[#2c7a4c] text-white flex items-center justify-center font-bold text-sm">
                    1
                  </div>
                  <h4 className="font-bold text-gray-900">
                    Granska nya fakturor
                  </h4>
                </div>
                <p className="text-sm text-gray-600 ml-11">
                  När en faktura skapas automatiskt (t.ex. vid godkänd
                  dagisansökan) får den status "Utkast". Kontrollera:
                </p>
                <ul className="list-disc list-inside space-y-1 text-sm text-gray-600 ml-11 mt-2">
                  <li>Kundnamn och kontaktuppgifter är korrekta</li>
                  <li>Hundnamn visas (så du vet vilken hund det gäller)</li>
                  <li>Belopp och beskrivning stämmer</li>
                  <li>Förfallodatum är rimligt (standard: 30 dagar)</li>
                </ul>
              </div>

              {/* Steg 2 */}
              <div>
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-8 h-8 rounded-full bg-[#2c7a4c] text-white flex items-center justify-center font-bold text-sm">
                    2
                  </div>
                  <h4 className="font-bold text-gray-900">
                    Skicka fakturan till kund
                  </h4>
                </div>
                <p className="text-sm text-gray-600 ml-11 mb-2">
                  Klicka på <strong>"Skicka via email"</strong> knappen. Detta:
                </p>
                <ul className="list-disc list-inside space-y-1 text-sm text-gray-600 ml-11">
                  <li>Skickar fakturan som PDF via email till kunden</li>
                  <li>Ändrar status från "Utkast" till "Skickad"</li>
                  <li>Kunden får en länk för att ladda ner PDF:en</li>
                </ul>
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 ml-11 mt-2">
                  <p className="text-xs text-yellow-800">
                    <strong>⚠️ Viktigt:</strong> Kunden MÅSTE ha en email-adress
                    registrerad. Om email saknas kan du inte skicka fakturan.
                  </p>
                </div>
              </div>

              {/* Steg 3 */}
              <div>
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-8 h-8 rounded-full bg-[#2c7a4c] text-white flex items-center justify-center font-bold text-sm">
                    3
                  </div>
                  <h4 className="font-bold text-gray-900">
                    Bevaka betalningar
                  </h4>
                </div>
                <p className="text-sm text-gray-600 ml-11 mb-2">
                  Efter att fakturan skickats:
                </p>
                <ul className="list-disc list-inside space-y-1 text-sm text-gray-600 ml-11">
                  <li>Kolla ditt bankkonto regelbundet</li>
                  <li>
                    När betalning inkommit: klicka "Markera som betald" på
                    fakturan
                  </li>
                  <li>
                    Om förfallodatum passerat: kontakta kunden för påminnelse
                  </li>
                </ul>
              </div>

              {/* Steg 4 */}
              <div>
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-8 h-8 rounded-full bg-[#2c7a4c] text-white flex items-center justify-center font-bold text-sm">
                    4
                  </div>
                  <h4 className="font-bold text-gray-900">
                    Exportera för bokföring
                  </h4>
                </div>
                <p className="text-sm text-gray-600 ml-11 mb-2">
                  Månadsvis eller vid behov:
                </p>
                <ul className="list-disc list-inside space-y-1 text-sm text-gray-600 ml-11">
                  <li>
                    Gå till <strong>"Alla fakturor"</strong> sidan
                  </li>
                  <li>Filtrera på månad och status</li>
                  <li>Klicka "Exportera CSV" för att ladda ner underlag</li>
                  <li>Importera CSV-filen i ditt bokföringsprogram</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Vanliga frågor */}
        <Card className="mb-6">
          <CardHeader className="bg-[#2c7a4c] text-white rounded-t-lg">
            <CardTitle className="text-lg font-semibold">
              ❓ Vanliga frågor och felsökning
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="space-y-4">
              <div>
                <h4 className="font-semibold text-gray-900 mb-2">
                  Q: Varför kan jag inte skicka en faktura?
                </h4>
                <p className="text-sm text-gray-600">
                  A: Den vanligaste orsaken är att kunden saknar email-adress.
                  Gå till kundregistret och lägg till email för kunden.
                </p>
              </div>

              <div>
                <h4 className="font-semibold text-gray-900 mb-2">
                  Q: Vad händer om jag skickar fel faktura?
                </h4>
                <p className="text-sm text-gray-600">
                  A: Du kan skapa en ny kreditfaktura (negativ faktura) för att
                  korrigera. Alternativt kontakta kunden och be dem ignorera den
                  felaktiga fakturan.
                </p>
              </div>

              <div>
                <h4 className="font-semibold text-gray-900 mb-2">
                  Q: Fakturan saknar hundnamn - varför?
                </h4>
                <p className="text-sm text-gray-600">
                  A: Detta kan hända om fakturan skapades manuellt utan koppling
                  till en bokning. Se till att alltid koppla fakturor till rätt
                  bokning/hund.
                </p>
              </div>

              <div>
                <h4 className="font-semibold text-gray-900 mb-2">
                  Q: Hur ändrar jag förfallodatum?
                </h4>
                <p className="text-sm text-gray-600">
                  A: För närvarande går detta inte i gränssnittet. Standard är
                  30 dagar från fakturadatum. Kontakta support om du behöver
                  ändra detta.
                </p>
              </div>

              <div>
                <h4 className="font-semibold text-gray-900 mb-2">
                  Q: Kan jag se vilka fakturor som är obetalda?
                </h4>
                <p className="text-sm text-gray-600">
                  A: Ja! Använd statusfiltret och välj "Skickad" för att se alla
                  fakturor som väntar på betalning. Välj "Förfallen" för att se
                  förfallna fakturor.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Tips för bästa praxis */}
        <Card className="mb-6 border-l-4 border-l-blue-500 bg-blue-50">
          <CardContent className="pt-6">
            <div className="flex items-start gap-3">
              <Lightbulb className="h-6 w-6 text-blue-600 flex-shrink-0 mt-1" />
              <div>
                <h3 className="font-bold text-blue-900 text-lg mb-3">
                  💡 Tips för bästa praxis
                </h3>
                <ul className="space-y-2 text-blue-800 text-sm">
                  <li className="flex items-start gap-2">
                    <CheckCircle className="h-4 w-4 flex-shrink-0 mt-0.5" />
                    <span>
                      <strong>Granska fakturor dagligen</strong> - Kolla nya
                      utkast varje dag så inget glöms bort
                    </span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="h-4 w-4 flex-shrink-0 mt-0.5" />
                    <span>
                      <strong>Skicka fakturor snabbt</strong> - Ju snabbare du
                      skickar, desto snabbare får du betalt
                    </span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="h-4 w-4 flex-shrink-0 mt-0.5" />
                    <span>
                      <strong>Följ upp förfallna fakturor</strong> - Ring eller
                      maila kunden vänligt om betalning är sen
                    </span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="h-4 w-4 flex-shrink-0 mt-0.5" />
                    <span>
                      <strong>Exportera månadsvis</strong> - Gör en CSV-export
                      varje månad för bokföringen
                    </span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="h-4 w-4 flex-shrink-0 mt-0.5" />
                    <span>
                      <strong>Håll kunduppgifter uppdaterade</strong> -
                      Dubbelkolla att email och telefon är korrekta
                    </span>
                  </li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Snabblänkar */}
        <Card>
          <CardHeader className="bg-gray-100 rounded-t-lg">
            <CardTitle className="text-base font-semibold text-gray-900">
              🔗 Snabblänkar
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <Link
                href="/ekonomi"
                className="flex items-center gap-2 p-3 bg-white border border-gray-200 rounded-lg hover:border-[#2c7a4c] hover:bg-[#E6F4EA] transition-colors"
              >
                <DollarSign className="h-5 w-5 text-[#2c7a4c]" />
                <span className="text-sm font-medium text-gray-900">
                  Ekonomi & Fakturor
                </span>
              </Link>
              <Link
                href="/faktura"
                className="flex items-center gap-2 p-3 bg-white border border-gray-200 rounded-lg hover:border-[#2c7a4c] hover:bg-[#E6F4EA] transition-colors"
              >
                <FileText className="h-5 w-5 text-[#2c7a4c]" />
                <span className="text-sm font-medium text-gray-900">
                  Alla Fakturor (Bokföringsunderlag)
                </span>
              </Link>
              <Link
                href="/admin/priser"
                className="flex items-center gap-2 p-3 bg-white border border-gray-200 rounded-lg hover:border-[#2c7a4c] hover:bg-[#E6F4EA] transition-colors"
              >
                <Calendar className="h-5 w-5 text-[#2c7a4c]" />
                <span className="text-sm font-medium text-gray-900">
                  Hantera Priser
                </span>
              </Link>
              <Link
                href="/agare"
                className="flex items-center gap-2 p-3 bg-white border border-gray-200 rounded-lg hover:border-[#2c7a4c] hover:bg-[#E6F4EA] transition-colors"
              >
                <Mail className="h-5 w-5 text-[#2c7a4c]" />
                <span className="text-sm font-medium text-gray-900">
                  Kundregister
                </span>
              </Link>
            </div>
          </CardContent>
        </Card>

        {/* Support */}
        <div className="mt-8 text-center text-sm text-gray-500">
          <p className="mb-2">Behöver du mer hjälp?</p>
          <p>
            Kontakta support på{" "}
            <a
              href="mailto:support@dogplanner.se"
              className="text-[#2c7a4c] hover:underline"
            >
              support@dogplanner.se
            </a>
          </p>
        </div>
      </main>
    </div>
  );
}
