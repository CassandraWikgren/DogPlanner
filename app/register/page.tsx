"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabase";
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
    <main className="min-h-screen bg-gradient-to-br from-green-50 to-white flex items-center justify-center px-4 py-10">
      <div className="w-full max-w-2xl bg-white rounded-2xl shadow-lg p-8 border border-gray-200">
        <h1 className="text-3xl font-bold text-[#2c7a4c] text-center mb-2">
          Registrera ditt hundföretag
        </h1>
        <p className="text-center text-gray-600 text-sm mb-2">
          För hunddagis, hundpensionat och hundfrisörer
        </p>
        <p className="text-center text-xs text-gray-500 mb-6 pb-4 border-b">
          Är du hundägare?{" "}
          <Link
            href="/kundportal/registrera"
            className="text-[#2c7a4c] hover:underline font-medium"
          >
            Skapa kundkonto här
          </Link>
        </p>

        {/* 💰 PRISSÄTTNING - NY SEKTION */}
        <div className="mb-8 bg-gradient-to-br from-green-50 to-emerald-50 border-2 border-[#2c7a4c] rounded-xl p-6 shadow-sm">
          <div className="bg-white border-2 border-[#2c7a4c] rounded-lg p-5 mb-5 text-center shadow-sm">
            <div className="text-4xl mb-2">✨</div>
            <h2 className="text-2xl font-bold mb-2 text-[#2c7a4c]">
              Prova gratis i 2 månader
            </h2>
            <p className="text-sm text-gray-600 font-medium">
              Inget betalkort krävs vid registrering • Avsluta när du vill
            </p>
          </div>

          <p className="text-sm text-center mb-5 text-gray-700 font-semibold">
            Välj de tjänster du behöver - betala endast för det du använder
          </p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            <div className="bg-white rounded-lg p-5 text-center border-2 border-gray-200 hover:border-[#2c7a4c] hover:shadow-md transition-all">
              <div className="text-4xl mb-3">✂️</div>
              <div className="font-bold text-3xl text-[#2c7a4c] mb-1">
                199 kr
              </div>
              <div className="text-sm text-gray-500 mb-2">/månad</div>
              <div className="text-sm font-semibold text-gray-800">
                Endast Hundfrisör
              </div>
            </div>
            <div className="bg-white rounded-lg p-5 text-center border-2 border-gray-200 hover:border-[#2c7a4c] hover:shadow-md transition-all">
              <div className="text-4xl mb-3">🐕</div>
              <div className="font-bold text-3xl text-[#2c7a4c] mb-1">
                399 kr
              </div>
              <div className="text-sm text-gray-500 mb-2">/månad</div>
              <div className="text-sm font-semibold text-gray-800">
                Endast Hunddagis
              </div>
            </div>
            <div className="bg-white rounded-lg p-5 text-center border-2 border-gray-200 hover:border-[#2c7a4c] hover:shadow-md transition-all">
              <div className="text-4xl mb-3">🏨</div>
              <div className="font-bold text-3xl text-[#2c7a4c] mb-1">
                399 kr
              </div>
              <div className="text-sm text-gray-500 mb-2">/månad</div>
              <div className="text-sm font-semibold text-gray-800">
                Endast Hundpensionat
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-white rounded-lg p-5 text-center border-2 border-gray-200 hover:border-[#2c7a4c] hover:shadow-md transition-all">
              <div className="font-bold text-3xl text-[#2c7a4c] mb-1">
                599 kr
              </div>
              <div className="text-sm text-gray-500 mb-2">/månad</div>
              <div className="text-sm font-semibold text-gray-800">
                Två valfria tjänster
              </div>
            </div>
            <div className="bg-gradient-to-br from-amber-50 to-yellow-50 rounded-lg p-5 text-center border-2 border-amber-400 shadow-md relative hover:shadow-lg transition-all">
              <div className="absolute -top-3 left-1/2 transform -translate-x-1/2 bg-amber-400 text-gray-900 text-xs font-bold px-4 py-1.5 rounded-full shadow-sm">
                🏆 BÄST VÄRDE
              </div>
              <div className="font-bold text-3xl text-[#2c7a4c] mt-2 mb-1">
                799 kr
              </div>
              <div className="text-sm text-gray-500 mb-2">/månad</div>
              <div className="text-sm font-semibold text-gray-800">
                Alla tre tjänster
              </div>
            </div>
          </div>
        </div>

        {err && (
          <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-red-700 text-sm">
            {err}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5 mt-6">
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
              Välj de tjänster ditt företag erbjuder. Du kan ändra detta senare
              under Admin → Tjänsteinställningar.
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
                    <span className="font-bold text-gray-900">Hunddagis</span>
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
                    Bokningssystem med kalender, in-/utcheckning, rumhantering
                    och fakturaunderlag
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
                    <span className="font-bold text-gray-900">Hundfrisör</span>
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
              abonnemangsvillkor som gäller och hur vi hanterar personuppgifter.
            </p>
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="w-full bg-[#2c7a4c] hover:bg-[#236139] text-white font-semibold py-3 rounded-lg text-base shadow-sm transition disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {submitting ? "Skapar konto…" : "Skapa konto"}
          </button>

          <p className="text-center text-sm text-gray-600 mt-4">
            Har du redan konto?{" "}
            <Link
              href="/login"
              className="text-[#2c7a4c] font-semibold hover:underline hover:text-[#236139]"
            >
              Logga in
            </Link>
          </p>
        </form>
      </div>
    </main>
  );
}
