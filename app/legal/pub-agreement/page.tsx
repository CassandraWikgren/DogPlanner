"use client";

import Link from "next/link";

export default function PUBAgreementPage() {
  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <div className="border-b border-gray-200">
        <div className="max-w-3xl mx-auto px-6 py-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-3">
            Personuppgiftsbiträdesavtal (PUB)
          </h1>
          <p className="text-gray-600 text-lg mb-2">Enligt GDPR Artikel 28</p>
          <p className="text-sm text-gray-500">
            Senast uppdaterad: 30 november 2025 • Version 2.0
          </p>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-3xl mx-auto px-6 py-12">
        <div className="prose prose-gray max-w-none">
          {/* Inledning */}
          <section className="mb-12">
            <p className="text-gray-700 leading-relaxed mb-4">
              Detta Personuppgiftsbiträdesavtal (PUB) är juridiskt obligatoriskt
              enligt GDPR Artikel 28. Det reglerar hur DogPlanner behandlar
              personuppgifter som personuppgiftsbiträde på uppdrag av er som
              personuppgiftsansvarig.
            </p>
            <p className="text-gray-700 leading-relaxed">
              Genom att använda DogPlanner godkänner ni detta avtal och
              bekräftar att ni är personuppgiftsansvarig för de personuppgifter
              som hanteras via plattformen.
            </p>
          </section>

          {/* Roller */}
          <section className="mb-12 pb-8 border-b border-gray-200">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">
              Roller och ansvar
            </h2>

            <div className="mb-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-3">
                Personuppgiftsansvarig (Ni/Kunden)
              </h3>
              <p className="text-gray-700 leading-relaxed mb-3">
                Er anläggning bestämmer varför och hur hundägardata behandlas.
                Ni ansvarar för:
              </p>
              <ul className="space-y-2 text-gray-700">
                <li>• Att samla in hundägares samtycke</li>
                <li>• Att bestämma vilka data som behövs</li>
                <li>• Att svara på hundägares dataskyddsförfrågningar</li>
                <li>• Att informera hundägare om databehandling</li>
              </ul>
            </div>

            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-3">
                Personuppgiftsbiträde (DogPlanner)
              </h3>
              <p className="text-gray-700 leading-relaxed mb-3">
                Vi behandlar data endast på era instruktioner genom plattformen.
                Vi ansvarar för:
              </p>
              <ul className="space-y-2 text-gray-700">
                <li>• Att lagra data säkert inom EU</li>
                <li>• Att tillhandahålla teknisk plattform</li>
                <li>• Att bistå vid dataskyddsrättigheter</li>
                <li>• Att rapportera säkerhetsincidenter inom 24 timmar</li>
              </ul>
            </div>
          </section>

          {/* 1. Parter */}
          <section className="mb-12 pb-8 border-b border-gray-200">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">1. Parter</h2>

            <p className="text-gray-700 leading-relaxed mb-4">
              <strong>Personuppgiftsansvarig:</strong> Det företag eller den
              organisation som tecknat abonnemang på DogPlanner och som använder
              plattformen för att behandla personuppgifter om hundägare och
              deras hundar.
            </p>

            <p className="text-gray-700 leading-relaxed">
              <strong>Personuppgiftsbiträde:</strong> DogPlanner AB (org.nr
              [DITT ORG-NR]) som tillhandahåller SaaS-plattformen och behandlar
              personuppgifter på uppdrag av Kunden.
            </p>
          </section>

          {/* 2. Behandlingens omfattning */}
          <section className="mb-12 pb-8 border-b border-gray-200">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">
              2. Behandlingens omfattning
            </h2>

            <h3 className="text-lg font-semibold text-gray-900 mb-3">
              Behandlingens syfte
            </h3>
            <p className="text-gray-700 leading-relaxed mb-3">
              DogPlanner behandlar personuppgifter för att tillhandahålla
              följande tjänster:
            </p>
            <ul className="space-y-2 text-gray-700 mb-6">
              <li>
                • Bokningshantering för hunddagis, hundpensionat och hundfrisör
              </li>
              <li>• Hundregister med hälso- och beteendeinformation</li>
              <li>• Ägarprofiler och kontaktinformation</li>
              <li>• Fakturering och betalningshantering</li>
              <li>• Kommunikation mellan anläggning och hundägare</li>
              <li>
                • Dokumentlagring (vaccinationsintyg, försäkringshandlingar,
                foton)
              </li>
            </ul>

            <h3 className="text-lg font-semibold text-gray-900 mb-3">
              Behandlingens art
            </h3>
            <p className="text-gray-700 leading-relaxed mb-3">
              Personuppgifter lagras, visas, redigeras och raderas enligt
              kundens instruktioner via plattformen.
            </p>

            <h3 className="text-lg font-semibold text-gray-900 mb-3">
              Kategorier av personuppgifter
            </h3>
            <ul className="space-y-2 text-gray-700">
              <li>
                • <strong>Identitetsuppgifter:</strong> Namn, personnummer,
                adress, telefon, e-post
              </li>
              <li>
                • <strong>Hunduppgifter:</strong> Ras, ålder, ID-nummer,
                vaccinationsstatus
              </li>
              <li>
                • <strong>Hälsouppgifter:</strong> Allergier, mediciner,
                veterinärinfo, beteendeinformation
              </li>
              <li>
                • <strong>Betalningsuppgifter:</strong> Fakturerings- och
                betalningshistorik
              </li>
              <li>
                • <strong>Kommunikation:</strong> Meddelanden, e-post,
                anteckningar
              </li>
            </ul>
          </section>

          {/* 3. Säkerhetsåtgärder */}
          <section className="mb-12 pb-8 border-b border-gray-200">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">
              3. Tekniska och organisatoriska säkerhetsåtgärder
            </h2>

            <h3 className="text-lg font-semibold text-gray-900 mb-3">
              Datalagring
            </h3>
            <ul className="space-y-2 text-gray-700 mb-6">
              <li>• All data lagras krypterat inom EU (Supabase Frankfurt)</li>
              <li>• Dagliga automatiska säkerhetskopior</li>
              <li>• 30 dagars historik för återställning</li>
            </ul>

            <h3 className="text-lg font-semibold text-gray-900 mb-3">
              Åtkomstkontroll
            </h3>
            <ul className="space-y-2 text-gray-700 mb-6">
              <li>• Multifaktorautentisering (MFA) tillgänglig</li>
              <li>• Rollbaserad åtkomst (RBAC)</li>
              <li>• Automatisk utloggning efter inaktivitet</li>
            </ul>

            <h3 className="text-lg font-semibold text-gray-900 mb-3">
              Nätverkssäkerhet
            </h3>
            <ul className="space-y-2 text-gray-700 mb-6">
              <li>• TLS 1.3-kryptering för all datatrafik</li>
              <li>• HTTPS obligatoriskt</li>
              <li>• Brandväggar och intrångsskydd</li>
            </ul>

            <h3 className="text-lg font-semibold text-gray-900 mb-3">
              Incidenthantering
            </h3>
            <ul className="space-y-2 text-gray-700">
              <li>• 24/7 övervakning av säkerhetshändelser</li>
              <li>• Rapportering till kund inom 24 timmar vid incident</li>
              <li>• Dokumenterad incidentprocess</li>
            </ul>
          </section>

          {/* 4. Underbiträden */}
          <section className="mb-12 pb-8 border-b border-gray-200">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">
              4. Underbiträden
            </h2>

            <p className="text-gray-700 leading-relaxed mb-4">
              DogPlanner använder följande godkända underbiträden för att
              tillhandahålla tjänsten:
            </p>

            <div className="mb-4">
              <p className="font-semibold text-gray-900">
                Supabase (BaaS-plattform)
              </p>
              <p className="text-sm text-gray-600">
                Databas och backend • Frankfurt, Tyskland (EU)
              </p>
            </div>

            <div className="mb-4">
              <p className="font-semibold text-gray-900">Vercel (Hosting)</p>
              <p className="text-sm text-gray-600">
                Applikationshosting • Frankfurt, Tyskland (EU)
              </p>
            </div>

            <div className="mb-4">
              <p className="font-semibold text-gray-900">
                Stripe (Betalningar)
              </p>
              <p className="text-sm text-gray-600">
                Betalningshantering • Irland (EU)
              </p>
            </div>

            <p className="text-gray-700 leading-relaxed mt-6">
              Alla underbiträden är GDPR-kompatibla och har tecknat egna
              personuppgiftsbiträdesavtal. DogPlanner ansvarar för att
              underbiträden följer samma säkerhetskrav som DogPlanner.
            </p>
          </section>

          {/* 5. Kundens rättigheter */}
          <section className="mb-12 pb-8 border-b border-gray-200">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">
              5. Bistånd vid registrerades rättigheter
            </h2>

            <p className="text-gray-700 leading-relaxed mb-4">
              DogPlanner bistår kunden när hundägare utövar sina
              dataskyddsrättigheter:
            </p>

            <ul className="space-y-2 text-gray-700">
              <li>
                • <strong>Rätt till tillgång:</strong> Export av all data i
                maskinläsbart format
              </li>
              <li>
                • <strong>Rätt till rättelse:</strong> Möjlighet att uppdatera
                uppgifter via plattformen
              </li>
              <li>
                • <strong>Rätt till radering:</strong> Anonymisering eller
                radering på begäran
              </li>
              <li>
                • <strong>Rätt till dataportabilitet:</strong> Export i
                JSON/CSV-format
              </li>
              <li>
                • <strong>Rätt att göra invändningar:</strong> Begränsning av
                behandling möjlig
              </li>
            </ul>
          </section>

          {/* 6. Personuppgiftsincident */}
          <section className="mb-12 pb-8 border-b border-gray-200">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">
              6. Personuppgiftsincident
            </h2>

            <p className="text-gray-700 leading-relaxed mb-4">
              Vid säkerhetsincident som påverkar personuppgifter åtar sig
              DogPlanner att:
            </p>

            <ul className="space-y-2 text-gray-700">
              <li>• Rapportera incidenten till kunden inom 24 timmar</li>
              <li>
                • Beskriva arten av incidenten och vilka uppgifter som påverkats
              </li>
              <li>• Rekommendera åtgärder för att minimera skada</li>
              <li>• Dokumentera incidenten enligt GDPR artikel 33</li>
              <li>• Bistå kunden vid anmälan till tillsynsmyndighet</li>
            </ul>
          </section>

          {/* 7. Radering och återlämnande */}
          <section className="mb-12 pb-8 border-b border-gray-200">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">
              7. Radering och återlämnande av data
            </h2>

            <p className="text-gray-700 leading-relaxed mb-4">
              Vid avtalets upphörande:
            </p>

            <ul className="space-y-2 text-gray-700">
              <li>• Kunden har 30 dagar på sig att exportera alla data</li>
              <li>• Efter 30 dagar raderas all kunddata permanent</li>
              <li>• Radering sker säkert och går inte att återställa</li>
              <li>• Säkerhetskopior raderas efter maximalt 30 dagar</li>
              <li>• Kunden får skriftlig bekräftelse på radering</li>
            </ul>
          </section>

          {/* 8. Revision och kontroll */}
          <section className="mb-12 pb-8 border-b border-gray-200">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">
              8. Revision och kontroll
            </h2>

            <p className="text-gray-700 leading-relaxed mb-4">
              Kunden har rätt att granska DogPlanners efterlevnad av detta avtal
              genom:
            </p>

            <ul className="space-y-2 text-gray-700">
              <li>• Begära dokumentation om säkerhetsåtgärder</li>
              <li>• Genomföra revisioner med 30 dagars varsel</li>
              <li>• Ta del av externa revisionsrapporter (SOC 2, ISO 27001)</li>
              <li>• Begära information om underbiträden</li>
            </ul>
          </section>

          {/* 9. Ansvar och skadestånd */}
          <section className="mb-12 pb-8 border-b border-gray-200">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">
              9. Ansvar och skadestånd
            </h2>

            <p className="text-gray-700 leading-relaxed mb-4">
              DogPlanner ansvarar för att behandla personuppgifter enligt GDPR
              och detta avtal. Vårt skadeståndsansvar är begränsat till högst 6
              månaders abonnemangsavgift.
            </p>

            <p className="text-gray-700 leading-relaxed">
              Vi ansvarar inte för:
            </p>

            <ul className="space-y-2 text-gray-700">
              <li>• Kundens felaktiga instruktioner</li>
              <li>• Säkerhetsincidenter orsakade av kundens användare</li>
              <li>• Force majeure (naturkatastrofer, krig, etc.)</li>
              <li>• Tredje parts handlingar utanför vår kontroll</li>
            </ul>
          </section>

          {/* 10. Avtalets giltighetstid */}
          <section className="mb-12 pb-8 border-b border-gray-200">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">
              10. Avtalets giltighetstid och uppsägning
            </h2>

            <p className="text-gray-700 leading-relaxed mb-4">
              Detta PUB-avtal gäller under hela den tid som
              DogPlanner-abonnemanget är aktivt. Avtalet upphör automatiskt när:
            </p>

            <ul className="space-y-2 text-gray-700">
              <li>• Kunden säger upp sitt abonnemang</li>
              <li>• Abonnemanget avslutas på grund av utebliven betalning</li>
              <li>• DogPlanner avslutar tjänsten (med 60 dagars varsel)</li>
            </ul>
          </section>

          {/* 11. Kontaktinformation */}
          <section className="mb-12">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">
              11. Kontaktinformation
            </h2>

            <p className="text-gray-700 leading-relaxed mb-4">
              För frågor om detta avtal eller DogPlanners behandling av
              personuppgifter:
            </p>

            <div className="space-y-2 text-gray-700">
              <p>
                <strong>DogPlanner AB</strong>
              </p>
              <p>Dataskyddsombud (DPO): dpo@dogplanner.se</p>
              <p>Support: support@dogplanner.se</p>
              <p>Telefon: [DITT TELEFONNUMMER]</p>
            </div>
          </section>

          {/* Footer */}
          <div className="mt-12 pt-8 border-t border-gray-200">
            <p className="text-sm text-gray-500 mb-4">
              Detta dokument uppdaterades senast 30 november 2025. Vid ändringar
              kommer kunder att informeras via e-post minst 30 dagar innan
              ändringarna träder i kraft.
            </p>
            <p className="text-sm text-gray-500">
              Läs även:{" "}
              <Link
                href="/legal/terms-business"
                className="text-gray-900 underline"
              >
                Allmänna villkor för företag
              </Link>{" "}
              •{" "}
              <Link
                href="/legal/privacy-policy-business"
                className="text-gray-900 underline"
              >
                Integritetspolicy
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
