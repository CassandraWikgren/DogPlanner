"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  ChevronDown,
  ChevronRight,
  Home,
  Calendar,
  Users,
  DollarSign,
  Settings,
  FileText,
  HelpCircle,
  Dog,
  Building,
  Clock,
  CheckCircle,
  ArrowRight,
} from "lucide-react";

type Section = {
  id: string;
  title: string;
  icon: React.ReactNode;
  content: React.ReactNode;
};

export default function OmDogPlannerPage() {
  const [openSections, setOpenSections] = useState<string[]>(["intro"]);

  const toggleSection = (id: string) => {
    setOpenSections((prev) =>
      prev.includes(id) ? prev.filter((s) => s !== id) : [...prev, id]
    );
  };

  const sections: Section[] = [
    {
      id: "intro",
      title: "Välkommen till DogPlanner",
      icon: <Home className="w-5 h-5" />,
      content: (
        <div className="space-y-4">
          <p className="text-gray-700 leading-relaxed">
            DogPlanner är ett komplett verksamhetssystem för dig som driver
            hunddagis, hundpensionat eller hundfrisör. Systemet hjälper dig att
            hantera bokningar, kunder, fakturering och mycket mer – allt på ett
            ställe.
          </p>
          <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-4">
            <h4 className="font-semibold text-emerald-800 mb-2">
              Systemet består av tre huvuddelar:
            </h4>
            <ul className="space-y-2 text-emerald-700">
              <li className="flex items-start gap-2">
                <CheckCircle className="w-5 h-5 mt-0.5 flex-shrink-0" />
                <span>
                  <strong>Hunddagis</strong> – Hantera dagishundar, abonnemang
                  och daglig verksamhet
                </span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle className="w-5 h-5 mt-0.5 flex-shrink-0" />
                <span>
                  <strong>Hundpensionat</strong> – Bokningar, in-/utcheckning
                  och rumshantering
                </span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle className="w-5 h-5 mt-0.5 flex-shrink-0" />
                <span>
                  <strong>Hundfrisör</strong> – Tidsbokning och kundhantering
                  för grooming
                </span>
              </li>
            </ul>
          </div>
        </div>
      ),
    },
    {
      id: "hunddagis",
      title: "Hunddagis",
      icon: <Dog className="w-5 h-5" />,
      content: (
        <div className="space-y-4">
          <p className="text-gray-700 leading-relaxed">
            I hunddagismodulen hanterar du alla dagishundar, deras ägare och
            abonnemang.
          </p>

          <div className="grid md:grid-cols-2 gap-4">
            <div className="bg-white border border-gray-200 rounded-lg p-4">
              <h4 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
                <Users className="w-4 h-4 text-[#2c7a4c]" />
                Hundlistan
              </h4>
              <ul className="space-y-2 text-sm text-gray-600">
                <li>• Se alla hundar som går på dagiset</li>
                <li>• Filtrera på månad för att se vilka som var aktiva</li>
                <li>• Sök på hundnamn, ägare eller telefon</li>
                <li>• Klicka på en hund för att se eller redigera detaljer</li>
              </ul>
            </div>

            <div className="bg-white border border-gray-200 rounded-lg p-4">
              <h4 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
                <Calendar className="w-4 h-4 text-[#2c7a4c]" />
                Abonnemang
              </h4>
              <ul className="space-y-2 text-sm text-gray-600">
                <li>• Varje hund kopplas till ett abonnemang</li>
                <li>• Välj antal dagar per vecka (1-5)</li>
                <li>• Startdatum bestämmer när abonnemanget börjar</li>
                <li>• Slutdatum sätts när kunden säger upp</li>
              </ul>
            </div>
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h4 className="font-semibold text-blue-800 mb-2">
              Hur fungerar väntelistan?
            </h4>
            <p className="text-blue-700 text-sm mb-2">
              En hund hamnar på väntelistan om den:
            </p>
            <ul className="text-sm text-blue-700 space-y-1">
              <li>• Saknar abonnemang</li>
              <li>• Har ett abonnemang med passerat slutdatum</li>
            </ul>
            <p className="text-blue-700 text-sm mt-2">
              När du tilldelar ett abonnemang flyttas hunden automatiskt till
              &quot;Våra hundar&quot;.
            </p>
          </div>

          <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
            <h4 className="font-semibold text-amber-800 mb-2">Månadsfiltret</h4>
            <p className="text-amber-700 text-sm">
              Välj en månad i dropdown-menyn för att se alla hundar som hade
              aktivt abonnemang under den månaden. En hund räknas som aktiv från
              sitt startdatum tills ett slutdatum sätts. De flesta hundar har
              inget slutdatum eftersom de går på dagiset tillsvidare.
            </p>
          </div>
        </div>
      ),
    },
    {
      id: "pensionat",
      title: "Hundpensionat",
      icon: <Building className="w-5 h-5" />,
      content: (
        <div className="space-y-4">
          <p className="text-gray-700 leading-relaxed">
            Pensionatsmodulen hanterar bokningar för hundar som ska bo hos er
            under en period.
          </p>

          <div className="grid md:grid-cols-2 gap-4">
            <div className="bg-white border border-gray-200 rounded-lg p-4">
              <h4 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
                <Calendar className="w-4 h-4 text-[#2c7a4c]" />
                Bokningsflöde
              </h4>
              <ol className="space-y-2 text-sm text-gray-600 list-decimal list-inside">
                <li>Kunden bokar via kundportalen</li>
                <li>Ni godkänner eller avslår bokningen</li>
                <li>Vid godkännande skapas en förskottsfaktura</li>
                <li>Checka in hunden när den kommer</li>
                <li>Checka ut och slutfaktura skapas automatiskt</li>
              </ol>
            </div>

            <div className="bg-white border border-gray-200 rounded-lg p-4">
              <h4 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
                <Clock className="w-4 h-4 text-[#2c7a4c]" />
                Bokningsstatus
              </h4>
              <ul className="space-y-2 text-sm text-gray-600">
                <li>
                  <span className="inline-block w-3 h-3 rounded-full bg-yellow-400 mr-2"></span>
                  <strong>Väntar</strong> – Ny bokning som väntar på godkännande
                </li>
                <li>
                  <span className="inline-block w-3 h-3 rounded-full bg-green-400 mr-2"></span>
                  <strong>Bekräftad</strong> – Godkänd, väntar på incheckning
                </li>
                <li>
                  <span className="inline-block w-3 h-3 rounded-full bg-blue-400 mr-2"></span>
                  <strong>Incheckad</strong> – Hunden är på plats
                </li>
                <li>
                  <span className="inline-block w-3 h-3 rounded-full bg-gray-400 mr-2"></span>
                  <strong>Utcheckad</strong> – Avslutad vistelse
                </li>
              </ul>
            </div>
          </div>

          <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-4">
            <h4 className="font-semibold text-emerald-800 mb-2">Rum</h4>
            <p className="text-emerald-700 text-sm">
              Under <strong>Administration → Rum</strong> kan ni lägga till och
              hantera era rum. Varje rum har en storlek och kapacitet. När
              kunder bokar ser de automatiskt vilka rum som är lediga baserat på
              hundens storlek.
            </p>
          </div>
        </div>
      ),
    },
    {
      id: "kunder",
      title: "Kunder & Ägare",
      icon: <Users className="w-5 h-5" />,
      content: (
        <div className="space-y-4">
          <p className="text-gray-700 leading-relaxed">
            DogPlanner har två typer av kunder med olika registreringsflöden.
          </p>

          <div className="grid md:grid-cols-2 gap-4">
            <div className="bg-white border border-gray-200 rounded-lg p-4">
              <h4 className="font-semibold text-gray-800 mb-3">
                🐕 Dagiskunder
              </h4>
              <ol className="space-y-2 text-sm text-gray-600 list-decimal list-inside">
                <li>Skickar intresseanmälan via hemsidan</li>
                <li>Ni granskar ansökan under &quot;Ansökningar&quot;</li>
                <li>Vid godkännande skapas kund och hund automatiskt</li>
                <li>Kunden kopplas till er organisation</li>
              </ol>
              <p className="text-xs text-gray-500 mt-3">
                Kundnummer: 101, 102, 103... (per organisation)
              </p>
            </div>

            <div className="bg-white border border-gray-200 rounded-lg p-4">
              <h4 className="font-semibold text-gray-800 mb-3">
                🏨 Pensionatkunder
              </h4>
              <ol className="space-y-2 text-sm text-gray-600 list-decimal list-inside">
                <li>Registrerar sig själva i kundportalen</li>
                <li>Väljer &quot;Pensionat&quot; som tjänst</li>
                <li>Kan boka hos vilken organisation som helst</li>
                <li>Loggar in via kundportalen för att se sina bokningar</li>
              </ol>
              <p className="text-xs text-gray-500 mt-3">
                Kundnummer: 10001, 10002, 10003... (globalt)
              </p>
            </div>
          </div>

          <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
            <h4 className="font-semibold text-gray-800 mb-2">Kundportalen</h4>
            <p className="text-gray-600 text-sm">
              Pensionatkunder har tillgång till en egen kundportal där de kan se
              sina bokningar, hantera sin profil och sina hundar. De kan också
              avboka bokningar (avbokningsregler tillämpas automatiskt).
            </p>
          </div>
        </div>
      ),
    },
    {
      id: "ekonomi",
      title: "Ekonomi & Fakturering",
      icon: <DollarSign className="w-5 h-5" />,
      content: (
        <div className="space-y-4">
          <p className="text-gray-700 leading-relaxed">
            Fakturor skapas automatiskt för pensionatbokningar. För hunddagis
            kan ni skapa månadsfakturor.
          </p>

          <div className="grid md:grid-cols-2 gap-4">
            <div className="bg-white border border-gray-200 rounded-lg p-4">
              <h4 className="font-semibold text-gray-800 mb-3">
                Pensionatfakturor
              </h4>
              <ul className="space-y-2 text-sm text-gray-600">
                <li>
                  <strong>Förskottsfaktura</strong> – Skapas automatiskt när
                  bokning godkänns
                </li>
                <li>
                  <strong>Slutfaktura</strong> – Skapas vid utcheckning om det
                  finns extra kostnader
                </li>
                <li>Priset beräknas utifrån antal nätter × pris per natt</li>
              </ul>
            </div>

            <div className="bg-white border border-gray-200 rounded-lg p-4">
              <h4 className="font-semibold text-gray-800 mb-3">
                Dagisfakturor
              </h4>
              <ul className="space-y-2 text-sm text-gray-600">
                <li>Baseras på valt abonnemang</li>
                <li>Kan skapas månadsvis under Ekonomi</li>
                <li>Rabatter kan läggas in manuellt</li>
              </ul>
            </div>
          </div>

          <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
            <h4 className="font-semibold text-amber-800 mb-2">Fakturastatus</h4>
            <ul className="text-sm text-amber-700 space-y-1">
              <li>
                <strong>Utkast</strong> – Ej skickad, kan redigeras
              </li>
              <li>
                <strong>Skickad</strong> – Skickad till kund
              </li>
              <li>
                <strong>Betald</strong> – Markerad som betald
              </li>
              <li>
                <strong>Förfallen</strong> – Förfallodatum har passerat
              </li>
            </ul>
          </div>
        </div>
      ),
    },
    {
      id: "priser",
      title: "Prishantering",
      icon: <Settings className="w-5 h-5" />,
      content: (
        <div className="space-y-4">
          <p className="text-gray-700 leading-relaxed">
            Under <strong>Administration</strong> hittar ni prishantering för
            alla era tjänster.
          </p>

          <div className="space-y-3">
            <div className="bg-white border border-gray-200 rounded-lg p-4">
              <h4 className="font-semibold text-gray-800 mb-2">
                Priser - Hunddagis
              </h4>
              <p className="text-sm text-gray-600">
                Sätt priser för olika abonnemangstyper (1-5 dagar/vecka). Priset
                appliceras automatiskt när ni skapar fakturor.
              </p>
            </div>

            <div className="bg-white border border-gray-200 rounded-lg p-4">
              <h4 className="font-semibold text-gray-800 mb-2">
                Priser - Pensionat
              </h4>
              <p className="text-sm text-gray-600">
                Sätt pris per natt baserat på hundstorlek. Priserna syns för
                kunderna när de bokar och används vid fakturering.
              </p>
            </div>

            <div className="bg-white border border-gray-200 rounded-lg p-4">
              <h4 className="font-semibold text-gray-800 mb-2">
                Priser - Hundfrisör
              </h4>
              <p className="text-sm text-gray-600">
                Sätt priser för olika behandlingar och paket.
              </p>
            </div>
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h4 className="font-semibold text-blue-800 mb-2">Kundrabatter</h4>
            <p className="text-blue-700 text-sm">
              Under <strong>Kundrabatter</strong> kan ni lägga till rabatter för
              specifika kunder. Rabatten appliceras automatiskt på deras
              fakturor.
            </p>
          </div>
        </div>
      ),
    },
    {
      id: "rapporter",
      title: "Rapporter & Statistik",
      icon: <FileText className="w-5 h-5" />,
      content: (
        <div className="space-y-4">
          <p className="text-gray-700 leading-relaxed">
            Under <strong>Administration → Rapporter</strong> hittar ni
            statistik och möjlighet att exportera data.
          </p>

          <div className="grid md:grid-cols-2 gap-4">
            <div className="bg-white border border-gray-200 rounded-lg p-4">
              <h4 className="font-semibold text-gray-800 mb-3">
                Tillgängliga rapporter
              </h4>
              <ul className="space-y-2 text-sm text-gray-600">
                <li>• Intäktsrapport (per månad/år)</li>
                <li>• Beläggningsgrad för pensionat</li>
                <li>• Antal hundar per abonnemangstyp</li>
                <li>• Bokningsstatistik</li>
              </ul>
            </div>

            <div className="bg-white border border-gray-200 rounded-lg p-4">
              <h4 className="font-semibold text-gray-800 mb-3">Export</h4>
              <ul className="space-y-2 text-sm text-gray-600">
                <li>• Exportera kundlista till Excel</li>
                <li>• Exportera fakturor</li>
                <li>• Exportera bokningsdata</li>
              </ul>
            </div>
          </div>
        </div>
      ),
    },
    {
      id: "tips",
      title: "Tips & Vanliga frågor",
      icon: <HelpCircle className="w-5 h-5" />,
      content: (
        <div className="space-y-4">
          <div className="space-y-3">
            <div className="bg-white border border-gray-200 rounded-lg p-4">
              <h4 className="font-semibold text-gray-800 mb-2">
                Hur lägger jag till en ny dagishund?
              </h4>
              <p className="text-sm text-gray-600">
                Gå till <strong>Hunddagis</strong> och klicka på{" "}
                <strong>+ Ny hund</strong>. Fyll i uppgifter om hunden och
                ägaren, välj abonnemang och spara.
              </p>
            </div>

            <div className="bg-white border border-gray-200 rounded-lg p-4">
              <h4 className="font-semibold text-gray-800 mb-2">
                Hur godkänner jag en pensionatbokning?
              </h4>
              <p className="text-sm text-gray-600">
                Gå till <strong>Hundpensionat</strong>, klicka på bokningen och
                välj <strong>Godkänn</strong>. En förskottsfaktura skapas
                automatiskt.
              </p>
            </div>

            <div className="bg-white border border-gray-200 rounded-lg p-4">
              <h4 className="font-semibold text-gray-800 mb-2">
                Hur avslutar jag ett dagisabonnemang?
              </h4>
              <p className="text-sm text-gray-600">
                Öppna hundens profil under <strong>Hunddagis</strong> och sätt
                ett <strong>slutdatum</strong> på abonnemanget. Hunden flyttas
                då automatiskt till väntelistan efter det datumet.
              </p>
            </div>

            <div className="bg-white border border-gray-200 rounded-lg p-4">
              <h4 className="font-semibold text-gray-800 mb-2">
                Varför syns inte min hund i månadslistan?
              </h4>
              <p className="text-sm text-gray-600">
                Kontrollera att hunden har ett <strong>startdatum</strong> som
                är före eller under den valda månaden. Om hunden har ett
                slutdatum som passerat före månaden visas den inte.
              </p>
            </div>

            <div className="bg-white border border-gray-200 rounded-lg p-4">
              <h4 className="font-semibold text-gray-800 mb-2">
                Hur ändrar jag mina priser?
              </h4>
              <p className="text-sm text-gray-600">
                Gå till <strong>Administration</strong> och välj rätt
                priskategori (Dagis, Pensionat eller Frisör). Ändringarna träder
                i kraft omedelbart för nya bokningar/fakturor.
              </p>
            </div>
          </div>
        </div>
      ),
    },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="border-b border-gray-200 bg-white shadow-sm">
        <div className="max-w-4xl mx-auto px-6 py-6">
          <div className="flex items-center gap-2 text-sm text-gray-500 mb-4">
            <Link href="/admin" className="hover:text-[#2c7a4c]">
              Administration
            </Link>
            <ChevronRight className="w-4 h-4" />
            <span className="text-gray-700">Om DogPlanner</span>
          </div>
          <h1 className="text-[32px] font-bold text-[#2c7a4c] leading-tight">
            Om DogPlanner
          </h1>
          <p className="mt-2 text-base text-gray-600">
            Lär dig hur systemet fungerar och få ut det mesta av DogPlanner
          </p>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-6 py-8">
        {/* Quick Links */}
        <div className="bg-white border border-gray-200 rounded-lg p-4 mb-8">
          <h2 className="text-sm font-semibold text-gray-700 mb-3">
            Snabblänkar
          </h2>
          <div className="flex flex-wrap gap-2">
            {sections.map((section) => (
              <button
                key={section.id}
                onClick={() => {
                  setOpenSections([section.id]);
                  document.getElementById(section.id)?.scrollIntoView({
                    behavior: "smooth",
                    block: "start",
                  });
                }}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm bg-gray-100 hover:bg-[#2c7a4c] hover:text-white text-gray-700 rounded-full transition-colors"
              >
                {section.icon}
                {section.title}
              </button>
            ))}
          </div>
        </div>

        {/* Accordion Sections */}
        <div className="space-y-3">
          {sections.map((section) => (
            <div
              key={section.id}
              id={section.id}
              className="bg-white border border-gray-200 rounded-lg overflow-hidden"
            >
              <button
                onClick={() => toggleSection(section.id)}
                className="w-full px-5 py-4 flex items-center justify-between text-left hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <span className="text-[#2c7a4c]">{section.icon}</span>
                  <h3 className="text-lg font-semibold text-gray-800">
                    {section.title}
                  </h3>
                </div>
                <ChevronDown
                  className={`w-5 h-5 text-gray-400 transition-transform ${
                    openSections.includes(section.id) ? "rotate-180" : ""
                  }`}
                />
              </button>
              {openSections.includes(section.id) && (
                <div className="px-5 pb-5 border-t border-gray-100 pt-4">
                  {section.content}
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="mt-8 text-center">
          <p className="text-sm text-gray-500">
            Behöver du mer hjälp? Kontakta oss på{" "}
            <a
              href="mailto:support@dogplanner.se"
              className="text-[#2c7a4c] hover:underline"
            >
              support@dogplanner.se
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}
