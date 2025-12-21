"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  ChevronRight,
  Home,
  Calendar,
  Users,
  DollarSign,
  Settings,
  FileText,
  HelpCircle,
  PawPrint,
  Building2,
  Clock,
  CheckCircle,
  Scissors,
  MapPin,
  Mail,
  CreditCard,
  BarChart3,
  UserPlus,
  ClipboardList,
  Shield,
  Printer,
  Download,
  Eye,
  Edit,
  Search,
  Filter,
  Zap,
  Heart,
  Star,
} from "lucide-react";

export default function OmDogPlannerPage() {
  const [activeSection, setActiveSection] = useState<string | null>("start");

  const scrollToSection = (id: string) => {
    setActiveSection(id);
    document
      .getElementById(id)
      ?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="border-b border-gray-200 bg-white shadow-sm sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-6 py-5">
          <div className="flex items-center gap-2 text-sm text-gray-500 mb-3">
            <Link
              href="/admin"
              className="hover:text-[#2c7a4c] transition-colors"
            >
              Administration
            </Link>
            <ChevronRight className="w-4 h-4" />
            <span className="text-gray-700 font-medium">Om DogPlanner</span>
          </div>
          <h1 className="text-3xl font-bold text-[#2c7a4c]">
            Kom igång med DogPlanner
          </h1>
          <p className="mt-2 text-gray-600">
            En komplett guide till hur du använder systemet
          </p>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-6 py-8">
        {/* Navigation */}
        <nav className="bg-white border border-gray-200 rounded-xl p-4 mb-8 shadow-sm">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">
            Innehåll
          </p>
          <div className="flex flex-wrap gap-2">
            {[
              { id: "start", label: "Kom igång", icon: Home },
              { id: "dagis", label: "Hunddagis", icon: PawPrint },
              { id: "pensionat", label: "Hundpensionat", icon: Building2 },
              { id: "frisor", label: "Hundfrisör", icon: Scissors },
              { id: "kunder", label: "Kunder", icon: Users },
              { id: "ekonomi", label: "Ekonomi", icon: DollarSign },
              { id: "priser", label: "Priser", icon: CreditCard },
              { id: "rapporter", label: "Rapporter", icon: BarChart3 },
              { id: "installningar", label: "Inställningar", icon: Settings },
              { id: "faq", label: "Vanliga frågor", icon: HelpCircle },
            ].map((item) => (
              <button
                key={item.id}
                onClick={() => scrollToSection(item.id)}
                className={`inline-flex items-center gap-2 px-4 py-2 text-sm rounded-lg transition-all ${
                  activeSection === item.id
                    ? "bg-[#2c7a4c] text-white shadow-md"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}
              >
                <item.icon className="w-4 h-4" />
                {item.label}
              </button>
            ))}
          </div>
        </nav>

        {/* SEKTION: KOM IGÅNG */}
        <section id="start" className="mb-12 scroll-mt-32">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-12 h-12 bg-[#2c7a4c] rounded-xl flex items-center justify-center">
              <Home className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-900">
                Välkommen till DogPlanner
              </h2>
              <p className="text-gray-600">Ditt kompletta verksamhetssystem</p>
            </div>
          </div>

          <div className="bg-white border border-gray-200 rounded-xl p-6 mb-6">
            <p className="text-gray-700 leading-relaxed mb-6">
              DogPlanner är byggt för dig som driver hunddagis, hundpensionat
              eller hundfrisör. Systemet hjälper dig att hålla koll på alla
              hundar, bokningar, kunder och fakturor på ett och samma ställe.
            </p>

            <div className="grid md:grid-cols-3 gap-4">
              <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-2">
                  <PawPrint className="w-5 h-5 text-emerald-600" />
                  <h3 className="font-semibold text-emerald-800">Hunddagis</h3>
                </div>
                <p className="text-sm text-emerald-700">
                  Hantera dagishundar, abonnemang och veckodagar.
                </p>
              </div>
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Building2 className="w-5 h-5 text-blue-600" />
                  <h3 className="font-semibold text-blue-800">Hundpensionat</h3>
                </div>
                <p className="text-sm text-blue-700">
                  Bokningar, in-/utcheckning och automatiska fakturor.
                </p>
              </div>
              <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Scissors className="w-5 h-5 text-purple-600" />
                  <h3 className="font-semibold text-purple-800">Hundfrisör</h3>
                </div>
                <p className="text-sm text-purple-700">
                  Tidsbokning, kundregister och journalföring.
                </p>
              </div>
            </div>
          </div>

          <div className="bg-amber-50 border border-amber-200 rounded-xl p-5">
            <div className="flex gap-3">
              <Zap className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
              <div>
                <h4 className="font-semibold text-amber-800 mb-1">
                  Tips för att komma igång
                </h4>
                <ol className="text-sm text-amber-700 space-y-1 list-decimal list-inside">
                  <li>
                    Fyll i företagsinformation under{" "}
                    <strong>Företagsinformation</strong>
                  </li>
                  <li>
                    Sätt upp priser under{" "}
                    <strong>Administration → Priser</strong>
                  </li>
                  <li>
                    Lägg till rum under <strong>Administration → Rum</strong>
                  </li>
                  <li>Börja lägga till hundar och kunder!</li>
                </ol>
              </div>
            </div>
          </div>
        </section>

        {/* SEKTION: HUNDDAGIS */}
        <section id="dagis" className="mb-12 scroll-mt-32">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-12 h-12 bg-emerald-600 rounded-xl flex items-center justify-center">
              <PawPrint className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Hunddagis</h2>
              <p className="text-gray-600">
                Hantera dagishundar och abonnemang
              </p>
            </div>
          </div>

          <div className="space-y-6">
            <div className="bg-white border border-gray-200 rounded-xl p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <Eye className="w-5 h-5 text-[#2c7a4c]" />
                Översikt
              </h3>
              <p className="text-gray-700 mb-4">
                Under <strong>Hunddagis</strong> i menyn ser du alla hundar som
                är registrerade hos er.
              </p>
              <div className="grid md:grid-cols-2 gap-4">
                <div className="bg-gray-50 rounded-lg p-4">
                  <h4 className="font-medium text-gray-800 mb-2">Flikar</h4>
                  <ul className="text-sm text-gray-600 space-y-1">
                    <li>
                      <strong>Våra hundar</strong> – Hundar med aktivt
                      abonnemang
                    </li>
                    <li>
                      <strong>Väntelista</strong> – Hundar utan eller med
                      avslutat abonnemang
                    </li>
                  </ul>
                </div>
                <div className="bg-gray-50 rounded-lg p-4">
                  <h4 className="font-medium text-gray-800 mb-2">Funktioner</h4>
                  <ul className="text-sm text-gray-600 space-y-1">
                    <li>
                      <Search className="w-3 h-3 inline mr-1" /> Sök på
                      hundnamn, ägare, telefon
                    </li>
                    <li>
                      <Filter className="w-3 h-3 inline mr-1" /> Filtrera på
                      månad
                    </li>
                    <li>
                      <Download className="w-3 h-3 inline mr-1" /> Exportera
                      till PDF
                    </li>
                  </ul>
                </div>
              </div>
            </div>

            <div className="bg-white border border-gray-200 rounded-xl p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <UserPlus className="w-5 h-5 text-[#2c7a4c]" />
                Lägga till en ny hund
              </h3>
              <ol className="text-gray-700 space-y-3">
                {[
                  "Klicka på + Ny hund uppe till vänster",
                  "Fyll i hundens uppgifter: namn, ras, födelsedatum, kön",
                  "Fyll i ägarens uppgifter: namn, telefon, e-post, adress",
                  "Välj abonnemang (antal dagar/vecka) och veckodagar",
                  "Ange startdatum för när abonnemanget börjar",
                  "Klicka Spara",
                ].map((text, i) => (
                  <li key={i} className="flex gap-3">
                    <span className="flex-shrink-0 w-6 h-6 bg-[#2c7a4c] text-white rounded-full flex items-center justify-center text-sm font-medium">
                      {i + 1}
                    </span>
                    <span>{text}</span>
                  </li>
                ))}
              </ol>
            </div>

            <div className="bg-white border border-gray-200 rounded-xl p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <Calendar className="w-5 h-5 text-[#2c7a4c]" />
                Så fungerar abonnemang
              </h3>
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-2 font-medium text-gray-700">
                      Fält
                    </th>
                    <th className="text-left py-2 font-medium text-gray-700">
                      Beskrivning
                    </th>
                  </tr>
                </thead>
                <tbody className="text-gray-600">
                  <tr className="border-b border-gray-100">
                    <td className="py-2 font-medium">Abonnemangstyp</td>
                    <td className="py-2">1-5 dagar/vecka – styr priset</td>
                  </tr>
                  <tr className="border-b border-gray-100">
                    <td className="py-2 font-medium">Veckodagar</td>
                    <td className="py-2">
                      Vilka dagar hunden kommer (M T O T F)
                    </td>
                  </tr>
                  <tr className="border-b border-gray-100">
                    <td className="py-2 font-medium">Startdatum</td>
                    <td className="py-2">När abonnemanget börjar gälla</td>
                  </tr>
                  <tr>
                    <td className="py-2 font-medium">Slutdatum</td>
                    <td className="py-2">
                      Sätts när kunden säger upp (lämnas tomt annars)
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-xl p-5">
              <div className="flex gap-3">
                <Calendar className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-semibold text-blue-800 mb-2">
                    Månadsfiltret
                  </h4>
                  <p className="text-sm text-blue-700">
                    Visar hundar som var aktiva den valda månaden. En hund visas
                    om startdatum är före månadens slut OCH slutdatum är tomt
                    eller efter månadens början.
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-amber-50 border border-amber-200 rounded-xl p-5">
              <div className="flex gap-3">
                <Clock className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-semibold text-amber-800 mb-2">
                    Väntelistan
                  </h4>
                  <p className="text-sm text-amber-700 mb-2">
                    En hund hamnar på väntelistan om den:
                  </p>
                  <ul className="text-sm text-amber-700 list-disc list-inside space-y-1">
                    <li>Saknar abonnemang</li>
                    <li>Har ett abonnemang med passerat slutdatum</li>
                  </ul>
                </div>
              </div>
            </div>

            <div className="bg-white border border-gray-200 rounded-xl p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <Edit className="w-5 h-5 text-[#2c7a4c]" />
                Avsluta ett abonnemang
              </h3>
              <ol className="text-gray-700 space-y-2 list-decimal list-inside">
                <li>Klicka på hunden i listan</li>
                <li>Gå till abonnemangssektionen</li>
                <li>
                  Fyll i <strong>Slutdatum</strong> (sista dagen hunden ska gå)
                </li>
                <li>
                  Klicka <strong>Spara</strong>
                </li>
              </ol>
              <p className="text-sm text-gray-500 mt-3">
                Efter slutdatumet flyttas hunden till väntelistan.
              </p>
            </div>
          </div>
        </section>

        {/* SEKTION: HUNDPENSIONAT */}
        <section id="pensionat" className="mb-12 scroll-mt-32">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-12 h-12 bg-blue-600 rounded-xl flex items-center justify-center">
              <Building2 className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-900">
                Hundpensionat
              </h2>
              <p className="text-gray-600">Bokningar och rumshantering</p>
            </div>
          </div>

          <div className="space-y-6">
            <div className="bg-white border border-gray-200 rounded-xl p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <ClipboardList className="w-5 h-5 text-[#2c7a4c]" />
                Bokningsflödet
              </h3>
              <div className="flex flex-col md:flex-row gap-3">
                {[
                  { step: "1", title: "Kund bokar", desc: "Via kundportalen" },
                  { step: "2", title: "Ni godkänner", desc: "Eller avslår" },
                  { step: "3", title: "Faktura skapas", desc: "Automatiskt" },
                  {
                    step: "4",
                    title: "Incheckning",
                    desc: "När hunden kommer",
                  },
                  {
                    step: "5",
                    title: "Utcheckning",
                    desc: "Slutfaktura vid behov",
                  },
                ].map((item, i) => (
                  <div key={i} className="flex-1 relative">
                    <div className="bg-gray-50 rounded-lg p-4 text-center">
                      <div className="w-8 h-8 bg-[#2c7a4c] text-white rounded-full flex items-center justify-center text-sm font-bold mx-auto mb-2">
                        {item.step}
                      </div>
                      <p className="font-medium text-gray-800">{item.title}</p>
                      <p className="text-xs text-gray-500">{item.desc}</p>
                    </div>
                    {i < 4 && (
                      <ChevronRight className="hidden md:block absolute top-1/2 -right-3 transform -translate-y-1/2 w-5 h-5 text-gray-300" />
                    )}
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-white border border-gray-200 rounded-xl p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Bokningsstatus
              </h3>
              <div className="grid md:grid-cols-2 gap-3">
                {[
                  {
                    color: "yellow",
                    title: "Väntar på godkännande",
                    desc: "Ny bokning att hantera",
                  },
                  {
                    color: "green",
                    title: "Bekräftad",
                    desc: "Godkänd, väntar på incheckning",
                  },
                  {
                    color: "blue",
                    title: "Incheckad",
                    desc: "Hunden är hos er just nu",
                  },
                  {
                    color: "gray",
                    title: "Utcheckad",
                    desc: "Avslutad vistelse",
                  },
                ].map((item, i) => (
                  <div
                    key={i}
                    className={`flex items-center gap-3 p-3 bg-${item.color}-50 rounded-lg`}
                  >
                    <span
                      className={`w-4 h-4 rounded-full bg-${item.color}-400`}
                    ></span>
                    <div>
                      <p className="font-medium text-gray-800">{item.title}</p>
                      <p className="text-xs text-gray-500">{item.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-white border border-gray-200 rounded-xl p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <MapPin className="w-5 h-5 text-[#2c7a4c]" />
                Rum och platser
              </h3>
              <p className="text-gray-700 mb-4">
                Under <strong>Administration → Rum</strong> hanterar ni era rum.
              </p>
              <div className="bg-gray-50 rounded-lg p-4">
                <h4 className="font-medium text-gray-800 mb-2">
                  Varje rum har:
                </h4>
                <ul className="text-sm text-gray-600 space-y-1">
                  <li>
                    • <strong>Namn</strong> – T.ex. "Rum 1" eller "Sviten"
                  </li>
                  <li>
                    • <strong>Typ</strong> – Dagis, Pensionat eller Båda
                  </li>
                  <li>
                    • <strong>Storlek</strong> – Kvadratmeter
                  </li>
                  <li>
                    • <strong>Max antal hundar</strong>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </section>

        {/* SEKTION: HUNDFRISÖR */}
        <section id="frisor" className="mb-12 scroll-mt-32">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-12 h-12 bg-purple-600 rounded-xl flex items-center justify-center">
              <Scissors className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Hundfrisör</h2>
              <p className="text-gray-600">Bokningar och journalföring</p>
            </div>
          </div>

          <div className="bg-white border border-gray-200 rounded-xl p-6">
            <p className="text-gray-700 mb-4">
              Hundfrisörsmodulen hjälper dig hålla koll på bokningar och spara
              info om klippningar.
            </p>
            <div className="grid md:grid-cols-2 gap-4">
              <div className="bg-gray-50 rounded-lg p-4">
                <h4 className="font-medium text-gray-800 mb-2">
                  Dagens bokningar
                </h4>
                <p className="text-sm text-gray-600">
                  Se vilka hundar som ska klippas idag med tid och behandling.
                </p>
              </div>
              <div className="bg-gray-50 rounded-lg p-4">
                <h4 className="font-medium text-gray-800 mb-2">Journal</h4>
                <p className="text-sm text-gray-600">
                  Sök och se historik – klipplängd, behandling, anteckningar.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* SEKTION: KUNDER */}
        <section id="kunder" className="mb-12 scroll-mt-32">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-12 h-12 bg-orange-500 rounded-xl flex items-center justify-center">
              <Users className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-900">
                Kunder och ägare
              </h2>
              <p className="text-gray-600">Två typer av kundflöden</p>
            </div>
          </div>

          <div className="bg-white border border-gray-200 rounded-xl p-6">
            <div className="grid md:grid-cols-2 gap-6">
              <div className="border border-emerald-200 rounded-lg p-5 bg-emerald-50/50">
                <div className="flex items-center gap-2 mb-3">
                  <PawPrint className="w-5 h-5 text-emerald-600" />
                  <h3 className="font-semibold text-emerald-800">
                    Dagiskunder
                  </h3>
                </div>
                <ol className="text-sm text-emerald-700 space-y-2 list-decimal list-inside mb-4">
                  <li>Skickar intresseanmälan</li>
                  <li>
                    Ni granskar under <strong>Ansökningar</strong>
                  </li>
                  <li>Vid godkännande skapas kund + hund</li>
                  <li>Kunden kopplas till er organisation</li>
                </ol>
                <div className="text-xs text-emerald-600 bg-emerald-100 rounded px-2 py-1 inline-block">
                  Kundnummer: 101, 102, 103...
                </div>
              </div>

              <div className="border border-blue-200 rounded-lg p-5 bg-blue-50/50">
                <div className="flex items-center gap-2 mb-3">
                  <Building2 className="w-5 h-5 text-blue-600" />
                  <h3 className="font-semibold text-blue-800">
                    Pensionatkunder
                  </h3>
                </div>
                <ol className="text-sm text-blue-700 space-y-2 list-decimal list-inside mb-4">
                  <li>Registrerar sig i kundportalen</li>
                  <li>Väljer "Pensionat" som tjänst</li>
                  <li>Kan boka hos vilken organisation som helst</li>
                  <li>Loggar in för att se bokningar</li>
                </ol>
                <div className="text-xs text-blue-600 bg-blue-100 rounded px-2 py-1 inline-block">
                  Kundnummer: 10001, 10002...
                </div>
              </div>
            </div>
          </div>

          <div className="bg-gray-50 border border-gray-200 rounded-xl p-5 mt-6">
            <div className="flex gap-3">
              <Shield className="w-5 h-5 text-gray-600 flex-shrink-0 mt-0.5" />
              <div>
                <h4 className="font-semibold text-gray-800 mb-2">
                  Kundportalen
                </h4>
                <p className="text-sm text-gray-600">
                  Pensionatkunder har en egen portal där de kan se bokningar,
                  hantera hundar och avboka.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* SEKTION: EKONOMI */}
        <section id="ekonomi" className="mb-12 scroll-mt-32">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-12 h-12 bg-green-600 rounded-xl flex items-center justify-center">
              <DollarSign className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-900">
                Ekonomi och fakturering
              </h2>
              <p className="text-gray-600">Automatiska och manuella fakturor</p>
            </div>
          </div>

          <div className="space-y-6">
            <div className="bg-white border border-gray-200 rounded-xl p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Fakturor
              </h3>
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <h4 className="font-medium text-gray-800 mb-2">
                    Pensionatfakturor (automatiska)
                  </h4>
                  <ul className="text-sm text-gray-600 space-y-2">
                    <li className="flex gap-2">
                      <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0 mt-0.5" />
                      <span>
                        <strong>Förskottsfaktura</strong> – När bokning godkänns
                      </span>
                    </li>
                    <li className="flex gap-2">
                      <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0 mt-0.5" />
                      <span>
                        <strong>Slutfaktura</strong> – Vid utcheckning om det
                        finns extra
                      </span>
                    </li>
                  </ul>
                </div>
                <div>
                  <h4 className="font-medium text-gray-800 mb-2">
                    Dagisfakturor (manuella)
                  </h4>
                  <ul className="text-sm text-gray-600 space-y-2">
                    <li className="flex gap-2">
                      <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0 mt-0.5" />
                      <span>
                        Skapas månadsvis under <strong>Ekonomi</strong>
                      </span>
                    </li>
                    <li className="flex gap-2">
                      <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0 mt-0.5" />
                      <span>Baseras på hundens abonnemang</span>
                    </li>
                  </ul>
                </div>
              </div>
            </div>

            <div className="bg-white border border-gray-200 rounded-xl p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Fakturastatus
              </h3>
              <div className="grid sm:grid-cols-2 md:grid-cols-4 gap-3">
                <div className="bg-gray-100 rounded-lg p-3 text-center">
                  <p className="font-medium text-gray-700">Utkast</p>
                  <p className="text-xs text-gray-500">Kan redigeras</p>
                </div>
                <div className="bg-blue-100 rounded-lg p-3 text-center">
                  <p className="font-medium text-blue-700">Skickad</p>
                  <p className="text-xs text-blue-600">Väntar på betalning</p>
                </div>
                <div className="bg-green-100 rounded-lg p-3 text-center">
                  <p className="font-medium text-green-700">Betald</p>
                  <p className="text-xs text-green-600">Markerad som betald</p>
                </div>
                <div className="bg-red-100 rounded-lg p-3 text-center">
                  <p className="font-medium text-red-700">Förfallen</p>
                  <p className="text-xs text-red-600">Passerat förfallodatum</p>
                </div>
              </div>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-xl p-5">
              <div className="flex gap-3">
                <Printer className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-semibold text-blue-800 mb-2">
                    PDF och utskrift
                  </h4>
                  <p className="text-sm text-blue-700">
                    Varje faktura kan laddas ner som PDF med er logotyp och
                    företagsinformation.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* SEKTION: PRISER */}
        <section id="priser" className="mb-12 scroll-mt-32">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-12 h-12 bg-amber-500 rounded-xl flex items-center justify-center">
              <CreditCard className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-900">
                Prishantering
              </h2>
              <p className="text-gray-600">
                Konfigurera priser för alla tjänster
              </p>
            </div>
          </div>

          <div className="bg-white border border-gray-200 rounded-xl p-6 space-y-6">
            <p className="text-gray-700">
              Under <strong>Administration</strong> hittar du prishantering.
            </p>

            <div className="grid md:grid-cols-3 gap-4">
              <div className="border border-gray-200 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-2">
                  <PawPrint className="w-4 h-4 text-emerald-600" />
                  <h4 className="font-medium text-gray-800">Dagis</h4>
                </div>
                <p className="text-sm text-gray-600">
                  Pris per abonnemang (1-5 dagar/vecka)
                </p>
              </div>
              <div className="border border-gray-200 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Building2 className="w-4 h-4 text-blue-600" />
                  <h4 className="font-medium text-gray-800">Pensionat</h4>
                </div>
                <p className="text-sm text-gray-600">
                  Pris per natt + säsonger + specialdatum
                </p>
              </div>
              <div className="border border-gray-200 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Scissors className="w-4 h-4 text-purple-600" />
                  <h4 className="font-medium text-gray-800">Frisör</h4>
                </div>
                <p className="text-sm text-gray-600">Pris per behandling</p>
              </div>
            </div>

            <div className="bg-gray-50 rounded-lg p-5">
              <h4 className="font-medium text-gray-800 mb-3">
                Pensionatpriser - så fungerar det
              </h4>
              <div className="text-sm text-gray-600 space-y-2">
                <p>
                  <strong>1. Grundpris</strong> – Pris per natt för
                  liten/mellan/stor hund
                </p>
                <p>
                  <strong>2. Helgtillägg</strong> – Extra för fredag-söndag
                  (valfritt)
                </p>
                <p>
                  <strong>3. Specialdatum</strong> – Röda dagar, julhelg etc.
                </p>
                <p>
                  <strong>4. Säsonger</strong> – Sommar, vinter med
                  prismultiplikator
                </p>
              </div>
              <div className="mt-3 p-3 bg-white rounded border border-gray-200">
                <p className="text-xs text-gray-500 font-mono">
                  Slutpris = (Grundpris + Tillägg) × Säsongsmultiplikator
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* SEKTION: RAPPORTER */}
        <section id="rapporter" className="mb-12 scroll-mt-32">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-12 h-12 bg-indigo-600 rounded-xl flex items-center justify-center">
              <BarChart3 className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-900">
                Rapporter och statistik
              </h2>
              <p className="text-gray-600">Få överblick över din verksamhet</p>
            </div>
          </div>

          <div className="bg-white border border-gray-200 rounded-xl p-6">
            <p className="text-gray-700 mb-6">
              Under <strong>Administration → Rapporter</strong> hittar du
              statistik och export.
            </p>
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <h4 className="font-medium text-gray-800 mb-3">
                  Tillgängliga rapporter
                </h4>
                <ul className="text-sm text-gray-600 space-y-2">
                  <li className="flex gap-2">
                    <BarChart3 className="w-4 h-4 text-[#2c7a4c]" />{" "}
                    Intäktsrapport (per månad/år)
                  </li>
                  <li className="flex gap-2">
                    <BarChart3 className="w-4 h-4 text-[#2c7a4c]" />{" "}
                    Beläggningsgrad för pensionat
                  </li>
                  <li className="flex gap-2">
                    <BarChart3 className="w-4 h-4 text-[#2c7a4c]" /> Hundar per
                    abonnemangstyp
                  </li>
                  <li className="flex gap-2">
                    <BarChart3 className="w-4 h-4 text-[#2c7a4c]" />{" "}
                    Bokningsstatistik
                  </li>
                </ul>
              </div>
              <div>
                <h4 className="font-medium text-gray-800 mb-3">Export</h4>
                <ul className="text-sm text-gray-600 space-y-2">
                  <li className="flex gap-2">
                    <Download className="w-4 h-4 text-[#2c7a4c]" /> Kundlista
                    till Excel
                  </li>
                  <li className="flex gap-2">
                    <Download className="w-4 h-4 text-[#2c7a4c]" /> Fakturor
                  </li>
                  <li className="flex gap-2">
                    <Download className="w-4 h-4 text-[#2c7a4c]" /> Bokningsdata
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </section>

        {/* SEKTION: INSTÄLLNINGAR */}
        <section id="installningar" className="mb-12 scroll-mt-32">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-12 h-12 bg-gray-600 rounded-xl flex items-center justify-center">
              <Settings className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-900">
                Inställningar
              </h2>
              <p className="text-gray-600">Konfigurera ditt företag</p>
            </div>
          </div>

          <div className="bg-white border border-gray-200 rounded-xl p-6 space-y-4">
            <div className="grid md:grid-cols-2 gap-4">
              <Link
                href="/foretagsinformation"
                className="block border border-gray-200 rounded-lg p-4 hover:border-[#2c7a4c] transition-colors"
              >
                <div className="flex items-center gap-2 mb-2">
                  <Building2 className="w-4 h-4 text-[#2c7a4c]" />
                  <h4 className="font-medium text-gray-800">
                    Företagsinformation
                  </h4>
                </div>
                <p className="text-sm text-gray-600">
                  Namn, adress, organisationsnummer
                </p>
              </Link>
              <Link
                href="/admin/tjanster"
                className="block border border-gray-200 rounded-lg p-4 hover:border-[#2c7a4c] transition-colors"
              >
                <div className="flex items-center gap-2 mb-2">
                  <Star className="w-4 h-4 text-[#2c7a4c]" />
                  <h4 className="font-medium text-gray-800">
                    Aktivera tjänster
                  </h4>
                </div>
                <p className="text-sm text-gray-600">
                  Välj moduler (dagis, pensionat, frisör)
                </p>
              </Link>
              <Link
                href="/admin/users"
                className="block border border-gray-200 rounded-lg p-4 hover:border-[#2c7a4c] transition-colors"
              >
                <div className="flex items-center gap-2 mb-2">
                  <Users className="w-4 h-4 text-[#2c7a4c]" />
                  <h4 className="font-medium text-gray-800">Användare</h4>
                </div>
                <p className="text-sm text-gray-600">
                  Lägg till kollegor, hantera behörigheter
                </p>
              </Link>
              <Link
                href="/admin/abonnemang"
                className="block border border-gray-200 rounded-lg p-4 hover:border-[#2c7a4c] transition-colors"
              >
                <div className="flex items-center gap-2 mb-2">
                  <CreditCard className="w-4 h-4 text-[#2c7a4c]" />
                  <h4 className="font-medium text-gray-800">
                    Ditt DogPlanner-abonnemang
                  </h4>
                </div>
                <p className="text-sm text-gray-600">
                  Se och hantera ditt abonnemang
                </p>
              </Link>
            </div>
          </div>
        </section>

        {/* SEKTION: FAQ */}
        <section id="faq" className="mb-12 scroll-mt-32">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-12 h-12 bg-pink-500 rounded-xl flex items-center justify-center">
              <HelpCircle className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-900">
                Vanliga frågor
              </h2>
              <p className="text-gray-600">
                Snabba svar på vanliga funderingar
              </p>
            </div>
          </div>

          <div className="space-y-4">
            {[
              {
                q: "Hur lägger jag till en ny dagishund?",
                a: "Gå till Hunddagis och klicka på '+ Ny hund'. Fyll i uppgifter, välj abonnemang och spara.",
              },
              {
                q: "Hur godkänner jag en pensionatbokning?",
                a: "Gå till Hundpensionat, klicka på bokningen och välj 'Godkänn'. Förskottsfaktura skapas automatiskt.",
              },
              {
                q: "Hur avslutar jag ett dagisabonnemang?",
                a: "Öppna hundens profil och sätt ett slutdatum. Hunden flyttas till väntelistan efter det datumet.",
              },
              {
                q: "Varför syns inte hunden i månadslistan?",
                a: "Kontrollera att startdatum är före månaden och slutdatum är tomt eller efter månadens början.",
              },
              {
                q: "Hur ändrar jag priser?",
                a: "Gå till Administration och välj rätt priskategori. Ändringar gäller direkt för nya bokningar.",
              },
              {
                q: "Hur skickar jag en faktura?",
                a: "Gå till Ekonomi, hitta fakturan, klicka på den och välj 'Skicka'. Kan även laddas ner som PDF.",
              },
              {
                q: "Kan kunder boka själva?",
                a: "Ja, pensionatkunder bokar via kundportalen. Dagiskunder skickar intresseanmälan som ni godkänner.",
              },
              {
                q: "Hur ser jag dagens hundar?",
                a: "Under 'Dagens' i menyn ser du alla hundar som ska vara på dagis eller checkas in/ut idag.",
              },
            ].map((item, i) => (
              <div
                key={i}
                className="bg-white border border-gray-200 rounded-xl p-5"
              >
                <h4 className="font-semibold text-gray-900 mb-2">{item.q}</h4>
                <p className="text-gray-600 text-sm">{item.a}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Footer */}
        <div className="bg-[#2c7a4c] rounded-xl p-6 text-center text-white">
          <Heart className="w-8 h-8 mx-auto mb-3 opacity-80" />
          <h3 className="text-lg font-semibold mb-2">Behöver du mer hjälp?</h3>
          <p className="text-white/80 mb-4">Vi finns här för dig!</p>
          <a
            href="mailto:support@dogplanner.se"
            className="inline-flex items-center gap-2 bg-white text-[#2c7a4c] px-5 py-2 rounded-lg font-medium hover:bg-gray-100 transition-colors"
          >
            <Mail className="w-4 h-4" />
            support@dogplanner.se
          </a>
        </div>
      </div>
    </div>
  );
}
