"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { SWEDISH_LAN, KOMMUNER_BY_LAN } from "@/lib/swedishLocations";

export default function RegisterCompanyPage() {
  const router = useRouter();

  // Form state
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [orgName, setOrgName] = useState("");
  const [orgNumber, setOrgNumber] = useState("");
  const [password, setPassword] = useState("");
  const [acceptedTerms, setAcceptedTerms] = useState(false);

  // Nya fält för location + service type
  const [lan, setLan] = useState("");
  const [kommun, setKommun] = useState("");
  const [serviceType, setServiceType] = useState<string[]>([]);

  // UI state
  const [submitting, setSubmitting] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErr(null);

    const supabase = createClient();
    if (!supabase) {
      setErr("Databaskoppling saknas");
      return;
    }

    if (!firstName.trim()) return setErr("Förnamn är obligatoriskt.");
    if (!lastName.trim()) return setErr("Efternamn är obligatoriskt.");
    if (!email.trim()) return setErr("E-post är obligatoriskt.");
    if (!phone.trim()) return setErr("Telefonnummer är obligatoriskt.");
    if (!orgName.trim()) return setErr("Företagsnamn är obligatoriskt.");
    if (!orgNumber.trim())
      return setErr("Organisationsnummer är obligatoriskt.");
    if (!lan.trim()) return setErr("Välj län.");
    if (!kommun.trim()) return setErr("Välj kommun.");
    if (serviceType.length === 0) return setErr("Välj minst en tjänstetyp.");
    if (!password.trim() || password.length < 6)
      return setErr("Välj ett lösenord med minst 6 tecken.");
    if (!acceptedTerms)
      return setErr("Du måste godkänna våra villkor för att fortsätta.");

    setSubmitting(true);
    try {
      const fullName = `${firstName.trim()} ${lastName.trim()}`;

      // 🟢 Skapa användaren i Supabase med enabled_services
      const { error } = await supabase.auth.signUp({
        email: email.trim(),
        password,
        options: {
          data: {
            full_name: fullName,
            phone: phone.trim(),
            org_name: orgName.trim(),
            org_number: orgNumber.trim(),
            lan: lan.trim(),
            kommun: kommun.trim(),
            enabled_services: serviceType, // Array: ['daycare', 'boarding', 'grooming']
          },
          // Efter bekräftelse skickas användaren till /login
          emailRedirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/login`,
        },
      });

      if (error) throw error;

      // ✅ Skicka till "tack"-sidan
      router.push("/register/success");
    } catch (e: any) {
      setErr(e?.message || "Ett oväntat fel inträffade.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="min-h-screen bg-gray-50 py-12 px-4">
      {/* Header med logo och tillbaka-länk */}
      <div className="max-w-4xl mx-auto mb-8">
        <Link
          href="/"
          className="inline-flex items-center text-gray-600 hover:text-[#2c7a4c] transition-colors text-sm font-medium mb-4"
        >
          ← Tillbaka till startsidan
        </Link>
      </div>

      <div className="max-w-4xl mx-auto">
        {/* Hero Section */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-[#2c7a4c] rounded-xl mb-4 shadow-lg">
            <span className="text-3xl">🐾</span>
          </div>
          <h1 className="text-4xl font-bold text-gray-900 mb-3">
            Registrera ditt hundföretag
          </h1>
          <p className="text-xl text-gray-600 mb-2">
            Professionellt bokningssystem för hunddagis, hundpensionat och
            hundfrisörer
          </p>
          <p className="text-sm text-gray-500">
            Är du hundägare?{" "}
            <Link
              href="/kundportal/registrera"
              className="text-[#2c7a4c] hover:underline font-semibold"
            >
              Skapa kundkonto här →
            </Link>
          </p>
        </div>

        {/* Trust Indicators */}
        <div className="grid grid-cols-3 gap-6 mb-12 max-w-2xl mx-auto">
          <div className="text-center">
            <div className="text-3xl mb-2">✓</div>
            <div className="text-sm font-semibold text-gray-900">
              GDPR-säkert
            </div>
            <div className="text-xs text-gray-500">100% Svenskt</div>
          </div>
          <div className="text-center">
            <div className="text-3xl mb-2">⚡</div>
            <div className="text-sm font-semibold text-gray-900">
              Snabbstart
            </div>
            <div className="text-xs text-gray-500">Live på 10 min</div>
          </div>
          <div className="text-center">
            <div className="text-3xl mb-2">💚</div>
            <div className="text-sm font-semibold text-gray-900">Support</div>
            <div className="text-xs text-gray-500">På svenska</div>
          </div>
        </div>

        {/* Main Container - Two Column Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* LEFT: Pricing/Benefits */}
          <div className="space-y-6">
            {/* Free Trial Banner */}
            <div className="bg-gradient-to-br from-emerald-500 to-[#2c7a4c] text-white rounded-2xl p-8 shadow-xl">
              <div className="flex items-center gap-3 mb-4">
                <span className="text-4xl">🎉</span>
                <div>
                  <div className="text-2xl font-bold">2 månader gratis</div>
                  <div className="text-emerald-100 text-sm">
                    Inget betalkort krävs • Avsluta när du vill
                  </div>
                </div>
              </div>
              <div className="bg-white/10 backdrop-blur rounded-lg p-4 mt-4">
                <div className="text-sm text-emerald-100 mb-2">
                  ✓ Fullständig tillgång till alla funktioner
                </div>
                <div className="text-sm text-emerald-100 mb-2">
                  ✓ Obegränsat antal bokningar
                </div>
                <div className="text-sm text-emerald-100">
                  ✓ Ingen uppsägningstid
                </div>
              </div>
            </div>

            {/* Pricing Cards */}
            <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-6">
              <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                <span>💰</span> Transparenta priser
              </h3>

              <div className="space-y-3">
                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border border-gray-200">
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">✂️</span>
                    <div>
                      <div className="font-semibold text-gray-900">
                        Hundfrisör
                      </div>
                      <div className="text-xs text-gray-500">
                        Bokningar & behandlingar
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-bold text-[#2c7a4c]">199</div>
                    <div className="text-xs text-gray-500">kr/mån</div>
                  </div>
                </div>

                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border border-gray-200">
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">🐕</span>
                    <div>
                      <div className="font-semibold text-gray-900">
                        Hunddagis
                      </div>
                      <div className="text-xs text-gray-500">
                        Daglig verksamhet
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-bold text-[#2c7a4c]">399</div>
                    <div className="text-xs text-gray-500">kr/mån</div>
                  </div>
                </div>

                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border border-gray-200">
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">🏨</span>
                    <div>
                      <div className="font-semibold text-gray-900">
                        Hundpensionat
                      </div>
                      <div className="text-xs text-gray-500">
                        Övernattningar
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-bold text-[#2c7a4c]">399</div>
                    <div className="text-xs text-gray-500">kr/mån</div>
                  </div>
                </div>

                <div className="border-t-2 border-gray-200 pt-3 mt-4">
                  <div className="flex items-center justify-between p-4 bg-amber-50 rounded-lg border-2 border-amber-400">
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">🏆</span>
                      <div>
                        <div className="font-bold text-gray-900">
                          Alla tjänster
                        </div>
                        <div className="text-xs text-amber-700 font-semibold">
                          Spara 398 kr/mån
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-2xl font-bold text-[#2c7a4c]">
                        799
                      </div>
                      <div className="text-xs text-gray-500">kr/mån</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Features List */}
            <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-6">
              <h3 className="text-lg font-bold text-gray-900 mb-4">
                Vad ingår?
              </h3>
              <div className="space-y-3 text-sm">
                <div className="flex items-start gap-3">
                  <span className="text-green-600 mt-0.5">✓</span>
                  <div>
                    <div className="font-semibold text-gray-900">
                      Onlinebokning för kunder
                    </div>
                    <div className="text-xs text-gray-500">
                      Automatiserad bokningshantering 24/7
                    </div>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <span className="text-green-600 mt-0.5">✓</span>
                  <div>
                    <div className="font-semibold text-gray-900">
                      Kalender & schema
                    </div>
                    <div className="text-xs text-gray-500">
                      Översikt över alla bokningar
                    </div>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <span className="text-green-600 mt-0.5">✓</span>
                  <div>
                    <div className="font-semibold text-gray-900">
                      Kundregister
                    </div>
                    <div className="text-xs text-gray-500">
                      Spara alla hundägar- och hunduppgifter
                    </div>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <span className="text-green-600 mt-0.5">✓</span>
                  <div>
                    <div className="font-semibold text-gray-900">
                      Fakturering
                    </div>
                    <div className="text-xs text-gray-500">
                      Automatisk fakturahantering
                    </div>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <span className="text-green-600 mt-0.5">✓</span>
                  <div>
                    <div className="font-semibold text-gray-900">
                      Statistik & rapporter
                    </div>
                    <div className="text-xs text-gray-500">
                      Följ upp din verksamhet
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* RIGHT: Registration Form */}
          <div className="bg-white rounded-2xl shadow-xl border border-gray-200 p-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">
              Kom igång idag
            </h2>

            {err && (
              <div className="mb-6 rounded-lg border-l-4 border-red-500 bg-red-50 px-4 py-3 text-sm">
                <div className="flex items-center gap-2">
                  <span className="text-red-600 font-bold">⚠️</span>
                  <span className="text-red-700">{err}</span>
                </div>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Förnamn */}
              <div>
                <label className="block text-sm font-semibold mb-2 text-gray-900">
                  Förnamn
                </label>
                <input
                  type="text"
                  className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-[#2c7a4c] focus:border-transparent bg-white text-base"
                  placeholder="Ditt förnamn"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  required
                />
              </div>

              {/* Efternamn */}
              <div>
                <label className="block text-sm font-semibold mb-2 text-gray-900">
                  Efternamn
                </label>
                <input
                  type="text"
                  className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-[#2c7a4c] focus:border-transparent bg-white text-base"
                  placeholder="Ditt efternamn"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  required
                />
              </div>

              {/* E-post */}
              <div>
                <label className="block text-sm font-semibold mb-2 text-gray-900">
                  E-post
                </label>
                <input
                  type="email"
                  className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-[#2c7a4c] focus:border-transparent bg-white text-base"
                  placeholder="din@email.se"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>

              {/* Telefonnummer */}
              <div>
                <label className="block text-sm font-semibold mb-2 text-gray-900">
                  Telefonnummer
                </label>
                <input
                  type="tel"
                  className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-[#2c7a4c] focus:border-transparent bg-white text-base"
                  placeholder="070-123 45 67"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  required
                />
              </div>

              {/* Företagets namn */}
              <div>
                <label className="block text-sm font-semibold mb-2 text-gray-900">
                  Företagets namn
                </label>
                <input
                  type="text"
                  className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-[#2c7a4c] focus:border-transparent bg-white text-base"
                  placeholder="Ditt företag AB"
                  value={orgName}
                  onChange={(e) => setOrgName(e.target.value)}
                  required
                />
              </div>

              {/* Organisationsnummer */}
              <div>
                <label className="block text-sm font-semibold mb-2 text-gray-900">
                  Organisationsnummer
                </label>
                <input
                  type="text"
                  className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-[#2c7a4c] focus:border-transparent bg-white text-base"
                  placeholder="123456-7890"
                  value={orgNumber}
                  onChange={(e) => setOrgNumber(e.target.value)}
                  required
                />
              </div>

              {/* Län */}
              <div>
                <label className="block text-sm font-semibold mb-2 text-gray-900">
                  Län <span className="text-red-500">*</span>
                </label>
                <select
                  className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-[#2c7a4c] focus:border-transparent bg-white text-base"
                  value={lan}
                  onChange={(e) => {
                    setLan(e.target.value);
                    setKommun(""); // Reset kommun when län changes
                  }}
                  required
                >
                  <option value="">Välj län...</option>
                  {SWEDISH_LAN.map((l) => (
                    <option key={l} value={l}>
                      {l}
                    </option>
                  ))}
                </select>
                <p className="text-xs text-gray-500 mt-1">
                  Detta hjälper kunder hitta er via lokalsökning
                </p>
              </div>

              {/* Kommun */}
              <div>
                <label className="block text-sm font-semibold mb-2 text-gray-900">
                  Kommun <span className="text-red-500">*</span>
                </label>
                <select
                  className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-[#2c7a4c] focus:border-transparent bg-white text-base disabled:bg-gray-100 disabled:cursor-not-allowed"
                  value={kommun}
                  onChange={(e) => setKommun(e.target.value)}
                  disabled={!lan}
                  required
                >
                  <option value="">
                    {lan ? "Välj kommun..." : "Välj län först..."}
                  </option>
                  {lan &&
                    KOMMUNER_BY_LAN[lan]?.map((k) => (
                      <option key={k} value={k}>
                        {k}
                      </option>
                    ))}
                </select>
              </div>

              {/* Tjänstetyper */}
              <div>
                <label className="block text-sm font-semibold mb-2 text-gray-900">
                  Vilka tjänster erbjuder ni?{" "}
                  <span className="text-red-500">*</span>
                </label>
                <p className="text-xs text-gray-600 mb-3">
                  Välj de tjänster ditt företag erbjuder. Du kan ändra detta
                  senare under Admin → Tjänsteinställningar.
                </p>
                <div className="space-y-2">
                  <label className="flex items-start gap-3 p-4 border-2 border-gray-300 rounded-lg hover:bg-gray-50 cursor-pointer transition">
                    <input
                      type="checkbox"
                      checked={serviceType.includes("daycare")}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setServiceType([...serviceType, "daycare"]);
                        } else {
                          setServiceType(
                            serviceType.filter((t) => t !== "daycare")
                          );
                        }
                      }}
                      className="mt-1 w-5 h-5 text-[#2c7a4c] focus:ring-[#2c7a4c] rounded"
                    />
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-xl">🐕</span>
                        <span className="font-bold text-gray-900">
                          Hunddagis
                        </span>
                        <span className="ml-auto text-sm font-semibold text-[#2c7a4c]">
                          399 kr/mån
                        </span>
                      </div>
                      <p className="text-xs text-gray-600 leading-relaxed">
                        Dagisverksamhet med schema, närvarohantering,
                        rumstilldelning och fakturaunderlag
                      </p>
                    </div>
                  </label>

                  <label className="flex items-start gap-3 p-4 border-2 border-gray-300 rounded-lg hover:bg-gray-50 cursor-pointer transition">
                    <input
                      type="checkbox"
                      checked={serviceType.includes("boarding")}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setServiceType([...serviceType, "boarding"]);
                        } else {
                          setServiceType(
                            serviceType.filter((t) => t !== "boarding")
                          );
                        }
                      }}
                      className="mt-1 w-5 h-5 text-[#2c7a4c] focus:ring-[#2c7a4c] rounded"
                    />
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-xl">🏨</span>
                        <span className="font-bold text-gray-900">
                          Hundpensionat
                        </span>
                        <span className="ml-auto text-sm font-semibold text-[#2c7a4c]">
                          399 kr/mån
                        </span>
                      </div>
                      <p className="text-xs text-gray-600 leading-relaxed">
                        Bokningssystem med kalender, in-/utcheckning,
                        rumhantering och fakturaunderlag
                      </p>
                    </div>
                  </label>

                  <label className="flex items-start gap-3 p-4 border-2 border-gray-300 rounded-lg hover:bg-gray-50 cursor-pointer transition">
                    <input
                      type="checkbox"
                      checked={serviceType.includes("grooming")}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setServiceType([...serviceType, "grooming"]);
                        } else {
                          setServiceType(
                            serviceType.filter((t) => t !== "grooming")
                          );
                        }
                      }}
                      className="mt-1 w-5 h-5 text-[#2c7a4c] focus:ring-[#2c7a4c] rounded"
                    />
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-xl">✂️</span>
                        <span className="font-bold text-gray-900">
                          Hundfrisör
                        </span>
                        <span className="ml-auto text-sm font-semibold text-[#2c7a4c]">
                          199 kr/mån
                        </span>
                      </div>
                      <p className="text-xs text-gray-600 leading-relaxed">
                        Bokningssystem för trimning med 22+ behandlingstyper,
                        prissättning och kalender
                      </p>
                    </div>
                  </label>
                </div>

                {/* Prisberäkning */}
                {serviceType.length > 0 && (
                  <div className="mt-4 p-5 bg-white border-2 border-[#2c7a4c] rounded-lg shadow-sm">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-semibold text-gray-800">
                        Ditt månadspris:
                      </span>
                      <span className="text-3xl font-bold text-[#2c7a4c]">
                        {serviceType.length === 1
                          ? serviceType.includes("grooming")
                            ? "199"
                            : "399"
                          : serviceType.length === 2
                            ? "599"
                            : "799"}{" "}
                        kr
                      </span>
                    </div>
                    {serviceType.length >= 2 && (
                      <div className="pt-3 border-t border-gray-200">
                        <p className="text-sm text-emerald-700 font-semibold text-center flex items-center justify-center gap-2">
                          <span className="text-lg">✨</span>
                          Du sparar{" "}
                          {serviceType.length === 2
                            ? "199 kr/mån"
                            : "398 kr/mån"}{" "}
                          med paketpris!
                        </p>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Lösenord */}
              <div>
                <label className="block text-sm font-semibold mb-2 text-gray-900">
                  Lösenord
                </label>
                <input
                  type="password"
                  className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-[#2c7a4c] focus:border-transparent bg-white text-base"
                  placeholder="Minst 6 tecken"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>

              {/* Villkor */}
              <div className="mt-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
                <div className="flex items-start gap-3">
                  <input
                    type="checkbox"
                    id="terms"
                    checked={acceptedTerms}
                    onChange={(e) => setAcceptedTerms(e.target.checked)}
                    className="mt-1 w-5 h-5 text-[#2c7a4c] focus:ring-[#2c7a4c] rounded"
                    required
                  />
                  <label htmlFor="terms" className="text-sm text-gray-700">
                    Jag godkänner DogPlanners{" "}
                    <Link
                      href="/legal/terms-business"
                      target="_blank"
                      className="text-[#2c7a4c] font-semibold hover:underline"
                    >
                      allmänna villkor för företagskunder
                    </Link>
                    ,{" "}
                    <Link
                      href="/legal/privacy-policy-business"
                      target="_blank"
                      className="text-[#2c7a4c] font-semibold hover:underline"
                    >
                      integritetspolicy
                    </Link>{" "}
                    och{" "}
                    <Link
                      href="/legal/pub-agreement"
                      target="_blank"
                      className="text-[#2c7a4c] font-semibold hover:underline"
                    >
                      personuppgiftsbiträdesavtal (PUB)
                    </Link>
                    .
                  </label>
                </div>
                <p className="text-xs text-gray-500 mt-2 ml-8">
                  Dessa dokument beskriver hur DogPlanner fungerar, vilka
                  abonnemangsvillkor som gäller och hur vi hanterar
                  personuppgifter.
                </p>
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="w-full bg-[#2c7a4c] hover:bg-[#236139] text-white font-semibold py-4 rounded-lg text-base shadow-lg hover:shadow-xl transition-all disabled:opacity-60 disabled:cursor-not-allowed font-bold"
              >
                {submitting
                  ? "Skapar ditt konto…"
                  : "Starta din gratis period →"}
              </button>

              <p className="text-center text-xs text-gray-500 mt-3">
                Genom att skapa konto godkänner du våra villkor
              </p>

              <div className="mt-6 pt-6 border-t border-gray-200 text-center">
                <p className="text-sm text-gray-600">
                  Har du redan konto?{" "}
                  <Link
                    href="/login"
                    className="text-[#2c7a4c] font-semibold hover:underline"
                  >
                    Logga in här
                  </Link>
                </p>
              </div>
            </form>
          </div>
        </div>
      </div>
    </main>
  );
}
