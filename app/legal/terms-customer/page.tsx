"use client";

import { useState } from "react";
import Link from "next/link";
import {
  FileText,
  AlertCircle,
  CheckCircle,
  XCircle,
  Shield,
} from "lucide-react";

export default function AnvandarvillkorKundPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex items-center space-x-3 mb-4">
            <FileText className="w-8 h-8 text-primary" />
            <h1 className="text-3xl font-bold text-gray-900">
              Användarvillkor för Hundägare
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
                Genom att använda DogPlanner accepterar du dessa
                användarvillkor. Läs noga igenom dem innan du skapar ett konto
                eller bokar en tjänst. Om du inte accepterar villkoren, vänligen
                använd inte tjänsten.
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
            <div className="space-y-2 text-gray-700">
              <p>
                <strong>"DogPlanner", "vi", "oss":</strong> DogPlanner AB,
                organisationsnummer [DITT ORG-NR]
              </p>
              <p>
                <strong>"Plattformen":</strong> DogPlanners webbplats och
                tjänster tillgängliga via dogplanner.se
              </p>
              <p>
                <strong>"Användare", "du":</strong> Person som registrerar sig
                och använder Plattformen
              </p>
              <p>
                <strong>"Anläggning":</strong> Hunddagis eller hundpensionat
                registrerat på Plattformen
              </p>
              <p>
                <strong>"Bokning":</strong> Reservation av plats för hund hos en
                Anläggning via Plattformen
              </p>
              <p>
                <strong>"Tjänst":</strong> Hunddagis, hundpensionat eller
                relaterad tjänst som erbjuds via Plattformen
              </p>
            </div>
          </section>

          {/* 2. Om DogPlanner */}
          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              2. Om DogPlanner
            </h2>
            <div className="prose prose-gray max-w-none">
              <p className="text-gray-700">
                DogPlanner är en bokningsplattform som{" "}
                <strong>förmedlar kontakt</strong> mellan hundägare och
                hunddagis/hundpensionat. Vi är <strong>inte</strong> en
                anläggning och utför <strong>inte</strong> själva tjänsterna
                (dagis, pensionat, etc).
              </p>

              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mt-4">
                <h3 className="font-semibold text-yellow-900 mb-2">
                  ⚠️ Viktigt att förstå:
                </h3>
                <ul className="list-disc list-inside space-y-1 text-sm text-yellow-800">
                  <li>
                    Avtalet om tjänsten (dagis/pensionat) ingås{" "}
                    <strong>mellan dig och Anläggningen</strong>
                  </li>
                  <li>
                    Anläggningen ansvarar för kvalitet, säkerhet och omsorg av
                    din hund
                  </li>
                  <li>
                    DogPlanner ansvarar endast för att Plattformen fungerar
                    tekniskt
                  </li>
                  <li>
                    Vi tar <strong>inte</strong> ansvar för händelser relaterade
                    till din hunds vistelse
                  </li>
                </ul>
              </div>
            </div>
          </section>

          {/* 3. Konto och registrering */}
          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              3. Konto och registrering
            </h2>

            <h3 className="text-lg font-semibold mb-3">3.1 Skapa konto</h3>
            <p className="text-gray-700 mb-4">
              För att använda Plattformen måste du skapa ett konto. Du måste
              vara minst 18 år och ha rätt att ingå bindande avtal.
            </p>

            <h3 className="text-lg font-semibold mb-3">
              3.2 Din ansvar för kontot
            </h3>
            <div className="bg-gray-50 rounded-lg p-4 space-y-2 text-sm text-gray-700">
              <div className="flex items-start space-x-2">
                <CheckCircle className="w-5 h-5 text-green-600 mt-0.5" />
                <p>Ge sanningsenliga och korrekta uppgifter vid registrering</p>
              </div>
              <div className="flex items-start space-x-2">
                <CheckCircle className="w-5 h-5 text-green-600 mt-0.5" />
                <p>Håll dina inloggningsuppgifter hemliga och säkra</p>
              </div>
              <div className="flex items-start space-x-2">
                <CheckCircle className="w-5 h-5 text-green-600 mt-0.5" />
                <p>
                  Meddela oss omedelbart om någon får obehörig åtkomst till ditt
                  konto
                </p>
              </div>
              <div className="flex items-start space-x-2">
                <CheckCircle className="w-5 h-5 text-green-600 mt-0.5" />
                <p>
                  Uppdatera din information om den ändras (t.ex. ny telefon,
                  adress)
                </p>
              </div>
            </div>

            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mt-4">
              <h4 className="font-semibold text-red-900 mb-2">❌ Förbjudet:</h4>
              <ul className="list-disc list-inside space-y-1 text-sm text-red-800">
                <li>Dela ditt konto med andra personer</li>
                <li>Skapa flera konton för samma person/hund</li>
                <li>Använda falska eller vilseledande uppgifter</li>
                <li>Låta någon under 18 år använda ditt konto</li>
              </ul>
            </div>
          </section>

          {/* 4. Bokningar */}
          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              4. Bokningar och betalning
            </h2>

            <h3 className="text-lg font-semibold mb-3">
              4.1 Hur bokningar fungerar
            </h3>
            <div className="space-y-3 text-gray-700">
              <div className="flex items-start space-x-3">
                <div className="bg-primary text-white rounded-full w-8 h-8 flex items-center justify-center flex-shrink-0 font-semibold">
                  1
                </div>
                <div>
                  <p className="font-semibold">Du gör en bokningsförfrågan</p>
                  <p className="text-sm">
                    Välj datum, hund och Anläggning. Din förfrågan skickas till
                    Anläggningen.
                  </p>
                </div>
              </div>
              <div className="flex items-start space-x-3">
                <div className="bg-primary text-white rounded-full w-8 h-8 flex items-center justify-center flex-shrink-0 font-semibold">
                  2
                </div>
                <div>
                  <p className="font-semibold">
                    Anläggningen godkänner eller avböjer
                  </p>
                  <p className="text-sm">
                    Anläggningen har rätt att neka din bokning utan att ange
                    skäl.
                  </p>
                </div>
              </div>
              <div className="flex items-start space-x-3">
                <div className="bg-primary text-white rounded-full w-8 h-8 flex items-center justify-center flex-shrink-0 font-semibold">
                  3
                </div>
                <div>
                  <p className="font-semibold">
                    Vid godkännande blir bokningen bindande
                  </p>
                  <p className="text-sm">
                    Du får en bekräftelse via e-post och ska betala enligt
                    Anläggningens villkor.
                  </p>
                </div>
              </div>
            </div>

            <h3 className="text-lg font-semibold mb-3 mt-6">
              4.2 Priser och betalning
            </h3>
            <div className="bg-gray-50 rounded-lg p-4 space-y-2 text-sm text-gray-700">
              <p>• Priser sätts av varje Anläggning och kan variera</p>
              <p>• Alla priser anges i svenska kronor (SEK) inklusive moms</p>
              <p>• Du ser totalpris innan du bekräftar bokning</p>
              <p>
                • Betalning sker enligt Anläggningens betalningsvillkor
                (förskott, efterskott eller delbetalning)
              </p>
              <p>• DogPlanner hanterar betalningar säkert via Stripe/Klarna</p>
            </div>

            <h3 className="text-lg font-semibold mb-3 mt-6">
              4.3 Avbokning och återbetalning
            </h3>
            <div className="border-l-4 border-yellow-500 bg-yellow-50 p-4">
              <p className="font-semibold text-yellow-900 mb-2">
                Avbokningsregler varierar per Anläggning
              </p>
              <p className="text-sm text-yellow-800">
                Varje Anläggning har sin egen avbokningspolicy (t.ex. "Gratis
                avbokning 7 dagar innan, 50% avgift 3-7 dagar, ingen
                återbetalning mindre än 3 dagar"). Du ser alltid
                avbokningsreglerna
                <strong> innan</strong> du bekräftar bokningen.
              </p>
            </div>

            <div className="mt-4 space-y-2 text-sm text-gray-700">
              <p>
                <strong>Generellt gäller:</strong>
              </p>
              <ul className="list-disc list-inside space-y-1 ml-4">
                <li>Du kan avboka via "Mina bokningar" på Plattformen</li>
                <li>
                  Avbokningsavgift beräknas automatiskt baserat på Anläggningens
                  policy
                </li>
                <li>Återbetalning sker inom 5-10 arbetsdagar</li>
                <li>
                  Vid sjukdom kan särskilda regler gälla (kontakta Anläggningen
                  direkt)
                </li>
              </ul>
            </div>

            <h3 className="text-lg font-semibold mb-3 mt-6">
              4.4 Ändring av bokning
            </h3>
            <p className="text-sm text-gray-700">
              Om du vill ändra en bekräftad bokning (t.ex. byta datum), kontakta
              Anläggningen direkt. De avgör om ändring är möjlig. Vid ändring
              kan extra avgifter tillkomma.
            </p>
          </section>

          {/* 5. Din ansvar som hundägare */}
          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              5. Ditt ansvar som hundägare
            </h2>

            <div className="space-y-4">
              <h3 className="text-lg font-semibold">
                5.1 Korrekt information om din hund
              </h3>
              <p className="text-gray-700">
                Du är skyldig att ge{" "}
                <strong>sanningsenlig och fullständig information</strong> om
                din hund, inklusive:
              </p>
              <ul className="list-disc list-inside space-y-1 text-sm text-gray-700 ml-4">
                <li>Medicinska tillstånd, allergier, mediciner</li>
                <li>Beteendeproblem (aggression, separation anxiety, etc.)</li>
                <li>Vaccinationsstatus</li>
                <li>Specialbehov</li>
              </ul>

              <div className="bg-red-50 border border-red-200 rounded-lg p-4 mt-3">
                <p className="text-sm text-red-800">
                  <strong>⚠️ Viktigt:</strong> Om du döljer viktig information
                  som leder till skada eller problem kan du hållas ekonomiskt
                  ansvarig. Anläggningen har rätt att neka fortsatt vård och
                  avbryta bokningen utan återbetalning.
                </p>
              </div>

              <h3 className="text-lg font-semibold mt-6">
                5.2 Vaccinationer och hälsa
              </h3>
              <p className="text-gray-700 text-sm">
                Din hund måste vara fullt vaccinerad enligt svenska regler
                (DHP/parvo, parainfluenza). Vissa Anläggningar kan kräva
                ytterligare vaccinationer (t.ex. kennelhosta). Du måste kunna
                visa vaccinationsbevis vid incheckning.
              </p>

              <h3 className="text-lg font-semibold mt-6">5.3 Försäkring</h3>
              <p className="text-gray-700 text-sm">
                Du rekommenderas starkt att ha en giltig hundförsäkring med
                ansvarsförsäkring. DogPlanner och Anläggningen ansvarar inte för
                skador din hund orsakar på andra hundar, personer eller egendom.
              </p>

              <h3 className="text-lg font-semibold mt-6">
                5.4 Hämtning och lämning
              </h3>
              <ul className="list-disc list-inside space-y-1 text-sm text-gray-700 ml-4">
                <li>
                  Respektera Anläggningens öppettider och hämta/lämna i tid
                </li>
                <li>Vid sen hämtning kan extra avgifter tillkomma</li>
                <li>
                  Om du inte kan hämta din hund kontakta Anläggningen omedelbart
                </li>
                <li>
                  Endast personer du angivit som kontakt får hämta din hund
                </li>
              </ul>
            </div>
          </section>

          {/* 6. Anläggningens ansvar */}
          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              6. Anläggningens ansvar och skyldigheter
            </h2>

            <div className="space-y-3 text-gray-700">
              <p>Anläggningen (inte DogPlanner) är ansvarig för:</p>
              <ul className="list-disc list-inside space-y-1 text-sm ml-4">
                <li>Säker och lämplig miljö för hundar</li>
                <li>Utbildad personal</li>
                <li>Tillsyn och omsorg av din hund</li>
                <li>Omedelbar kontakt vid olycka eller sjukdom</li>
                <li>
                  Följa lagar och förordningar för hunddagis/hundpensionat
                </li>
              </ul>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mt-4">
                <p className="text-sm text-blue-800">
                  <strong>ℹ️ Vid problem eller klagomål:</strong> Kontakta
                  Anläggningen direkt först. Om problemet inte löses kan du
                  kontakta oss på support@dogplanner.se så hjälper vi till att
                  medla.
                </p>
              </div>
            </div>
          </section>

          {/* 7. DogPlanners ansvar och begränsningar */}
          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              7. DogPlanners ansvar och begränsningar
            </h2>

            <h3 className="text-lg font-semibold mb-3">
              7.1 Vad vi ansvarar för
            </h3>
            <div className="space-y-2 text-sm text-gray-700">
              <div className="flex items-start space-x-2">
                <CheckCircle className="w-5 h-5 text-green-600 mt-0.5" />
                <p>Att Plattformen fungerar tekniskt och är tillgänglig</p>
              </div>
              <div className="flex items-start space-x-2">
                <CheckCircle className="w-5 h-5 text-green-600 mt-0.5" />
                <p>Säker hantering av betalningar</p>
              </div>
              <div className="flex items-start space-x-2">
                <CheckCircle className="w-5 h-5 text-green-600 mt-0.5" />
                <p>Skydd av dina personuppgifter enligt GDPR</p>
              </div>
              <div className="flex items-start space-x-2">
                <CheckCircle className="w-5 h-5 text-green-600 mt-0.5" />
                <p>Tillhandahålla kundsupport för Plattformen</p>
              </div>
            </div>

            <h3 className="text-lg font-semibold mb-3 mt-6">
              7.2 Vad vi INTE ansvarar för
            </h3>
            <div className="space-y-2 text-sm text-gray-700">
              <div className="flex items-start space-x-2">
                <XCircle className="w-5 h-5 text-red-600 mt-0.5" />
                <p>
                  Kvalitet, säkerhet eller standard på Anläggningens tjänster
                </p>
              </div>
              <div className="flex items-start space-x-2">
                <XCircle className="w-5 h-5 text-red-600 mt-0.5" />
                <p>
                  Skador, sjukdom eller olyckor som händer din hund hos
                  Anläggningen
                </p>
              </div>
              <div className="flex items-start space-x-2">
                <XCircle className="w-5 h-5 text-red-600 mt-0.5" />
                <p>Tvister mellan dig och Anläggningen</p>
              </div>
              <div className="flex items-start space-x-2">
                <XCircle className="w-5 h-5 text-red-600 mt-0.5" />
                <p>
                  Indirekta skador (t.ex. förlorad arbetstid, resekostnader)
                </p>
              </div>
              <div className="flex items-start space-x-2">
                <XCircle className="w-5 h-5 text-red-600 mt-0.5" />
                <p>
                  Tekniska problem orsakade av din internetanslutning eller
                  enhet
                </p>
              </div>
            </div>

            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 mt-4">
              <p className="text-sm text-gray-700">
                <strong>Ansvarsbegränsning:</strong> DogPlanners totala ansvar
                är begränsat till det belopp du betalat för den aktuella
                bokningen, max 5 000 SEK per incident.
              </p>
            </div>
          </section>

          {/* 8. Immateriella rättigheter */}
          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              8. Immateriella rättigheter
            </h2>
            <p className="text-gray-700 text-sm">
              Allt innehåll på Plattformen (logotyper, design, text, bilder,
              kod) ägs av DogPlanner eller våra licensgivare och skyddas av
              upphovsrätt och varumärkesrätt.
            </p>
            <div className="bg-gray-50 rounded-lg p-4 mt-4">
              <h3 className="font-semibold mb-2">Du får INTE:</h3>
              <ul className="list-disc list-inside space-y-1 text-sm text-gray-700">
                <li>
                  Kopiera, reproducera eller distribuera innehåll från
                  Plattformen
                </li>
                <li>Använda våra varumärken eller logotyper utan tillstånd</li>
                <li>
                  Skapa derivat eller konkurrerande tjänster baserade på
                  Plattformen
                </li>
                <li>Försöka reverse-engineera eller dekompilera vår kod</li>
              </ul>
            </div>
          </section>

          {/* 9. Förbjuden användning */}
          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              9. Förbjuden användning
            </h2>
            <div className="bg-red-50 border-2 border-red-200 rounded-lg p-6">
              <h3 className="font-semibold text-red-900 mb-3">
                ❌ Du får INTE använda Plattformen för att:
              </h3>
              <ul className="space-y-2 text-sm text-red-800">
                <li>• Bryta mot svensk eller internationell lag</li>
                <li>
                  • Trakassera, hota eller förolämpa andra användare eller
                  Anläggningar
                </li>
                <li>
                  • Lägga upp falskt, vilseledande eller bedrägligt innehåll
                </li>
                <li>• Sprida skadlig kod, virus eller malware</li>
                <li>
                  • Försöka få obehörig åtkomst till andras konton eller system
                </li>
                <li>
                  • Använda automatiserade system (bots) för att skrapa eller
                  samla data
                </li>
                <li>• Skicka spam eller oönskad reklam</li>
                <li>
                  • Utge dig för att vara någon annan person eller företag
                </li>
              </ul>
              <p className="text-sm text-red-800 mt-4 font-semibold">
                Vid brott mot dessa regler kan vi stänga av ditt konto
                omedelbart och vidta juridiska åtgärder.
              </p>
            </div>
          </section>

          {/* 10. Uppsägning och avstängning */}
          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              10. Uppsägning och avstängning av konto
            </h2>

            <h3 className="text-lg font-semibold mb-3">
              10.1 Du kan avsluta ditt konto
            </h3>
            <p className="text-gray-700 text-sm mb-4">
              Du kan när som helst avsluta ditt konto genom att gå till
              "Inställningar" → "Radera konto". Efter radering:
            </p>
            <ul className="list-disc list-inside space-y-1 text-sm text-gray-700 ml-4">
              <li>Förlorar du åtkomst till alla aktiva bokningar</li>
              <li>
                Personuppgifter raderas/anonymiseras enligt vår
                integritetspolicy
              </li>
              <li>Bokföringsdata sparas i 7 år enligt lag</li>
              <li>Du kan inte återställa kontot efter radering</li>
            </ul>

            <h3 className="text-lg font-semibold mb-3 mt-6">
              10.2 Vi kan stänga av ditt konto
            </h3>
            <p className="text-gray-700 text-sm mb-2">
              Vi har rätt att tillfälligt eller permanent stänga av ditt konto
              om:
            </p>
            <ul className="list-disc list-inside space-y-1 text-sm text-gray-700 ml-4">
              <li>Du bryter mot dessa användarvillkor</li>
              <li>Du ger falsk information</li>
              <li>Du missbrukar tjänsten eller beter dig olämpligt</li>
              <li>Din aktivitet utgör en säkerhetsrisk</li>
              <li>Vi är skyldiga enligt lag</li>
            </ul>
            <p className="text-sm text-gray-600 mt-3">
              Vid avstängning får du information via e-post. Du har rätt att
              överklaga beslutet.
            </p>
          </section>

          {/* 11. Force majeure */}
          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              11. Force majeure (Oförutsedda händelser)
            </h2>
            <p className="text-gray-700 text-sm">
              Varken DogPlanner eller Anläggningen är ansvariga för förseningar
              eller fel som beror på omständigheter utanför vår kontroll, såsom:
            </p>
            <ul className="list-disc list-inside space-y-1 text-sm text-gray-700 ml-4 mt-2">
              <li>Naturkatastrofer, extremt väder</li>
              <li>Krig, terrorism, pandemi</li>
              <li>Strömavbrott, internetavbrott</li>
              <li>Arbetskonflikt, strejk</li>
              <li>Myndighetsbeslut, nya lagar</li>
            </ul>
          </section>

          {/* 12. Ändringar i villkoren */}
          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              12. Ändringar i användarvillkoren
            </h2>
            <p className="text-gray-700 text-sm">
              Vi kan komma att uppdatera dessa villkor. Vid väsentliga ändringar
              meddelar vi dig via e-post minst 30 dagar innan ändringen träder i
              kraft. Om du fortsätter använda tjänsten efter att ändringarna
              trätt i kraft accepterar du de nya villkoren.
            </p>
            <p className="text-sm text-gray-600 mt-2">
              <strong>Senaste uppdatering:</strong> 17 november 2025
            </p>
          </section>

          {/* 13. Tvistelösning */}
          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              13. Tvistelösning och tillämplig lag
            </h2>

            <h3 className="text-lg font-semibold mb-3">
              13.1 Kontakta oss först
            </h3>
            <p className="text-gray-700 text-sm mb-4">
              Vid klagomål eller tvister, kontakta alltid vår kundsupport först:
            </p>
            <div className="bg-gray-50 rounded-lg p-4">
              <p className="text-sm text-gray-700">
                E-post:{" "}
                <a
                  href="mailto:support@dogplanner.se"
                  className="text-primary hover:underline"
                >
                  support@dogplanner.se
                </a>
                <br />
                Telefon: [DITT TELEFONNUMMER]
              </p>
            </div>

            <h3 className="text-lg font-semibold mb-3 mt-6">
              13.2 Allmänna reklamationsnämnden (ARN)
            </h3>
            <p className="text-gray-700 text-sm mb-4">
              Om vi inte kan lösa tvisten kan du vända dig till Allmänna
              reklamationsnämnden (ARN):
            </p>
            <div className="bg-gray-50 rounded-lg p-4">
              <p className="text-sm text-gray-700">
                Box 174
                <br />
                101 23 Stockholm
                <br />
                Webb:{" "}
                <a
                  href="https://www.arn.se"
                  target="_blank"
                  rel="noopener"
                  className="text-primary hover:underline"
                >
                  www.arn.se
                </a>
              </p>
            </div>

            <h3 className="text-lg font-semibold mb-3 mt-6">
              13.3 Tillämplig lag och tingsrätt
            </h3>
            <p className="text-gray-700 text-sm">
              Dessa villkor regleras av svensk rätt. Eventuella tvister ska
              avgöras av svensk domstol, med [DIN HEMORTS TINGSRÄTT] som första
              instans.
            </p>
          </section>

          {/* 14. Kontaktinformation */}
          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              14. Kontaktinformation
            </h2>
            <div className="bg-primary/5 border border-primary/20 rounded-lg p-6">
              <p className="text-gray-700 mb-4">
                Har du frågor om dessa användarvillkor? Kontakta oss gärna!
              </p>

              <div className="space-y-2 text-sm">
                <p>
                  <strong>DogPlanner AB</strong>
                  <br />
                  Organisationsnummer: [DITT ORG-NR]
                </p>
                <p>
                  <strong>E-post:</strong>{" "}
                  <a
                    href="mailto:support@dogplanner.se"
                    className="text-primary hover:underline"
                  >
                    support@dogplanner.se
                  </a>
                </p>
                <p>
                  <strong>Telefon:</strong> [DITT TELEFONNUMMER]
                </p>
                <p>
                  <strong>Postadress:</strong>
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
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Link
              href="/legal/privacy-policy-customer"
              className="flex items-center space-x-2 text-primary hover:text-primary-dark"
            >
              <Shield className="w-5 h-5" />
              <span>Integritetspolicy</span>
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
